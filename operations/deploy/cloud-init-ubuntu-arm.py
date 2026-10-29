#!/usr/bin/python3
"""Secret-free OCI user-data for a fresh Ubuntu 24.04 ARM64 instance.

Upload this file as the instance initialization script. It installs one private
observation deployment; it does not create infrastructure or connect paid APIs.
"""
import json
import os
from pathlib import Path
import platform
import re
import secrets
import subprocess
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen


SOURCE_URL = "https://github.com/1Alsaad/noorly-gifting.git"
SOURCE_COMMIT = "70fcfb22beb2d66b77842fda9c5b20d4959245af"
REPOSITORY = Path("/opt/noorly-operations")
STATE_DIRECTORY = Path("/var/lib/noorly-bootstrap")
DOCKER = ["docker", "--host", "unix:///var/run/docker.sock"]
SECRET_NAMES = (
    "POSTGRES_PASSWORD", "OPS_OPERATOR_PASSWORD", "OPS_SERVICE_TOKEN",
    "CRON_SECRET", "NOORLY_CATALOG_TOKEN", "NOORLY_CATALOG_SIGNING_SECRET",
)
FIXED_ENV = {"OPS_OPERATOR_USER": "noorly", "OPS_PUBLIC_HOST": "localhost"}


def validate_host(release, architecture, uid):
    if uid != 0:
        raise RuntimeError("Bootstrap must run as root through cloud-init")
    fields = dict(line.split("=", 1) for line in release.splitlines() if "=" in line)
    if fields.get("ID", "").strip('"') != "ubuntu" or fields.get("VERSION_ID", "").strip('"') != "24.04":
        raise RuntimeError("Bootstrap supports only Ubuntu 24.04")
    if architecture != "aarch64":
        raise RuntimeError("Bootstrap supports only ARM64 instances")


def command(args, capture=False, timeout=1800):
    # Do not inherit a remote Docker context, Compose profile, provider key or
    # shell-level database password. The generated env file is authoritative.
    env = {key: os.environ[key] for key in ("PATH", "HOME", "LANG", "LC_ALL") if key in os.environ}
    env.update(DEBIAN_FRONTEND="noninteractive", GIT_TERMINAL_PROMPT="0", GIT_CONFIG_GLOBAL="/dev/null")
    return subprocess.run(args, check=True, timeout=timeout, env=env, text=True,
                          stdout=subprocess.PIPE if capture else None).stdout


def runtime_environment(path, token=secrets.token_urlsafe):
    """Create secrets only on this host; preserve them on a retry and never log them."""
    if path.is_symlink():
        raise RuntimeError("Refusing a symlink as the runtime environment")
    if not path.exists():
        values = {name: token(32) for name in SECRET_NAMES}
        values.update(FIXED_ENV)
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as target:
            target.write("# Generated on this VM. Never print, commit or download this file.\n")
            target.write("\n".join(key + "=" + value for key, value in values.items()) + "\n")
            target.flush()
            os.fsync(target.fileno())
    values = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise RuntimeError("Invalid existing runtime environment; no changes made")
        key, value = line.split("=", 1)
        if key in values:
            raise RuntimeError("Duplicate runtime setting; no changes made")
        values[key] = value
    if set(values) != set(SECRET_NAMES) | set(FIXED_ENV):
        raise RuntimeError("Existing integration or unsupported settings require a separate deployment procedure")
    if any(values[key] != value for key, value in FIXED_ENV.items()):
        raise RuntimeError("Bootstrap requires its private localhost settings")
    if any(not re.fullmatch(r"[A-Za-z0-9_-]{32,}", values[key]) for key in SECRET_NAMES):
        raise RuntimeError("Existing runtime secrets do not meet the required format")
    if len({values[key] for key in SECRET_NAMES}) != len(SECRET_NAMES):
        raise RuntimeError("Every runtime secret must be distinct")
    os.chmod(path, 0o600)
    return values


def compose(operations):
    return DOCKER + ["compose", "--env-file", str(operations / "deploy/runtime.env"),
                     "-f", str(operations / "deploy/compose.yaml")]


def start_observation(operations, run=command):
    base = compose(operations)
    running = run(base + ["ps", "--services", "--status", "running"], capture=True)
    if "proxy" in running.splitlines():
        raise RuntimeError("A public proxy already exists; this bootstrap is only for private observation")
    run(base + ["up", "-d", "--wait", "--wait-timeout", "180", "database"])
    run(base + ["run", "--rm", "--no-deps", "operations", "npm", "run", "migrate"])
    run(base + ["up", "-d", "--no-build", "--wait", "--wait-timeout", "300", "operations"])


