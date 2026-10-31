# Noorly retail layout refresh — 31 October 2026

The owner asked to rework the rest of the website because the current layout and setup did not feel right. This follows the explicit instruction to retain the original scroll-controlled homepage video, with no play/pause/stop controls and an automatic poster fallback.

## Design direction

Warm ivory, natural sand tones and burgundy actions remain the Noorly palette. The store now uses a consistent retail layout with a centered desktop wordmark, clearer product navigation, a compact mobile menu and a darker, more legible footer. Shop headings and secondary labels are shorter; category navigation points to the actual products.

## Changed surfaces

- Shop and homepage catalogue: bordered product tiles, larger photographs, clearer pricing, real variant counts and prominent product links. Two columns on small screens, three on desktop.
- Product detail: square gallery, thumbnail navigation, inline image arrows, image count and accessible zoom. Cleaner colour choices, purchase hierarchy, preorder note and product disclosures. The mobile variant-before-price order remains.
- Cart: clearer item rows, quantity controls, continued-shopping link, order summary and empty state. Existing errors and checkout guards remain.
- Contact and FAQ: dedicated customer-care navigation, direct support cards and keyboard-accessible disclosures.
- About and corporate enquiries: more structured layouts using existing product imagery and the existing enquiry form.
- Policies: readable narrow text with a contents index. Existing legal text, links and section IDs are preserved.

## Constraints retained

No cinematic source, scroll geometry or media-adapter code changed. Product prices, stock, variants, checkout, analytics, consent and launch gates remain driven by their existing code/data. Preorder timing remains unconfirmed and is disclosed before checkout. Candle-use safety information remains. No review counts, urgency or unsupported product claims were added. Customer-facing AI wording remains removed.

## Validation

Existing launch-product fixtures verify variant prices, correct images and Shopify merchandise IDs. New browser coverage checks desktop/mobile navigation, all product routes, gallery keyboard interaction, customer-care links and horizontal overflow. The original Chromium/Firefox/WebKit scroll-video suite remains part of CI.

The managed local preview daemon is unavailable in this environment. Use the associated GitHub PR checks and Vercel status for build/release evidence, then verify the deployed routes visually. This note records implementation scope, not a claim that unexecuted checks passed.

Canonical storefront: https://noorlynordic.com/sv. Repository: 1Alsaad/noorly-gifting. Supplier and business decisions remain in the existing continuation handovers.
