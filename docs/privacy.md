# Privacy implementation and legal review

Current state: [handover v1.6](project-handover/Noorly_Continuation_Handover_v1.6.md) supersedes historical no-marketing/no-replay statements below. Consent key is `noorly-consent-v3`; positive older permissions are not reused. Clarity requires explicit Analytics consent and strict masking. Native checkout Meta Maximum uses its own consent gate. The site's privacy/cookie content describes both providers; withdrawal is not retroactive deletion.

The privacy, cookie and terms pages are **draft placeholders**. They require the operating company's legal identity, actual providers, retention periods, contact details and qualified review before launch. This implementation is a technical foundation; it is not a compliance certification.

Swedish default copy and English copy are centralized. The consent layer follows the practical design principles described by [PTS cookie guidance](https://www.pts.se/internet-och-telefoni/kakor-cookies/) and [IMY consent guidance](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/rattslig-grund/samtycke/): an explicit choice and an accessible means of changing that choice. Verify the current guidance and the actual deployment with legal counsel.

## Storage inventory

| Storage                                   | Purpose                                             | Before optional consent?         | Lifetime                                     |
| ----------------------------------------- | --------------------------------------------------- | -------------------------------- | -------------------------------------------- |
| Signed HTTP-only cart cookie              | Cart identity/state                                 | Yes, necessary shopping function | Defined in commerce adapter                  |
| Local builder progress                    | User-requested gift-box configuration               | Yes, necessary shopping function | Until cleared/completed by browser flow      |
| `stilla-consent-v1` localStorage          | Versioned necessary/analytics/marketing preferences | Yes, records the user's choice   | Re-prompt after 180 days                     |
| `stilla-analytics-session` sessionStorage | Random anonymous per-tab analytics ID               | No                               | Browser tab session; cleared on withdrawal   |
| `stilla-attribution-v1` sessionStorage    | First/last consented campaign touch                 | No                               | Browser tab session; cleared on withdrawal   |
| GA4 cookies, if configured                | Optional analytics                                  | No                               | Configure actual GA4 retention before launch |
| Redis rate-limit keys                     | Abuse prevention, hashed network identifier         | Necessary security               | One rate-limit window                        |
| Redis form idempotency keys               | Prevent duplicate form delivery                     | Necessary form submission        | 24 hours after completion                    |
| Redis purchase outbox                     | Retry minimal consented paid-order analytics        | Requires consent at checkout     | Until successful delivery; monitor backlog   |
| Redis purchase dedupe keys                | Prevent replayed payment events                     | Requires consent at checkout     | 180 days                                     |

The code never stores email, contact name, addresses or gift-message content in analytics. Contact information exists only in the form submission forwarded to the configured delivery adapter. No submission content is logged. A local development mock acknowledges a form without storing or delivering it and returns `mock: true`; production without delivery configuration returns 503.

## Consent behavior

Necessary storage works regardless of optional preferences. Reject and accept are equally prominent in the first layer. Customization uses a labelled Radix dialog with focus trapping/restoration. The footer cookie settings action reopens it. Storage corruption or expiry means no analytics consent. No marketing integration exists; selecting marketing only records a preference for future integration.

No GA4 script, PostHog request, analytics ID or attribution storage is created before analytics consent. Consent revocation disables dispatch, marks GA4 disabled, removes its script, requests denied analytics storage, deletes known first-party GA cookies and clears session/attribution storage. A downloaded third-party script cannot be unloaded from JavaScript memory; collection remains gated by the application and GA consent/disable flags. No replay/autocapture or person profiles are enabled.

If storage is blocked, normal browsing works and analytics remains disabled. Script blockers and analytics errors cannot block shopping. No optional data is backfilled from the period before consent.

## Checkout and downstream responsibilities

The client passes current analytics consent plus the random session UUID as Shopify cart attributes immediately before hosted checkout. A paid webhook sends analytics only for `granted` plus a valid UUID. Test orders and mock commerce never create purchase events. The consent snapshot reflects the preference at hand-off to checkout. Shopify checkout's own tracking, consent interface, processors and retention are separately administered in Shopify and must be reviewed.

Withdrawal stops subsequent browser tracking. Already sent events and pending historical order snapshots require the operator's data-subject workflow; implement downstream deletion/suppression and consent synchronization before any requirement to revoke those historic snapshots. Do not promise retroactive deletion via the cookie button.

Before launch, document actual processors, international transfers, data-processing agreements, retention, access/deletion requests, contact-form legal basis, marketing subscription proof and double opt-in. Disable optional provider configuration until the relevant review is complete.
