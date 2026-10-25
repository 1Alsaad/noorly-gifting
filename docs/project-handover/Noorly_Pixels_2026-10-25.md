# Noorly pixel installation — 25 October 2026

## Verified account state

Owner request: install Meta Ads and Shopify tracking. Existing Meta dataset
511816900240916 (UY Scuti Media Pixel) is the intended dataset; do not create a
duplicate. Meta's host aggregation confirms events from noorlynordic.com. The
production NEXT_PUBLIC_META_PIXEL_ID already uses this ID. The Shopify shop is
107353178454, domain tzwngp-h1.myshopify.com, currency SEK.

## Storefront implementation

- Existing consent-gated Meta PageView, ViewContent and InitiateCheckout retained.
- AddToCart runs only after a successful cart-add response, with selected live
  variant prices, added quantity and SEK value. Adjusted/failed requests, missing
  items, mock IDs and zero/invalid quantities are not tracked. Bundle parent
  prices are counted once. No purchase event is inferred from a checkout click.
- Shopify's official Hydrogen React 2026.4.4 analytics transport is bundled as a
  small, MIT-attributed analytics-only module. No dependency versions changed.
- Shopify page and product views run only on the canonical storefront in Shopify
  commerce mode, after analytics consent. Query/hash data is stripped; referrers
  are origin-only. Admin/account routes, preview hosts and mock products are not
  tracked. No customer identifiers, order data, cart keys or free-text fields are
  added to payloads.
- Noorly-owned consented visitor identifiers expire after 180 days; sessions
  rotate after 30 minutes of inactivity. Revocation deletes these identifiers.
  Shopify-managed cookies are not written. This is storefront-only measurement,
  not a native checkout identity/consent bridge.
- Only Shopify's exact Monorail endpoint is added to connect-src.

## Not completed: checkout/app installation and purchase tracking

Browser access was unavailable. Shopify's app list returned Messaging and the
ChatGPT MCP app, not Facebook & Instagram. No native app or custom checkout pixel
was installed by this change. Production environment metadata has no Meta CAPI
access token, Shopify webhook secret or outbox worker secret. Existing server
purchase code therefore must not be described as active.

The merchant must connect the official Facebook & Instagram sales channel in
Shopify, select the EXISTING pixel 511816900240916 in Settings > Share data
settings, and complete the channel's consent/account confirmation. Start with
Standard sharing; do not silently enable Enhanced/Maximum personal-data sharing.
Do not add a second custom Meta pixel on the same checkout. Native purchase
receipts, consent across checkout and deduplication must then be tested before
paid purchase-optimized campaigns. Never send a fake Purchase to test setup.

Shopify cart/checkout funnel events are not added in this release: cart IDs are
intentionally redacted at the browser API boundary. That protection remains
unchanged. Native checkout reporting is not verified by storefront page views.

## Verification

Local formatting, lint, TypeScript, all 296 unit/component tests and production
preview build passed. New tests cover independent analytics/marketing consent,
revocation, page deduplication, sanitized payloads, mock/admin suppression,
transport failures and successful-cart-only Meta events. PR CI and production
release verification are recorded on the release PR. No real order or payment
was submitted; no prices, inventory, ad budgets or privacy defaults were changed.
