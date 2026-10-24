# Noorly checkout branding

Updated 25 October 2026, Europe/Stockholm. The owner requested: **“change the checkout page design to not look like shopify.”** This checkpoint records the saved appearance changes to Shopify checkout. The [separate-products and payment launch](Noorly_Separate_Products_and_Payments_2026-10-25.md) remains the source for the live catalogue and purchase flow.

## Saved checkout configuration

The active Shopify checkout profile is **`14114619734`**. Changes were saved successfully in the checkout and accounts editor, and the saved UI confirmation was observed.

| Setting                         | Saved value                               |
| ------------------------------- | ----------------------------------------- |
| Logo                            | NOORLY wordmark, centred, **200 px** wide |
| Header and main background      | Ivory **`#F7F4EE`**                       |
| Order-summary background        | Paper **`#EFEAE1`**                       |
| Header accent                   | Ink **`#292C27`**                         |
| Global and order-summary accent | Burgundy **`#632F38`**                    |
| Primary button                  | Ink **`#292C27`**                         |
| Form inputs                     | Transparent background                    |
| Heading font                    | **Times New Roman**                       |
| Body font                       | **Arial**                                 |
| Checkout layout                 | Existing **one-page checkout** retained   |

The palette follows the actual storefront CSS in `src/styles/globals.css`. It deliberately uses those live values rather than the slightly different legacy colour values in `src/config/brand.ts`.

The editor's generic **Serif** choice was briefly selected, but it mapped to the unavailable **New York** font and rendered sans serif in the preview. **Libre Baskerville** was then selected, but live verification found that its font family appeared in CSS without a loaded font face, causing a sans-serif fallback. The available **Times New Roman** system-font choice was subsequently selected and saved. Final live verification confirmed visibly serif headings, and the mobile editor preview reported Times New Roman for the Contact heading. Do not restore either earlier choice without verifying its actual live rendering.

## Wordmark assets and provenance

The existing storefront identity is text **NOORLY**, regular serif, with **0.085em** letter spacing. No icon or tagline was added. Reusable files were created under `public/brand`:

- `noorly-wordmark-ink.svg`: outlined glyphs, **2,959 bytes**, transparent background, ink **`#292C27`**. It has no external font dependency.
- `noorly-wordmark-ink.png`: **1200 × 208 px**, RGBA, **22,620 bytes**. This supplies six pixels per displayed pixel at a 200 px checkout width.

The asset font is **Nimbus Roman Regular**, the installed font resolver's Times New Roman/Liberation Serif fallback. Georgia, Times New Roman and Liberation Serif font binaries were unavailable in the creation environment. The SVG description records the actual font and spacing; do not describe this outlined asset as Georgia. The checkout's editable headings separately use the **Times New Roman** selection.

The PNG was visually inspected. Its visible ink bounds are `(15, 15)` to `(1185, 193)`, with small transparent margins and no clipping. All four corner pixels are transparent. The PNG was uploaded through the Shopify connector as MediaImage **`67221359919446`** and selected in the active checkout profile:

[Saved Shopify wordmark](https://cdn.shopify.com/s/files/1/1073/5317/8454/files/noorly-wordmark-ink.png?v=1792884937)

## Plan and scope

The store was observed on **Shopify Advanced**, not Shopify Plus. Shopify's [checkout customization comparison](https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations) makes the standard logo, colour and font editor available on Basic and higher plans. Checkout Branding API access and eligible app extensions on the information, shipping and payment pages require Plus. This change uses the available standard editor; the checkout remains Shopify-hosted at `checkout.noorlynordic.com`.

No payment-provider, payout-bank, product, price or inventory changes were made as part of this branding task. The existing one-page purchase flow and open-sales configuration were retained. No payment or paid order was submitted. No application logic was changed.

## Verification status

- **Editor save:** confirmed on the active checkout profile.
- **Asset output:** visually inspected; outlined SVG and transparent high-resolution PNG verified.
- **Live desktop checkout:** reached the actual Swedish `/sv` checkout. The centred NOORLY wordmark loaded correctly; cream and paper backgrounds, burgundy accents, visibly serif Times New Roman headings and Arial body text were present. The charcoal **Betala nu** button had computed background `rgb(41, 44, 39)`, matching `#292C27`.
- **Cart identity and total:** the live checkout correctly showed **Gammalrosa · Maison de Roses**, quantity **1**, at **249 SEK**, with a **249 SEK** total.
- **No submitted purchase:** all email, name, street, postcode and card fields remained blank. No buyer data, payment or order was submitted.
- **Desktop screenshot:** captured and verified nonempty as `noorly-checkout-redesign-desktop-2026-10-25.jpg` in the conversation workspace at `/workspace/scratch/dad0a5b154bc/noorly-checkout-redesign-desktop-2026-10-25.jpg`.
- **Mobile editor preview:** verified at **360 px** wide. The centred 200 px logo and form fields fit without visible horizontal overflow, and the final Contact heading computed to Times New Roman. This was the editor's simulated mobile preview, not a physical-device or live mobile-viewport checkout test.
- **Test-cart cleanup:** returned to the main storefront cart, waited for hydration, removed the one test line and confirmed both **Din påse (0)** and the empty-cart heading.

The editor uses a simulated checkout, so the live desktop evidence and editor-only mobile evidence are recorded separately. See Shopify's [checkout editor documentation](https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/checkout-editor). These checks establish the saved branding and its live desktop presentation; they do not claim an authorised charge or order-fulfilment test.
