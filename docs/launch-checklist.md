# Launch checklist

This checklist records work required before a real store launch. A passing local mock or CI run does not complete credential-dependent acceptance checks. Assign an owner and record evidence/date for each checked item.

## Identity, content and legal

- [ ] Replace STILLA if needed, legal company/address/support placeholders, social links and customer-service details in central configuration.
- [ ] Replace fictional catalogue, product images/material descriptions, stock, prices, gift packaging and placeholder reviews. Remove unsupported claims.
- [ ] Obtain appropriate rights for final artwork, fonts, product photography and video; review generated static placeholders before any marketing use.
- [ ] Finalize Swedish/English copy, delivery countries/times, returns, customer-service workflow and corporate-gifting process.
- [ ] Have privacy, cookies, terms and consumer information reviewed against the real operation; publish the final legal identity and contact details.
- [ ] Record actual processors, storage/retention, transfers, deletion/withdrawal workflows and newsletter double-opt-in as required.

## Commerce and fulfilment

- [ ] Connect a real Shopify Storefront token/domain/API version and publish the intended SEK catalogue and Swedish/English content.
- [ ] Verify product handles, category/season/box eligibility tags, variants, stock and curated-template references.
- [ ] Test a single item and each curated box end to end, including refresh/persistence, quantity changes and removal.
- [ ] Build small/large custom boxes, exercise minimum/maximum limits, unavailable products, optional card/message, editing and grouped bundle removal.
- [ ] Confirm gift messages and bundle attributes arrive in Shopify and can be consumed by the actual fulfilment process.
- [ ] Verify hosted checkout with real store shipping/tax settings, discounts, payment methods, failure cases and inventory races.
- [ ] Review checkout URL allowlists for the chosen store domain. Confirm no application page collects card details.
- [ ] Conduct an operational order/fulfilment/refund rehearsal using Shopify's supported test workflow; separately validate the paid-event integration without treating ignored test orders as missing analytics.

## Services, security and operations

- [ ] Use HTTPS, the exact public canonical origin, `shopify`, `ALLOW_MOCK_COMMERCE=false`, and unique 32+ character cart signing key.
- [ ] Store server credentials in platform secrets; check the repository and browser output for exposed secrets.
- [ ] Provision production Redis REST storage; verify atomic Lua operations, rate limiting, form idempotency and fail-closed behavior.
- [ ] Ensure the trusted proxy overwrites client-address headers and direct requests cannot forge that boundary.
- [ ] Connect the form delivery receiver and enforce receiver-side idempotency; confirm corporate and newsletter delivery and retry behavior.
- [ ] Register and verify Shopify `orders/paid` HMAC delivery, shop-domain checks, retry behavior, consent attributes and durable dedupe/enqueue.
- [ ] Configure the authenticated outbox POST scheduler, destination credentials, alerts, retention and order reconciliation.
- [ ] Verify CSP/nonces and security headers in the deployed browser. Review new external asset/provider hosts deliberately.
- [ ] Set up redacted log collection, request IDs, access/retention controls and private dependency probes beyond `/api/health`.
- [ ] If enabling Sentry, install/configure the reviewed SDK, scrub PII and validate the reporting seam; environment variables alone do not activate it.
- [ ] Document release rollback and cart-key rotation effects; verify production dependency vulnerability results are resolved or formally assessed.

## Privacy and analytics

- [ ] Verify no optional analytics/marketing requests or identifiers appear before consent or after rejection.
- [ ] Test accept, reject, customize, changed preferences, expired/corrupt preferences and blocked browser storage.
- [ ] Confirm no email, customer name, address, gift-message text or card data appears in analytics/logs.
- [ ] Validate optional GA4/PostHog project region, consent configuration, retention and event payloads.
- [ ] Confirm `purchase` originates only from authenticated confirmed paid-order processing and no mock/browser thank-you route emits it.
- [ ] Check worker retries and provider dedupe IDs; reconcile paid orders and documented checkout-consent snapshots.
- [ ] Implement downstream deletion/suppression processes; cookie withdrawal does not promise retroactive deletion of historical paid events.

## Media, devices and accessibility

- [ ] Replace final mobile/desktop posters and optional silent video exports, with versioned CDN paths and byte-range support.
- [ ] Test forward/reverse seeking, final-frame retention, viewport entry/exit, lazy loading and no offscreen animation work.
- [ ] Confirm entrance has no hotspot; candle hotspot stays aligned and available long enough on real mobile and desktop compositions.
- [ ] Exercise missing-media, reduced-motion, Save-Data/slow connection and JavaScript-disabled conventional shopping links.
- [ ] Complete keyboard-only shopping, visible focus, drawer trap/Escape/restore, builder validation and consent customization.
- [ ] Manually test VoiceOver or NVDA, meaningful image descriptions, cart announcements, error summaries, zoom/reflow and touch hit targets.
- [ ] Run automated accessibility checks; fix applicable findings and separately assess areas automation cannot judge.
- [ ] Measure real production LCP/INP/CLS, poster/video sizes, scrolling performance and initial JavaScript on representative phones.

## Release and indexing

- [ ] Run locked install, format check, lint, typecheck, unit/component tests, production build, Playwright and dependency audit.
- [ ] Validate live critical routes and real-provider smoke tests after deployment; attach the run evidence to the release.
- [ ] Confirm canonical/alternate metadata, structured data, sitemap/robots and social previews use the final HTTPS domain.
- [ ] Keep mocks, staging, previews and incomplete content unindexable. Enable `DEPLOYMENT_ENV=production` only for the approved Shopify launch.
- [ ] Confirm support and fulfilment owners can handle the first real orders, corporate enquiries, delivery failures and refunds.

See [deployment](deployment.md), [commerce](commerce.md), [analytics](analytics.md), [privacy](privacy.md), [security](security.md) and [media](cinematic-media.md) for implementation-specific instructions.
