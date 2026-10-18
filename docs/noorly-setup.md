# Noorly setup status

The chosen storefront brand is **Noorly**, displayed as **NOORLY**, with intended canonical origin **https://noorly.se**. This configures application metadata; it does not register the domain, change DNS or establish a live Shopify connection.

On 18 October 2026, the owner chose to manage Shopify and domain connection later. The delivered storefront therefore remains in mock mode; the following steps are retained for that future setup.

## Prepared in the repository

- Central brand identity, Swedish/English copy, winter SEO copy and package identity use Noorly.
- `.env.production.example` defines the intended domain, Swedish default, SEK commerce adapter and production service fields without credentials.
- Local development remains an explicit mock store. Existing internal cookie/storage identifiers are retained so the branding change does not discard local carts or consent choices.
- The server-only Shopify adapter, hosted checkout, verified `orders/paid` endpoint, durable purchase outbox, rate limits and form-delivery interfaces are implemented.
- Keep `DEPLOYMENT_ENV=preview` until the real integrations, approved catalogue, company details and legal content are verified. Production Shopify mode never falls back to mock commerce.

## Account details still needed

1. Shopify store's actual `shop-name.myshopify.com` address and access to its Headless channel.
2. Confirmation of ownership of `noorly.se` and access to the registrar/DNS provider.
3. Access to the hosting account, a Redis REST service, and the chosen contact/newsletter delivery destination.

Shopify and Vercel connectors were reported as administratively disabled in this session. No merchant credentials or hosting login were available. GitHub access does not grant access to these services. Put API credentials in an ignored local environment file or the hosting provider's secret settings, not in chat or Git commits.

## Shopify connection

Create or select the official Headless storefront in Shopify. Supply its **public Storefront access token** in `SHOPIFY_STOREFRONT_ACCESS_TOKEN`; the existing adapter sends the `X-Shopify-Storefront-Access-Token` header. The Headless channel's private token uses a different authentication header and should not be substituted into this field.

Publish the reviewed products and winter collection to the storefront, configure Swedish/English translations and the Sweden/SEK market, then apply the handles and tags in [commerce.md](commerce.md). Do not publish fictional sample products as a real inventory commitment. Confirm actual prices, stock, shipping, tax, payments and fulfilment in the merchant account.

After the host and signing secret are configured, register:

- Paid-order webhook: `https://noorly.se/api/webhooks/shopify`
- Authenticated outbox worker: `POST https://noorly.se/api/webhooks/drain`

Schedule the worker using the secret-bearing POST request in [deployment.md](deployment.md). A browser checkout return never creates a purchase analytics event.

## Hosting and DNS

Import the existing GitHub repository as a Next.js project and supply the real environment values from `.env.production.example`. Provision the durable rate-limit/outbox store and form receiver before testing mutations in production mode. Without these services, browsing may work while mutations fail safely.

Add `noorly.se` to the hosting project and choose the intended `www.noorly.se` redirect. Use the **exact project-specific DNS records provided by the host**. No A, CNAME or TXT target can be finalized before that project exists. Preserve existing MX and email-verification records. DNS for the main site should serve the Next.js frontend; Shopify supplies the hosted checkout destination.

The current support email remains an explicit placeholder until a real support mailbox is configured in `src/config/brand.ts`. Setting a domain or editing the contact string does not create an email account.

## Completion evidence

Run the full local checks, then verify the actual hosted site: HTTPS, domain verification, bilingual product data, stock, persistent cart, custom boxes, gift attributes, Shopify test checkout, webhook signatures/retries, outbox delivery, form delivery and consent. See [launch-checklist.md](launch-checklist.md). Switch `DEPLOYMENT_ENV=production` only when those checks and content/legal review are complete.

Official setup references: [Shopify Headless channel](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/manage-headless-channels) and [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
