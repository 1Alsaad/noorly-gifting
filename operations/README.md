# Noorly operations

This application implements the departmental agent runtime, durable work queue, spending controls, activity dashboard, connectors and a verified catalog release path alongside Noorly's existing storefront. It starts in **observation mode**. It is not evidence that Noorly is already operating autonomously or making sales.

The latest hosting instruction is **free for now**. No paid infrastructure is provisioned by this repository. Use the self-hosted deployment in [HOSTING.md](HOSTING.md); Vercel Hobby is not a commercial deployment option. Free hosting does not make model calls or supplier orders free. Missing credentials disable the affected work.

## Implemented

- Management plus seven specialist eve agents share PostgreSQL, jobs, evidence, proposals and audit history. Models have backend business tools only, with no shell, arbitrary HTTP, credential or budget editing tool.
- Schedules recover jobs every 15 minutes and deduplicate daily/weekly work. Shopify HMAC-verified events enqueue authoritative API reconciliation. Department deliveries use durable eve identity.
- Atomic spending reservations enforce 1,000 SEK monthly additional software, 500 SEK initial advertising (1,000 maximum only after verified results), and a 2,000 SEK revolving supplier reserve. Money is integer öre. No VAT is modelled. Pending reservations survive month boundaries; prepaid top-ups and usage are not counted twice.
- AI requests use a metered model wrapper. It checks current price ceilings and FX, reserves a conservative maximum before each call, limits context/output and settles verified provider receipts. Uncertain billing stays reserved. Every agent and compaction call uses the wrapper.
- Publication requires continuous 72-hour observation plus trusted readiness records. The model cannot mark its own research, assets, integration tests or financial records as verified.
- Buffer scheduling preserves the five Stockholm TikTok slots and adopts existing queued posts. New scheduling requires an explicit Make ownership handoff, automatic photo capability and reviews of exact image bytes and caption claims. Generated TikTok photos remain blocked while native disclosure support is unverified. Facebook/Instagram's existing scheduler remains in place.
- Shopify draft, price, publication and archival adapters plus a coordinated catalog release service. A signed manifest supplies Swedish/English content and exact variants; live Shopify remains authoritative for price and stock. Partial/uncertain releases hold their prior manifest and reconciliation record. Existing orders are never deleted.
- Connector interfaces for Buffer, Resend, DataForSEO, Meta and documented AW authentication; API errors and ambiguous writes fail closed.
- Authenticated dashboard, status/export endpoint, verifier import endpoint, structured health checks, database backup command, container deployment and CI with a real PostgreSQL test service.

## Still required before live selling

These are release blockers, not completed acceptance tests:

1. An accessible cloud host and durable database, with HTTPS, secrets, backup storage and restore verification. Local testing does not establish cloud uptime. Oracle's free capacity and account verification are external prerequisites.
2. Server credentials for Shopify, AI, Buffer and Resend. Connected apps in this chat do not automatically provide credentials to a deployed service. Demand research also needs existing approved planning access or funded DataForSEO credit.
3. AW's authenticated order/quote/stock schemas and a budget-controlled fulfillment test. The current AW adapter deliberately does **not** submit orders. Its native Shopify charging flow must not bypass the central supplier reserve.
4. Complete supplier acceptance → tracking → customer notification → refund/remedy handling, validated against real provider test facilities. Customer service currently prepares proposals; automatic refunds and support-inbox sending are not enabled.
5. A production-safe checkout/funding admission mechanism for simultaneous customer orders, then the full order journey and database restore/reconciliation acceptance tests. Database reservation tests alone do not prove that Shopify checkout cannot accept more orders than the supplier float can fund.
6. Verified research/supplier/asset records, qualified catalog releases and a confirmed transfer from the overlapping Make publisher. Existing posts and purchase-tracking ownership must be inspected on the live connections.
7. Paid acquisition needs a verified ad-set/creative workflow and one-experiment controller. The Meta adapter can create a capped **paused campaign** and read spend; that alone is not an implemented advertising campaign.
8. A genuine 72-hour unattended cloud observation period. Tests use a simulated clock to test policy; they do not satisfy this requirement.

Until these checks pass, keep observation mode. Do not set a readiness record to pass merely because credentials exist or unit tests passed. The authenticated verifier is for real evidence, not an owner approval shortcut.

Observation starts after the baseline checks first pass. A baseline failure or recovery from failure restarts the 72-hour period. Routine successful evidence refreshes, including new invoice/reconciliation references, preserve continuous qualification and do not interrupt fulfillment. The readiness `checkedAt` is the start of continuous qualification; audit timestamps identify later evidence refreshes. When integration configuration changes, the trusted verifier must explicitly record a failure before testing and requalifying the changed configuration. A new successful evidence reference alone does not signal a configuration change.

## Run and verify

Node 24 is the deployment target. The operations package has its own exact npm lockfile; the storefront continues to use pnpm.

