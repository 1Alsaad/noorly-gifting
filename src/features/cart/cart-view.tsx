"use client";
import {
  isProductTestMode,
  productTestCopy,
  interestHref,
} from "@/config/product-test";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { getDictionary } from "@/content/translations";
import type { CartLine, Locale } from "@/types/commerce";
import { formatMoney } from "@/lib/utils/money";
import { useCart } from "./cart-provider";
import { cartErrorAction, cartErrorMessage } from "./cart-errors";
import { variantLabel } from "@/components/product/variant-picker";
import {
  hasUnsupportedPurchaseOption,
  isCartLineAvailable,
} from "@/lib/commerce/cart-availability";
import "./cart-components.css";
import "@/styles/cart-storefront.css";
export function CartView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { cart, loading, error, updateLine, removeLines, checkout } = useCart();
  const errorAction = error ? cartErrorAction(error, locale) : undefined;
  const unsupportedPurchase = Boolean(
    cart?.lines.some(hasUnsupportedPurchaseOption),
  );
  const unavailableItems = Boolean(
    cart?.lines.some((line) => !isCartLineAvailable(line)),
  );
  const groups = new Map<string, CartLine[]>();
  for (const line of cart?.lines ?? []) {
    const id =
      line.attributes.find((a) => a.key === "bundle_id")?.value ??
      `line:${line.id}`;
    groups.set(id, [...(groups.get(id) ?? []), line]);
  }
  async function pay() {
    try {
      const url = await checkout(locale);
      window.location.assign(url);
    } catch {
      /* Cart provider exposes an accessible error. */
    }
  }
  if (isProductTestMode())
    return (
      <div>
        <p>{productTestCopy[locale].note}</p>
        <Link className="button button-dark" href={interestHref(locale)}>
          {productTestCopy[locale].cta}
        </Link>
      </div>
    );
  return (
    <div className="cart-storefront">
      <div className="cart-toolbar">
        <p>
          {locale === "sv" ? "Antal varor" : "Items"}
          <span>{cart?.totalQuantity ?? 0}</span>
        </p>
        <Link className="cart-continue" href={`/${locale}/shop`}>
          <ArrowLeft size={15} aria-hidden="true" />
          {locale === "sv" ? "Fortsätt handla" : "Continue shopping"}
        </Link>
      </div>
      <div className="cart-layout">
        <div className="cart-items">
          <div
            className="cart-announcement sr-only"
            role="status"
            aria-live="polite"
          >
            {cart ? `${t.cartUpdated}: ${cart.totalQuantity}` : ""}
          </div>
          {Boolean(cart?.warnings?.length) && (
            <div className="cart-warning" role="alert">
              <p>
                {locale === "sv"
                  ? "Din varukorg har ändrats. Kontrollera innehåll och antal innan du fortsätter."
                  : "Your bag has changed. Review the items and quantities before continuing."}
              </p>
              <ul>
                {cart!.warnings!.map((warning, index) => (
                  <li key={`${warning.code}:${warning.target ?? index}`}>
                    {warning.code === "MERCHANDISE_NOT_ENOUGH_STOCK"
                      ? locale === "sv"
                        ? "Det önskade antalet finns inte längre i lager. Varukorgen visar det aktuella antalet."
                        : "The requested quantity is no longer in stock. Your bag shows the current quantity."
                      : warning.code === "MERCHANDISE_OUT_OF_STOCK"
                        ? locale === "sv"
                          ? "En vara har tagit slut. Kontrollera den uppdaterade varukorgen."
                          : "An item has sold out. Please review your updated bag."
                        : warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!cart?.lines.length ? (
            <div className="empty-cart">
              <span className="empty-cart-icon" aria-hidden="true">
                <ShoppingBag size={32} strokeWidth={1.25} />
              </span>
              <h2>
                {locale === "sv" ? "Din varukorg är tom" : "Your bag is empty"}
              </h2>
              <p>
                {locale === "sv"
                  ? "Hitta något fint till hemmet."
                  : "Find something for your home."}
              </p>
              <Link className="button button-dark" href={`/${locale}/shop`}>
                {t.browse}
                <ArrowRight size={16} aria-hidden="true" focusable="false" />
              </Link>
            </div>
          ) : (
            [...groups].map(([id, lines]) => {
              const bundle = !id.startsWith("line:");
              const message = lines
                .flatMap((l) => l.attributes)
                .find((a) => a.key === "gift_message")?.value;
              return (
                <section key={id} className="cart-group">
                  {bundle && (
                    <div className="cart-group-title">
                      <h2>{t.giftBox}</h2>
                      <Link
                        href={`/${locale}/build-a-box?edit=${encodeURIComponent(id)}`}
                      >
                        {t.edit}
                      </Link>
                      <button
                        className="icon-button"
                        aria-label={`${t.remove}: ${t.giftBox}`}
                        disabled={loading}
                        onClick={() => {
                          void removeLines(lines.map((l) => l.id)).catch(
                            () => {},
                          );
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  {lines.map((line) => {
                    const image =
                      line.variant.images?.[0] ?? line.product.images[0];
                    const label = variantLabel(line.variant, locale);
                    const showVariantLabel =
                      label &&
                      !(
                        line.product.variants.length === 1 &&
                        label.trim() === "Default Title"
                      );
                    return (
                      <div className="cart-line" key={line.id}>
                        <Link
                          href={`/${locale}/products/${line.product.handle}`}
                          className="cart-image"
                        >
                          {image ? (
                            <Image
                              src={image.url}
                              alt={image.alt}
                              fill
                              sizes="(max-width: 600px) 80px, 112px"
                            />
                          ) : (
                            <span className="small-label">
                              {locale === "sv"
                                ? "Bild saknas"
                                : "Image unavailable"}
                            </span>
                          )}
                        </Link>
                        <div className="cart-line-description">
                          <h3>
                            <Link
                              href={`/${locale}/products/${line.product.handle}`}
                            >
                              {line.product.title[locale]}
                            </Link>
                          </h3>
                          {showVariantLabel && <p>{label}</p>}
                          {Boolean(line.components?.length) && (
                            <ul
                              className="cart-components"
                              aria-label={
                                locale === "sv"
                                  ? "Innehåll i setet"
                                  : "Kit contents"
                              }
                            >
                              {line.components!.map((component) => {
                                const definition =
                                  line.variant.components?.find(
                                    (item) =>
                                      item.variant.id ===
                                      component.merchandiseId,
                                  );
                                const product =
                                  definition?.product ?? component.product;
                                const variant =
                                  definition?.variant ?? component.variant;
                                const label = variantLabel(variant, locale);
                                return (
                                  <li key={component.id}>
                                    {component.quantity} ×{" "}
                                    {product.title[locale]}
                                    {label &&
                                    label !== "Default Title" &&
                                    label !== "Standard"
                                      ? ` · ${label}`
                                      : ""}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {!bundle && (
                            <div className="quantity-control">
                              <button
                                className="icon-button"
                                aria-label={`${t.quantity} −: ${line.product.title[locale]}`}
                                disabled={
                                  loading ||
                                  unsupportedPurchase ||
                                  line.quantity <= 1
                                }
                                onClick={() => {
                                  void updateLine(
                                    line.id,
                                    line.quantity - 1,
                                  ).catch(() => {});
                                }}
                              >
                                <Minus size={13} />
                              </button>
                              <span aria-label={t.quantity}>
                                {line.quantity}
                              </span>
                              <button
                                className="icon-button"
                                aria-label={`${t.add}: ${line.product.title[locale]}`}
                                disabled={
                                  loading ||
                                  unsupportedPurchase ||
                                  unavailableItems ||
                                  line.quantity >= 10
                                }
                                onClick={() => {
                                  void updateLine(
                                    line.id,
                                    line.quantity + 1,
                                  ).catch(() => {});
                                }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="cart-line-price">
                          {formatMoney(
                            line.cost?.totalAmount ?? {
                              amount:
                                (Math.round(line.variant.price.amount * 100) *
                                  line.quantity) /
                                100,
                              currencyCode: "SEK",
                            },
                            locale,
                          )}
                        </span>
                        {!bundle && (
                          <button
                            className="icon-button"
                            aria-label={`${t.remove}: ${line.product.title[locale]}`}
                            disabled={loading}
                            onClick={() => {
                              void removeLines([line.id]).catch(() => {});
                            }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {message && (
                    <div className="cart-gift-message">
                      <span className="eyebrow">{t.giftMessage}</span>
                      <blockquote>{message}</blockquote>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
        <aside className="cart-summary" aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">
            {locale === "sv" ? "Din beställning" : "Order summary"}
          </h2>
          <div className="summary-total">
            <span>{t.subtotal}</span>
            <strong>
              {formatMoney(
                cart?.total ?? { amount: 0, currencyCode: "SEK" },
                locale,
              )}
            </strong>
          </div>
          <p className="cart-tax-note">{t.tax}</p>
          <button
            className="button button-dark"
            disabled={
              loading ||
              !cart?.lines.length ||
              unsupportedPurchase ||
              unavailableItems
            }
            onClick={pay}
          >
            {loading ? t.checking : t.checkout}
            <ArrowRight size={16} aria-hidden="true" focusable="false" />
          </button>
          {unsupportedPurchase && (
            <p role="alert" className="field-error">
              {locale === "sv"
                ? "En produkt har ett köpalternativ som inte är tillgängligt här ännu. Ta bort produkten för att fortsätta."
                : "An item has a purchase option that is not available here yet. Remove that item to continue."}
            </p>
          )}
          {unavailableItems && !unsupportedPurchase && (
            <p role="alert" className="field-error">
              {locale === "sv"
                ? "En vara eller del av ett set är inte längre tillgänglig. Ta bort den för att fortsätta."
                : "An item or part of a kit is no longer available. Remove it to continue."}
            </p>
          )}
          {error && !(error === "cart_changed" && cart?.warnings?.length) && (
            <p role="alert" className="field-error">
              {cartErrorMessage(error, locale)}
              {errorAction && error === "invalid_origin" && (
                <>
                  {" "}
                  <Link className="text-link" href={errorAction.href}>
                    {errorAction.label}{" "}
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      focusable="false"
                      className="inline-block shrink-0 align-text-bottom"
                    />
                  </Link>
                </>
              )}
            </p>
          )}
          <p className="cart-delivery-note">{t.delivery}</p>
          <div className="cart-help-links">
            <Link href={`/${locale}/shipping-returns`}>
              {locale === "sv" ? "Leverans & retur" : "Delivery & returns"}
            </Link>
            <Link href={`/${locale}/contact`}>
              {locale === "sv" ? "Kontakta oss" : "Contact us"}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
