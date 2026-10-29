"""Control-flow tests only: external Docker/age commands are simulated."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("backup", Path(__file__).resolve().parents[1] / "backup.py")
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class FakeCommands:
    def __init__(self, running=True, fail=None):
        self.running = running
        self.fail = fail
        self.events = []

    def __call__(self, args, **kwargs):
        result = ""
        if args[0] == "age":
            stage = "encrypt" if "--output" in args else "recipient"
            self.events.append(stage)
            if self.fail == stage:
                raise subprocess.CalledProcessError(1, args)
            if stage == "encrypt":
                # A fake encryption command preserves the tar only for assertions.
                shutil.copyfile(args[-1], args[args.index("--output") + 1])
        elif args[1] == "inspect":
            result = str(self.running).lower() if "Running" in args[3] else "sha256:test-image"
        elif args[1] == "cp":
            self.events.append("workflow")
            assert not self.running, "Workflow must be copied only while its writer is stopped"
            if self.fail == "workflow":
                raise subprocess.CalledProcessError(1, args)
            (Path(args[-1]) / "run.json").write_text('{"pending":true}', encoding="utf-8")
        elif "stop" in args:
            self.events.append("stop")
            self.running = False
            if self.fail == "stop":
                raise subprocess.CalledProcessError(1, args)
        elif "start" in args:
            self.events.append("start")
            if self.fail == "start":
                raise subprocess.CalledProcessError(1, args)
            self.running = True
        elif "pg_dump" in args:
            result = "pg_dump (PostgreSQL) 17.7"
        elif "pg_restore" in args:
            self.events.append("validate")
            if self.fail == "validate":
                raise subprocess.CalledProcessError(1, args)
            assert kwargs["stdin"].read() == b"PGDMP fixture"
        elif "sh" in args:
            self.events.append("dump")
            assert not self.running, "Database must be captured only after stopping the workflow writer"
            kwargs["stdout"].write(b"PGDMP fixture")
            if self.fail == "dump":
                raise subprocess.CalledProcessError(1, args)
        elif "ps" in args:
            result = "operations-container"
        elif "version" in args:
            result = "Docker Compose version fixture"
        else:
            raise AssertionError(args)
        return subprocess.CompletedProcess(args, 0, stdout=result)


class BackupTests(unittest.TestCase):
    def test_paired_snapshot_stops_writer_then_resumes_before_encryption(self):
        with tempfile.TemporaryDirectory() as destination:
            commands = FakeCommands()
            result = backup.paired_backup(destination, "age1-public-recipient", commands)
            self.assertEqual(commands.events, ["recipient", "stop", "dump", "validate", "workflow", "start", "encrypt"])
            self.assertTrue(commands.running)
            with tarfile.open(result, "r:gz") as archive:
                manifest = json.load(archive.extractfile("manifest.json"))
                self.assertTrue(manifest["writerStopped"])
                self.assertEqual(manifest["imageId"], "sha256:test-image")
                self.assertIn("run.json", manifest["workflowSha256"])
                self.assertEqual(archive.extractfile("workflow/run.json").read(), b'{"pending":true}')
            self.assertEqual([path.resolve() for path in Path(destination).iterdir()], [result])

    def test_failures_restore_service_and_publish_no_archive(self):
        for stage in ("stop", "dump", "validate", "workflow", "encrypt"):
            with self.subTest(stage=stage), tempfile.TemporaryDirectory() as destination:
                commands = FakeCommands(fail=stage)
                with self.assertRaises(subprocess.CalledProcessError):
                    backup.paired_backup(destination, "age1-public-recipient", commands)
                self.assertTrue(commands.running)
                self.assertEqual(list(Path(destination).iterdir()), [])

    def test_invalid_recipient_does_not_interrupt_service(self):
        with tempfile.TemporaryDirectory() as destination:
            commands = FakeCommands(fail="recipient")
            with self.assertRaises(subprocess.CalledProcessError):
                backup.paired_backup(destination, "invalid", commands)
            self.assertEqual(commands.events, ["recipient"])
            self.assertTrue(commands.running)

    def test_previously_stopped_service_is_not_started(self):
        with tempfile.TemporaryDirectory() as destination:
            commands = FakeCommands(running=False)
            backup.paired_backup(destination, "age1-public-recipient", commands)
            self.assertFalse(commands.running)
            self.assertNotIn("start", commands.events)
            self.assertNotIn("stop", commands.events)

    def test_restart_failure_is_not_reported_as_a_successful_backup(self):
        with tempfile.TemporaryDirectory() as destination:
            commands = FakeCommands(fail="start")
            with self.assertRaises(subprocess.CalledProcessError):
                backup.paired_backup(destination, "age1-public-recipient", commands)
            self.assertFalse(commands.running)
            self.assertEqual(list(Path(destination).iterdir()), [])


if __name__ == "__main__":
    unittest.main()
