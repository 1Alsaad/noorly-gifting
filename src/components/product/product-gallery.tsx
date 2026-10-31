"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const current = images[index] ?? images[0];
  const move = (direction: number) =>
    setIndex(
      (previous) => (previous + direction + images.length) % images.length,
    );
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
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <div className="gallery-stage">
          <Dialog.Trigger asChild>
            <a
              className="product-detail-image gallery-main"
              href={current.url}
              onClick={(event) => {
                event.preventDefault();
                setOpen(true);
              }}
              aria-label={`${locale === "sv" ? "Öppna stor bild" : "Open full-size image"}: ${title}`}
            >
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="(max-width:760px) 94vw, (max-width:1200px) 52vw, 660px"
                priority
              />
              <span className="gallery-position" aria-hidden="true">
                {index + 1} / {images.length}
              </span>
              <span className="gallery-zoom">
                <Expand size={14} aria-hidden="true" />
                {locale === "sv" ? "Visa större +" : "View larger +"}
              </span>
            </a>
          </Dialog.Trigger>
          {images.length > 1 && (
            <div className="gallery-navigation">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label={
                  locale === "sv" ? "Föregående bild" : "Previous image"
                }
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label={locale === "sv" ? "Nästa bild" : "Next image"}
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="gallery-overlay product-shopping-overlay" />
          <Dialog.Content
            className="gallery-lightbox product-shopping-lightbox"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                move(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          >
            <div className="gallery-lightbox-header">
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Close
                className="gallery-lightbox-close"
                aria-label={
                  locale === "sv"
                    ? "Stäng bildgalleriet"
                    : "Close image gallery"
                }
              >
                ×
              </Dialog.Close>
            </div>
            <div
              className="gallery-lightbox-image"
              onTouchStart={(event) => {
                touchStart.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const end = event.changedTouches[0]?.clientX;
                if (touchStart.current !== null && end !== undefined) {
                  const distance = end - touchStart.current;
                  if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1);
                }
                touchStart.current = null;
              }}
              onTouchCancel={() => {
                touchStart.current = null;
              }}
            >
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="(max-width: 1000px) 94vw, 1000px"
              />
            </div>
            <div className="gallery-lightbox-controls">
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => move(-1)}
                  style={{ display: "grid", placeItems: "center" }}
                  aria-label={
                    locale === "sv" ? "Föregående bild" : "Previous image"
                  }
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
              )}
              <p aria-live="polite">
                {index + 1} / {images.length}
              </p>
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => move(1)}
                  style={{ display: "grid", placeItems: "center" }}
                  aria-label={locale === "sv" ? "Nästa bild" : "Next image"}
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              )}
            </div>
            <Dialog.Description className="gallery-lightbox-caption">
              {current.alt}
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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
