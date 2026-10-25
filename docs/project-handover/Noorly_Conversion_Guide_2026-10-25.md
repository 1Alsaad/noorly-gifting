# Conversion guide implementation — 25 October 2026

The owner asked to apply the supplied Website Conversion Optimization guide, align the two draft ads with the bowl in the original website film, and present them for final launch review. Ad delivery and spending remain off pending that review.

## Website changes

- The opening now explains the actual product: candle sand, choice of colour/fragrance, 300 g and four included wicks. The source film remains unchanged.
- The primary opening button goes directly to the candle-sand selection. Collection browsing remains available as a secondary action and through the skip link.
- The opening displays the current catalogue starting price and included Sweden delivery only for a real product, not the preview fallback.
- A lightweight, server-rendered three-step guide on the homepage and sand/bundle pages answers selection, suitable vessel and usage questions. It distinguishes the film's styling from included merchandise and does not depict the decorative wood bowl as a qualified candle vessel.
- Existing current-price bundle comparisons, preorder timing, VAT/shipping information, returns answers, variant photographs, accessible controls and mobile purchase shortcut remain in place.

No invented reviews, customer counts, scarcity, countdowns, guarantees or discount anchors were added. No new tracker, form, third-party script or dependency was added. These changes are hypotheses, not evidence of a conversion uplift.

## Measurement plan

Use existing consented product views, variant selections, cart additions and checkout events. Confirm actual paid Purchase receipt/deduplication before using purchase conversion or ROAS as a decision metric. Existing Clarity query/referrer restrictions mean it does not cover all paid ad landings. Do not compare a handful of heatmap sessions as an A/B test.

Record the deployment date, device, traffic source, product views, additions, checkout starts, verified paid purchases, AOV and spend. Establish a baseline with sufficient traffic, then randomize one meaningful change (for example opening copy) against the current version, with a fixed sample plan and confidence interval. Avoid stopping on a promising early result. This release is a set of clarity improvements; no experiment assignment or measured lift is claimed.

## Verification

Local TypeScript and lint pass; 324 existing unit/component tests pass. Existing browser title assertions were updated for the new copy. Review CI and deployment evidence for the final commit. Local previews use a non-purchasable fallback catalogue and are not proof of a production checkout or transaction. The owner network blocks the newly registered public domain via Zscaler.
