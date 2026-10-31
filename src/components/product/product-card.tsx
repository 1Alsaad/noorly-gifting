import { isProductTestMode, productTestCopy } from "@/config/product-test";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product, Locale } from "@/types/commerce";
import { formatMoney } from "@/lib/utils/money";
import { getDictionary } from "@/content/translations";
import { candleSandHandle, teakBowlHandle } from "@/content/launch-catalog";
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
  const bundle = product.handle === launchBundleHandle;
  const colours = product.variants.filter((variant) => variant.color);
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
              : product.handle === candleSandHandle
                ? "300 g"
                : product.category === "box"
                  ? t.boxes
                  : product.handle === teakBowlHandle
                    ? locale === "sv"
                      ? "Dekorativ teak"
                      : "Decorative teak"
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
      {colours.length > 0 && (
        <Link
          className="product-colour-summary"
          href={`/${locale}/products/${product.handle}`}
        >
          <span className="product-mini-swatches" aria-hidden="true">
            {colours.slice(0, 5).map((variant) => (
              <i
                key={variant.id}
                style={{ backgroundColor: variant.color?.hex }}
              />
            ))}
          </span>
          <span>
            {colours.length}{" "}
            {locale === "sv" ? "färg- & doftval" : "colour & scent options"}
          </span>
        </Link>
      )}
      {!product.available && (
        <span className="small-label">{t.unavailable}</span>
      )}
    </article>
  );
}
