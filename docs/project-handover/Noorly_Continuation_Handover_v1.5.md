# Noorly continuation handover — v1.5

Updated 25 October 2026, Europe/Stockholm. This is the current continuation entry point. Read it before v1.4, v1.3 and the original Word documents. Latest explicit owner decisions and verified account evidence override older plans. This documentation update does not itself install tracking or verify a production release.

## Current position: live, saved and unfinished

The storefront was opened for ordering, bowl and candle sand became separate products, a native component bundle was added, and the original video was restored. The latest successfully verified production release was the 349/449 SEK pricing and CRO release, PR #34.

The subsequent pixel work (PR #35) and black cookie buttons (PR #36) are implemented, tested and merged into main, but were NOT published at the last successful deployment check. Heatmaps and native checkout Purchase tracking are NOT complete. Do not equate a merged PR with a live feature.

Fresh GitHub read during this handover update confirmed main at `f420853d27050f7e47307cea4ed272c705259cf6` before the documentation commit. It contains PR #35 at `8aa6017956ca5076bf2556d6ac0b818bff7e33f0` and PR #36 at `f420853d27050f7e47307cea4ed272c705259cf6`.

### Deployment and access blockers

- Last verified production source: `57d8fe3edf90fb67c2fdfe09641ddd97647ace54` (PR #34).
- Last verified production deployment: `dpl_6Qxz7pPfcjJ3Befwf7N5YLf9bPxL`, previously READY on `noorlynordic.com`.
- Recorded deployment rejection: HTTP 402 `payment_required`, resource `api-deployments-free-per-day`, reporting more than 100 deployments and `retry-after: 86400`. No billing upgrade, limit bypass or future deployment was approved or scheduled. Recheck availability rather than assuming a reset or repeatedly attempting builds.
- Fresh Vercel reads during this documentation update returned 404 for the recorded alias and project. The Git deployment context still returned the recorded Hobby team but an empty `linkedProjects` list. Current assignment therefore could not be independently reconfirmed. This is an access/resource-resolution limitation, not proof that the public website is down or that the project was deleted. Reconcile access and project association before releasing; do not create a replacement project or reassign domains as a workaround.
- Earlier connected Browser calls required the originating browser context, blocking authenticated Shopify/Clarity setup. A separate headless Vercel sandbox could reach the public candle-sand page with HTTP 200, but the page lacked the new Monorail CSP entry. Its bounded follow-up reported that the new deployment was not observed. Public headless browsing is not access to the owner's signed-in browser.

The final status on [PR #36](https://github.com/1Alsaad/noorly-gifting/pull/36) supersedes any earlier implication that the newly merged pixel work was live. A live pixel-verification script was prepared, but no successful post-release run was established. Do not present intercepted/stubbed Meta calls as confirmed receipt in Meta Events Manager.

## Project locations

- Repository: `1Alsaad/noorly-gifting`.
- Website: `https://noorlynordic.com/sv`; English: `https://noorlynordic.com/en`.
- Shop: `https://noorlynordic.com/sv/shop`.
- Checkout: `https://checkout.noorlynordic.com`.
- Shopify admin: `https://admin.shopify.com/store/tzwngp-h1`.
- Shopify domain: `tzwngp-h1.myshopify.com`; shop ID `107353178454`; currency SEK.
- Recorded Vercel project: `noorly-gifting`, ID `prj_giiYMRfopk6hpEXGWb8TXAHU39x4`.
- Recorded Vercel team: `1alsaads-projects`, ID `team_fyWRW85ET1y2k933iBNlpNoR`.
- Existing intended Meta dataset: `511816900240916`, labelled UY Scuti Media Pixel in the earlier inspection. Reuse it; do not create another pixel. Production key: `NEXT_PUBLIC_META_PIXEL_ID`.

Never commit access tokens, bank information, private addresses, customer details or browser authentication state to this public repository.

## Current prices, products and stock constraints

Latest saved/read-back Shopify prices from PR #34, including VAT and Sweden delivery:

- White unscented sand, 300 g: **349 SEK**.
- Each of the ten scented choices, 300 g: **449 SEK**.
- Decorative teak bowl: **550 SEK**.
- Bowl + unscented sand: **699 SEK**, saving **200 SEK** versus 899 SEK bought separately.
- Bowl + scented sand: **749 SEK**, saving **250 SEK** versus 999 SEK bought separately.

Bundle prices were retained when standalone sand increased. Savings refer to current separate-component prices, not a fictitious former selling price. No further price change is authorised by this handover.

Sand is one 300 g pouch with four cotton wicks. There are 11 colour/scent options; selection updates the photo, price and merchandise variant. The bowl remains independently purchasable and a native bundle component. Public handles are `candle-sand`, `teakb-37-dekorativ-teakskal`, and `noorly-ljusstund-teakskal-och-ljussand`. Internal handles/SKUs may retain technical codes; keep them out of displayed naming and do not rebuild products just to remove a code.

**Do not change inventory quantities.** The owner initially confirmed 20 complete sets and later explicitly forbade stock changes. The last recorded readback showed each sand variant at 20, bowl at 19 and native bundle computed availability at 19 per option. These are historical account readings, not fresh physical-stock confirmation or independent stocks for each bundle colour. Preserve shared component relationships and inventory deduction. Do not reset stock to 20 or assume why the bowl count changed.

Preserve the pre-order message beside purchase controls:

> Leverans inom Sverige ingår. Förbeställ nu. Vi skickar din beställning så snart produkten finns i lager hos oss.

Do not invent a supplier-arrival or dispatch date. Owner-provided manufacturer prices were EUR 11.70 per bowl, EUR 5.00 per unscented pouch and EUR 6.25 per scented pouch. These are product-cost inputs, not verified all-in delivered costs or realised margins.

## Work already completed and decisions to preserve

The launch, checkout, cart, copy, bundle and CRO checkpoints record these changes:

- Customer ordering opened; obsolete closed-payment copy and the opening-soon obstruction were removed. Old draft-only/zero-stock/closed-presale instructions are historical, not an instruction to re-close the shop.
- Separate bowl/sand pages, authentic existing photos, a selected colour/scent interface and a native bundle offer were implemented. Displayed bowl name was simplified to Dekorativ teakskål; normal shopping copy was cleaned of supplier references and the vendor set to Noorly.
- Checkout was branded with Noorly's centred wordmark, cream/paper backgrounds, charcoal buttons, serif headings and burgundy accents. The underlying hosted checkout and payment-wallet branding were not replaced.
- Cart recovery handles old shop links and unavailable items left in older carts. Preserve canonical-domain routing, actual variant validation and useful cart-error feedback.
- **Keep the original cinematic video and scroll animation.** The owner explicitly demanded restoration after the Stämningsfilm cleanup removed too much. Do not remove it again.
- The bowl-specific Q&A entry was replaced with dispatch information. This is not evidence that wood is a certified heat-safe vessel; do not invent safety claims or remove remaining appropriate use guidance.
- The owner's personal address and Noorly AB wording were removed from public copy at their request. They intend to complete accurate seller/company details manually. Do not republish private information or invent replacement legal details.
- Returns request unused, unlit and preferably unopened goods, with actual loss-in-value language. Copy encouraging use before return was removed. The implemented policy does not make unopened packaging an absolute condition overriding statutory withdrawal rights.
- Shopify was removed from normal shopping copy, not every required privacy/terms disclosure or payment interface.

Earlier cart-to-checkout rehearsals reached payment fields without submitting an order/payment. They are not fresh verification of the latest tracking work. Payments previously showed accepting payments; payouts were reported paused until **28 October 2026**. Recheck both before making new claims. A previously recorded Individual business entity and unfinished seller details require owner review; no later resolution is verified here.

Supporting records: [separate products/payment launch](Noorly_Separate_Products_and_Payments_2026-10-25.md), [checkout branding](Noorly_Checkout_Branding_2026-10-25.md), [cart recovery](Noorly_Cart_Recovery_2026-10-25.md), [copy cleanup](Noorly_Storefront_Copy_Cleanup_2026-10-25.md), and [pricing/bundle](Noorly_Pricing_and_Bundle_2026-10-25.md).

## CRO and product claims

[PR #34](https://github.com/1Alsaad/noorly-gifting/pull/34) implemented a responsive header trust strip, Paket/Bundle navigation, VAT and included-delivery information near prices, pre-order conditions near purchase controls, live variant-aware bundle savings, standalone-to-bundle links, expandable delivery/return answers and a mobile selected-option/price shortcut back to the purchase controls. Video, cart integration and component inventory were preserved.

Published header claims were Founded in Sweden, Handmade teak bowls, Sweden delivery included and Secure payment, localised for Swedish/English. Sand badges state 300 g and four cotton wicks; bowl badges state handmade, natural teak and unique grain. Handmade is scoped to bowls; brand origin is not manufacturing origin.

**Vegan and Recyclable were requested but not published:** product-specific ingredient/packaging substantiation was not established. Do not invent supporting evidence, reviews, urgency, scarcity or delivery dates. CRO improvements are hypotheses, not measured conversion uplift.

The website policies use 349/449 SEK, but Shopify-hosted Shipping policy and Terms of service still contained old 219/269 SEK text in Swedish/English at the last read. The policy mutation was denied for missing `write_legal_policies`. Owner/manual correction in Settings > Policies remains unverified as complete; do not silently expand permissions.

## Pixel work: implemented, not fully live

[PR #35](https://github.com/1Alsaad/noorly-gifting/pull/35) is merged. See [the pixel checkpoint](Noorly_Pixels_2026-10-25.md) for implementation details.

Earlier consent-gated Meta PageView, ViewContent and InitiateCheckout code using dataset `511816900240916` was retained; earlier host aggregation showed Noorly traffic. PR #35 adds Meta AddToCart only after successful, unadjusted cart additions, with actual selected variant price and quantity. Failed adds, mock IDs and invalid quantities must not produce conversions; bundle values are counted once.

Shopify storefront page/product measurement uses an attributed analytics-only build of the official Hydrogen React 2026.4.4 transport. Analytics and marketing consent remain independent. Tracking is gated to the canonical storefront in Shopify mode; URLs/referrers are sanitised and private routes excluded. Noorly-owned visitor/session IDs expire and are deleted on withdrawal. Cart keys, customer/order data and free-text fields are not added. The exact Monorail endpoint is allowlisted in CSP.

These new behaviours await verified production publication. Passing tests does not establish provider receipt or completed-purchase attribution.

Still unfinished:

- Official Facebook & Instagram channel connection in Shopify and selection of the existing dataset.
- Native checkout consent/identity continuity and completed-purchase measurement.
- Meta Purchase/CAPI configuration and verified deduplication. Earlier environment metadata lacked the necessary CAPI, webhook and outbox secrets; existing server purchase code must not be called active.
- Native Shopify cart/checkout funnel attribution; storefront views do not prove it works.

Recheck installed apps first to avoid duplicate installation. The recorded plan is Standard sharing, not silently enabling Enhanced/Maximum sharing. Do not add a second checkout pixel. A checkout click is not a Purchase. Never send fake Purchase events or submit a real-money test order without separate approval.

## Cookie controls and heatmap

[PR #36](https://github.com/1Alsaad/noorly-gifting/pull/36) is merged. Accept, reject and save-preferences controls have black backgrounds, white text, matching hover styles and visible keyboard focus. Mobile accept/reject are equal full-width controls. Scoped CSS avoids the old global reset affecting contrast. Consent defaults, category choices and persistence are unchanged. **Publication was blocked, not verified complete.**

**Heatmap installation has not happened.** No owner project ID was configured, no provider project/account or script was installed, and no session-recording/heatmap collection was verified. The last request to the owner was the public Microsoft Clarity Project ID for Noorly, not a password/token; it has not been supplied in this conversation.

In the next session, inspect connected browser/provider access before requesting information again. Use the owner's correct existing project or complete the free setup within the approved task, leaving any required personal sign-in/approval to the owner. Gate capture on analytics consent, mask personal/form data, exclude admin/account/checkout pages, test rejection/withdrawal and update the privacy/cookie disclosures to reflect the actual provider. No paid subscription is approved.

## Tests and evidence boundaries

- PR #34: [Checks #188](https://github.com/1Alsaad/noorly-gifting/actions/runs/40153707327), tested head `b2dbf8bb15f987dd43d6eca904e53af9b76352da`; recorded 290 unit/component and 22 browser/accessibility passes, build and audit; production deployment was confirmed then.
- PR #35: [Checks #191](https://github.com/1Alsaad/noorly-gifting/actions/runs/40156535431), tested head `6c99b15ea008e03fdf5a507404395fa199b9ecfc`; SUCCESS freshly re-read during this update. The old PR body saying CI pending is stale. Its initial local checkpoint had 296 tests; later combined CI recorded 299 after consent-revision coverage.
- PR #36: [Checks #198](https://github.com/1Alsaad/noorly-gifting/actions/runs/40158480816), tested head `c80986038669c2ec513d9879115db8a999a290c7`; all job steps freshly re-read as successful. Final suite contains 299 unit/component tests and 26 browser checks, including four Swedish/English mobile/desktop consent cases. Earlier formatting and mobile-width failures were fixed before merge, not waived.
- CI browser checks use test/mock fixtures; they are not proof of a fresh live payment, Shopify dashboard receipt, Meta Events Manager receipt, or heatmap session.
- No real-money order, new supplier purchase, inventory change, ad-budget increase or paid-plan upgrade was performed for the tracking/cookie work.

## Next session: execution order

1. Read this handover, AGENTS.md and the relevant checkpoints; inspect currently enabled GitHub, Shopify, Vercel, Meta and Browser tools. The owner expects tools enabled next session, but actual access must be tested, not assumed.
2. Reconcile Vercel project/account access, domain assignment and deployment quota. Read the current GitHub head and diff; avoid overwriting later work. Publish the already-tested changes with the existing project's **production** configuration when available. Do not promote a mock-commerce preview, bypass a quota, disable protection or upgrade billing silently. Batch related changes to conserve deployments.
3. Finish native Shopify/Meta checkout integration using the existing dataset. Verify consent boundaries, correct selected variant values and absence of duplicate purchase events. Record any owner-only confirmation still needed.
4. Install the owner's heatmap project with the consent and privacy safeguards above. Do not declare it active merely because a snippet is saved.
5. Verify the actual live canonical domain: health, selected variants/prices, cart, checkout, original video, black consent controls at mobile/desktop widths, no optional tracking before consent, category-specific enablement and withdrawal. Verify provider receipt separately. Do not charge a card or create fake conversions.
6. Reconcile the stale checkout-policy price text and outstanding company/payout details with the owner, without changing stock or inventing information.
7. Update GitHub with exact commits, deployment source/alias, tests, provider verification, remaining blockers and the next action. Report separately: implemented, merged, deployed, verified collecting, and not completed.

## Standing limits

No Deep Research: the owner requests implementation, not another research project. Use current official documentation only where needed for correctness. Preserve Swedish/English copy, the original video, separate products, bundles, prices and stock quantities. Keep GitHub as the source of truth.

Advertising allocation remains 4,000 SEK in total: up to 2,000 for the first 4–5-day screen with a day-four review, and 2,000 reserved for justified continuation or one different product. Actual spend remains to be reconciled; do not assume the full amount is unspent. Installing pixels is not authorisation to activate ads. No new paid apps, plan upgrades, supplier orders, inventory purchases or real-payment tests without approval.
