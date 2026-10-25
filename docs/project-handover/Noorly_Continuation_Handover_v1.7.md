# Noorly continuation handover — v1.7

Updated 25 October 2026 after the live tracking and advertising-readiness audit. Read this before v1.6. Preserve the existing storefront, prices, inventory, consent rules and original video. This checkpoint records observations; it does not authorize advertising spend.

## Owner decision: heatmaps only

The owner installed Shopify's Microsoft Clarity app and enabled **Clarity JS** and **Clarity Agents JS**. The app requested a link to existing project `z37qnt9bf3`. After the additional Brand Agent data use and catalog discovery were explained, the owner explicitly chose **Keep heatmaps only for now**.

- Do not approve the pending Shopify-to-Clarity link, accept Brand Agent terms, publish an assistant or enable its catalog/conversation sharing under the earlier setup request.
- The app's traffic selector was changed to **Don't publish yet**. Persistence could not be verified: after reload, its embedded page stayed blank. Do not claim this is a verified saved backend setting.
- The existing project's header has Dashboard, Recordings, Heatmaps and Settings; the Shopify link was still pending approval. No Brand Agent was published by the assistant.
- The owner was asked to turn off **only Clarity Agents JS** in Shopify's App embeds screen and Save, leaving **Clarity JS** enabled. This remains an owner action unless a later reply confirms completion. The theme editor stayed blank on this device. The app's theme-settings shortcut opened the blocked checkout domain; no warning or network restriction was bypassed. The connector does not allow theme-file writes to the live theme.
- The Next.js storefront already has its own consent-gated Clarity tag. Shopify theme embeds do not install scripts into that separate frontend. Heatmaps do not require completing the optional Brand Agent connection.

## Actual provider receipt verified

### Clarity

