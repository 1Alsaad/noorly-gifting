# Noorly — paid-presale release checklist (24 October 2026)

**Status:** preparation only. No paid sales, ads, supplier orders or commitments.
The owner reports finishing the Shopify Payments payout bank account on 24 October; merchant payout activation, settlement and actual checkout processing were **not independently verified** by our connected Shopify app.
The owner reports an Advanced promotional subscription of SEK 10 per month for three months. Verify billing before promo expiry, and downgrade rather than cancel if Noorly remains in operation.

## Single Sweden-only demand test

- Planned product: **Noorly Ljusstund**, one ELYSIA glass bowl, 350 g Nordic Lights + 350 g Dark Honey sealed Candledust original retail pouches, manufacturer-included wicks, gift packaging and Swedish instructions. **799 SEK inclusive of Swedish delivery**, provisional until all costs are confirmed.
- Shopify product `11395078259030`, variant `56006367281494` remains **DRAFT**, inventory **0**, `DENY` overselling, no active selling-plan group, no product photographs. Website is a nonpurchasable concept presentation. Do not enable checkout through inventory bypass.
- Marketing: total 3,000 SEK **maximum cash allocation**; only the first 1,000 SEK campaign may be considered for release. Existing paused selected campaign `120252042640230015` was renamed for Sweden, with a 1,000 SEK lifetime budget; the old 4,000 SEK campaign and the second 3,000 SEK duplicate remain paused. No ad set or ad is approved to serve, and no spending was authorized.
- Domain: `https://noorlynordic.com`; checkout at `https://checkout.noorlynordic.com`. `support@noorlynordic.com` forwards to the owner's verified destination, but live inbound message delivery and replies-as-support are not yet tested.
- Shopify Payments Sweden: EUR and SEK can be domestic payout currencies with **no extra multi-currency payout fee**; however collecting SEK and paying out EUR can produce a **currency conversion fee**, plus payment-method processing fees. Review actual checkout/capture and payout accounting. Do not infer payout availability from a bank account being saved.

## Already prepared/verified

- Production domain/TLS and Vercel backend connections, HTTPS-only checkout host allowlist, supplier-only presentation of selected gift set, owner email forwarding, and consent-controlled Meta browser Pixel ID `511816900240916`.
- Existing Meta browser code tracks consented PageView, genuine ViewContent and valid InitiateCheckout. Current protected storefront does not expose a public visitor purchase experience.
- Source code includes a verified HMAC `orders/paid` receiver and durable analytics outbox, but **no Shopify orders/paid webhook subscription was found** on 24 October. Without its Shopify app signing secret, runtime delivery is not configured.
- Technical extension prepared for a Meta Conversions API Purchase event through the outbox with independent marketing consent and first-party click identifiers. This does **not** constitute a live CAPI test. The Meta CAPI secret and reviewed Graph API version are not configured, and worker delivery, event match quality, deduplication and Shopify order-end acceptance have not been verified.

## Gates blocking paid presales / advertising

1. **Supplier fit, price and availability.** Obtain exact 10/20-kit all-in costs; current quantities, minimums, packed dimensions, payment requirements, dispatch window and actual Swedish receiving/fulfilment quote. The Candledust said it does not reserve stock or ship individual end-customer orders for new partners; batch fulfilment is required. Check ELYSIA volume discrepancy (515 ml title vs 290 ml specification) and manufacturer-backed suitability of glass, sand, wicks and instructions. Actual product photos or licensed supplier imagery are mandatory; concept film is not a picture of the finished bundle.
2. **Legal and consumer information.** Publish verified seller identity/address, consumer prices, payment/dispatch timing, shipping and return/cancellation terms, privacy/marketing consent and a properly implemented withdrawal notification function with prompt durable receipt. Do not publish placeholders as real terms. Follow Sweden's online-contract withdrawal rule in force from 19 June 2026. Resolve tax/VAT treatment for Meta advertising and paid trading.
3. **True preorder checkout.** Shopify preorder documentation requires a compatible preorder app; check full upfront payment, app and payment method eligibility, Headless Storefront `sellingPlanId` support, stock handling, cancellation/refund and documented dispatch dates. The existing custom storefront intentionally does not support preorder selling plans. Install/approve the selected app only after its pricing and headless API compatibility are verified. DO NOT enable `continue selling when out of stock` as a workaround or publish the current product ahead of these checks.
4. **Payment and fulfilment acceptance.** Validate paid test order and refund/cancellation in supported Shopify testing, checkout currencies SEK vs EUR payout FX, order confirmation, Swedish shipping, fulfilment release, reliable tracking, and supplier cash funding before promised shipping date. Maintain tax and refunds reserve.
5. **Meta purchase and one campaign.** Configure the Shopify app's real orders/paid HMAC secret, register the webhook, set worker secret/schedule, configure audited Meta CAPI token plus API version if server events will be used, and test consent-deny/no-event, marketing opt-in, valid paid Purchase, retry/dedupe and Events Manager Test Events. Meta Pixel alone does not prove paid-order attribution. Create an ad set restricted to country `SE`, valid start/end dates, a real-approved photo/video creative matching the actual product and URL, then recheck exact lifetime spend and release only on separate owner approval.
6. **Release controls.** Keep `NOORLY_STOREFRONT_OPEN=false` and `NEXT_PUBLIC_PRODUCT_TEST_MODE=true`, with product draft and ads paused, until all checks pass. Do not use mock or admin preview as evidence of live checkout.

## Owner / external dependencies remaining

- User confirmed saving payout bank account; actual payouts/payment fee and any account-verification warnings require an authenticated Shopify Payments settings check.
- Actual legal seller details (no invented registration/address), verified support send/receive workflow, supplier photo rights and dispatch dates.
- Shopify pre-order app choice, confirmation of zero or acceptable paid-app cost, supported selling plan identifiers, production webhook signing secret and Meta CAPI token.
- Approval of any supplier spending, production release, paid ad publication and test purchases. None is implied by this checklist.

## Sources

- [Shopify preorders](https://help.shopify.com/en/manual/products/purchase-options/pre-orders)
- [Shopify Sweden payouts](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries/sweden/payouts)
- [Konsumentverket online withdrawal](https://www.konsumentverket.se/nyhet/lagandring-gor-det-enklare-att-angra-kop-pa-natet/)
- [Existing detailed launch checklist](launch-checklist.md)
- [Existing planned bundle specifications](launch-bundle-preview.md)
