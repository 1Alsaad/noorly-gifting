# Noorly customer launch checkpoint

Updated 24 October 2026, Europe/Stockholm. This checkpoint supersedes older ELYSIA/Candledust plans and historical instructions to defer payment activation. It records the current session; media, deployment and final acceptance evidence must be completed below before describing the store as ready to accept orders.

## Current authorization and scope

The owner's current request authorizes enabling live payments, finishing the website with accurate photos, and publishing the customer website. Continue those actions wherever the required facts and access are available; do not request the same authorization again. Advertising, ad spend, supplier spending and real-money test purchases have not been authorized or performed in this session.

The original winter film is retained. It is atmospheric footage and must not be represented as a photograph or demonstration of the exact sellable set.

## Payment provider status

- Shopify Payments test mode is **off**.
- The authenticated Shopify Payments overview shows **Accepting payments**.
- Payouts are paused until **28 October 2026** following the payout-bank update.
- These observations establish the payment-provider state, not a completed customer checkout, settled payout, order, refund or fulfillment test. Preserve that distinction in progress reports.

## Actual product and inventory

The product is **Noorly Ljusstund with the AWGifts TeakB-37 decorative teak bowl and packaged AW candle sand**. Do not restore the superseded ELYSIA glass bowl or The Candledust refills.

| Field              | Verified or recorded state                    |
| ------------------ | --------------------------------------------- |
| Shopify product    | `gid://shopify/Product/11395078259030`        |
| Shopify variant    | `gid://shopify/ProductVariant/56006367281494` |
| Handle             | `noorly-ljusstund-teakskal-och-ljussand`      |
| Variant SKU        | `NOORLY-LJUSSTUND-TEAKB37`                    |
| Saved draft price  | 799 SEK                                       |
| Product status     | DRAFT                                         |
| Sellable inventory | 0                                             |
| Inventory policy   | DENY overselling                              |
| Shipping           | Attached to the Sweden delivery profile       |

The owner reports having 20 bowls and candle-sand packages. This does not establish 20 complete, specified and packed sets. The exact candle-sand SKU, color/fragrance, grams and packages per set, and number of complete sellable sets remain unconfirmed. Do not manufacture inventory or select a sand variant from a photograph.

TeakB-37 is a decorative wooden bowl, not a qualified candle vessel. Never depict or instruct burning candle sand directly in wood. Flame use requires a separate suitable noncombustible, heat-resistant vessel and manufacturer-specific instructions. Record the actual included components and intended use before selling a combined kit.

## Photography and provenance

Three authentic TeakB-37 photographs were verified visually and uploaded to Shopify on 24 October 2026. The authenticated official catalogue exposed the exact-product image ZIP; that export was obtained in the browser but did not synchronize into the working container. The same product gallery sources were therefore imported directly with the Shopify image-upload connector. No private browser credentials or download files were transferred.

AW Dropship's [Terms section 12](https://www.aw-dropship.eu/terms-and-conditions) permits approved account users to use images supplied in its image file in their chosen selling medium. The earlier authenticated catalogue and working Manual/API channel are recorded in [Presale State v1.2](project-handover/Noorly_Presale_State_v1.2.md). Use the documented [catalogue or channel image export](https://www.aw-dropship.eu/docs/exporting-product-data) and retain exact SKU/source provenance. This specific permission must not be confused with the more restrictive generic AWGifts website FAQ.

Verified source and hosted asset mapping (display order):

| View                    | Official supplier source                                  | Shopify filename                      |
| ----------------------- | --------------------------------------------------------- | ------------------------------------- |
| Empty bowl, front       | `https://www.aw-dropship.eu/i/1m3n/6kb4MB8m/800x800.jpeg` | `noorly-teakb37-supplier-bowl-01.jpg` |
| Empty bowl, overhead    | `https://www.aw-dropship.eu/i/1m3o/aM-AU4FK/800x800.jpeg` | `noorly-teakb37-supplier-bowl-03.jpg` |
| Bowl with styling fruit | `https://www.aw-dropship.eu/i/1m3p/SZ2bHWEq/800x800.jpeg` | `noorly-teakb37-supplier-bowl-02.jpg` |

The images are attached to the real draft Shopify product and used in the preparation gallery. They show the supplier model. Fruit is styling and is not included; natural form and grain vary. Candle sand and the complete Noorly set are not pictured. Do not describe these as photographs of the owner's exact received units.

The 33 older local CSand photographs were sourced from AWGifts website pages with commercial permission then unresolved. Their presence in the repository is not independent licence evidence. Only match a sand photograph after the actual received SKU is established. Supplier bowl photos show the model, not the exact grain of every bowl or a finished Noorly set.

## Website implementation prepared this session

Work has addressed the authoritative Shopify purchase path, exact variant selection, selling-plan handling, inventory checks, consistent customer copy and the cart gate. The purchase flow must use the real Shopify product and variant; the planning object and historical mock catalogue are not commerce evidence. Do not claim these changes are deployed or accepted solely because the source is edited.

Keep customer copy consistent about actual contents, availability and payment state. Retain `https://noorlynordic.com`, the permitted checkout origin `https://checkout.noorlynordic.com`, and `support@noorlynordic.com`.

## Facts still needed to complete sales readiness

- Exact sand SKU and specification, quantities per set, included vessel/components and number of assembled sellable sets.
- A photograph or exact SKU of the received candle sand and confirmation of the finished set contents; the bowl-model photos are now available.
- A supportable dispatch commitment and completed delivery/packing arrangements.
- Verified seller legal identity, customer contact and return information, with complete customer-facing terms.
- Verification of the deployed product-to-cart-to-Shopify-checkout flow, Swedish totals/shipping, customer notifications and supported cancellation/refund handling.

These are factual and implementation dependencies, not a new blanket permission requirement. Complete all unaffected work while they are resolved. Keep the product draft and avoid claiming purchasable stock until the actual offer and inventory can be represented accurately.

## Final release evidence

- Local combined checks passed: 176 unit/component tests across 30 files, formatting, TypeScript and ESLint, including the photo and copy additions.
- An optimized local production-preview build passed using the mock provider, harmless dummy preview settings and telemetry disabled. The initial restricted-shell build failed on the environment's `uv_resident_set_memory`; the same source built successfully with normal execution permissions.
- Storefront GraphQL operations were checked locally against the bundled 2026-07 schema without uploading source telemetry.
- The release keeps the configured customer-sales gates closed and the product draft while exact contents and complete-kit stock remain unresolved. Live Shopify Payments being enabled does not establish a successful order.
- The associated GitHub pull request/checks and Vercel deployment are the source of the final commit and deployment status. Verify the public domain, gallery and original film after that deployment reaches READY.
- The prior CI browser run passed 20 tests and failed one stale Swedish CTA label. That assertion is updated to the current CTA while preserving its layout and keyboard checks. Local browser download failed on invalid upstream ZIP contents; the full browser suite must run in GitHub CI, whose prior download succeeded.
- No real-money customer transaction, payout, refund or fulfillment was performed.
