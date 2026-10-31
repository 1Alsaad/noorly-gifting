# Noorly storefront refresh — 31 October 2026

The owner requested Safari video repair, a more conventional ecommerce layout inspired by Scandlights and MyObvi, less text, and removal of customer-facing AI wording. The owner explicitly clarified that the original scroll-controlled video must remain, with no play/pause/stop controls in either the main experience or its fallback.

## Implementation

- The homepage uses the original `CinematicExperience`, original desktop/mobile footage and scroll choreography. Scrolling moves the paused video forwards or backwards; it does not autoplay or loop. The temporary `StorefrontHero` and its player controls were removed.
- The media adapter retains requested scroll progress while metadata/data arrives, wakes pending seeks on readiness events and primes the opening frame with a tiny paused seek where needed. A decoded frame must exist before the poster disappears. Stalled loads/seeks or media errors fall back automatically to the responsive poster. Reduced motion and data-saving preferences use that poster without fetching video. No fallback asks the visitor to press Play.
- The ecommerce improvements remain: clear prices and full-width product buttons, shorter Swedish/English copy, product navigation, a compact use guide and expandable delivery/returns answers. The long homepage story/corporate sections and repeated trust copy remain removed.
- Customer-facing AI labels remain removed from inspiration captions and image alt text. These are described as inspiration/styling; they are not relabelled as actual product photographs. Product imagery and safety/use information remain.
- Product prices, stock, variants, bundle calculations, checkout, payment, consent, analytics and storefront access gates are unchanged by this correction.

## Evidence and verification

- Both original MP4 files were inspected: H.264 High, yuv420p, 24 fps, 15 seconds, no audio, `moov` before `mdat` (faststart). Desktop is 1920×1080 and mobile 1080×1920. The desktop endpoint serves `video/mp4` and HTTP 206 for byte-range requests.
- Focused regressions cover late metadata/data readiness, scroll direction changes and automatic fallback after a stalled load or seek.
- The Playwright suite exercises the actual desktop/mobile MP4 files with scroll input in Chromium, Firefox and WebKit, along with preferences, failed media, absent player controls and shopping navigation. WebKit automation is not a physical iPhone/macOS Safari device test.
- Local preview cannot start because the managed preview daemon is absent. Local Next builds fail in the host runtime with `uv_resident_set_memory` ENOENT. GitHub CI and Vercel commit statuses provide the build/release evidence; a local unit test result is not a production build result.
- Check the associated correction PR, its completed checks and the live domain before claiming release. This document records the intended implementation and verification scope.

## References and continuity

Design references: https://scandlights.se/ and https://myobvi.com/. Patterns used are concise shopping navigation, prominent product imagery/prices/actions and secondary details in disclosures. No competitor review counts, urgency, sales claims or guarantees were copied.

Video references: https://webkit.org/blog/6784/new-video-policies-for-ios/ and https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/. The restored video stays paused and responds to scrolling; browser media restrictions are handled with an automatic poster fallback.

Canonical storefront remains https://noorlynordic.com with checkout at https://checkout.noorlynordic.com. Supplier decisions and follow-ups remain in [handover v1.8](Noorly_Continuation_Handover_v1.8.md).
