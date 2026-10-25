# Noorly separate products and payment launch

Updated 25 October 2026, Europe/Stockholm. This checkpoint supersedes the earlier instructions to keep customer ordering closed and to promote the combined 799 SEK Ljusstund set. Historical research and handovers remain evidence of their dates, not the current sales instruction.

> **Latest storefront-copy update:** Read [Noorly storefront copy cleanup — 25 October 2026](Noorly_Storefront_Copy_Cleanup_2026-10-25.md) for the film removal, Noorly product naming, preorder dispatch wording, returns and privacy decisions, temporary public business-detail removal, and release status. Its pre-edit inventory baseline is 20 per sand variant and 19 bowls; do not reset inventory to an older snapshot.

> **Latest cart-recovery update:** Read [Noorly cart recovery — 25 October 2026](Noorly_Cart_Recovery_2026-10-25.md) for the reproduced legacy-host failure, saved-cart regression fix, actionable Swedish/English feedback and release-verification status. Preserve the current pre-existing cart item during further checks.

> **Later checkout-design update:** Read [Noorly checkout branding — 25 October 2026](Noorly_Checkout_Branding_2026-10-25.md) for the saved logo, colours and fonts, plan limits, and current visual-verification status.

## Latest owner instruction

The owner explicitly requested opening payments now, separating the bowl and candle sand into individual products, and improving the product page so customers choose a colour and see the corresponding product photograph. The owner will update the online-sales rules and company details manually. Do not reinstate the earlier hold on sales solely because those edits remain outstanding, and do not invent missing company data.

The owner previously confirmed 20 complete sets, dispatch as soon as possible, the existing Shopify candle-sand photographs, and seller name **Noorly AB**. The new request changes the offer presentation to separate products. It does not authorise advertising spend, supplier orders, paid apps, messages to third parties, a real-money test purchase or a change to the company's legal identity on the owner's behalf.

## Catalogue and customer experience

| Product              | Shopify identity                                                                         | Current price                      | Contents                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Candle sand          | Product `11382623273302`, handle `candle-sand`                                           | 199 SEK unscented; 249 SEK scented | One 300 g pouch and four cotton wicks, in the selected colour and scent |
| Decorative teak bowl | Product `11401864216918`, handle `teakb-37-dekorativ-teakskal`; variant `56138148118870` | 550 SEK                            | One AWGifts TeakB-37 bowl                                               |

Prices include VAT and delivery within Sweden under the saved Sweden shipping profile. Dispatch wording is **as soon as possible**, without an invented number of working days. The sand has 11 existing CSand choices. Shopify remains the source for live variant identity, price, inventory and availability; do not manufacture stock in static fallback content.

The live shop now shows two product cards and separate detail pages. Selecting a candle-sand colour keeps its scent, photograph, price and cart variant together. The sand page shows the selected product photograph instead of the former mixed gallery. The actual 15-second brand film and existing admin-password behaviour are preserved. Earlier bundle links lead customers to the current separate-product selection.

The standalone bowl now has three actual supplier photographs. Shopify readback confirmed all three media records are `READY`: `67219401736534` (original bowl view), `67220673331542` (interior view), and `67220673364310` (citrus styling). The additional photographs use the existing verified supplier sources; no generated replacement imagery was introduced.

The wooden bowl is decorative. It is not a candle vessel: never instruct customers to burn candle sand or wicks directly in it. A separate suitable noncombustible, heat-resistant vessel is required for burning candle sand and is not included. Fruit or other photo styling, gift boxes and cards are not included.

## Saved foundation from 24 October

