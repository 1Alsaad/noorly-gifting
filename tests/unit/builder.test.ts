import { describe, expect, it } from "vitest";
import { mockProducts } from "@/content/products";
import {
  buildBoxCartLines,
  sanitizeGiftMessage,
  validateBoxSelection,
  type BoxSelection,
} from "@/features/box-builder/validation";
const valid: BoxSelection = {
  baseHandle: "large-box",
  signatureHandle: "winter-candle",
  extraHandles: ["forest-tea", "dark-chocolate"],
  giftMessage: "For you",
};
describe("gift-box rules", () => {
  it("requires one available signature, a box and two or three distinct extras", () => {
    expect(validateBoxSelection(valid, mockProducts)).toMatchObject({
      valid: true,
      errors: [],
      total: { amount: 610, currencyCode: "SEK" },
    });
    expect(
      validateBoxSelection(
        { ...valid, extraHandles: ["forest-tea"] },
        mockProducts,
      ).errors,
    ).toContain("extras_count");
    expect(
      validateBoxSelection(
        { ...valid, extraHandles: ["forest-tea", "forest-tea"] },
        mockProducts,
      ).errors,
    ).toContain("duplicate_extras");
    expect(
      validateBoxSelection(
        { ...valid, signatureHandle: "greeting-card" },
        mockProducts,
      ).errors,
    ).toContain("invalid_signature");
  });
  it("enforces smaller box capacity and seasonal availability", () => {
    expect(
      validateBoxSelection(
        {
          ...valid,
          baseHandle: "small-box",
          extraHandles: ["forest-tea", "dark-chocolate", "linen-napkin"],
        },
        mockProducts,
      ).errors,
    ).toContain("extras_count");
    expect(
      validateBoxSelection(valid, mockProducts, "summer").errors,
    ).toContain("unavailable_product");
    const unavailable = mockProducts.map((product) =>
      product.handle === "forest-tea"
        ? { ...product, available: false }
        : product,
    );
    expect(validateBoxSelection(valid, unavailable).errors).toContain(
      "unavailable_product",
    );
  });
  it("limits messages and turns markup and control characters into plain text", () => {
    expect(
      validateBoxSelection(
        { ...valid, giftMessage: "x".repeat(281) },
        mockProducts,
      ).errors,
    ).toContain("message_too_long");
    expect(sanitizeGiftMessage(" <b>Hello</b>\u0000 there ")).toBe(
      "Hello there",
    );
    expect(sanitizeGiftMessage("Cafe\u0301")).toBe("Café");
  });
  it("uses actual inventory variant ids and one bundle id across all lines", () => {
    const lines = buildBoxCartLines(
      { ...valid, cardHandle: "greeting-card", giftMessage: "<b>For you</b>" },
      mockProducts,
      "bundle_123456",
    );
    expect(lines).toHaveLength(5);
    expect(
      lines.every(
        (line) =>
          line.quantity === 1 &&
          line.attributes?.some(
            ({ key, value }) =>
              key === "bundle_id" && value === "bundle_123456",
          ),
      ),
    ).toBe(true);
    expect(lines[0].attributes).toContainEqual({
      key: "gift_message",
      value: "For you",
    });
    expect(lines[1].attributes?.some(({ key }) => key === "gift_message")).toBe(
      false,
    );
    expect(() => buildBoxCartLines(valid, mockProducts, "<bad-id>")).toThrow(
      "invalid_box",
    );
  });
});
