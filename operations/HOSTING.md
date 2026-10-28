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

Prerequisites are an owner-controlled Linux host, Docker Engine with Compose, sufficient disk/RAM, correct system time, runtime credentials, and access to the existing domain's DNS. Only expose 80/443 publicly; restrict SSH to the administrator. PostgreSQL has no public port, and direct application port 3000 binds to loopback. The current storefront remains on its existing host until separately deployed and verified.

## Host procedure

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

## Validation status

The hosting option and sandbox behavior were checked against installed source and official documentation. Docker Engine is not available in this workspace, so the container image, Compose startup, HTTPS issuance and ARM deployment have **not** been executed here. Cloud credentials, account verification, host capacity, DNS and the production connection checks remain deployment prerequisites.
