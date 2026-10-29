# Free hosting plan for Noorly Operations

Verified 2026-10-28 against eve 0.85.0 and the linked provider documentation. This is a prepared deployment option, not a deployed service. No cloud account, server, domain, subscription or paid resource was created.

## Recommended path

Run one Node 24 eve server and PostgreSQL on an existing suitable Linux machine, or an Oracle Cloud Always Free VM after the owner completes signup. The included Docker configuration keeps the existing application architecture. eve runs its schedules inside the server, so a separate paid cron service is unnecessary.

Oracle's current documentation gives free tenancies **2 Ampere A1 OCPUs and 12 GB RAM**, with **200 GB total boot/block storage** in the home region. Capacity can be unavailable, and idle instances can be reclaimed. Select resources marked Always Free eligible; verify the account's actual allowance before provisioning. Do not upgrade to a paid account or rely on temporary trial credit. This route does not promise uninterrupted availability. [Oracle Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

Oracle requires accurate account information and card verification; the owner must complete this step. Its free-tier linked agreement permits internal business operations, making this a candidate for Noorly's operations backend, subject to the agreement presented for the owner's country and account. [Signup requirements](https://www.oracle.com/cloud/free/), [linked Cloud Services Agreement, section 1.1](https://www.oracle.com/contracts/docs/cloud_csa_online_v062223_us_eng.pdf)

Hosting can therefore cost **0 SEK/month within that allowance**. Existing Shopify, domain, payment-processing, supplier, advertising and model/API costs remain separate. This configuration supplies no model or paid connector credentials. The runtime's free-only/spending controls must also be active; free infrastructure alone cannot prevent provider charges.

## Why other free options were not selected

| Option             | Constraint for this implementation                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel Hobby       | Restricted to personal, non-commercial use; inappropriate for Noorly. [Plan rules](https://vercel.com/docs/plans/hobby)                                                                                                                                                                                                                                                 |
| Render Free        | Sleeps after 15 idle minutes, loses local files on restart, has no free persistent disk, and its free PostgreSQL expires after 30 days. This conflicts with durable local workflows. Render also advises against production use. [Free limits](https://render.com/docs/free)                                                                                            |
| Render cron        | Minimum US$1/month per cron service; not a free scheduler. [Cron pricing](https://render.com/docs/cronjobs)                                                                                                                                                                                                                                                             |
| Cloudflare Workers | A different execution environment. Some Node modules remain non-functional stubs, including child processes and worker threads. The existing eve Node server and local durable storage are not a verified drop-in deployment; porting would require separate runtime/storage work. [Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) |
| Neon Free          | Useful for intermittent workloads, but 100 CU-hours/project and 1 GB storage do not imply a continuously active free database. The 15-minute schedule may allow idle suspension between jobs, depending on other traffic. Local PostgreSQL avoids adding this quota dependency. [Current limits](https://neon.com/pricing)                                              |

## Runtime and sandbox behavior

The installed [eve self-hosting guide](node_modules/eve/docs/guides/deployment/self-hosting.md) documents `eve build` followed by `eve start`. Its local workflow state lives under `.eve/.workflow-data`; the Compose file mounts that path and PostgreSQL data on separate persistent volumes. Use one eve instance with this local workflow world. Do not load-balance several replicas or start another schedule runner against the same state.

**A Docker sandbox is not needed for the current backend tools.** In eve 0.85, normal turns only resume a previously recorded sandbox. A fresh text/JSON turn does not open one. `defaultTools: false` removes optional tools, but is not a universal sandbox-disable switch. Keep sandbox tools, file attachments, workspace-dependent skills, self-modification extensions and explicit session prewarming disabled. A future `ctx.getSandbox()` call or file-processing tool would require a separate configured provider.

This was checked in installed eve source: `context/providers/sandbox.js`, `execution/session/turn-step.js`, `execution/sandbox/ensure.js`, and `harness/attachment-staging.js`, under `node_modules/eve/dist/src/`. Production builds without a provider are supported; sandbox access itself fails if attempted. [Installed provider documentation](node_modules/eve/docs/sandbox/default.mdx)

The host still uses Docker Engine to run these application containers. That is separate from granting an agent a Docker sandbox: **the application receives no Docker socket and cannot create sibling containers.**

## Prepared files and prerequisites

- `Dockerfile`: builds eve with Node 24, then runs as an unprivileged user. No account keys are build arguments.
- `.dockerignore`: excludes credentials, local workflow data and generated output from the build context.
- `deploy/compose.yaml`: PostgreSQL, one eve service, persistent volumes, restart policy and bounded logs; optional HTTPS proxy.
- `deploy/runtime.env.example`: blank runtime-secret template. Copy it to `deploy/runtime.env` on the host. Populate independently generated secrets of at least 32 characters. Use URL-safe characters for the database password.
- `deploy/Caddyfile`: preserves every request path, including `/eve/` and `/.well-known/workflow/`. Set `OPS_PUBLIC_HOST` to an existing Noorly subdomain and point DNS to the server. Caddy can obtain and renew HTTPS certificates. [Caddy HTTPS requirements](https://caddyserver.com/docs/automatic-https)
- `deploy/backup.py`: a Linux host helper that captures an encrypted paired snapshot of PostgreSQL and eve's local workflow state. It uses PostgreSQL 17 clients inside the existing database container; no host PostgreSQL client or application Docker socket is needed.

Prerequisites are an owner-controlled Linux host, Docker Engine with Compose, sufficient disk/RAM, correct system time, runtime credentials, and access to the existing domain's DNS. Only expose 80/443 publicly; restrict SSH to the administrator. PostgreSQL has no public port, and direct application port 3000 binds to loopback. The current storefront remains on its existing host until separately deployed and verified.

## Host procedure

For a fresh Stockholm tenancy, `deploy/provision-oracle-free.py` provides a conservative Oracle Cloud Shell launcher. Upload it and the bootstrap below to Cloud Shell, retain the existing SSH private key there, and supply the current Cloud Shell public IPv4 address as a `/32`. Run `python3 ~/provision-oracle-free.py --ssh-source-cidr CURRENT_IP/32 --cloud-init ~/cloud-init-ubuntu-arm.py` for a read-only account and resource preview. Only adding `--apply` creates resources. The launcher requires a verified free subscription, Stockholm as the only subscribed home region, and no unrelated compute, storage, child compartments or networks. It selects one A1 server with 2 OCPUs, 12 GB RAM and a 50 GB boot volume; only SSH from the supplied address is allowed inbound. Application ports remain closed.

The launcher saves private state in `~/.local/state/noorly-oracle-free` before each creation and reconciles its uniquely tagged resources after interruption. Keep that state. Uncertain outcomes, drift, changed inputs and unavailable capacity stop without blind retries, deletion or a paid fallback. Cloud Shell's address can change; this launcher never broadens the firewall automatically. Preview success verifies configuration and account inventory, not physical host capacity or completed deployment. Its tests simulate OCI responses; check every real launch result before proceeding.

For a **new Ubuntu 24.04 ARM64 VM**, upload `deploy/cloud-init-ubuntu-arm.py` as its initialization/user-data script, including the first `#!/usr/bin/python3` line. The file contains no account credentials. It deploys the public repository at the reviewed commit `70fcfb22beb2d66b77842fda9c5b20d4959245af`, installs Docker from its official signed Ubuntu apt repository, and builds the image on the ARM host. It generates distinct secrets in `/opt/noorly-operations/operations/deploy/runtime.env` on the VM with root-only permissions, preserves them on a retry, and refuses pre-existing integration settings. Do not paste account passwords, private SSH keys or API tokens into user-data. [Cloud-init user-data scripts](https://docs.cloud-init.io/en/latest/explanation/format/user-data-script.html), [Docker Ubuntu installation](https://docs.docker.com/engine/install/ubuntu/).

The bootstrap starts only PostgreSQL and the operations service. It waits for health, rejects unauthenticated status access, and verifies persistent observation mode. The dashboard remains bound to `127.0.0.1:3000`; it does not enable Caddy, publish DNS, add firewall/OCI rules, add model/provider credentials, import readiness passes, or configure paid resources. The VM needs outbound access to Ubuntu/Docker package repositories, GitHub, Docker Hub and npm. Its subnet, SSH access and free-resource allowance must already be correct. Use an existing owner-controlled Cloud Shell SSH key where available, keeping its private half in Cloud Shell; the instance launch requires only its public half. Never download private login keys to this workspace.

On the VM, check `sudo cloud-init status --long` and `/var/lib/noorly-bootstrap/status.json`. The success phase is `healthy-private-observation`. Keep runtime environment contents out of logs and chat. A partially failed bootstrap preserves secrets and Docker volumes; inspect its last phase before retrying, and do not use it to overwrite an existing live installation. The script is prepared and tested with simulated commands only until a real ARM launch succeeds. Its source pin intentionally predates this bootstrap file, so upload the reviewed local script directly rather than expecting it in that pinned checkout.

Successful bootstrap is the first deployment check, not completed autonomous selling or the start of a qualified 72-hour run. The integration tests, baseline evidence, external credentials, HTTPS, backup destination and paired restore drill below remain necessary.

These commands are preparation instructions, not actions already performed. Run from `operations/` after filling the environment file. Model/connector keys are optional while setting up the free, inactive system.

```sh
docker compose --env-file deploy/runtime.env -f deploy/compose.yaml build
docker compose --env-file deploy/runtime.env -f deploy/compose.yaml up -d database
docker compose --env-file deploy/runtime.env -f deploy/compose.yaml run --rm operations npm run migrate
docker compose --env-file deploy/runtime.env -f deploy/compose.yaml up -d operations
```

After DNS and the hostname are ready, enable HTTPS:

```sh
docker compose --env-file deploy/runtime.env -f deploy/compose.yaml --profile https up -d
```

The application should remain in observation mode. Verify `/health`, authenticated dashboard access, a rejected unauthenticated write, database persistence after restart, workflow recovery, and a scheduled no-spend cycle. Confirm the registered channel exposes the dashboard routes on this origin. Inspect one full backend-only agent turn before enabling any paid model or connector; source inspection alone does not prove that a deployed turn completes.

Keep an encrypted off-host backup of PostgreSQL and the workflow volume, and test recovery before live operations. Replacing a container must preserve its volumes. Docker `down -v` destroys them and must not be used for an ordinary update. Rebuild after dependency changes; do not claim tested ARM compatibility until the image has built and passed these checks on the selected VM.

## Paired deployment backups

Install **Python 3 and age on the Linux host**, in addition to Docker Engine and a current Compose release supporting `start --wait`. On Ubuntu/Debian, these are ordinary distribution packages: `sudo apt-get install python3 age`. The app container does not require either dependency. The helper deliberately uses `pg_dump` and `pg_restore` from `postgres:17-alpine`, avoiding Bookworm's older default PostgreSQL client. [age installation and encryption](https://github.com/FiloSottile/age#installation), [Compose start](https://docs.docker.com/reference/cli/docker/compose/start/).

Create an age identity in an owner-controlled secure environment and retain its private identity in the owner's secure vault, outside the server being backed up. Give the server only the public `age1...` recipient. Losing the private identity makes the encrypted backups unrecoverable. Choose an existing private host directory with enough free space for a database dump, workflow copy, compressed bundle and encrypted archive. Configure a verified off-host transfer to an authorized backup destination; no destination, upload credentials, retention or recurring backup job is created by this repository.

From `operations/`, run as the host administrator with Docker access:

```sh
sudo python3 deploy/backup.py --directory /absolute/private/backup-directory --recipient age1YOUR_PUBLIC_RECIPIENT
```

The helper validates the recipient and PostgreSQL 17 client before stopping work. A host lock prevents overlapping backups, including jobs using different destinations. It stops the single operations container, waits until the writer has exited, takes a custom-format database dump, checks its archive index, and copies `.eve/.workflow-data` from the stopped container. Both stores therefore belong to the same quiescent application state. No other application or manual process may write these stores during the snapshot. The helper then starts the same container and waits for its health check before compressing and encrypting the captured copy. An application that was already stopped remains stopped.

Each completed `noorly-*.tar.gz.age` contains `database.dump`, `workflow/` and a checksum manifest recording the container image ID. Plaintext exists briefly only in a private temporary directory on the host and is removed when the helper exits normally or with a handled error. A failed snapshot/encryption publishes no completed archive. SIGTERM/SIGHUP and ordinary interruptions attempt to restore the prior running state; a restart failure exits nonzero and requires immediate operator attention. A forced process kill, host crash or power loss can leave the writer stopped or temporary data behind. Docker's `unless-stopped` policy does not undo this deliberate stop. The host monitor must check service health; after confirming the service was running before interruption, recover with `docker compose --env-file deploy/runtime.env -f deploy/compose.yaml start --wait --wait-timeout 120 operations` from `operations/`. Clean up only verified abandoned snapshot directories. Monitoring/recovery automation remains a deployment prerequisite. Keep backup downtime below the heartbeat allowance; a gap over twenty minutes correctly restarts observation.

**A local encrypted archive is not disaster recovery.** Transfer the completed file off-host, verify its checksum after transfer, monitor failures and available disk space, and apply an agreed retention policy before enabling a recurring job. Keep the matching application image/release and runtime secrets recoverable separately. Never put the private age identity or raw runtime secrets into ordinary project notes.

For a restore drill, decrypt into a private directory on an isolated recovery host, inspect the manifest, and verify its database/workflow checksums. Restore `database.dump` with PostgreSQL 17 `pg_restore` into a new empty database. Restore `workflow/` into a separate workflow volume owned by the app's `node` user (UID/GID 1000 in the supplied image). Use the matching application image and preserve one writer. Start without external provider credentials or live webhooks, verify persisted jobs and records, then reconcile Shopify/supplier/Buffer effects before reconnecting any live integration. A restored workflow can resume unfinished work: never start a second connected copy of the production state. The existing database-only restore test is not a substitute for this paired cloud recovery drill.

`npm run backup` remains a database-only utility for environments with PostgreSQL client tools installed. Do not run it inside the operations image and assume the result is durable: that image has no PostgreSQL client or persistent backup directory. The host helper above is the supported Compose deployment path.

Bounded helper checks, with Docker and age simulated, can be run using `python3 -m unittest discover -s deploy/tests -p 'test_*.py'`. They verify writer ordering, restart behavior and failure cleanup; they do not test real Docker, encryption, ARM execution or restore.

## Validation status

The hosting option and sandbox behavior were checked against installed source and official documentation. Docker Engine is not available in this workspace, so the container image, Compose startup, HTTPS issuance and ARM deployment have **not** been executed here. Cloud credentials, account verification, host capacity, DNS and the production connection checks remain deployment prerequisites.
