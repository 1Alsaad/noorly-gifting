"use client";

import {
  isProductTestMode,
  productTestCopy,
  interestHref,
} from "@/config/product-test";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/features/cart/cart-provider";
import { cinematicCopy } from "@/features/seasonal-experience/copy";
import { trackEvent } from "@/lib/analytics/client";
import type { Locale, Product } from "@/types/commerce";
import { VariantPicker } from "@/components/product/variant-picker";

interface Props {
  product: Product;
  locale: Locale;
  open: boolean;
  trigger: HTMLElement | null;
  initialVariantId?: string;
  onOpenChange: (open: boolean) => void;
}

export function ProductDrawer({
  product,
  locale,
  open,
  trigger,
  initialVariantId,
  onOpenChange,
}: Props) {
  const copy = cinematicCopy[locale];
  const { addLines, loading } = useCart();
  const [variantId, setVariantId] = useState(
    initialVariantId ?? product.variants[0]?.id ?? "",
  );
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">(
    "idle",
  );
  const variant =
    product.variants.find((item) => item.id === variantId) ??
    product.variants[0];
  const image = variant?.images?.[0] ?? product.images[0];
  const price = variant?.price ?? product.price;
  const formattedPrice = new Intl.NumberFormat(
    locale === "sv" ? "sv-SE" : "en-SE",
    {
      style: "currency",
      currency: price.currencyCode,
      maximumFractionDigits: 0,
    },
  ).format(Number(price.amount));

  async function add() {
    if (!variant?.available || status === "adding") return;
    setStatus("adding");
    try {
      await addLines([{ merchandiseId: variant.id, quantity: 1 }]);
      setStatus("added");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="cinema-drawer-overlay" />
        <Dialog.Content
          className="cinema-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger?.focus({ preventScroll: true });
          }}
        >
          <Dialog.Close className="cinema-drawer-close" aria-label={copy.close}>
            ×
          </Dialog.Close>
          {image && (
            <div className="cinema-drawer-image">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(max-width: 600px) 100vw, 520px"
              />
            </div>
          )}
          <div className="cinema-drawer-body">
            <p className="cinema-kicker">{copy.product}</p>
            <Dialog.Title className="cinema-drawer-title">
              {product.title[locale]}
            </Dialog.Title>
            <Dialog.Description className="cinema-drawer-description">
              {product.description[locale]}
            </Dialog.Description>
            <div className="cinema-drawer-price">
              <span>
                {isProductTestMode()
                  ? productTestCopy[locale].price
                  : formattedPrice}
              </span>
              <span className="cinema-stock">
                {isProductTestMode()
                  ? productTestCopy[locale].label
                  : product.previewOnly
                    ? locale === "sv"
                      ? "Demopris"
                      : "Demo price"
                    : variant?.available
                      ? copy.available
                      : copy.unavailable}
              </span>
            </div>
            <VariantPicker
              product={product}
              locale={locale}
              value={variantId}
              compact
              onChange={(id) => {
                setVariantId(id);
                setStatus("idle");
                trackEvent({
                  name: "product_variant_selected",
                  properties: {
                    product_id: product.id,
                    variant_id: id,
                    locale,
                    source: "cinematic_drawer",
                  },
                });
              }}
            />
            {isProductTestMode() ? (
              <Link
                className="cinema-button cinema-button-dark"
                href={interestHref(locale, product.handle, variantId)}
              >
                {productTestCopy[locale].cta}
              </Link>
            ) : (
              <button
                className="cinema-button cinema-button-dark"
                type="button"
                onClick={add}
                disabled={!variant?.available || loading || status === "adding"}
              >
                {status === "adding"
                  ? copy.adding
                  : status === "added"
                    ? copy.added
                    : copy.addToCart}
              </button>
            )}
            <div aria-live="polite" role="status" className="cinema-add-status">
              {status === "error" ? copy.addError : ""}
            </div>
            {product.boxEligible && (
              <Link
                className="cinema-button cinema-button-outline"
                href={`/${locale}/build-a-box?product=${encodeURIComponent(product.handle)}`}
              >
                {copy.addToBox}
                <span aria-hidden="true">↗</span>
              </Link>
            )}
            <p className="cinema-delivery">
              {isProductTestMode()
                ? productTestCopy[locale].note
                : copy.delivery}
            </p>
            <Link
              className="cinema-details-link"
              href={`/${locale}/products/${product.handle}`}
            >
              {copy.details}
              <span aria-hidden="true"> ↗</span>
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
