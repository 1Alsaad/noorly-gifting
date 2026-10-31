"use client";
import { isProductTestMode, productTestCopy } from "@/config/product-test";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
import { BundleValue, PurchaseAnswers } from "./purchase-confidence";
import { useProductCheckout } from "./use-product-checkout";
import { cartErrorAction, cartErrorMessage } from "@/features/cart/cart-errors";
import { ProductBadges, PaymentBadges } from "./product-badges";

export function ProductPurchase({
  product,
  locale,
  variantId: controlledVariant,
  onVariantChange,
  stickyBoundary,
}: {
  product: Product;
  locale: Locale;
  variantId?: string;
  onVariantChange?: (id: string) => void;
  stickyBoundary?: RefObject<HTMLDivElement | null>;
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
  const quick = useProductCheckout(locale);
  const direct = preorder && !test && !product.previewOnly;
  const checkoutLabel = quick.pending
    ? locale === "sv"
      ? "Öppnar kassan…"
      : "Opening checkout…"
    : locale === "sv"
      ? "Till kassan"
      : "Checkout";
  const reviewAction = quick.error
    ? cartErrorAction(quick.error, locale)
    : undefined;
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
        const offersVisible =
          stickyBoundary?.current &&
          stickyBoundary.current.getBoundingClientRect().top <
            window.innerHeight;
        setPastPurchase(
          target.getBoundingClientRect().bottom < 0 && !offersVisible,
        );
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
  }, [stickyBoundary]);
  function choose(id: string) {
    quick.reset();
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
      <div id={purchaseId} className="purchase-anchor" tabIndex={-1}>
        <div className="purchase-price-group">
          <p className="product-price" aria-live="polite">
            {formatMoney(selected?.price ?? product.price, locale)}
          </p>
          {preorder && !test && !product.previewOnly && (
            <p className="purchase-total-note">
              {locale === "sv"
                ? "Fri frakt i Sverige · Inkl. moms"
                : "Free Sweden delivery · VAT included"}
            </p>
          )}
          {product.handle === launchBundleHandle && !test && (
            <BundleValue variant={selected} locale={locale} />
          )}
          {(!direct || !canPurchase) && (
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
          )}
        </div>
        <div className="purchase-variant-group">
          {product.variants.some((variant) => variant.color) ? (
            <VariantPicker
              product={product}
              locale={locale}
              value={variantId}
              onChange={choose}
              simple={preorder}
              disabled={quick.pending}
            />
          ) : (
            product.variants.length > 1 && (
              <label>
                {t.variant}
                <select
                  disabled={quick.pending}
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
        </div>
        <div className="purchase-checkout-group">
          {direct && (
            <p className="purchase-preorder stock-label">
              <strong>
                {locale === "sv" ? "Förbeställning" : "Pre-order"}
              </strong>
              {locale === "sv"
                ? " · Skickas när varan är i lager. Datum ej bekräftat."
                : " · Ships when in stock. Date not yet confirmed."}
            </p>
          )}
          {!preorder && (
            <p className="product-note purchase-delivery">
              {t.deliveryText}{" "}
              <Link href={`/${locale}/shipping-returns`}>
                {t.footer.shipping}{" "}
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  focusable="false"
                  className="inline-block shrink-0 align-text-bottom"
                />
              </Link>
            </p>
          )}
          <div
            ref={purchaseRef}
            className={direct ? "purchase-actions" : undefined}
          >
            {direct && (
              <button
                className="button button-dark"
                disabled={
                  !canPurchase ||
                  quick.pending ||
                  quick.loading ||
                  Boolean(reviewAction)
                }
                onClick={() => void quick.start(variantId, canPurchase)}
              >
                {canPurchase ? checkoutLabel : t.unavailable}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            )}
            {(!direct || canPurchase) && (
              <AddToCart
                key={variantId}
                product={product}
                locale={locale}
                variantId={variantId}
                compact={direct}
                disabled={quick.pending}
                onAdded={() => quick.markAdded(variantId)}
              />
            )}
            {direct && quick.error && (
              <div className="field-error" role="alert">
                <p>{cartErrorMessage(quick.error, locale)}</p>
                <Link
                  className="text-link"
                  href={reviewAction?.href ?? `/${locale}/cart`}
                >
                  {reviewAction?.label ??
                    (locale === "sv"
                      ? "Öppna varukorgen"
                      : "Open your bag")}{" "}
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    focusable="false"
                    className="inline-block shrink-0 align-text-bottom"
                  />
                </Link>
              </div>
            )}
          </div>
          {preorder && <ProductBadges product={product} locale={locale} />}
          {direct && <PaymentBadges locale={locale} />}
        </div>
      </div>
      {preorder && !test && (
        <PurchaseAnswers locale={locale} product={product} />
      )}
      {direct && canPurchase && pastPurchase && (
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
          <button
            className="button button-dark"
            disabled={quick.pending || quick.loading || Boolean(reviewAction)}
            onClick={() => void quick.start(variantId, canPurchase)}
          >
            {checkoutLabel}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
          {quick.error && (
            <p className="sticky-checkout-error" role="alert">
              {cartErrorMessage(quick.error, locale)}{" "}
              <Link href={reviewAction?.href ?? `/${locale}/cart`}>
                {locale === "sv" ? "Öppna varukorgen" : "Open your bag"}{" "}
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  focusable="false"
                  className="inline-block shrink-0 align-text-bottom"
                />
              </Link>
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
