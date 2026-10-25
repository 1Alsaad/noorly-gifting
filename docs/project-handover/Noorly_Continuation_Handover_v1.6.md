# Noorly continuation handover — v1.6

Updated 25 October 2026. Read this before v1.5. Preserve its product, stock, pricing, original video, launch and seller-identity decisions. Installation is not proof of provider receipt.

## Account installation

- **Clarity:** free Noorly project `z37qnt9bf3`, canonical website, Retail. [Settings](https://clarity.microsoft.com/projects/view/z37qnt9bf3/settings). Strict masking selected; default Cookies off. The code grants analytics storage through consent v2 only after explicit Analytics permission; Microsoft ad storage stays denied. No advertising integrations enabled.
- **Meta:** official Shopify Facebook & Instagram channel installed. The owner approved the account connection, existing dataset, free catalog and Product Catalog Terms. After being told which personal details would be shared, the owner explicitly chose **Maximum, including newer technologies**. This supersedes the earlier Standard-only assumption. No ads were created or funded.
- Existing dataset **511816900240916**, UY Scuti Media Pixel, owned by Noorly. No replacement pixel. Settings confirm Maximum, Pixel, advanced matching and Conversions API; catalog reports **Catalog in sync**. Broad portfolio-wide catalog access was left unchecked.
- Shopify Customer events lists Facebook & Instagram with **Server + Web**, Optimized access and a data-access-granted entry. It requires analytics and marketing permission and respects data-sale opt-out. Shopify customer privacy shows the cookie banner enabled for Sweden and EU data hosting. Checkout retains its own consent interface; headless localStorage preferences are not claimed to be Shopify's native consent cookie.
- The initial reconnect warning was addressed; Re-connect returned **Data sharing is connected for your Shopify and Meta account**. Verify refreshed status and actual event receipt rather than relying solely on that toast.
- Vercel production public config: `NEXT_PUBLIC_CLARITY_PROJECT_ID=z37qnt9bf3`. Never commit credentials or private account information.
- Existing active sand and bowl products were included in the Facebook & Instagram sales channel for the approved catalog sync. Shopify's native bundle was excluded by its channel workflow; component inventory was not modified.
- Hosted Terms of service and Shipping policy now show **349/449 SEK**, verified by reopening the editors. Hosted Privacy policy retains its existing text and adds the same Clarity/Maximum Meta disclosures as the storefront. Automatic privacy-policy rewriting was disabled to retain the custom appendix. Future policy changes must maintain this disclosure.
- **Checkout cookie banner follow-up:** the owner reported that only the footer cookie-preferences link opened the dialog. Shopify's separate **Show cookie banner in checkout** setting was off. Enabling it initially failed because Shopify required automatic banner management to be disabled. The owner explicitly approved manual management while preserving Sweden and the existing wording. The setting was then saved and verified after a reload: checkout banner on, automated regions/content off, Sweden retained, and the displayed Swedish banner text/buttons identical. Future region/content updates need manual review. This verifies the saved configuration, not a live checkout session; a fresh private-window test remains necessary. Missing a popup alone does not establish acceptance or the visitor's stored consent. See [Shopify's checkout-banner announcement](https://changelog.shopify.com/posts/improved-privacy-features-simplify-your-path-to-compliance) and [privacy settings](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings).

## Implementation

- Clarity loads only after Analytics consent with real Shopify commerce and product-test mode false, on canonical HTTPS storefront hosts. Only clean Swedish/English home, shop, about, product and collection routes qualify.
- Cart, checkout, account, admin, forms, query/hash URLs and unsafe referrers are excluded. This deliberately undercounts visits. After stopping on an excluded route, recording requires a clean full reload to restart.
- HTML masking precedes tag loading. No custom identity, contact fields or order data are supplied. Withdrawal denies storage, stops recording, clears `_clck`/`_clsk`, removes the tag and reloads to dispose of vendor code, including in-flight downloads.
- Consent key is `noorly-consent-v3`. Previous rejection is preserved; earlier positive permissions require a fresh choice because replay and expanded matching are newly disclosed.
- Swedish/English consent, privacy and cookie text covers Clarity, Meta matching, retention and withdrawal. Original video, black cookie buttons, product prices, variants, bundles and inventory are preserved.
- Storefront Meta events remain marketing-gated and browser-only. **Do not add a second custom Purchase/CAPI sender.** Shopify's native channel owns checkout Purchase and browser/server deduplication. Existing paid-order analytics preparation is not evidence of a working custom Meta sender.

## Deployment and verification

The old 24-hour Vercel block cleared before this release. The signed-in dashboard showed production **Ready** at `6485419628dc7abf815e6863d682164c9befef7a`, deployment `GX32FHQk5QY28ZmZs9PUEXQb45FU`, canonical domains assigned and valid. PRs #35/#36 were therefore already deployed. The connector still returned project 404/empty lists; use the authenticated dashboard. Do not recreate the project or move domains to work around connector access.

[PR #38](https://github.com/1Alsaad/noorly-gifting/pull/38) is merged as **`d29bfe7f5d1994147fd064c9f851f9713404f306`**. The authenticated Vercel dashboard verified [deployment `B8pLSokVE6WfPGV4XQSp7w4g5Gca`](https://vercel.com/1alsaads-projects/noorly-gifting/B8pLSokVE6WfPGV4XQSp7w4g5Gca) as **Ready, Production, Current**, with `noorlynordic.com` assigned and source `main` at that exact merge. The build finished in 27 seconds on 25 October 2026, 12:38 Europe/Stockholm. GitHub also reported Vercel success. The Clarity integration and consent changes are deployed; no paid upgrade was needed.

Local checks: **44 files / 324 tests passed**, lint, TypeScript, formatting and production-mode preview build passed. The default local Turbopack build stalled and was cancelled; `next build --webpack` succeeded. That local build used mock commerce for verification and was not deployed. [CI run 40189359239](https://github.com/1Alsaad/noorly-gifting/actions/runs/40189359239), on final PR head `9e04bf7e0a4fca8941c5c8e96a351959754fbf8e`, passed formatting, lint, TypeScript, all 324 unit tests, the normal production build, **26 browser/accessibility tests** and the production dependency audit. CI requests are not proof of provider receipt.

This device's network filter blocks the public domain because it was newly registered; that classification is not evidence that the site is unsafe. Chrome and the in-app Browser could not complete a live storefront test. The owner confirmed the age-based restriction. No security bypass or temporary redirect change was used. **New Clarity receipt, native Purchase and deduplication remain unverified** until an unrestricted consenting visit/order is observed. After deployment, Clarity's Recordings/Heatmaps views were still disabled awaiting initial data. Meta API statistics confirmed earlier browser activity from the canonical domain, not the new CAPI setup; no server receipt was established. Test on an unrestricted device or after an authorized domain allowlisting. The Vercel alias is excluded from Clarity's production host allowlist and would not verify canonical-domain collection.

## Owner verification after Ready

1. Type `https://noorlynordic.com/sv` directly in a private window on an unrestricted device, without query parameters. Check black/readable cookie controls; reject optional tracking and confirm shopping works.
2. In Cookieinställningar accept Analytics and Marketing, browse/scroll a product for about a minute, add to cart and enter checkout. Accept checkout's own optional cookie choices if prompted. **Do not pay just for this test.** Note the time/product.
3. Reject optional tracking again. The page may reload; shopping should work. Confirm the cinematic video and prices: sand 349/449, bowl 550, bundle 699/749 SEK.
4. Check Clarity for a masked recording and Meta for PageView/ViewContent/AddToCart/InitiateCheckout. Use DevTools to confirm no requests before consent or after withdrawal where possible. Mocked requests are not provider receipt.
5. On the next legitimate consenting order, verify Purchase value/currency and browser/server deduplication. No fake purchases, charges or payment-test configuration changes were authorized.

If the daily limit recurs, wait for its actual reset/retry time and batch commits/builds. A paid Pro upgrade requires an explicit billing decision; repeated deploy attempts or replacement projects are not a fix.

## References

- [Vercel project](https://vercel.com/1alsaads-projects/noorly-gifting), [Shopify Customer events](https://admin.shopify.com/store/tzwngp-h1/settings/customer_events)
- [Meta dataset](https://business.facebook.com/events_manager2/list/pixel/511816900240916/overview?business_id=480366209646496)
- [Clarity consent v2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2), [masking](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking)
- [Shopify Meta sharing](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing), [Vercel limits](https://vercel.com/docs/limits)
