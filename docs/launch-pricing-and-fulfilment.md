# Noorly launch, pricing and fulfilment

Reviewed 19 October 2026. This is a preparation record, not authorization to open paid checkout or start advertising. Supplier account access, exact quotes and a fulfilment rehearsal are still required.

## What the supplier actually does

| Route              | Shipping and packaging                                                                                                                                                                                                                                                                                         | Commercial consequence                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AW Gifts wholesale | Ships a wholesale order to Noorly. Sweden is Zone 3: published EUR 29.95 below EUR 795 excluding VAT, with 3–6 working days indicated. Orders below EUR 50 incur EUR 5 plus VAT picking/packing administration. Pallets can cost extra.                                                                        | Allocate inbound freight over sellable units, then add Noorly packaging, packing time and Swedish outbound delivery. Standard wholesale dispatch is not a Noorly gift-box service.                     |
| AW Dropship EU     | Can ship directly to the chosen customer address. Its FAQ explicitly says no gift wrapping. Uses unmarked new/recycled protective packaging. Sweden published 0–2 kg delivery is EUR 9.60, with around five working days indicated. Its site also warns of seasonal delays and excludes most island locations. | Good for a plainly described sealed pouch or refill order. A protective shipping carton is not a branded presentation box. Check actual packed weight, address eligibility, stock and checkout charge. |
| AW Fulfilment EU   | Offers picking, packing, dispatch and use of supplied custom/branded packaging. Published pricing examples list EUR 1.50 per picked item, EUR 1 per consignment and EUR 1.56 for a 60×40×30 cm box. Storage, goods-in and returns can add charges.                                                             | Obtain a written quote for the actual small Noorly box, assembly, insert, personal card/message, parcel weight, postage, storage and returns. Do not treat a large transport carton as the gift box.   |

The fulfilment pick/pack page also advertises rates starting at EUR 0.90 and a box price in GBP. These conflict with the detailed EUR example schedule. Use a written quote, not the lowest headline. Supplier wholesale and dropship prices/account terms can differ. Do not apply a three-pack wholesale cost to an individually sold dropship item without confirming the unit basis.

