# Noorly continuation handover — v1.4

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
