# Noorly domain cleanup — 24 October 2026

The owner explicitly requested removal of old noorly.se and Erinra connections from Shopify, Vercel and the website, with **noorlynordic.com** used for the current brand. This checkpoint supersedes previous domain/setup status; dated research and original handovers remain historical records.

## Confirmed account changes

- Vercel project `noorly-gifting` retains `noorlynordic.com`, the `www.noorlynordic.com` redirect and its required `noorly-gifting.vercel.app` deployment alias. The old apex and www project assignments were removed.
- Unused team-level `noorly.se` and `erinra.eu` inventory entries were removed after explicit confirmation of Vercel's permanent-removal step. Neither had any connected projects or aliases. Old DNS settings were saved locally first. Domain registrations were not cancelled, and unrelated projects/domains were not changed.
- Shopify has only `checkout.noorlynordic.com` (primary, connected, TLS) and the internal `tzwngp-h1.myshopify.com` identifier. Old custom-domain connections were removed; do not replace the internal API host with the website address.
- Shopify store/sender contact now uses `support@noorlynordic.com`. Its generated Swedish privacy policy picked up the new email automatically. Its English translation uses the dynamic email variable. The four product bodies and their available Swedish/English translations, page body, menus, redirects and connector-visible webhooks contained no other retired-domain references.
- Free Squarespace forwarding for `support@noorlynordic.com` was saved to the owner's approved inbox. The received recipient-verification link succeeded and the pending status cleared. Squarespace states activation may take 24–48 hours. Incoming delivery, Shopify sender verification/domain authentication and sending customer-service replies still require confirmation before launch.

## Website changes

The sole permitted custom checkout origin is `https://checkout.noorlynordic.com`; tests reject retired Noorly/Erinra domains as well as insecure or deceptive URLs. Central support and customer-service email configuration now uses the verified forwarding alias. The footer renders the real support link. Current setup documentation and implementation-plan status use the new domain.

Retired domain names remain intentionally in negative security tests and dated evidence. They are not live destination configuration. Do not rewrite Git history or research evidence to erase the migration trail.

## Preserve closed gates

Production `NEXT_PUBLIC_SITE_URL=https://noorlynordic.com` was rebuilt in the previous cutover. HTTPS, the www redirect, `/api/health`, closed `/api/cart`, robots exclusion, private bundle access and invalid-form same-origin enforcement were checked on 24 October. Production uses Shopify plus native Upstash, with no mock fallback. Do not expose credentials in evidence.

Keep `NOORLY_STOREFRONT_OPEN=false` and `NEXT_PUBLIC_PRODUCT_TEST_MODE=true`. The 799 SEK Ljusstund bundle remains DRAFT, inventory zero, overselling denied and unpublished. Payout-bank entry is deferred by the owner. Supplier qualification, legal identity, taxes, product integration, checkout/payment/refund/fulfilment and analytics acceptance remain launch gates. Domain/email cleanup is not a sales-readiness claim.

This change's pull request records validation and deployment evidence. Full commercial requirements remain in the launch checklist and earlier supplier handovers.