Sources: [AW Gifts delivery](https://www.awgifts.eu/shipping), [AW Dropship FAQ](https://www.aw-dropship.eu/faq), [AW Dropship delivery](https://www.aw-dropship.eu/shipping), [AW Fulfilment pricing examples](https://www.aw-fulfilment.eu/pricing), [pick and pack](https://www.aw-fulfilment.eu/pick_pack).

## Exact costs still needed

- Trade invoice/quote for the actual CSand SKU, scented versus unscented, currency, VAT basis, units per pack and current stock/lead time. The public CSand-11 page describes a three-unit wholesale pack. Its wholesale cost was not available in the shared browser. RRP and the old 295 SEK demo value are not purchase costs.
- Actual payment conversion rate and FX charges. Do not silently use a stale EUR/SEK rate.
- For self-packing: actual batch size/inbound fees, gift box or pouch, insert, filler, card, printing, ribbon, label, tape, outer mailer, assembly time and the loaded Swedish carrier price.
- For supplier-direct shipping: individual-unit trade price, final postage, any handling fees, packaging limitations, returns address and costs. Set inbound allocation to zero to avoid charging both freight routes in the model.
- Actual checkout/payment/platform charges, expected damaged/returned-order losses and a per-order allocation of operating costs.

Do not place a supplier order or assume stock is reserved on the strength of this research. Ask for permission to use supplier photographs commercially and obtain product safety/traceability documentation and Swedish warnings before sale.

### Supplier quote request to complete

Draft for the merchant to send after selecting the supplier contact. It has not been sent, and requests a quote rather than placing an order. Keep business registration, tax identifiers, account credentials and customer addresses in the supplier's secure account workflow.

> We are preparing Noorly's Swedish candle-sand launch. Please quote CSand-11 (unscented white, 300 g pouch) separately from any scented/coloured variants. We are comparing wholesale delivery to Noorly with direct delivery to Swedish customers.
>
> 1. What is the trade price, currency, VAT treatment and number of sellable pouches per ordered unit? Please separate minimum quantity, tier discounts and any account/handling charges from the product price.
> 2. Is the exact SKU available now? What dispatch lead time and replenishment date can you confirm, and does a quote reserve any stock?
> 3. Can this SKU be dropshipped as one, two or three pouches in one parcel? Please quote the complete delivery/handling charge and packed weight for each quantity to Sweden, including postcode/island restrictions and surcharges.
> 4. What packaging does the customer actually receive? Please provide a sample/photo and confirm manufacturer branding, paperwork and whether any gift wrapping or presentation box is included.
> 5. Under a fulfilment arrangement, can you use our supplied Noorly box, insert, card and protective mailer? Please price receiving/storage, picking each pouch, assembly, printing/personal messages, packaging materials and postage separately, including minimum fees.
> 6. Please quote wholesale inbound delivery separately, with its batch quantities, packing/administration fees and any free-freight threshold. We will not combine inbound freight with the direct-shipping route.
> 7. What is the returns address and process for damaged, undelivered and customer-returned orders? Who pays each transport/handling charge, and when is the merchant credited?
> 8. Please supply product traceability/manufacturer and applicable EU responsible-person details, safety/label documents and Swedish warnings, and confirm commercial use rights for the product photographs.
> 9. How long is the quote valid, what are the payment terms and what does a representative sample order cost?

Enter the verified quote in the pricing workbook; leave unanswered fields blank. Approve a sample's actual presentation and delivered cost before turning these quantities into checkout offers or ad claims.

## Cost-based pricing rule

Use economic costs excluding recoverable VAT, including VAT that cannot be recovered. The calculator's 25% sales VAT assumption is for candle-sand offers and must match the merchant's actual tax treatment. It is not a tax-registration assertion. Mixed food gift boxes need separate treatment: Swedish food VAT is 6% from 1 April 2026; notebooks ordinarily have 25% VAT.

Let C be the full economic cost per order, f the percentage payment/platform fee, k its fixed SEK fee, v the applicable output VAT rate, S the customer shipping charge including VAT, A the planned acquisition cost and T the target contribution after ads. Then:

```text
Minimum product price including VAT =
  max(0, (C + k + A + T) / (1 / (1 + v) - f) - S)

Contribution before ads =
  (product price + S) / (1 + v) - C - f × (product price + S) - k

Maximum CPA while retaining target = contribution before ads - T
```

The fee applies to the customer's entire payment, including shipping and VAT. Include every pouch in product cost and inbound allocation. Round prices upwards after calculating the floor. A negative maximum CPA means the target is missed even without advertising; do not hide it as zero. A cost floor does not prove willingness to pay.

`scripts/price-offers.mjs` implements the same contribution logic. Run it with a JSON file containing verified inputs. Missing costs return a missing-input result rather than an invented zero. `node --test scripts/price-offers.check.mjs` checks the fee/VAT/shipping relationship, a target-price floor, explicit zero costs and missing quotes.

### Illustration, not the supplier quote

At a hypothetical 40 SEK pouch cost, 5 SEK inbound per pouch, 12 SEK packaging, 8 SEK labour, 59 SEK outbound carrier, 10 SEK expected return losses and 5 SEK overhead, a single-pouch order costs 139 SEK before processing/ads. With 25% output VAT, 1.5% plus 1.80 SEK processing, 49 SEK customer shipping, 60 SEK planned CPA and 40 SEK target contribution, the minimum item price is about 257.75 SEK, rounded up to 259 SEK.

These numbers illustrate the method only. They are not AW's trade prices or a recommended live offer. In particular, they show how expensive single-item paid acquisition can become. Never describe an assumed positive contribution as verified profitability.

## Three-option attraction-effect experiment

Offer three legitimate quantities of the same verified product: one pouch, two pouches and three pouches. Keep contents comparable: 300 g and four wicks per pouch, with no vessel or gift wrapping unless separately contracted. The middle option can be a comparison anchor while the third has a clearly lower unit price. Every option must remain genuinely available on its stated terms.

Internal candidate prices in the calculator are 259 / 349 / 379 SEK plus an illustrative 49 SEK shipping charge. These are editable experiment ideas, not published retail prices. The target trio costs only 30 SEK more than the duo, but adds a full pouch cost; verify each option's contribution independently. Do not sacrifice the target margin to manufacture the effect. Decide using contribution per visitor and paid acquisition cost, alongside conversion, order value and refunds.

The storefront now previews the three formats and visually emphasizes the trio. It publishes no invented prices, discounts, stock urgency, bestseller claim or reserved launch date. Interest links preserve the selected variant and pouch count. The comparison is hidden in live commerce mode until real multipack SKUs/discounts and checkout prices have been integrated and verified. It does not change the cinematic scrolling or payment provider.

Before enabling monetary comparison:

1. Obtain actual quotes and choose self-packing or supplier-direct fulfilment.
2. Fill the cost model and approve contribution/CPA ceilings for all quantities.
3. Create real offer SKUs or validated quantity pricing in the chosen checkout provider, including stock deduction and returns rules.
4. Display total price, price per pouch, shipping and precise contents consistently in product page, cart, checkout and confirmation.
5. Only label the trio as the lowest price per pouch when that is true for the approved comparable offers. Do not label it most popular without actual sales evidence.

## Requirements before taking paid pre-orders

| Priority | Needed evidence                                                                                          | Current state                                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Chosen payment architecture and an end-to-end real-provider test                                         | Code uses Shopify-hosted checkout. A standalone Stripe sandbox Payment Link passed decline/success tests, but is not connected to the storefront. Stripe live account showed Payments/Payouts active and no active account tasks. |
| 2        | Exact product, supplier quote, sourceable stock, packaging sample, delivery promise and refundable funds | Quotes, pack test and order/fulfilment/refund rehearsal remain outstanding. No invented delivery interval should be published.                                                                                                    |
| 3        | Real merchant identity, support/return contact, accurate policies and Swedish consumer information       | Repository still contains launch placeholders. Complete directly with the real business.                                                                                                                                          |
| 4        | Product safety, traceability, manufacturer and applicable EU responsible-person details on online offers | Confirm actual product records and Swedish warnings with the supplier. Review packaging producer obligations for the chosen flow.                                                                                                 |
| 5        | Privacy/consent, secure services, paid-order processing, confirmation and refunds                        | Production Redis, form delivery where used, authenticated webhooks/outbox and actual destination credentials need acceptance evidence.                                                                                            |
| 6        | Public host, HTTPS, correct canonical URL and release checks                                             | A custom domain has not been purchased. The existing Vercel URL can support preparation; never describe noorly.se as owned. Choose the final host before configuring production callbacks and marketing URLs.                     |

Before payment, disclose total price and shipping, pre-order charge timing, exact contents, a realistic agreed delivery window, cancellation/withdrawal/refund process and contact details. Retain enough funds to refund all unfulfilled orders. Test failure, duplicate submission, stock races, authentication, paid-order notification, cancellation, refund and duplicate/delayed webhooks. Do not emit Purchase merely from a thank-you page or interest registration.

Swedish distance-selling guidance includes a generally applicable 14-day withdrawal right and an online withdrawal function for eligible website/app contracts under rules updated 19 June 2026. The actual application/exceptions and merchant terms need review for this operation. A policy link alone is not an implemented withdrawal workflow.

Sources: [Konsumentverket information requirements](https://www.konsumentverket.se/marknadsratt-foretag/informationskrav-vid-distansavtal-regler-for-foretag), [Skatteverket VAT rates](https://www.skatteverket.se/foretagorganisationer/moms/saljavarorochtjanster/momspavarorochtjanster.4.58d555751259e4d66168000409.html), [EU GPSR business guidance](https://webgate.ec.europa.eu/safety/consumers/consumers_safety_gate/obligationsForBusinesses/documents/Q%26A.pdf), [Naturvardsverket packaging producer guidance](https://www.naturvardsverket.se/vagledning-och-stod/producentansvar/eu-forordningen-om-forpackningar-ppwr/forpackningsproducent/), [Stripe Sweden public fees](https://stripe.com/en-se/pricing).

## Advertising release

Read back from Meta on 19 October 2026: the intended SEK account 479891386519342 is ACTIVE and now reports a payment method present. This corrects the older recorded missing-payment-method blocker; it is not proof every ad can deliver. The Instagram account lookup returned none: either no eligible account is connected or this app lacks the relevant permission. Confirm a usable Page/Instagram identity for the intended placements.

The current campaign 120251947281020015 was read back PAUSED with 50 SEK/day total and a 4,000 SEK cumulative campaign ceiling. Its candle-sand ad set 120251947284140015 is also PAUSED and configured for website PURCHASE with dataset 511816900240916. The held schedule is 23 October at 08:00 to 27 October at 08:00, Europe/Stockholm; refresh it if launch readiness misses that window. Do not create overlapping funded product tests. The first 200–250 SEK is a review allowance, not an enforced per-product spend cap. Review price/offer economics before choosing the allowable CPA.

The same recorded readback found no ads attached to this ad set. Repository inspection confirms that the browser Meta adapter emits consent-gated Lead only; the paid-order outbox supports GA4, PostHog and a generic relay, with no built-in Meta Purchase destination. Its analytics-consent snapshot does not authorize marketing delivery. A supported checkout integration or reviewed relay, with the appropriate data/consent contract, is still required for the Purchase campaign.

After checkout/fulfilment readiness, verify the final landing variant, consent-gated paid Purchase event, currency/value and deduplication. Then attach the approved sales creative, recheck destination and billing eligibility, refresh the ad schedule and review the exact activation settings. A paused or historical ad schedule does not establish readiness. This change does not activate advertising or live payments.
