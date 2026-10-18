# Cinematic media and seasonal scenes

The winter experience is an enhancement over server-rendered editorial content. It ships with static placeholder artwork and intentionally missing video files. No final video has been generated. The complete shop, product links, drawer, and gift builder work without video. The first scene contains no hotspot.

## Runtime behavior

`CinematicExperience` accepts `locale`, `products`, and optional `scenes`. Default scene configuration is in `src/features/seasonal-experience/winter-scenes.ts`; the content repository can supply another season's scenes. Every visible string lives in that configuration or `copy.ts`.

- Each successfully loaded video enables a 230svh section with a sticky viewport. Normalized scroll progress seeks the video in either direction through the replaceable `MediaScrubber` interface.
- Intersection observers load metadata only when the scene is current or within 200px. Scroll listeners and animation work exist only while the scene intersects the viewport. Animation frames run while scroll progress is changing and stop after interpolation settles.
- The first poster loads eagerly with high fetch priority. Later posters use native lazy loading. Art-directed mobile `<picture>` sources avoid downloading a desktop poster for mobile screens.
- Videos have no audible playback and use `muted`, `playsInline`, and `preload="metadata"`. They never autoplay. Failed media keeps the poster and conventional product controls; it removes the failing video.
- Reduced motion, Save-Data, and slow 2G connections suppress video sources altogether. Static scenes occupy one viewport each. No JavaScript still renders the editorial images and conventional product/shop/builder links.
- Drawers freeze seeking, trap focus, close on Escape, restore the opener without scrolling, and retain the document position. Hidden hotspots are removed from the accessibility tree. Hotspots are HTML buttons with 48px touch areas.
- Ambient audio is absent. Add a visible, accessible opt-in sound control before introducing any audio; provide a meaningful text alternative.

## Replace the media

Place independently composed desktop and mobile exports under `public/media/winter/`:

| Scene           | Desktop                           | Mobile                           |
| --------------- | --------------------------------- | -------------------------------- |
| Entrance video  | `entrance-desktop.mp4`            | `entrance-mobile.mp4`            |
| Entrance poster | `entrance-poster-desktop.webp`    | `entrance-poster-mobile.webp`    |
| Interior video  | `candle-room-desktop.mp4`         | `candle-room-mobile.mp4`         |
| Interior poster | `candle-room-poster-desktop.webp` | `candle-room-poster-mobile.webp` |

The entrance is approximately eight seconds: cold Nordic exterior through an already-open doorway into a warm sanctuary. Keep the camera calm and linear. The candle-room scene reserves the configured hotspot area for the candle. Do not embed text, prices, labels, logos, or controls in any media. Compose mobile separately rather than cropping a desktop master.

Recommended starting budgets: 1600×900 desktop, 720×1280 mobile, 24fps, silent H.264 MP4, 8–12 second scenes, desktop video under 5MB and mobile under 2.5MB. Posters should be under 180KB desktop and 100KB mobile. Test actual results on a mid-range phone. Reduce motion/detail/resolution before exceeding the budget.

Use frequent keyframes (every 6–12 frames) and no or few B-frames for responsive arbitrary seeking. Export with the MP4 metadata at the front of the file (`faststart`). These settings trade compression efficiency for scrub latency; tune on real devices. MP4 H.264 is the baseline. To add optional WebM, extend the media model with a typed source list, keep MP4 fallback, and verify seeking in Safari/Chrome/Firefox before launch.

Serve through a CDN supporting byte-range requests and the correct `video/mp4` MIME type. Version filenames or their parent path when replacing assets, then update the scene configuration. Use a year-long immutable cache only for versioned media; unversioned placeholders should use revalidation. Avoid forcing every scene video into a route preload or service worker precache.

## Add a season or hotspot

1. Create a typed `CinematicScene[]` content module and register it with the seasonal content repository.
2. Supply localized names and copy plus separate mobile/desktop posters and videos.
3. Pass its scenes to `<CinematicExperience locale={locale} products={products} scenes={season.scenes} />`.
4. Add a hotspot with unique ID, scene ID, product handle, inclusive progress interval, normalized desktop/mobile coordinates, localized label, alignment, and optional pulse/analytics metadata. The initial candle interval is `0.2`–`0.85` to provide a comfortable interaction window.
5. Keep hotspot coordinates fixed while displayed. Use source composition and scene timing to make the object stable; do not attempt to identify objects from video pixels.
6. Verify keyboard focus, contrast, touch hit areas, reverse scrolling, final-frame retention, reduced motion, slow connections, and unavailable media. Keep a product card/link available in the static experience.

`MediaScrubber` currently wraps `HTMLVideoElement`. A future image sequence, canvas, stream, or renderer only needs `setProgress(number)` and `destroy()`; adapt readiness and visibility in `use-scene-media.ts` without changing product drawers or hotspot content.

## Performance and analytics verification

Target CLS ≤0.1, LCP ≤2.5 seconds, INP ≤200ms on representative production connections. The first poster should paint before any video frame; no video is needed for initial rendering. Reserve the viewport before images load. Measure production bundles, field Core Web Vitals, and real scroll seeking, including slower iPhones, before enabling final videos.

The consent-gated analytics API records loaded/started/skipped, scene entered/completed, progress quarters, hotspot impressions/clicks, and drawer open/close. Stable keys deduplicate milestones and impressions across reverse scrolling. No gift messages or customer contact data are emitted. Unit/component tests cover progress boundaries, backward seeking, inactive hotspot semantics, keyboard opening, dialog focus restoration, variant selection, stock restrictions, and commerce failure recovery.
