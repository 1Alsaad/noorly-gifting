#!/usr/bin/env python3
"""Host-only, encrypted paired backup of the stopped eve writer and PostgreSQL 17.

Requires Python 3, Docker Compose and age on Linux. Never mount a Docker socket
inside the operations container. The destination must be copied off-host separately.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import signal
import tarfile
import tempfile
from datetime import datetime, timezone
from uuid import uuid4


OPERATIONS = Path(__file__).resolve().parent.parent
COMPOSE = [
    "docker", "compose", "--env-file", str(OPERATIONS / "deploy/runtime.env"),
    "-f", str(OPERATIONS / "deploy/compose.yaml"),
]


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def paired_backup(destination, recipient, run=subprocess.run):
    """Caller holds the host lock. No plaintext is published outside private scratch."""
    destination = Path(destination).resolve(strict=True)
    if not destination.is_dir():
        raise ValueError("Backup destination must be an existing directory")

    def command(args, **kwargs):
        return run(args, check=True, timeout=300, **kwargs)

    def read(args):
        return command(args, stdout=subprocess.PIPE, text=True).stdout.strip()

    # Validate prerequisites and the public recipient before interrupting service.
    command(["age", "--encrypt", "--recipient", recipient], input=b"", stdout=subprocess.DEVNULL)
    read(COMPOSE + ["version"])
    version = read(COMPOSE + ["exec", "-T", "database", "pg_dump", "--version"])
    if "(PostgreSQL) 17." not in version:
        raise RuntimeError("The database container must supply PostgreSQL 17 clients")
    container = read(COMPOSE + ["ps", "--all", "--quiet", "operations"])
    if not container or len(container.splitlines()) != 1:
        raise RuntimeError("Exactly one existing operations container is required")
    running = read(["docker", "inspect", "--format", "{{.State.Running}}", container])
    if running not in ("true", "false"):
        raise RuntimeError("Cannot determine whether operations is running")
    image = read(["docker", "inspect", "--format", "{{.Image}}", container])
    created = datetime.now(timezone.utc)
    name = "noorly-" + created.strftime("%Y%m%dT%H%M%SZ") + "-" + uuid4().hex
    final = destination / (name + ".tar.gz.age")
    partial = destination / (name + ".tar.gz.age.partial")
    stopped = False
    try:
        # mkdtemp creates a private directory even when the destination is shared.
        with tempfile.TemporaryDirectory(prefix=".noorly-backup-", dir=destination) as scratch_name:
            scratch = Path(scratch_name)
            try:
                if running == "true":
                    # Set first: an interrupted stop may still have stopped the writer.
                    stopped = True
                    command(COMPOSE + ["stop", "--timeout", "60", "operations"])
                if read(["docker", "inspect", "--format", "{{.State.Running}}", container]) != "false":
                    raise RuntimeError("Operations must be stopped before taking a paired snapshot")
                database = scratch / "database.dump"
                with database.open("xb") as target:
                    command(COMPOSE + [
                        "exec", "-T", "database", "sh", "-c",
                        'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump --host=127.0.0.1 '
                        '--username="$POSTGRES_USER" --dbname="$POSTGRES_DB" '
                        '--format=custom --no-owner --no-password',
                    ], stdout=target)
                with database.open("rb") as source:
                    command(COMPOSE + ["exec", "-T", "database", "pg_restore", "--list"],
                            stdin=source, stdout=subprocess.DEVNULL)
                workflow = scratch / "workflow"
                workflow.mkdir()
                command(["docker", "cp", container + ":/app/.eve/.workflow-data/.", str(workflow)])
                workflow_files = list(workflow.rglob("*"))
                if any(path.is_symlink() or not (path.is_file() or path.is_dir()) for path in workflow_files):
                    raise RuntimeError("Workflow backup requires self-contained regular files and directories")
                manifest = {
                    "format": 1,
                    "createdAt": created.isoformat(),
                    "imageId": image,
                    "postgresClient": version,
                    "writerStopped": True,
                    "databaseSha256": sha256(database),
                    "workflowSha256": {
                        str(path.relative_to(workflow)).replace(os.sep, "/"): sha256(path)
                        for path in sorted(workflow_files) if path.is_file()
                    },
                }
                (scratch / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
            finally:
                if stopped:
                    # Start only the existing service, never another writer or new volume.
                    command(COMPOSE + ["start", "--wait", "--wait-timeout", "120", "operations"])
                    stopped = False
            # Service resumes before compression/encryption, reducing downtime.
            archive = scratch / "snapshot.tar.gz"
            with tarfile.open(archive, "w:gz") as bundle:
                for item in ("database.dump", "workflow", "manifest.json"):
                    bundle.add(scratch / item, arcname=item, recursive=True)
            command(["age", "--encrypt", "--recipient", recipient, "--output", str(partial), str(archive)])
            with partial.open("r+b") as result:
                os.fsync(result.fileno())
            os.replace(partial, final)
            if sys.platform == "linux":
                directory_fd = os.open(destination, os.O_DIRECTORY)
                try:
                    os.fsync(directory_fd)
                finally:
                    os.close(directory_fd)
        return final
    finally:
        # Failed/partial archives are never advertised as restorable backups.
        partial.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", required=True, help="Existing host destination for encrypted archives")
    parser.add_argument("--recipient", required=True, help="age public recipient; keep its private identity off this host")
    args = parser.parse_args()
    if sys.platform != "linux":
        parser.error("Run this host helper on Linux")
    import fcntl
    def interrupted(signum, frame):
        raise RuntimeError("Backup interrupted; attempting to restore the previous service state")
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGHUP, interrupted)
    os.umask(0o077)
    # One lock for this Compose project, even if jobs choose different destinations.
    destination = Path(args.directory).resolve(strict=True)
    with Path("/var/lock/noorly-operations-backup.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError("Another backup already owns the Noorly operations project") from None
        result = paired_backup(destination, args.recipient)
    print("Encrypted paired backup created:", result)
    print("Off-host transfer and a restore drill must be verified separately.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print("Backup failed:", error, file=sys.stderr)
        sys.exit(1)
