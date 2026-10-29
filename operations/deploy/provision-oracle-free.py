#!/usr/bin/env python3
"""Provision one conservative Always Free host from authenticated OCI Cloud Shell.

Default: read-only validation and preview. Add --apply to create resources.
Requires an otherwise empty Stockholm tenancy (no child compartments, other
subscribed regions, compute, volumes or VCNs except this script's saved run).
No credentials are generated, read from the SSH private key, or printed.

Example (replace the CIDR with the current Cloud Shell public egress address):
  python3 provision-oracle-free.py --ssh-source-cidr 203.0.113.1/32 \
    --cloud-init ./cloud-init-ubuntu-arm.py
  # Review the preview, then repeat with --apply.

Keep ~/.local/state/noorly-oracle-free intact. A timed-out create is reconciled
using its unique run tag. If the outcome cannot be proved, the script stops;
there are no automatic create retries, deletion, upgrades, or paid fallbacks.
Out-of-capacity also stops and leaves the network for inspection/recovery.
Cloud Shell egress can change; this script does not broaden or update SSH access.
Run only one provisioning workflow; the local lock cannot serialize other tools.

Official references (checked 2026-10-29):
https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/compute/instance/launch.html
https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/compute/image/list.html
https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/network/security-list/create.html
"""

import argparse
import base64
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import uuid


REGION = "eu-stockholm-1"
SHAPE = "VM.Standard.A1.Flex"
TAG = "noorly-provision-run"
NAME = "noorly-operations"
VCN_CIDR = "10.77.0.0/16"
SUBNET_CIDR = "10.77.1.0/24"
FREE_MODELS = {"FREE_TRIAL", "FREE", "FREE_TIER", "ALWAYS_FREE"}


class Stop(RuntimeError):
    pass


def items(result):
    """OCI emits empty stdout for an empty list; newer services use data.items."""
    value = result.get("data", [])
    if isinstance(value, dict):
        value = value.get("items", [])
    if not isinstance(value, list):
        raise Stop("Unexpected OCI list response; no changes will be inferred.")
    return value


def normalized(value):
    if isinstance(value, dict):
        return {re.sub(r"[-_]", "", k).lower(): normalized(v) for k, v in value.items()}
    if isinstance(value, list):
        return [normalized(v) for v in value]
    return value


def matches(actual, expected):
    actual, expected = normalized(actual), normalized(expected)
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(k in actual and matches(actual[k], v) for k, v in expected.items())
    if isinstance(expected, list):
        return isinstance(actual, list) and len(actual) == len(expected) and all(matches(a, b) for a, b in zip(actual, expected))
    return actual == expected


def require(condition, message):
    if not condition:
        raise Stop(message)


