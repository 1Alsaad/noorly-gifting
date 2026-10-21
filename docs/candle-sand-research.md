# Candle sand catalogue and conversion changes

Reviewed 19 October 2026. This deployment is a demonstration, not a live offer. The existing 295 SEK signature-product demonstration price is retained for every candle-sand variant; it is not a currency conversion or a merchant-approved retail price. Availability in the mock provider is not supplier stock. Real prices, inventory and backend services must be configured before selling.

## Supplier facts and images

[AW Gifts range](https://www.awgifts.eu/candles/csand) and [unscented white / CSand-11](https://www.awgifts.eu/candles/csand/csand-11) distinguish ten scented options from unscented white. A retail unit is one 300 g pouch with four cotton wicks; the supplier's “3x” listing describes the wholesale pack, not three pouches in our product presentation. Approximate total burn time is 60 hours. Vessels are not included. Use only suitable, non-combustible, heat-resistant candle vessels, follow packaging instructions and add no oils or combustible decoration. Supplier styling photographs and the existing film are not safety instructions.

| SKU      | Colour          | Fragrance        |
| -------- | --------------- | ---------------- |
| CSand-01 | Mocha Brown     | Crimson Crystal  |
| CSand-02 | Latte Beige     | Pure Serenity    |
| CSand-03 | White           | Starlight Elixir |
| CSand-04 | Chocolate Brown | Millionaire Gold |
| CSand-05 | Warm Grey       | Azure Noir       |
| CSand-06 | Taupe Orange    | Cobalt           |
| CSand-07 | Dusty Rose      | Maison de Roses  |
| CSand-08 | Warm Honey      | Blush Bloom      |
| CSand-09 | Black           | Spirited         |
| CSand-10 | Cream           | Regent Polo      |
| CSand-11 | White           | Unscented        |

Each SKU page was inspected. Three photographs per variant show the pouch with granules, the packaging, and supplier styling. All 33 images were downloaded from the supplied supplier pages and compressed to WebP, without generating or altering product imagery. Exact source URLs are recorded in `candle-sand-image-sources.json`. Confirm commercial image permission with the supplier before launch. Swatch colours are illustrative screen approximations; photos are the reference.

## Research applied

- [Baymard: use thumbnails for additional images](https://baymard.com/research-articles/always-use-thumbnails-additional-images). Visible, labelled thumbnails expose all gallery views and allow direct selection on desktop and mobile. Full-size images open through ordinary links. Variant changes reset the gallery to the correct product photo.
- [Nielsen Norman Group: product-page UX](https://www.nngroup.com/articles/ecommerce-product-pages/). Provide understandable options, clear product contents and an obvious purchase action. Implemented named colour/scent controls, selected-option text, pouch size and included wicks, a clear vessel exclusion and persistent add-to-cart feedback with a link to the cart.
- [Baymard: shipping information on product pages](https://baymard.com/research-articles/show-shipping-costs-on-product-pages). Put delivery information beside the purchase decision. The current store has no confirmed delivery rates, so the UI explains this and links to shipping/returns instead of inventing delivery promises.
- [NN/G: mobile overlay usability](https://www.nngroup.com/articles/accidental-overlay-dismissal/). Reduce interference from overlays. During the mobile shopping hold, the video and purchase panel occupy separate layout rows, and `object-fit: contain` keeps the entire portrait frame visible. The explicit details dialog retains its close button, keyboard trap and focus restoration.

These are research-supported usability practices, not a promised conversion-rate increase. No invented reviews, scarcity, countdowns or discounts were added. Existing consent-gated variant, add-to-cart and checkout events support future measurement. Establish a mobile/desktop baseline for product-view → variant-selection → add-to-cart → checkout before a controlled experiment; do not treat demo traffic or failed backend mutations as purchasing behaviour.

## Verification

Component tests exercise all variant controls, photo changes, keyboard selection, correct cart IDs, Swedish labels and confirmation reset. Browser coverage checks matching cart imagery after refresh, gallery accessibility, no-JavaScript photo links, mobile media/panel separation, synchronous skipping and existing reduced-motion, Save-Data and failed-media fallbacks. All existing security and commerce checks remain required.