def check_application(values):
    origin = "http://127.0.0.1:3000"
    with urlopen(origin + "/health", timeout=15) as response:
        if json.load(response).get("status") != "up":
            raise RuntimeError("Health response did not confirm startup")
    try:
        with urlopen(origin + "/api/status", timeout=15):
            raise RuntimeError("The status endpoint unexpectedly allowed unauthenticated access")
    except HTTPError as error:
        if error.code != 401:
            raise RuntimeError("Unexpected unauthenticated status response") from None
    request = Request(origin + "/api/status", headers={"Authorization": "Bearer " + values["OPS_SERVICE_TOKEN"]})
    with urlopen(request, timeout=20) as response:
        status = json.load(response)
    if status.get("demo") or status.get("control", {}).get("mode") != "observe":
        raise RuntimeError("The persistent application did not confirm observation mode")


def bootstrap():
    validate_host(Path("/etc/os-release").read_text(), platform.machine(), os.geteuid())
    os.umask(0o077)
    STATE_DIRECTORY.mkdir(mode=0o700, parents=True, exist_ok=True)
    state_file = STATE_DIRECTORY / "status.json"
    if REPOSITORY.exists() and not state_file.exists():
        raise RuntimeError("Refusing to replace an existing unrecognized application directory")
    if state_file.exists() and json.loads(state_file.read_text()).get("sourceCommit") != SOURCE_COMMIT:
        raise RuntimeError("A different bootstrap release already owns this directory")

    def phase(name):
        state_file.write_text(json.dumps({"sourceCommit": SOURCE_COMMIT, "phase": name}) + "\n", encoding="utf-8")
        print("Noorly bootstrap:", name, flush=True)

    phase("installing-host-dependencies")
    command(["apt-get", "update"])
    command(["apt-get", "install", "-y", "--no-install-recommends", "ca-certificates", "curl", "git", "python3", "age"])
    # Follow Docker's official signed apt repository procedure; do not run a remote installer.
    Path("/etc/apt/keyrings").mkdir(mode=0o755, parents=True, exist_ok=True)
    os.chmod("/etc/apt/keyrings", 0o755)
    command(["curl", "--fail", "--silent", "--show-error", "--location", "--retry", "5",
             "https://download.docker.com/linux/ubuntu/gpg", "--output", "/etc/apt/keyrings/docker.asc"])
    os.chmod("/etc/apt/keyrings/docker.asc", 0o644)
    Path("/etc/apt/sources.list.d/docker.sources").write_text(
        "Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: noble\n"
        "Components: stable\nArchitectures: arm64\nSigned-By: /etc/apt/keyrings/docker.asc\n", encoding="utf-8")
    os.chmod("/etc/apt/sources.list.d/docker.sources", 0o644)
    command(["apt-get", "update"])
    command(["apt-get", "install", "-y", "--no-install-recommends", "docker-ce", "docker-ce-cli",
             "containerd.io", "docker-buildx-plugin", "docker-compose-plugin"])
    command(["systemctl", "enable", "--now", "docker"])

    phase("checking-pinned-source")
    if not REPOSITORY.exists():
        command(["git", "clone", "--filter=blob:none", "--no-checkout", SOURCE_URL, str(REPOSITORY)])
        command(["git", "-C", str(REPOSITORY), "checkout", "--detach", SOURCE_COMMIT])
    if command(["git", "-C", str(REPOSITORY), "rev-parse", "HEAD"], capture=True).strip() != SOURCE_COMMIT:
        raise RuntimeError("Source checkout does not match the reviewed commit")
    if command(["git", "-C", str(REPOSITORY), "status", "--porcelain"], capture=True).strip():
        raise RuntimeError("Source checkout contains local changes; refusing to overwrite them")
    operations = REPOSITORY / "operations"
    environment_file = operations / "deploy/runtime.env"
    # On a retry, reject existing paid integrations before building or starting anything.
    if environment_file.exists():
        runtime_environment(environment_file)

    phase("building-arm-image")
    command(DOCKER + ["build", "--tag", "noorly-operations:local", "--file", str(operations / "Dockerfile"),
                      str(operations)], timeout=3600)
    values = runtime_environment(environment_file)
    phase("starting-private-observation")
    start_observation(operations)
    check_application(values)
    phase("healthy-private-observation")
    print("Application is listening only on 127.0.0.1:3000. No provider credentials or public proxy were enabled.")
    print("Readiness checks, off-host backups, HTTPS and the 72-hour qualification remain separate deployment steps.")


if __name__ == "__main__":
    try:
        bootstrap()
    except Exception as error:
        # Values and environment contents are never included in failure output.
        print("Noorly bootstrap failed:", type(error).__name__, file=sys.stderr)
        print("Inspect the last phase and cloud-init logs on this VM. Existing volumes and secrets were preserved.", file=sys.stderr)
        sys.exit(1)
