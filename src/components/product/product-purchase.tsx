"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { Locale, Product } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { formatMoney } from "@/lib/utils/money";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { trackEvent } from "@/lib/analytics/client";
import {
  supportsStandardPurchase,
  purchasePendingCopy,
} from "@/lib/commerce/purchase-options";
export function ProductPurchase({
  product,
  locale,
  intro,
  details,
}: {
  product: Product;
  locale: Locale;
  intro?: ReactNode;
  details?: ReactNode;
}) {
  const [variantId, setVariant] = useState(product.variants[0]?.id);
  const t = getDictionary(locale);
  const selected = product.variants.find((v) => v.id === variantId);
  const image = selected?.image ?? product.images[0];
  const purchaseReady = supportsStandardPurchase(product);
  return (
    <div className="product-detail">
      <div className="product-detail-image">
        {image && (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(max-width:760px) 90vw, 50vw"
            priority
          />
        )}
      </div>
      <div className="product-detail-copy">
        {intro}
        <div className="purchase-panel">
          <p className="product-price">
            {formatMoney(selected?.price ?? product.price, locale)}
          </p>
          <p className="stock-label">
            <span aria-hidden>?</span>{" "}
            {!purchaseReady
              ? purchasePendingCopy[locale]
              : product.available && selected?.available
                ? t.available
                : t.unavailable}
          </p>
          {product.variants.length > 1 && (
            <label>
              {t.variant}
              <select
                value={variantId}
                onChange={(e) => {
                  setVariant(e.target.value);
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
                    {!v.available ? ` � ${t.unavailable}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <AddToCart product={product} locale={locale} variantId={variantId} />
          {purchaseReady &&
            product.boxEligible &&
            product.category !== "packaging" && (
              <Link
                className="button button-outline"
                href={`/${locale}/build-a-box?product=${product.handle}`}
              >
                {t.builder}
              </Link>
            )}
        </div>
        {details}
      </div>
    </div>
  );
}
