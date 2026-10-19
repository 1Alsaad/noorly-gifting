"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { Locale, Product } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { useCart } from "@/features/cart/cart-provider";
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
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  async function add() {
    if (!variant) return;
    try {
      await addLines([{ merchandiseId: variant.id, quantity: 1 }]);
      setState("added");
    } catch {
      setState("error");
    }
  }
  return (
    <div className="add-control">
      <button
        className={compact ? "text-button" : "button button-dark"}
        disabled={loading || !variant?.available}
        onClick={add}
      >
        {!variant?.available
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
        className={
          state === "error"
            ? "field-error"
            : state === "added"
              ? "add-confirmation"
              : "sr-only"
        }
        role="status"
      >
        {state === "error" ? t.error : state === "added" ? t.added : ""}
      </span>
      {state === "added" && (
        <Link className="text-link cart-next-step" href={`/${locale}/cart`}>
          {t.cart} ↗
        </Link>
      )}
    </div>
  );
}
