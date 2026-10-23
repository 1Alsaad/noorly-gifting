# Noorly continuation handover — v1.4

> Latest verified continuation: [Private-label requests SENT and first-month projections — 23 October 2026](Noorly_Private_Label_Outreach_and_Projections_2026-10-23.md). **PJ Nordic, M1 and Devillebard were contacted with explicit owner approval; three sends verified. Plan cautiously around break-even or a small first-month loss; the optimistic margin requires better sourcing and conversion.** Read the final checkpoint before relying on older decisions.

Updated 21 October 2026, Europe/Stockholm. Read this first, then [v1.3](Noorly_Continuation_Handover_v1.3.md) for the complete standing decisions and [v1.2](Noorly_Presale_State_v1.2.md) for historical implementation IDs. This is an incremental evidence update; no release is authorised.

## Decisions remain unchanged

Exactly 4,000 SEK total media allocation: up to 2,000 for first offer's initial 4–5-day screen, review day four; reserve 2,000 for justified continuation or one genuinely different product. Historical actual spend is unreconciled. Ads and paid presales stay closed. Friday 23 October is a readiness checkpoint. Domain work stays deferred. No paid apps, samples, inventory, supplier orders, domain purchase or real-payment tests approved.

The Candledust existing scented products are the preferred qualification route; Hertwill alternative fulfilment; Devillebard next own-brand candidate. Target 200–220 SEK all-in per delivered pair excluding recoverable VAT. 599 SEK delivered is an internal price hypothesis, not an approved/saved offer.

## Meaningful progress saved

