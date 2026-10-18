# Content and seasonal releases

The temporary name, contact details, legal entity, address, typography and palette are centralized in `src/config/brand.ts`. Replace every placeholder before launch. `src/content/translations` contains Swedish and English interface dictionaries. Product stories and labels use `LocalizedText = Record<'sv' | 'en', string>`; avoid adding literal user-facing text inside components.

## Add a product or curated box

For local development, add a typed `Product` to `src/content/products.ts` with a stable handle, localized title and description, SEK money, descriptive images, inventory variants, category, season eligibility and box eligibility. Add its image under `public/media/products`. Prices and stock are fictional sample values.

For live commerce, create and publish the Shopify product, translations, images, variants and inventory. Add the category, season and eligibility tags described in `docs/commerce.md`. The provider maps Shopify identifiers into the same domain model. Content must reference product handles; never embed mock variant identifiers in seasonal scenes.

Curated gift boxes are individual commerce products. Add their `GiftBoxTemplate` entries in the seasonal content with included handles, optional products, selection limits, image and tags. Keep the actual Shopify product contents and fulfilment recipe aligned with this presentation. Templates describe the offering; the custom builder enforces its own data-driven selection rules in `src/features/box-builder/validation.ts`.

All ingredient lists, material claims, weights, safety information, delivery promises, reviews and legal copy must be supplied and reviewed before launch. No fictional reviews or unverified guarantees should be substituted for those placeholders.

## Add a season

1. Add a typed `Season` in `src/content/seasons`, including a unique id/slug, localized copy, dates, explicit active state, theme, SEO, media, scenes, featured handles and curated templates.
2. Add its desktop and mobile posters and videos in `public/media/<season>`. Follow `docs/cinematic-media.md`; the application does not generate final video assets.
3. Add scene configuration using `CinematicScene` and `Hotspot` from `src/features/seasonal-experience/types`. The content model re-exports those types.
4. Register the new season in a repository implementation and return it from `getSeasonBySlug` and `getSeasons`. Switch `getActiveSeason` intentionally after asset, translation and stock review. Dates are editorial metadata rather than an automatic scheduler.
5. Update product seasonal tags, collection handles, active season settings and navigation. Verify both languages, small screens, reduced motion and the conventional shop route.

Winter initially contains `winter-entrance` with no hotspot and `winter-candle-room` with a candle hotspot. Scene configuration lives in `src/features/seasonal-experience/winter-scenes.ts`. Seasonal content references those configurations rather than duplicating coordinates or media behavior in pages.

## Add a hotspot

Add a hotspot with a stable id, parent scene id, published product handle, start/end progress between zero and one, normalized desktop and mobile coordinates, localized accessible label, tooltip alignment, action and optional pulse/analytics metadata. Keep touch targets away from navigation, subtitles and skip controls. Verify the product exists in both languages and is available through the active provider. Test the window in both scrolling directions, keyboard focus, drawer closure/focus return and reduced-motion fallback product links.

## Replace local content with a CMS

`ContentRepository` isolates content access. Implement `getActiveSeason`, `getSeasonBySlug`, `getSeasons` and `getGiftBoxTemplates` against a CMS, validate remote values with Zod, map CMS fields to the existing domain types, and select the new adapter in `src/lib/content/index.ts`. Page components should continue consuming the interface. Commerce catalogue, prices, variants and inventory remain the commerce provider's responsibility.

Use stable content IDs and product handles as references, validate normalized coordinates/progress windows, require localized alt text and copy, version releases together with media, and keep draft CMS previews noindexed. Add cache tags and a verified revalidation webhook after a publishing workflow has been chosen. Never interpret CMS-provided copy as arbitrary HTML without a separate sanitization policy.
