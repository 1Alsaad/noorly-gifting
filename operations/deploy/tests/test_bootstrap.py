"""Bounded bootstrap tests. No package installation, Docker, cloud or network calls."""
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location("bootstrap", Path(__file__).resolve().parents[1] / "cloud-init-ubuntu-arm.py")
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)


class BootstrapTests(unittest.TestCase):
    def test_rejects_wrong_host_before_installation(self):
        valid = 'ID=ubuntu\nVERSION_ID="24.04"\n'
        bootstrap.validate_host(valid, "aarch64", 0)
        for release, architecture, uid in ((valid, "x86_64", 0), (valid, "aarch64", 1000),
                                           ('ID=ubuntu\nVERSION_ID="22.04"', "aarch64", 0)):
            with self.subTest(architecture=architecture, uid=uid), self.assertRaises(RuntimeError):
                bootstrap.validate_host(release, architecture, uid)

    def test_retry_preserves_private_runtime_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "runtime.env"
            counter = iter(range(6))
            values = bootstrap.runtime_environment(path, lambda _: "TEST_ONLY_" + str(next(counter)) * 40)
            original = path.read_bytes()
            again = bootstrap.runtime_environment(path, lambda _: self.fail("Retry must not rotate secrets"))
            self.assertEqual(values, again)
            self.assertEqual(original, path.read_bytes())
            self.assertEqual(set(values), set(bootstrap.SECRET_NAMES) | set(bootstrap.FIXED_ENV))
            self.assertEqual(values["OPS_PUBLIC_HOST"], "localhost")

    def test_existing_paid_integration_is_refused_without_overwriting_it(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "runtime.env"
            original = "AI_GATEWAY_API_KEY=TEST_ONLY_NOT_A_REAL_KEY\n"
            path.write_text(original, encoding="utf-8")
            with self.assertRaisesRegex(RuntimeError, "integration"):
                bootstrap.runtime_environment(path)
            self.assertEqual(path.read_text(encoding="utf-8"), original)

    def test_database_is_ready_and_migrated_before_application_start(self):
        calls = []
        def run(args, **kwargs):
            calls.append(args)
            return ""
        bootstrap.start_observation(Path("/fixture/operations"), run)
        self.assertEqual(len(calls), 4)
        self.assertEqual(calls[1][-1], "database")
        self.assertIn("--wait", calls[1])
        self.assertEqual(calls[2][-3:], ["npm", "run", "migrate"])
        self.assertEqual(calls[3][-1], "operations")
        self.assertIn("--no-build", calls[3])
        self.assertFalse(any("--profile" in args or "proxy" in args for args in calls))

    def test_existing_public_proxy_stops_bootstrap_before_mutations(self):
        calls = []
        def run(args, **kwargs):
            calls.append(args)
            return "database\noperations\nproxy\n"
        with self.assertRaisesRegex(RuntimeError, "public proxy"):
            bootstrap.start_observation(Path("/fixture/operations"), run)
        self.assertEqual(len(calls), 1)

    def test_health_check_requires_authentication_and_persistent_observation(self):
        for mode, demo, should_pass in (("observe", False, True), ("live", False, False), ("observe", True, False)):
            with self.subTest(mode=mode, demo=demo):
                responses = [io.BytesIO(b'{"status":"up"}'),
                             HTTPError("http://127.0.0.1:3000/api/status", 401, "Unauthorized", {}, None),
                             io.BytesIO(json.dumps({"control": {"mode": mode}, "demo": demo}).encode())]
                with patch.object(bootstrap, "urlopen", side_effect=responses):
                    if should_pass:
                        bootstrap.check_application({"OPS_SERVICE_TOKEN": "TEST_ONLY"})
                    else:
                        with self.assertRaises(RuntimeError):
                            bootstrap.check_application({"OPS_SERVICE_TOKEN": "TEST_ONLY"})

    def test_unprotected_status_endpoint_fails_startup_verification(self):
        with patch.object(bootstrap, "urlopen", side_effect=[io.BytesIO(b'{"status":"up"}'), io.BytesIO(b"{}")]):
            with self.assertRaisesRegex(RuntimeError, "unauthenticated"):
                bootstrap.check_application({"OPS_SERVICE_TOKEN": "TEST_ONLY"})


if __name__ == "__main__":
    unittest.main()
