# Cinematic media and seasonal scenes

The winter experience is an enhancement over server-rendered editorial content. The entrance and candle-room scenes use completed Noorly Higgsfield videos, optimized for bidirectional seeking and served from Higgsfield’s media CDN. Existing local desktop/mobile posters remain the first paint and static fallback. The complete shop, product links, drawer, and gift builder work without video. The first scene contains no hotspot.

## Runtime behavior

`CinematicExperience` accepts `locale`, `products`, and optional `scenes`. Default scene configuration is in `src/features/seasonal-experience/winter-scenes.ts`; the content repository can supply another season's scenes. Every visible string lives in that configuration or `copy.ts`.

- Motion-capable visits reserve 400svh per scene as soon as the client checks preferences, giving each eight-second clip three viewports of scroll travel. Metadata arriving later does not expand the scene or change its progress geometry. Failed media and skip/explore links release the reserved range; static visits retain one viewport per scene.
- Intersection observers load video only when the scene is current or within one viewport. Nearby videos use `preload="auto"` so small exports can buffer before seeking; this remains a browser hint, especially on mobile. Scroll listeners exist only while a ready scene intersects the viewport. Geometry is read once per animation frame following a scroll/resize event, rather than during every interpolated frame.
- Scroll progress uses time-based exponential damping with a 100ms time constant. Wheel notches and uneven touch input get intermediate video positions, with the same response at 60Hz and 120Hz. Direction reversals retarget immediately without overshoot. The short settling animation stops within a subframe tolerance; a suspended tab/long frame gap snaps to the current position. Native scrolling and anchors are never intercepted. Hotspots and analytics follow the same eased progress as the video, and drawer opening, skip/explore, failure, or loss of visibility cancels the animation.
- The `MediaScrubber` retains only the latest eased target while decoding, then gives the completed frame a paint opportunity before the next seek. This avoids replaying obsolete targets on fast direction changes. The supplied 24fps videos and the device decoder still limit the displayed frame cadence; this does not synthesize intermediate frames.
- Intersecting scenes hold their camera at the viewport while the next scene dissolves over the outgoing final frame. The incoming scene becomes opaque before the preceding section leaves view. After the final clip, the collection's normal-flow ivory panel rises over the held frame. Scroll positions, document height, and native anchor navigation remain authoritative; no wheel/touch events are intercepted.
- `sceneChoreography` clears the opening title and actions as the camera moves, reveals a short localized narrative beat, then introduces the closing collection link. The same eased progress drives video, text, the subtle progress rule, and existing hotspot intervals. Keyboard focus reveals faded introduction links and brings an incoming/offscreen scene into view. Skip stays in the same position throughout the dissolve; hidden closing controls are inert.
- The first poster loads eagerly with high fetch priority. Later posters use native lazy loading. Art-directed mobile `<picture>` sources avoid downloading a desktop poster for mobile screens.
- Videos have no audible playback and use `muted` and `playsInline`. They never autoplay. The separate local picture remains the poster/fallback layer; the video element has no redundant `poster` attribute, which could otherwise remain visible at time zero and flash during a dissolve. The entrance poster clears over the first 0.5–8.5% of scroll progress once a frame is available; subsequent scene posters clear after loading a frame. Failed media keeps the poster and conventional product controls; it removes the failing video.
- Reduced motion, Save-Data, slow 2G connections, and browsers without IntersectionObserver suppress video sources altogether. Static scenes occupy one viewport each. No JavaScript still renders the editorial images and conventional product/shop/builder links.
- Drawers freeze seeking, trap focus, close on Escape, restore the opener without scrolling, and retain the document position. Hidden hotspots are removed from the accessibility tree. Hotspots are HTML buttons with 48px touch areas.
- Ambient audio is absent. Add a visible, accessible opt-in sound control before introducing any audio; provide a meaningful text alternative.

## Integrated Noorly videos

- Entrance: “The Threshold”, Higgsfield job `bd60d44b-ae30-4037-a389-6ead3321ca16`.
- Candle room: “A Moment of Stillness”, Higgsfield job `2212557d-0646-402f-bc21-08a862a2bb46`.
- Both exports: 1280×720, 24fps, 8.042 seconds, H.264, yuv420p, no audio, keyframe interval 8, no B-frames, MP4 faststart. Entrance is approximately 1.5MB; candle room approximately 1.8MB.
- Confirmed upload IDs: `58984439-9e2b-4cf7-8c93-1bf92b4ea876` (entrance) and `be114901-8392-4460-af09-29eb6fea0d89` (candle room). Scene configuration uses their permanent CDN URLs, never the expiring upload URLs or Higgsfield share pages.
- Only `media-src` allows the exact CDN hostname. Images, scripts, frames and API connections retain their existing policy.
- The supplied masters are landscape. Both viewport configurations currently use the same export with the existing CSS cover treatment; mobile is not a separately composed portrait video. Keep the mobile posters and verify cropping on target devices before replacing these with independently composed portrait exports.
- Visual inspection of the confirmed exports shows an interior doorway revealing a wooden candle bowl, followed by close-ups of its wax/flames and a pullback. The snowy-cabin and furnished-room posters are existing editorial artwork, not matching video frames. The deliberate poster dissolve and scene overlap accommodate this difference. A continuous architectural camera journey like the supplied style references requires matching, art-directed footage; UI choreography alone cannot create those missing shots. The reference films are not included as storefront media, and no new media was generated.
- Skip/explore links disable the scene enhancement synchronously before native anchor navigation, so late metadata cannot expand a scene and move the gifts section out of view. The story remains static for the rest of that page visit.
- The existing hotspot interval/coordinates, drawer behavior, reduced motion, Save-Data/2G suppression and error fallback are preserved. No autoplay or audio is introduced.
- The CDN is an external runtime dependency. If an export is removed or unavailable, the existing error handler removes the video and restores the local poster and conventional product controls. To self-host, download these confirmed exports into the paths below and replace the scene URLs; remove the CDN permission when no longer used.

