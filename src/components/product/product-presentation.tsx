"use client";

import { useState, type ReactNode } from "react";
import { getDictionary } from "@/content/translations";
import type { Locale, Product } from "@/types/commerce";
import { ProductGallery } from "./product-gallery";
import { ProductPurchase } from "./product-purchase";
import { variantLabel } from "./variant-picker";

export function ProductPresentation({
  product,
  locale,
  children,
}: {
  product: Product;
  locale: Locale;
  children: ReactNode;
}) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const variant = product.variants.find((item) => item.id === variantId);
  const galleryImages = variant?.images?.length
    ? product.variants.length === 1
      ? [...variant.images, ...product.images].filter(
          (image, index, images) =>
            images.findIndex((item) => item.url === image.url) === index,
        )
      : variant.images
    : product.images;
  const t = getDictionary(locale);
  return (
    <div className="product-detail">
      <div>
        <ProductGallery
          key={variantId}
          images={galleryImages}
          locale={locale}
          title={
            variant?.color
              ? variantLabel(variant, locale)
              : product.title[locale]
          }
        />
        {product.included && (
          <p className="product-note gallery-included">
            {product.included[locale]}
          </p>
        )}
        {product.variants.some((item) => item.images?.length) && (
          <noscript>
            <ul>
              {product.variants
                .filter((item) => item.images?.length)
                .map((item) => (
                  <li key={item.id}>
                    <a href={item.images?.[0]?.url}>
                      {item.title === "Default Title"
                        ? product.title[locale]
                        : variantLabel(item, locale)}
                    </a>
                  </li>
                ))}
            </ul>
          </noscript>
        )}
      </div>
      <div className="product-detail-copy">
        <p className="eyebrow">
          {product.category === "box" ? t.boxes : t.edition}
        </p>
        <h1>{product.title[locale]}</h1>
        <p>{product.description[locale]}</p>
        {product.highlights && (
          <ul className="product-highlights">
            {product.highlights.map((item) => (
              <li key={item.en}>{item[locale]}</li>
            ))}
          </ul>
        )}
        <ProductPurchase
          product={product}
          locale={locale}
          variantId={variantId}
          onVariantChange={setVariantId}
        />
        {children}
      </div>
    </div>
  );
}
