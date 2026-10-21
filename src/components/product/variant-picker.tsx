"use client";

import { useId } from "react";
import type { Locale, Product, ProductVariant } from "@/types/commerce";

export function variantLabel(variant: ProductVariant, locale: Locale) {
  return variant.label?.[locale] ?? variant.title;
}

export function VariantPicker({
  product,
  locale,
  value,
  onChange,
  compact = false,
}: {
  product: Product;
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const id = useId();
  if (product.variants.length < 2) return null;
  const colours = product.variants.every((variant) => variant.color);
  const label = colours
    ? locale === "sv"
      ? "Färg & doft"
      : "Colour & scent"
    : locale === "sv"
      ? "Utförande"
      : "Variant";
  const unavailable = locale === "sv" ? "Tillfälligt slut" : "Unavailable";
  if (compact || !colours)
    return (
      <label className="cinema-variant-label">
        {label}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {product.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variantLabel(variant, locale)}
              {!variant.available ? ` — ${unavailable}` : ""}
            </option>
          ))}
        </select>
      </label>
    );
  const selected = product.variants.find((variant) => variant.id === value);
  return (
    <fieldset className="variant-picker">
      <legend>{label}</legend>
      <p className="selected-variant" aria-live="polite">
        {selected ? variantLabel(selected, locale) : ""}
      </p>
      <div className="variant-swatches">
        {product.variants.map((variant) => (
          <label
            key={variant.id}
            title={variantLabel(variant, locale)}
            className="variant-swatch"
          >
            <input
              type="radio"
              name={id}
              value={variant.id}
              checked={variant.id === value}
              onChange={() => onChange(variant.id)}
              aria-label={`${variantLabel(variant, locale)}${!variant.available ? ` — ${unavailable}` : ""}`}
            />
            <span
              className="swatch-dot"
              style={{ backgroundColor: variant.color?.hex }}
              aria-hidden="true"
            >
              {variant.id === value ? "✓" : ""}
            </span>
            <span className="swatch-name">
              {variant.color?.name[locale]}
              {variant.sku === "CSand-11"
                ? locale === "sv"
                  ? " · doftfri"
                  : " · unscented"
                : ""}
            </span>
          </label>
        ))}
      </div>
      <p className="product-note">
        {locale === "sv"
          ? "Varje färg har en egen doft. Färger kan skilja sig mellan skärmar."
          : "Each colour has its own fragrance. Colours may vary between screens."}
      </p>
    </fieldset>
  );
}
