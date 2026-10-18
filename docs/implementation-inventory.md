# Implementation inventory

This is a map of the implemented foundation and the files to change for common work. NOORLY, catalogue records, legal content and media are replaceable placeholders; a listed integration seam does not imply the external service is connected.

## Routes

All customer pages support `sv` and `en` through `src/app/[locale]/`. Unknown locales, product/collection handles and information slugs resolve to custom not-found pages.

| URL                                                         | Source                                           | Purpose                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `/`                                                         | `src/app/page.tsx`                               | Swedish storefront redirect                                                                       |
| `/{locale}`                                                 | `src/app/[locale]/page.tsx`                      | Cinematic home, curated boxes, builder, trust/delivery/reviews placeholders and corporate callout |
| `/{locale}/shop`                                            | `src/app/[locale]/shop/page.tsx`                 | Small catalogue and simple category/price/occasion filters                                        |
| `/{locale}/collections/{handle}`                            | `src/app/[locale]/collections/[handle]/page.tsx` | Configured seasonal collection; winter initially                                                  |
| `/{locale}/products/{handle}`                               | `src/app/[locale]/products/[handle]/page.tsx`    | Product, variants, stock, delivery/material placeholders and related gifts                        |
| `/{locale}/build-a-box`                                     | `src/app/[locale]/build-a-box/page.tsx`          | Guided builder; `?product=` preselection and `?edit=` bundle edit                                 |
| `/{locale}/cart`                                            | `src/app/[locale]/cart/page.tsx`                 | Grouped cart, message summary, edit/remove and hosted checkout command                            |
| `/{locale}/corporate-gifting`                               | `src/app/[locale]/corporate-gifting/page.tsx`    | Corporate enquiry form                                                                            |
| `/{locale}/mock-checkout`                                   | `src/app/[locale]/mock-checkout/page.tsx`        | Clearly marked demonstration; no payment/order                                                    |
| `/{locale}/about`, `/faq`, `/shipping-returns`              | `src/app/[locale]/[page]/page.tsx`               | Localized story, FAQ and draft shipping/returns information                                       |
| `/{locale}/privacy`, `/cookies`, `/terms`, `/accessibility` | `src/app/[locale]/[page]/page.tsx`               | Localized draft policies and accessibility statement                                              |
| `/api/cart`                                                 | `src/app/api/cart/route.ts`                      | Necessary cart retrieval and validated mutation boundary                                          |
| `/api/forms`                                                | `src/app/api/forms/route.ts`                     | Validated newsletter/corporate delivery with abuse/idempotency controls                           |
| `/api/webhooks/shopify`                                     | `src/app/api/webhooks/shopify/route.ts`          | HMAC-authenticated paid-order handling                                                            |
| `/api/webhooks/drain`                                       | `src/app/api/webhooks/drain/route.ts`            | Private bearer-authenticated purchase-outbox worker                                               |
| `/api/health`                                               | `src/app/api/health/route.ts`                    | Redacted liveness/configuration response                                                          |
| `/robots.txt`, `/sitemap.xml`                               | `src/app/robots.ts`, `src/app/sitemap.ts`        | Environment/provider-aware indexing and localized routes                                          |

`src/app/layout.tsx` owns document metadata/language and base styling. `src/app/[locale]/layout.tsx` provides locale validation, cart context, skip navigation, layout, analytics and consent. Root/locale `not-found.tsx` and locale `error.tsx` provide graceful states.

## Brand, catalogue and seasonal content

| Files                               | Responsibility                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/config/brand.ts`               | Working identity, support/address/social/logo placeholders, locale/currency, tokens, gift-message limit and seasonal settings |
| `src/content/translations/index.ts` | Swedish/English general interface, route and policy copy                                                                      |
| `src/content/products.ts`           | Ten fictional products, prices, images, stock/variants, eligibility and fulfilment placeholders                               |
| `src/content/seasons/winter.ts`     | Initial season, three curated templates, featured handles, theme and editorial metadata                                       |
| `src/types/content.ts`              | `Season`, `GiftBoxTemplate`, scene/hotspot exports and `ContentRepository`                                                    |
| `src/lib/content/index.ts`          | Initial local content adapter; replace here for a CMS                                                                         |
| `src/types/commerce.ts`             | Provider-neutral products, money, variants, collections, cart and provider interface                                          |
| `public/media/`                     | Replaceable seasonal posters and product artwork; final video paths are intentionally unfilled                                |

## Shopping and interaction

| Files                                                        | Responsibility                                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `src/components/layout/{header,footer}.tsx`                  | Responsive navigation, locale switch, cart link, footer, newsletter and cookie settings |
| `src/components/product/{product-card,product-purchase}.tsx` | Catalogue card and product selection/actions                                            |
| `src/components/commerce/add-to-cart.tsx`                    | Reusable cart action and feedback                                                       |
| `src/features/cart/{cart-provider,cart-view}.tsx`            | Serialized client commands/state, grouped display, message, edits and checkout redirect |
| `src/features/box-builder/box-builder.tsx`                   | Six-step selection, local draft, review and bundle creation/editing                     |
| `src/features/box-builder/validation.ts`                     | Selection rules, availability/eligibility, totals, sanitized messages and bundle lines  |
| `src/components/forms/enquiry-form.tsx`                      | Accessible corporate/newsletter interaction and feedback                                |
| `src/styles/globals.css`                                     | Responsive editorial layout, typography, tokens, focus and component styling            |

## Cinematic experience

| Files                                                           | Responsibility                                                                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/components/cinematic/cinematic-experience.tsx`             | Reusable localized scene orchestration, static HTML shopping routes, drawer selection and cinematic events |
| `src/components/cinematic/hotspot-button.tsx`                   | Progress-driven semantic product button, responsive positions and impressions                              |
| `src/components/cinematic/product-drawer.tsx`                   | Radix modal drawer, focus restoration, variants/stock, cart and builder actions                            |
| `src/components/cinematic/cinematic.css`                        | Cinematic/editorial responsive styles and drawer presentation                                              |
| `src/features/seasonal-experience/types.ts`                     | Scene, hotspot, media and replaceable `MediaScrubber` contracts                                            |
| `src/features/seasonal-experience/winter-scenes.ts`             | Entrance with no hotspots and candle-room configuration                                                    |
| `src/features/seasonal-experience/copy.ts`                      | Swedish/English cinematic interface copy                                                                   |
| `src/features/seasonal-experience/use-scene-media.ts`           | Intersection/loading/preferences, active-only scroll and bounded animation work                            |
| `src/features/seasonal-experience/{progress,video-scrubber}.ts` | Pure progress mapping, hotspot interval tests and bidirectional video seeking                              |

