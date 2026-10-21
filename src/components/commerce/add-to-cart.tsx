"use client";
import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import type { Locale, Product } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { useCart } from "@/features/cart/cart-provider";
import { trackEvent } from "@/lib/analytics/client";
import {
  supportsStandardPurchase,
  purchasePendingCopy,
} from "@/lib/commerce/purchase-options";
export function AddToCart({
  product,
  locale,
  compact = false,
  variantId,
}: {
  product: Product;
  locale: Locale;
  compact?: boolean;
  variantId?: string;
}) {
  const { addLines, loading } = useCart();
  const [state, setState] = useState<"idle" | "added" | "error">("idle");
  const t = getDictionary(locale);
  const variant =
    variantId === undefined
      ? product.variants[0]
      : product.variants.find((v) => v.id === variantId);
  const purchaseReady = supportsStandardPurchase(product);
  async function add() {
    if (!purchaseReady || !product.available || !variant?.available || loading)
      return;
    try {
      await addLines([{ merchandiseId: variant.id, quantity: 1 }]);
      setState("added");
      trackEvent({
        name: "product_variant_selected",
        properties: {
          locale,
          product_handle: product.handle,
          variant_id: variant.id,
        },
      });
    } catch {
      setState("error");
    }
  }
  return (
    <div className="add-control">
      <button
        className={compact ? "text-button" : "button button-dark"}
        disabled={
          loading || !product.available || !variant?.available || !purchaseReady
        }
        onClick={add}
      >
        {!purchaseReady
          ? purchasePendingCopy[locale]
          : !product.available || !variant?.available
            ? t.unavailable
            : loading
              ? t.adding
              : state === "added"
                ? t.added
                : t.add}
        {state === "added" ? (
          <Check size={17} aria-hidden />
        ) : (
          <ArrowUpRight size={17} aria-hidden />
        )}
      </button>
      <span
        className={state === "error" ? "field-error" : "sr-only"}
        role="status"
      >
        {state === "error" ? t.error : state === "added" ? t.added : ""}
      </span>
    </div>
  );
}
