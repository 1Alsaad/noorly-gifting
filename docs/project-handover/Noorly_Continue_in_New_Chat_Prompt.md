# Noorly next-session prompt

**Current entry point:** [v1.6](Noorly_Continuation_Handover_v1.6.md). Read it and the release PR before using the historical prompt below. Clarity and native Meta Maximum have since been configured with owner approval; remaining receipt checks must not be confused with installation.

Updated 25 October 2026. Copy the prompt below into the next session with GitHub, Shopify, Vercel, Meta Ads and Browser enabled. Verify actual access before assuming the previous browser or deployment blockers are resolved.

```text
Continue Noorly and finish the tracking, heatmap and cookie-button work. IMPLEMENT the changes, not just a plan. NO DEEP RESEARCH.

Use my connected GitHub, Shopify, Vercel, Meta Ads and Browser/Computer tools where available. Inspect existing browser tabs and signed-in sessions before asking me to log in again. Verify actual access; do not assume that enabling a tool resolves deployment limits or account permissions.

READ FIRST:
https://github.com/1Alsaad/noorly-gifting/blob/main/docs/project-handover/Noorly_Continuation_Handover_v1.5.md

Then read AGENTS.md, the handover README, the pixel and consent/heatmap checkpoints, and PRs #34, #35 and #36. Check the current main branch; later owner instructions override historical launch restrictions.

PROJECT
Repository: 1Alsaad/noorly-gifting
Website: https://noorlynordic.com/sv
Shopify: https://admin.shopify.com/store/tzwngp-h1
Checkout: https://checkout.noorlynordic.com
Recorded Vercel project: noorly-gifting / prj_giiYMRfopk6hpEXGWb8TXAHU39x4
Recorded Vercel team: 1alsaads-projects / team_fyWRW85ET1y2k933iBNlpNoR
Existing Meta pixel/dataset: 511816900240916. Reuse it; do not create another.

CURRENT POSITION
PR #34's pricing/CRO release was the last verified production version. PR #35's expanded Meta events and Shopify storefront analytics, plus PR #36's black cookie buttons, are tested and merged but were not live at the last deployment check. The application head before the handover-only update was f420853d27050f7e47307cea4ed272c705259cf6.

Deployment previously hit Vercel's api-deployments-free-per-day limit. Later alias/project reads returned 404 despite the recorded team being visible. Diagnose current access and quota; do not assume resolution, recreate the project, switch domains, bypass limits or upgrade billing silently. Native checkout Purchase tracking and heatmaps are still incomplete.

EXECUTE IN THIS ORDER

1. Verify GitHub/Vercel access, the domain's deployed source, current main and deployment quota. Publish the saved changes using the correct production environment when available. Never promote a preview built with mock commerce. Batch related changes to conserve deployments.

2. Complete Meta and Shopify tracking. Inspect existing apps/pixels first, then finish the official Facebook & Instagram channel connection using the existing dataset if still missing. Preserve independent analytics/marketing consent and avoid duplicate pixels or Purchase events. Do not silently enable Enhanced/Maximum personal-data sharing. Verify PageView, ViewContent, successful AddToCart and checkout initiation with correct selected variants and SEK values. Complete and verify native checkout Purchase tracking and deduplication through an appropriate test flow. A checkout click is not a Purchase; do not send fake conversions or charge a card without approval.

3. Install heatmaps for clicks, scrolling and behaviour using the correct owner-controlled Microsoft Clarity project or existing chosen provider. No project ID was available and nothing was installed previously. Inspect my signed-in browser first; ask only for an unavoidable sign-in, approval or public project ID. Require analytics consent, mask personal/form data, exclude admin/account/checkout pages, test rejection and withdrawal, and update privacy/cookie disclosures. No paid subscription is authorised.

4. Publish and verify the already-implemented black-background, white-text consent controls on mobile and desktop. Keep accept/reject clear and equally accessible, preserve category choices and do not start optional tracking before permission.

5. Correct the old 219/269 SEK wording in Shopify-hosted Shipping policy and Terms of service, including English, to 349/449 SEK. Website policies are already updated. Use authorised access or identify the exact owner-only step; do not expand connector permissions silently.

PRESERVE
Unscented sand 349 SEK; scented sand 449 SEK; bowl 550 SEK; native bundles 699/749 SEK. DO NOT CHANGE SHOPIFY INVENTORY QUANTITIES or shared bundle components.

Keep the original video and scroll animation, separate bowl/sand pages, colour/photo selector, CRO additions and Noorly checkout styling. Keep pre-order wording saying orders ship as soon as stock arrives; do not invent an arrival date.

Do not restore my personal address, Noorly AB, supplier names or technical product codes to normal customer-facing copy. I will complete accurate company details manually. Retain appropriate privacy disclosures and do not invent legal facts. Vegan/Recyclable badges need evidence; Handmade applies to the bowls. Preserve unused/unlit return guidance without overriding statutory rights.

Do not activate ads, increase budgets, buy inventory, change payment/bank details, purchase a paid plan or submit real-money orders. The historical 4,000 SEK ad allocation is not permission to launch campaigns now.

FINISH
Work on what is available; ask only for an action that genuinely requires me. Give brief progress updates. Verify the actual live website, deployment source and provider receipt separately from code/CI success. Update the GitHub handover and report exactly what is implemented, merged, deployed, verified collecting, or still blocked, with relevant URLs and the next action.
```
