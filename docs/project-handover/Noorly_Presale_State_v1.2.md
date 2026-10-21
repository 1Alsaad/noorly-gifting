# Noorly objectives and presale handover — v1.2

Updated 21 October 2026. Read this state update first, then the original v1.1 Word handover. It preserves the latest user decisions and records what was actually saved and tested. It does not authorize opening paid presales or advertising.

## ROI and remaining launch work

A [21 October ROI assessment and launch-readiness checklist](Noorly_ROI_and_Launch_Readiness_2026-10-21.md) records the recalculated acquisition limits, fixed-cost gaps, work we can prepare ourselves and external release dependencies, including the deferred domain. This is an assessment and pending-work checklist, not a claim that those launch tasks are completed. The supplier inquiry thread still contained no reply when checked. The AW registration email describes manual application review; full ordering approval remains to be verified.

## Operating decisions

- Exactly **4,000 SEK total advertising allocation across the whole testing sequence**. This is an allocation, not a claim that the ad account has been reconciled or that all funds remain unspent.
- First candle-sand offer: **up to 2,000 SEK**, initial **4–5-day screen**, review on day four.
- Reserve **2,000 SEK** to continue a promising offer or test one genuinely different product. Plan around two sequential offers. Scents, colours and creatives are variants, not product tests.
- Judge verified purchases, contribution after advertising, qualified traffic volume and conversion delay together. Four or five days by themselves establish neither success nor failure.
- Friday **23 October 2026 is a setup target**, not a promised launch or dispatch date.
- Swedish customer copy. No faces, invented reviews, false scarcity, unsupported product claims or invented delivery promises. Do not activate ads.

## Saved in Shopify

Store `tzwngp-h1`; candle-sand product `11382623273302`, handle `candle-sand`.

- Title saved as **Ljussand 300 g – förbeställning**.
- Swedish description saved and verified after reload. It states that orders are not open and no payment is being accepted; describes one 300 g pouch and four wicks; excludes vessel, decorations, gift box and greeting card; includes basic fire-safety instructions; promises to display final terms before opening.
- Removed the prior burn-time claim and internal gift-box placeholder copy.
- Saved draft variant prices: **199 SEK unscented; 249 SEK scented**. These are provisional, not approved final prices. Existing `pricing-pending` and `stock-pending` tags remain.
- Product remains **Draft**, zero sales-channel publication and zero inventory. The notebook and tea products also remain Draft and unpublished.
- **449 SEK for two scented pouches is only a proposal.** No bundle, discount or two-pouch checkout offer was created.
- Created shipping profile **Ljussand – presale preparation (shipping pending)**, profile ID `151291855190`, containing all eleven candle-sand variants, with **zero zones and no active shipping rates**. This deliberately blocks delivery eligibility until the landed quote is confirmed. It removes candle sand from the general profile's unsupported delivery estimates.
- General profile for the other draft products remains unchanged: Swedish express 99 SEK / 1–2 business days, normal 65 SEK / 3–5 business days with free shipping from 470 SEK, plus international zones. Do not reuse these promises for candle sand.

### Verified SKU mapping

These IDs and supplier names were inspected in Shopify and the authenticated AW Dropship catalogue. Existing variant images are assigned; the complete front-end image switch still needs end-to-end testing.

| Supplier SKU | Shopify variant ID | Shopify colour · fragrance     | Draft SEK | Supplier EUR, ex VAT |
| ------------ | ------------------ | ------------------------------ | --------: | -------------------: |
| CSand-01     | 55883112120662     | Mockabrun · Crimson Crystal    |       249 |                 6.25 |
| CSand-02     | 55883112153430     | Lattebeige · Pure Serenity     |       249 |                 6.25 |
| CSand-03     | 55883112186198     | Vit · Starlight Elixir         |       249 |                 6.25 |
| CSand-04     | 55883112218966     | Chokladbrun · Millionaire Gold |       249 |                 6.25 |
| CSand-05     | 55883112251734     | Varmgrå · Azure Noir           |       249 |                 6.25 |
| CSand-06     | 55883112284502     | Taupeorange · Cobalt           |       249 |                 6.25 |
| CSand-07     | 55883112317270     | Gammalrosa · Maison de Roses   |       249 |                 6.25 |
| CSand-08     | 55883112350038     | Honung · Blush Bloom           |       249 |                 6.25 |
| CSand-09     | 55883112382806     | Svart · Spirited               |       249 |                 6.25 |
| CSand-10     | 55883112415574     | Kräm · Regent Polo             |       249 |                 6.25 |
| CSand-11     | 55883112087894     | Vit · Doftfri                  |       199 |                 5.00 |

