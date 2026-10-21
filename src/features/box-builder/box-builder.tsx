"use client";
import {
  isProductTestMode,
  productTestCopy,
  interestHref,
} from "@/config/product-test";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Package, RotateCcw } from "lucide-react";
import { z } from "zod";
import { getDictionary } from "@/content/translations";
import type { Locale, Product } from "@/types/commerce";
import {
  BOX_RULES,
  buildBoxCartLines,
  validateBoxSelection,
  sanitizeGiftMessage,
  type BoxSelection,
} from "./validation";
import { formatMoney } from "@/lib/utils/money";
import { useCart } from "@/features/cart/cart-provider";
import { trackEvent } from "@/lib/analytics/client";
const storageKey = "stilla-box-builder-v1";
const storedSchema = z.object({
  baseHandle: z.enum(["small-box", "large-box"]),
  signatureHandle: z.string().max(100),
  extraHandles: z.array(z.string().max(100)).max(3),
  cardHandle: z.string().max(100).optional(),
  giftMessage: z.string().max(280),
});
const initial: BoxSelection = {
  baseHandle: "small-box",
  signatureHandle: isProductTestMode() ? "candle-sand" : "winter-candle",
  extraHandles: [],
  giftMessage: "",
};
export function BoxBuilder({
  products,
  locale,
  preselected,
  editBundleId,
}: {
  products: Product[];
  locale: Locale;
  preselected?: string;
  editBundleId?: string;
}) {
  const t = getDictionary(locale);
  const c = t.builderCopy;
  const { cart, addLines, replaceBundle, loading } = useCart();
  const [selection, setSelection] = useState<BoxSelection>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(false);
  const [complete, setComplete] = useState(false);
  const [restored, setRestored] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || (editBundleId && !cart)) return;
    initialized.current = true;
    let draft: BoxSelection = { ...initial, extraHandles: [] };
    if (editBundleId && cart) {
      const lines = cart.lines.filter((l) =>
        l.attributes.some(
          (a) => a.key === "bundle_id" && a.value === editBundleId,
        ),
      );
      const base = lines.find((l) => l.product.category === "packaging");
      if (base) {
        draft = {
          baseHandle:
            base.product.handle === "large-box" ? "large-box" : "small-box",
          signatureHandle:
            lines.find((l) => l.product.category === "signature")?.product
              .handle ?? "winter-candle",
          extraHandles: lines
            .filter((l) => l.product.category === "extra")
            .map((l) => l.product.handle),
          cardHandle: lines.find((l) => l.product.category === "card")?.product
            .handle,
          giftMessage:
            base.attributes.find((a) => a.key === "gift_message")?.value ?? "",
        };
      }
    } else {
      try {
        const parsed = storedSchema.safeParse(
          JSON.parse(localStorage.getItem(storageKey) ?? "null"),
        );
        if (parsed.success) draft = parsed.data;
      } catch {
        /* Discard corrupt local drafts. */
      }
    }
    const pre = products.find((p) => p.handle === preselected && p.available);
    if (pre?.category === "signature") draft.signatureHandle = pre.handle;
    if (pre?.category === "extra" && !draft.extraHandles.includes(pre.handle))
      draft.extraHandles = [...draft.extraHandles, pre.handle].slice(
        0,
        BOX_RULES[draft.baseHandle].maximumExtras,
      );
    queueMicrotask(() => {
      setSelection(draft);
      setRestored(true);
    });
    trackEvent(
      {
        name: "box_builder_started",
        properties: { locale, source: editBundleId ? "cart" : "builder" },
      },
      `builder:${editBundleId ?? "new"}`,
    );
  }, [products, preselected, editBundleId, cart, locale]);
  useEffect(() => {
    if (!restored || complete) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(selection));
    } catch {
      /* Storage is an enhancement. */
    }
  }, [selection, restored, complete]);
  const result = validateBoxSelection(selection, products);
  const rule = BOX_RULES[selection.baseHandle];
  const chosen = [
    selection.baseHandle,
    selection.signatureHandle,
    ...selection.extraHandles,
    ...(selection.cardHandle ? [selection.cardHandle] : []),
  ]
    .map((h) => products.find((p) => p.handle === h))
    .filter((p): p is Product => Boolean(p));
  function set(patch: Partial<BoxSelection>) {
    setSelection((s) => ({ ...s, ...patch }));
    setError(false);
    setComplete(false);
  }
  function move(to: number) {
    if (
      to > step &&
      ((step === 0 &&
        !products.some(
          (p) => p.handle === selection.baseHandle && p.available,
        )) ||
        (step === 1 &&
          !products.some(
            (p) => p.handle === selection.signatureHandle && p.available,
          )) ||
        (step === 2 &&
          (selection.extraHandles.length < rule.minimumExtras ||
            selection.extraHandles.length > rule.maximumExtras)))
    ) {
      setError(true);
      trackEvent({
        name: "box_builder_validation_error",
        properties: { locale, source: `step_${step}` },
      });
      return;
    }
    setStep(to);
    setError(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function toggle(product: Product) {
    const selected = selection.extraHandles.includes(product.handle);
    if (!selected && selection.extraHandles.length >= rule.maximumExtras)
      return;
    set({
      extraHandles: selected
        ? selection.extraHandles.filter((h) => h !== product.handle)
        : [...selection.extraHandles, product.handle],
    });
    trackEvent({
      name: selected ? "product_removed_from_box" : "product_added_to_box",
      properties: { locale, product_handle: product.handle },
    });
  }
  async function finish() {
    if (submitted.current || !result.valid) {
      setError(true);
      return;
    }
    submitted.current = true;
    try {
      const bundle = editBundleId ?? crypto.randomUUID();
      const lines = buildBoxCartLines(selection, products, bundle);
      if (editBundleId) await replaceBundle(editBundleId, lines);
      else await addLines(lines);
      trackEvent(
        {
          name: "box_builder_completed",
          properties: {
            locale,
            bundle_id: bundle,
            value: result.total.amount,
            currency: "SEK",
            quantity: lines.length,
          },
        },
        `builder_done:${bundle}`,
      );
      if (selection.giftMessage.trim())
        trackEvent({
          name: "gift_message_added",
          properties: { locale, bundle_id: bundle },
        });
      setComplete(true);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* Storage may be unavailable. */
      }
    } catch {
      setError(true);
      submitted.current = false;
    }
  }
  return (
    <div className="builder-layout">
      <div className="builder-main">
        <ol className="builder-steps" aria-label={t.builder}>
          {c.steps.map((label, i) => (
            <li
              key={label}
              className={step === i ? "active" : step > i ? "done" : ""}
            >
              <button
                aria-current={step === i ? "step" : undefined}
                disabled={i > step}
                onClick={() => move(i)}
              >
                <span>
                  {step > i ? (
                    <Check size={13} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="builder-stage">
          <p className="eyebrow">{String(step + 1).padStart(2, "0")} / 06</p>
          <h2 ref={heading} tabIndex={-1}>
            {[c.size, c.signature, c.extras, c.card, c.message, c.review][step]}
          </h2>
          {step === 0 && (
            <div className="size-options">
              {(["small-box", "large-box"] as const).map((handle) => {
                const product = products.find((p) => p.handle === handle);
                return (
                  <button
                    key={handle}
                    className={`selection-tile ${selection.baseHandle === handle ? "selected" : ""}`}
                    aria-pressed={selection.baseHandle === handle}
                    disabled={!product?.available}
                    onClick={() => {
                      set({
                        baseHandle: handle,
                        extraHandles: selection.extraHandles.slice(
                          0,
                          BOX_RULES[handle].maximumExtras,
                        ),
                      });
                      trackEvent({
                        name: "box_size_selected",
                        properties: { locale, product_handle: handle },
                      });
                    }}
                  >
                    <Package
                      size={handle === "small-box" ? 43 : 59}
                      strokeWidth={1}
                    />
                    <strong>
                      {handle === "small-box" ? c.small : c.large}
                    </strong>
                    <span>
                      {handle === "small-box" ? c.smallText : c.largeText}
                    </span>
                    <span>
                      {product
                        ? formatMoney(product.price, locale)
                        : t.unavailable}
                    </span>
                    {selection.baseHandle === handle && (
                      <Check className="selection-check" size={17} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {(step === 1 || step === 2 || step === 3) && (
            <>
              <p>
                {step === 2
                  ? `${c.extraRule} ${rule.minimumExtras === rule.maximumExtras ? rule.minimumExtras : `${rule.minimumExtras}–${rule.maximumExtras}`} ${c.pieces}. ${c.count}: ${selection.extraHandles.length}`
                  : step === 3
                    ? c.note
                    : ""}
              </p>
              <div className="builder-product-grid">
                {step === 3 && (
                  <button
                    className={`selection-tile no-card ${!selection.cardHandle ? "selected" : ""}`}
                    aria-pressed={!selection.cardHandle}
                    onClick={() => set({ cardHandle: undefined })}
                  >
                    {c.noCard}
                  </button>
                )}
                {products
                  .filter(
                    (p) =>
                      p.category ===
                      (step === 1
                        ? "signature"
                        : step === 2
                          ? "extra"
                          : "card"),
                  )
                  .map((product) => {
                    const selected =
                      step === 1
                        ? selection.signatureHandle === product.handle
                        : step === 2
                          ? selection.extraHandles.includes(product.handle)
                          : selection.cardHandle === product.handle;
                    return (
                      <button
                        key={product.id}
                        className={`selection-tile product-selection ${selected ? "selected" : ""}`}
                        aria-pressed={selected}
                        disabled={
                          !product.available ||
                          (!selected &&
                            step === 2 &&
                            selection.extraHandles.length >= rule.maximumExtras)
                        }
                        onClick={() =>
                          step === 1
                            ? set({ signatureHandle: product.handle })
                            : step === 2
                              ? toggle(product)
                              : set({ cardHandle: product.handle })
                        }
                      >
                        <span className="selection-image">
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt}
                            fill
                            sizes="(max-width:680px) 40vw, 220px"
                          />
                        </span>
                        <strong>{product.title[locale]}</strong>
                        <span>{formatMoney(product.price, locale)}</span>
                        {selected && (
                          <Check className="selection-check" size={17} />
                        )}
                      </button>
                    );
                  })}
              </div>
            </>
          )}
          {step === 4 && (
            <div className="message-step">
              <label htmlFor="gift-message">{t.giftMessage}</label>
              <textarea
                id="gift-message"
                value={selection.giftMessage}
                onChange={(e) => set({ giftMessage: e.target.value })}
                maxLength={280}
                rows={6}
                placeholder={t.messagePlaceholder}
                aria-describedby="message-limit"
              />
              <p id="message-limit">
                {t.messageHint} <span>{selection.giftMessage.length}/280</span>
              </p>
            </div>
          )}
          {step === 5 && (
            <div>
              <p>{c.reviewText}</p>
              <ul className="review-list">
                {chosen.map((p) => (
                  <li key={p.id}>
                    <span>{p.title[locale]}</span>
                    <span>{formatMoney(p.price, locale)}</span>
                  </li>
                ))}
              </ul>
              {selection.giftMessage && (
                <blockquote className="gift-note">
                  {sanitizeGiftMessage(selection.giftMessage)}
                </blockquote>
              )}
              <p className="builder-total">
                {t.total}
                <strong>{formatMoney(result.total, locale)}</strong>
              </p>
            </div>
          )}
          <div role="status">
            {error && <p className="field-error">{c.invalid}</p>}
            {complete && (
              <div className="success-panel">
                <Check size={22} />
                <p>{c.completed}</p>
                <Link className="button button-dark" href={`/${locale}/cart`}>
                  {t.cart}
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
          {!complete && (
            <div className="builder-controls">
              {step > 0 && (
                <button className="text-button" onClick={() => move(step - 1)}>
                  <ArrowLeft size={16} />
                  {t.back}
                </button>
              )}
              {step < 5 ? (
                <button
                  className="button button-dark"
                  disabled={!restored}
                  onClick={() => move(step + 1)}
                >
                  {t.next}
                  <ArrowRight size={16} />
                </button>
              ) : isProductTestMode() ? (
                <Link
                  className="button button-dark"
                  href={interestHref(
                    locale,
                    selection.signatureHandle,
                    undefined,
                    chosen.map((product) => product.handle),
                  )}
                  aria-disabled={!result.valid || !restored}
                  onClick={(event) => {
                    if (!result.valid || !restored) event.preventDefault();
                  }}
                >
                  {productTestCopy[locale].cta}
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  className="button button-dark"
                  disabled={loading || !result.valid || !restored}
                  onClick={finish}
                >
                  {loading ? t.adding : c.addBox}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <aside className="builder-summary">
        <span className="eyebrow">{c.selectedPrefix}</span>
        <div className="summary-image">
          <Image
            src="/media/products/winter-evening.svg"
            alt={c.packing}
            fill
            sizes="400px"
          />
        </div>
        <h3>{c.title}</h3>
        <ul>
          {chosen.map((p) => (
            <li key={p.id}>
              <Check size={13} />
              {p.title[locale]}
            </li>
          ))}
        </ul>
        <div className="summary-total">
          <span>{t.total}</span>
          <strong>{formatMoney(result.total, locale)}</strong>
        </div>
        <p className="muted">{c.resume}</p>
        <button
          className="text-button"
          onClick={() => {
            setSelection(initial);
            setStep(0);
            setComplete(false);
            submitted.current = false;
          }}
        >
          <RotateCcw size={13} />
          {c.clear}
        </button>
      </aside>
    </div>
  );
}
