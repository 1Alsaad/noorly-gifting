# Shopify analytics transport

`shopify-analytics.js` is an analytics-only ESM bundle of the official MIT-licensed
`@shopify/hydrogen-react@2026.4.4`. The original license is retained alongside it.
No React components, credentials, external script loaders or consent defaults are added.

The two exported functions are `sendShopifyAnalytics` and `getClientBrowserParameters`.
It was generated in an isolated temporary install using `esbuild@0.25.12` with
`--bundle --platform=browser --format=esm --minify --legal-comments=none`.
The entry re-exports only those two functions from `@shopify/hydrogen-react`.
The unmodified generated JavaScript alone is excluded from lint/format; wrappers
and tests are not excluded. Regenerate and review upstream changes when upgrading.

Noorly's wrapper controls consent, sanitizes URLs and uses dedicated, consented,
Noorly-owned visitor/session identifiers. It does not mutate Shopify's cookies or
claim a Customer Privacy API or native-checkout session bridge. Native checkout
pixel/app installation is a separate merchant-authorized operation.
