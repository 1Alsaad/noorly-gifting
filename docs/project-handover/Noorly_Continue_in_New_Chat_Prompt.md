# Noorly next-session prompt

Updated 25 October 2026 after PR #39 and the live tracking/readiness audit. Copy the prompt below into a session with GitHub, Shopify, Vercel, Meta Ads and Browser available.

```text
Continue Noorly from the tracking and advertising-readiness audit. Real masked Clarity heatmaps are verified. Native Purchase/deduplication, actual ads and catalog eligibility still need work. NO DEEP RESEARCH.

READ FIRST
https://github.com/1Alsaad/noorly-gifting/blob/main/docs/project-handover/Noorly_Continuation_Handover_v1.7.md
Then read AGENTS.md, the handover README, v1.6 for installation details and PR #39. Inspect current main, deployment status and existing signed-in sessions before changing anything. Verify actual connected-tool access.

PROJECT
Repository: 1Alsaad/noorly-gifting
Website: https://noorlynordic.com/sv
Shopify: https://admin.shopify.com/store/tzwngp-h1
Checkout: https://checkout.noorlynordic.com
Vercel project: noorly-gifting / prj_giiYMRfopk6hpEXGWb8TXAHU39x4
Vercel team: 1alsaads-projects / team_fyWRW85ET1y2k933iBNlpNoR
Existing Meta dataset: 511816900240916. Reuse it; do not create another.
Clarity project: z37qnt9bf3.

VERIFIED RELEASE
PR #39 merged as 7d295fe125f80efdb6b97db11643dd2322ba6957. Vercel deployment xTHzvRGFGYgA9zXa95NBxBoZuLRv was Ready, Production, Current on noorlynordic.com. Only the storefront Accept action is black; Decline and Save choices are outlined. CI run 40192021380 passed all checks. The daily limit cleared without a paid upgrade. The Vercel connector returned access errors; the authenticated dashboard worked.

Clarity is deployed behind explicit analytics consent with strict masking and default cookies off. Only canonical HTTPS public routes without query/hash parameters or unsafe referrers qualify. Private routes are excluded. Consent withdrawal stops recording, clears cookies and reloads. Previous positive consent must be refreshed under noorly-consent-v3.

Clarity now shows two mobile sessions and a masked candle-sand heatmap with two page views/two taps. I chose HEATMAPS ONLY after the Brand Agent data sharing was explained. Do not approve the pending Shopify project-link request or publish a Brand Agent. The assistant selected Don't publish yet, but could not verify persistence after the Shopify iframe went blank. I was asked to turn off Clarity Agents JS and Save; check whether I confirmed this before claiming it done. Shopify theme embeds do not install scripts into the headless frontend. Paid traffic with fbclid/UTMs or external referrers is currently excluded from heatmaps; do not claim full ad-traffic coverage.

The official Facebook & Instagram Shopify channel is connected. I explicitly approved Maximum sharing, including newer technologies, after being informed about personal data shared with Meta. Do not ask again for the same permission. Existing dataset 511816900240916 is used. Shopify shows Server + Web and Optimized access. The free catalog was approved and active sand/bowl products included. No ads were launched. Native checkout retains its own consent interface; do not assume headless localStorage automatically propagates consent.

Hosted Terms of service and Shipping policy now show 349/449 SEK. Hosted Privacy policy includes the Clarity/Maximum Meta appendix, with automatic rewriting disabled. Maintain this disclosure with future edits.

Checkout's Show cookie banner in checkout setting was initially off and is now enabled, saved and verified after reload. Shopify required manual banner management to save it; I explicitly approved this while preserving Sweden and the current wording. Both were retained. Future region/content updates require manual review. A fresh private-window checkout test still needs to confirm the popup; existing consent may be remembered.

REMAINING VERIFICATION
The current device's network filter blocks the canonical website because the domain was newly registered. This is not evidence the site is unsafe. No bypass or alternate-domain redirect change was made. Use an unrestricted device or authorized allowlisting for live tests. Clarity is intentionally disabled on Vercel aliases, which cannot validate canonical-domain recording.

For a clean test, type the canonical /sv URL directly in a private window without tracking parameters. Reject optional tracking and confirm shopping still works. Then accept Analytics and Marketing, browse/scroll a product for about a minute, add it to cart and enter checkout. Accept checkout's own cookie choices if prompted, but do not pay. Note time/product. Withdraw optional consent again and confirm shopping works. Verify masked Clarity receipt and real Meta PageView/ViewContent/AddToCart/InitiateCheckout separately from mocked CI evidence.

On the next legitimate consenting order, verify native Purchase value/currency and browser/server deduplication. Shopify's native channel owns Purchase/CAPI. Do not add a duplicate custom sender, fabricate conversions or make real charges. Meta metadata now reports server activity on 25 October at 13:18:38 Europe/Stockholm, but SERVER_ONLY event statistics were empty. PageView/ViewContent/AddToCart/InitiateCheckout were returned in aggregate; Purchase was not.

ADS READINESS
Noorly - Ad Account 479891386519342 is active, SEK, with a payment method. Three published campaigns are paused; one uses an outdated 799 kr offer, and no published ads were returned. The connector cannot retrieve drafts, but the Ads Manager UI revealed two unpublished ads: Vinterduon 120252008431640015 and Hemmamys 120252008338050015. Both point to erinra.com and promise 2 × 300 g for 449 kr. Hemmamys also has an invalid Instagram identity (f_roma04) and an unchecked AI-media disclosure despite text saying AI-styled. No creative visuals are approved. Fix these before launch; preserve drafts and leave ads off. Existing published ad-set dates are 23–27 October and need review for a new test. Catalog 2504892520035407 contains 11 sand variants, all staging/not visible, pointing to the checkout homepage. No bowl was returned. Fix/verify this before catalog ads. Do not launch old campaigns together or infer launch permission from the 4,000 SEK planning budget.

PRESERVE
Sand 349 SEK unscented / 449 SEK scented; bowl 550 SEK; native bundles 699/749 SEK. Do not change inventory or shared bundle components. Keep the original video and scroll animation, separate products, selectors, CRO work, black consent controls and checkout styling. Keep dispatch-on-stock-arrival messaging; do not invent dates, scarcity or reviews. Keep Swedish/English copy and truthful claims. I will complete accurate seller details manually; do not expose private addresses or invent legal facts.

Do not activate ads, increase budgets, buy inventory, change payment/bank details, buy a paid plan or submit real-money orders. The historical 4,000 SEK ad allocation is not permission to launch campaigns now. If Vercel's daily limit recurs, batch work and wait for its actual reset; no replacement project or silent billing upgrade.

FINISH
Complete available verification, update the GitHub handover and report implemented, merged, deployed and actually collecting as separate statuses. Ask only for an unavoidable owner action. Never claim real event receipt based solely on installation, screenshots, mocks or passing CI.
```