## Commerce adapters and server validation

| Files                                                     | Responsibility                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/lib/commerce/index.ts`                               | Server-only provider selection                                                           |
| `src/lib/commerce/{validation,errors,cart-cookie}.ts`     | Runtime cart/bundle rules, safe commerce codes and signed Shopify cart references        |
| `src/lib/commerce/providers/mock/{index,cookie}.ts`       | Local provider, catalogue reconstruction and size-limited signed cart state              |
| `src/lib/commerce/providers/shopify/index.ts`             | Storefront requests, pagination, language contexts, carts, availability and checkout URL |
| `src/lib/commerce/providers/shopify/{queries,mapping}.ts` | GraphQL operations and Zod-validated domain mapping                                      |
| `src/lib/utils/money.ts`                                  | SEK locale formatting and integer-öre arithmetic                                         |

## Consent, analytics and observability

| Files                                                          | Responsibility                                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/components/consent/{consent-banner,copy}.tsx` / `.ts`     | Accessible banner/preferences and centralized copy                                       |
| `src/components/analytics/{analytics-provider,track-view}.tsx` | Route/consent coordination and typed view events                                         |
| `src/lib/analytics/consent.ts`                                 | Versioned expiring preferences and safe storage                                          |
| `src/lib/analytics/schema.ts`                                  | Central event names and property allowlist                                               |
| `src/lib/analytics/client.ts`                                  | Consent-gated GA4/PostHog/debug dispatch, dedupe, anonymous session and attribution      |
| `src/lib/analytics/outbox.ts`                                  | Durable paid-event enqueue, destination adapters, checkpointed retries and bounded drain |
| `src/lib/security/observability.ts`, `src/instrumentation.ts`  | Redacted request error reporting and optional SDK integration seam                       |

## Security, environment and SEO

| Files                                                              | Responsibility                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `src/lib/env/{schema,server}.ts`, `.env.example`                   | Runtime configuration validation and server-only reads                                |
| `src/lib/security/request.ts`                                      | Origin checks, streaming body limits, JSON validation, rate limits and safe responses |
| `src/lib/security/{redis,idempotency}.ts`                          | Durable service boundary and duplicate form handling                                  |
| `src/lib/security/forms.ts`                                        | Strict consented corporate/newsletter input schemas                                   |
| `src/lib/security/webhook.ts`                                      | Raw-body Shopify HMAC verification                                                    |
| `src/lib/security/csp.ts`, `src/proxy.ts`, `next.config.ts`        | Fresh page nonces, explicit content sources and security headers                      |
| `src/lib/seo/metadata.ts`, `src/components/ui/structured-data.tsx` | Locale-aware metadata and safely serialized nonce-bearing JSON-LD                     |

## Verification and repository tooling

`tests/unit/` covers money/commerce mapping, bundles, cart validation, signed cookies, analytics, consent, security and cinematic progress. `tests/integration/` covers forms, verified paid-order handling and cinematic keyboard/dialog/cart behavior. `tests/e2e/` and `playwright.config.ts` exercise the critical browsing/shopping/accessibility routes against a local mock development server.

`tests/setup.ts` provides DOM matchers/cleanup and browser mocks; `tests/server-only.ts` is the test-only server-module boundary stub. `vitest.config.*` supplies test aliases/environments. `tsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `postcss.config.mjs`, `package.json` and `pnpm-lock.yaml` define reproducible tooling. `.gitignore` excludes secrets, dependencies, build output, scratch work and test reports.

`.github/workflows/ci.yml` runs locked install, formatting, lint, types, unit/component tests, explicit preview build, Chromium browser checks and production dependency auditing. `.github/dependabot.yml` requests weekly package/action updates. No automatic deployment or production credentials are embedded in CI.

## Documentation

- [README](../README.md): quick start, implemented scope, configuration, extension steps and limitations.
- [Architecture](architecture.md): boundaries, shopping/content/analytics flows and scaling choices.
- [Commerce](commerce.md): Shopify catalogue, tags, carts, checkout and webhooks.
- [Analytics](analytics.md): taxonomy, consent, providers, validation and paid-event operations.
- [Privacy](privacy.md): storage inventory and legal/downstream responsibilities.
- [Security](security.md): validation, CSP, services, webhook guarantees and monitoring seam.
- [Cinematic media](cinematic-media.md): assets, responsive exports, performance, new scenes/hotspots and renderer replacement.
- [Content management](content-management.md): products, boxes, seasons, translations and future CMS integration.
- [Deployment](deployment.md): local/preview/production commands, Vercel/Node hosting, operations and budgets.
- [Launch checklist](launch-checklist.md): concrete integration, content, legal, security and manual QA gates.

The implementation plan is retained in `IMPLEMENTATION_PLAN.md`. Run results belong in CI/release evidence rather than being treated as permanent certification of a future deployment.
