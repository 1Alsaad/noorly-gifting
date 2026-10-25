"use client";

import type { Cart, CartLineInput } from "@/types/commerce";
import { getConsent } from "./consent";
import { updateMetaConsent } from "./meta";

/** Only acknowledged additions: no clicks, failed requests, mock IDs or cart secrets. */
export function trackMetaAddToCart(
  cart: Cart | undefined,
  requested: CartLineInput[],
): boolean {
  try {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (
      typeof window === "undefined" ||
      !getConsent()?.marketing ||
      !pixelId ||
      !/^\d+$/.test(pixelId) ||
      !cart ||
      cart.warnings?.length ||
      !requested.length ||
      process.env.NEXT_PUBLIC_PRODUCT_TEST_MODE === "true"
    )
      return false;
    const quantities = new Map<string, number>();
    for (const input of requested) {
      if (
        !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(input.merchandiseId) ||
        !Number.isSafeInteger(input.quantity) ||
        input.quantity < 1 ||
        input.quantity > 99
      )
        return false;
      quantities.set(
        input.merchandiseId,
        (quantities.get(input.merchandiseId) ?? 0) + input.quantity,
      );
    }
    const contents: { id: string; quantity: number; item_price: number }[] = [];
    let totalOre = 0;
    for (const [id, quantity] of quantities) {
      const line = cart.lines.find((item) => item.merchandiseId === id);
      if (
        !line ||
        line.product.previewOnly ||
        line.variant.id !== id ||
        line.quantity < quantity ||
        !/^gid:\/\/shopify\/Product\/\d+$/.test(line.product.id) ||
        !/^[a-z0-9-]{1,100}$/.test(line.product.handle)
      )
        return false;
      const price = line.cost?.amountPerQuantity ?? line.variant.price;
      if (
        price.currencyCode !== "SEK" ||
        !Number.isFinite(price.amount) ||
        price.amount < 0
      )
        return false;
      const ore = Math.round(price.amount * 100);
      totalOre += ore * quantity;
      // Same content-ID scheme as existing ViewContent. No catalog matching claim.
      contents.push({
        id: line.product.handle,
        quantity,
        item_price: ore / 100,
      });
    }
    if (totalOre <= 0 || !Number.isSafeInteger(totalOre)) return false;
    updateMetaConsent();
    if (!window.fbq) return false;
    window.fbq("trackSingle", pixelId, "AddToCart", {
      content_type: "product",
      content_ids: [...new Set(contents.map((item) => item.id))],
      contents,
      value: totalOre / 100,
      currency: "SEK",
      num_items: contents.reduce((total, item) => total + item.quantity, 0),
    });
    return true;
  } catch {
    return false;
  }
}
