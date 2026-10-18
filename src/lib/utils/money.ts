import type { Locale, Money } from "@/types/commerce";

export function formatMoney(money: Money, locale: Locale = "sv"): string {
  return new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-SE", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: Number.isInteger(money.amount) ? 0 : 2,
  }).format(money.amount);
}
export function sumMoney(values: Money[]): Money {
  return {
    amount:
      values.reduce((sum, value) => sum + Math.round(value.amount * 100), 0) /
      100,
    currencyCode: "SEK",
  };
}