The supplier calls CSand-08 “Warm Honey”; “Varm honung” is a more literal Swedish label if the existing option is revised. Supplier SKU is the matching key; do not match by scent alone.

## Supplier verification and preparation

The user signed into AW Dropship during this session. No further supplier sign-in is required while that session remains valid.

- Authenticated catalogue and public feed both show **zero stock for CSand-01 through CSand-11**. Each lists 0.30 kg product weight. This does not establish packed parcel weight.
- Current authenticated unit prices are €6.25 scented and €5.00 unscented. The supplier FAQ says website prices exclude VAT; tax is added in the cart. Invoice tax treatment and recovery remain unverified.
- AWGifts Sweden's wholesale range displays **expected back 31 October 2026** for the eleven variants. This is an estimated wholesale restock date, **not an AW Dropship stock reservation or dispatch commitment**. No customer-facing dispatch date has been approved.
- Public Sweden tariff: €9.60 for 0–2 kg, €15.10 for 2–5 kg, €16.30 for 5–10 kg and €17.00 for 10–30 kg. Page describes GLS up to 2 kg and approximately five working days transit, excluding weekends, with a festive-delay warning. These are indicative public terms, not a final account quote or a presale delivery promise.
- Supplier describes unmarked protective packaging and explicitly says gift wrapping is unavailable. Supplier/manufacturer branding can remain on products. Noorly cards, branded boxes, inserts, extra packing costs and mixed-pouch parcel consolidation are **not confirmed**.
- Created **Noorly – presale preparation**, a **Manual/API** channel, and added all eleven SKUs to its portfolio. Verified after reload: 11 products, zero clients, zero orders, zero baskets. No top-up, payment, stock reservation or supplier order was made.
- Shopify connection is offered by AW Dropship, but is **not connected**. A manual channel is preparation for a possible routing workflow, not automatic fulfillment and not an end-to-end fulfillment test. No API credential was retrieved.

### Supplier message — sent 21 October 2026

Recipient: **hello@aw-dropship.eu**. Sent on 21 October 2026 at 10:35 Europe/Stockholm from the user-authorized Gmail account after explicit approval. The authenticated sender matched the requested account. A pre-send check found no matching sent inquiry; a post-send Gmail check confirmed this message in Sent with the intended recipient and subject. Supplier confirmation is still pending. This email does not reserve stock or authorize a supplier order.

Subject: Noorly Sweden - candle-sand availability, landed quote and presale dispatch

Hello,

We are preparing an honest Swedish presale for CSand-01 through CSand-11. Our account currently shows zero stock. AWGifts Sweden lists an expected return on 31 October 2026. Please confirm whether that also applies to AW Dropship, the quantities available to reserve, and the earliest realistic dispatch window for new Swedish orders. We will not promise delivery until you confirm it.

Please provide a final quote for (a) one scented 300 g pouch, (b) one unscented pouch and (c) two scented pouches, including different variants in one parcel, delivered to Sweden. Please itemize product cost, VAT treatment, packing/handling, tracked shipping, packed weight and any surcharges. Confirm the four included wicks and provide current safety/label documentation.

Please also confirm cancellation before dispatch, out-of-stock handling, returns/damage arrangements, whether an unbranded parcel can include a Noorly card or supplied box and any fees/minimums. We understand gift wrapping is not available. For Shopify, please explain SKU matching for our existing variants, whether presale orders can be held for manual release, how duplicate orders are prevented, and how tracking/fulfillment status returns to Shopify.

