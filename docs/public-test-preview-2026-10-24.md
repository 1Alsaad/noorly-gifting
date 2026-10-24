# Noorly public read-only test preview — 24 October 2026

The owner requested an immediate page launch/test without further questions. This release makes the existing **planned 799 SEK Ljusstund presentation** visible to visitors while **keeping every paid-order gate closed**.

## Configuration

Set Production `NOORLY_PUBLIC_PREVIEW=true` only when the following remain explicitly enabled:

- `NOORLY_STOREFRONT_OPEN=false`: cart reads stay empty; cart mutation, real Shopify checkout, payment and orders remain blocked.
- `NEXT_PUBLIC_PRODUCT_TEST_MODE=true`: existing UI displays product concepts rather than purchase controls.
- The chosen product in Shopify remains **DRAFT**, zero inventory and unpublished.
- Meta advertising campaigns remain **PAUSED** and ad spend stays zero during page review.

The switch is deliberately independent of `isStorefrontOpen()`. It bypasses only the `/admin-preview` login redirect for viewing locale pages. It **does not** enable a Shopify payment gateway, a Buy button, preorder status, draft-product publication or checkout. Sitewide robot metadata and `robots.txt` remain noindex/no-follow; the proxy adds an explicit `X-Robots-Tag` while public preview is on.

### Page URLs

- Sweden homepage: `https://noorlynordic.com/sv`
- Product presentation: `https://noorlynordic.com/sv/products/noorly-ljusstund-presentset-med-glasskal-och-tva-dofter`
- Shop presentation: `https://noorlynordic.com/sv/shop`
- Existing owner login (still works): `https://noorlynordic.com/admin-preview`

Visitors see a clear Swedish/English **test preview / no orders or payments** notice. No customer transaction is possible with this feature.

### Separate simulated payment test

A real Shopify test checkout is **not included** in this page-view release. Shopify Payments' **Test mode** must first be activated in the authenticated Shopify Payments settings, then a non-sale test product/flow must be connected through a protected test-only path and verified. Never toggle stock overselling or publish the unqualified candle-sand kit as available simply to test payments.

### Exit criteria

Once supplier-backed actual components, photographs, safety evidence, supported preorders, merchant terms, shipping, payment and test order/refund acceptance are verified, release real paid sales separately by deliberate review. Do not repurpose this read-only switch as authorization to activate ads or orders.
