"use client";

import { useState } from "react";
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
  onDetails: (product: Product, trigger: HTMLButtonElement) => void;
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
          {new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-SE", {
            style: "currency",
            currency: price.currencyCode,
            maximumFractionDigits: 0,
          }).format(Number(price.amount))}
        </span>
        <span className="cinema-stock">
          {variant?.available ? copy.available : copy.unavailable}
        </span>
      </div>
      {product.variants.length > 1 && (
        <label className="cinema-variant-label">
          {copy.variant}
          <select
            value={variantId}
            onChange={(event) => {
              setVariantId(event.target.value);
              setStatus("idle");
            }}
          >
            {product.variants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
                {!item.available ? ` — ${copy.unavailable}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
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
      <p className="cinema-add-status" role="status" aria-live="polite">
        {status === "error"
          ? copy.addError
          : status === "added"
            ? copy.added
            : ""}
      </p>
      <div className="cinema-shopping-links">
        <button
          type="button"
          className="cinema-details-link"
          aria-haspopup="dialog"
          onClick={(event) => onDetails(product, event.currentTarget)}
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
