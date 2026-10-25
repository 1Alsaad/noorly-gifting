"use client";
import { isProductTestMode, productTestCopy } from "@/config/product-test";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Locale, Product } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { formatMoney } from "@/lib/utils/money";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { trackEvent } from "@/lib/analytics/client";
import { VariantPicker, variantLabel } from "./variant-picker";
import {
  launchCatalogCopy,
  launchProductDefinitions,
} from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
import {
  BundleValue,
  ProductProof,
  PurchaseAnswers,
  PurchaseConfidence,
} from "./purchase-confidence";

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
  const preorder = launchProductDefinitions.some(
    ({ handle }) => handle === product.handle,
  );
  const test = isProductTestMode();
  const canPurchase =
    !test &&
    product.available &&
    !unsupportedPlan &&
    Boolean(selected?.available);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const [pastPurchase, setPastPurchase] = useState(false);
  const purchaseId = `purchase-${product.handle}`;
  useEffect(() => {
    const target = purchaseRef.current;
    if (!target) return;
    let frame = 0;
    // Direct anchor/keyboard jumps can skip an intersection threshold entirely.
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setPastPurchase(target.getBoundingClientRect().bottom <= 0);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  function choose(id: string) {
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
  }
  return (
    <div className="purchase-panel">
      {preorder && <ProductProof product={product} locale={locale} />}
      <p className="product-price" aria-live="polite">
        {formatMoney(selected?.price ?? product.price, locale)}
      </p>
      {preorder && !test && !product.previewOnly && (
        <p className="purchase-total-note">
          {locale === "sv"
            ? "Inklusive moms och leverans inom Sverige. Ingen extra fraktavgift."
            : "Includes VAT and Sweden delivery. No additional shipping charge."}
        </p>
      )}
      {product.handle === launchBundleHandle && !test && (
        <BundleValue variant={selected} locale={locale} />
      )}
      <p className="stock-label">
        <span aria-hidden>●</span>{" "}
        {test
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
                ? preorder
                  ? launchCatalogCopy[locale].availability
                  : t.available
                : t.unavailable}
      </p>
      <div id={purchaseId} className="purchase-anchor" tabIndex={-1}>
        {product.variants.some((variant) => variant.color) ? (
          <VariantPicker
            product={product}
            locale={locale}
            value={variantId}
            onChange={choose}
          />
        ) : (
          product.variants.length > 1 && (
            <label>
              {t.variant}
              <select
                value={variantId}
                onChange={(event) => choose(event.target.value)}
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
        {preorder && !test && <PurchaseConfidence locale={locale} />}
        <p className="product-note purchase-delivery">
          {t.deliveryText}{" "}
          <Link href={`/${locale}/shipping-returns`}>
            {t.footer.shipping} ↗
          </Link>
        </p>
        <div ref={purchaseRef}>
          <AddToCart
            key={variantId}
            product={product}
            locale={locale}
            variantId={variantId}
          />
        </div>
      </div>
      {preorder && !test && product.handle !== launchBundleHandle && (
        <Link
          className="purchase-bundle-link"
          href={`/${locale}/products/${launchBundleHandle}`}
        >
          <strong>
            {locale === "sv"
              ? "Vill du ha både skål och ljussand?"
              : "Would you like both the bowl and candle sand?"}
          </strong>
          {locale === "sv"
            ? "Se paketpriset och välj din färg & doft"
            : "See the bundle price and choose your colour & scent"}{" "}
          ↗
        </Link>
      )}
      {preorder && !test && <PurchaseAnswers locale={locale} />}
      {preorder && canPurchase && pastPurchase && (
        <aside
          className="mobile-purchase-bar"
          aria-label={
            locale === "sv" ? "Ditt produktval" : "Your product selection"
          }
        >
          <div>
            <strong>
              {formatMoney(selected?.price ?? product.price, locale)}
            </strong>
            <small>
              {selected && product.variants.length > 1
                ? variantLabel(selected, locale)
                : product.title[locale]}
            </small>
          </div>
          <a
            className="button button-dark"
            href={`#${purchaseId}`}
            onClick={() =>
              purchaseRef.current
                ?.closest(".purchase-anchor")
                ?.querySelector<HTMLElement>("input:checked, select, button")
                ?.focus()
            }
          >
            {locale === "sv" ? "Till mitt val" : "Back to my selection"}
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </aside>
      )}
    </div>
  );
}