```sh
cd operations
npm ci
npm run typecheck
npm test
npm run build
npm run preflight
npm run migrate
npm start
```

The built eve server serves the dashboard and schedules. `npm run serve:dashboard` is a loopback-only local inspection helper; it does not start eve scheduling. `OPS_DEMO=true` is allowed only outside production and uses in-memory records; it must never be treated as persistent operation.

Provide `OPS_TEST_DATABASE_URL` for the real PostgreSQL concurrency/restart and backup/restore tests. Never point it at a customer database. The restore test requires a disposable server role with `CREATEDB` and matching `pg_dump`/`pg_restore` client versions; set `OPS_TEST_PG_BIN` to their directory when they are not on `PATH`. It runs the actual backup command, restores into a separate generated database, checks the ledger/audit/records/jobs, and reconciles completed and interrupted writes against deterministic Shopify fixtures without repeating their mutations. This is a local/CI acceptance test, not evidence of a restore against the real Shopify account. CI provisions its own disposable PostgreSQL server. `npm run backup` requires PostgreSQL client tools and an encrypted/off-host backup destination configured by the host operator. A backup on the same disk is not disaster recovery.

## Credentials and endpoint boundaries

Generate distinct secrets of at least 32 characters for the operator password, service token, cron secret and catalog signing/token values. Keep them in host secret storage. Use a private application or narrowly scoped provider credentials; avoid personal account-wide tokens.

| Endpoint                      | Authentication                              | Purpose                                                |
| ----------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| `GET /` and `GET /api/status` | Operator Basic auth or service bearer       | Dashboard and activity                                 |
| `POST /api/control`           | Operator + same origin, or service bearer   | Pause or return to observation                         |
| `POST /api/tick`              | Cron bearer                                 | Recover and dispatch due work                          |
| `POST /webhooks/shopify`      | Raw-body Shopify HMAC and exact shop domain | Deduplicated reconciliation                            |
| `GET /api/catalog`            | Separate catalog bearer                     | Timestamped HMAC-signed manifest                       |
| `POST /api/import`            | Service bearer only                         | Trusted evidence/receipt/catalog qualification imports |
| `POST /api/verification`      | Service bearer only                         | Evidence-backed readiness results                      |
| `POST /api/asset-review`      | Service bearer only                         | Review of exact asset bytes                            |
| `/eve/v1/*`                   | Operator or service authentication          | Durable agent sessions                                 |

`src/verification.ts` and `src/catalog-release.ts` define the import contracts. All model-authored proposals remain untrusted until the backend verifies the associated sources. No model tool exposes these import endpoints.

The storefront uses `NOORLY_CATALOG_URL`, `NOORLY_CATALOG_TOKEN` and `NOORLY_CATALOG_SIGNING_SECRET`. Do not enable that URL before the operations app has a qualified active manifest. Once configured, invalid or unavailable manifests fail closed. Without the URL, Noorly's existing storefront remains unchanged.

## Cost controls

No subscription, top-up or external purchase is created automatically. The initial 300 SEK software reservation protects essential hosting/order-processing capacity within the 1,000 SEK ceiling; reconcile it to actual invoices through trusted receipts. Remaining allocations are planning targets: AI/research 300, external data100, creative150, contingency150 SEK. The approved supplier reserve is working capital, not a monthly subscription.

An unresolved `essential:YYYY-MM` reservation remains held after month end. The trusted billing reconciler must obtain final provider invoices/usage statements and confirm there are no outstanding covered charges before closing it. Import a `spend-receipt` through the service-authenticated verifier using the reservation ID, confirmed total in integer öre, and a unique receipt reference; settlement releases only the unused difference. A verified final zero-charge statement can settle at zero. Do not clear a hold merely because a new month started, a provider advertises a free plan, or the model says the services were unused. Do not book charges already recorded under another reservation twice. If final charges exceed the reservation, pause spending and reconcile the discrepancy; never understate the receipt to fit the cap. No provider billing reconciler currently automates these confirmations, so unresolved holds deliberately reduce the next month's available capacity.

DataForSEO calls consume only confirmed prepaid credit. A future $50 top-up must be booked in SEK in its purchase month before use. Gateway prepaid credits work similarly; default AI funding is cash. Actual free credits and existing subscriptions must be reconciled rather than assumed. Provider-side spending limits remain necessary for independently billed infrastructure and other users of shared accounts.

## Operational recovery

Do not delete a pending/unknown effect to retry a provider request. Reconcile its stable identity against the provider first. An empty eventually consistent list is not proof that a submission failed. Unknown supplier or advertising charges keep their reservations. Restore backups into an isolated database and reconcile with authoritative Shopify, supplier, payment and publishing records before resuming.

The deployment is a single small-business operations service. Audit/job history currently shares a serialized PostgreSQL state row for atomicity; introduce archival/partitioning before large volumes. Database locking is intentionally brief and excludes external API calls. Per-provider submission locks additionally serialize non-idempotent writes.
