# Deployment and operations

The repository runs locally without credentials. A real launch is a separate configuration and acceptance step: connect Shopify, durable security storage, delivery services, legal content and operational monitoring before accepting orders.

## Local development

Install Node.js 24 and pnpm 11.25.0, then run:

```sh
pnpm install
pnpm dev
```

Visit `http://127.0.0.1:3000/sv`. Development defaults to mock commerce, process-local security adapters and mock form delivery. No environment file is required. The mock checkout collects no payment and creates no order. Optional analytics providers remain off without configuration and consent.

To configure a provider, copy `.env.example` to `.env.local` using your editor or file manager. Keep that file untracked. Public `NEXT_PUBLIC_*` values are embedded at build time; rebuild after changing them.

### Viewing through an HTTP-only preview tunnel

Set `NEXT_PUBLIC_SITE_URL` to the tunnel's HTTPS origin and `NOORLY_DEV_PREVIEW_HOST` to its exact hostname (without a scheme or port), then run `pnpm dev`. This development-only option allows that preview origin and disables React's development debug channel, keeping hydration data on HTTP. Without it, a tunnel that cannot forward the debug WebSocket can show server-rendered posters while interactive scenes never start. Normal local development and production keep their existing configuration. Live code updates still require WebSocket forwarding; reload the preview after editing.

## Verification before deployment

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit --prod --audit-level high
```

Linux CI installs browser system dependencies using `pnpm exec playwright install --with-deps chromium`. Playwright starts `pnpm dev`, so browser tests exercise working mock mutations without production services. CI uses Node 24, the pinned pnpm release and the committed lockfile. Review dependency scan results and apply updates deliberately.

## Explicit production-build preview

`next build`/`next start` run in production mode. A mock deployment therefore needs explicit preview values. Set these in your platform environment or an untracked `.env.local`:

```dotenv
NEXT_PUBLIC_COMMERCE_PROVIDER=mock
ALLOW_MOCK_COMMERCE=true
DEPLOYMENT_ENV=preview
CART_COOKIE_SECRET=REPLACE_WITH_A_RANDOM_PREVIEW_SECRET_OF_32_OR_MORE_CHARACTERS
NEXT_PUBLIC_SITE_URL=https://YOUR-PREVIEW-HOST
```

Then:

```sh
pnpm build
pnpm start
```

Use the actual host URL; production mutation checks match it exactly. A local production process can use `http://localhost:3000` when explicit mock mode is enabled, but Secure cookies require HTTPS for reliable cart operation. Use `pnpm dev` for the normal local shopping flow.

**Preview opt-in does not disable production security.** A hosted production-mode preview still needs Redis for form/cart mutations, and a form receiver for delivery. Without those services, browsing works while mutations fail safely. Keep `DEPLOYMENT_ENV=preview` and mock mode out of search indexing. The committed CI dummy cart secret is for disposable checks only; generate a different random secret for every deployed environment.

## Real production configuration

| Area               | Required configuration and verification                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity           | Final brand/company/contact/address values in `brand.ts`; HTTPS `NEXT_PUBLIC_SITE_URL` equal to the public canonical origin                 |
| Commerce           | `NEXT_PUBLIC_COMMERCE_PROVIDER=shopify`, `ALLOW_MOCK_COMMERCE=false`, valid domain/token/version, published catalogue and SEK market        |
| Indexing           | `DEPLOYMENT_ENV=production` only after the real Shopify storefront, canonical URLs and legal/content review are ready                       |
| Cart integrity     | Unique random `CART_COOKIE_SECRET` of at least 32 characters, stored server-side                                                            |
| Durable security   | HTTPS `RATE_LIMIT_PROVIDER_URL` and `RATE_LIMIT_PROVIDER_TOKEN` for a compatible Redis REST service supporting the implemented commands/Lua |
| Forms              | HTTPS `FORM_DELIVERY_URL`, server-only `FORM_DELIVERY_TOKEN`, and a receiver honoring `Idempotency-Key`                                     |
| Paid-order events  | Shopify signing secret, configured analytics destination(s), random 32+ character `OUTBOX_CRON_SECRET`, authenticated POST scheduler        |
| Optional analytics | Actual reviewed GA4/PostHog project settings, regional endpoint and consent/retention policy                                                |
| Monitoring         | Log collection, alerts and a reviewed error-reporting adapter; Sentry requires SDK installation/configuration                               |

The validated environment list is `.env.example` and `src/lib/env/schema.ts`. Invalid production configuration fails safely rather than silently selecting mock commerce. Server integrations must use HTTPS in production. Never expose server credentials through `NEXT_PUBLIC_*`.

### Shopify and hosted checkout

Follow [commerce setup](commerce.md) to publish products and set category/season/eligibility tags and matching handles. The adapter queries Swedish and English presentation, paginates products/collections and validates provider payloads. Confirm real storefront access for each queried field and the configured Storefront API version (`2026-07` by default).

