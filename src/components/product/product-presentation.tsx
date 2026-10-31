"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getDictionary } from "@/content/translations";
import type { Locale, Product } from "@/types/commerce";
import { ProductGallery } from "./product-gallery";
import { ProductPurchase } from "./product-purchase";
import { variantLabel } from "./variant-picker";
import {
  candleSandHandle,
  launchProductDefinitions,
  teakBowlHandle,
} from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
import { ProductOffers } from "./product-offers";
import { colourStory } from "@/content/colour-story";
import "./product-shopping.css";

export function ProductPresentation({
  product,
  locale,
  children,
  offers,
  initialVariantSku,
}: {
  product: Product;
  locale: Locale;
  children: ReactNode;
  offers?: Product[];
  initialVariantSku?: string;
}) {
  const [variantId, setVariantId] = useState(
    () =>
      (initialVariantSku
        ? product.variants.find((item) => item.sku === initialVariantSku)?.id
        : undefined) ??
      product.variants[0]?.id ??
      "",
  );
  const offersRef = useRef<HTMLDivElement>(null);
  const variant = product.variants.find((item) => item.id === variantId);
  const story = colourStory(variant?.sku);
  const actualColour = variant?.color?.hex ?? "";
  const galleryTone =
    story?.background ??
    (/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(actualColour)
      ? actualColour
      : "#ede6d4");
  const galleryImages = variant?.images?.length
    ? product.variants.length === 1
      ? [...variant.images, ...product.images].filter(
          (image, index, images) =>
            images.findIndex((item) => item.url === image.url) === index,
        )
      : variant.images
    : product.images;
  const t = getDictionary(locale);
  const simple = launchProductDefinitions.some(
    ({ handle }) => handle === product.handle,
  );
  const bowl = product.handle === teakBowlHandle;
  const bundle = product.handle === launchBundleHandle;
  const sand = product.handle === candleSandHandle;
  const titleParts = simple ? product.title[locale].split(" · ") : [];
  const productName = titleParts[0];
  const productDetail = titleParts.slice(1).join(" · ");
  const bowlStudioImage = {
    url: "/media/products/alva/noorly-alva-studio.webp",
    alt:
      locale === "sv"
        ? "Alva dekorativ teakskål, stylad produktbild"
        : "Alva decorative teak bowl, styled product image",
  };
  return (
    <>
      <div
        className={`product-detail product-shopping${simple ? " product-detail-simple" : ""}`}
        data-colour-story={story?.tone ?? "custom"}
        data-product-kind={bowl ? "bowl" : bundle ? "bundle" : "sand"}
        style={
          {
            "--product-gallery-tone": bowl ? "#f3d35c" : galleryTone,
          } as CSSProperties
        }
      >
        <div className="product-shopping-gallery">
          {simple && (
            <div className="product-stage-label" aria-hidden="true">
              <span>NOORLY / {productName}</span>
              <span>
                {bowl
                  ? locale === "sv"
                    ? "NATURLIG TEAK"
                    : "NATURAL TEAK"
                  : bundle
                    ? locale === "sv"
                      ? "TVÅ FAVORITER"
                      : "TWO FAVOURITES"
                    : "300 G"}
              </span>
            </div>
          )}
          <ProductGallery
            key={variantId}
            images={bowl ? [bowlStudioImage, ...galleryImages] : galleryImages}
            styledImageUrl={bowl ? bowlStudioImage.url : undefined}
            locale={locale}
            title={
              variant?.color
                ? variantLabel(variant, locale)
                : product.title[locale]
            }
          />
          {product.included && !simple && (
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
          {!simple && (
            <p className="eyebrow">
              {product.category === "box" ? t.boxes : t.edition}
            </p>
          )}
          <div className="product-shopping-heading">
            {simple && (
              <p className="product-shopping-kicker">
                {bowl
                  ? locale === "sv"
                    ? "FORMAD AV NATUREN"
                    : "SHAPED BY NATURE"
                  : sand
                    ? locale === "sv"
                      ? "FÄRG FÖR DIN VARDAG"
                      : "COLOUR FOR YOUR EVERYDAY"
                    : locale === "sv"
                      ? "ETT PAR FÖR DITT HEM"
                      : "A PAIR FOR YOUR HOME"}
              </p>
            )}
            <h1>
              {simple && productDetail ? (
                <>
                  <span className="product-title-name">{productName}</span>{" "}
                  <span className="product-title-detail">
                    · {productDetail}
                  </span>
                </>
              ) : (
                product.title[locale]
              )}
            </h1>
            {simple ? (
              <p className="product-note purchase-contents">
                {product.included?.[locale] ?? product.description[locale]}
              </p>
            ) : (
              <p>{product.description[locale]}</p>
            )}
          </div>
          {product.highlights && !simple && (
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
            stickyBoundary={offersRef}
          />
          <div className="product-shopping-details">{children}</div>
        </div>
      </div>
      {offers && (
        <div ref={offersRef}>
          <ProductOffers
            products={offers}
            product={product}
            locale={locale}
            variantId={variantId}
            onVariantChange={setVariantId}
          />
        </div>
      )}
    </>
  );
}
