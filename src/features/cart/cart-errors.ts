import { brand } from "@/config/brand";
import { getDictionary } from "@/content/translations";
import type { Locale } from "@/types/commerce";

const errorCodes = {
  INVALID_ORIGIN: "invalid_origin",
  UNAVAILABLE_PRODUCT: "unavailable_product",
  CART_LIMIT: "cart_limit",
  RATE_LIMITED: "rate_limited",
  CART_CHANGED: "cart_changed",
  EMPTY_CART: "empty_cart",
  UNSUPPORTED_PURCHASE_OPTION: "unsupported_purchase_option",
  REQUEST_IN_PROGRESS: "request_in_progress",
  CART_UNAVAILABLE: "cart_unavailable",
  CHECKOUT_UNAVAILABLE: "checkout_unavailable",
  CART_UPDATE_FAILED: "cart_update_failed",
} as const;

export type CartErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

/** Never expose arbitrary provider messages or response details to customers. */
export function cartErrorCode(error: unknown): CartErrorCode {
  const value = error instanceof Error ? error.message : error;
  if (typeof value !== "string") return "cart_update_failed";
  const key = value.toUpperCase();
  return Object.hasOwn(errorCodes, key)
    ? errorCodes[key as keyof typeof errorCodes]
    : "cart_update_failed";
}

const messages = {
  invalid_origin: {
    sv: "Öppna butiken på dess ordinarie adress och försök igen.",
    en: "Open the shop at its main address and try again.",
  },
  unavailable_product: {
    sv: "En vara eller det valda antalet är inte längre tillgängligt. Kontrollera innehållet och antalen i din påse.",
    en: "An item or the requested quantity is no longer available. Check the items and quantities in your bag.",
  },
  cart_limit: {
    sv: "Det valda antalet överskrider gränsen för en beställning. Minska antalet i påsen och försök igen.",
    en: "The requested quantity exceeds the order limit. Reduce the quantity in your bag and try again.",
  },
  rate_limited: {
    sv: "Du har gjort många försök på kort tid. Vänta en minut och försök igen.",
    en: "There have been too many attempts in a short time. Wait a minute and try again.",
  },
  cart_changed: {
    sv: "Din påse har ändrats. Kontrollera innehåll och antal innan du fortsätter.",
    en: "Your bag has changed. Review the items and quantities before continuing.",
  },
  empty_cart: {
    sv: "Din påse är tom. Lägg till en vara innan du går till kassan.",
    en: "Your bag is empty. Add an item before continuing to checkout.",
  },
  unsupported_purchase_option: {
    sv: "En vara har ett köpalternativ som inte är tillgängligt här. Ta bort den ur påsen för att fortsätta.",
    en: "An item has a purchase option that is not available here. Remove it from your bag to continue.",
  },
  request_in_progress: {
    sv: "En ändring pågår. Vänta tills den är klar och försök igen.",
    en: "An update is in progress. Wait for it to finish and try again.",
  },
} satisfies Partial<Record<CartErrorCode, Record<Locale, string>>>;

export function cartErrorMessage(error: unknown, locale: Locale): string {
  const code = cartErrorCode(error);
  return Object.hasOwn(messages, code)
    ? messages[code as keyof typeof messages][locale]
    : getDictionary(locale).error;
}

export function cartErrorAction(error: unknown, locale: Locale) {
  const code = cartErrorCode(error);
  if (code === "invalid_origin") {
    // This destination comes only from store configuration, never an API error.
    const url = new URL(`/${locale}/shop`, brand.siteUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    return {
      href: url.href,
      label: locale === "sv" ? "Öppna butiken" : "Open the shop",
    };
  }
  if (
    code === "unavailable_product" ||
    code === "cart_limit" ||
    code === "cart_changed" ||
    code === "unsupported_purchase_option"
  )
    return {
      href: `/${locale}/cart`,
      label: locale === "sv" ? "Kontrollera din påse" : "Review your bag",
    };
}
