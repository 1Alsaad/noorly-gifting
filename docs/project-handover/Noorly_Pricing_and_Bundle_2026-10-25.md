# Noorly sand pricing and bowl bundle

Prepared 25 October 2026, Europe/Stockholm. This checkpoint supersedes the price and separate-products-only presentation in the [separate-products launch](Noorly_Separate_Products_and_Payments_2026-10-25.md). The [storefront copy checkpoint](Noorly_Storefront_Copy_Cleanup_2026-10-25.md) still governs public identity, return wording, preorder dispatch and required privacy disclosures. A subsequent owner instruction restores the existing video; the pricing work does not override that instruction.

## Owner instruction and price decision

The owner supplied these purchase costs: **EUR 5.00** per white unscented sand pouch, **EUR 6.25** per scented sand pouch, and **EUR 11.70** per bowl. The request is to price sand at 3–4 times purchase cost and offer a bowl-and-sand bundle. Stock quantities must remain unchanged.

The [ECB reference rate for 23 October 2026](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-sek.en.html), the latest working day before this decision, is **EUR 1 = SEK 11.1310**. It is a planning reference, not a guaranteed conversion or payment-provider rate. Supplier amounts are used exactly as provided; their tax and freight treatment has not been newly verified.

| Item                                       | Supplier amount | Converted amount |         Customer price | Customer price / supplied cost |
| ------------------------------------------ | --------------: | ---------------: | ---------------------: | -----------------------------: |
| White unscented sand, 300 g and four wicks |        EUR 5.00 |        SEK 55.66 |            **SEK 219** |                      **3.93×** |
| Scented sand, 300 g and four wicks         |        EUR 6.25 |        SEK 69.57 |            **SEK 269** |                      **3.87×** |
| Decorative teak bowl                       |       EUR 11.70 |       SEK 130.23 | **SEK 550**, unchanged |                          4.22× |
| Bowl plus white unscented sand             |       EUR 16.70 |       SEK 185.89 |            **SEK 699** |                          3.76× |
| Bowl plus selected scented sand            |       EUR 17.95 |       SEK 199.80 |            **SEK 749** |                          3.75× |

The multiplier here compares the customer-facing price to the supplier amount supplied by the owner. It is **not a profit multiple**. If the customer price includes 25% VAT and the supplied purchase cost is an ex-VAT business cost, net-of-VAT sand revenue is approximately 3.15× and 3.09× that cost. Supplier freight, currency conversion costs, Swedish delivery, packaging, handling, payment fees, advertising and returns still reduce contribution. Do not report the resulting difference as net profit or change tax registration/settings on this assumption.

## Bundle presentation

Customers can continue buying sand and bowls individually. The optional package contains **one decorative teak bowl, one selected 300 g pouch of sand and the pouch's four cotton wicks**. No fruit, gift box, additional vessel or other photograph styling is included. Preserve generic candle-sand usage instructions and do not infer candle-safety approval for the decorative wooden bowl.

Use clear **“Paketpris” / “Bundle price”** wording at SEK 699 unscented or SEK 749 scented. The current separate-item totals would be SEK 769 and SEK 819, a mathematical difference of SEK 70. Those totals are not a historical bundle price. Do not populate a misleading compare-at price, crossed-out former price, invented normal price or false limited-time claim. [Konsumentverket's guidance on combination offers](https://www.konsumentverket.se/marknadsratt-foretag/fragor-och-svar-prissankningar/) distinguishes package offers from announcements of price reductions, while retaining the requirement that the overall impression be accurate.

All displayed prices continue to include Sweden delivery and the existing VAT presentation. Preorders are dispatched when the products arrive in Noorly's stock; no arrival date is invented.

## Policy synchronization

The shared Swedish and English customer-policy source updates only delivery/pricing and ordering copy for the optional bundle. Return/withdrawal/defect rights, temporary public identity removal, support contact, and required named Network Intelligence disclosure are preserved.

Root must save and independently read back **SHIPPING_POLICY** and **TERMS_OF_SERVICE**, in Swedish and English. Prepared HTML is generated directly from the same shared policy source. Refund, contact and automated privacy policies do not need changes for this price decision.

## Inventory and release evidence

Do not write stock quantities or create an independent stock pool for a bundle. Component quantities should be accounted for by the native bundle configuration. The prior observed quantities of 20 per sand variant and 19 bowls are historical evidence only; root must compare a fresh before/after readback without overwriting real customer activity.

This document is preparation evidence. The associated release PR must record saved product/variant/bundle and translated-policy readback, the exact successful CI commit, production deployment, live selected-variant bundle/cart/checkout prices and quantities, and final inventory comparison. Do not infer publication or checkout success from this document. No paid order, supplier purchase, advertising release or inventory adjustment is authorized by this checkpoint.