Thank you.

## Economics: verified inputs, unresolved final price

No final landed quote, applicable supplier VAT treatment, live payment fee or packaging cost has been verified. Therefore the draft prices have **not** been approved for sales.

For continuity, the following reproduces the v1.1 scenario at **11.123 SEK/EUR** (the prior handover's reference, not a refreshed executable exchange rate), assumes 25% output VAT, recoverable/excluded supplier VAT, the public €9.60 shipping band, payment fees of 11/11/16 SEK and returns reserves of 10/10/15 SEK. It excludes any new handling, branding, currency conversion spread or fixed overhead.

| Scenario            | Product + draft customer shipping | Revenue ex assumed VAT | Goods + supplier shipping | Fees + reserve | Contribution before ads |
| ------------------- | --------------------------------: | ---------------------: | ------------------------: | -------------: | ----------------------: |
| One scented pouch   |                249 + 99 = 348 SEK |                 278.40 |                    176.30 |          21.00 |               81.10 SEK |
| One unscented pouch |                199 + 99 = 298 SEK |                 238.40 |                    162.40 |          21.00 |               55.00 SEK |
| Two scented pouches |                449 + 99 = 548 SEK |                 438.40 |                    245.82 |          31.00 |              161.58 SEK |

At a stress assumption of 11.50 SEK/EUR, those contributions become 75.13 / 49.50 / 153.25 SEK before any other changes. Every additional SEK of unrecovered variable cost reduces contribution by one SEK. Under the original VAT assumption, 99 SEK customer shipping yields 79.20 SEK net versus about 106.78 SEK supplier shipping; the product margin subsidizes the difference.

Break-even acquisition cost is verified contribution before ads, not gross revenue. The earlier 70%-of-contribution planning targets (56.77 / 38.50 / 113.11 SEK) remain provisional. Recalculate using the account quote, actual processor fees, tax treatment, FX and cancellation/refund experience before spending.

## Storefront implementation and tests

Base inspected: `main` at `d12fc23c667e08ccc616b89f12a8345c150b34ac`. Existing PRs #6 and #7 were not merged or overwritten. The live site initially showed the fictional gifting demo.

Change merged through [PR #8](https://github.com/1Alsaad/noorly-gifting/pull/8), production commit `dab6d763b9e06e0ff46e7d7b9c43d6b7a23c0b43`:

- Public production builds default to a Swedish/English preparation page. It displays no product catalogue, cart controls or checkout and does not mount the storefront analytics or consent components.
- Every locale route is gated, including direct product, shop, cart, gift-builder and mock-checkout paths. Existing demo assets remain available for local development.
- `/api/cart` GET returns an empty closed-store state; POST returns HTTP 503 `STOREFRONT_CLOSED` before touching providers or cookies. Old carts cannot bypass the closure.
- Production builds can open only with `NOORLY_STOREFRONT_OPEN=true` **and** Shopify as the commerce provider. A mock provider never opens in production even with that flag. This switch is a final release control, not permission to open before the remaining requirements pass.
- Closed stores are excluded from sitemap output and indexing. The production env template sets the flag to false.

Verified locally: TypeScript, changed-file ESLint, all **67 tests across 13 files**, production Next.js build; connected Chrome inspection of the Swedish holding page and a direct old product URL; HTTP checks of cart, builder, mock checkout, English shop, robots and sitemap; direct POST checkout blocked with 503. This is **not a Shopify payment, presale, fulfillment or Meta Purchase test**.

**Deployed and verified live:** [noorly-gifting.vercel.app/sv](https://noorly-gifting.vercel.app/sv) now shows the preparation page. GitHub reported successful production deployment `8iNqrqJE9k1ihLwyKVrBSN7egEDN` for the merge commit. Connected Chrome confirmed the live Swedish page. Live HTTP checks confirmed the hold on the old product, cart, builder, mock-checkout and English shop routes; cart GET returned the closed state, checkout POST returned HTTP 503, robots disallowed crawling and sitemap contained no products. [Live screenshot](evidence/presale-hold-live.jpg).

GitHub's complete PR verification job passed, including formatting, lint, TypeScript, unit/component tests, production build, browser/accessibility tests and production dependency audit. The protected preview could not be opened with the connected Vercel identity; no protection settings were changed. Vercel deployment API access returned 403/404, and its dashboard showed no project access for that Chrome account. The existing GitHub integration successfully deployed the reviewed change. Correct Vercel account access is still needed for domain/environment administration.

## Shopify, domain, payments and tracking state

- Current primary Shopify domain `erinra.com` and `www.erinra.com` show **Invalid DNS**. The `tzwngp-h1.myshopify.com` domain is connected. No Noorly custom domain is connected in the inspected Shopify domain list; Vercel project metadata lists only its Vercel aliases. No purchase or DNS change was made.
- Shopify Payments shows **Complete setup**; PayPal shows **Setup incomplete**. Current payment capture setting is **automatically at checkout**, unchanged. This does not establish a working payment method or presale payment schedule.
- Installed apps list shows Shopify ChatGPT MCP App and Messaging. No presale or AW fulfillment app is installed. No app permission grant was made.
- Shopify Customer events is empty: no app/custom pixel integrations displayed. Windsor's reporting connection does not create a Pixel integration.
- Shopify Customer privacy shows an automated cookie banner visible in Sweden and an automated published privacy policy. Shopify Network Intelligence is enabled, unchanged. This does not establish consent coverage on the custom storefront or checkout; inspect actual behavior and data-sharing choices before release.
- Shopify Policies has no saved return/refund policy, terms of service, shipping policy, contact information or legal notice. The default self-serve rules display 14-day returns and cancellation until fulfilled; those controls do not replace complete customer-facing terms or the required withdrawal flow. No legal/contact facts were invented.
- Code has analytics and marketing consent choices and GA4/PostHog infrastructure, but no Meta adapter. No complete checkout-consent test or deduplicated Meta Purchase test has passed.
- Existing Meta dataset ID `511816900240916` is carried forward from v1.1, **not reverified in this session**. Reuse only after checking business/dataset ownership; do not create a duplicate dataset casually.
- Current custom Shopify adapter does not query or preserve selling-plan allocations/IDs, SKU or per-variant image selection. Existing product images query is limited to eight images. The Shopify draft having eleven correct variants does not make the custom storefront presale-compatible.

## Concrete setup sequence for Friday 23 October

Keep ads off and paid presales closed throughout these steps.

1. Obtain the supplier response and final one/two-pouch Sweden quotes. Confirm reservation, reliable dispatch range, packed weight, retail safety/label documents, plain packaging, cancellation and damaged-goods handling. Do not turn the 31 October wholesale estimate into a customer promise.
2. Confirm the intended owned Noorly domain and access to its registrar/Vercel project. Prepare the storefront/checkout domain arrangement and TLS; retain unrelated Erinra records until their ownership and purpose are clear. Complete Shopify Payments account-owner verification and record actual transaction fees.
3. Choose a presale app with explicit **Custom Storefront** compatibility and the desired full-payment/deposit schedule. Review cost and app permissions before installation. Extend the adapter/cart types and validation to require the correct selling-plan ID; preserve it through add/update/rebuild operations and render the plan's price/payment schedule. Disable ordinary purchase for presale-only variants. Do not substitute an “allow overselling” checkbox for this flow.
4. Finalize prices and the single Sweden shipping rate only after economics pass. Add the verified rate to the dedicated candle-sand profile with a truthful rate name and no unsupported transit estimate. Test one unscented pouch, every scented variant and two mixed scented pouches; verify images, SKU, quantity, SEK totals, VAT and shipping. Ensure any two-pouch offer retains both component SKUs for fulfillment.
5. Publish complete Swedish seller identity/contact details and terms. Fill the actual payment timing, full contents, shipping charge, supplier-supported dispatch range, cancellation/refund and withdrawal procedure. Implement and test the required online withdrawal function and durable acknowledgement. Do not publish bracketed draft text or placeholder contacts.
6. Select one owner for checkout Purchase reporting. If browser and server Meta events are both used, use the same event name and stable event ID for the same paid order, reconcile SEK value and currency, and verify actual deduplication in Events Manager. Never fire Purchase for a lead, unpaid order or repeatedly visited thank-you page. Separate marketing consent from analytics and verify its behavior across the custom storefront and Shopify checkout. Supplier automation must not transmit orders before the intended manual release/payment state.
7. Run test-mode orders through the actual custom storefront → Shopify presale checkout → Shopify order → supplier routing path, including duplicate/retry handling, cancellation/refund and tracking return. Use a supplier-supported dry run; do not place or pay a real supplier order without an explicit spending instruction. Record order/event IDs privately and redact personal data from shared evidence. Test deny-all, analytics-only, marketing-consent and withdrawal-of-consent cases; no marketing events when consent is denied. Confirm exactly one paid-order Purchase after reload/retry and no false Purchase on cancellation or failed payment.
8. Only after these gates pass, explicitly release products/rates/storefront and verify the live customer flow again. Advertising still requires the user's launch instruction. Reconcile existing spend first; cap the first screen at 2,000 SEK inside the overall 4,000 SEK allocation. Review day four using matured paid orders and contribution, with traffic volume and conversion lag visible.

### Swedish checkout disclosure template — internal, not published

“Detta är en förbeställning. Du köper [antal] påse/påsar med 300 g ljussand och fyra vekar per påse. Kärl, dekorationer, presentask och hälsningskort ingår inte. Totalpris inklusive moms: [belopp] kr. Frakt: [belopp] kr. [Hela beloppet/depositionen och resterande belopp] betalas [verifierad tidpunkt enligt betalningsplanen]. Beräknad avsändning: [leverantörsbekräftat intervall]. Vid försening kontaktar vi dig med en ny uppskattning och information om avbeställning och återbetalning. [Verifierad rutin för avbeställning före avsändning]. Du har som huvudregel 14 dagars ångerrätt från mottagandet; se [fullständiga villkor, returkostnad och ångerfunktion].”

Payment timing and cancellation policy are business decisions still requiring completion. The default capture setting alone must not be used to fill these fields.

## Source record

Observed 21 October 2026 in the user's connected Chrome unless noted. Dynamic pages must be rechecked before launch.

- [AW Dropship catalogue feed](https://www.aw-dropship.eu/catalogue/family/csand-dssk), plus authenticated My Products and CSand-01 detail: stock/prices/contents. No supplier support reply obtained.
- [AWGifts Sweden candle sand](https://www.awgifts.se/candles/csand): estimated 31 October wholesale return; not a dropship commitment.
- [AW Dropship shipping](https://www.aw-dropship.eu/shipping) and [FAQ](https://www.aw-dropship.eu/faq): public tariffs, packaging and tax statements.
- [Shopify preorder setup](https://help.shopify.com/en/manual/products/purchase-options/pre-orders/setup), checked via official page: app required; Online Store and Custom Storefront supported; restrictions include Shop Pay, Apple Pay, Google Pay and local methods such as Klarna. Verify the selected app and actual checkout.
- [Konsumentverket distance-selling requirements](https://www.konsumentverket.se/marknadsratt-foretag/informationskrav-vid-distansavtal-regler-for-foretag/), checked via official page: pre-contract disclosures, ordinary 14-day withdrawal and the online withdrawal function introduced 19 June 2026, including durable acknowledgement.
- [Meta event deduplication reference](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/): retrieval rate-limited in this session; implementation and live deduplication remain to be verified.

No ad campaign was activated or changed, no paid presale was opened and no supplier payment was made. The approved supplier inquiry above was sent and verified in Gmail Sent on 21 October 2026; no supplier availability, dispatch or final landed-cost commitment has yet been confirmed.
