# Noorly setup status

The storefront brand remains **Noorly**, displayed as **NOORLY**. The canonical origin is **https://noorlynordic.com** and Shopify's connected primary checkout domain is **https://checkout.noorlynordic.com**. Squarespace manages registration and DNS; the apex and `www` redirect have verified Vercel HTTPS.

The [24 October domain cleanup checkpoint](project-handover/Noorly_Domain_Cleanup_2026-10-24.md) supersedes earlier setup notes. Production Shopify catalogue reads and Redis rate limiting were verified, including the new production origin after cutover. The planned bundle remains a draft; ordering and paid presales remain closed.

## Prepared in the repository

- Central brand identity, Swedish/English copy and package identity use Noorly. The domain change does not rename the brand.
- `.env.production.example` and actual Production `NEXT_PUBLIC_SITE_URL` use the final domain. Public environment variables are embedded at build time; origin changes require a rebuild.
- Local development and the hosted Preview environment retain mock settings. Production uses Shopify and never falls back to mock commerce.
- The Shopify adapter accepts only the exact new custom HTTPS checkout origin alongside Shopify's legitimate hosts. Retired custom checkout hosts are rejected, with regression coverage.
- The first-launch pages present the planned Ljusstund bundle without purchase controls; see [launch-bundle-preview.md](launch-bundle-preview.md).

## Preserve closed launch gates

Keep `NOORLY_STOREFRONT_OPEN=false` and `NEXT_PUBLIC_PRODUCT_TEST_MODE=true` during domain and supplier preparation. `DEPLOYMENT_ENV=production` is already configured for the live backend; it does not open or index the storefront by itself. Do not publish fictional samples or the draft bundle as an inventory commitment.

Shopify Headless supplies a public Storefront token to the server adapter via `SHOPIFY_STOREFRONT_ACCESS_TOKEN`; its private token uses a different authentication header and must not be substituted. Vercel's native Upstash integration supplies a matched `KV_REST_API_URL` and `KV_REST_API_TOKEN` pair. Credentials stay in hosting secrets, never in chat or Git.

## Domain and support setup

`noorlynordic.com` serves the existing Vercel project; `www.noorlynordic.com` redirects to it. `checkout.noorlynordic.com` is primary in Shopify. The internal `tzwngp-h1.myshopify.com` API identifier and Vercel deployment alias remain necessary provider settings. Preserve the new email and website DNS records when making future changes.

`support@noorlynordic.com` has a free Squarespace forwarding rule to the owner's approved inbox, and the recipient verification completed on 24 October. It is used in central website configuration and Shopify's store/sender contact fields. Squarespace allows 24–48 hours for activation; recipient verification alone does not prove message delivery. Finish Shopify sender verification/domain authentication and verify incoming delivery before opening sales. Forwarding does not provide a mailbox for sending replies as the support address.

## Remaining operational setup

Finalize the supplier-backed product, inventory/presale policy, shipping, taxes, payment/payout setup, legal identity, contact details and consumer policies. Replace the planned presentation with a reviewed real-product integration only when the launch requirements are met. Verify the full order and fulfilment flow; successful empty-catalogue reads are not checkout validation.

When the final domain and webhook secrets are ready, the intended endpoints are:

- Paid-order webhook: `https://noorlynordic.com/api/webhooks/shopify`
- Authenticated outbox worker: `POST https://noorlynordic.com/api/webhooks/drain`

Neither endpoint is configured by this documentation change. Follow [deployment.md](deployment.md) for secrets, scheduling and acceptance checks. Complete form delivery, webhook/outbox validation, consent and the relevant [launch checklist](launch-checklist.md) before releasing sales or advertising.
