# Noorly Ljusstund: planned storefront presentation

The first-launch homepage, shop, winter collection and cinematic links now lead to the planned Noorly Ljusstund gift set. The exact handle matches Shopify draft product `11395078259030`, variant `56006367281494`:

`noorly-ljusstund-presentset-med-glasskal-och-tva-dofter`

The proposed contents are an ELYSIA glass bowl, sealed The Candledust Nordic Lights and Dark Honey refills (350 g each), the supplier's included wicks, Noorly gift packaging and a Swedish instruction/care card. The planned price is 799 SEK including delivery within Sweden. The copy makes no fixed wick-count, burn-time, bowl-safety, stock or dispatch-date claims.

## Presentation only

`src/content/launch-bundle.ts` contains planning copy, not a commerce catalogue. Its presentation object has no Shopify merchandise IDs or variants and cannot be bought. The exact-handle product route renders `PlannedBundleDetails` before any commerce lookup. It deliberately has no add-to-cart controls or structured-data offer, including when `NEXT_PUBLIC_PRODUCT_TEST_MODE=false`.

Do not mistake this route for a live Shopify integration. The product remains a draft outside this code change. The homepage, shop and collection do not query Shopify for this planning presentation. The older mock catalogue, direct legacy product pages and builder implementation remain available for development checks, but are absent from first-launch shopping navigation. No legacy AW Gifts product or photograph has been relabelled as The Candledust.

No approved photographs of the complete bundle are available. Product presentation uses a text placeholder. The retained cinematic design is explicitly labelled as a concept film that does not depict the planned set. Replace this media with accurate approved imagery before advertising the actual bundle.

## Before accepting orders

- Confirm supplier quotes, bowl compatibility, sample/packing fit, final packaging and fulfilment costs, availability, delivery terms, and approved product photographs.
- Complete merchant details, policies, payment/payout setup and a test order.
- Configure the Shopify Storefront token and permissions, durable rate limiting, final site URL and domain/TLS; verify the new product/variant and Swedish shipping through the real API.
- Replace this deliberately non-purchasable presentation with an explicit real-product integration. Resolve the current inventory check and selling-plan requirements for the chosen presale model; do not bypass inventory validation globally or invent stock.
- Keep `NOORLY_STOREFRONT_OPEN=false` during preparation. `NEXT_PUBLIC_PRODUCT_TEST_MODE` remains `true` in the deployment template. Opening sales requires a separate reviewed release and a rebuild when public environment variables change.

This change does not modify production environment values, store gates, Shopify product publication, inventory, payments or shipping configuration.
