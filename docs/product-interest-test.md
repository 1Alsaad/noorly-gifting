# Noorly product-interest test — 19 October 2026

This is a demand test, not a shop launch or a pre-order offer. No payment, order, stock reservation, delivery date or discount is promised. The public site defaults to product-test mode. Its commerce providers remain available behind an explicit future opt-in; public cart mutations are refused in test mode.

## Customer experience

- Swedish and English calls to action say “Visa mitt intresse” / “Register my interest”.
- Sample prices and stock claims are hidden. Product JSON-LD does not advertise offers.
- The filmed environment, actual first-frame opening, portrait layout, native scroll, synchronous Skip/Explore navigation and reduced-motion/Save-Data/no-JS/failed-media browsing remain intact.
- Supplier-backed candle sand and notebooks can be explored. Gift boxes and their extra products remain explicitly labeled concepts; physical fit and assortment are not established.
- Builder choices can be carried to the interest page as product handles. Personal gift messages remain on the device and are not included in that URL or lead submission.
- The interest form is CLOSED until PRODUCT_INTEREST_ENABLED=true and durable rate-limit, idempotency and delivery services are configured. Closed means no email field and no pretend success.
- The delivery adapter must durably save the registration before returning 2xx, honor Idempotency-Key, and provide the merchant with an export/deletion process. Existing production protections continue to fail closed.
- A registration is counted only after non-mock server acceptance. Duplicate acknowledgments, clicks, validation errors, network errors and development mock responses are not new leads.
- Meta Lead is separately gated by marketing consent. Analytics consent is independent. No contact data, gift message, price or purchase value is sent to Meta. Automatic pixel configuration is disabled in this client.

## Paid test plan

Keep all entities PAUSED until the signup flow, privacy/contact information, pixel and billing have been verified. “DRAFT” in the entity name is an editorial label: Meta actually created PAUSED campaign/ad-set objects.

| Setting                  | Saved value                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Account                  | Noorly - Ad Account, 479891386519342, SEK                                                      |
| Campaign                 | 120251945584240015, OUTCOME_LEADS, PAUSED                                                      |
| Campaign lifetime budget | 4,000 SEK, with a 4,000 SEK campaign spend cap                                                 |
| Ad set                   | 120251945599280015, configured PAUSED                                                          |
| Conversion               | Website, OFFSITE_CONVERSIONS, standard Lead event                                              |
| Dataset                  | 511816900240916; existing business dataset, last observed browser event in 2022                |
| Audience                 | Sweden, adults, broad Advantage+ audience; no invented interests                               |
| Placements               | Advantage+ defaults; no Instagram identity is currently available through the connection       |
| Provisional window       | 23 October 08:00 CEST – 27 October 08:00 CET; about four days, accounting for the clock change |
| Assets                   | Two existing 800 × 800 supplier product photographs; no generated video or product imagery     |

The dates are a proposed short test window around the usual late-month buying period, not a claim that everyone is paid on the same date. A paused schedule does not launch itself. Revisit the dates if prerequisites are not ready.

One ad set concentrates the small budget across candle sand and notebooks. Allocation will be unequal; this is directional screening, not a controlled product comparison. Inspect spend, unique valid registrations, cost per registration and subsequent voluntary feedback. A free registration is weaker evidence than a paid order and cannot establish willingness to pay. Stop each product after roughly four to five days or sooner if tracking, presentation or lead quality fails. Do not extend a weak test automatically or create additional campaigns outside the total budget. Retain unspent money when evidence is inconclusive. Billing taxes/fees must fit within the overall approximately 4,000 SEK marketing allowance before launch.

## Image-only copy drafts

### Candle sand

Image: CSand-11, white unscented pouch with candle sand. Image hash: da4f0b3d5ccfae811310400c7d988a52.

Headline: **Ljussand till en framtida gåvobox?**

En liten paus att ge bort. Vi utforskar ljussand till Noorlys framtida sortiment – 300 g doftfri vit ljussand med fyra vekar. Kärl ingår inte.

Vill du veta mer om vi tar in den? Visa ditt intresse utan kostnad. Vi tar inte emot beställningar eller förbeställningar. Pris och eventuell lansering är inte bestämda.

