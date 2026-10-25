# Noorly consent and heatmap checkpoint — 25 October 2026

## Owner request

Install behaviour heatmaps and give the cookie acceptance button a dark/black
background. The owner also invoked the connected Browser to continue setup.

## Implemented in this change

The cookie banner's accept and reject actions now share a black background,
white text, hover state and visible keyboard focus. The save-preferences button
uses the same styling. Both initial choices remain equally clear and available
in one click. Consent storage, defaults, category toggles and event behaviour
are unchanged. Existing Meta and Shopify tracking code is untouched.

This checkpoint records the code change, not proof of production deployment.
Check the associated pull request and deployment for the final release status.

## Heatmap installation is NOT complete

The Browser tool returned that the originating browser context is required.
No browser tabs or authenticated Clarity dashboard were accessible in this
continuation. The production environment metadata contains no heatmap project
ID. No heatmap provider account or project was created, no tracking script was
added, and no session recordings or heatmaps are collecting through this change.
Do not describe heatmaps as installed or active.

To continue, connect the originating browser session to the owner's heatmap
account, or obtain the public project ID for the owner's chosen provider.
Install only after verifying project ownership and privacy settings. Gate the
script on analytics consent, mask personal/form data, exclude admin/account and
checkout pages, and verify that rejecting or withdrawing consent stops capture.
Update the privacy/cookie notice to match the actual provider and data use.
Do not invent an ID, use an unrelated project, or start a paid subscription.

## Pixel status remains as previously recorded

Read [the pixel checkpoint](Noorly_Pixels_2026-10-25.md). Meta storefront events
and Shopify storefront page/product analytics were previously implemented.
Native checkout purchase tracking and the official Facebook & Instagram channel
connection still require completion and verification. Existing Meta dataset:
`511816900240916`. Do not create a duplicate or report Purchase from a checkout
click. No real purchase, inventory adjustment, price or ad-budget change belongs
to this continuation.
