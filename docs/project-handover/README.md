# Noorly project handover

Latest consolidated update: 25 October 2026, Europe/Stockholm.

## Start here

Read [Continuation Handover v1.7](Noorly_Continuation_Handover_v1.7.md) first. It records verified live heatmaps, the owner's heatmaps-only decision, new Meta server-activity metadata and the advertising launch blockers. v1.6 remains the detailed installation record.

Use [the updated new-session prompt](Noorly_Continue_in_New_Chat_Prompt.md) to continue with the connected tools. Actual tool access must be checked in the new session; an enabled app does not establish a working signed-in browser or completed deployment.

## Current checkpoint

- Last verified application release: [PR #39](https://github.com/1Alsaad/noorly-gifting/pull/39), source `7d295fe125f80efdb6b97db11643dd2322ba6957`, [Vercel deployment Ready / Production / Current](https://vercel.com/1alsaads-projects/noorly-gifting/xTHzvRGFGYgA9zXa95NBxBoZuLRv) on `noorlynordic.com`. Only the storefront Accept cookie action has black fill; Decline and Save choices are outlined.
- Vercel's daily deployment limit cleared; no paid upgrade was required. The connector still has project access errors, while the authenticated dashboard works.
- Clarity project `z37qnt9bf3` has verified real mobile heatmap data with masked text. The owner chose **heatmaps only**; do not approve the pending Brand Agent connection. Turning off Clarity Agents JS in Shopify remains an owner action unless subsequently confirmed. Current query/referrer exclusions mean paid ad traffic is not reliably covered by heatmaps.
- Official Facebook & Instagram channel is connected to existing dataset `511816900240916` with explicitly owner-approved Maximum sharing, advanced matching and Conversions API. Shopify confirms Server + Web access. Actual native Purchase receipt and deduplication remain unverified.
- Meta now reports recent server activity, but event-level CAPI statistics remain unconfirmed. The intended ad account is active/funded; all three published campaigns are paused and no published ads were returned. Two unpublished ads were inspected in Ads Manager: both point to erinra.com and promote the outdated 2 × 300 g / 449 kr offer; Hemmamys also has an invalid Instagram identity. Catalog sand variants are staging/not visible and point to the checkout homepage. **Ads are not launch-ready.** See v1.7 for evidence and next actions.
- Hosted Shipping policy and Terms of service now show 349/449 SEK. Hosted Privacy policy includes Clarity and Maximum Meta disclosures; maintain the custom appendix manually.
- Checkout's automatic cookie popup is now enabled and verified saved after reload. With explicit owner approval, banner management is manual; Sweden and the current Swedish wording were preserved. Retest in a fresh private window; existing choices may be remembered.
- CI passed 324 unit tests, 26 browser/accessibility tests, normal build, lint, types, formatting and production dependency audit. Canonical-domain manual testing is blocked by this device's newly registered domain filter; use an unrestricted device or authorized allowlisting.
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
