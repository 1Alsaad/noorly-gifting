import { isProductTestMode, productTestCopy } from "@/config/product-test";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product, Locale } from "@/types/commerce";
import { formatMoney } from "@/lib/utils/money";
import { getDictionary } from "@/content/translations";
import { candleSandHandle } from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
export function ProductCard({
  product,
  locale,
  index,
}: {
  product: Product;
  locale: Locale;
  index?: number;
}) {
  const t = getDictionary(locale);
  const bundle =
    !product.managedCatalog && product.handle === launchBundleHandle;
  return (
    <article className={`product-card product-${product.handle}`}>
      <Link
        className="product-image"
        href={`/${locale}/products/${product.handle}`}
      >
        {bundle && product.images.length >= 2 ? (
          <span className="bundle-card-photos">
            {product.images.slice(0, 2).map((image) => (
              <span className="bundle-card-photo" key={image.url}>
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 680px) 45vw, 16vw"
                />
              </span>
            ))}
          </span>
        ) : product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt || product.title[locale]}
            fill
            sizes="(max-width: 680px) 90vw, (max-width: 1000px) 45vw, 30vw"
          />
        ) : (
          <span className="product-note">
            {locale === "sv"
              ? "Produktbild saknas"
              : "Product image unavailable"}
          </span>
        )}
        <span className="product-number">
          {bundle
            ? locale === "sv"
              ? "Paket"
              : "Bundle"
            : index !== undefined
              ? `0${index + 1}`
              : product.category === "box"
                ? t.boxes
                : t.items}
        </span>
        <span className="product-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="product-caption">
        <h3>
          <Link href={`/${locale}/products/${product.handle}`}>
            {product.title[locale]}
          </Link>
        </h3>
        <span>
          {product.handle === candleSandHandle ||
          bundle ||
          new Set(product.variants.map((variant) => variant.price.amount))
            .size > 1
            ? `${t.from} `
            : ""}
          {formatMoney(product.price, locale)}
        </span>
      </div>
      <p>{product.description[locale]}</p>
      {isProductTestMode() && product.category === "box" && (
        <p className="product-note">{productTestCopy[locale].concept}</p>
      )}
      {product.variants.some((variant) => variant.color) && (
        <Link
          className="product-colour-summary"
          href={`/${locale}/products/${product.handle}`}
        >
          <span className="product-mini-swatches" aria-hidden="true">
            {product.variants
              .filter(
                (variant) =>
                  variant.sku !== "CSand-11" &&
                  variant.sku !== "NOORLY-LJUSSTUND-CSand-11",
              )
              .map((variant) => (
                <i
                  key={variant.id}
                  style={{ backgroundColor: variant.color?.hex }}
                />
              ))}
          </span>
          <span>
            {product.managedCatalog
              ? `${product.variants.length} ${locale === "sv" ? "alternativ" : "options"}`
              : locale === "sv"
                ? "11 färg- & doftval"
                : "11 colour & scent options"}{" "}
            ↗
          </span>
        </Link>
      )}
      {!product.available && (
        <span className="small-label">{t.unavailable}</span>
      )}
    </article>
  );
}
