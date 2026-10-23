# Commerce and checkout

## Run without credentials

The fictional catalogue has ten products, three curated boxes, one winter collection and one unavailable candle variant. It lives in `src/content/products.ts`. `NEXT_PUBLIC_COMMERCE_PROVIDER=mock` selects the mock adapter; development needs no external credentials. It never collects payment or creates an order. `/sv/mock-checkout` and `/en/mock-checkout` clearly identify the demonstration.

`getCommerceProvider()` is server-only. Each request gets an adapter implementing `CommerceProvider`. UI code receives domain products and calls the same cart API for both adapters. Money uses major currency units; arithmetic rounds to integer öre before adding.

The mock cart is persisted in an HMAC-SHA256 signed, httpOnly, SameSite=Lax cookie with a seven-day expiry. The cookie contains variant IDs, quantities, attributes and stable line IDs; prices are always reconstructed from the catalogue. Tampered and expired cookies are discarded. Its state survives server restarts and multiple workers. The size is bounded to 3,800 bytes; very large carts are rejected with `CART_STORAGE_LIMIT`. This development storage is intentionally limited. Multiple tabs editing the same mock cart use the most recent response; use Shopify for production cart concurrency.

Production requires a random `CART_COOKIE_SECRET` of at least 32 characters. A fixed development key is used only outside production. Explicit `ALLOW_MOCK_COMMERCE=true` is required for a production-mode demonstration; there is no fallback from a failed Shopify configuration. A durable rate-limit store is also required for production mutations.

For the durable store, configure `RATE_LIMIT_PROVIDER_URL` and `RATE_LIMIT_PROVIDER_TOKEN` together. When both are blank or unset, the native Vercel integration's matched `KV_REST_API_URL` and `KV_REST_API_TOKEN` pair is accepted instead. Any partial explicit override is rejected rather than combined with or replaced by the fallback pair. Production requires HTTPS for the selected REST endpoint. `KV_URL`, `REDIS_URL` and the read-only REST token are not substitutes. Missing configuration and provider failures still prevent production mutations; there is no production in-memory fallback. Keep production database credentials scoped to Production.

## Connect Shopify

1. Create a Shopify store and install/configure its Headless sales channel or a Storefront API integration. Publish the launch products and winter collection to that storefront.
2. Set `NEXT_PUBLIC_COMMERCE_PROVIDER=shopify`, `SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_STOREFRONT_API_VERSION=2026-07`, and `CART_COOKIE_SECRET`. These variables stay on the server. No Admin API token is used.
3. Grant the Storefront permissions needed to read products, collections, translations, inventory availability and carts/checkouts. The availability query reads `ProductVariant.quantityAvailable`; verify inventory read access in your integration.
4. Configure Swedish and English translations, Sweden as the initial market, and SEK pricing. Other currencies are rejected rather than mislabeled as SEK. Use real Shopify variants and inventory; mock IDs must never be copied into Shopify.
5. Keep the initial handles `winter-evening`, `quiet-morning`, `new-home`, `winter-candle`, `forest-tea`, `dark-chocolate`, `linen-napkin`, `greeting-card`, `small-box`, `large-box`, or update their content and builder references together.
6. Tag products with `category:box`, `category:signature`, `category:extra`, `category:card` or `category:packaging`; add `season:winter` and `box-eligible` where appropriate. `productType` is a category fallback. Add additional `season:` tags as the range expands.
7. Configure taxes, shipping, returns, inventory locations, payment methods and merchant details inside Shopify. Verify a complete test purchase using Shopify's test payment facilities before taking live payments.

The adapter sends real paginated product/collection queries, separate language contexts, cart creation/read/add/update/remove/attribute mutations, and inventory queries. It validates response shape, currency, checkout host, GraphQL errors and HTTP failures. A ten-second timeout produces a safe error. Mutations are not automatically retried, avoiding accidental duplicate additions. Catalogue and cart requests currently use `no-store` to prioritize fresh stock; add a tagged catalogue cache and product-update invalidation when traffic requires it.

Shopify cart IDs may contain private keys. The full reference stays in a signed httpOnly cookie. The browser receives a one-way hashed public cart identifier and no checkout URL until an explicit checkout action.

## Cart API

`GET /api/cart` returns `{ cart: Cart | null }`. `POST /api/cart` accepts JSON with an `action` discriminator (`type` is an equivalent client convention):

```json
{
  "action": "add",
  "lines": [{ "merchandiseId": "variant-id", "quantity": 1, "attributes": [] }]
}
```

Other actions are `update` with `lineId` and `quantity`, `remove` with `lineIds`, `attributes` with an attribute array, `replace_bundle` with `bundleId` and replacement `lines`, and `checkout` with `locale` and optional consent `attributes`. All mutations validate origin, content type, request size, rate limits, strict schemas, quantity limits, known attributes, stock and bundle rules. There are at most 24 cart lines, 30 total units and 10 units per line. An individual add accepts at most seven lines.

Bundle lines share `bundle_id`, `bundle_role` and `box_size`. `gift_message` is plain text, limited to 280 characters, normalized and stripped of control characters and markup. The message belongs to the packaging line. No gift message is sent to analytics. Changing one bundle member's quantity changes the whole box. Removing one member removes the complete box.

The builder enforces one packaging product, one signature, two extras in a small box, two or three extras in a large box, and at most one card. Extras must be distinct, seasonal, eligible and available. The server independently validates the complete group. Editing a box creates a new provider cart with retained lines and the validated replacement. The existing cookie changes only after the whole replacement succeeds, preserving the original cart if an operation fails.

Before checkout, the server revalidates availability and writes locale plus consent attributes. Missing consent explicitly clears any previous analytics grant. `_stilla_analytics_consent` is `granted` or `denied`; `_stilla_analytics_session` is an anonymous consent-gated UUID or an empty string. Existing cart and gift attributes are preserved. The browser records `begin_checkout` and redirects to the returned Shopify HTTPS checkout URL; no card fields exist in this application.

These are grouping attributes, not a Shopify bundle pricing or fulfilment engine. Each selected component remains an independently stocked, independently priced line. Curated boxes are separate Shopify products. Confirm fulfilment processes recognize attributes, configure any required bundle inventory integration, and test gift-message delivery before launch. Add Shopify checkout validation rules if external storefronts can mutate these same carts.

## Verified order webhooks

Configure Shopify's `orders/paid` webhook to `https://your-domain/api/webhooks/shopify`, set `SHOPIFY_WEBHOOK_SECRET`, and provision the durable Redis-compatible REST store. HMAC is checked against the raw bytes before parsing; idempotency and the purchase outbox prevent duplicate delivery. Only paid, non-test orders with explicit analytics consent and an anonymous session are eligible for purchase analytics. Configure the outbox delivery endpoint and scheduler as described in `docs/analytics.md` and `docs/deployment.md`. Never infer a purchase from a browser thank-you page.

Before launch, verify invalid signatures, retries, duplicate event IDs, payment states, consent denial, and order attribute propagation in a real test store. The credentials, catalogue permissions and hosted payment flow require merchant verification and are not exercised by local mock tests.

## Official references

- [Storefront API cart creation and update](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage)
- [Product query](https://shopify.dev/docs/api/storefront/latest/queries/product)
- [Storefront localization context](https://shopify.dev/docs/api/storefront/2026-04)
