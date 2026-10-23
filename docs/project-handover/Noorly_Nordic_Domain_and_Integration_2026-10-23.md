# Noorly domain and integration checkpoint — 23 October 2026

The owner reports purchasing **noorlynordic.com** through Squarespace. The intended storefront origin is `https://noorlynordic.com`, with `www` redirecting to it and Shopify checkout at `https://checkout.noorlynordic.com`. The brand remains **NOORLY**. This supersedes earlier choices of noorly.se and shopnoorly.com as the intended canonical storefront; historical purchasing and research records remain unchanged.

## Domain cutover

The code permits the exact new HTTPS checkout origin alongside the existing Shopify hosts and `https://checkout.noorly.se`. Custom origins reject user credentials, nondefault ports, HTTP, lookalikes and unrelated subdomains. This is not evidence of DNS, TLS or Shopify primary-domain activation.

Connect the apex and `www` to the existing Vercel project using its exact displayed DNS records. Connect `checkout` to Shopify using the records Shopify supplies. Verify public DNS and HTTPS for each destination before changing Production `NEXT_PUBLIC_SITE_URL` to `https://noorlynordic.com` and rebuilding. Preserve Preview values. Recheck same-origin forms/admin access, canonical metadata, redirect behavior and the closed-store gates after deployment. Make the checkout domain primary only after Shopify verification.

No mailbox was created. `src/config/brand.ts` still has explicit `hello@example.com` support placeholders; do not replace them with an invented address. Confirm a working mailbox, legal identity and address before releasing the store. Do not delete the older noorly.se registration or records as part of this code change.

## Verified connection checkpoint

Before the new-domain cutover, Production deployment `36dCh7u5nVMEbG3j8bNEP5KArRuE` on commit `25790307c39c92524e5af1a68c7fb1160d416c47` passed on the existing Vercel alias:

- `GET /api/health` returned 200. The schema validates the required settings and cart-secret minimum length without exposing values.
- One deliberately invalid empty `POST /api/forms` returned `400 INVALID_FORM`. That path first executes the Redis rate-limit operation, so the native Upstash REST connection and write succeeded. No customer information, valid submission, cart or order was created.
- A fresh authenticated `/sv/build-a-box` request rendered normally with an empty catalogue. The dynamic page awaits uncached Swedish and English Shopify reads and propagates provider errors; this verifies the configured Storefront read connection, not the unpublished bundle.
- Anonymous bundle access redirected to `/admin-preview`; `/api/cart` returned `storeClosed: true`; robots disallowed indexing.

Production uses `shopify`, `ALLOW_MOCK_COMMERCE=false` and `DEPLOYMENT_ENV=production`, with `NOORLY_STOREFRONT_OPEN=false` and `NEXT_PUBLIC_PRODUCT_TEST_MODE=true`. Preview retains its separate mock settings. Headless auto-publication is disabled. Upstash uses the free Frankfurt plan through its matched native REST pair; no credentials are recorded here.

## Remaining launch work

The planned 799 SEK Ljusstund bundle remains Shopify draft product `11395078259030`, variant `56006367281494`, with tracked inventory zero, overselling denied and no publication. Its website route is a deliberately non-purchasable presentation; see [the bundle release notes](../launch-bundle-preview.md).

New-product API mapping, supplier approval, stock/presale terms, complete legal/contact content, final imagery, checkout/payment/tax/refund/fulfilment checks and payout setup remain unresolved. Shopify displayed accepting payments but unable to receive payouts; the owner deferred bank-account entry. Neither domain ownership nor the verified API connections establish sales readiness. Keep both store gates closed until a separate reviewed launch.
