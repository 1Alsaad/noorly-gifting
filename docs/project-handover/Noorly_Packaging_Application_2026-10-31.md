# Noorly packaging application and Safari icons — 31 October 2026

The owner approved applying the pictured Noorly pouch design, asked to remove “säker” from the checkout action, and reported that arrows look like emoji in Safari.

## Implementation

- Checkout labels are now “Fortsätt till kassa” and “Continue to checkout”. Actual payment and candle-use safety text remains intact.
- All customer-facing Unicode arrow glyphs were replaced with Lucide SVG icons. Decorative icons are hidden from assistive technology; existing accessible control names and interactions remain. The cinematic opening, gallery, product links, cart/error links and customer-service links are covered.
- The colour studio now displays individual Noorly pouch renders with transparent backgrounds. The circular supplier-photo masks are removed. Shade selection still controls the matching actual variant price and product URL.
- The shop introduction uses the owner's approved four-pouch family image with direct shade links.
- Both new image areas explicitly identify the packaging as a concept and point to the current packaging on the product page. Supplier product galleries and current merchandise remain unchanged: applying a visual concept is not evidence that new packaging has been manufactured or will be supplied with an order.

## Assets and provenance

The built-in image generation tool created the approved family concept and four isolated variants. The extraction prompt preserves the wordmark, variant/scent names, flowing graphics, 300 g and four-wick label, silhouette and material; requests one whole upright pouch on a transparent background; excludes new claims, props and surrounding frames. The generated assets were encoded as WebP for delivery with alpha preserved.

Assets are in `public/media/packaging/`: `noorly-pouch-rose-concept.webp`, `noorly-pouch-honey-concept.webp`, `noorly-pouch-mocha-concept.webp`, `noorly-pouch-ivory-concept.webp` and `noorly-pouch-family-concept.webp`. Their SKU association lives in `src/content/colour-story.ts`; these assets do not redefine actual Shopify product images, stock or prices.

## Validation

Component coverage checks the Swedish checkout label, decorative SVG paths, gallery navigation, each selected concept image, the disclosure caption and exact real variant price/link. A focused browser journey runs in Chromium, Firefox and WebKit and verifies SVG controls, accessible names, lightbox navigation and focus restoration. Existing real-video scrubbing coverage remains. CI captures updated desktop/mobile studio, shop and WebKit gallery screenshots for visual review.

No changes to checkout guards, tracking, consent, supplier orders or advertisements. Continue preserving the original scroll-controlled video and automatic still fallback, without playback buttons.
