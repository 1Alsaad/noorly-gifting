# Noorly separate products and payment launch

Updated 25 October 2026, Europe/Stockholm. This checkpoint supersedes the earlier instructions to keep customer ordering closed and to promote the combined 799 SEK Ljusstund set. Historical research and handovers remain evidence of their dates, not the current sales instruction.

## Latest owner instruction

The owner explicitly requested opening payments now, separating the bowl and candle sand into individual products, and improving the product page so customers choose a colour and see the corresponding product photograph. The owner will update the online-sales rules and company details manually. Do not reinstate the earlier hold on sales solely because those edits remain outstanding, and do not invent missing company data.

The owner previously confirmed 20 complete sets, dispatch as soon as possible, the existing Shopify candle-sand photographs, and seller name **Noorly AB**. The new request changes the offer presentation to separate products. It does not authorise advertising spend, supplier orders, paid apps, messages to third parties, a real-money test purchase or a change to the company's legal identity on the owner's behalf.

## Catalogue and customer experience

| Product              | Shopify identity                                                                         | Current price                      | Contents                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Candle sand          | Product `11382623273302`, handle `candle-sand`                                           | 199 SEK unscented; 249 SEK scented | One 300 g pouch and four cotton wicks, in the selected colour and scent |
| Decorative teak bowl | Product `11401864216918`, handle `teakb-37-dekorativ-teakskal`; variant `56138148118870` | 550 SEK                            | One AWGifts TeakB-37 bowl                                               |

Prices include VAT and delivery within Sweden under the saved Sweden shipping profile. Dispatch wording is **as soon as possible**, without an invented number of working days. The sand has 11 existing CSand choices. Shopify remains the source for live variant identity, price, inventory and availability; do not manufacture stock in static fallback content.

Show two product cards and separate detail pages. The candle-sand page must keep the chosen colour/scent, photograph, price and cart variant together. Avoid showing every colour photograph alongside the bowl on one combined product page. Keep the actual 15-second brand film and existing admin-password behaviour. Earlier bundle links should lead customers to the current separate-product selection.

The wooden bowl is decorative. It is not a candle vessel: never instruct customers to burn candle sand or wicks directly in it. A separate suitable noncombustible, heat-resistant vessel is required for burning candle sand and is not included. Fruit or other photo styling, gift boxes and cards are not included.

## Saved foundation from 24 October

- Shopify Payments was observed **Accepting payments**, with live mode enabled. Cards, Shop Pay, Apple Pay and Google Pay were shown. Payouts were scheduled to resume on **28 October 2026** after a bank-account update. The assistant did not enter or change the bank details. Recheck this changing status when needed.
- Product photos, Swedish and English product text, Sweden delivery and customer policies were saved. Native customer-account return and cancellation requests were enabled. No paid order, payment, refund or supplier-fulfilment test was made.
- The standalone bowl had 20 available, tracked units. Each sand choice had 20 available, tracked pouches in Shopify. Stock was not increased by this checkpoint. Earlier native bundle component accounting shared the bowl stock; do not treat the old bundle as another independent pool of 20 bowls.
- The prior native parent `11401864249686`, handle `noorly-ljusstund-teakskal-och-ljussand`, remains a historical Shopify entity. Do not assume it has been deleted or unpublished merely because the website stops promoting it. A previous connector unpublish request was blocked and did not change channel publication.
- Public catalogue permissions `unauthenticated_read_selling_plans` and `unauthenticated_read_bundles` were enabled on the existing Noorly Headless storefront. The live fixed catalogue probe then returned `status: ok`. No new credential was created or exposed.
- [PR 25](https://github.com/1Alsaad/noorly-gifting/pull/25) introduced the native kit/cart integrity work and customer policies. [PR 26](https://github.com/1Alsaad/noorly-gifting/pull/26) kept photographs visible during closed catalogue setup and added a sanitized health probe. PR 26 main commit: `091b581d48bf81292cae343068b8e9b7672f1ccc`.
- The last completed PR 26 verification passed 218 unit/component tests and 21 browser/accessibility tests. This is prior-code evidence, not verification of the new separate-product release.

## Company details assigned to the owner

The website uses **Noorly AB** and `support@noorlynordic.com`. The company organisation number and public customer-service telephone were not supplied and remain blank in `src/config/brand.ts`. Shopify's business entity was last observed as **Individual**. The owner has said they will update the online-sales rules/details manually after opening payments. Preserve that instruction; do not guess an organisation number, publish a private personal phone or attest to a company identity for the owner.

Shopify sender verification and domain authentication were incomplete at the last inspection; Shopify displayed its fallback sender. No verification email or DNS change was initiated in this work. These observations do not establish that customer email delivery has failed.

## Changes and verification in this continuation

The central Swedish and English customer-policy copy in `src/content/customer-policies.ts` now describes candle sand and the bowl as separately sold products, with their existing prices and unchanged Sweden delivery and dispatch wording. Withdrawal, returns, refunds and company details were preserved. The focused policy-route test passed **11 tests**. The Shopify shipping and terms policies need the corresponding factual product wording when the separate-product offer is released; refund and contact text are unaffected by this product split.

At the time this checkpoint was drafted, the separate-product frontend, catalogue resolver, production flag update and live checkout verification were in progress. Do not treat this paragraph as proof that the production release completed. Record the exact merged commit, deployment, final checks and observed checkout result in the release evidence below before declaring completion.

### Release evidence

Pending final deployment and customer-flow verification in this continuation. The intended production state is `NOORLY_STOREFRONT_OPEN=true` and `NEXT_PUBLIC_PRODUCT_TEST_MODE=false`; preview environments must remain closed. `NOORLY_PUBLIC_PREVIEW` may remain enabled to preserve the restricted two-product catalogue and the existing film experience. Do not expose unrelated demo products or enable the experimental box builder when opening real purchases.

Verify each actual standalone product can be selected and added to the real Shopify cart, the selected sand colour and price are retained, quantity edits/removal work, Sweden delivery is free, and the customer reaches Shopify payment methods. Stop before confirming a real payment. A successful catalogue health check alone is not a cart, shipping or payment-method test.

## Source and continuity rules

GitHub repository **1Alsaad/noorly-gifting** is the source of truth. Read `AGENTS.md` and relevant installed Next.js documentation before code changes. Preserve exact Shopify variant mapping and fail-closed rules for unknown product identity, unsupported selling plans, invalid prices and insufficient inventory. Do not extract API secrets from the browser to perform tests.

The supplied documents, _Noorly AI Agent Handover_ (19 October) and _Swedish Seasonal Gift Brand Validation, Marketing and Operations Readiness Plan_ (18 October), were read as historical project context. Retain their requirements for real catalogue facts and photography, honest stock/dispatch claims, Swedish customer copy and consent before optional tracking. Their proposed assortment, testing sequence, prices, unconnected-platform assumptions and earlier launch gates are superseded where they conflict with later verified work or the latest explicit instruction. They do not authorise starting social publishing or increasing spend in this website task.

The earlier total media allocation remains **4,000 SEK across the whole test sequence**, not an instruction to activate ads. Actual spend, conversion tracking, supplier fulfilment and a completed paid-order/refund flow remain separate work. Do not report those as verified by opening the website.