class Provisioner:
    def __init__(self, args):
        self.args = args
        self.tenancy = os.environ.get("OCI_TENANCY", "")
        require(self.tenancy.startswith("ocid1.tenancy."), "Run inside authenticated Cloud Shell with OCI_TENANCY set.")
        require(args.region == REGION, "This deployment is restricted to the Stockholm home region.")
        require(shutil.which("oci"), "OCI CLI is required; use authenticated Oracle Cloud Shell.")
        network = ipaddress.ip_network(args.ssh_source_cidr, strict=True)
        require(network.version == 4 and network.prefixlen == 32 and network.network_address.is_global,
                "--ssh-source-cidr must be the current Cloud Shell public IPv4 address with /32.")
        self.cloud_init = Path(args.cloud_init).expanduser().resolve(strict=True)
        self.public_key = Path.home() / ".ssh" / "noorly-operations.pub"
        require(self.cloud_init.is_file() and self.public_key.is_file(), "Cloud-init and ~/.ssh/noorly-operations.pub must exist.")
        cloud_bytes = self.cloud_init.read_bytes()
        key_bytes = self.public_key.read_bytes()
        require(cloud_bytes.startswith((b"#!", b"#cloud-config")), "Cloud-init needs a script shebang or #cloud-config header.")
        key_parts = key_bytes.decode("utf-8").strip().split()
        require(len(key_parts) >= 2 and key_parts[0] in {"ssh-ed25519", "ssh-rsa", "ecdsa-sha2-nistp256"}
                and len(key_bytes.splitlines()) == 1, "Expected exactly one supported public SSH key.")
        try:
            require(len(base64.b64decode(key_parts[1], validate=True)) > 32, "Public key data is invalid.")
        except ValueError as error:
            raise Stop("Public key data is invalid.") from error
        require(len(base64.b64encode(cloud_bytes)) + len(key_bytes) + 1000 < 32000,
                "Cloud-init and public key exceed OCI's metadata allowance.")
        self.directory = Path.home() / ".local" / "state" / "noorly-oracle-free"
        self.path = self.directory / "state.json"
        require(not self.directory.is_symlink() and not self.path.is_symlink(), "State paths must not be symbolic links.")
        self.lock = None
        if args.apply:
            require(os.name == "posix", "--apply requires Linux Cloud Shell.")
            import fcntl
            self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
            os.chmod(self.directory, 0o700)
            lock_path = self.directory / "lock"
            require(not lock_path.is_symlink(), "Lock must not be a symbolic link.")
            self.lock = open(lock_path, "a", encoding="utf-8")
            os.chmod(lock_path, 0o600)
            try:
                fcntl.flock(self.lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as error:
                raise Stop("Another provisioner is running.") from error
        self.state = json.loads(self.path.read_text()) if self.path.exists() else {
            "version": 1, "run": str(uuid.uuid4()), "resources": {}, "pending": {}}
        self.identity = {"tenancy": self.tenancy, "region": REGION,
                         "ssh_source_cidr": str(network),
                         "cloud_init_sha256": hashlib.sha256(cloud_bytes).hexdigest(),
                         "public_key_sha256": hashlib.sha256(key_bytes).hexdigest()}
        require(self.state.get("version") == 1, "Unsupported state version.")
        require("identity" not in self.state or self.state["identity"] == self.identity,
                "Saved tenancy, region, SSH source, key or cloud-init changed. Inspect the existing deployment; do not start a second run.")
        self.state["identity"] = self.identity

    def save(self):
        if not self.args.apply:
            return
        temporary = self.directory / "state.json.tmp"
        require(not temporary.is_symlink(), "Temporary state must not be a symbolic link.")
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(self.state, stream, indent=2)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temporary, 0o600)
        os.replace(temporary, self.path)
        directory_fd = os.open(self.directory, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)

    def cli(self, *arguments):
        # Never print command arguments, metadata or raw provider errors.
        command = ["oci", *map(str, arguments), "--region", REGION, "--output", "json", "--no-retry"]
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=180, check=False)
        except subprocess.TimeoutExpired as error:
            raise Stop("OCI request timed out. Any submitted create is held for reconciliation; do not relaunch manually.") from error
        if result.returncode:
            diagnostic = result.stderr.lower()
            if "out of capacity" in diagnostic or "out of host capacity" in diagnostic:
                raise Stop("A1 capacity is unavailable. Stopped without retry or paid fallback; keep the saved state.")
            code = re.search(r'"code"\s*:\s*"([A-Za-z0-9_-]+)"', result.stderr)
            suffix = f" ({code.group(1)})" if code else ""
            raise Stop("OCI request failed" + suffix + ". Inspect the Console; submitted creates remain held in private state.")
        if not result.stdout.strip():
            return {"data": []}
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as error:
            raise Stop("OCI returned an unreadable response; outcome is unverified.") from error

    def listing(self, *arguments):
        return items(self.cli(*arguments, "--all"))

    def owned(self, resource):
        return resource.get("freeform-tags", {}).get(TAG) == self.state["run"]

    def reconcile(self, key, resources):
        candidates = [r for r in resources if self.owned(r)]
        require(len(candidates) <= 1, f"Multiple tagged {key} resources found; manual reconciliation required.")
        existing_id = self.state["resources"].get(key)
        if existing_id:
            require(len(candidates) == 1 and candidates[0]["id"] == existing_id,
                    f"Saved {key} is absent or has changed ownership. No replacement will be created.")
        if candidates:
            require(candidates[0].get("lifecycle-state") not in {"TERMINATING", "TERMINATED", "DELETED"},
                    f"Managed {key} was removed; automatic replacement is disabled.")
            self.state["resources"][key] = candidates[0]["id"]
            self.state["pending"].pop(key, None)
            self.save()
            return candidates[0]
        return None

    def preflight(self):
        regions = self.listing("iam", "region-subscription", "list", "--tenancy-id", self.tenancy)
        homes = [r for r in regions if r.get("is-home-region")]
        require(len(homes) == 1 and homes[0].get("region-name") == REGION, "Stockholm must be the verified tenancy home region.")
        require(all(r.get("region-name") == REGION for r in regions), "Fresh-tenancy mode requires Stockholm as the only subscribed region.")
        subscriptions = self.listing("organizations", "subscription", "list", "--compartment-id", self.tenancy)
        active = [s for s in subscriptions if s.get("lifecycle-state") == "ACTIVE"]
        require(active and all(s.get("payment-model") in FREE_MODELS for s in active),
                "Could not prove every active subscription is FREE_TRIAL/free. Paid or unknown plans are blocked.")
        compartments = self.listing("iam", "compartment", "list", "--compartment-id", self.tenancy,
                                    "--compartment-id-in-subtree", "true")
        require(not [c for c in compartments if c.get("lifecycle-state") != "DELETED"],
                "This conservative script requires no child compartments; existing tenants need a separate inventory review.")
        domains = self.listing("iam", "availability-domain", "list", "--compartment-id", self.tenancy)
        require(len(domains) == 1, "Expected exactly one Stockholm availability domain.")
        self.ad = domains[0]["name"]
        require("ad" not in self.state or self.state["ad"] == self.ad, "Saved availability domain changed.")
        self.state["ad"] = self.ad
        instances = self.listing("compute", "instance", "list", "--compartment-id", self.tenancy)
        managed = self.reconcile("instance", instances)
        require(not [i for i in instances if i.get("lifecycle-state") != "TERMINATED" and not self.owned(i)],
                "Existing unrelated compute found; this script will not allocate additional compute.")
        boot_ids = set()
        if managed:
            require(matches(managed, {"shape": SHAPE, "shape-config": {"ocpus": 2, "memory-in-gbs": 12}}),
                    "Managed compute shape differs from the allowed 2 OCPU / 12 GB configuration.")
            attachments = self.listing("compute", "boot-volume-attachment", "list", "--compartment-id", self.tenancy,
                                       "--availability-domain", self.ad, "--instance-id", managed["id"])
            boot_ids = {a["boot-volume-id"] for a in attachments if a.get("lifecycle-state") != "DETACHED"}
        boots = self.listing("bv", "boot-volume", "list", "--compartment-id", self.tenancy, "--availability-domain", self.ad)
        volumes = self.listing("bv", "volume", "list", "--compartment-id", self.tenancy, "--availability-domain", self.ad)
        live_boots = [b for b in boots if b.get("lifecycle-state") != "TERMINATED"]
        require(not [b for b in live_boots if b["id"] not in boot_ids] and not [v for v in volumes if v.get("lifecycle-state") != "TERMINATED"],
                "Existing or uncertain storage found. Reconcile it before allocating any more resources.")
        require(sum(b.get("size-in-gbs", 201) for b in live_boots) <= 50,
                "Managed boot storage exceeds this deployment's 50 GB limit.")
        require(all(b.get("vpus-per-gb") == 10 and not b.get("autotune-policies") for b in live_boots),
                "Managed boot performance is not the fixed default 10 VPUs; inspect it before continuing.")
        vcns = self.listing("network", "vcn", "list", "--compartment-id", self.tenancy)
        self.reconcile("vcn", vcns)
        require(not [v for v in vcns if v.get("lifecycle-state") != "TERMINATED" and not self.owned(v)],
                "Existing unrelated network found; fresh-tenancy deployment stopped.")
        images = self.listing("compute", "image", "list", "--compartment-id", self.tenancy, "--shape", SHAPE,
                              "--operating-system", "Canonical Ubuntu", "--operating-system-version", "24.04")
        candidates = [i for i in images if re.fullmatch(r"Canonical-Ubuntu-24\.04-(?:Minimal-)?aarch64-[\d.-]+", i.get("display-name", ""))
                      and i.get("lifecycle-state") == "AVAILABLE" and i.get("compartment-id") is None]
        require(candidates, "No official available Ubuntu 24.04 ARM platform image compatible with A1 was found.")
        if "image" in self.state:
            candidates = [i for i in candidates if i["id"] == self.state["image"]["id"]]
            require(candidates, "Pinned image is no longer listed. Inspect before changing deployment inputs.")
        else:
            candidates.sort(key=lambda i: ("Minimal" in i["display-name"], i.get("time-created", "")), reverse=True)
        self.state["image"] = {"id": candidates[0]["id"], "name": candidates[0]["display-name"]}
        self.save()

    def wait_network(self, key, family, scope, resource, expected):
        if key == "instance":
            return
        for _ in range(20):
            require(resource.get("lifecycle-state") not in {"TERMINATING", "TERMINATED", "DELETED"},
                    f"Managed {key} was removed while provisioning.")
            if resource.get("lifecycle-state") == "AVAILABLE":
                require(matches(resource, expected), f"Managed {key} configuration changed while provisioning.")
                return
            time.sleep(3)
            found = [r for r in self.listing(*family, "list", "--compartment-id", self.tenancy, *scope)
                     if r.get("id") == resource["id"]]
            require(len(found) == 1 and self.owned(found[0]), f"Cannot verify managed {key} while waiting.")
            resource = found[0]
        raise Stop(f"Managed {key} is still provisioning. State is saved; rerun to resume without creating a duplicate.")

    def ensure(self, key, family, fields, expected, scope=()):
        resources = self.listing(*family, "list", "--compartment-id", self.tenancy, *scope)
        resource = self.reconcile(key, resources)
        if resource:
            require(matches(resource, expected), f"Managed {key} configuration drifted; automatic repair is disabled.")
            self.wait_network(key, family, scope, resource, expected)
            print(f"Reused verified {key}.")
            return resource["id"]
        require(key not in self.state["pending"],
                f"The previous {key} create has an uncertain outcome. No retry: inspect the Console and saved pending state.")
        require(self.args.apply, "Internal error: mutation requested during preview.")
        # Save before calling OCI. Even a process crash cannot cause a blind retry.
        self.state["pending"][key] = {"submitted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        self.save()
        action = "launch" if key == "instance" else "create"
        result = self.cli(*family, action, "--compartment-id", self.tenancy, "--display-name", NAME + "-" + key,
                          "--freeform-tags", json.dumps({TAG: self.state["run"]}), *fields)
        resource = result.get("data")
        require(isinstance(resource, dict) and resource.get("id"), f"The {key} create outcome is uncertain; saved pending state retained.")
        self.state["resources"][key] = resource["id"]
        self.state["pending"].pop(key, None)
        self.save()
        require(matches(resource, expected), f"Created {key} differs from the requested configuration. Stop and inspect it.")
        self.wait_network(key, family, scope, resource, expected)
        print(f"Created and recorded {key}.")
        return resource["id"]

    def run(self):
        self.preflight()
        print("Verified: free subscription; Stockholm home; fresh tenancy or this saved deployment.")
        print("Plan: one A1 VM, 2 OCPUs, 12 GB RAM; 50 GB default Balanced boot volume.")
        print("Image: " + self.state["image"]["name"])
        print("Network: dedicated VCN, internet gateway, route and subnet; inbound SSH only from the supplied /32.")
        print("No public application ports, load balancer, managed database, paid fallback or account upgrade.")
        print("Cloud-init and existing public key will be uploaded; the private key stays in Cloud Shell.")
        if not self.args.apply:
            print("PREVIEW ONLY. No cloud resources were changed. Repeat with --apply after reviewing this plan.")
            return
        vcn = self.ensure("vcn", ("network", "vcn"), ["--cidr-block", VCN_CIDR], {"cidr-block": VCN_CIDR})
        gateway = self.ensure("gateway", ("network", "internet-gateway"), ["--vcn-id", vcn, "--is-enabled", "true"],
                              {"vcn-id": vcn, "is-enabled": True}, ("--vcn-id", vcn))
        routes = [{"destination": "0.0.0.0/0", "destinationType": "CIDR_BLOCK", "networkEntityId": gateway}]
        route = self.ensure("route", ("network", "route-table"), ["--vcn-id", vcn, "--route-rules", json.dumps(routes)],
                            {"vcn-id": vcn, "route-rules": routes}, ("--vcn-id", vcn))
        ingress = [{"source": self.identity["ssh_source_cidr"], "sourceType": "CIDR_BLOCK", "protocol": "6", "isStateless": False,
                    "tcpOptions": {"destinationPortRange": {"min": 22, "max": 22}}}]
        egress = [{"destination": "0.0.0.0/0", "destinationType": "CIDR_BLOCK", "protocol": "all", "isStateless": False}]
        security = self.ensure("security", ("network", "security-list"), ["--vcn-id", vcn,
                               "--ingress-security-rules", json.dumps(ingress), "--egress-security-rules", json.dumps(egress)],
                               {"vcn-id": vcn, "ingress-security-rules": ingress, "egress-security-rules": egress}, ("--vcn-id", vcn))
        subnet = self.ensure("subnet", ("network", "subnet"), ["--vcn-id", vcn, "--cidr-block", SUBNET_CIDR,
                             "--route-table-id", route, "--security-list-ids", json.dumps([security]), "--prohibit-public-ip-on-vnic", "false"],
                             {"vcn-id": vcn, "cidr-block": SUBNET_CIDR, "route-table-id": route,
                              "security-list-ids": [security], "prohibit-public-ip-on-vnic": False}, ("--vcn-id", vcn))
        # Recheck resource/budget assumptions immediately before the only VM launch.
        self.preflight()
        instance = self.ensure("instance", ("compute", "instance"), ["--availability-domain", self.ad,
                               "--shape", SHAPE, "--shape-config", json.dumps({"ocpus": 2, "memoryInGBs": 12}),
                               "--image-id", self.state["image"]["id"], "--boot-volume-size-in-gbs", "50",
                               "--subnet-id", subnet, "--assign-public-ip", "true", "--assign-ipv6-ip", "false",
                               "--ssh-authorized-keys-file", str(self.public_key), "--user-data-file", str(self.cloud_init)],
                               {"availability-domain": self.ad, "shape": SHAPE, "shape-config": {"ocpus": 2, "memory-in-gbs": 12},
                                "image-id": self.state["image"]["id"]})
        print("Instance creation recorded. Inspect its lifecycle and cloud-init result in the Console before installing credentials or opening ports.")
        print("Saved state: " + str(self.path))
        print("Instance OCID: " + instance)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--region", default=REGION)
    parser.add_argument("--ssh-source-cidr", required=True, help="Current Cloud Shell public IPv4 egress address, explicitly /32")
    parser.add_argument("--cloud-init", required=True, help="Reviewed cloud-init script to upload")
    parser.add_argument("--apply", action="store_true", help="Create the reviewed free resources; default is read-only preview")
    args = parser.parse_args()
    try:
        Provisioner(args).run()
    except (Stop, ValueError, OSError) as error:
        print("STOP: " + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