Reproduce each optimized export from its original downloaded MP4:

```sh
ffmpeg -i source.mp4 -an -c:v libx264 -preset fast -crf 22 -g 8 -keyint_min 8 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart output.mp4
```

## Replace the media

Place independently composed desktop and mobile exports under `public/media/winter/`:

| Scene           | Desktop                           | Mobile                           |
| --------------- | --------------------------------- | -------------------------------- |
| Entrance video  | `entrance-desktop.mp4`            | `entrance-mobile.mp4`            |
| Entrance poster | `entrance-poster-desktop.webp`    | `entrance-poster-mobile.webp`    |
| Interior video  | `candle-room-desktop.mp4`         | `candle-room-mobile.mp4`         |
| Interior poster | `candle-room-poster-desktop.webp` | `candle-room-poster-mobile.webp` |

For future art-directed replacement footage, compose an approximately eight-second entrance from a cold Nordic exterior through an already-open doorway into a warm sanctuary. Keep the camera calm and linear. The candle-room scene reserves the configured hotspot area for the candle. Do not embed text, prices, labels, logos, or controls in any media. Compose mobile separately rather than cropping a desktop master.

Recommended starting budgets: 1600×900 desktop, 720×1280 mobile, 24fps, silent H.264 MP4, 8–12 second scenes, desktop video under 5MB and mobile under 2.5MB. Posters should be under 180KB desktop and 100KB mobile. Test actual results on a mid-range phone. Reduce motion/detail/resolution before exceeding the budget.

Use frequent keyframes (every 6–12 frames) and no or few B-frames for responsive arbitrary seeking. Export with the MP4 metadata at the front of the file (`faststart`). These settings trade compression efficiency for scrub latency; tune on real devices. MP4 H.264 is the baseline. To add optional WebM, extend the media model with a typed source list, keep MP4 fallback, and verify seeking in Safari/Chrome/Firefox before launch.

Serve through a CDN supporting byte-range requests and the correct `video/mp4` MIME type. Version filenames or their parent path when replacing assets, then update the scene configuration. Use a year-long immutable cache only for versioned media; unversioned placeholders should use revalidation. Avoid forcing every scene video into a route preload or service worker precache.

## Add a season or hotspot

1. Create a typed `CinematicScene[]` content module and register it with the seasonal content repository.
2. Supply localized names and copy plus separate mobile/desktop posters and videos. Optional `copy.beat` and `copy.closing` provide the narrative beat and final collection invitation; ordinary scene titles/descriptions remain available in static mode.
3. Pass its scenes to `<CinematicExperience locale={locale} products={products} scenes={season.scenes} />`.
4. Add a hotspot with unique ID, scene ID, product handle, inclusive progress interval, normalized desktop/mobile coordinates, localized label, alignment, and optional pulse/analytics metadata. The initial candle interval is `0.2`–`0.85` to provide a comfortable interaction window.
5. Keep hotspot coordinates fixed while displayed. Use source composition and scene timing to make the object stable; do not attempt to identify objects from video pixels.
6. Verify keyboard focus, contrast, touch hit areas, reverse scrolling, final-frame retention, reduced motion, slow connections, and unavailable media. Keep a product card/link available in the static experience.

`MediaScrubber` currently wraps `HTMLVideoElement`. A future image sequence, canvas, stream, or renderer only needs `setProgress(number)` and `destroy()`; adapt readiness and visibility in `use-scene-media.ts` without changing product drawers or hotspot content.

## Performance and analytics verification

Target CLS ≤0.1, LCP ≤2.5 seconds, INP ≤200ms on representative production connections. The first poster should paint before any video frame; no video is needed for initial rendering. Reserve the viewport before images load. Measure production bundles, field Core Web Vitals, and real scroll seeking, including slower iPhones, before enabling final videos.

The consent-gated analytics API records loaded/started/skipped, scene entered/completed, progress quarters, hotspot impressions/clicks, and drawer open/close. Stable keys deduplicate milestones and impressions across reverse scrolling. No gift messages or customer contact data are emitted. Unit/component tests cover progress boundaries, refresh-rate independence, copy timing, overlapping scene presentation, backward seeking, inactive hotspot semantics, keyboard opening, dialog focus restoration, variant selection, stock restrictions, and commerce failure recovery. Browser coverage verifies the dissolve, focus-revealed links, collection handoff, closing anchor navigation, and the no-JavaScript home/catalogue.
