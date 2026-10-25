"use client";
import {
  isProductTestMode,
  productTestCopy,
  interestHref,
} from "@/config/product-test";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { Locale, Product } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { useCart } from "@/features/cart/cart-provider";
import {
  cartErrorAction,
  cartErrorCode,
  cartErrorMessage,
  type CartErrorCode,
} from "@/features/cart/cart-errors";
export function AddToCart({
  product,
  locale,
  compact = false,
  variantId,
  disabled = false,
  onAdded,
}: {
  product: Product;
  locale: Locale;
  compact?: boolean;
  variantId?: string;
  disabled?: boolean;
  onAdded?: () => void;
}) {
  const { addLines, loading } = useCart();
  const [state, setState] = useState<
    { status: "idle" | "added" } | { status: "error"; code: CartErrorCode }
  >({ status: "idle" });
  const t = getDictionary(locale);
  const errorAction =
    state.status === "error" ? cartErrorAction(state.code, locale) : undefined;
  const variant =
    variantId === undefined
      ? product.variants[0]
      : product.variants.find((v) => v.id === variantId);
  const unsupportedPlan =
    product.requiresSellingPlan || product.hasSellingPlans;
  const canPurchase =
    product.available && !unsupportedPlan && Boolean(variant?.available);
  async function add() {
    if (!variant || !canPurchase || loading || disabled) return;
    setState({ status: "idle" });
    try {
      await addLines([{ merchandiseId: variant.id, quantity: 1 }]);
      onAdded?.();
      setState({ status: "added" });
    } catch (error) {
      setState({ status: "error", code: cartErrorCode(error) });
    }
  }
  if (isProductTestMode())
    return (
      <Link
        className={compact ? "text-button" : "button button-dark"}
        href={interestHref(locale, product.handle, variant?.id)}
      >
        {productTestCopy[locale].cta} <ArrowUpRight size={17} aria-hidden />
      </Link>
    );
  return (
    <div className="add-control">
      <button
        className={compact ? "text-button" : "button button-dark"}
        disabled={disabled || loading || !canPurchase}
        onClick={add}
      >
        {!canPurchase
          ? t.unavailable
          : loading
            ? t.adding
            : state.status === "added"
              ? t.added
              : t.add}
        {state.status === "added" ? (
          <Check size={17} aria-hidden />
        ) : (
          <ArrowUpRight size={17} aria-hidden />
        )}
      </button>
      <span
        className={
          state.status === "error"
            ? "field-error"
            : state.status === "added"
              ? "add-confirmation"
              : "sr-only"
        }
        role="status"
      >
        {state.status === "error"
          ? cartErrorMessage(state.code, locale)
          : state.status === "added"
            ? t.added
            : ""}
      </span>
      {(state.status === "added" || errorAction) && (
        <Link
          className="text-link cart-next-step"
          href={errorAction?.href ?? `/${locale}/cart`}
        >
          {errorAction?.label ?? t.cart} ↗
        </Link>
      )}
    </div>
  );
}
