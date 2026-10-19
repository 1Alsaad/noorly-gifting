# Sequential product testing: budget and Purchase goal

Updated 19 October 2026. This document supersedes earlier lifetime-budget acquisition plans.

## Verified current setup

- Account: Noorly - Ad Account, 479891386519342, currency SEK.
- Campaign: 120251947281020015, OUTCOME_SALES, configured and effective status PAUSED.
- Campaign DAILY budget: 5,000 ore = 50 SEK for the whole campaign. No separate ad or ad-set budget is allocated.
- Campaign spend cap: 400,000 ore = 4,000 SEK cumulative across ALL sequential product tests. This is the program's safety ceiling, not a lifetime budget or a first-product allocation.
- Current product ad set: 120251947284140015, candle sand, PAUSED.
- Performance goal: OFFSITE_CONVERSIONS, destination WEBSITE, dataset 511816900240916, custom event PURCHASE.
- No new ad entities are attached. Six image/copy creatives remain in the creative library and carry no individual budgets.
- Archived campaigns: 120251946652050015 and 120251945584240015. Their ad sets are archived too. The historical 4,000 SEK lifetime numbers remain visible on archived objects; they are not current test allocations.
- The old archived Leads configuration is historical. No current test optimizes for Lead, clicks or add-to-cart. Every future product ad must inherit Sales + website Purchase before activation.

Purchase is selected on the ad set, and ads inherit that conversion goal. A LEARN_MORE creative button is not an optimization goal. The website must still complete real paid checkout and verified Purchase tracking before launch.

## Reserve and pacing

The shared research reserve is 4,000 SEK across products, including retests. It is not 4,000 SEK for each product, campaign, ad set or creative. The campaign spend cap enforces that shared program ceiling while the daily budget controls pacing. Run all future tests within this campaign; creating another funded campaign would create a separate ceiling and is not authorized by this plan.

Start at 50 SEK per day TOTAL, with one product in one ad set and only one or two selected image creatives. Do not run each candidate at 50 SEK per day. Keep the remaining products unactivated and unallocated.

Review a product after approximately four to five days, targeting roughly 200–250 SEK of spend. Move to another sourceable product when the offer is unpromising, or investigate the offer/checkout before spending more. Do not automatically continue until the entire 4,000 SEK is exhausted. Subtract actual spend from the reserve rather than assuming that every test costs exactly 250 SEK.

This is cautious screening, not a statistically conclusive product-validation experiment. A few days at this budget may produce very few paid orders. Zero purchases alone does not establish that the product has no demand; check actual traffic, working checkout, tracking, price, delivery promise and allowable acquisition cost. Purchase remains the optimization event even when volume is low.

There is no evidence yet that 50 SEK per day is a profit-maximizing budget: supplier costs, margins, final selling prices and measured acquisition cost are not established. It is the merchant's requested small-risk starting pace. Change it only when actual retained orders and contribution margin justify a change.

## Budget controls and concrete limitations

Meta defines a daily budget as an average, not an exact daily spending ceiling. Daily spend can exceed or fall below 50 SEK. A short four-to-five-day run also should not be described as a guaranteed 200–250 SEK charge.

Meta rejected a 250 SEK campaign spending cap with error 2446307: the minimum for this SEK account is 1,000 SEK. No 1,000 SEK first-product cap or allocation was substituted. The new campaign has the merchant's 4,000 SEK shared program ceiling, covering all tests combined. It does not have a 250 SEK per-product cap. The 250 SEK figure is a review allowance only.

The account-level spending-limit screen could not be accessed because the browser is logged out, and this setting is not exposed by the current Meta MCP tools. No account limit was changed. If a strict 250 SEK first-test cap is required, configure and verify a suitable account limit in authenticated billing settings before activation, or deliberately choose a small lifetime-budget alternative. Do not claim that an automation or manual check is a guaranteed hard cap.

The API rejected changing the original campaign from lifetime to daily budget (1885630), so the daily campaign was created separately and both superseded campaigns/ad sets were archived. An attempted simultaneous daily/lifetime field update was also rejected before any change.

## Schedule and switching products

The held first test is scheduled from 23 October 2026 at 08:00 CEST to 27 October at 08:00 CET. The daylight-saving transition makes that about four days. It remains PAUSED and must be rescheduled if paid-checkout readiness misses this window.

Do not create overlapping funded tests. Pause the completed product's ad set before preparing the next one under the same 50 SEK daily campaign budget. Record the product, actual spend, paid orders, cancellations/refunds and contribution after advertising. New ad sets must explicitly use PURCHASE. Do not change to Lead or add-to-cart to manufacture a larger result count.

No automatic product switching, recurring job, campaign activation, billing change or budget increase has been created.

## Research used and evidence limits

- Meta-authored guidance: [How to manage your spend across Meta ads](https://www.publicnow.com/view/0807F171279348987DA5CDD63B6E59EAFFDEF343), 26 July 2023, distributed unedited by Public Technologies. It distinguishes daily averages from lifetime caps, explains campaign-level budget sharing and recommends reviewing spend controls and pacing.
- Meta Business Help Center: [About Ad Set Budget Sharing](https://z-p4-lookaside.fbsbx.com/business/help/1388266028979935). Current indexed text describes daily-budget flexibility; do not promise an exact daily maximum.
- Meta's canonical budgets and learning pages redirected to login in this session. No unsupported universal minimum viable test budget or promised purchase count is inferred from third-party benchmarks.
- The connected account reported a technical minimum daily budget of 996 ore (9.96 SEK). This is a delivery floor, not proof that a budget is large enough to produce reliable purchase evidence.
- Live Meta read-back verified the new 50 SEK daily budget, 4,000 SEK cumulative program ceiling, PAUSED delivery state and PURCHASE event. Direct API validation established the budget-type and minimum campaign-cap constraints above.

See [paid pre-order readiness](paid-preorder-test.md) and [image/copy drafts](noorly-image-ad-drafts.md) for the remaining launch requirements.
