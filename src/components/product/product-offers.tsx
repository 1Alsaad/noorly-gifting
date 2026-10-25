"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Locale, Product } from "@/types/commerce";
import { candleSandHandle, teakBowlHandle } from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
import { bundleValue } from "@/lib/commerce/bundle-value";
import { formatMoney } from "@/lib/utils/money";
import { isProductTestMode } from "@/config/product-test";
import { cartErrorAction, cartErrorMessage } from "@/features/cart/cart-errors";
import { useProductCheckout } from "./use-product-checkout";
import { variantLabel } from "./variant-picker";
import { PaymentBadges } from "./product-badges";

export function ProductOffers({
  products,
  product,
  locale,
  variantId,
  onVariantChange,
}: {
  products: Product[];
  product: Product;
  locale: Locale;
  variantId: string;
  onVariantChange: (id: string) => void;
}) {
  const sv = locale === "sv";
  const id = useId();
  const sand = products.find(({ handle }) => handle === candleSandHandle);
  const bowl = products.find(({ handle }) => handle === teakBowlHandle);
  const bundle = products.find(({ handle }) => handle === launchBundleHandle);
  const [sandChoice, setSandChoice] = useState(sand?.variants[0]?.id ?? "");
  const [offer, setOffer] = useState(launchBundleHandle);
  const quick = useProductCheckout(locale);
  const selectedSand = sand?.variants.find(
    ({ id }) =>
      id === (product.handle === candleSandHandle ? variantId : sandChoice),
  );
  // Match the native bundle's actual component ID; never substitute another colour.
  const selectedBundle = bundle?.variants.find(({ components }) =>
    components?.some(
      ({ product: component, variant }) =>
        component.handle === candleSandHandle &&
        variant.id === selectedSand?.id,
    ),
  );
  const value = bundleValue(selectedBundle);
  if (!sand || !bowl || !bundle) return null;
  const options = [
    {
      product: sand,
      variant: selectedSand,
      title: "Luma",
      detail: sv ? "300 g ljussand · 4 vekar" : "300 g candle sand · 4 wicks",
    },
    {
      product: bowl,
      variant: bowl.variants[0],
      title: "Alva",
      detail: sv ? "En handgjord teakskål" : "One handmade teak bowl",
    },
    {
      product: bundle,
      variant: selectedBundle,
      title: "Luma + Alva",
      detail: sv
        ? "Teakskål + 300 g ljussand · 4 vekar"
        : "Teak bowl + 300 g candle sand · 4 wicks",
    },
  ];
  const selected = options.find(({ product: item }) => item.handle === offer)!;
  const available = (item: typeof selected) =>
    !isProductTestMode() &&
    !item.product.previewOnly &&
    item.product.available &&
    !item.product.requiresSellingPlan &&
    !item.product.hasSellingPlans &&
    Boolean(item.variant?.available);
  const action = quick.error ? cartErrorAction(quick.error, locale) : undefined;
  const money = (amount: number) =>
    formatMoney({ amount, currencyCode: "SEK" }, locale);
  const photos = [
    bowl.images[0],
    selectedSand?.images?.[0] ?? sand.images[0],
  ].filter(Boolean);
  return (
    <section className="product-offers" aria-labelledby={`${id}-title`}>
      <div className="offer-intro">
        <p className="eyebrow">
          {sv
            ? "Fint var för sig. Bättre tillsammans."
            : "Lovely alone. Better together."}
        </p>
        <h2 id={`${id}-title`}>
          {sv ? "Din stund, ditt val." : "Your moment, your choice."}
        </h2>
        <div className="offer-photos">
          {photos.map((photo) => (
            <div key={photo.url}>
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="(max-width: 680px) 45vw, 260px"
              />
            </div>
          ))}
        </div>
        <p className="offer-vessel-note">
          {sv
            ? "Skålen är dekorativ. Använd ett separat, värmetåligt ljuskärl för att tända ljussanden."
            : "The bowl is decorative. Burn candle sand in a separate, heat-resistant candle vessel."}
        </p>
      </div>
      <div className="offer-purchase">
        {sand.variants.length > 0 && (
          <label className="offer-colour" htmlFor={`${id}-colour`}>
            {sv ? "Färg & doft på ljussanden" : "Candle sand colour & scent"}
            <select
              id={`${id}-colour`}
              value={selectedSand?.id ?? ""}
              disabled={quick.pending || quick.loading}
              onChange={(event) => {
                quick.reset();
                setSandChoice(event.target.value);
                if (product.handle === candleSandHandle)
                  onVariantChange(event.target.value);
              }}
            >
              {sand.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variantLabel(variant, locale)}
                </option>
              ))}
            </select>
          </label>
        )}
        <fieldset
          className="offer-options"
          disabled={quick.pending || quick.loading}
        >
          <legend>{sv ? "Välj ditt alternativ" : "Choose your option"}</legend>
          {options.map((option) => {
            const paired = option.product.handle === launchBundleHandle;
            return (
              <label
                key={option.product.id}
                className={`offer-option${paired ? " offer-recommended" : ""}${offer === option.product.handle ? " is-selected" : ""}`}
              >
                {paired && (
                  <span className="offer-ribbon">
                    {sv ? "Paketpris" : "Bundle price"}
                    {value
                      ? ` · ${sv ? "Spara" : "Save"} ${money(value.saving)}`
                      : ""}
                  </span>
                )}
                <input
                  type="radio"
                  aria-label={`${option.title} · ${formatMoney(option.variant?.price ?? option.product.price, locale)}`}
                  name={`${id}-offer`}
                  value={option.product.handle}
                  checked={offer === option.product.handle}
                  disabled={!available(option)}
                  onChange={() => {
                    quick.reset();
                    setOffer(option.product.handle);
                  }}
                />
                <span className="offer-option-copy">
                  <strong>{option.title}</strong>
                  <span>{option.detail}</span>
                  {paired && value && (
                    <small>
                      {sv ? "Separat idag" : "Separately today"}:{" "}
                      {money(value.separate)}
                    </small>
                  )}
                  {!available(option) && (
                    <small>
                      {sv ? "Ej tillgänglig just nu" : "Currently unavailable"}
                    </small>
                  )}
                </span>
                <strong className="offer-option-price">
                  {formatMoney(
                    option.variant?.price ?? option.product.price,
                    locale,
                  )}
                </strong>
              </label>
            );
          })}
        </fieldset>
        <p className="offer-selected" aria-live="polite">
          <Check size={15} aria-hidden="true" />
          {selected.title} ·{" "}
          {formatMoney(
            selected.variant?.price ?? selected.product.price,
            locale,
          )}
        </p>
        <p className="purchase-preorder stock-label">
          <strong>{sv ? "Förbeställning" : "Pre-order"}</strong>
          {sv
            ? " · Skickas när varan är i lager. Datum ej bekräftat."
            : " · Ships when in stock. Date not yet confirmed."}
        </p>
        <button
          className="button button-dark"
          disabled={
            !available(selected) ||
            quick.pending ||
            quick.loading ||
            Boolean(action)
          }
          onClick={() =>
            void quick.start(selected.variant?.id ?? "", available(selected))
          }
        >
          {quick.pending
            ? sv
              ? "Öppnar kassan…"
              : "Opening checkout…"
            : `${sv ? "Till kassan med" : "Checkout with"} ${selected.title}`}
          <ArrowRight size={17} aria-hidden="true" />
        </button>
        {quick.error && (
          <div className="field-error" role="alert">
            <p>{cartErrorMessage(quick.error, locale)}</p>
            <Link href={action?.href ?? `/${locale}/cart`}>
              {action?.label ?? (sv ? "Öppna varukorgen" : "Open your bag")} ↗
            </Link>
          </div>
        )}
        <p className="offer-shipping">
          {sv
            ? "Frakt inom Sverige och moms ingår"
            : "Sweden delivery and VAT included"}
        </p>
        <PaymentBadges locale={locale} />
      </div>
    </section>
  );
}
