# Noorly storefront refresh — 31 October 2026

The owner requested Safari video repair, a more conventional ecommerce layout inspired by Scandlights and MyObvi, less text, and removal of customer-facing AI wording.

## Implementation

- The homepage now uses `StorefrontHero`: the original desktop/mobile footage plays as a compact, muted inline video. It no longer depends on scroll seeking, pinned sections, hotspot timing or multi-screen story progression.
- A visible play/pause button supports browsers that reject autoplay. Reduced motion and data-saving preferences start with a poster and allow manual playback. Hidden/offscreen video pauses; user pause is respected. A failed media load preserves the poster, retry control and shopping link.
- Products follow the hero immediately, with clear prices and full-width product buttons. Shorter Swedish/English copy, product-based navigation, a compact use guide and expandable delivery/returns answers replace the long homepage story/corporate sections and repeated trust copy.
- Customer-facing AI labels were removed from inspiration captions and image alt text. These remain described as inspiration/styling; they are not relabelled as actual product photographs. Product imagery and safety/use information remain.
- No product prices, stock, variants, bundle calculations, checkout, payment, consent, analytics or storefront access gates were changed.

## Evidence and verification

- Both original MP4 files were downloaded and inspected: H.264 High, yuv420p, 24 fps, 15 seconds, no audio, `moov` before `mdat` (faststart). Desktop is 1920×1080 and mobile 1080×1920. The desktop endpoint serves `video/mp4` and HTTP 206 for byte-range requests.
- All 340 unit/component tests passed locally, including new media fallback and preference tests. TypeScript and lint checks are part of the release checks.
- A focused Playwright suite covers actual desktop/mobile MP4 playback, play/pause, offscreen pause, autoplay denial, preferences, failed media and layout in Chromium, Firefox and WebKit. CI installs all three engines. WebKit automation is not a physical iPhone/macOS Safari device test.
- Local preview could not start because the managed preview daemon is absent. Local Next builds failed in the host runtime with `uv_resident_set_memory` ENOENT. Use the GitHub CI and Vercel commit statuses as the build/release evidence; do not infer a passing build from the local test suite.
- This document describes the implementation, not a production deployment confirmation. Check the associated PR, its checks and the live domain before claiming release.

## References and continuity

Design references: https://scandlights.se/ and https://myobvi.com/. Patterns used are concise shopping navigation, a short hero, prominent product imagery/prices/actions, and secondary details in disclosures. No competitor review counts, urgency, sales claims or guarantees were copied.

Video references: https://webkit.org/blog/6784/new-video-policies-for-ios/ and https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/. Autoplay depends on browser/user preferences; manual playback is the fallback, not a guarantee of autoplay under every setting.

Canonical storefront remains https://noorlynordic.com with checkout at https://checkout.noorlynordic.com. Supplier decisions and follow-ups remain in [handover v1.8](Noorly_Continuation_Handover_v1.8.md).