[Noorly dashboard](https://clarity.microsoft.com/projects/view/z37qnt9bf3/dashboard) showed **2 mobile sessions**, 2.50 pages/session, 74.40% average scroll depth and no recorded JavaScript errors for the selected last-three-days period. This is a tiny verification sample, not conversion-performance evidence.

The Heatmaps page listed the Swedish homepage, candle-sand page and bowl/sand bundle page. Opening the candle-sand mobile tap map showed **2 page views and 2 taps**, including the purchase button and a variant control. The rendered page text was masked. This supersedes v1.6's statement that initial heatmap receipt remained unverified.

The current implementation deliberately excludes query/hash URLs and external or query-bearing referrers. Consequently **Meta ad landings with fbclid/UTM parameters or external referrers are not reliably represented in Clarity**. Preserve privacy boundaries until a properly reviewed, consent-aware attribution/recording change is implemented. Do not claim this is complete heatmap coverage of paid traffic. Native checkout and private pages remain excluded.

### Meta

Existing dataset `511816900240916` remains active. Its metadata reported browser activity at **25 October 2026 13:13:20 Europe/Stockholm** and server activity at **13:18:38**. The server timestamp is new evidence of receipt; a separate SERVER_ONLY event-statistics query still returned no rows, so exact CAPI event types/counts were not established.

The aggregate event query included PageView, ViewContent, AddToCart and InitiateCheckout. **No Purchase was returned. Purchase value/currency and browser/server deduplication remain unverified.** The quality query returned event names without usable match-quality scores. Do not invent a score or equate the server timestamp with a verified Purchase. The official Shopify channel remains the owner of checkout Purchase/CAPI; do not add a duplicate sender.

## Advertising verdict: not ready to launch

The intended **Noorly - Ad Account**, `479891386519342`, is **ACTIVE**, uses SEK and has a payment method. Other discovered accounts are not substitutes: two Noorly accounts lack payment methods, one older account is closed and another account is unavailable to the connector.

The intended account contained three paused published campaigns:

- `120252042640230015`: Sweden-only Ljusstund **799 kr**, first-test 1,000 SEK lifetime budget, HOLD.
- `120252042618440015`: Ljusstund presale, 3,000 SEK lifetime budget, DRAFT / DO NOT PUBLISH in its name.
- `120251947281020015`: all-product tests, 50 SEK/day shared campaign budget, HOLD.

Only one published ad set was returned: `120251947284140015`, candle sand, Sweden, website PURCHASE optimization using the correct dataset, paused, scheduled 23–27 October. **The published ad query returned no ads.** Unpublished Ads Manager drafts could not be retrieved: the draft endpoint returned INVALID_ARGUMENT. Inspect those directly in Ads Manager before assuming no staged work exists. Delivery-error lookup on the existing campaigns/ad set returned no errors; that does not make an empty or outdated campaign launch-ready.

Before launch, reconcile the old campaign names/offers and schedule with the current 349/449 SEK sand and 699/749 SEK bundle prices, prepare/review actual ads and landing URLs, set one deliberate current test budget, and verify the purchase path. Do not activate the three historical campaigns together. The 4,000 SEK allocation remains planning context, not launch approval.

### Catalog limitations

Catalog `2504892520035407`, **Shopify Product Catalog (tzwngp-h1.myshopify.com) - 2026-10-25 System User**, was inspected through Meta:

- 11 sand variants were returned, at the correct 349/449 SEK prices and in stock.
- All were **staging**, with `PRODUCT_ITEM_NOT_VISIBLE`; dynamic-ad eligibility was not evaluated.
- Every returned item URL was `https://checkout.noorlynordic.com/`, rather than the actual canonical product page. Review the Shopify-owned feed/domain mapping before using catalog ads; a direct catalog edit may be overwritten by sync.
- No bowl item was returned. The earlier Shopify publishing operation is not proof that Meta has a usable bowl listing.
- Dynamic-ads health failed its visibility check. General catalog diagnostics returned no rows, but item-level results establish the problem. The pixel is connected; match-rate history contained zero matching evidence and cannot validate current product-ID matching.

These are catalog-ad blockers. They do not imply that a reviewed standalone website ad requires an approved catalog, but actual ads and the purchase checks are still missing.

## Production release

[PR #39](https://github.com/1Alsaad/noorly-gifting/pull/39) merged as `7d295fe125f80efdb6b97db11643dd2322ba6957`. The authenticated Vercel dashboard verified [deployment xTHzvRGFGYgA9zXa95NBxBoZuLRv](https://vercel.com/1alsaads-projects/noorly-gifting/xTHzvRGFGYgA9zXa95NBxBoZuLRv) as **Ready / Production / Current** on the canonical domain. The storefront's Accept action alone is black; Decline and Save choices are outlined. [CI run 40192021380](https://github.com/1Alsaad/noorly-gifting/actions/runs/40192021380) passed all required checks. This is the last verified application release; this handover update changes documentation only.

The 24-hour deployment limit is no longer the active blocker. Shopify's native checkout popup still has its close control and shared button styling; no unsupported custom checkout CSS/JS patch was installed.

## Supplier follow-up

The owner asked to review the latest supplier email. M1 Candles' 25 October reply offers unscented European plant-based sand, separate fragrance oil and separate wicks, but no finished 650 g retail packaging. Swedish labelling, technical documentation and burn-test support require separate review. It is not a confirmed replacement for the requested finished, pre-scented 650 g specification. No reply, order, payment or supplier change was made. Review the original Gmail thread for commercial terms; this does not change the current 300 g storefront offer.

## Next actions

1. Confirm the owner's Clarity Agents JS disable/save action; keep the project-link request unapproved under the heatmaps-only instruction.
2. Review any unpublished Ads Manager drafts, build/review current ads, and reconcile the schedule and single test budget. Obtain explicit launch authorization before spending.
3. Repair/verify catalog product destinations and visibility if catalog ads are intended; check that the bowl appears and event content IDs match.
4. Verify native Purchase value/currency and deduplication on a legitimate consenting order. No fabricated conversions or real-money test order is authorized.
5. Address paid-traffic heatmap coverage deliberately before using Clarity to judge ad landings. Keep strict masking, consent and private-page exclusions.
6. Owner retains responsibility for accurate seller details and supply/dispatch promises; do not restore old sales gates or invent missing information.
