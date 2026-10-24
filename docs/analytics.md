# Analytics contract

All browser tracking uses `trackEvent({ name, properties }, optionalDedupeKey)` from `src/lib/analytics/client.ts`. `src/lib/analytics/schema.ts` is the typed taxonomy and Zod allowlist. Unknown properties are discarded; invalid allowed values cause the event to be dropped. All browser events require current analytics consent. No event is buffered or backfilled before consent. Provider errors are isolated from shopping.

Common optional properties: `anonymous_session_id`, `locale`, `currency`, `season_id`, `scene_id`, `hotspot_id`, `product_id`, `product_handle`, `variant_id`, `quantity`, `value`, `cart_id`, `bundle_id`, `source`, `device_category`, `reduced_motion`, `first_touch`, `last_touch`. Never supply emails, names, addresses, checkout URLs, provider secret cart keys, gift-message content, card information or free-form customer text. Use an opaque cart identity when needed, not a provider cart URL containing an access key. Prices use decimal major currency units.

## Event taxonomy

Client = browser, Server = verified webhook and durable worker. All listed events require analytics consent; privacy events obey that rule too. Necessary consent preferences are stored locally without recording an analytics event. An initial banner view before consent intentionally produces no analytics request.

| Event                          | Trigger                                                           | Specific properties                                          | Origin      | Dedupe strategy                                                             |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------- |
| `page_viewed`                  | Consented route is rendered                                       | `path`, `locale` (no query string)                           | Client      | One per path per mounted browser lifetime                                   |
| `navigation_clicked`           | User chooses a navigation destination                             | `source`, `path`                                             | Client      | One explicit user action                                                    |
| `cinematic_experience_loaded`  | Current experience becomes ready                                  | `season_id`, `reduced_motion`                                | Client      | Experience ID                                                               |
| `cinematic_experience_started` | First actual scroll progression                                   | `season_id`                                                  | Client      | Experience ID                                                               |
| `cinematic_experience_skipped` | User activates skip                                               | `season_id`, `source`                                        | Client      | Experience skip action                                                      |
| `cinematic_scene_entered`      | Scene enters active range                                         | `scene_id`, `season_id`                                      | Client      | Scene ID                                                                    |
| `cinematic_scene_completed`    | Scene reaches final progress                                      | `scene_id`                                                   | Client      | Scene ID                                                                    |
| `cinematic_progress_milestone` | First crossing of configured milestone                            | `scene_id`, `progress`, `milestone`                          | Client      | Scene ID + milestone                                                        |
| `hotspot_impression`           | Hotspot first becomes visible                                     | `hotspot_id`, `scene_id`, `product_handle`                   | Client      | Scene + hotspot ID                                                          |
| `hotspot_clicked`              | Hotspot button is selected                                        | `hotspot_id`, `scene_id`                                     | Client      | One deliberate activation                                                   |
| `product_drawer_opened`        | Product drawer opens                                              | `product_handle`, `source`                                   | Client      | One opening                                                                 |
| `product_drawer_closed`        | Product drawer closes                                             | `product_handle`, `source`                                   | Client      | One closing                                                                 |
| `product_list_viewed`          | Catalogue is rendered                                             | `collection_handle`, `item_count`                            | Client      | List + route                                                                |
| `product_viewed`               | Product detail is rendered                                        | `product_handle`, `product_id`, `value`                      | Client      | Product + route                                                             |
| `product_variant_selected`     | Variant changes                                                   | `product_id`, `variant_id`                                   | Client      | One selection                                                               |
| `add_to_cart`                  | Server confirms cart addition                                     | `product_id`, `variant_id`, `quantity`, `value`, `bundle_id` | Client      | One confirmed mutation                                                      |
| `remove_from_cart`             | Server confirms removal                                           | `product_id`, `quantity`, `bundle_id`                        | Client      | One confirmed mutation                                                      |
| `cart_viewed`                  | Cart route is rendered                                            | `value`, `item_count`                                        | Client      | Cart view                                                                   |
| `cart_updated`                 | Quantity/attributes mutation succeeds                             | `quantity`, `value`, `source`                                | Client      | One confirmed mutation                                                      |
| `begin_checkout`               | Availability verified and hosted redirect is ready                | `currency`, `value`                                          | Client      | In-flight request lock, then one redirect                                   |
| `purchase`                     | Verified paid order is durably queued and worker sends            | `transaction_id`, `currency`, `value`, consented session     | Server only | Hashed shop/order/paid identity, atomic Redis enqueue, provider identifiers |
| `checkout_error`               | Checkout could not begin                                          | `error_code`                                                 | Client      | One failed attempt; no raw error text                                       |
| `box_builder_started`          | User begins configuring                                           | `season_id`                                                  | Client      | Builder session                                                             |
| `box_size_selected`            | Box base is chosen                                                | `box_size`, `product_handle`                                 | Client      | One selection                                                               |
| `product_added_to_box`         | Eligible item selected                                            | `product_handle`, `quantity`                                 | Client      | One deliberate selection                                                    |
| `product_removed_from_box`     | Selected item removed                                             | `product_handle`, `quantity`                                 | Client      | One deliberate removal                                                      |
| `gift_message_added`           | Nonempty optional message is saved                                | `bundle_id` only; never text                                 | Client      | One transition from empty to nonempty                                       |
| `box_builder_validation_error` | Review validation fails                                           | `error_code`                                                 | Client      | One failed review action                                                    |
| `box_builder_completed`        | Bundle cart mutation succeeds                                     | `bundle_id`, `value`, `item_count`                           | Client      | Confirmed bundle ID                                                         |
| `newsletter_signup`            | Form endpoint confirms real or clearly mock acceptance            | `source`                                                     | Client      | Submission token                                                            |
| `corporate_gifting_enquiry`    | Form endpoint confirms acceptance                                 | `source`                                                     | Client      | Submission token; no enquiry fields                                         |
| `seasonal_collection_viewed`   | Seasonal story route renders                                      | `season_id`, `collection_handle`                             | Client      | Collection + route                                                          |
| `discount_code_applied`        | Provider confirms discount (extension point)                      | `source`, `value`                                            | Client      | Confirmed mutation; do not send entered code                                |
| `consent_banner_viewed`        | Settings shown to a currently consented visitor (extension point) | `locale`                                                     | Client      | Preference opening                                                          |
| `consent_updated`              | Preference saved while analytics is allowed                       | `analytics`, `marketing`, `locale`                           | Client      | One saved choice; rejects produce no tracking                               |

