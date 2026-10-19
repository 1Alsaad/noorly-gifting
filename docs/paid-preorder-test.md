# Paid pre-order test

Updated 19 October 2026. This plan supersedes the free-interest acquisition plan in product-interest-test.md. It is an internal launch draft, not published customer terms.

## Goal and current state

The merchant wants real paid demand. Success means paid orders that can be fulfilled profitably, reconciled with cancellations and refunds. Free registrations, cart clicks and checkout visits are not sales.

The public storefront still runs in product-test mode and accepts no payments. Do not relabel its closed interest flow as a paid pre-order or simply turn off the safeguards while the provider is mock.

Live Shopify reads confirmed that candle sand and notebooks are unpublished drafts with zero prices and inventory. The only configured shop policy is the privacy policy; shipping, returns and terms still need to be prepared. Sweden is in the configured shipping countries and prices include taxes, but neither setting proves that an actual delivery service or valid payment gateway is ready. The connection cannot read Shopify Payments activation because it lacks the required payments scope.

## Proposed first offer

Start with one sourceable product: one 300 g candle-sand pouch, four wicks, selected colour/fragrance, with no vessel included. Do not promise a complete gift box until its contents, packaging, fit and delivered cost are confirmed. Keep notebooks as the next candidate and exclude chai until the conflicting supplier weight is resolved.

The supplier page currently labels CSand-11 as a wholesale three-pack and shows “Remind me”. This is not proof of available stock. Confirm availability, wholesale pack price, units per pack, inbound delivery and customer delivery before taking payment. Do not use the supplier's euro RRP or the old demo price as an agreed SEK selling price.

Required commercial inputs:

- Actual landed cost per sellable pouch, packaging, payment fees and delivery cost.
- Retail price including applicable VAT, customer shipping charge and a realistic dispatch/delivery window.
- Verified merchant identity, public support contact, return address and available funds for full refunds.

## Customer promise to complete before launch

Use paid pre-order language only after the actual checkout supports it. State the charge timing, exact contents, total price, shipping cost, expected delivery window and cancellation/refund process beside the purchase button and in checkout and confirmation.

Draft Swedish copy with intentionally unresolved fields:

> Förbeställ Ljussand – 300 g  
> En påse ljussand och fyra vekar. Kärl ingår inte.  
> Pris: [pris inklusive moms]. Frakt: [fraktpris].  
> Du betalar [belopp] vid beställningen. Beräknad leverans: [verifierat intervall].  
> Om vi inte kan leverera återbetalar vi hela beloppet, inklusive eventuell frakt, till samma betalningssätt. Kontakta [verifierad kontakt] för att avbeställa.

The customer's ordinary statutory rights remain applicable. If the business wants launch to depend on a minimum batch, disclose that condition and a fixed decision deadline before payment; have the terms reviewed before publishing. Low ad performance by itself must not silently change existing customer promises. Prefer fulfilling accepted orders even when stopping further advertising.

Keep refundable order funds separate from the advertising budget. Do not fund the 4,000 SEK media test with money that may need to be returned.

## Checkout and purchase measurement

- Connect the real Shopify catalogue and hosted checkout; never charge through the mock provider.
- Confirm the payment gateway, payout/refund capability, shipping rates and order notifications. Use a supported pre-order app/purchase option if using Shopify's pre-order feature; the current cart has no selling-plan support.
- Keep all unsourced concept products and unpriced variants unavailable for purchase.
- Test paid-order confirmation, cancellation, refund and duplicate webhook delivery before enabling ads. A sandbox transaction verifies wiring, not whether the live gateway is approved.
- Emit Purchase only for an actual successfully paid, non-test order, with the correct value/currency and stable order event ID. Browser/server events must deduplicate. Do not emit Purchase when a user merely opens checkout or registers interest.
- Respect marketing consent and disclose tracking. Reconcile ad reports with Shopify paid orders, cancellations and refunds; gross attributed purchases are not retained revenue.

## Meta setup saved, not launched

- Account: 479891386519342, SEK.
- Sales campaign: 120251946652050015, OUTCOME_SALES, verified PAUSED.
- Campaign lifetime budget and spend cap: 400,000 ore each, equivalent to 4,000 SEK total. This replaces the intended acquisition plan; it is not another approved 4,000 SEK allocation.
- Ad set: 120251946661520015, verified PAUSED, website OFFSITE_CONVERSIONS with dataset 511816900240916 and PURCHASE event.
- Targeting: Sweden, broad adult audience, Advantage+ Audience. Placement restrictions were omitted, allowing default placements.
- Draft window: 23 October at 08:00 through 27 October at 08:00, Europe/Stockholm. The daylight-saving change makes this approximately four days. Refresh the schedule if checkout readiness misses this window; no delivery deadline is implied by the ad schedule.
- The old Leads campaign 120251945584240015 is renamed SUPERSEDED and remains PAUSED. Do not activate both acquisition plans.
- No sales ad has been attached or activated. Existing free-interest copy must not be reused for a purchase offer.
- Existing supplier-photo image hashes can be reused for final paid-offer creatives. Do not generate or upload duplicate media.
- Meta previously rejected ad attachment for an invalid payment method. Fix billing before retrying. The existing dataset must also be verified on the final checkout/domain.

Draft image-ad direction: show the actual pouch, clearly say “Kärl ingår inte”, explain the pre-order and verified delivery window, and send visitors to the matching product/variant. Use only the eventual approved price and terms; no invented discounts, reviews, stock urgency or payday claims.

## Budget and decision rule

Keep the whole test within 4,000 SEK. Start with candle sand rather than fragmenting a small budget across many simultaneous products. Treat four to five days as a review window, not a guarantee of a conclusive result or permission to spend the whole budget.

Calculate allowable acquisition cost from revenue excluding VAT, minus landed product cost, packaging, shipping subsidy, payment fees and a refund/return allowance. Stop or revise an offer when its paid acquisition cost cannot fit that contribution margin. Do not invent a universal sales-count threshold before costs are known.

Report paid orders, retained orders after refunds, acquisition cost and contribution after advertising. If an offer is stopped, handle its accepted orders and refunds first. Refunds demonstrate that the promise was honoured; they do not turn an unprofitable test into a successful product.

## Primary references checked

- Shopify pre-order setup, reasonable shipping expectations, supported checkout and payment restrictions: https://help.shopify.com/en/manual/products/purchase-options/pre-orders/setup
- Shopify managing pre-orders and refunds: https://help.shopify.com/en/manual/products/purchase-options/pre-orders/manage-pre-orders
- Konsumentverket, business obligations and late delivery: https://www.konsumentverket.se/marknadsratt-foretag/konsumentkoplagen-for-foretag/
- Konsumentverket, distance contracts, withdrawal information and cancellation function: https://www.konsumentverket.se/lagar/lagen-om-distansavtal-och-avtal-utanfor-affarslokaler-konsument/
- Supplier product/pack facts: https://www.awgifts.eu/candles/csand/csand-11