- [Supplier qualification and rehearsal pack](Noorly_Supplier_Qualification_and_Rehearsal_2026-10-21.md): exact Candledust and Hertwill emails approved and sent, supplier-specific listing draft, quote worksheet, manual release/idempotency ledger and test acceptance procedure. Both were sent and verified in Gmail Sent on 21 October 2026 at 16:19 Europe/Stockholm.
- [Draft PR #9](https://github.com/1Alsaad/noorly-gifting/pull/9), code commit db2db2bf845f971f1f52c207d4086d93d27a5e95: reviewed/recovered unfinished local source edits; preserves variant SKU, image and selected options; variant image follows selection; refuses unknown explicit selections; detects mandatory/optional selling-plan products and blocks ordinary checkout until integrated. Existing cart plan identity is retained on reads and blocked at checkout. New plan selection, mutations and payment schedule support are NOT implemented.
- PR also carries marketing consent separately from analytics into checkout attributes and denies it when omitted. Added tests for independent consent, withdrawal and clearing stale server checkout consent. This is NOT Shopify Customer Privacy API integration, real checkout consent proof or a Meta Purchase implementation.
- Removed fallbacks that could substitute a different variant or an unrelated demo cart image.
- Production release controls unchanged. Code remains in a draft PR, not merged to production. Main receives documentation only.

## Freshly verified access and state

Connected Chrome extension is available and family verified as Chrome. Native app inventory is empty; browser automation works. Shopify and AW are signed in. Do not ask the user to repeat AW login while that session remains valid.

Shopify product 11382623273302: Draft, not published anywhere, inventory zero. All 11 existing AW variant rows show their SKUs and assigned images. Draft prices remain 249 SEK scented / 199 SEK unscented. Swedish copy explicitly says presales closed/no payment, one 300 g pouch/four wicks and excludes vessel, decorations, box and card. No supplier substitution or Shopify product/rate/payment setting was saved by this continuation.

Shopify Payments still shows Complete setup; PayPal Setup incomplete. The setup wizard was inspected and left at Step 1 of 4 (business type); no selection or submission was changed. Payment verification requires owner completion before actual checkout/payment tests. No real or test payment was made.

Live /sv visibly shows the Swedish preparation page without purchase controls. The stronger historical HTTP/blocked-route tests are in v1.2; do not mislabel the fresh visual inspection as repeating every HTTP test.

AW authenticated catalogue: all eleven CSand SKUs stock zero, displayed €6.25 scented / €5 unscented, 300 g. Gmail thread 1a15d99f76b11c55 still contains only the original sent inquiry when rechecked. No supplier reply, allocation or dispatch commitment.

Candledust wholesale page rechecked in Chrome: €50 wholesale threshold; account review within 48 hours is a published statement. The user then registered and reported manual approval pending. A supplier account-created confirmation email was found; trade approval/prices remain unverified. Do not register again or treat registration as purchasing approval. The agent submitted no registration or private business data. Its wholesale page contains inconsistent 5 cm/8 cm multiple-wick spacing; request product-specific written instructions.

Hertwill Nordic Lights 350 g page NOW opens directly (previous access failure superseded). Public listing says IN STOCK, 350 g/five wicks, container separate. Wholesale price behind login. Expanded shipping table lists Sweden but displays no price. Public stock is not an authenticated quantity, allocation or delivery quote. No Hertwill account/app connected.

## Verification of PR preparation

- Local Vitest reports 77 passing tests across 15 files. After extending the cart API consent assertions, that file reports 8/8 passing.
- ESLint passes; source/test Prettier checks pass.
- Local TypeScript fails across Playwright, Radix and testing dependency declarations, including unchanged files. The failures were not resolved or suppressed.
- Local Next build fails before loading next.config.ts: Windows SWC cannot canonicalise jsc.baseUrl, access denied. No local production build or browser rehearsal of this new code passed.
- GitHub verification run [39614191364](https://github.com/1Alsaad/noorly-gifting/actions/runs/39614191364) stopped at formatting in four existing project documents before lint/type/tests/build. Those documents were formatted without changing the decisions so a new PR run can reach code verification. Check the newest run; starting a run is not success. Vercel may generate an automatic branch preview via the existing GitHub integration; no production release was made.
- No complete Shopify presale checkout, successful/failed payment, refund, supplier dry run, tracking or deduplicated Meta Purchase test passed.

## Next actions and genuine blockers

### Additional verification after the initial save

- Current PR head after formatting correction: b44adb42b8b71a48924101172d42ffe1090fa426.
- Clean GitHub run [39614859809](https://github.com/1Alsaad/noorly-gifting/actions/runs/39614859809) passed formatting, lint, TypeScript, unit/component tests and production build. Browser/accessibility and dependency-audit steps were still pending/running at this observation. This supersedes the local-only verification limit, not the missing actual Shopify/payment/supplier/Meta tests. Keep PR #9 draft pending final check results.
- Fresh Shopify shipping overview confirms the dedicated ljussand profile has eleven products and zero zones. No rate was added.
- Windsor discovered the connected Noorly ad account. A read of campaign spend/status/account currency for 1 January–21 October 2026 returned done with zero rows. This is not evidence of zero lifetime spend or confirmation that 4,000 SEK remains available. Actual spend/remaining allocation stays unreconciled; verify directly in Meta before activation. No campaign/budget/status was changed.

1. Await replies to the TWO approved emails now sent and verified. They request indicative Sweden pricing without private address/VAT data. A final quote needs correct business/VAT facts and intended destination postcode; do not invent them or publish private data in GitHub.
2. Obtain supplier responses/documentation and acceptable sample. Sample payment requires separate spending approval. Decide direct fulfilment versus batch-to-Noorly plus Swedish onward shipping using the full quote.
3. Owner completes Shopify payment identity/business/bank verification through Shopify. Do not request passwords, bank details or identity documents in chat.
4. Review PR #9 CI; fix real failures and complete browser verification before merging. Keep it draft while checks remain unresolved.
5. Qualify an authorised presale app/payment schedule and Shopify/custom-storefront compatibility; implement actual selling-plan selection/pricing/preservation. Current implementation safely refuses these purchases.
6. Complete real seller/contact/return facts, Swedish terms, withdrawal/acknowledgement implementation, verified shipping and component bundle pricing. Current private copy and procedure are preparation, not published terms.
7. Verify existing Meta dataset ownership and implement consent-aware paid-order reporting with stable deduplication IDs; test the actual full storefront → checkout → paid order → controlled supplier release → tracking/refund route in test mode/no-charge dry run.
8. Reconcile actual media spend; complete final URL checks after deferred domain work. Keep ads and paid presales closed until all gates and separate user release instruction.

## Local workspace continuity

The workspace contains an existing checkout at noorly-gifting with unfinished source changes on local main based on 64e80a5. These were preserved and reviewed, not blindly discarded. Terminal git fetch failed with a DNS/thread error. Remote main at inspection was 4d0437b052c293c06159b4a2963596d38d096174; source base blobs were compared through GitHub before draft upload. GitHub connector is the saved source of truth; do not assume local tracking refs include later documentation commits. A pre-existing local v1.2 documentation diff must not overwrite the newer GitHub version.

## Approved outreach and latest verification update

The user explicitly approved sending both exact messages in the supplier pack. Sent and read back on 21 October 2026 at 16:19 Europe/Stockholm:

- Candledust: hello@thecandledust.com; thread 1a15ed50a9649ab2; approved subject and complete body verified in Sent.
- Hertwill: hello@hertwill.com; thread 1a15ed5361a22cbd; approved subject and complete body verified in Sent.

No matching sent messages were found immediately before sending. The immediate readback showed only the outbound inquiry in each thread. No quote, stock reservation, sample purchase, supplier order or commercial acceptance followed from sending.

PR #9 run 39614859809 finished with 9 browser checks passing and 1 failing. The failure was a quantity-decrease accessible-label mismatch: the source transfer changed the Unicode minus to a hyphen. The exact local source Unicode was restored using a base64 transfer, with blob hashes verified against local source. Corrected PR head: 8801b05e0094528c794f147352ebe07042d327cc. A new CI run must pass before marking the PR ready; no code was merged or released. The dependency audit was skipped after the failed browser step. Earlier lint, TypeScript, unit tests and production-build passes remain scoped to that earlier run.

## Hertwill authenticated access and prices — 21 October 2026

The user reported Hertwill access; verified in their connected Chrome session. Wholesale prices, variation SKUs and shipping prices are now visible. This supersedes earlier logged-out price/shipping observations. The page still says "Connect your store to start selling"; no store connection, import, sync, app permission, subscription or order was initiated.

Observed products:

- [Nordic Lights refill](https://hertwill.com/product/nordic-lights-scented-candle-sand-refill-350g): title/body 350 g, five wicks, vessel separate; authenticated wholesale price €5.88 excluding VAT; variation SKU `nordic-lights-330g-refill-pearled-candle`; "In stock" with no numeric quantity; Sweden shipping €8.99.
- [Midnight refill](https://hertwill.com/product/midnight-scented-candle-sand-refill-350g): title/body 350 g, five wicks, vessel separate; authenticated wholesale price €5.88 excluding VAT; variation SKU `midnight-330g-refill-pearled-candle`; "In stock" with no numeric quantity. The expanded shipping panel did not produce a visible table in that inspection; the Candledust brand table separately confirms €8.99 for Sweden.
- User's existing [Breeze glass candle page](https://hertwill.com/product/powdered-candle-in-glass-breeze-160g): 160 g glass candle, €6.25 excluding VAT, OUT OF STOCK, Sweden shipping €8.99. It is a different format from the refill; do not price or describe it as 350 g.
- [Candledust brand page](https://hertwill.com/brand/candledust): Sweden shipping €8.99; GPSR contact Candledust OÜ, hello@thecandledust.com, Punane 42, 13619 Tallinn, Estonia. This identifies the manufacturer/contact but does not replace product-specific Swedish labelling, hazard or wick/vessel documents.

The two 350 g refill pages use "330g" in their variation SKUs. Resolve the actual current pack weight and the exact SKU/contents before creating final Shopify listings or supplier routing. A legacy identifier is possible but NOT confirmed. Separate older 330 g refill-kit cards on the brand page show different prices/out-of-stock status; do not silently merge these products.

[Published shipping terms](https://hertwill.com/resources/shipping) say shipping is usually charged once per order, different brands ship separately, shipping prices exclude VAT, remote/large orders can add fees and tracking syncs to Shopify. Sweden generally uses pickup points in the overview; do not promise home delivery. The general 3–8-business-day EU transit estimate is not our confirmed dispatch/delivery promise. A mixed pair and five-pack still need exact packed-quote/parcel confirmation.

Conditional pair model, using the EXISTING planning FX of 11.123 SEK/EUR (not a refreshed live rate):

- Two goods: 2 × €5.88 = €11.76.
- One displayed Sweden shipping charge: €8.99.
- Goods + assumed shared shipping: €20.75 = 230.80 SEK, excluding recoverable VAT.
- This is 10.80 SEK above the 220 SEK target before currency spread, any app allocation, handling and unrecoverable tax. It is not a verified all-in delivered quote.
- At the internal 599 SEK delivered hypothesis, assumed 25% output VAT and 31 SEK fee/refund allowance, contribution before ads would be 217.40 SEK; after hypothetical CAC 120, 97.40 SEK remains before fixed costs/extras. CAC, retail demand and tax treatment remain unverified.

No price, weight, supplier-SKU substitution, shipping rate or product publication was saved in Shopify. Existing AW draft mapping and closure remain unchanged. The already-sent Hertwill enquiry covers price, shipping and holds; the new pack-weight/SKU discrepancy needs written clarification. No new message was sent in this inspection.

### PR check result now confirmed

[Run 39616247297](https://github.com/1Alsaad/noorly-gifting/actions/runs/39616247297) completed successfully after the source-Unicode correction, including browser/accessibility checks and production dependency audit. This supersedes the earlier pending/failed-run status for the corrected PR head. PR #9 remains draft/unmerged; these are development checks, not a real Shopify payment, supplier fulfilment or Meta Purchase test.

## November scenario at authenticated Hertwill rates — 21 October 2026

Requested as a hypothetical revenue/margin exercise. No retail price, budget increase, supplier purchase or release is approved. Use 599 SEK delivered for a two-pouch basket, not the saved AW draft price. "100k" here means customer collections including VAT and delivery, consistent with v1.3; it is not 100k accounting revenue excluding VAT. Unfulfilled presale receipts are not earned profit.

Inputs: two €5.88 refills plus one assumed shared €8.99 Swedish shipment = €20.75; existing planning FX 11.123 SEK/EUR = 230.80 SEK goods/shipping. Shipping for the exact mixed pair, packed weight, handling, FX spread and actual tax treatment remain unconfirmed. Assume recoverable input VAT, 25% output VAT and a 31 SEK/order payment/refund allowance. These are model assumptions.

Per pair: 599 collected; 479.20 excluding assumed output VAT; 230.80 goods/shipping; 31 allowance; 217.40 contribution before ads and additional costs. No measured CAC or conversion rate exists.

167 orders collect 100,033 SEK, equal to 80,026.40 SEK excluding assumed VAT, and require 334 pouches. Across all 30 November days, this averages 5.57 orders/day. A later launch raises the necessary daily pace.

Sensitivity at 167 paid orders; figures below are rounded, and every CAC is hypothetical:

- CAC 80: ads 13,360 SEK; contribution after ads 22,945 SEK; 28.7% of revenue excluding VAT before fixed/unconfirmed costs.
- CAC 100: ads 16,700 SEK; contribution after ads 19,605 SEK; 24.5% before fixed/unconfirmed costs.
- CAC 120: ads 20,040 SEK; contribution after ads 16,265 SEK; 20.3% before fixed/unconfirmed costs.
- CAC 150: ads 25,050 SEK; contribution after ads 11,255 SEK; 14.1% before fixed/unconfirmed costs.
- CAC 200: ads 33,400 SEK; contribution after ads 2,905 SEK; 3.6% before fixed/unconfirmed costs.

These are contribution margins after paid acquisition, NOT net-profit margins. Subtract Shopify, presale app, hosting, Hertwill membership, samples/creative, extra FX/fulfilment charges, owner time where costed, and taxes as appropriate. Every extra 10 SEK/order removes 1,670 SEK at this volume. A 20% contribution margin before overhead permits at most 121.56 SEK CAC with the current incomplete cost model; a 25% margin permits 97.60 SEK. Unconfirmed costs lower those CAC ceilings.

The [Hertwill pricing page](https://hertwill.com/pricing), rechecked 21 October, lists Free at 10 monthly orders and Standard monthly at €24.99 with unlimited monthly orders. At the planning FX, one Standard month is about 278 SEK; no membership was purchased. Other fixed costs are still unknown. [Shipping terms](https://hertwill.com/resources/shipping) confirm prices exclude VAT and shipping is usually once per order; they do not establish our final mixed-pair quote. [Skatteverket standard VAT guidance](https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/momssatserochundantagfranmoms.4.58d555751259e4d66168000409.html) supports the general 25% assumption; actual Noorly registration/invoice treatment still requires verification.

Budget constraint: if the full 4,000 SEK allocation were later assigned to this offer and available unspent, CAC 100/120/150/200 implies approximately 40/33/27/20 paid customers and roughly 24k/20k/16k/12k collections. This is sensitivity arithmetic, not a forecast or authorisation to use the reserve. The initial screen remains capped at 2,000 SEK. To obtain all 167 orders from 4,000 SEK would require approximately 23.95 SEK CAC, or substantial separately evidenced organic/other sales. Neither is supported yet.

Assessment: 100k November collections with useful contribution is commercially possible under strong acquisition performance, sufficient stock, timely launch and working capital, but remains a stretch scenario with no observed demand proof. At CAC 100–120 it requires around 16.7k–20k cumulative ads plus fulfilment cash and reserves; no such expansion is approved. Sales receipts include VAT, fulfilment/refund liabilities and payout timing risk, so do not recycle all receipts into advertising. Validate the first offer's economics and conversion delay before considering a separately authorised scale-up. The current 4,000 SEK allocation alone does not support a defensible 100k paid-sales forecast.

## One-month reinvestment scenario — 21 October 2026

The user asked what is realistic starting with 4,000 SEK media and recycling receipts within one month. This is a model, not an instruction to exceed the standing total media cap or spend the reserve before the initial screen passes.

A conditional working target is around 30–40k SEK customer collections in month one if the first offer validates and at least one further advertising wave can be funded from settled receipts. This is a planning judgment, not a statistically supported forecast or minimum result. A failed first screen can produce little or no revenue and lose up to its 2,000 SEK media allowance plus preparation costs.

Illustration uses the same 599 SEK delivered pair, 230.80 SEK goods/shared shipping, assumed 25% VAT and 31 SEK payment/refund allowance. Each collected order therefore leaves 217.40 SEK before advertising, fixed costs and unconfirmed extras. Only settled cash remaining after VAT, fulfilment and refund liabilities can be recycled. Recovering and reusing the original advertising capital is included; reinvesting just incremental profit is a slower scenario.

For arithmetic only, treat 4,000 SEK as the first complete advertising wave after the initial 2,000 SEK gate and any approved continuation. Fractional orders below are rounded planning expectations, not literal orders:

- At hypothetical CAC 150, first wave supports about 27 orders/16k collections. After liabilities, around 5,797 SEK is available for the next media wave before fixed costs/extras. Reinvesting all of that at unchanged CAC supports about 39 additional orders/23k collections. Combined: about 65 orders, 39,124 SEK collections, 9,797 SEK cumulative ads and 4,402 SEK contribution after ads, before overhead, unconfirmed charges, tax and owner pay.
- At hypothetical CAC 120, the corresponding two-wave result is about 94 orders, 56,139 SEK collections, 11,247 SEK cumulative ads and 9,128 SEK contribution before overhead/extras.
- At hypothetical CAC 180, two waves produce around 29,388 SEK collections and 1,835 SEK contribution before overhead/extras. Reinvestment does not rescue weak unit economics.
- Three fully recycled waves at unchanged CAC 120 mathematically reach around 121,671 SEK collections, but assume uninterrupted demand, fast payouts, sufficient stock, no extra costs and enough days to spend/convert each wave. This is an upside sensitivity, not a credible base forecast for a new unverified store.

The [Shopify Sweden payout guidance](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries/sweden/payouts), checked 21 October, states minimum settlement of three business days, longer initial settlement, and typically another 24–72 hours for bank processing. [Payout timing guidance](https://help.shopify.com/en/manual/payments/shopify-payments/payouts/payout-timing) also describes potential account holds. Noorly's actual schedule is unverified because Payments setup is incomplete. Do not plan instant or guaranteed weekly capital turns.

The 4,000 SEK is advertising capital, not demonstrated total cash needed. At CAC 150, the first approximately 27 orders imply roughly 6,155 SEK supplier goods/shipping charges; timing determines how much must be financed before customer payouts. No supplier credit terms or working-capital facility is confirmed. If 4,000 SEK is the entire available cash rather than media-only funding, the example overstates what can be funded.

Planning assessment: aim for a profitable 30–40k first month conditional on the screen passing; 50–60k would require a stronger acquisition/cash-cycle result; 100k is an upside goal with several favourable dependencies. None can be called probable without actual purchase/conversion, payout and fulfilment evidence. The initial first-offer screen and all release gates remain unchanged.

## Swedish demand research and forecast qualification — 21 October 2026

Saved [demand evidence and cash-cycle sensitivity](Noorly_Swedish_Candle_Sand_Demand_2026-10-21.md). Read this before using the earlier November/reinvestment scenarios.

Live Chrome Google Trends inspection (Sweden, five years, search terms ljussand/sandljus/candle sand) showed sparse normalized data and a late-2024 sandljus spike, without evidence of sustained current growth. Low-volume zeros do not mean no searches. Swedish retailer reviews, including verified-interaction labels on Sandig's 18-review Trustpilot profile, support customer interest but do not quantify the addressable market.

Read-only Meta Ads Library keyword searches returned estimated active-ad totals of 15 for sandljus and one for ljussand. All ten returned sandljus results were AuraCandles: these are NOT 15 competitors or evidence of profitable ads.

Material price finding: Candledust publicly advertises the same Nordic Lights/Midnight 350 g refills at €16.90 each, alongside a free-EU-shipping-from-€25 banner. Two product prices total €33.80/about 376 SEK at the old planning FX, versus Noorly's unsaved 599 SEK hypothesis. Swedish checkout VAT/shipping/promotion eligibility was not verified. Reassess the premium/value proposition and resulting allowable CAC before spending; do not imply extra kit contents.

Forecast qualification: 30–40k first-month collections is a conditional working scenario if paid purchases validate and capital can be recycled, NOT the most likely result established by research. At hypothetical CAC 150 and two complete cash waves, arithmetic gives about 39.1k collections and 4.4k contribution after about 9.8k cumulative media, before overhead/extras. That cumulative spend exceeds the current cap and remains unauthorised. 50–60k needs stronger acquisition/cash timing; 100k remains an upside scenario. Failure/near-zero sales remains possible. Fulfilment working capital is separate from the 4,000 SEK media allocation.

Only research/documentation was saved in this step. No ads, presales, retail prices, store settings, additional outreach, subscriptions or orders changed.

## Work completed while supplier replies are pending — 21 October 2026

Saved and read back the [offer, backup and technical preparation dossier](Noorly_Offer_Pricing_Backup_and_Technical_Preparation_2026-10-21.md). This qualifies the earlier demand report and hypothetical pricing.

Candledust retail checkout was inspected in connected Chrome with exactly one Nordic Lights refill plus one Midnight refill. Both country selects read Sweden/SE; total €33.80, FedEx free delivery, included VAT displayed €6.54. No private/customer/payment fields were filled, no coupon/order submitted, and our comparison basket was cleared afterwards. This is a pre-address quote, not a purchased receipt or final postcode-specific invoice. About 376 SEK uses the old planning FX. A screenshot attempt failed; do not claim a saved screenshot.

Recommendation: do not approve the plain 599 SEK resale pair for advertising on current evidence. Resolve direct-supplier landed costs and credible customer value first. At provisional Hertwill cost, 499 SEK leaves 137.40 before ads and only 17.40 after hypothetical CAC 120, before overhead/extras; a 20% contribution target allows CAC only 57.56. No retail price changed.

Backup research used live Google Trends (Sweden/five years) and live Amazon.se bestseller pages plus Svensk Handel's prior-year Christmas context. Vetekudde and ullstrumpor show repeated winter interest; sovmask is more summer-oriented. The first research candidate is a non-electric unscented adult microwave wheat cushion with verified removable washable cover. Amazon heat-pad leaders show strong competition around 117–263 SEK; no premium demand or supplier margin is proven. At hypothetical 399 delivered/CAC 100/20% contribution, landed goods+packing+fulfilment+delivery ceiling is 124.36 SEK excluding recoverable VAT. This is not a quote or chosen retail price. Candidate remains unqualified; no backup spend, sourcing order or outreach occurred.

Saved private Swedish holding-page/ad drafts and a disabled mixed-pair routing specification in the dossier. These are repository drafts, not published Shopify/page/ad changes. The existing AW draft mapping is unchanged; Candledust Shopify IDs remain unassigned while 330g/350g supplier identifiers are unresolved. No supplier payload was submitted.

[PR 9](https://github.com/1Alsaad/noorly-gifting/pull/9) metadata now reflects its verified full CI success. [New draft PR 10](https://github.com/1Alsaad/noorly-gifting/pull/10), head 394ea3666e5cc9f3e161da4e77be00c8e97beb0c, prepares an unused server-side Meta Purchase eligibility/shared-ID contract. It rejects unpaid, partial, refunded, cancelled, test, invalid and non-consented inputs; preserves actual paid time/value; strips extra customer details. No caller, network delivery or live tracking exists. It cannot authenticate caller assertions and does not itself deduplicate at Meta.

Local targeted verification: 37 tests pass across five files, including 19 new contract cases; new files pass formatting/lint. [PR 10 CI run 39638665538](https://github.com/1Alsaad/noorly-gifting/actions/runs/39638665538) independently passes formatting, lint, TypeScript, unit/component tests, build, browser/accessibility and dependency audit. Both PRs remain draft/unmerged; no complete Shopify checkout/payment/supplier/Meta test passed.

Read-only Meta account/dataset inspection found an active SEK Noorly advertising account and one assigned legacy-named dataset, last browser event reported in 2022. Dataset identity/current storefront wiring remain unconfirmed. No account setting, dataset, campaign or event was changed. Do not connect the existing analytics-only outbox relay to Meta as though it verifies marketing consent.

Shopify's current Customer Privacy documentation says checkout should share the storefront root domain to respect its consent cookies. Existing separate Vercel/Shopify surfaces are not proof of that synchronization. Domain work stays deferred; the cross-surface consent test remains a release gate. Owner payment verification, intended dataset confirmation, supported presale mechanism, final seller/returns facts, supplier terms/sample and actual no-charge end-to-end tests remain open.

The 4,000 SEK total media cap and 2,000/2,000 split remain unchanged. No ads, paid presales, paid apps, samples, inventory, supplier orders, additional emails, domain or real-payment tests were activated.

## Password-protected owner preview and ad gallery — 21 October 2026

User explicitly requested a password for admin site viewing and to see the drafted ads. This authorises the scoped owner-preview deployment, not sales/advertising activation.

[PR 11](https://github.com/1Alsaad/noorly-gifting/pull/11) was merged after successful [CI run 39642571983](https://github.com/1Alsaad/noorly-gifting/actions/runs/39642571983): formatting, lint, TypeScript, unit/integration tests, production build, all eleven browser/accessibility tests and dependency audit. Seven new local security tests pass. An initial formatting failure and a browser-origin login failure were corrected before merge; the regression test covers the framework's internal host differing from the validated public browser origin.

Production code commit: 192c3328e877c4ccc916961e551c3963e8313ad2. Vercel deployment dpl_HdW4oAxcXVEBMjavGHPgyv3PRH9s reached READY and the canonical noorly-gifting.vercel.app alias was assigned. Existing draft PRs 9 and 10 remain unmerged.

- Owner login: https://noorly-gifting.vercel.app/admin-preview
- Internal ad-copy gallery: https://noorly-gifting.vercel.app/admin-preview/ads
- A generated 32-character password is stored only in the production Vercel sensitive server variable ADMIN_PREVIEW_PASSWORD. Never copy the value into GitHub, source, screenshots, URLs or handovers. It was provided privately to the owner in the task response.
- Sessions use signed HttpOnly/Secure/SameSite=Lax cookies, last eight hours, and are invalidated by password rotation. Logout clears this browser's session. Login has same-origin/body-size checks and bounded per-instance attempt throttling; this is not distributed throttling.
- A valid owner session bypasses only the public layout hold. The internal view clearly labels example products/prices and closed ordering/payment. It does not open cart/checkout or change NOORLY_STOREFRONT_OPEN. Analytics initialization is omitted in the closed-store owner preview.
- Preview/login pages have private/no-store and noindex controls. No paid hosting protection, app or new service was purchased.

Live connected Chrome verification passed: unauthenticated gallery redirects to login; deployed password reveals the internal design and warning banner; both exact Swedish copy drafts display; logout restores the public preparation page; after signing in again, GET /api/cart still visibly returns cart:null/storeClosed:true. The gallery was left open for the owner. No browser console errors were observed on that gallery. This is browser/HTTP verification, not a complete order/payment/fulfilment/Meta test.

The gallery contains TWO COPY DRAFTS from the preparation dossier: “Doft och levande ljus till hemmakvällen.” and “En presentidé för den som tycker om att skapa hemma.” It explicitly says image ads are not finished, scheduled or active; no generated imagery was added. Preview copy must not be mistaken for a purchase-validation campaign. No campaign, social queue, supplier order, paid presale, payment or domain setting changed.

## Correction: original film storefront and actual Meta creatives — 21 October 2026

The owner clarified that the previous storefront with its video should be restored with only owner password access, and that the requested ads were the actual saved Meta creatives. The prior copy-gallery interpretation was incorrect. This supersedes the gallery description above.

Restoration source: saved commit e7393cb3f5f3d4f599888af997622b2d7ee0e3ed, including the continuous responsive 15-second winter film, matching first-frame posters, scroll choreography, original catalogue and product-test behavior. Current main had reverted to the foundation's missing local MP4 placeholders. Historical permanent CDN URLs were recovered; no replacement footage was generated. Desktop media ID 46439a25-f450-49f4-b8b1-785e0d1bc834; portrait ID 0e98a61d-fd67-4fee-8c28-793ca27c6fce.

[PR 12](https://github.com/1Alsaad/noorly-gifting/pull/12) restores that implementation while preserving the password session and server-side closed-store cart guard. Unauthenticated closed-store visits redirect to /admin-preview. The mistaken copy gallery redirects back to the storefront; its navigation link is removed. Existing password remains unchanged and is never stored here. PRs 9 and 10 remain unmerged preparation.

Read-only Meta verification found the ORIGINAL saved creative objects in Noorly account 479891386519342: candle sand 856684787503853 (CSand-11 / A quiet gift) and notebook 949012087890927 (PNB-01 / Room for little thoughts). Both actual Facebook mobile feed previews were opened and visibly verified in connected Chrome, including their images and original Swedish copy. No new creatives or ads were created. Their ACTIVE creative-library state does not mean ads are delivering. Ads Manager displayed “You haven't created any ads yet”; the published-ad API returned an empty list. Draft-list API is unavailable for this account, so no claim is made that it independently enumerated all unpublished drafts. Historical billing rejection explains saved creatives without attached ad entities; this was not retried.

Public Ads Library was also opened separately for Swedish sandljus searches. Public library results are competitor ads, not Noorly's unpublished creative objects. Temporary signed preview URLs are intentionally omitted from GitHub.

Validation: [CI run 39644969526](https://github.com/1Alsaad/noorly-gifting/actions/runs/39644969526) passed formatting, lint, TypeScript, 96 unit/component tests, production build, 21 browser/accessibility tests and dependency audit. PR 12 merged as 3509c379d986a3d0625ccf3762b91ffb5aafe2dd. Production deployment dpl_J4tpSPYHSFMaLXrj49rPdhqV6B9g reached READY with canonical alias noorly-gifting.vercel.app.

Live connected Chrome confirmed the restored film's portrait CDN source and 15-second duration, currentTime advancing to 4.782913 after scrolling, and a visibly decoded original candle/pouch frame. Logout followed by direct /sv navigation redirected to the password form; the unchanged password successfully reopened /sv. The copy-gallery link was absent. A later reverse-scroll/cart follow-up was interrupted by browser transport closure and is not claimed as verified. The previous build's live cart-closed result and current automated closed-store tests remain evidence; no complete order, payment, supplier or Meta conversion test occurred.

No ads, paid presales, supplier orders, paid services, payments, outreach or domain changes were activated. Total media allocation remains 4,000 SEK with the standing 2,000/2,000 gates.

## Supplier reply and alternative-product assessment — 22 October 2026

Read [the current assessment and two exact unsent enquiries](Noorly_Supplier_Reply_and_Product_Assessment_2026-10-22.md) before acting on earlier assumptions.

Gmail: Hertwill responded at 08:25 Europe/Stockholm, message 1a162497d06eb77a in thread 1a15ed5361a22cbd. Its email explicitly says it was written by AI. No direct Candledust or AW reply was found in the original threads or the broader supplier search, including in:anywhere.

Hertwill says manual fulfilment requests trigger card charging/processing; mixed same-brand refills normally share shipping. These controls have not been tested in Noorly. It supplies no numerical final quote, stock quantity or packing calculation. It calls the refills 330 g and supplies different identifiers from the previously observed 350 g variation rows; do not silently remap them. Swedish labels are unavailable, custom gift packaging is not standard, no complete no-charge test is offered and duplicate/retry handling needs technical review. The Free-plan eleventh-order handling remains unanswered.

Public terms confirm the Standard monthly EUR 24.99/free ten-order limits and reveal that SOCKS ARE EXCLUDED from supplier returns; generic email wording about 30-day returns must not be applied to socks. The supplier return window starts at original order, and the office address is not the returns warehouse. Required Swedish physical product labelling/classification remains a release gate for the scented refills. No blanket claim that every scent has the same classification.

Assessment: keep the 599 SEK plain pair on HOLD; direct Candledust remains a conditional preferred qualification route, pending its existing-product quote. Public retail still lists the two refills at EUR 16.90 each/free EU shipping threshold EUR 25. Do not transfer the manufacturer's printed private-label MOQ/lead time to finished branded refills.

Alternative sourcing enquiry: Terrible Twins Natur unscented linen wheat warmer, 50 x 18 cm, public retail 325 SEK, official retailer contact Sara/info@terribletwins.se. Wholesale price, stock, SKU, washable-cover construction and individual fulfilment are unconfirmed. Jula's 99.90 SEK washable-cover wheat cushion weakens a generic premium offer. At 325 delivered/CAC 75/31 allowance/assumed 25% VAT/20% contribution, maximum delivered goods/fulfilment cost is 102 SEK before overhead. At CAC 100 it is 77 SEK. These are sourcing limits, not quotes or approved prices. No replacement winner or launch date is established.

Baltland merino socks are lower priority owing to unverified wholesale economics, sizes and supplier-return exclusions. The inspected AW wheat-bag products are EMPTY and excluded as ready-to-use products. Prior Trends/Amazon findings remain dated 21 October; today's fresh requests failed and connected Chrome/local runtime were unavailable. No fresh ranks, charts or authenticated prices were obtained.

The dossier contains a Hertwill human/technical clarification and a Swedish Terrible Twins enquiry, both NOT SENT. Explicit exact-message approval is required before sending. No paid plan, app, order, sample, advertising, real payment, website/Shopify setting or domain change occurred. Total media cap and 2,000/2,000 decision gates remain unchanged.


## AliExpress Q4 product research — 22 October 2026

Read [AliExpress Q4 product research](Noorly_AliExpress_Q4_Product_Research_2026-10-22.md) for six candidate categories, exact item links, historical source-price dates, Swedish retail comparisons, current Meta Ad Library results and illustrative delivered-cost limits.

Provisional qualification order: a complete adult craft kit, then a quality adult blanket hoodie, with a pet-hair cleaning bundle as an evergreen alternative. Book nooks have relevant Swedish ad activity but researched sourcing prices are high. Generic rechargeable hand warmers face low Swedish retail competition; candle-warmer lamps need exact-model qualification given current model-specific recalls. None is a verified winner or approved replacement for the prior fallback.

Etsy's October 2026 seasonal report supports the craft-category hypothesis using U.S. Etsy data; it does not establish Swedish demand or exact AliExpress sales. Public active-ad counts likewise do not establish profitability. Live Swedish Google Trends/Amazon bestseller verification was not obtained.

Chrome/Computer were retried after the owner's requests and Browser tag, but startup failed. No authenticated AliExpress price, seller quality, full-variant contents, Swedish shipping quote or delivery ETA was verified. Archived USD prices are research leads, not landed costs.

At a hypothetical 100 SEK CAC, 30 SEK payment/refund allowance, assumed 25% VAT and desired 20% contribution on ex-VAT revenue, the delivered-cost ceiling is 125.36 SEK for a 399 SEK craft kit, 189.36 for a 499 SEK hoodie, and 93.36 for a 349 SEK pet bundle. These are sourcing constraints, not quotes or final prices.

Only research documentation was saved. No supplier contacted, sample bought, product changed or ad activated. The 4,000 SEK total media cap and standing 2,000/2,000 gates remain unchanged.


## Swedish batch presales and vessel sourcing — 23 October 2026

Read [batch presale and vessel sourcing assessment](Noorly_Swedish_Batch_Presale_and_Vessel_Sourcing_2026-10-23.md). The owner asked to reassess AW's EUR 6.25 pouch price, source a bowl/vase, and evaluate taking presales before ordering a batch for dispatch from Sweden. This is research/preparation, not an activation or purchase instruction.

AW's public FAQ confirms ex-VAT, freight-exclusive pricing. Its family catalogue still shows zero stock for all eleven variants. The Sweden tariff shows EUR 9.60 for 0–2 kg and EUR 17 for 10–30 kg; fifty 300 g pouches would imply EUR 0.34 inbound freight each if the actual shipment fits one parcel. Domestic delivery, packing, handling and returns still apply. No stock or dispatch commitment was obtained.

Preferred separate-source vessel lead: Candle Shack BV clear 50cl Lotti bowl GLAS0501, EUR 3.07 ex VAT for 1–59, EUR 2.77 for 60–119, internal diameter 11.6 cm. Page displayed 314 available, unreserved. Frosted GLAS0500 was out of stock. Candledust's own 8 x 9 cm glass is an alternative at public EUR 4.80, with actual B2B pricing pending. A normal wooden bowl is not qualified by the storefront image; use a suitable non-flammable, heat-resistant component and confirm the exact sand/wick/vessel configuration.

**New supplier correspondence, superseding the earlier no-reply state:** Candledust replied and approved the reseller account on 22 October around 21:18 Stockholm time. Reply message 1a1650c9ae177a65 in thread 1a15ed50a9649ab2 explicitly describes batch-to-Noorly fulfilment and no direct dropshipping for new accounts. It states stock allocation occurs on ordering, not reservation, and still owes wick-spacing clarification. Approval message 1a1650d2a1eee439 states a EUR 100 wholesale minimum and extra basket discounts at EUR 200 / 800 / 1,500. The personal reply's no-minimum wording conflicts; plan EUR 100 until clarified. Exact trade prices, stock quantities and Swedish freight are not authenticated or quoted.

Recommendation: qualify a one-pouch/one-vessel complete kit and a small, clearly dated presale followed promptly by Swedish batch dispatch. No final retail price is selected. The report gives the markup arithmetic, logistics comparison, a 10–20-order pilot proposal and two unsent supplier clarification briefs. Preorder payment, delivery/cancellation information, sample/product checks and cash timing remain necessary. The current payment/custom-storefront flow was not freshly reverified and no paid end-to-end test passed here.

Only documentation was saved. No supplier contacted, sample/order purchased, live product/website/payment setting changed, or advertising/presale activated. The 4,000 SEK total media allocation and standing 2,000/2,000 gates remain unchanged; inventory/fulfilment working capital is separate.


## Carved bowls, Noorly name and domain preparation — 23 October 2026

Read [carved bowl sourcing, brand assessment and domain handoff](Noorly_Carved_Bowls_Brand_and_Domain_2026-10-23.md). The owner clarified the desired vessel is a large sculptural carved wooden bowl. This supersedes the plain-glass vessel as the preferred aesthetic, while exact candle-use qualification remains open.

AW's public EU catalogue lists rough organic TeakB-31 (31 x 22 x 8 cm) at EUR 14.80 / stock 91; snake-shaped TeakB-29 (55 cm) EUR 12.50 / stock 92; leaf-shaped TeakB-34 (40 x 24 x 5 cm) EUR 19.50 / stock zero. Prices exclude VAT/freight, are unreserved and are not a confirmed AWGifts batch quote. Indonesian Wholesaler TBL10 offers larger 40/55 cm organic teak-root bowls, MOQ ten, pre-order, login-gated ex-works pricing. No landed quote or lead time was established. Ordinary fruit/decor bowls are not a verified candle system; an appropriate insert or validated exact-use evidence remains necessary.

The 31 cm bowl + EUR 6.25 pouch already costs EUR 21.05 ex VAT before insert, packing, shipping, fees and ads. Bowl plus 300 g pouch weighs at least 1.6 kg before packaging; previous 1 kg delivery and EUR 3 glass-vessel assumptions do not carry across. Required fill quantity is unverified.

Commercial name recommendation: keep Noorly for the Swedish home-and-gifting pilot. It is short and flexible but is not globally unique; Noorly.in sells laundry/fragrance-related goods and other Noorly apps/software exist. No completed PRV/EUIPO/WIPO clearance or legal availability claim. Noorly.com was unavailable through checked tools.

**New scoped owner authorisation:** assess the name and, if good, prepare domain purchase until registration/payment for the owner to complete. This supersedes earlier deferred domain preparation, but not the owner's control of actual registration/payment. Two individual Vercel registry lookups reported noorly.se available; an earlier false batch result was inconclusive. No reservation.

Chosen handoff: https://www.loopia.se/bestall/ for noorly.se, one year, free LoopiaDomän/domain-only account. Public first year SEK 11.25 incl. VAT; annual renewal SEK 361.25 incl. VAT; final basket remains to be checked. Paid hosting, email and LoopiaDNS are optional. Interactive Browser/Chrome control was unavailable and opening the Codex browser panel failed, so no filled checkout or registration/payment screen was left open. The owner receives the direct order link, target and transparent costs. Do not claim the domain was bought or checkout completed.

Only research/documentation was saved. No registration/payment/customer information was submitted, account created, DNS changed, supplier contacted, product/store changed, order purchased or ads/presales activated. Existing media cap and gates remain unchanged.


## New-chat continuation checkpoint — 23 October 2026

The owner is starting a new chat and explicitly requested that this GitHub handover be updated. Read this checkpoint together with [carved bowls, brand and domain research](Noorly_Carved_Bowls_Brand_and_Domain_2026-10-23.md) and [Swedish batch presales and vessel sourcing](Noorly_Swedish_Batch_Presale_and_Vessel_Sourcing_2026-10-23.md). Latest owner decisions override older plans, in particular the earlier deferral of domain preparation and the earlier preference for a plain glass vessel.

### What the owner wants next
1. Use the owner's actual connected Chrome tabs/Computer window, inspecting access before asking for any sign-in.
2. Finish the noorly.se registration/purchase preparation and stop where the owner needs to register and pay. The prior commercial assessment recommends retaining Noorly for the Swedish pilot; trademark clearance is not completed. Recheck domain availability and the actual basket before relying on the dated public quote.
3. Continue sourcing large, organic, sculptural hand-carved bowls like the reference/storefront, rather than treating an ordinary glass jar as the chosen visual product. Prioritise the best-matching AW 31 cm rough bowl and larger 40–55 cm alternatives. Verify exact wholesale cost, actual usable size, stock, packed weight, batch freight to Sweden and a suitable candle-use configuration. Supplier outreach, samples and inventory orders have not been newly authorised.
4. Assess a small dated presale followed by bulk inbound stock and dispatch from Sweden using the real kit costs. This remains preparation, not permission to enable paid orders or advertising.

### Browser/Computer retry evidence
After the domain report was saved, the owner explicitly requested Chrome tabs and tagged Computer twice, including “try again.” Fresh tool discovery still exposed no Computer screen-control or Browser/Chrome tab-control tools. Executor skill discovery reported failed inspections of local capability roots for browser, unified-computer-use, chrome and computer-use at bundled version 26.1016.51333: “The system cannot find the file specified. (os error 2).” This is a local capability-loading diagnostic, not evidence that the owner's Chrome is signed out or that a particular web page refused access.

No actual Chrome tabs/window could be inspected or controlled in these retries. No plugin was repaired/reinstalled and no browser settings were changed. A restart/new chat may have different capabilities, so inspect the new session afresh; do not assert that the old error still applies without checking. Do not repeatedly ask the owner to tag an app that is already tagged or sign in without an observed sign-in block. Read and follow the currently available browser/computer skill before using its tools.

### Confirmed state to preserve
- Domain NOT registered, purchased, reserved or connected. No Loopia account or verified filled checkout exists from this work. The earlier attempt to open the Loopia page in the Codex browser panel failed. The actual pending handoff is https://www.loopia.se/bestall/ for noorly.se, one year, domain only/free LoopiaDomän account; public first year SEK 11.25 incl. VAT and renewal SEK 361.25 incl. VAT were checked on 23 October. These prices and availability need fresh basket verification. The owner will supply registration/payment information and complete the purchase. Paid hosting, email and LoopiaDNS are optional, not selected.
- AW TeakB-31 public price EUR 14.80 ex VAT, stock 91; TeakB-29 EUR 12.50, stock 92; TeakB-34 EUR 19.50, stock zero. These are dated public catalogue observations, not reserved stock or authenticated batch quotes. TeakB-31 plus EUR 6.25 pouch already totals EUR 21.05 ex VAT and weighs at least 1.6 kg before packaging. Required sand fill, suitable insert, complete kit cost and final retail price remain open.
- Candledust has replied and approved the reseller account. It offers batch-to-Noorly fulfilment, not direct dropshipping for new accounts. The approval's EUR 100 minimum conflicts with the personal reply's no-minimum wording; assume EUR 100 pending clarification. Authenticated prices, stock, Sweden freight and wick-spacing clarification remain open. Do not revert to the superseded no-reply state or treat different suppliers' 300/330/350 g products as the same SKU.
- Preserve the restored original 15-second winter storefront film and password protection. Ordering/payment, paid presales and ads remain closed/inactive from this work. Use the existing Shopify store tzwngp-h1; do not create a duplicate store.
- The total media allocation remains SEK 4,000 with the standing SEK 2,000 initial test / SEK 2,000 reserve gates. Inventory and fulfilment working capital is separate. Do not assume the remaining balance without checking.
- No supplier contacted, sample/inventory order placed, paid app added, payment submitted, campaign launched, DNS changed or store activated during these retries.

Repository: 1Alsaad/noorly-gifting. Existing Shopify: https://admin.shopify.com/store/tzwngp-h1?country=SE. Storefront: https://noorly-gifting.vercel.app/sv. Continue keeping GitHub as the source of truth and record only work actually performed. Do not place credentials, owner-preview password, tokens or payment details in the repository.


## Chrome checkout and authenticated wooden-kit checkpoint — 23 October 2026

Read [domain checkout and wooden complete-kit qualification](Noorly_Domain_Checkout_and_Wooden_Kit_Qualification_2026-10-23.md) for the current evidence, exact basket totals, larger alternatives, caveats and the full economics model. This checkpoint supersedes the earlier same-day browser failure, unprepared-checkout and unauthenticated-price states.

### Access and owner instructions

Chrome worked in this session. The owner explicitly changed the interaction scope to Chrome only; no native Computer window was used. AW Dropship was already signed in. AWGifts and Candledust initially showed login forms; after inspection the owner signed into both and authenticated prices were obtained. Do not revert to the earlier missing-controls assumption or repeatedly request app tags/sign-in without checking current state.

### Domain: actual checkout prepared

The live Loopia checkout was left open for the owner: noorly.se only, one year, SEK 11.25 including SEK 2.25 VAT. Published standard renewal is SEK 361.25/year including VAT. No hosting, email, paid DNS or extra domain was selected. Registration fields and terms/marketing checkboxes were left blank/unchecked; BankID and manual registration were available. A readable local screenshot was saved and the tab marked for owner handoff.

The owner will register and pay. The domain remains NOT purchased, registered, reserved or connected by this work. Orderable at inspection does not reserve it. No final Beställ/payment submission or DNS action occurred. Keep Noorly remains the commercial recommendation; trademark clearance remains unverified.

### Actual wholesale baskets, not purchases

- AWGifts TeakB-31 rough organic bowl: standard EUR 11.40 ex VAT; 20-unit basket applied 10% first-order discount, yielding EUR 205.20 goods net, EUR 29.95 Sweden freight, EUR 58.79 VAT and EUR 293.94 cash total. Stock showed 91. Displayed basket weight 26 kg is a catalogue-derived figure, not a measured master-carton specification. Do not assume this discount repeats or stacks. The former EUR 14.80 is the separate AW Dropship price.
- AWGifts TeakB-29 approx. 55 cm: EUR 13.25 ex VAT, EUR 11.93 member price displayed, in stock; its multiple shallow compartments make it a weaker match than a broad organic bowl. TeakB-34 40 × 24 × 5 cm: EUR 15.00 ex VAT, member EUR 13.50 displayed, out of stock. Do not silently merge these with different Dropship prices.
- Larger alternatives: Indonesian Wholesaler TBL10 40/55 cm, MOQ ten/pre-order/ex-works/login-gated, still no landed quote; Dareels NERO 50 × 40 × 12 cm EUR 70 public retail, not wholesale. Dareels' 17 kg / two-unit carton statement needs clarification.
- Candledust Nordic Lights and Midnight 350 g: EUR 5.80 each displayed wholesale. Actual cart of 20 each plus the owner's pre-existing black 250 g sample: EUR 240.50 subtotal, EUR 27.28 FedEx to the existing Swedish destination, EUR 267.78 total including EUR 51.83 VAT. No discount displayed. Legacy cart SKUs contain 330g while current product text says 350 g; physical packs still require verification.
- Alternative 20 × Rhubarb Sparkle 650 g plus the same sample: EUR 12.12 each displayed; actual category discounts and EUR 29.76 freight yielded EUR 255.56 including EUR 49.46 VAT. Do not carry this discount to the 350 g basket. Do not call these displayed Candledust prices ex VAT.
- Candle Shack GLAS0501: stock 314 displayed; 20-unit Sweden checkout EUR 61.40 goods + EUR 15.35 estimated tax = EUR 76.75 before freight. Shipping required full contact/address input; none was entered and freight remains unquoted.
- AW sand catalogue still showed zero stock for all eleven variants. Candledust carts accepting quantities are not allocation or guaranteed stock/dispatch evidence.

Temporary quotation additions were removed after inspection: AWGifts and Candle Shack carts verified empty; Candledust restored to its original one black sample. No order, payment, supplier message or reservation was submitted. A generated AW basket reference labelled “Order Number” is not evidence of a placed order.

### Complete-kit economics and remaining gates

The report models the wooden bowl, glass insert, two sealed 350 g packs, all three inbound routes, packing, domestic delivery, VAT, payment fees, FX, labour, damage/returns and advertising. Verified basket costs are distinguished from allowances.

Conservative 20-kit scenario uses the old planning FX 11.123 SEK/EUR, supplier cash totals without assumed input-VAT recovery, 25% output VAT, SEK 15 insert-freight allowance, SEK 30 packing, SEK 109 domestic >2–3 kg tariff, SEK 20 labour, SEK 15 damage/returns, 2% FX allowance and assumed payment fee 3% + SEK 3. Cost before customer payment fee/ads is SEK 551.49 per kit. At CAC 100, contribution before fixed overhead is approximately -39 at SEK 799 delivered, 38 at SEK 899, 115 at SEK 999 and 192 at SEK 1,099. No final price or demand validation is established. Exact VAT treatment and merchant fees remain unverified.

The two verified supplier baskets alone require about SEK 6,248 cash; inserts, packaging, final delivery and other costs are additional. Working capital is separate from the SEK 4,000 media allocation (2,000 initial / 2,000 reserve). No spending or launch approval follows from this research.

No bowl is qualified for direct candle-sand use. A suitable insert must be checked as part of the whole wooden assembly. Usable internal dimensions, required fill, thermal behaviour, stable fit and final packed weight remain open. Manufacturer calculator examples (12 cm × 5 cm = 0.57 kg; 20 cm × 5 cm = 1.57 kg) are hypothetical fills, not measured kit requirements. Current central instructions and some product-page spacing/minimum-diameter text still conflict. Exact instructions, scent documents and Swedish labelling remain gates.

Next work: obtain sample/purchase or supplier-contact authorization only when the owner chooses that next step; then settle the actual assembly, insert freight, measured parcel, stock/dispatch and full payment/refund flow before any paid pilot. Preserve original 15-second winter film, password protection and Shopify tzwngp-h1. No ads/presales, DNS, store settings, payments or supplier contact were activated in this continuation.


## Latest continuation: domain paid, VAT status and offer decision — 23 October 2026

Read [the offer and presale decision](Noorly_Offer_and_Presale_Decision_2026-10-23.md) first. This is the newest checkpoint and overrides older statements about an unpaid domain or unknown VAT-registration status.

### Owner updates and verified completion

- The owner reports noorly.se purchased. The existing Loopia page in connected Chrome showed successful payment / transaction completed. Record purchased/paid by owner. Registry activation and Shopify connection were not independently verified; no DNS was changed. No further domain checkout preparation is needed.
- The owner confirms Noorly is **not yet VAT-registered in Sweden**. Small-business VAT exemption eligibility and foreign-service purchase obligations remain to resolve. Do not automatically subtract 25% output VAT from an eligible exempt pilot, or assume input tax can be reclaimed.
- Chrome access worked. The owner's Chrome-only instruction remains; no native Computer window was used. Signed-in supplier access was reused without another login request.
- A new actual Candledust quote was verified for 20 Midnight 1 kg sealed packs (17 wicks each) plus the owner's original black 250 g sample: EUR 275.10 subtotal; EUR 37.20 FedEx Sweden delivery; EUR 0.86 accessories and EUR 26.66 value-pack discounts; **EUR 284.78 total including EUR 55.12 VAT**. Numeric available stock/allocation and dispatch date remain unconfirmed. All 20 added packs were removed and the original one sample verified remaining. No order or payment was submitted.
- Bulk-by-kilogram prices were not demonstrably cheaper than sealed kilogram packs at the observed account prices. No loose-powder repacking/private-label cost saving is established.
- Read official Skatteverket small-business/registration guidance and Fraktjakt weight/volume pricing guidance. No tax registration or shipping account was created.

### Commercial recommendation, not launch authorization

Qualify a single sculptural wooden complete kit, then consider a capped presale followed by consolidated supplier batches into Sweden and one domestic customer parcel. Refills are better suited to add-ons/repeat purchases than separate paid-acquisition orders.

Preferred value concept to qualify: AWGifts TeakB-31 + suitable insert + one sealed Midnight 1 kg pack; **SEK 1,149 delivered is a price hypothesis to validate**. A 650 g version around SEK 1,099 is the alternative if adequate fill/appearance are established. Do not silently change products or divide the small test budget among many variants.

Using actual supplier cash quotes plus stated allowances, the 1 kg kit costs approximately SEK 581.13 before customer payment fee/advertising, including a provisional >3–5 kg domestic parcel at SEK 129. At SEK 1,149 and SEK 100 all-in CAC, contribution is approximately SEK 430.40 for an eligible VAT-exempt pilot, or SEK 200.60 under the conservative 25% output-VAT/no-input-recovery stress model. The latter is a planning floor, not Noorly's current tax status or a final registered-business calculation. Neither number includes fixed overhead or income tax. Actual insert freight, packing, merchant fees, VAT invoices and packed parcel remain open.

The one-kilogram kit costs about SEK 16.58 more than the 650 g configuration before any difference in domestic postage, including FX. A single 350 g refill at SEK 249 + 49 shipping leaves only about SEK 7 after CAC 100 in the exempt scenario, and loses money in the VAT stress case. Use the complete model, not a 3–4× sand purchase-price markup.

Approximate pre-dispatch working cash for 20 one-kilogram kits is SEK 8,343 using the provisional allowances, before domestic postage, labour/damage provision, sample/testing, fixed costs and unreconciled packaging costs. Presale payouts are not assumed immediately available for supplier payment. Costing is for twenty units; a smaller batch must be requoted.

### Remaining product and release gates

No wooden bowl is qualified for direct candle-sand burning. The actual wood/insert/sand/wick assembly needs representative samples, internal fit/appearance, heat/stability qualification, measured fill and packed dimensions/weight. A small glass may materially change the broad sculptural appearance; do not market the reference image as the actual product. Large TBL10/Dareels alternatives still lack a verified landed wholesale quote and qualified candle assembly.

Before any paid presale: settle these product gates, stock/dispatch, tax and invoice treatment, carrier quote, real fees/payout/refund flow and existing Shopify/custom-storefront release checks. Foreign advertising VAT may increase all-in CAC even when sales qualify for small-business exemption. Keep the SEK 4,000 media allocation unchanged (2,000 initial / 2,000 reserve), and reconcile historical spend before activation.

Suggested pilot is maximum twenty orders over the standing 4–5-day screen after authorization, with honest dispatch/refund terms. Do not buy twenty against ten orders automatically; reprice the smaller supplier basket or apply the agreed refund procedure. Reserve release needs actual retained paid orders, delivered quality and positive contribution.

Preserve original 15-second winter film, password protection and Shopify tzwngp-h1. No ads/presales activated, supplier contacted, supplier order/payment submitted, DNS changed, product published or store settings changed during this continuation. Trademark clearance remains unverified.


## Latest continuation: cost reduction and compact packing — 23 October 2026

Read the [cost reduction assessment](Noorly_Cost_Reduction_Assessment_2026-10-23.md) first for the newest product/packing/delivery/handling recommendation. The preceding offer-decision checkpoint still supplies domain, tax and supplier-basket evidence.

- Owner remains not yet VAT-registered; noorly.se was paid for by the owner. No repeat domain checkout preparation is required. Registry activation, connection and trademark clearance remain unverified.
- Preserve the organic AW TeakB-31 wooden concept with a qualified insert and sealed scented sand. Prototype 1 kg in a compact protected parcel first; retain it if it qualifies for the lower postage band. Use 650 g if that is what achieves the lower band and physical fill/appearance are adequate. The actual quotes are Midnight 1 kg and Rhubarb Sparkle 650 g, different scents. No configuration is selected or qualified by this desk research.
- Actual sand saving is about SEK 16.58 per kit including the 2% FX allowance. If domestic delivery also falls from the provisional SEK 129 to 109, saving is SEK 36.58. Loose repacking and cheaper narrow/tall glass do not have an established suitable landed-cost advantage.
- Fresh Packoplock research identified standard box 795316 (390 × 290 × 150 mm internal, SEK 9.26 ex VAT, pack 25) and quick-assembly 795772 (400 × 300 × 150 mm internal, SEK 11.90 ex VAT, pack ten). For twenty kits the quick option costs only SEK 0.41 more per kit because twenty can be bought instead of twenty-five. Protective fit and finished external dimensions remain untested.
- Packoplock delivery below SEK 2,500 ex VAT is SEK 99 ex VAT, or SEK 123.75 cash for an ordinary parcel. With that allocated, boxes alone cost SEK 20.66–21.06 per kit. Do not claim a further packing saving against the existing SEK 30 allowance.
- A concrete small-pack materials proposal totals SEK 600.85 / twenty = SEK 30.04 per kit: twenty quick boxes, box freight, two Biltema 10 × 0.5 m bubble-wrap rolls at SEK 44.90 each, one SEK 29.90 tape roll, one SEK 39.90 kraft-paper roll, and SEK 20 printing allowance. Cushioning adequacy, local stock and collection practicality remain unverified. A dedicated pickup trip, extra protection, tools or printing costs must be added. No materials were bought.
- Fresh Candle Shack Lotti stock display was 214, superseding the earlier 314; price tiers unchanged. Its freight remains destination/weight/parcel-dependent and unquoted, so the SEK 15 allowance remains. No stock reserved.
- Fraktjakt business quotation flow reached an empty login page. No actual cheaper carrier quote was obtained and no account created. Business prices exclude VAT; model targets must include nonrecoverable tax and surcharges. SEK 80 all-in is only a sensitivity target.
- Full cost before customer payment fees/ads: original heavier 1 kg SEK 581.13; compact 1 kg with SEK 109 postage SEK 561.13; compact 650 g SEK 544.55. Achieving four rather than six minutes of complete allocated handling at SEK 200/hour would reduce these last two to SEK 554.46 / 537.89. Adding an actual SEK 80 carrier rate would take the 650 g scenario to SEK 508.89. Parcel qualification and time savings have not been measured.
- Keep the rounded SEK 30 packing allowance and SEK 15 damage/returns reserve pending physical testing. First-order AW discount loss adds roughly SEK 16 on later kits. No guaranteed SEK 500 cost or zero-cost owner labour is established.
- Price hypotheses stay SEK 1,149 delivered for 1 kg and SEK 1,099 for 650 g. At SEK 1,099, cost SEK 537.89, assumed fee 3% + SEK 3 and all-in CAC 100, contribution is about SEK 425 for an eligible exempt case or SEK 205 in the conservative VAT stress case, before fixed costs and income tax. Tax eligibility, merchant fees and acquisition performance remain unresolved.

The next useful step is a representative assembly and packing trial after separate sample-spend authorization: settle safe assembly/appearance and required fill, measure both protected formats, obtain the exact carrier quote, and time all handling including inspection and dispatch allocation. Do not remove cushioning to reach a weight threshold. Presales remain a proposed way to limit speculative stock, not a substitute for payout timing/working capital and refund planning.

Research used Chrome only. No supplier contacted, account registered, order/payment submitted, ads/presales activated, DNS changed or Shopify setting/product changed. Preserve store tzwngp-h1, original 15-second winter film and password protection. Media remains SEK 4,000 total / SEK 2,000 initial and SEK 2,000 reserve; remaining spend unreconciled.


## Latest continuation: outsourced fulfilment comparison — 23 October 2026

Read [outsourced fulfilment assessment and exact quote requests](Noorly_Outsourced_Fulfilment_Assessment_2026-10-23.md) first. Owner queried the prior manual-packing assumption and requested a comparison to determine the best option. Manual fulfilment is a costing baseline, not a settled operational choice.

- **Mitt Logistik is the first provider to qualify**, with Expresspack the second quote candidate. No final provider selection or verified cheaper all-in quote exists.
- Mitt Logistik's public calculator was operated with 20 shipments, three picks per shipment and one pallet. It returned SEK 654 ex VAT, or SEK 40.88/order including assumed nonrecoverable 25% VAT. It states packing, picking, storage, packaging and labels included; delivery is extra and customer uses its own freight agreement. Fifty shipments returned SEK 1,539 ex VAT; one hundred SEK 3,014. No volume commitment follows.
- Combining Mitt's twenty-order calculator with the existing provisional SEK 109 domestic postage gives approximately SEK 149.88/order. This is a composite estimate, not a provider quote. Fragile glass protection, kit assembly, receiving, setup/integration, minimum charges, exact contract terms, returns and actual shipping eligibility remain to confirm.
- Manual baseline is SEK 159/order: packing 30 + owner time 20 + delivery 109. Mitt's composite scenario is about SEK 9.13 cheaper economically but SEK 10.88 more in immediate cash than manual packing if owner labour is unpaid. Do not describe the full owner-time saving as a cash saving.
- Expresspack's live price page is a contact form rather than the calculator described by an old search snippet. It explicitly offers kitting/assembly in Borås. No price or minimum was obtained.
- Flow 3PL's calculator would not accept twenty shipments and clamped to fifty. A completed 50-shipment/3-pick/3-receipt/6-carton/1-pallet/zero-return scenario returned SEK 2,511 ex VAT excluding freight and separately priced kitting; packaging inclusion unresolved. Extrapolating visible rates to twenty gives SEK 96.94 incl VAT/order before freight/kitting/any packaging. That is arithmetic, not a twenty-order quote or proof of a contractual minimum.
- Plocklager/Mellanrummet's published setup, monthly fee, one pallet and three-pick fragile packing total SEK 163.25 per first-batch order at twenty before receiving and shipping; VAT basis/date validity unconfirmed. If prices exclude VAT, corresponding cash is SEK 204.06 before those extras. Weak pilot fit on these inputs.
- Logitrail advertises no fixed charges but the inspected warehouse is in Raisio, Finland; no Swedish domestic warehouse/quote established.
- At SEK 1,099 selling price, the 650 g model with hypothetical Mitt fulfilment gives about SEK 427.60 contribution with all-in CAC 100 in an eligible exempt case, or SEK 207.80 in the conservative VAT stress case, before fixed costs, testing and income tax. All final parcel, fee and tax assumptions remain unresolved.
- Prefer a written first-month total at or below SEK 159 per completed customer order including nonrecoverable VAT, all receiving/assembly/materials/storage/setup allocation and domestic freight, plus any supplier-freight increase. Supplier deliveries should go directly to the chosen warehouse; re-quote the destination rather than assuming the prior inbound rates transfer unchanged.
- Two exact Swedish email requests are saved in the report: kontakt@mittlogistik.se and kenneth@expresspack.se. **Neither was sent.** They request 20-order all-in first-month prices, 10/50-order and zero-order-month exposure, fragile handling, delivery, return and contract terms. Owner's earlier no-supplier-contact instruction requires clear further authorization before sending; research/comparison is complete within that boundary.

No supplier contact, signup, order/payment, contract, store/ads/presale activation or DNS changes occurred. Chrome only; original 15-second winter film, password protection and store tzwngp-h1 preserved. Domain paid by owner; not yet VAT-registered; exemption eligibility unresolved. Media remains SEK 4,000 split SEK 2,000 initial / SEK 2,000 reserve with prior spend unreconciled.


## Latest continuation: monthly break-even and owner registration status — 23 October 2026

Read the [monthly break-even model](Noorly_Monthly_Breakeven_2026-10-23.md) first for this calculation. The outsourced fulfilment report still contains the supplier shortlist and exact UNSENT quote requests.

- Owner now explicitly confirms **not yet registered as a business**, in addition to the earlier not-VAT-registered status. Neither establishes exemption eligibility or a tax-free operation. No business form or after-tax rate has been chosen.
- Owner intends to reinvest rather than withdraw funds. Requested monthly planning budget: **SEK 2,000 total recurring overhead**, including ChatGPT/miscellaneous, plus **SEK 3,000 total advertising**. These are unreconciled inputs, not proven deductible invoices, actual campaign spend or permission to activate ads. Do not add ChatGPT twice.
- At the 650 g SEK 1,099 delivered hypothesis, variable cost SEK 535.43 plus assumed fee SEK 35.97 leaves SEK 527.60 before ads/overhead in an eligible exempt case. VAT stress leaves SEK 307.80, with no purchase-tax recovery. Deduct monthly SEK 5,000 once; do NOT also deduct a per-customer SEK 100 CAC.
- Modelled break-even: **10 orders exempt** or **17 in the pessimistic VAT stress case**. These are illustrative at the existing 20-unit supplier cost basis, not quoted smaller batch costs.
- At 20 orders: SEK 21,980 collected; approximately **SEK 5,552 surplus exempt / SEK 1,156 stress**, before income/corporation tax, testing and unquoted extras. At 30 orders: SEK 10,828 / SEK 4,234. At 50: SEK 21,380 / SEK 10,390. Volumes beyond twenty are sensitivities, not an expanded pilot.
- A SEK 5,000 monthly surplus needs 19 orders exempt / 33 stress; SEK 10,000 needs 29 / 49. At fixed SEK 3,000 ads, twenty customers requires SEK 150 media cost/order and thirty requires SEK 100; neither is observed.
- Monthly budget assumes all applicable nonrecoverable ad tax is included. If recurring store/domain/apps/bookkeeping etc. exceed or sit outside the SEK 2,000 total, add the missing amount. Exact provider fees, parcel and actual business-tax treatment remain unverified.
- The table is modelled operating surplus, not a literal bank balance. Unsold stock and prepayments tie up cash; ten profitable orders do not finance a twenty-kit batch automatically. Payout timing, reserves and tax still matter. Skatteverket sole-trader guidance checked in Chrome confirms taxation is based on surplus irrespective of withdrawals if that structure is chosen.
- The owner has NOT approved the two provider quote emails in the intervening VAT/margin questions. Keep them unsent until clear approval. No supplier contacted or service contracted.

No ads/presales, supplier order/payment, registration, DNS or store change occurred. The new SEK 3,000 monthly advertising sensitivity does not silently replace the prior SEK 4,000 allocation / SEK 2,000 initial and reserve release gates. Preserve the winter video, password protection and Shopify tzwngp-h1; domain paid by owner.


## Latest continuation: offer health and Swedish candle-sand sourcing — 23 October 2026

Read [Swedish candle-sand options and health assessment](Noorly_Swedish_Candle_Sand_and_Health_Assessment_2026-10-23.md) for the current evidence. No supplier replacement or launch has been selected.

- Verdict: promising for qualification/small pilot; not yet a proven healthy business. At twenty orders with the requested SEK 2,000 overhead and SEK 3,000 total ads, the prior model leaves SEK 5,552 exempt / SEK 1,156 pessimistic VAT stress before income tax, testing and unquoted extras. Twenty requires SEK 150 ad spend per retained customer; thirty requires SEK 100. Neither acquisition outcome is observed. The stress model omits input-tax recovery and is not a final registered-business calculation.
- **Sandig is the strongest new Swedish scented reseller lead**: public reseller programme, dispatch claimed from Timrå, 500 g plant-based sand / 30 wicks. Product selector showed Tallskog with low-stock wording; three other options sold out. Regular retail SEK 399; displayed two-paid/four-received promotion SEK 798 for four 500 g packs. No B2B tariff, MOQ, sufficient stock or business freight quote verified.
- Sandig identifies Mhem AB at Plåtslagarvägen 19, Timrå—the same street address previously shown by Mitt Logistik, which identifies Swedish Treats AB. This is an address match only, not verified common ownership, partnership, combined supply/fulfilment or free stock transfer. Worth asking about an itemised combined quote after outreach authorization.
- **K. Lundqvist Stockholm**: actual reseller programme explicitly has no minimum order value. SAND-250 is 250 ml unscented plant-origin sand / fifteen wicks, SEK 149 public retail. Weight and wholesale price unknown; do not treat ml as grams or assume pre-scented/Swedish-manufactured.
- **Kristinas Scrapbooking / KeraSnow**: actual ready-to-burn powder, displayed SEK 138/kg; 20 kg SEK 2,280 (SEK 114/kg), in-stock wording. But product specifications say paraffin/mineral wax, origin England, non-vegetable, wicks separate and sold by weight in bags. Repacking, bags/labels, wicks and labour need costing. Exact inclusive/exclusive VAT display mode was not independently confirmed; verify final cash basis. Delivery terms mention Ängelholm AND a Denmark warehouse, so stock's actual dispatch location remains open.
- Twenty kits × 650 g require thirteen kg. Buying twenty kg leaves seven kg unused: first-purchase cash allocation is SEK 114/kit before extras, not the SEK 74.10 consumed wax cost. Public 10 kg + 3 kg listings total SEK 1,648 before unquoted combined freight/tax/extras. This is a different unscented/paraffin offer, not an approved replacement.
- Villa Blomstergren: SEK 249 incl tax for 1 kg/ten wicks, claims hand-packing in Skåne; no B2B or freight quote. Eld & Design: SEK 179 retail for unscented 650 g/ten wicks/100% stearin; no wholesale or manufacturing/dispatch qualification.
- No cheaper equivalent Swedish pre-scented, plant-based, sealed wholesale pack was established. Keep the prior Candledust 650 g allocated delivered cash SEK 142.13 as the quoted baseline. Proposed sourcing target SEK 100–110 for a genuinely comparable finished pack delivered incl nonrecoverable tax is a negotiation target only. SEK 40 saved per kit improves a twenty-order month by SEK 800.
- Swedish storefront/company, Swedish fulfilment/packing and Swedish manufacture are distinct. None of the new leads establishes all three.

Research used connected Chrome. No supplier message, registration/application, basket submission, order/payment, reservation, business setup, ad/presale activation, DNS or Shopify change. Earlier exact Mitt/Expresspack quote emails remain UNSENT pending clear approval. Preserve store tzwngp-h1, password protection and winter video. Domain paid; business and VAT registration not yet complete; tax eligibility unresolved.


## Latest continuation: private-label candle sand and full-kit economics — 23 October 2026

Read [the private-label sourcing and economics report](Noorly_Private_Label_Sourcing_and_Economics_2026-10-23.md) for primary sources, actual cart totals, all assumptions, cash versus stock treatment and three exact UNSENT quote requests. This supersedes any inference that an ordinary reseller programme permits Noorly branding or that bulk automatically improves margin.

- Owner now explicitly requests **private-label candle sand**, preferably Sweden, with a small MOQ and better margins at SEK 1,099. No manufacturer, order or launch has been selected.
- **No qualified Swedish private-label sand supplier yet.** Candles Scandinavia Örebro advertises poured candles/diffusers, not confirmed sand. Candelize Stockholm advertises poured candles, minimum 100 plus setup; do not present this as a 100-unit sand MOQ. Prior Sandig lead is resale, not verified white label.
- **PJ Nordic Denmark** has plant-based 500 g white sand, 12 units per ordinary carton, in-stock-in-Denmark wording and a general private-label offer. Private-label MOQ, pre-scented 650 g availability and price are unconfirmed. **M1 Candles Belgium** explicitly offers small-test-launch private-label sand and filled pouches; no numeric minimum or Sweden tariff. **Devillebard France** explicitly offers white-label/bulk sand; exact small MOQ, pre-scented option and price require quote. Its diffusion fragrance must not be treated as suitable for mixing into wax.
- **Candledust bulk own-brand repacking is explicitly allowed** by its FAQ. No kg MOQ there, but account webshop has EUR 50 goods minimum. Live Champagne & Rhubarb bulk product shows EUR 13.33/kg / EUR 10.96 at 25+, with ten 6 cm wicks/kg. Extra 100-wick pack EUR 8.06. Quote stock/warehouse destination before purchase.
- Actual signed-in Sweden basket **14 kg + 200 extra wicks + original EUR 8.50 sample = EUR 238.52**, including freight 27.28 and included VAT 46.17. This covers twenty 650 g fills, one kg buffer and seventeen wicks each.
- Actual **25 kg + 400 extra wicks + sample = EUR 320.46**, including freight 37.20 and VAT 62.02 after displayed discounts. Model **37 usable 650 g kits**, leaving 0.95 kg wax buffer. Do not add VAT again to either total.
- Factory private-label pages conflict: public EUR 1,500 minimum sand value/100 per variation versus authenticated calculator's enforced **1,000 finished units**. Tested 650 g/20 wicks/pouch at 1,000 gives EUR 7.01 net unit, total EUR 8,693.27 incl 24% VAT, **about SEK 98,629 with planning FX cushion before freight/labels**. 100 was rejected; no quote request sent. Do not claim a 100-pack factory quote is orderable.
- Mylar.se verified 25 two-litre pouches SEK 229 / 50 SEK 399 incl VAT; shipping only advertised from SEK 39. Model uses SEK 50 delivery allowance, SEK 3 label and **SEK 15 paid outsourced filling/sealing/QC per pack**, all unquoted service allowances. Scented-wax compatibility, usable capacity and heat seal need qualification.
- Using existing 11.123 SEK/EUR + 2% FX and all prior bowl/insert/outsourced fulfilment/freight assumptions, finished sand component costs **SEK 144.97 old sealed pack / 167.26 own-brand 20-kit batch / 128.40 own-brand 37-kit sand batch**. All keep 650 g and seventeen wicks; no free owner filling assumed.
- At SEK 1,099, **twenty monthly orders**, SEK 3,000 total ads and SEK 2,000 total overhead, conditional eligible VAT-exempt operating surplus becomes **SEK 5,552 old / 5,106 own-brand 20 / 5,883 own-brand 37-unit cost basis**, before income/corporation tax, testing and unquoted extras. That is only SEK 331 monthly improvement for the larger sand batch, not a dramatic margin change. Monthly break-even remains ten at these assumed unit costs. Do not deduct CAC twice.
- **Cash is lower with extra stock.** Buying the 25 kg supplies/50 pouches and filling only twenty gives about **SEK 4,007 cash remaining after listed costs** if twenty sell; filling all 37 in advance gives about SEK 3,701. The SEK 5,883 number is allocated operating surplus, not immediately available cash. Other component minimums, cash timing and tax can alter the bridge.
- Finished private-label **SEK 100 / SEK 80 delivered** are negotiation targets only: modelled twenty-order surplus SEK 6,451 / 6,851. With a separately unverified SEK 80 domestic-delivery target, the SEK 100 pack scenario becomes about SEK 7,031. Sand savings alone cannot produce 40% after the budgeted monthly costs at twenty sales.
- VAT exemption eligibility remains unresolved; owner is not business/VAT registered. Prior output-VAT/no-input-recovery stress is a pessimistic sensitivity, not normal VAT-registered profit. Correct future cross-border invoices and eligible purchase-tax recovery need a separate final model.
- Recommend quote-first, one existing scent, plain pouch/sticker. Do not buy larger stock just for unit discount or extend the twenty-order pilot without approval. Glass insert/wick/wooden-bowl assembly remains untested; no direct-wood burn claim is approved.

Three exact supplier quote requests are saved in the report for **info@pjnordic.com, info@m1candles.be and info@devillebard.com**. They request 20/50/100 packs with all price components, numerical MOQ, scent and composition, documents, stock/lead time, tax and Sweden freight. **All remain UNSENT**, as do earlier Mitt/Expresspack drafts. The owner must explicitly authorize contact.

Chrome-only research; existing Candledust account worked. Research-added bulk sand and wicks were removed and cart restoration verified: original black 250 g sample / three wicks, quantity one; subtotal EUR 8.50 + freight 14.88 = EUR 23.38 incl EUR 4.53 VAT. No supplier message/request submission, order/payment/reservation, signup, business registration, contract, ads/presales, DNS or store change. Domain paid by owner. Preserve Shopify tzwngp-h1, password protection and the original 15-second winter video. Standing media release budget remains SEK 4,000 split SEK 2,000 initial / SEK 2,000 reserve; monthly SEK 3,000 sensitivity does not activate spending.


## Latest continuation: approved supplier outreach sent and first-month projections — 23 October 2026

Read [the outreach record and first-month projections](Noorly_Private_Label_Outreach_and_Projections_2026-10-23.md) for exact verified sent bodies, demand/cost assumptions, VAT arithmetic, forecast judgment and cash exposure. This checkpoint overrides earlier UNSENT status for these three suppliers only.

### Contact authorization and actual completed sends

The owner explicitly said to send the quote requests to PJ Nordic, M1 and Devillebard and ask for the best small-batch Noorly price, ideally below SEK 100 per finished pack delivered to Sweden. Authorization was used without asking again.

Sent separately through the existing Gmail account in Chrome and verified in Sent plus full Gmail connector readback:
- **PJ Nordic — info@pjnordic.com**, 23 October **16:32:03 Europe/Stockholm**. Message ID `1a1692d11ed35bf8`, thread `1a1692ce86216946`.
- **M1 Candles — info@m1candles.be**, **16:32:48**. Message ID `1a1692dbf9a1d5cc`, thread `1a1692da3295d517`.
- **Devillebard — info@devillebard.com**, **16:33:22**. Message ID `1a1692e43db9e529`, thread `1a1692e1f7960435`.

All have SENT labels, correct recipients and verified below-SEK-100 wording. Requests cover 20/50/100 finished 650 g white pre-scented plant-based packs, seventeen suitable wicks, plain sealed Noorly-labelled pouch, all mandatory tax/fees/freight, numerical minimums, best packaging option, availability/lead time, documents, country/composition, carton details and glass-insert/wick requirements. They explicitly request information only, not an order. No attachments or owner street address were sent. SENT is dispatch evidence, not a supplier receipt/read acknowledgment.

The earlier sourcing report now has a prominent sent-status notice. **Mitt Logistik and Expresspack remain UNSENT**. No follow-up scheduler, supplier order/payment or contract was created.

### Forecast and judgment

These are **the first full selling month after qualification and authorized launch**, not a forecast of the currently protected offer or the remaining October days. All sales counts are completed retained orders. No fake statistical probabilities or measured ad benchmarks.

Common inputs: SEK 1,099 delivered customer price; 3% + SEK 3 payment fee; SEK 3,000 total ads; SEK 2,000 total recurring overhead; **new explicit SEK 1,000 first-month setup/testing allowance**. The latter is an unquoted buffer, not a spend authorization or cap on necessary testing. All results are before income/corporation tax and further unquoted extras. No salary/withdrawal. Ads/ChatGPT are not counted twice.

- **Pessimistic:** 5 orders; assumed SEK 6 per paid landing-page visit × 500 visits × 1% retained conversion; CAC 600. Gross variable cost SEK 610, including higher tiny-batch/handling/returns allowances. Collections **SEK 5,495**. First-month result **−3,735 exempt / −4,244 registered-model**.
- **Middle planning case:** 12 orders; SEK 5 per paid visit × 600 × 2%; CAC 250. Uses existing own-brand twenty-kit cost SEK 557.71, including SEK 167.26 finished sand and provisional paid fulfilment/postage, without assuming the new SEK 100 target is achieved. Collections **SEK 13,188**. First-month result **+64 exempt / −1,282 registered-model**.
- **Optimistic within twenty-kit cap:** 20 orders; SEK 3.75 per visit × 800 × 2.5%; CAC 150. Assumes unquoted finished-pack target SEK 100 and customer-delivery target SEK 80; gross variable cost SEK 461.46. Collections **SEK 21,980**. First-month result **+6,031 exempt / +3,421 registered-model**.
- A later identical month without repeating the SEK 1,000 allowance improves every result by SEK 1,000.
- Planning judgment: closer to middle than optimistic, low confidence. Budget around break-even or a modest loss. A provisional 10–15 sale budgeting range gives **−947 to +1,580 exempt / −2,068 to −102 registered** after setup at middle costs. This is not a measured confidence interval. New-brand trust, price/presale friction, untested conversion, unconfirmed pack price and fragile fulfilment justify caution.
- Zero sales remains possible: spending all stated monthly costs and setup creates **−SEK 6,000 before inventory write-downs/extras**. Five sales is not the worst-case bound.
- At middle costs, first-month break-even is **12 exempt / 16 registered**, versus **10 / 13** without startup. The prior seventeen-order VAT stress figure was from a deliberately no-input-recovery stress test and is not the new registered-case estimate.
- Thirty sales at optimistic costs is a separately labelled upside sensitivity only: collections SEK 32,970, result **+12,047 exempt / +8,132 registered** after startup, requiring CAC 100 and additional authorized supply. No pilot cap was raised.

### VAT and cash clarification

The owner remains not business- or VAT-registered; exemption eligibility is unresolved. Official Skatteverket exemption, purchasing and EU-goods guidance was rechecked in Chrome.

The **new registered planning model** uses net sales SEK 879.20/order and eligible net variable costs SEK 492 / 450.04 / 372.17. It assumes proper taxable-business invoices, future valid B2B treatment and unchanged supplier net prices. The middle Candledust bulk cost is converted from its 24%-inclusive basket to underlying net cost; it is NOT a claim that existing Estonian VAT can be deducted on a Swedish return. Other eligible forecast product/service costs use 25% gross-to-net; reserves/fees remain unreduced. Mixed ads/overhead/startup allowances remain full cost without speculative tax recovery. Actual invoices can change results. Do not present either tax scenario as established Noorly status or post-tax money.

At twelve sales after buying twenty sets, roughly **SEK 3,143** remains tied up in eight unsold bowl/insert/sand equivalents. Against the exempt SEK 64 first-month operating result, an illustrative cash bridge is **about −SEK 3,079**, before payout timing, fixed warehouse fees and other differences. Cash tied in stock is not the same as a permanent loss or a second expense. Presale deposits are delivery/refund obligations, not earned profit before fulfilment.

### Preserved controls

No store/checkout, ads/presales, business registration, DNS, inventory order/payment or contract was activated. Original 15-second winter video, password protection and Shopify tzwngp-h1 preserved; domain noorly.se remains owner-paid. Standing media release allocation remains SEK 4,000 total / SEK 2,000 initial test + SEK 2,000 reserve with historical spend unreconciled; modelling SEK 3,000 ads does not authorize activation.

The three-send proof is saved locally as `outputs/noorly-supplier-requests-sent-2026-10-23.png`; Sent view left open in Chrome. GitHub contains the sent-message audit and full model, without publishing the owner's sender address or unrelated inbox content.
