# Cinematic media and seasonal scenes

The winter experience enhances server-rendered editorial content with one continuous 15-second film. Desktop and mobile use separately composed supplied exports. Local posters, product links, the product drawer, catalogue, cart, and gift builder remain available without film playback.

## Reviewed footage and scroll timing

The supplied films were downloaded and inspected at half-second intervals before choosing the choreography. Both enter through an open doorway, travel towards a candle and pouch on a table, orbit that arrangement, and settle into a shopping composition. They replace the previous two independent eight-second scenes; replaying the complete journey twice would break continuity.

| Scroll progress | Film time   | Behavior                                                                                                              |
| --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| 0–20%           | 0–3s        | Doorway and approach. Opening title clears by 14%; the matching first frame dissolves over 0.5–8.5%.                  |
| 15–29%          | 2.25–4.35s  | Brief localized narrative beat as the camera enters.                                                                  |
| 20–67%          | 3–10s       | Product orbit. Copy and shopping controls leave the filmed arrangement clear.                                         |
| 67–100%         | 10–14.96s   | Camera settles into the filmed hold. The localized shopping card appears after a decoded frame reaches this interval. |
| After 100%      | Final frame | The collection panel rises over the stationary final image.                                                           |

The pin reserves 600svh before metadata arrives: five viewports of travel map linearly through 15 seconds, approximately three seconds per viewport. Native document scrolling remains authoritative. No wheel or touch interception is used.

## Supplied exports

| Variant | Permanent CDN media ID               | Dimensions | Bytes      | Duration |
| ------- | ------------------------------------ | ---------- | ---------- | -------- |
| Desktop | 46439a25-f450-49f4-b8b1-785e0d1bc834 | 1920×1080  | 16,830,719 | 15s      |
| Mobile  | 0e98a61d-fd67-4fee-8c28-793ca27c6fce | 1080×1920  | 14,664,740 | 15s      |

Both are silent H.264 High / yuv420p at 24fps with eight-frame keyframe intervals and MP4 metadata before media data (faststart). CDN responses were verified as HTTP 206 with byte ranges and video/mp4. The original URLs are used unchanged; no new footage, re-encoding, or generated artwork is included.

SHA-256:

- Desktop: bd0654f536cf9a843409486816174210ba6435623db79b7ecc99892ba26e387e
- Mobile: 581a965b2024952fc621edbd9736c71ddcc90cd214e361a3fc0213b86631d3ae

Only media-src permits the exact d2ol7oe51mr4n9.cloudfront.net hostname. No other CSP directive is widened. CSS cover fills the viewport using the proper landscape or portrait composition. The opening artwork has been replaced with decoded frame zero from each supplied film, so first paint matches the video rather than switching from a different environment.

The responsive first-frame files are `entrance-first-frame-desktop.webp` (1920 × 1080, 84,894 bytes) and `entrance-first-frame-mobile.webp` (1080 × 1920, 41,296 bytes). They were extracted from the existing supplied MP4s with FFmpeg (`-frames:v 1 -c:v libwebp -quality 85`), without generating imagery or re-encoding either video. The same frames remain available when playback is disabled or fails.

These exports exceed the earlier starting budgets (5MB desktop / 2.5MB mobile). Nearby loading, frequent keyframes, and Save-Data suppression help, but do not remove bandwidth or device decoding costs. Verify target phones and connections before launch. The CDN remains an external dependency.

## Runtime and accessibility

- Video sources load only near the viewport after motion/network preferences are checked. Reduced motion, Save-Data, slow-2g/2g, missing IntersectionObserver, and no JavaScript retain static editorial content and conventional shopping links. Video errors restore the poster and product controls and release the reserved range.
- Videos remain muted, playsInline, paused, and decorative. There is no autoplay, audio, or embedded commerce UI in the files.
- Time-based exponential damping uses a 100ms time constant, independent of refresh rate. Reversals retarget immediately without overshoot. Animation stops after settling; long frame gaps discard catch-up. Geometry is read once following a scroll/resize event.
- MediaScrubber coalesces seeks to the latest target and gives decoded frames a paint opportunity. Decoder performance and the 24fps source limit frame cadence; no intermediate frames are synthesized.
- The shopping overlay waits for decoded progress rather than just the requested seek target. Its product, selected variant, localized SEK price, stock, pending, success, and retryable error states come from existing commerce data and CartProvider. It submits quantity one through the existing /api/cart flow. The supplied film is editorial imagery, not evidence of real stock or product specifications.
- Hidden shopping controls are inert and absent from the accessibility tree. A focused card remains available during reverse scrolling until focus leaves. Product details use the existing focus-trapped drawer, Escape dismissal, opener restoration, and frozen seek behavior. A keyboard-focused control reveals its pinned stage if the collection covers it.
- Opening, shopping-card Explore, and Skip anchors synchronously flush the enhancement off before native #gifts navigation measures its target. Late metadata cannot expand the range again during that visit. The static product page link remains usable without JavaScript.
- The card occupies the lower left on desktop and the upper portion on portrait screens to leave the candle visible during the hold. Constrained-height screens can scroll the card internally.
- The initial frame uses eager loading and high fetch priority; picture selects the appropriate mobile frame. The native video poster uses the same selected frame while decoding starts, avoiding a blank media surface during loading.

## Content and replacement

CinematicExperience accepts locale, products, and optional scenes. Default configuration is in src/features/seasonal-experience/winter-scenes.ts; the seasonal content repository can supply another configuration. Visible copy lives there or in copy.ts.

Each CinematicScene supports localized editorial copy, separate desktop/mobile media, optional narrative/closing copy, optional shopping { productHandle, visibleFrom }, and optional positioned hotspots. The winter film has no floating hotspot: its product moves during the orbit, so commerce appears as a stable card during the hold. The generic HotspotButton still supports localized labels, inclusive progress intervals, fixed responsive coordinates, 48px touch targets, drawers, and direct-add actions for future scenes.

For replacements, use versioned permanent URLs or files under public/media/winter. Keep separate portrait composition, silent H.264, frequent keyframes, faststart, byte ranges, and the correct MIME type. Inspect actual footage before changing intervals. Preserve local posters and remove unused CDN CSP permissions when self-hosting.

## Verification

Unit/component coverage checks geometry, refresh-rate-independent damping, reversal/settling, copy timing, source selection, decoded-seek coalescing, generic hotspot semantics, drawer focus, localized shopping variants, stock restrictions, error/retry, and focus retention. Browser coverage checks continuous story phases, cart mutation and header quantity, reverse hiding, collection handoff, synchronous anchors with delayed metadata, failed-media/static controls, Save-Data, no-JavaScript, reduced motion, accessibility, catalogue, and builder behavior.

Real-media acceptance should inspect desktop and mobile approach/orbit/hold frames, actual forward/reverse decoding, pause/mute state, responsive source changes, focus restoration, and add-to-cart responses. Automated accessibility scans supplement manual keyboard and device checks.
