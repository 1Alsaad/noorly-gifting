"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale, ProductImage } from "@/types/commerce";

export function ProductGallery({
  images,
  locale,
  title,
}: {
  images: ProductImage[];
  locale: Locale;
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current)
    return (
      <div className="product-detail-image" role="img" aria-label={title}>
        <p className="product-note">
          {locale === "sv" ? "Produktbild saknas" : "Product image unavailable"}
        </p>
      </div>
    );
  return (
    <div className="product-gallery">
      <a
        className="product-detail-image gallery-main"
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${locale === "sv" ? "Öppna stor bild" : "Open full-size image"}: ${title}`}
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          sizes="(max-width:760px) 90vw, 50vw"
          priority
        />
        <span className="gallery-zoom">
          {locale === "sv" ? "Visa större ↗" : "View larger ↗"}
        </span>
      </a>
      {images.length > 1 && (
        <div
          className="gallery-thumbnails"
          aria-label={locale === "sv" ? "Produktbilder" : "Product images"}
        >
          {images.map((image, i) => (
            <button
              type="button"
              key={image.url}
              onClick={() => setIndex(i)}
              aria-pressed={index === i}
              aria-label={`${locale === "sv" ? "Bild" : "Image"} ${i + 1}: ${image.alt}`}
            >
              <Image src={image.url} alt="" width={80} height={80} />
            </button>
          ))}
        </div>
      )}
      <p className="gallery-caption">
        {index + 1} / {images.length} · {title}
      </p>
      <noscript>
        <p>
          {images.map((image, i) => (
            <a key={image.url} href={image.url}>
              {locale === "sv" ? "Bild" : "Image"} {i + 1} ·{" "}
            </a>
          ))}
        </p>
      </noscript>
    </div>
  );
}
