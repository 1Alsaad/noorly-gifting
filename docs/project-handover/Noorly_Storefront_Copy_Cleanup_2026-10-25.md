# Noorly storefront copy cleanup

**Later owner correction:** restore the original desktop/mobile video while keeping the “Stämningsfilm” label removed. The restoration is in [PR #32](https://github.com/1Alsaad/noorly-gifting/pull/32). The subsequent [pricing and bundle checkpoint](Noorly_Pricing_and_Bundle_2026-10-25.md) supersedes the earlier prices and separate-products-only presentation. Retain the identity, returns and preorder wording below.

Updated 25 October 2026, Europe/Stockholm. This checkpoint records the owner's latest customer-facing copy changes and supersedes older film, supplier/model, company-name and dispatch wording in the [launch handover](Noorly_Separate_Products_and_Payments_2026-10-25.md). Final release evidence belongs in the associated merge PR; this document does not claim post-release verification.

## Customer experience

- A static hero using an actual product photograph replaces the stämningsfilm section and its controls.
- Customer-visible bowl model codes, supplier names and supplier-labelled photograph text are removed. Ordinary storefront and payment copy uses Noorly branding. Backend product identities, working image URLs and existing product handles remain functional.
- The dedicated wooden-bowl FAQ entry is removed. Candle-sand instructions still require a stable, noncombustible, heat-resistant vessel suitable for candle use. This follows the [supplier's own candle-sand instructions](https://www.awgifts.eu/candles/csand); the [exact bowl document](https://www.aw-dropship.eu/catalogue/product/teakb-37-dssk/ingredients-label.pdf) identifies a teak-wood fruit bowl and provides no candle-use qualification. No direct-burning or untested insert-safety claim is added.
- Product pages clearly describe preorders and dispatch when the product reaches Noorly's stock, without inventing an arrival date. Swedish wording: **“Förbeställ nu. Vi skickar din beställning så snart produkten finns i lager hos oss.”** English conveys the same condition. This presentation change does not alter stock or purchasing mechanics.

## Returns and business details

Swedish and English return wording asks customers to keep goods **unused and unlit**, preferably unopened, and return all included parts, ideally in their original packaging. It removes invitations to trial or modest use. Opening packaging does not automatically remove statutory withdrawal rights; actual diminished value from lighting, consumption, damage or handling beyond necessary inspection may reduce the refund as permitted by law. Defect rights remain intact. See [Konsumentverket on opened packaging](https://www.konsumentverket.se/fragor-och-svar/2811575/kan-jag-lamna-tillbaka-en-vara-med-bruten-forpackning/) and [ARN on diminished value](https://www.arn.se/vanligafall/3.3.-vardeminskning/).

The public-copy changes remove the owner's home address and “Noorly AB”, using Noorly and the support contact. Do not reproduce the private address or invent a replacement company identity/address. Accurate replacement business details remain assigned to the owner; this temporary removal is not a claim that seller-information requirements are satisfied. Relevant provisions are [the Distance Contracts Act, chapter 2, sections 2 and 15](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-200559-om-distansavtal-och-avtal-utanfor_sfs-2005-59/).

## Required privacy disclosures

Shopify Customer privacy was inspected during this continuation: **Network Intelligence is enabled**, and **the automated privacy policy is enabled**. Preserve both settings; no disabling or access expansion is authorised by this copy cleanup.

Named Shopify disclosures remain narrowly in legal terms/privacy, together with provider-controlled links and UI. They explain the applicable data services, cross-merchant processing, international sharing and privacy rights, and retain the Consumer Privacy Policy and privacy-portal links. These are required by [Shopify's Network Intelligence guidance](https://help.shopify.com/en/manual/privacy-and-security/privacy/shopify-network-intelligence-requirements) and [Terms of Service, section 9.2.5](https://www.shopify.com/legal/terms). The automated hosted privacy policy is retained rather than replaced with incomplete anonymous-provider text.

## Inventory and unchanged commerce data

The live baseline read **before these edits** was:

| Product     |             Available quantity |
| ----------- | -----------------------------: |
| Candle sand | 20 for each of the 11 variants |
| Teak bowl   |                             19 |

**Do not change Shopify quantities.** In particular, do not restore the bowl to the earlier handover's historical quantity of 20. This work changes no prices, variant identities, product status or handles. Real customer activity can change inventory independently; do not treat an older snapshot as a stock-reset instruction.

## Checkpoint and release record

Root reported successful Swedish product title/body/vendor/SEO updates and updates to the three bowl media alt texts. English product translations were being synchronized at this checkpoint. Hosted shop policies are being aligned with the same return, dispatch and business-detail wording.

The first connector `shopPolicyUpdate` attempt, for Contact, returned **Access denied: missing `write_legal_policies`**. It made no policy change; the loop stopped before other policy writes. Root is using the existing authorised admin policy editor without expanding connector permissions. Final saved-policy readback remains part of release verification.

Focused source checks passed; final CI was pending when this checkpoint was written. Record the exact merge SHA, successful CI, READY production deployment, live Swedish/English page and checkout inspection, final policy readback and inventory comparison in the associated merge PR after release. Do not infer live success from local edits or deployment readiness alone. No paid test order is part of this work.
