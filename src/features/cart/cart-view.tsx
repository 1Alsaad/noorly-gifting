"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { getDictionary } from "@/content/translations";
import type { CartLine, Locale } from "@/types/commerce";
import { formatMoney } from "@/lib/utils/money";
import { useCart } from "./cart-provider";
export function CartView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { cart, loading, error, updateLine, removeLines, checkout } = useCart();
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
  return (
    <div className="cart-layout">
      <div>
        <div
          className="cart-announcement sr-only"
          role="status"
          aria-live="polite"
        >
          {cart ? `${t.cartUpdated}: ${cart.totalQuantity}` : ""}
        </div>
        {!cart?.lines.length ? (
          <div className="empty-cart">
            <ShoppingBag size={38} strokeWidth={1} />
            <h2>{t.empty}</h2>
            <Link className="button button-dark" href={`/${locale}/shop`}>
              {t.browse}
              <ArrowRight size={16} />
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
                {lines.map((line) => (
                  <div className="cart-line" key={line.id}>
                    <Link
                      href={`/${locale}/products/${line.product.handle}`}
                      className="cart-image"
                    >
                      <Image
                        src={line.product.images[0].url}
                        alt={line.product.images[0].alt}
                        fill
                        sizes="100px"
                      />
                    </Link>
                    <div className="cart-line-description">
                      <h3>
                        <Link
                          href={`/${locale}/products/${line.product.handle}`}
                        >
                          {line.product.title[locale]}
                        </Link>
                      </h3>
                      <p>{line.variant.title}</p>
                      {!bundle && (
                        <div className="quantity-control">
                          <button
                            className="icon-button"
                            aria-label={`${t.quantity} −: ${line.product.title[locale]}`}
                            disabled={loading || line.quantity <= 1}
                            onClick={() => {
                              void updateLine(line.id, line.quantity - 1).catch(
                                () => {},
                              );
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span aria-label={t.quantity}>{line.quantity}</span>
                          <button
                            className="icon-button"
                            aria-label={`${t.add}: ${line.product.title[locale]}`}
                            disabled={loading || line.quantity >= 10}
                            onClick={() => {
                              void updateLine(line.id, line.quantity + 1).catch(
                                () => {},
                              );
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span>
                      {formatMoney(
                        {
                          amount: line.variant.price.amount * line.quantity,
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
                ))}
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
      <aside className="cart-summary">
        <span className="eyebrow">{t.cart}</span>
        <h2>{t.total}</h2>
        <div className="summary-total">
          <span>{t.subtotal}</span>
          <strong>
            {formatMoney(
              cart?.total ?? { amount: 0, currencyCode: "SEK" },
              locale,
            )}
          </strong>
        </div>
        <p>{t.tax}</p>
        <button
          className="button button-dark"
          disabled={loading || !cart?.lines.length}
          onClick={pay}
        >
          {loading ? t.checking : t.checkout}
          <ArrowRight size={16} />
        </button>
        {error && (
          <p role="alert" className="field-error">
            {t.error}
          </p>
        )}
        <p className="small-label">{t.delivery}</p>
      </aside>
    </div>
  );
}
