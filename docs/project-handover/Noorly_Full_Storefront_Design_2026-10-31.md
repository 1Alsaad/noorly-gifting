# Noorly storefront completion and Alva imagery — 31 October 2026

The owner asked to carry the new visual direction through the rest of the website and improve the bowl image.

## Applied design

- Product pages now use prominent Luma/Alva names, clear product descriptors, an editorial gallery stage, colour-led selection and offer sections, and consistent pill-shaped actions.
- The Alva product gallery leads with a styled studio image, followed by all three original supplier photographs. Gallery controls, lightbox, keyboard navigation, no-JavaScript photo links and exact variant selection are retained. A visible caption distinguishes the styled image.
- Catalogue bowl cards, bundle cards, the home material chapter and product offer tiles use the new studio image. The circular bowl-photo mask is removed.
- The home material chapter uses a mocha background and larger rectangular photography. Product inspiration and About use the new daylight editorial scene. The old generated scenes of burning candle sand directly in a wooden bowl are no longer displayed.
- About, FAQ, customer service, shipping/policy pages, corporate enquiries, interest and cart now use the same rose/honey/mocha palette and typographic hierarchy. Legal content and forms keep their existing facts and behavior.
- Header and footer wordmarks use the same lowercase sans-serif `noorly.` treatment as the pouch concept. Accessible names remain Noorly.

The original scroll-controlled video remains unchanged, with no play/stop controls. Existing approved pouch concepts remain identified as concepts; the sand product gallery still shows current supplier packaging. No Shopify prices, inventory, IDs, checkout guards, tracking, consent, supplier orders or advertising were modified.

## Bowl asset provenance

The built-in image-generation tool edited the actual AW supplier bowl reference already used by Noorly: `launchBundlePhotos[0]` in `src/content/launch-bundle.ts`. Its original file remains available in the product gallery. The prompts preserve the bowl's irregular wavy rim, proportions, carved walls and characteristic light/dark grain, changing photographic lighting and surroundings only. The generated images were visually compared against that reference. Individual natural-wood bowls vary; no exact-match or manufacturing claim was added.

Final delivery assets (WebP, quality 86):

- `public/media/products/alva/noorly-alva-studio.webp`: 1000 × 1000, 70,840 bytes.
- `public/media/products/alva/noorly-alva-editorial.webp`: 1200 × 800, 134,072 bytes.

### Studio prompt

Use case: precise-object-edit. Asset type: premium ecommerce product photograph for Noorly Alva decorative teak bowl. Input image 1 is the actual supplier bowl and is the edit target: preserve the exact asymmetrical wavy rim, overall silhouette, proportions, thick wooden walls, and characteristic caramel and dark-brown grain, including the light patch on the lower left. Improve only the photographic treatment and background. Replace the white background with a seamless warm honey-ochre studio surface and backdrop, soft natural side lighting from upper left, elegant long soft contact shadow. Photograph the complete empty bowl at the same elevated three-quarter angle, centered, occupying about 78% of a square frame with clean breathing room. Show rich honest tactile wood, crisp carved edges, premium Scandinavian design-store art direction, restrained warm contrast, no glossy plastic smoothing. Do not reshape the bowl or add hardware. No circular frame, no pedestal, no crop, no props, no fruit, no flowers, no sand, no candles, no flame, no text, no logo, no watermark. Square output.

### Editorial prompt

Use case: precise-object-edit. Asset type: landscape 3:2 editorial ecommerce image for Noorly Alva decorative teak bowl. Input image 1 is the actual supplier bowl, preserve its exact irregular scalloped rim, round organic silhouette, proportions, thick carved wooden walls, and the caramel-dark brown grain with the light patch toward the lower left. Place this SAME complete empty bowl on a pale warm stone console in a quiet modern Scandinavian home. Bowl is the unmistakable hero, large in center-right of frame, photographed from the reference's elevated three-quarter angle. Warm plaster wall behind, a soft folded ivory linen textile off to one side, slanting late-afternoon sunlight makes broad architectural shadows. Colour story honey, warm cream and muted terracotta. Art-directed home decor campaign, tactile real materials, calm and confident, editorial product photography. Keep the bowl empty. No candles or flame anywhere, no sand, no vessels inside bowl, no plants, no fruit, no extra bowl, no text, no logo, no watermark. Preserve product's shape rather than inventing a generic smooth dish.

## Guide-image follow-up

The owner liked the complete redesign but identified the how-it-works image as visually mismatched, especially on mobile. It was a 300% crop of the supplier pouch photo, with part of the packaging visible. Replace it with a dedicated, sharp 2:1 wax-granule material image in dusty rose and warm ivory, using the real sand photos as texture/colour references. Remove the enlargement, negative positioning and large arched corner. Preserve the guide's text, dimensions and surrounding layout; the image remains decorative for accessibility.

The built-in image-generation tool created `public/media/products/candle-sand/noorly-grain-waves.webp`, optimized to 1200 × 600. Inputs were local supplier photos `csand-08-0.webp` and `csand-07-0.webp`; the resulting material scene makes no new claim about packaging. The existing visual-review journey now captures this section at both desktop and mobile widths.

### Material-image prompt

Use case: photorealistic-natural. Asset type: decorative editorial macro photograph for Noorly candle-sand how-it-works section, landscape 2:1. The two attached images are references ONLY for the real tiny wax-granule texture and pale dusty-rose and warm-ivory colours. Create a new deliberately composed sharp photograph of those candle-sand wax granules arranged in broad flowing S-shaped dunes: pale dusty rose occupies the left and lower area, warm ivory and a subtle honey-cream area toward the right. A beautiful curved meeting line gives gentle movement. Fill the entire frame with the tactile granular material, no empty background. Show individual small round irregular wax beads clearly, with the same realistic fine scale as the reference material around the pouches; not ordinary beach sand, glitter, sugar crystals, cream or fabric. Soft directional daylight from upper left, subtle dimensional shadows following the waves, warm clean Scandinavian editorial product-photography feel. Broad gentle forms still legible on a small mobile screen, crisp texture across the scene and no excessive shallow-depth blur. No pouch, no packaging edges, no labels, no text, no logo, no props, no vessel, no hands, no flame, no wick. This must feel like a composed material photograph, never an enlarged crop of the reference product photos. Output wide landscape 2:1.

## Verification

Run TypeScript, lint, formatting, unit/component tests and the production CI build. Browser coverage includes the existing scroll-video and SVG-icon journeys in Chromium, Firefox and WebKit; desktop/mobile visual captures cover shop, all three product pages, About, FAQ, contact, shipping, empty/filled carts and the home material chapter. Accessible headings, overflow, exact variants, original supplier-photo navigation, cart quantity and checkout behavior remain covered. Review CI screenshots before merge, then confirm deployment and the live pages.
