# Security and operations

## Configuration and secrets

`src/lib/env/schema.ts` validates selected provider configuration with Zod. Server environment reads are isolated behind `server-only`. Validation happens when used so importing a module during a build does not require live credentials. Invalid configuration errors identify field names and never disclose values. Local development defaults to mock commerce. Production requires an explicit commerce choice, a 32+ character cart signing secret, and `ALLOW_MOCK_COMMERCE=true` for a deliberately marked preview. A real Shopify launch uses HTTPS and `ALLOW_MOCK_COMMERCE=false`.

Keep private Storefront tokens, webhook secrets, Redis tokens, delivery tokens, GA4 API secrets and monitoring auth tokens in server environment variables. Never add them to `NEXT_PUBLIC_*`. Public analytics project IDs and browser DSNs are identifiers, not private auth credentials. Restrict their projects as appropriate. Rotate secrets through the deployment platform; changing a cart signing secret invalidates existing signed carts.

## Requests

Public JSON mutations use strict Zod schemas, content-type checks, streaming byte limits, same-origin checks and rate limiting. Production origins must equal `NEXT_PUBLIC_SITE_URL`; forwarded origin headers are never trusted for CSRF approval. API errors are codes plus request IDs, without stack traces or raw provider errors. Next/React render gift messages as text; never use `dangerouslySetInnerHTML` for user content.

Forms accept an explicit checked consent boolean, empty honeypot and UUID submission ID. Submission tokens are scoped by form kind and hashed before storage. An in-flight duplicate receives 409; a completed duplicate returns the existing success. Failed deliveries release their claim so retries can proceed. The configured receiver **must honor the supplied `Idempotency-Key`**: a network timeout can occur after the receiver committed the delivery. Connect your CRM/email provider behind that adapter; include its own spam and double-opt-in workflow as required.

Production public mutations fail closed with 503 without a functioning durable Redis REST service. Development uses process-local counters and idempotency records for convenience only. On Vercel or another proxy, configure the trusted proxy to **overwrite** `x-forwarded-for`; do not expose a path allowing the caller to choose this header. IPs are SHA-256 hashed in short-lived abuse-prevention keys. Review whether a keyed hash or provider-specific trusted client IP header is needed for your threat model.

## Browser policies

`src/proxy.ts` issues a fresh nonce per page request and passes the CSP in both request and response headers. Locale layouts use dynamic rendering; HTML with per-request nonces must not be cached across users. Framework scripts and root JSON-LD receive that nonce. Production scripts allow nonce-authorized execution and strict dynamic loading. Development permits `unsafe-eval` for Next development tooling. Inline styles remain enabled for React/CSS-driven positioning; inline scripts do not. CSP hosts for PostHog and Sentry come only from configured public endpoints; Shopify images use its CDN. If adding a media CDN, update `media-src` and remote-image allowlists deliberately.

Headers include HSTS in production, frame denial, `nosniff`, strict-origin referrers and restrictions on camera/microphone/geolocation/payment APIs. Hosted Shopify checkout is a browser navigation; no embedded card fields or Payment Request API are needed.

## Paid-order webhook

Register Shopify **orders/paid** HTTPS delivery to `/api/webhooks/shopify` and configure the subscription's correct signing secret. See [Shopify webhook verification](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries). The route reads at most 1 MiB of raw bytes, validates base64 SHA-256 HMAC in constant time, checks the exact configured shop domain, confirms the paid topic and `financial_status: paid`, and excludes test/mock orders. Unknown topics are safely ignored after authentication. Never verify a reserialized JSON body.

A minimally allowlisted, consented purchase envelope is stored using one Redis Lua operation that creates both the dedupe marker and pending outbox entry. A failed durable enqueue returns 503 so Shopify retries. Repeated deliveries are deduplicated by hashed shop + order identity, even when delivery IDs differ. No customer payload or raw webhook is retained or logged. Dedupe retention is 180 days; archival/reconciliation requirements beyond that must be designed before launch.

Schedule authenticated `POST /api/webhooks/drain` every minute with `Authorization: Bearer $OUTBOX_CRON_SECRET` (32+ random characters). Worker failures preserve pending entries. Each provider's completion is checkpointed so successful providers are not normally retried after another fails. A crash after external acceptance but before checkpointing can still cause a repeat: GA4 uses a stable transaction ID, PostHog uses `$insert_id`, and a custom relay must implement idempotency. This is at-least-once delivery, never a claim of exactly-once external delivery. No providers configured means the pending entries remain queued. Alert on backlog age/size, repeated failures and missing scheduler heartbeats. Reconcile provider totals with Shopify; GA4 accepting HTTP 2xx does not guarantee every event passes ingestion validation.

The public webhook is HMAC authenticated instead of same-origin checked. The worker uses a private bearer token. Public form/cart rate limits do not block authenticated webhook retries.

## Monitoring

`src/instrumentation.ts` handles Next request errors through `captureApplicationError`. Its default is a redacted structured operational log. `registerErrorReporter` is an integration seam: the Sentry SDK is **not installed or activated**. To enable it, install the current official Next SDK, configure server/client initialization, disable default PII, scrub URLs/query strings/form bodies/headers/gift messages in `beforeSend`, and register its server capture function with the seam. Review monitoring storage and consent requirements first. Keep `SENTRY_AUTH_TOKEN` build-only for source maps; do not send it to a client.

`GET /api/health` checks selected environment validity and exposes no configuration or secrets. It is a liveness/configuration endpoint, not a live Shopify/Redis readiness check. Add private dependency probes and alerts in deployment operations. Logs contain codes and generated request/event IDs, never raw errors, response bodies, secrets or form/customer content. Keep logs access-controlled with an explicit retention policy.

CI installs the locked dependency graph, runs checks and scans dependency vulnerabilities. Review and update packages deliberately; dependency scanning can report vulnerabilities that need human assessment and an upstream patch.
