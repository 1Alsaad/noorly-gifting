"""Offline checks: never invoke OCI or provision any resources."""

import contextlib
import io
import pathlib
import subprocess
import types
import unittest
from unittest.mock import Mock, patch


SOURCE = pathlib.Path(__file__).resolve().parents[1] / "provision-oracle-free.py"
provision = types.ModuleType("provision_oracle_free")
exec(compile(SOURCE.read_text(encoding="utf-8"), str(SOURCE), "exec"), provision.__dict__)


def provisioner():
    value = provision.Provisioner.__new__(provision.Provisioner)
    value.args = types.SimpleNamespace(apply=True)
    value.tenancy = "ocid1.tenancy.test"
    value.state = {"run": "test-run", "resources": {}, "pending": {}}
    value.save = Mock()
    return value


def vcn():
    return {"id": "vcn-id", "cidr-block": provision.VCN_CIDR,
            "freeform-tags": {provision.TAG: "test-run"}, "lifecycle-state": "AVAILABLE"}


class ProvisioningTests(unittest.TestCase):
    def test_empty_and_wrapped_lists(self):
        self.assertEqual(provision.items({"data": []}), [])
        self.assertEqual(provision.items({"data": {"items": [{"id": "a"}]}}), [{"id": "a"}])
        with self.assertRaises(provision.Stop):
            provision.items({"data": "unexpected"})

    def test_empty_cli_stdout_and_retries_disabled(self):
        p = provisioner()
        with patch.object(provision.subprocess, "run", return_value=types.SimpleNamespace(returncode=0, stdout="", stderr="")) as run:
            self.assertEqual(p.cli("compute", "instance", "list"), {"data": []})
            self.assertIn("--no-retry", run.call_args.args[0])
            self.assertFalse(run.call_args.kwargs.get("shell", False))

    def test_secret_errors_and_capacity_are_not_printed(self):
        p = provisioner()
        result = types.SimpleNamespace(returncode=1, stdout="", stderr="secret-token: Out of host capacity")
        with patch.object(provision.subprocess, "run", return_value=result):
            with self.assertRaises(provision.Stop) as error:
                p.cli("compute", "instance", "launch")
        self.assertIn("capacity", str(error.exception))
        self.assertNotIn("secret-token", str(error.exception))

    def test_timeout_never_retries(self):
        p = provisioner()
        with patch.object(provision.subprocess, "run", side_effect=subprocess.TimeoutExpired(["sensitive"], 180)) as run:
            with self.assertRaises(provision.Stop) as error:
                p.cli("compute", "instance", "launch")
            self.assertEqual(run.call_count, 1)
        self.assertNotIn("sensitive", str(error.exception))

    def test_successful_create_then_resume_does_not_duplicate(self):
        p = provisioner()
        p.listing = Mock(return_value=[])
        p.cli = Mock(return_value={"data": vcn()})
        expected = {"cidr-block": provision.VCN_CIDR}
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(p.ensure("vcn", ("network", "vcn"), [], expected), "vcn-id")
            p.listing.return_value = [vcn()]
            self.assertEqual(p.ensure("vcn", ("network", "vcn"), [], expected), "vcn-id")
        self.assertEqual(p.cli.call_count, 1)
        self.assertEqual(p.state["resources"]["vcn"], "vcn-id")
        self.assertFalse(p.state["pending"])

    def test_uncertain_create_persists_pending_before_provider_call(self):
        p = provisioner()
        p.listing = Mock(return_value=[])
        def timeout(*args):
            self.assertIn("instance", p.state["pending"])
            self.assertTrue(p.save.called)
            raise provision.Stop("timeout")
        p.cli = Mock(side_effect=timeout)
        with self.assertRaises(provision.Stop):
            p.ensure("instance", ("compute", "instance"), [], {})
        with self.assertRaisesRegex(provision.Stop, "uncertain outcome"):
            p.ensure("instance", ("compute", "instance"), [], {})
        self.assertEqual(p.cli.call_count, 1)

    def test_uncertain_create_adopts_exact_tag_without_relaunch(self):
        p = provisioner()
        p.state["pending"]["instance"] = {"submitted_at": "earlier"}
        p.listing = Mock(return_value=[{"id": "instance-id", "shape": provision.SHAPE,
                                     "lifecycle-state": "RUNNING", "freeform-tags": {provision.TAG: "test-run"}}])
        p.cli = Mock(side_effect=AssertionError("must never relaunch"))
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(p.ensure("instance", ("compute", "instance"), [], {"shape": provision.SHAPE}), "instance-id")
        self.assertFalse(p.state["pending"])
        p.cli.assert_not_called()

    def test_drift_missing_or_duplicate_resources_stop(self):
        for resources, saved in [([dict(vcn(), **{"cidr-block": "0.0.0.0/0"})], {}),
                                 ([], {"vcn": "vcn-id"}), ([vcn(), vcn()], {})]:
            with self.subTest(resources=resources):
                p = provisioner()
                p.state["resources"] = saved
                p.listing = Mock(return_value=resources)
                p.cli = Mock(side_effect=AssertionError("must not create"))
                with self.assertRaises(provision.Stop):
                    p.ensure("vcn", ("network", "vcn"), [], {"cidr-block": provision.VCN_CIDR})
                p.cli.assert_not_called()

    def test_paid_or_unknown_subscription_stops_before_mutation(self):
        for payment_model in ["PAYG", "COMMITMENT", None]:
            p = provisioner()
            p.listing = Mock(side_effect=[[{"is-home-region": True, "region-name": provision.REGION}],
                                        [{"lifecycle-state": "ACTIVE", "payment-model": payment_model}]])
            p.cli = Mock(side_effect=AssertionError("no mutation"))
            with self.assertRaisesRegex(provision.Stop, "Paid or unknown"):
                p.preflight()
            p.cli.assert_not_called()

    def test_wrong_home_region_stops(self):
        p = provisioner()
        p.listing = Mock(return_value=[{"is-home-region": True, "region-name": "us-ashburn-1"}])
        with self.assertRaisesRegex(provision.Stop, "home region"):
            p.preflight()

    def test_generated_launch_and_ssh_scope(self):
        p = provisioner()
        p.identity = {"ssh_source_cidr": "8.8.8.8/32"}
        p.ad, p.public_key, p.cloud_init, p.path = "AD", pathlib.Path("/key.pub"), pathlib.Path("/init.py"), pathlib.Path("/state")
        p.state["image"] = {"id": "image-id", "name": "Canonical-Ubuntu-24.04-aarch64-2026.10.27-0"}
        p.preflight = Mock()
        p.ensure = Mock(side_effect=lambda key, *args: key + "-id")
        with contextlib.redirect_stdout(io.StringIO()):
            p.run()
        security = next(c.args for c in p.ensure.call_args_list if c.args[0] == "security")
        rules = security[3]["ingress-security-rules"]
        self.assertEqual(len(rules), 1)
        self.assertEqual(rules[0]["source"], "8.8.8.8/32")
        self.assertEqual(rules[0]["protocol"], "6")
        self.assertEqual(rules[0]["tcpOptions"]["destinationPortRange"], {"min": 22, "max": 22})
        launch = next(c.args for c in p.ensure.call_args_list if c.args[0] == "instance")
        self.assertEqual(launch[2][launch[2].index("--boot-volume-size-in-gbs") + 1], "50")
        self.assertEqual(launch[2][launch[2].index("--assign-ipv6-ip") + 1], "false")
        self.assertNotIn("--preemptible-instance-config", launch[2])
        self.assertEqual(p.preflight.call_count, 2)

    def test_preview_never_calls_ensure(self):
        p = provisioner()
        p.args.apply = False
        p.state["image"] = {"name": "reviewed-image"}
        p.preflight = Mock()
        p.ensure = Mock(side_effect=AssertionError("preview must not mutate"))
        with contextlib.redirect_stdout(io.StringIO()):
            p.run()
        p.ensure.assert_not_called()

    def test_network_wait_reads_only_and_refuses_terminated_resource(self):
        p = provisioner()
        resource = vcn()
        resource["lifecycle-state"] = "PROVISIONING"
        p.listing = Mock(return_value=[vcn()])
        with patch.object(provision.time, "sleep"):
            p.wait_network("vcn", ("network", "vcn"), (), resource, {"cidr-block": provision.VCN_CIDR})
        self.assertEqual(p.listing.call_count, 1)
        resource["lifecycle-state"] = "TERMINATED"
        with self.assertRaisesRegex(provision.Stop, "removed"):
            p.wait_network("vcn", ("network", "vcn"), (), resource, {})


if __name__ == "__main__":
    unittest.main()
