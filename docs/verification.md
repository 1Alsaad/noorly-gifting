# Verification record — 18 October 2026

The Noorly rebrand was rechecked on the same date: formatting, lint, strict TypeScript, all 64 unit/component tests, all 10 Playwright tests, and the production preview build passed. Live Shopify/domain connection is deferred at the owner's request.

This records the delivered fictional preview foundation, not certification of live third-party services or a production accessibility audit.

| Check                                    | Result                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Prettier formatting                      | Passed                                                                                       |
| ESLint, zero warnings                    | Passed                                                                                       |
| Strict TypeScript                        | Passed                                                                                       |
| Vitest unit and component tests          | 64 passed across 13 files                                                                    |
| Playwright Chromium                      | 10 passed; final suite 28.8 seconds                                                          |
| Automated accessibility                  | No violations in the configured axe checks on home, shop, builder and cart                   |
| Next.js production preview build         | Passed with explicit mock opt-in and a dummy local signing key                               |
| Production runtime smoke                 | HTTP 200, nonce CSP, correct English document language, noindex and no JavaScript/CSP errors |
| Production dependency vulnerability scan | No known vulnerabilities reported                                                            |
| Dependency peer compatibility            | No peer dependency issues reported                                                           |
| Manual visual checks                     | Desktop 1440×1000 and mobile 390×844; no horizontal overflow or failed images                |

## Browser coverage

1. Home content, conventional shopping links and skipping the cinematic experience.
2. Keyboard product drawer, focus restoration, variant stock states and adding a candle.
3. Bidirectional scroll/media integration and configured hotspot visibility using a deterministic media fixture.
4. Product variants, quantity changes and explicitly marked mock checkout.
5. All six builder steps, refresh persistence, optional card, 280-character message, grouped cart, full bundle editing and checkout.
6. Consent rejection, customization, withdrawal and focus return.
7. Reduced-motion keyboard access to the complete shopping flow.
8. Automated accessibility checks on four important routes.
9. Server-rendered shop content with JavaScript disabled.
10. Default Swedish redirect and Swedish/English navigation preserving the route and document language.

Real final videos were intentionally not generated. The scroll test isolates seek/progress behavior from merchant media decoding; actual encoding, keyframes, mobile exports and bandwidth still need acceptance testing. Shopify, Redis, form delivery and analytics destinations require configured-service verification. Consult [the launch checklist](launch-checklist.md) before accepting real orders.

The local checks used Windows, Node 26.10.0 and pnpm 11.25.0. Committed CI uses Linux and Node 24. The workflow must pass on GitHub as a separate environment check; re-run after dependency or service configuration changes. Documentation, source assets and dummy test values contain no live merchant credentials.
