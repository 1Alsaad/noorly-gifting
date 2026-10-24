"use client";
import { isProductTestMode, productTestCopy } from "@/config/product-test";
import Link from "next/link";
import { useState } from "react";
import type { Locale, Product } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { formatMoney } from "@/lib/utils/money";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { trackEvent } from "@/lib/analytics/client";
import { VariantPicker } from "./variant-picker";
export function ProductPurchase({
  product,
  locale,
  variantId: controlledVariant,
  onVariantChange,
}: {
  product: Product;
  locale: Locale;
  variantId?: string;
  onVariantChange?: (id: string) => void;
}) {
  const [localVariant, setVariant] = useState(product.variants[0]?.id);
  const variantId = controlledVariant ?? localVariant ?? "";
  const t = getDictionary(locale);
  const selected = product.variants.find((v) => v.id === variantId);
  const unsupportedPlan =
    product.requiresSellingPlan || product.hasSellingPlans;
  return (
    <div className="purchase-panel">
      <p className="product-price">
        {formatMoney(selected?.price ?? product.price, locale)}
      </p>
      <p className="stock-label">
        <span aria-hidden>●</span>{" "}
        {isProductTestMode()
          ? productTestCopy[locale].note
          : product.previewOnly
            ? locale === "sv"
              ? "Demopris · ej till försäljning"
              : "Demo price · not on sale"
            : unsupportedPlan
              ? locale === "sv"
                ? "Det här köpalternativet är inte tillgängligt ännu."
                : "This purchase option is not available yet."
              : selected?.available && product.available
                ? t.available
                : t.unavailable}
      </p>
      {product.variants.some((variant) => variant.color) ? (
        <VariantPicker
          product={product}
          locale={locale}
          value={variantId}
          onChange={(id) => {
            setVariant(id);
            onVariantChange?.(id);
            trackEvent({
              name: "product_variant_selected",
              properties: {
                locale,
                product_handle: product.handle,
                variant_id: id,
              },
            });
          }}
        />
      ) : (
        product.variants.length > 1 && (
          <label>
            {t.variant}
            <select
              value={variantId}
              onChange={(e) => {
                setVariant(e.target.value);
                onVariantChange?.(e.target.value);
                trackEvent({
                  name: "product_variant_selected",
                  properties: {
                    locale,
                    product_handle: product.handle,
                    variant_id: e.target.value,
                  },
                });
              }}
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                  {!v.available ? ` · ${t.unavailable}` : ""}
                </option>
              ))}
            </select>
          </label>
        )
      )}
      <p className="product-note purchase-delivery">
        {t.deliveryText}{" "}
        <Link href={`/${locale}/shipping-returns`}>{t.footer.shipping} ↗</Link>
      </p>
      <AddToCart
        key={variantId}
        product={product}
        locale={locale}
        variantId={variantId}
      />
    </div>
  );
}
