# Noorly colour story — 31 October 2026

The owner asked for a more impressive, lively storefront, pointing to the Shopify redesign by Bluedge USA (Dribbble shot 27599940) and PHARMAX by Sujon Hossain (shot 27711935). Both exact references were inspected. The useful direction is bold colour fields, oversized product imagery and typography, and distinct visual chapters. Reference artwork and commercial claims are not reused.

## Storefront

The original scroll-controlled cinematic opening is retained. Following it, the homepage presents a colour studio, the three-product collection, an Alva material story, and a short candle-use guide. Rose, honey, mocha and ivory palettes come from Noorly's existing variants. Shopping, support, checkout, and policy routes remain intact.

The interactive studio updates the actual supplier photograph, colour, scent, exact matched variant price and product URL together. Four featured shades are explicitly presented as a starting selection, with a link to the complete range. Product routes accept `?colour=CSand-07` and match only a real product variant SKU; unknown or ambiguous values fall back safely. Prices, availability and merchandise IDs continue to come from commerce data. The query also works on the preview/mock route.

Shop has a honey-coloured introduction with real shade links. Catalogue cards use larger typography and capsule actions. Product pages use a responsive gallery tint based on the selected real variant and retain the existing gallery, stock handling, disclosures and purchase controls. Header and footer carry the new rose/cocoa palette.

## Constraints

- No autoplay, loop or play/pause/stop controls added to the opening video. Scroll scrubbing and automatic still fallback remain unchanged.
- New colour transitions are short and interaction-led; reduced-motion preferences disable them. No continuous floating or scroll-reveal content hiding.
- Actual supplier photographs only; no invented reviews, discounts, urgency, sustainability or medical claims.
- Alva is decorative. The material section and candle guide explicitly prohibit burning directly in wood and describe a noncombustible, heat-resistant candle vessel.
- No commerce configuration, price, stock, tracking, consent, supplier or advertising changes.

## Verification

Local TypeScript and unit/component checks include exact selected prices and image/link consistency, optional/invalid colour queries, query navigation, and actual Shopify merchandise identity. The browser journey covers keyboard choices at 390px, reduced motion, horizontal fit and the matching selected product page. CI retains the Chromium, Firefox and WebKit real-video scrubbing suite and saves desktop/mobile screenshots of the studio and supporting visual sections.

Local managed preview remains unavailable in this session; build, browser and screenshot verification runs in GitHub Actions. Final release evidence is the associated PR, its checks, Vercel commit status and live storefront inspection.

Canonical storefront: https://noorlynordic.com/sv. Repository: 1Alsaad/noorly-gifting. This design update does not supersede supplier or business decisions in the continuation handovers.
