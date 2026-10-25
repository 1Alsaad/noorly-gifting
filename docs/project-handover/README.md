# Noorly project handover

Latest consolidated update: 25 October 2026, Europe/Stockholm.

## Start here

Read [Continuation Handover v1.6](Noorly_Continuation_Handover_v1.6.md) first. It records the owner-approved Maximum Meta connection, Clarity installation, consent changes, cleared deployment limit and remaining live receipt checks. The checkpoints below describe the historical v1.5 state.

Use [the updated new-session prompt](Noorly_Continue_in_New_Chat_Prompt.md) to continue with the connected tools. Actual tool access must be checked in the new session; an enabled app does not establish a working signed-in browser or completed deployment.

## Current checkpoint

- Last successfully verified production: PR #34, source `57d8fe3edf90fb67c2fdfe09641ddd97647ace54`, with 349/449 SEK sand pricing and CRO changes.
- PR #35 (expanded Meta events and Shopify storefront analytics) and PR #36 (black cookie controls) are merged into main but were not published at the last successful deployment check.
- Deployment previously hit Vercel's daily limit. Fresh alias/project reads during the handover update returned 404, so current access/assignment also requires reconciliation. This does not prove the public website is down.
- Native checkout Purchase tracking and the Facebook & Instagram connection remain incomplete. Reuse dataset `511816900240916`.
- Heatmaps are not installed. The owner's provider project/access is still needed.
- Keep the original video, separate products, native bundles and inventory. Do not restore historical closed-sales gates or reset stock.

## Supporting implementation records

1. [CRO and 349/449 SEK pricing](Noorly_CRO_349_449_2026-10-25.md), with final evidence in [PR #34](https://github.com/1Alsaad/noorly-gifting/pull/34).
2. [Pixels](Noorly_Pixels_2026-10-25.md), with merge/test/publication corrections in v1.5 and [PR #35](https://github.com/1Alsaad/noorly-gifting/pull/35).
3. [Consent and heatmap checkpoint](Noorly_Consent_and_Heatmap_2026-10-25.md), with final release blocker in [PR #36](https://github.com/1Alsaad/noorly-gifting/pull/36).
4. [Separate products and payment launch](Noorly_Separate_Products_and_Payments_2026-10-25.md), [checkout branding](Noorly_Checkout_Branding_2026-10-25.md), [cart recovery](Noorly_Cart_Recovery_2026-10-25.md), [copy cleanup](Noorly_Storefront_Copy_Cleanup_2026-10-25.md) and [pricing/bundle](Noorly_Pricing_and_Bundle_2026-10-25.md).

Earlier context remains in [v1.4](Noorly_Continuation_Handover_v1.4.md), [v1.3](Noorly_Continuation_Handover_v1.3.md), [Presale State v1.2](Noorly_Presale_State_v1.2.md), [the original objectives document](Noorly_Objectives_and_Presale_Handover.docx) and [the supporting research](Noorly_Meta_Ads_and_CRO_Research.docx). Their older closed-sales, draft-stock, deferred-domain and superseded price statements are historical.

## Standing decisions

Current website: `https://noorlynordic.com`; checkout: `https://checkout.noorlynordic.com`. Sand is 349 SEK unscented / 449 SEK scented; bowl 550 SEK; native bundles 699/749 SEK. Preserve explicit dispatch-on-stock-arrival messaging and do not change Shopify quantities.

The total advertising allocation remains 4,000 SEK: up to 2,000 for an initial 4–5-day first-offer screen, review day four, and 2,000 for justified continuation or one different offer. Actual spend needs reconciliation. No ad activation, paid subscription/upgrade, supplier order or real-money test purchase is authorised by a handover or tracking task.

Latest explicit owner instructions override older documents. No Deep Research. Use Swedish/English customer copy, no-faces creatives, truthful claims and no fabricated reviews, scarcity or delivery dates. Never publish private addresses, customer data or credentials in this repository.