Test availability, variant selection, cart creation/persistence, bundle attributes, editing, shipping/tax presentation and the provider checkout URL with the actual store. Final pricing and stock are Shopify's authority. The checkout allowlist currently expects Shopify domains; review it if your shop uses a custom checkout domain. Never work around it by permitting arbitrary redirect hosts.

### Webhooks and purchase outbox

1. Register Shopify `orders/paid` delivery to `https://YOUR-DOMAIN/api/webhooks/shopify` with the correct signing secret in `SHOPIFY_WEBHOOK_SECRET`.
2. Verify invalid HMACs and wrong shop domains are rejected, authenticated irrelevant topics are ignored, and confirmed paid orders with consent are durably enqueued. Test orders are intentionally ignored for analytics.
3. Configure GA4 server credentials, PostHog, or the vendor-neutral HTTPS analytics relay. A relay must honor the supplied idempotency key.
4. Schedule a worker capable of authenticated **POST** every minute:

```sh
curl --fail --request POST \
  --header "Authorization: Bearer ${OUTBOX_CRON_SECRET}" \
  https://YOUR-DOMAIN/api/webhooks/drain
```

Store the bearer token in the scheduler's secret storage. No public browser should invoke this worker. The default drain processes a bounded batch; failed providers remain pending. Set alerts on scheduler heartbeat, old/large queues and repeated retry codes. Confirm receipt in the destination and reconcile against Shopify orders. At-least-once external delivery can repeat after a crash; stable transaction IDs and provider idempotency remain necessary. See [security](security.md) and [analytics](analytics.md).

### Forms and abuse controls

The form receiver accepts a server-authenticated JSON submission and stable `Idempotency-Key`. It must deduplicate retries and perform actual CRM/email delivery, retention and subscription verification. Development without a receiver returns an explicit mock acknowledgement; production without one returns 503. The honeypot is a spam protection seam, not a complete bot-management service.

Configure the hosting proxy to overwrite `x-forwarded-for` and prevent direct untrusted access to it; the implemented rate keys rely on that trusted boundary. Redis failure intentionally blocks public mutations. Decide operationally whether adding a reviewed durable fallback is appropriate; do not replace this with per-instance production counters.

## Vercel

1. Import the GitHub repository as a Next.js project. The repository root contains `package.json`; no monorepo root override is needed.
2. Select Node.js 24. Use `pnpm install --frozen-lockfile` and `pnpm build`.
3. Set separate Preview and Production environment values. Leave previews unindexable and explicitly mock, or connect a dedicated test store. Do not reuse production secrets in untrusted preview environments.
4. Provision the Redis REST store and server-side delivery receiver. Configure the authenticated POST scheduler for the outbox.
5. Attach the final HTTPS domain, update `NEXT_PUBLIC_SITE_URL`, rebuild, and run live smoke tests. Preview URLs must have their own matching origin if mutations are enabled.
6. Review CSP errors, cookies, checkout redirects, form delivery, logs and provider requests. Enable indexing only after all launch gates pass.

Do not apply shared HTML caching to dynamic pages with request-specific CSP nonces. Product media may be CDN-cached independently. Adding external fonts/media/analytics requires deliberate CSP and image allowlist updates.

## Portable Node hosting

The application does not require Vercel APIs. Build on Node 24 with the locked dependencies, provide server environment variables, and run the Next Node server behind a trusted HTTPS proxy. For a container listening beyond loopback:

```sh
pnpm build
pnpm exec next start --hostname 0.0.0.0 --port 3000
```

Ship the normal Next build, runtime dependencies and `public/` assets. This repository does not enable standalone output or include a container image. Configure health checks, request timeouts, secret injection, persistent external Redis and a worker scheduler in the hosting environment.

## Health, release and rollback

`GET /api/health` checks environment validity and liveness. It does not prove Shopify, Redis, form delivery or analytics health. Add private dependency probes and alert on configuration errors, mutation 503s, webhook enqueue failures and oldest outbox age.

Before a release, run CI plus manual mobile/keyboard/screen-reader testing and the [launch checklist](launch-checklist.md). Keep a previous validated deployment available. Roll back application code and public assets together; version media filenames to prevent stale seasonal scenes. Preserve external cart/outbox data during rollback. Rotating the cart signing key expires existing cart references; coordinate that as an intentional security action.

## Performance budgets

| Measure            | Target and verification                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| LCP                | ≤2.5 seconds at the 75th percentile on representative production devices/connections |
| INP                | ≤200ms; verify scrolling, drawer opening, cart actions and builder steps             |
| CLS                | ≤0.1; reserve media dimensions and sticky viewport geometry                          |
| First poster       | Desktop ≤180KB; mobile ≤100KB where practical                                        |
| Each silent video  | Desktop ≤5MB; mobile ≤2.5MB, separate compositions and frequent keyframes            |
| Video fetch policy | Current/imminent scene only; no reduced-motion/Save-Data video request               |
| Optional analytics | No script/request/storage before relevant consent                                    |

These are budgets, not measured field claims. Audit the actual production catalogue, poster/video files and browser bundles. Keep catalogue rendering on the server, defer noncritical interaction code, and profile before adding providers. See [media pipeline](cinematic-media.md).
