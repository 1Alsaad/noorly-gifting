# Noorly cart recovery

Updated 25 October 2026, Europe/Stockholm. This checkpoint follows the owner's report that adding a product displayed **“Något gick fel. Försök igen.”** Read alongside the [separate-products and payment launch handover](Noorly_Separate_Products_and_Payments_2026-10-25.md).

## Confirmed failure and scope

The legacy public host `noorly-gifting.vercel.app` still served the product page with **HTTP 200**, but a same-origin cart POST returned **HTTP 403 `INVALID_ORIGIN`**. A browser add-to-cart attempt on that host reproduced the owner's exact Swedish error. This establishes a failing public route; it does not establish which address the owner used.

The configured canonical address is **https://noorlynordic.com**. Production configuration was independently verified through Vercel: `DEPLOYMENT_ENV=production` and `NEXT_PUBLIC_SITE_URL=https://noorlynordic.com`. The `www.noorlynordic.com` alias already redirects to the canonical host. A harmless invalid-action POST on the canonical host reached action validation and returned **400 `INVALID_CART_ACTION`**, rather than an origin rejection.

Code review also found that an unavailable item retained in an existing cart, including the retired combined set, could block adding an unrelated current product. Regression tests reproduce this case. **It is an audit/test finding, not a confirmed explanation of the owner's saved cart.**

## Implemented recovery

- An exact-host permanent redirect in `next.config.ts` sends the known legacy host to the configured canonical origin, preserving the path and query. Production guards leave preview and development deployments unaffected. The destination never comes from an incoming Host or forwarded-host value.
- New navigation to a legacy link reaches the canonical shop before the storefront renders. Already-open legacy tabs need navigation or reload; a redirected cross-origin POST is not evidence that an item was added.
- The cart API preserves unavailable existing lines while allowing unrelated valid additions. It validates each incoming variant and checks the full projected quantities of purchasable lines. Adding more of the same unavailable variant remains blocked. The customer can remove the old item, and checkout stays blocked until the cart is valid.
- The frontend retains only allowlisted error codes and gives actionable Swedish and English feedback. Origin errors offer **“Öppna butiken” / “Open the shop”** at the configured canonical address. Unavailable items, quantity limits, changed carts and unsupported purchase options offer **“Kontrollera din påse” / “Review your bag”**. Rate-limit feedback asks the customer to wait one minute. Unknown errors keep the generic message; provider details are not exposed.

Strict CSRF origin validation, stock checks, checkout validation, purchase-option restrictions and cart limits remain in place. Provider failures do not discard items, create a replacement cart or reset its cookie. The change does not enable unsupported purchases or silently remove the retired set.

## Focused verification and release record

The reported focused runs passed:

| Area                                       | Passed checks |
| ------------------------------------------ | ------------: |
| Canonical routing                          |            15 |
| Backend cart regression and related checks |            41 |
| Frontend cart feedback and related checks  |            27 |

These suites overlap; **do not add these counts together as a unique test total**. Coverage includes path/query preservation, preview and unrelated-host exclusions, additions beside retired items, combined variant quantities, strict checkout, safe error feedback and preservation of existing carts on provider errors.

Final deployment and live evidence belong in the associated merge PR and must be updated there after release. **No post-fix live success is claimed by this checkpoint.**

The canonical browser's current cart contains a pre-existing **white unscented candle-sand pouch, quantity 1, 199 SEK**. Preserve it during live verification and remove only items added by the verification itself. This current observation supersedes the earlier launch handover's historical empty-cart cleanup. No paid test order is part of this recovery.
