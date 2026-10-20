# NOORLY · seasonal gifting

A typed Next.js foundation for a small Scandinavian gifting brand: a cinematic seasonal storefront, three curated boxes, a guided gift-box builder, Swedish and English content, a persistent cart, and provider-hosted checkout. **NOORLY is the chosen brand for noorly.se. Products, artwork, reviews, company details and legal copy are fictional launch placeholders.**

The local mock shopping flow works without external credentials. The Shopify adapter and operational interfaces are implemented, but a real launch still requires live integration verification, production services, final content and legal review. No card details are collected by this application.

The intended domain is **noorly.se**. See [Noorly setup status](docs/noorly-setup.md) and `.env.production.example` for the domain-specific connection steps and the account access still needed.

## Run locally

Use Node.js 24 and pnpm 11.25.0. Install the package manager through your preferred Node tooling, then:

```sh
pnpm install
pnpm dev
```

Open [the Swedish storefront](http://127.0.0.1:3000/sv) or [English storefront](http://127.0.0.1:3000/en). `/` redirects to Swedish. No `.env.local` is needed for development. Add products, configure a box, refresh the page, review the grouped cart and continue to the clearly marked mock checkout. The mock checkout takes no payment and creates no order.

Copy `.env.example` to `.env.local` only when overriding defaults or connecting providers. Do not commit real credentials.

## What is included

- Seasonal home page with two editorial winter scenes, optional bidirectional scroll video, product hotspots, an accessible product drawer and a visible skip action. Static posters preserve shopping when media is absent, reduced motion is enabled, or bandwidth is constrained.
- A small shop, seasonal collection, product pages, three curated boxes and a six-step custom builder with stock/count rules, optional card, sanitized 280-character gift message, persistence and bundle grouping.
- Cart edits, quantities, bundle removal/reconfiguration, availability checks and duplicate-request protection before hosted checkout.
- Corporate and newsletter forms with strict server validation, consent, a honeypot, rate limiting, idempotency and a replaceable delivery adapter.
- Equal-priority accept/reject consent controls, optional GA4/PostHog adapters, a typed event taxonomy and a verified paid-order analytics outbox.
- Locale-aware metadata, canonical/alternate links, structured data, sitemap/robots controls, request CSP nonces, secure headers and redacted operational errors.
- Unit/component tests, Playwright shopping/accessibility checks, dependency scanning and GitHub Actions CI.

## Architecture and module inventory

Next.js App Router renders catalogue/content pages on the server. Client components own the cart, builder, consent, drawers and cinematic interaction. Domain types isolate presentation from `CommerceProvider` and `ContentRepository` interfaces. Local content can move to a CMS, and Shopify can be replaced through an adapter.

Read [architecture](docs/architecture.md) for boundaries and data flow, and [implementation inventory](docs/implementation-inventory.md) for the route/module map. The central working brand configuration is `src/config/brand.ts`; translated general copy is in `src/content/translations/`.

## Environment and production configuration

`.env.example` lists the complete configuration. Optional analytics variables are unnecessary locally.

| Purpose                      | Variables                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public identity/localization | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_DEFAULT_LOCALE`                                                                                          |
| Commerce mode                | `NEXT_PUBLIC_COMMERCE_PROVIDER=mock` locally; `shopify` for a real launch                                                                                               |
| Production safety            | `CART_COOKIE_SECRET` with 32+ random characters, `ALLOW_MOCK_COMMERCE=false`, `DEPLOYMENT_ENV=production` only for the intended indexable production site               |
| Shopify                      | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_STOREFRONT_API_VERSION`, `SHOPIFY_WEBHOOK_SECRET`                                                   |
| Durable security/outbox      | `RATE_LIMIT_PROVIDER_URL`, `RATE_LIMIT_PROVIDER_TOKEN`, `OUTBOX_CRON_SECRET`                                                                                            |
| Form delivery                | `FORM_DELIVERY_URL`, `FORM_DELIVERY_TOKEN`                                                                                                                              |
| Optional analytics           | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, optional `ANALYTICS_DELIVERY_URL`/`ANALYTICS_DELIVERY_TOKEN` |
| Monitoring integration seam  | `NEXT_PUBLIC_SENTRY_DSN`, build-only `SENTRY_AUTH_TOKEN`; install/configure the SDK before enabling it                                                                  |

Production mock mode requires explicit `ALLOW_MOCK_COMMERCE=true` and a cart secret. This is an unindexable preview, not a shop launch. Production mutations still require the durable security store. Development uses process-local security adapters and signed mock carts. See [deployment](docs/deployment.md) for exact build, preview and Vercel instructions.

Never put webhook secrets, private Storefront tokens, Redis credentials, delivery tokens, GA4 server secrets or Sentry authentication tokens in `NEXT_PUBLIC_*` variables.

## Connect Shopify, checkout and webhooks

1. Configure a Shopify storefront application with access to the catalogue, variants, inventory availability and carts used by the adapter.
2. Set `NEXT_PUBLIC_COMMERCE_PROVIDER=shopify`, the `shop-name.myshopify.com` domain, Storefront token and API version. The implemented default version is `2026-07`.
3. Publish the real products/collection and map handles, category/season tags, box eligibility, variants, SEK prices and translations as described in [commerce setup](docs/commerce.md).
4. Set the production HTTPS site URL and cart secret; provision Redis and the form receiver. Test stock, bundles, taxes, shipping, discounts and hosted checkout against the actual store.
5. Subscribe Shopify `orders/paid` to `https://YOUR-DOMAIN/api/webhooks/shopify`, configure the correct signing secret, and schedule authenticated `POST /api/webhooks/drain` to deliver consented purchase events. See [security and webhook operations](docs/security.md).

Checkout redirects to the provider's validated HTTPS URL. The browser never emits `purchase`; only an authenticated, confirmed paid order with the required consent attributes can queue it. Test orders and mock checkout do not create purchase analytics.

## Configure analytics and privacy

Leave provider variables empty to disable optional analytics. For GA4, set the public measurement ID and server API secret for paid-order delivery. For PostHog, set the project key and its ingestion host; choose the correct regional host. Add the outbox worker and monitor retries before depending on purchase reports.

Providers load/send only after analytics consent. Marketing is a stored preference with no advertising integration. Events have an allowlisted schema that excludes personal details and gift-message text. See [event taxonomy and setup](docs/analytics.md), [privacy behavior](docs/privacy.md) and [security](docs/security.md). Sentry is a redacted error-reporting seam; its SDK is not installed.

## Replace media or extend content

The daily Instagram and Facebook agent selects approved briefs, drafts and
reviews Swedish captions, and journals publishing results in Redis. It is
disabled until real media and publishing credentials are configured. See
[daily social agent setup and recovery](docs/daily-social-agent.md).

- **Cinematic media:** put the separate mobile/desktop MP4s and WebP posters at the paths in `winter-scenes.ts`. The video paths intentionally have no final video assets. See [media pipeline, budgets and replacement](docs/cinematic-media.md).
- **New season:** add a typed `Season` and `CinematicScene[]`, update `LocalContentRepository` to select it, and supply localized editorial copy, theme, products and curated boxes. See [content management](docs/content-management.md).
- **New hotspot:** add a typed hotspot with its product handle, stable progress interval, responsive normalized coordinates and translated accessible label to a scene. The entrance scene intentionally has none.
- **New product or curated box:** replace/extend mock catalogue content locally or publish the corresponding real Shopify product, then register its handle in the seasonal content and templates. Builder selection rules remain data-driven. See [commerce](docs/commerce.md) and [content management](docs/content-management.md).

## Checks and test results

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
```

On Linux CI, install browsers using `pnpm exec playwright install --with-deps chromium`. Playwright starts a development server so the complete mock flow needs no production Redis credentials. Tests cover commerce mapping, bundles, signed-cart tampering/expiry, scene progress, hotspot keyboard behavior, drawer focus restoration, consent, analytics, webhook verification and key shopping routes. The repository's CI checks the locked dependencies, formatting, lint, typing, tests, an explicitly configured preview production build and browser tests. Current run results are reported by CI and the accompanying delivery summary; re-run after configuring live services.

`pnpm check` additionally includes a production build. Supply the explicit preview environment described in [deployment](docs/deployment.md), or your real production configuration, before using that combined command. CI uses a clearly marked dummy preview cart secret; never reuse it for a deployment.

## Known limitations and launch gate

Final winter videos are intentionally absent. Static artwork and catalogue data are placeholders; no real customer reviews or delivery claims should be inferred. Shopify checkout, fulfilment, stock and localization need a real-store acceptance pass. The local form mock acknowledges submissions without delivering them. Production form delivery, Redis, paid-order scheduling, monitoring, legal content, company identity and customer-service details must be supplied.

The purchase outbox uses at-least-once delivery with stable provider IDs, not an exactly-once guarantee. Operations must monitor queue age, retry failures and reconcile paid orders. Sentry, CRM/email delivery, a CMS and fulfilment are integration seams, not installed third-party services. Automated accessibility checks support, but do not replace, manual keyboard/screen-reader and device testing.

Use the [launch checklist](docs/launch-checklist.md), [deployment guide](docs/deployment.md), and provider-specific documentation before opening a real store.
