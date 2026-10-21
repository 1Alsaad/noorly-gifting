"use client";

import {
  isProductTestMode,
  productTestCopy,
  interestHref,
} from "@/config/product-test";
import { useState } from "react";
import Link from "next/link";
import { VariantPicker } from "@/components/product/variant-picker";
import { useCart } from "@/features/cart/cart-provider";
import { cinematicCopy } from "@/features/seasonal-experience/copy";
import type { Locale, Product } from "@/types/commerce";

export function ShoppingOverlay({
  product,
  locale,
  visible,
  onDetails,
  onSkip,
}: {
  product: Product;
  locale: Locale;
  visible: boolean;
  onDetails: (
    product: Product,
    trigger: HTMLButtonElement,
    variantId: string,
  ) => void;
  onSkip: () => void;
}) {
  const copy = cinematicCopy[locale];
  const { addLines, loading } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">(
    "idle",
  );
  const [focused, setFocused] = useState(false);
  const variant = product.variants.find((item) => item.id === variantId);
  const price = variant?.price ?? product.price;
  const shown = visible || focused;

  async function add() {
    if (!variant?.available || loading || status === "adding") return;
    setStatus("adding");
    try {
      await addLines([{ merchandiseId: variant.id, quantity: 1 }]);
      setStatus("added");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="cinema-shopping"
      data-visible={shown}
      inert={!shown}
      aria-hidden={!shown}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <p className="cinema-kicker">{copy.product}</p>
      <h2 className="cinema-shopping-title">{product.title[locale]}</h2>
      <div className="cinema-shopping-price">
        <span>
          {isProductTestMode()
            ? productTestCopy[locale].price
            : new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-SE", {
                style: "currency",
                currency: price.currencyCode,
                maximumFractionDigits: 0,
              }).format(Number(price.amount))}
        </span>
        <span className="cinema-stock">
          {isProductTestMode()
            ? productTestCopy[locale].label
            : product.previewOnly
              ? locale === "sv"
                ? "Demopris"
                : "Demo price"
              : variant?.available
                ? copy.available
                : copy.unavailable}
        </span>
      </div>
      <VariantPicker
        product={product}
        locale={locale}
        value={variantId}
        compact
        onChange={(id) => {
          setVariantId(id);
          setStatus("idle");
        }}
      />
      {isProductTestMode() ? (
        <Link
          className="cinema-button cinema-button-dark"
          href={interestHref(locale, product.handle, variantId)}
        >
          {productTestCopy[locale].cta}
        </Link>
      ) : (
        <button
          type="button"
          className="cinema-button cinema-button-dark"
          disabled={!variant?.available || loading || status === "adding"}
          onClick={add}
        >
          {status === "adding"
            ? copy.adding
            : status === "added"
              ? copy.added
              : copy.addToCart}
        </button>
      )}
      <p className="cinema-add-status" role="status" aria-live="polite">
        {status === "error"
          ? copy.addError
          : status === "added"
            ? copy.added
            : ""}
      </p>
      <div className="cinema-shopping-links">
        {status === "added" && (
          <Link href={`/${locale}/cart`} className="cinema-details-link">
            {locale === "sv" ? "Till varukorgen" : "View cart"} ↗
          </Link>
        )}
        <button
          type="button"
          className="cinema-details-link"
          aria-haspopup="dialog"
          onClick={(event) =>
            onDetails(product, event.currentTarget, variantId)
          }
        >
          {copy.details}
        </button>
        <a className="cinema-details-link" href="#gifts" onClick={onSkip}>
          {copy.explore}
        </a>
      </div>
    </div>
  );
}
