# Implementation plan

The workspace was inspected before editing. It contains no existing application or Git repository, so no code needs preserving.

1. Establish a strict TypeScript / Next.js App Router / pnpm project with typed brand, content, commerce and analytics contracts.
2. Implement a Swedish-first, English-capable editorial storefront, responsive cinematic enhancement, accessible shopping, configurable box builder and grouped cart.
3. Add Shopify and explicit mock adapters, consent-gated analytics, validated forms, raw-body verified paid-order webhooks, security controls and observability hooks.
4. Document integration and launch steps. Run formatting, lint, type checking, meaningful unit/component tests, Playwright with accessibility checks, and a production build.
5. Commit the completed foundation and create a private GitHub repository when authenticated GitHub access is available.

## Assumptions

- STILLA is a temporary, centrally replaceable brand name. All catalogue data is fictional.
- Default locale is sv, alternate en, currency SEK. Winter is the first configured season.
- No final video, legal text, merchant credentials or fulfilment promises are supplied. Use editorial static placeholders and an explicitly identified mock mode; production commerce never silently falls back.
- No third-party analytics or monitoring starts before applicable consent.
- Shopify remains responsible for payment, tax, delivery rates, stock and orders. The mock checkout does not create a payment or purchase event.
- Production must supply durable rate limiting, webhook deduplication/outbox and form delivery adapters; unsafe missing production integrations fail closed.