Destination: https://noorly-gifting.vercel.app/sv/interest?product=candle-sand&utm_source=facebook&utm_medium=paid_social&utm_campaign=noorly_interest_oct26&utm_content=candle

### Notebook

Image: PNB-01, Waves in the same sea. Image hash: 019f4442cc680bebe78cb75df03e1771.

Headline: **Plats för tankar. En möjlig gåva.**

Till någon med huvudet fullt av idéer. Vi utforskar en anteckningsbok med 200 olinjerade sidor och rem till Noorlys framtida gåvoboxar.

Hjälp oss välja sortiment: visa ditt intresse utan kostnad. Vi tar inte emot beställningar eller förbeställningar. Pris, förpackning och eventuell lansering är inte bestämda.

Destination: https://noorly-gifting.vercel.app/sv/interest?product=notebook-with-strap&utm_source=facebook&utm_medium=paid_social&utm_campaign=noorly_interest_oct26&utm_content=notebook

CTA: LEARN_MORE. No artificial scarcity, countdown, unverified savings, stock or shipping promises. The AI-disclosure setting remains undecided by the advertiser; this work reused supplier photos without generating or altering the products. Do not enable transformations that change what the product looks like. The description field is not relied on for disclosures because it is absent on common placements.

## Current blockers

Both ad-creation attempts were rejected by Meta with error 1359188: update/add a valid payment method. No ads were created or activated. Campaign and ad set remain paused; the two image uploads are available in the ad account.
Meta retained both creative-library objects after rejecting the ad attachments: candle sand **856684787503853** and notebook **949012087890927**. Their ACTIVE creative status means the assets are available for reuse; no ad is delivering. Reuse these IDs after billing is fixed instead of uploading duplicate images.

Preview links: [Candle sand](https://business.facebook.com/ads/api/preview_iframe.php?d=AQIHs4D0_n0hi1mkZmIre5WwD-6XpaP_U7BlTCJSL1lYeND7xvF3fLKlKazTRFpTTGNZebM_5qzWU6AI7hZ7-D97KQTHrYr2zfLhBUJD7tjTVLNzfYHQa9a5lLDQZGC_Ev9P8fUw5bGC7aJpqWFZPjggVlSz-mQgqh_ucmPAmG-qHFAAWhSV3flGhIVNBdSa-QplFityQkMX86sn6-P-1DTjHmb3_1DNXFL8-goQTM7Opg&t=AQIcYWN7uxQONyYtk-U) · [Notebook](https://business.facebook.com/ads/api/preview_iframe.php?d=AQLAMszDQsxE3CzjN4pODmaaBWO4oVFi-291CgGxG4KVyoosv8zjeZ1coVmhxHYAEjTMMz5Xj0cC-6PBttE2TvW3g3BTBA0Fd2KZHNKJ2ZqQR_4MPx0RSJLz1LlOlDsCIeDcB1K3nCeP9nWf3dRuF2J1HxBeqeWOEh8QmAp342XSv6cggoLJNOaCsY2lCPIIIHkM4ZM0OvW4ni-ixRZcPvSKGIOS5rhX7M_Sixgeerz8xA&t=AQIPx-BO-3TRPdeYzmM). Previews do not establish Instagram delivery eligibility.

On-site signup storage/delivery is not configured, the business's public legal identity/contact and privacy details remain placeholders, the old pixel must be verified on this domain, and Instagram advertising access is absent. Keep registration collection and advertising off until these concrete requirements are resolved. The chai candidate remains excluded from this first test because its supplier weight specifications conflict.

The optional DOCX handover was not readable in the disconnected workspace during this continuation. No claims from it have been assumed.

## Sources and evidence limits

- Meta's official lead-generation guide distinguishes website conversions from Instant Forms and recommends reducing form friction: https://about.fb.com/ltam/wp-content/uploads/sites/14/2023/11/LeadGenerationGuide.pdf
- Meta's official consent template documents holding events until consent is granted: https://github.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel
- Product facts/images and qualified trend evidence: docs/candle-sand-research.md and docs/gift-box-assortment-2026-10.md. Search momentum is not Swedish sales data or proof of demand.