All names are implemented in the central schema. Events corresponding to future integrations, such as discount application, remain ready extension points rather than simulated provider success.

## Provider setup

GA4 browser adapter: set `NEXT_PUBLIC_GA4_MEASUREMENT_ID`. The tag is injected only after analytics consent, automatic page views are disabled, Google signals and ad personalization are disabled, and the internal schema is dispatched to the [documented gtag queue](https://developers.google.com/tag-platform/devguides/datalayer). Ad storage/user data/personalization remain denied. Disable enhanced measurement features that would collect events outside this explicit taxonomy in the GA4 data-stream settings; review the actual provider privacy settings before enabling it. There is no marketing tag.

PostHog browser adapter: set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (e.g. EU ingestion host). It posts explicitly allowlisted events to the ingestion capture endpoint without the full SDK, autocapture, replay, identification or person profiles. The nonce CSP connect allowlist derives the configured host. Event API reference: [PostHog API](https://posthog.com/docs/api).

Debug output runs only in development and after analytics consent. It prints the sanitized event payload, never input form content. With all optional variables empty, no analytics provider is contacted.

First- and last-touch UTM source/medium/campaign plus referrer **origin only** are captured only after consent. Values use a constrained character and length allowlist; query strings and referrer paths are not sent. Attribution lasts for the consented browser-tab session and is removed on withdrawal. This is intentionally a session attribution model, not cross-device identity. Never embed user identifiers in campaign names.

## Meta Pixel connection (Noorly)

The existing Meta dataset ID is `511816900240916`. Its former account-side
name, `UY Scuti Media Pixel`, should be renamed to
`Noorly – Website Pixel` in Meta Events Manager; changing that label does not
change the ID. The Meta connector currently does not offer a dataset-rename
operation, so renaming must be confirmed separately in Meta.

The production Vercel variable `NEXT_PUBLIC_META_PIXEL_ID` configures this
ID. A deployment/rebuild is required after changing a `NEXT_PUBLIC_*`
variable. The existing Meta adapter in `src/lib/analytics/meta.ts` loads
`fbevents.js` only after **marketing consent**, never automatically on page load.
It disables Meta automatic configuration/matching and does not send customer
email, form contents or gift messages. No `noscript` tracking image is used.
With consent it emits PageView on locale path changes, ViewContent on genuine
product details, and InitiateCheckout **only after a valid hosted Shopify
redirect is returned**. It never generates a browser Purchase. Purchase/CAPI
requires a separate, consent-aware verified paid-order integration, secure Meta
access token, deduplication and Events Manager acceptance tests; the preexisting
analytics outbox does not itself send Meta CAPI events.

The public storefront remains **closed**. The analytics provider is intentionally
not mounted for admin previews, so there should be **no live Meta events**
until a publicly accessible consented storefront exists. Do not turn on
presales or ads to create a test event. Later verify with Meta Events Manager
Test Events and a consenting browser, including no requests on reject or
withdrawal, the correct pixel ID, a single PageView per navigation, and
conversion event prices in SEK.

### Meta Conversions API paid-order preparation

The Shopify checkout client now also forwards `_noorly_meta_consent`,
`_noorly_meta_fbp`, and `_noorly_meta_fbc` with the order attributes.
These are separate from analytics consent and are denied/cleared on checkout
when absent. They are never collected without the visitor's prior marketing
consent, and no customer name, email or IP address is copied to Meta.

The verified `orders/paid` webhook now independently considers analytics
and marketing consent. On a genuine non-test, paid order, it may enqueue an
event whose marketing identifiers are eligible for server-side Meta delivery.
The outbox can send the event using server-only
`META_CAPI_ACCESS_TOKEN` and `META_CAPI_API_VERSION` when both are configured,
and the existing `NEXT_PUBLIC_META_PIXEL_ID`. The API access token is always
sent via Authorization header, not client JavaScript or a query-string URL.
The Meta payload uses one stable hashed order event ID, event_time, SEK
transaction value and only the consented first-party `_fbp`/`_fbc` identifiers.
No browser Purchase is generated, so there is no competing browser purchase
to deduplicate; failed server delivery is retried through the existing
outbox with provider checkpoints.

**Not live or verified:** Shopify's `orders/paid` webhook subscription has not
been configured, `SHOPIFY_WEBHOOK_SECRET` is not present in Vercel Production,
and the server's CAPI token/API version/worker have not been configured or
verified through Meta Test Events. The zero-stock draft product and private
storefront prevent real paid orders. Shopify checkout must actually preserve
the custom attributes; this requires an end-to-end dry run. No claim of live
purchase attribution or legal sign-off follows from the committed code.

## Server purchase and retries

Use Shopify's `orders/paid` subscription. Browser thank-you navigation cannot emit a `purchase`: `trackEvent` explicitly rejects it. Mock and Shopify test orders are ignored. The current consent and anonymous UUID must be passed as `_stilla_analytics_consent` and `_stilla_analytics_session` cart attributes before hosted checkout using `getAnalyticsCheckoutAttributes()`.

Configure Redis REST variables and `OUTBOX_CRON_SECRET`, then schedule `POST /api/webhooks/drain` with the bearer secret every minute. The receiver validates raw HMAC, domain, topic and paid status, strips customer data, and atomically persists an outbox item plus dedupe marker. It acknowledges 200 only after that commit. A 503 asks Shopify to retry. Worker errors preserve pending records, with provider-specific progress checkpoints. See `docs/security.md` for at-least-once guarantees and operational requirements.

Server GA4 uses `GA4_API_SECRET` plus the public measurement ID with Measurement Protocol and a stable transaction ID. Validate payloads with GA4's debug endpoint before launch; 2xx alone is not event validation. Server PostHog uses the capture endpoint plus stable `$insert_id`. An optional `ANALYTICS_DELIVERY_URL`/`ANALYTICS_DELIVERY_TOKEN` relay receives the envelope with `Idempotency-Key`; the receiver must deduplicate. If no provider is configured, records remain pending. Monitor and alert on backlog age and failed delivery. Document the actual retention/deletion policy.

## Validation examples

```ts
trackEvent({
  name: "add_to_cart",
  properties: {
    product_handle: "winter-candle",
    quantity: 1,
    currency: "SEK",
    value: 295,
  },
});

trackEvent(
  {
    name: "hotspot_impression",
    properties: {
      scene_id: "winter-stillness",
      hotspot_id: "winter-candle",
      progress: 0.4,
    },
  },
  "winter-stillness:winter-candle:impression",
);

// Strips email from runtime input; callers must still never supply PII.
analyticsEventSchema.parse({
  name: "page_viewed",
  properties: { locale: "sv", email: "private@example.com" },
});
// => { name: 'page_viewed', properties: { locale: 'sv' } }
```

Tests cover event validation, PII stripping, no dispatch/identifiers before consent, once-only milestone deduplication, withdrawal, browser purchase rejection, valid/invalid HMAC, paid status, consent gating, webhook replay and durable enqueue failure/retry.
