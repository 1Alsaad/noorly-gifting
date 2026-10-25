"use client";
import {
  isProductTestMode,
  productTestCopy,
  interestHref,
} from "@/config/product-test";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import type { Product, Locale } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { useCart } from "@/features/cart/cart-provider";
import {
  cartErrorAction,
  cartErrorCode,
  cartErrorMessage,
} from "@/features/cart/cart-errors";
import { formatMoney } from "@/lib/utils/money";
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
  variantId: controlledVariantId,
  onVariantChange,
}: {
  product: Product;
  locale: Locale;
  variantId?: string;
  onVariantChange?: (value: string) => void;
}) {
  const t = getDictionary(locale);
  const [localVariantId, setLocalVariantId] = useState(
    product.variants.find((v) => v.available)?.id ?? product.variants[0]?.id,
  );
  const variantId = controlledVariantId ?? localVariantId;
  const variant =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const { addLines, loading } = useCart();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const errorAction = error ? cartErrorAction(error, locale) : undefined;
  const test = isProductTestMode();
  const preview = test || product.previewOnly === true;
  const preparation = product.variants.length === 0;
  const preorder = launchProductDefinitions.some(
    (item) => item.handle === product.handle,
  );
  const stockLabel = variant?.available
    ? preorder
      ? launchCatalogCopy[locale].availability
      : t.available
    : locale === "sv"
      ? "Tillfälligt slut"
      : "Currently unavailable";
  const unavailableText =
    locale === "sv"
      ? preparation
        ? "Den här produkten går inte att beställa just nu. Kontakta oss om du har frågor."
        : "Det valda alternativet går inte att beställa just nu. Välj ett annat alternativ eller kontakta oss."
      : preparation
        ? "This product cannot be ordered right now. Contact us with any questions."
        : "The selected option cannot be ordered right now. Choose another option or contact us.";
  const blocked = preview || !product.available || !variant?.available;
  const purchaseRef = useRef<HTMLDivElement>(null);
  const [pastPurchase, setPastPurchase] = useState(false);
  const purchaseId = `purchase-${product.handle}`;
  useEffect(() => {
    const target = purchaseRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setPastPurchase(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  async function add() {
    if (blocked || !variant) return;
    setError("");
    setAdded(false);
    try {
      await addLines([{ merchandiseId: variant.id, quantity: 1 }]);
      setAdded(true);
    } catch (error) {
      setError(cartErrorCode(error));
    }
  }
  function choose(id: string) {
    setLocalVariantId(id);
    onVariantChange?.(id);
    setAdded(false);
    setError("");
  }
  return (
    <>
      <p className="eyebrow">
        {product.category === "box" ? t.boxes : t.brandTag}
      </p>
      <h1>{product.title[locale]}</h1>
      <p>{product.description[locale]}</p>
      {preorder && <ProductProof product={product} locale={locale} />}
      <div className="product-price" aria-live="polite">
        {formatMoney(variant?.price ?? product.price, locale)}
      </div>
      {preorder && !preview && (
        <p className="purchase-total-note">
          {locale === "sv"
            ? "Inklusive moms och leverans inom Sverige. Ingen extra fraktavgift."
            : "Includes VAT and Sweden delivery. No additional shipping charge."}
        </p>
      )}
      {product.handle === launchBundleHandle && !preview && (
        <BundleValue variant={variant} locale={locale} />
      )}
      <span className="stock-label">
        {!preparation && <i data-available={Boolean(variant?.available)} />}
        {test
          ? t.unavailable
          : preparation
            ? locale === "sv"
              ? "Inte tillgänglig"
              : "Unavailable"
            : stockLabel}
      </span>
      <div id={purchaseId} className="purchase-anchor" tabIndex={-1}>
        {product.variants.length > 1 &&
          (product.variants.every((candidate) => candidate.color) ? (
            <VariantPicker
              product={product}
              locale={locale}
              value={variantId ?? ""}
              onChange={choose}
            />
          ) : (
            <label className="variant-select">
              {t.chooseVariant}
              <select value={variantId} onChange={(e) => choose(e.target.value)}>
                {product.variants.map((v) => (
                  <option value={v.id} key={v.id}>
                    {v.title}
                    {!v.available ? ` — ${t.unavailable}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ))}
        {preorder && !preview && (
          <PurchaseConfidence product={product} locale={locale} />
        )}
        <div ref={purchaseRef}>
          {blocked ? (
            <>
              <div
                className="product-status-note"
                role="note"
                aria-label={test ? t.unavailable : stockLabel}
              >
                <p>
                  {test
                    ? `${t.unavailable}. ${productTestCopy[locale].note}`
                    : unavailableText}
                </p>
                {test && (
                  <>
                    <span>{productTestCopy[locale].concept}</span>
                    <Link className="text-link" href={interestHref(locale)}>
                      {productTestCopy[locale].cta}
                      <ArrowRight size={16} />
                    </Link>
                  </>
                )}
                <a className="text-link" href="#product-photographs">
                  {locale === "sv" ? "Se produktbilderna" : "View product photographs"}
                  <ArrowDown size={16} />
                </a>
              </div>
              {!preview && (
                <button className="button button-dark add-to-cart-button" disabled>
                  {t.unavailable}
                </button>
              )}
            </>
          ) : (
            <button
              className="button button-dark add-to-cart-button"
              onClick={add}
              disabled={loading}
            >
              {added ? (
                <><Check size={16} />{t.added}</>
              ) : loading ? t.checking : t.add}
            </button>
          )}
        </div>
      </div>
      <div aria-live="polite">
        {error && (
          <p className="field-error" role="alert">
            {cartErrorMessage(error, locale)}
            {errorAction && (
              <>{" "}<Link className="text-link" href={errorAction.href}>{errorAction.label} ↗</Link></>
            )}
          </p>
        )}
        {added && (
          <Link className="text-link cart-next-step" href={`/${locale}/cart`}>
            {locale === "sv"
              ? "Visa påsen och fortsätt till kassan"
              : "View your bag and continue to checkout"}
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
      {product.highlights && (
        <div className="product-highlights">
          {product.highlights.map((h) => <span key={h[locale]}>{h[locale]}</span>)}
        </div>
      )}
      <p className="product-note">{t.deliveryText}</p>
      {preorder && !preview && product.handle !== launchBundleHandle && (
        <Link className="purchase-bundle-link" href={`/${locale}/products/${launchBundleHandle}`}>
          <strong>{locale === "sv" ? "Vill du ha både skål och ljussand?" : "Would you like both the bowl and candle sand?"}</strong>
          {locale === "sv" ? "Se paketpriset och välj din färg & doft" : "See the bundle price and choose your colour & scent"} ↗
        </Link>
      )}
      {preorder && !preview && <PurchaseAnswers locale={locale} />}
      {preorder && !blocked && pastPurchase && (
        <aside className="mobile-purchase-bar" aria-label={locale === "sv" ? "Ditt produktval" : "Your product selection"}>
          <div>
            <strong>{formatMoney(variant?.price ?? product.price, locale)}</strong>
            <small>{variant && product.variants.length > 1 ? variantLabel(variant, locale) : product.title[locale]}</small>
          </div>
          <a className="button button-dark" href={`#${purchaseId}`} onClick={() => purchaseRef.current?.closest(".purchase-anchor")?.querySelector<HTMLElement>("input, select, button")?.focus()}>
            {locale === "sv" ? "Till mitt val" : "Back to my selection"}
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </aside>
      )}
    </>
  );
}
