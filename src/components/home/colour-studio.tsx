"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { colourProductHref, colourStories } from "@/content/colour-story";
import { launchSandChoices } from "@/content/launch-bundle";
import { candleSandHandle } from "@/content/launch-catalog";
import { formatMoney } from "@/lib/utils/money";
import type { Locale, Product } from "@/types/commerce";
import "./colour-studio.css";

const studioChoices = colourStories.map((story) => ({
  ...story,
  choice: launchSandChoices.find((choice) => choice.sku === story.sku)!,
}));

export function ColourStudio({
  locale,
  product,
}: {
  locale: Locale;
  product?: Product;
}) {
  const titleId = useId();
  const sandProduct =
    product?.handle === candleSandHandle ? product : undefined;
  const [selectedSku, setSelectedSku] = useState<string>(() => {
    const availableStory = studioChoices.find((story) =>
      sandProduct?.variants.some(
        (variant) => variant.sku === story.sku && variant.available,
      ),
    );
    return (availableStory ?? studioChoices[0]).sku;
  });
  const selected =
    studioChoices.find((story) => story.sku === selectedSku) ??
    studioChoices[0];
  const variant = sandProduct?.variants.find(
    (item) => item.sku === selected.sku,
  );
  const missingVariant = !!sandProduct && !sandProduct.previewOnly && !variant;
  const colour = selected.choice.color.name[locale];
  const scent = selected.choice.scent[locale];
  const photo = {
    url: selected.choice.photo.url,
    alt: selected.choice.photo.alt[locale],
  };
  const price =
    !sandProduct?.previewOnly &&
    variant &&
    Number.isFinite(variant.price.amount) &&
    variant.price.amount > 0
      ? formatMoney(variant.price, locale)
      : undefined;
  const style = {
    "--studio-background": selected.background,
    "--studio-ink": selected.ink,
  } as CSSProperties;
  const chooseLabel = locale === "sv" ? "Välj din färg" : "Choose your colour";

  return (
    <section
      id="colour-studio"
      className="colour-studio"
      style={style}
      aria-labelledby={titleId}
      data-tone={selected.tone}
    >
      <div className="colour-studio__inner">
        <header className="colour-studio__header">
          <p className="colour-studio__chapter">
            <span>01</span>
            {locale === "sv" ? "Färgstudion" : "Colour studio"}
          </p>
          <h2 id={titleId}>
            {locale === "sv" ? (
              <>
                Ditt hem.
                <br />
                Din färg.
              </>
            ) : (
              <>
                Your home.
                <br />
                Your colour.
              </>
            )}
          </h2>
        </header>

        <div className="colour-studio__stage">
          <span className="colour-studio__word" aria-hidden="true">
            {selected.word[locale]}
          </span>
          <div className="colour-studio__picture" key={selected.sku}>
            <Image
              className="colour-studio__photo"
              src={photo.url}
              alt={photo.alt}
              width={800}
              height={800}
              sizes="(max-width: 680px) 86vw, (max-width: 1000px) 62vw, 650px"
            />
          </div>
          <p className="colour-studio__contents">
            <strong>300 g</strong>
            <span>{locale === "sv" ? "+ 4 vekar" : "+ 4 wicks"}</span>
          </p>
        </div>

        <div className="colour-studio__footer">
          <div className="colour-studio__selection">
            <p className="colour-studio__label">
              {locale === "sv"
                ? "Fyra färger att börja med"
                : "Four colours to start with"}
            </p>
            <div
              className="colour-studio__choices"
              role="group"
              aria-label={chooseLabel}
            >
              {studioChoices.map((story) => (
                <button
                  type="button"
                  key={story.sku}
                  className="colour-studio__choice"
                  aria-pressed={selected.sku === story.sku}
                  onClick={() => setSelectedSku(story.sku)}
                >
                  <span
                    className="colour-studio__swatch"
                    style={{ backgroundColor: story.choice.color.hex }}
                    aria-hidden="true"
                  >
                    {selected.sku === story.sku ? <span /> : null}
                  </span>
                  <span>{story.choice.color.name[locale]}</span>
                </button>
              ))}
            </div>
            <Link
              className="colour-studio__all"
              href={`/${locale}/products/${candleSandHandle}`}
            >
              {locale === "sv"
                ? "Se alla färger & dofter"
                : "See all colours & scents"}{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <noscript>
              <style>{`.colour-studio__choices { display: none; }`}</style>
              <nav className="colour-studio__fallback" aria-label={chooseLabel}>
                {studioChoices.map((story) => (
                  <a
                    key={story.sku}
                    href={
                      sandProduct &&
                      !sandProduct.previewOnly &&
                      !sandProduct.variants.some(
                        (item) => item.sku === story.sku,
                      )
                        ? `/${locale}/products/${candleSandHandle}`
                        : colourProductHref(locale, story.sku)
                    }
                  >
                    {story.choice.color.name[locale]}
                  </a>
                ))}
              </nav>
            </noscript>
          </div>

          <div className="colour-studio__product">
            <div aria-live="polite" aria-atomic="true">
              <p className="colour-studio__type">
                {locale === "sv" ? "Ljussand · 300 g" : "Candle sand · 300 g"}
              </p>
              <p className="colour-studio__mood">{selected.mood[locale]}</p>
              <h3>{colour}</h3>
              <p className="colour-studio__scent">
                {scent}
                {price ? (
                  <span className="colour-studio__price">{price}</span>
                ) : null}
              </p>
              {(missingVariant || (variant && !variant.available)) && (
                <p className="colour-studio__availability">
                  {locale === "sv"
                    ? "Tillfälligt slut"
                    : "Currently unavailable"}
                </p>
              )}
            </div>
            <Link
              className="colour-studio__cta"
              href={
                missingVariant
                  ? `/${locale}/products/${candleSandHandle}`
                  : colourProductHref(locale, selected.sku)
              }
            >
              {missingVariant
                ? locale === "sv"
                  ? "Se tillgängliga färger"
                  : "See available colours"
                : locale === "sv"
                  ? `Upptäck ${colour}`
                  : `Discover ${colour}`}
              <ArrowUpRight size={21} strokeWidth={1.6} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