- Shopify Payments was observed **Accepting payments**, with live mode enabled. Cards, Shop Pay, Apple Pay and Google Pay were shown. Payouts were scheduled to resume on **28 October 2026** after a bank-account update. The assistant did not enter or change the bank details. Recheck this changing status when needed.
- Product photos, Swedish and English product text, Sweden delivery and customer policies were saved. Native customer-account return and cancellation requests were enabled. No paid order, payment, refund or supplier-fulfilment test was made.
- The standalone bowl had 20 available, tracked units. Each sand choice had 20 available, tracked pouches in Shopify. Stock was not increased by this checkpoint. Earlier native bundle component accounting shared the bowl stock; do not treat the old bundle as another independent pool of 20 bowls.
- The prior native parent `11401864249686`, handle `noorly-ljusstund-teakskal-och-ljussand`, remains a historical Shopify entity. It was changed to **DRAFT** on 25 October to match the owner's request for separate products. It was not deleted. A previous connector unpublish request was blocked and did not change channel publication; the later successful status change is the current evidence.
- Public catalogue permissions `unauthenticated_read_selling_plans` and `unauthenticated_read_bundles` were enabled on the existing Noorly Headless storefront. The live fixed catalogue probe then returned `status: ok`. No new credential was created or exposed.
- [PR 25](https://github.com/1Alsaad/noorly-gifting/pull/25) introduced the native kit/cart integrity work and customer policies. [PR 26](https://github.com/1Alsaad/noorly-gifting/pull/26) kept photographs visible during closed catalogue setup and added a sanitized health probe. PR 26 main commit: `091b581d48bf81292cae343068b8e9b7672f1ccc`.
- The last completed PR 26 verification passed 218 unit/component tests and 21 browser/accessibility tests. This is prior-code evidence, not verification of the new separate-product release.

## Company details assigned to the owner

The website uses **Noorly AB** and `support@noorlynordic.com`. The company organisation number and public customer-service telephone were not supplied and remain blank in `src/config/brand.ts`. Shopify's business entity was last observed as **Individual**. The owner has said they will update the online-sales rules/details manually after opening payments. Preserve that instruction; do not guess an organisation number, publish a private personal phone or attest to a company identity for the owner.

Shopify sender verification and domain authentication were incomplete at the last inspection; Shopify displayed its fallback sender. No verification email or DNS change was initiated in this work. These observations do not establish that customer email delivery has failed.

## Changes and verification in this continuation

The central Swedish and English customer-policy copy in `src/content/customer-policies.ts` now describes candle sand and the bowl as separately sold products, with their existing prices and unchanged Sweden delivery and dispatch wording. Withdrawal, returns, refunds and company details were preserved. The focused policy-route test passed **11 tests**. The Shopify shipping and terms policies were also saved and independently read back through the Admin API: they contain the separate-product prices and free Sweden delivery, with no remaining 799 SEK combined-set claim. Refund and contact text are unaffected by this product split.

Both standalone products are **ACTIVE**. The bowl was published to Noorly Headless, publication `371890356566`, alongside the already published candle sand. Swedish product descriptions state that the products are sold separately. Their English `body_html` translations were saved individually and verified with `outdated: false` and no mutation user errors. Other translation keys were preserved.

Shopify Payments was freshly observed **Accepting payments**. The displayed payout-resumption date remains **28 October 2026**. No bank-account details were entered or changed by the assistant.

### Release evidence

[PR 27](https://github.com/1Alsaad/noorly-gifting/pull/27) was merged as main commit **`9b137d7b3425c0ac8f17464a72c1bf9591341d6b`**. The exact PR head `4e35eb47f08722a7c7f41392921e40a70ae25d9a` passed [CI run 40140310956](https://github.com/1Alsaad/noorly-gifting/actions/runs/40140310956), job `121010471228`: **232 unit/component tests across 37 files**, **21 browser/accessibility checks in 55.2 seconds**, and no known production dependency vulnerabilities. Formatting, lint, TypeScript and build checks passed.

Vercel production deployment **`dpl_4XU7wvimX1DhZ3Wwq4UZfpqXakyD`** reached **READY** at `noorly-gifting-5x200rmca-1alsaads-projects.vercel.app`, with the `noorlynordic.com` production aliases. The live fixed catalogue probe returned `status: ok`, request ID `72b9d3ce-a777-4a80-9856-85487fe03108`.

Verified production flags are `NOORLY_STOREFRONT_OPEN=true`, `NEXT_PUBLIC_PRODUCT_TEST_MODE=false` and `NOORLY_PUBLIC_PREVIEW=true`. The preview environment retains `NEXT_PUBLIC_PRODUCT_TEST_MODE=true`; its shared variable was separated from production before release. The public-preview flag continues to restrict the catalogue to the two real products and preserve the existing film experience. Unrelated demo products and the experimental box builder remain unavailable.

The first real checkout attempt encountered Shopify's public "Opening soon" password page. The **Online Store → Preferences → Restrict access to visitors with the password** setting was turned off, saved and verified off to allow the authorised public launch. This was Shopify's public storefront password restriction. Admin authentication and the website's admin-password implementation were not changed. Checkout was then reached successfully.

### Live customer-flow evidence

- The Swedish shop showed the two separate cards without the closed-ordering banner.
- Selecting **Gammalrosa · Maison de Roses** on the sand page displayed its single CSand-07 photograph and **249 SEK** price.
- The real cart held one bowl at **550 SEK** plus two selected sand pouches at **498 SEK**, total **1,048 SEK**. Quantity changes worked. Removing the bowl changed the total to **498 SEK**, and adding it back restored the expected basket.
- Shopify checkout retained bowl variant `56138148118870`, quantity 1, and sand variant `55883112317270`, quantity 2.
- Using only destination country **SE**, postal code **72336** and city **Västerås**, the checkout selected **Standardleverans, 0 SEK**. The checkout showed card payment, Shop Pay and Google Pay.
- No customer email, name, street address or card information was entered. The final payment action was not invoked; no paid order, charge, refund or supplier order was created.
- After verification, both test lines were removed and the live cart was confirmed empty.

This verifies the real product-selection, cart, delivery-rate and payment-method path. It does not establish a successful authorised charge, order email, fulfilment, refund or conversion-tracking event. Those remain distinct from this completed public-opening check.

The accompanying presentation polish suppresses Shopify's internal `Default Title` label for single-variant cart items. Actual sand colour and scent labels and bundle-component rendering are preserved. The existing cart and product-gallery tests passed (11 checks); this does not alter payment, inventory or release controls.

## Source and continuity rules

GitHub repository **1Alsaad/noorly-gifting** is the source of truth. Read `AGENTS.md` and relevant installed Next.js documentation before code changes. Preserve exact Shopify variant mapping and fail-closed rules for unknown product identity, unsupported selling plans, invalid prices and insufficient inventory. Do not extract API secrets from the browser to perform tests.

The supplied documents, _Noorly AI Agent Handover_ (19 October) and _Swedish Seasonal Gift Brand Validation, Marketing and Operations Readiness Plan_ (18 October), were read as historical project context. Retain their requirements for real catalogue facts and photography, honest stock/dispatch claims, Swedish customer copy and consent before optional tracking. Their proposed assortment, testing sequence, prices, unconnected-platform assumptions and earlier launch gates are superseded where they conflict with later verified work or the latest explicit instruction. They do not authorise starting social publishing or increasing spend in this website task.

The earlier total media allocation remains **4,000 SEK across the whole test sequence**, not an instruction to activate ads. Actual spend, conversion tracking, supplier fulfilment and a completed paid-order/refund flow remain separate work. Do not report those as verified by opening the website.
