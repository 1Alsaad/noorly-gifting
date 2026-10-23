# Noorly setup status

The storefront brand remains **Noorly**, displayed as **NOORLY**. The owner reports purchasing **noorlynordic.com** through Squarespace. The intended canonical origin is **https://noorlynordic.com** and the intended Shopify checkout is **https://checkout.noorlynordic.com**. Code configuration does not establish domain connection or HTTPS.

The [23 October domain and integration checkpoint](project-handover/Noorly_Nordic_Domain_and_Integration_2026-10-23.md) records the current state and supersedes earlier setup notes. Production Shopify catalogue reads and Redis rate limiting were verified on the existing Vercel alias. The planned bundle remains a draft; ordering and paid presales remain closed.

## Prepared in the repository

- Central brand identity, Swedish/English copy and package identity use Noorly. The domain change does not rename the brand.
- `.env.production.example` uses the intended final domain without credentials. Change the actual Production origin only after DNS and HTTPS verification, then rebuild; public environment variables are embedded at build time.
- Local development and the hosted Preview environment retain mock settings. Production uses Shopify and never falls back to mock commerce.
- The Shopify adapter accepts the exact new HTTPS checkout origin alongside existing legitimate hosts. DNS, TLS and Shopify primary-domain configuration remain separate account work.
- The first-launch pages present the planned Ljusstund bundle without purchase controls; see [launch-bundle-preview.md](launch-bundle-preview.md).

## Preserve closed launch gates

Keep `NOORLY_STOREFRONT_OPEN=false` and `NEXT_PUBLIC_PRODUCT_TEST_MODE=true` during domain and supplier preparation. `DEPLOYMENT_ENV=production` is already configured for the live backend; it does not open or index the storefront by itself. Do not publish fictional samples or the draft bundle as an inventory commitment.

Shopify Headless supplies a public Storefront token to the server adapter via `SHOPIFY_STOREFRONT_ACCESS_TOKEN`; its private token uses a different authentication header and must not be substituted. Vercel's native Upstash integration supplies a matched `KV_REST_API_URL` and `KV_REST_API_TOKEN` pair. Credentials stay in hosting secrets, never in chat or Git.

## Domain and support setup

Connect `noorlynordic.com` and the `www.noorlynordic.com` redirect to the existing Vercel project using its exact project-specific records. Connect `checkout.noorlynordic.com` through Shopify's domain setup. Preserve existing email records. Verify public DNS, HTTPS and redirects before updating Production `NEXT_PUBLIC_SITE_URL=https://noorlynordic.com`; rebuild and check closure and same-origin behavior afterward.

The support email remains an explicit placeholder in `src/config/brand.ts`. Domain ownership and editing a contact string do not create a mailbox. Confirm a working address before replacing the placeholder or opening sales.

## Remaining operational setup

Finalize the supplier-backed product, inventory/presale policy, shipping, taxes, payment/payout setup, legal identity, contact details and consumer policies. Replace the planned presentation with a reviewed real-product integration only when the launch requirements are met. Verify the full order and fulfilment flow; successful empty-catalogue reads are not checkout validation.

When the final domain and webhook secrets are ready, the intended endpoints are:

- Paid-order webhook: `https://noorlynordic.com/api/webhooks/shopify`
- Authenticated outbox worker: `POST https://noorlynordic.com/api/webhooks/drain`

Neither endpoint is configured by this documentation change. Follow [deployment.md](deployment.md) for secrets, scheduling and acceptance checks. Complete form delivery, webhook/outbox validation, consent and the relevant [launch checklist](launch-checklist.md) before releasing sales or advertising.
