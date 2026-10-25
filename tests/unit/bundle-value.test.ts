import { describe, expect, it } from "vitest";
import { bundleValue } from "@/lib/commerce/bundle-value";
import type { ProductVariant } from "@/types/commerce";

function bundle(sand: number, price: number): ProductVariant {
  return {
    id: "bundle",
    title: "Bundle",
    price: { amount: price, currencyCode: "SEK" },
    available: true,
    requiresComponents: true,
    components: [sand, 550].map((amount, index) => ({
      quantity: 1,
      product: { id: String(index), handle: String(index), title: { sv: "Del", en: "Item" } },
      variant: {
        id: String(index),
        title: "Item",
        price: { amount, currencyCode: "SEK" },
        available: true,
      },
    })),
  };
}

describe("bundle value from current component prices", () => {
  it("compares unscented and scented options without an invented former price", () => {
    expect(bundleValue(bundle(349, 699))).toEqual({ separate: 899, saving: 200 });
    expect(bundleValue(bundle(449, 749))).toEqual({ separate: 999, saving: 250 });
  });
  it("updates with a new component price and calculates in integer ore", () => {
    expect(bundleValue(bundle(449.25, 749.1))).toEqual({ separate: 999.25, saving: 250.15 });
  });
  it("does not invent a saving for incomplete or invalid data", () => {
    expect(bundleValue()).toBeUndefined();
    expect(bundleValue(bundle(349, 999))).toBeUndefined();
    expect(bundleValue(bundle(Number.NaN, 699))).toBeUndefined();
    const invalid = bundle(349, 699);
    invalid.components![0].quantity = 0;
    expect(bundleValue(invalid)).toBeUndefined();
    invalid.components = [];
    expect(bundleValue(invalid)).toBeUndefined();
  });
});
