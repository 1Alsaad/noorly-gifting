import { isProductTestMode, productTestCopy } from "@/config/product-test";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product, Locale } from "@/types/commerce";
import { formatMoney } from "@/lib/utils/money";
import { getDictionary } from "@/content/translations";
import { candleSandHandle } from "@/content/launch-catalog";
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
  return (
    <article className={`product-card product-${product.handle}`}>
      <Link
        className="product-image"
        href={`/${locale}/products/${product.handle}`}
      >
        {product.images[0] ? (
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
          {index !== undefined
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
              .filter((variant) => variant.sku !== "CSand-11")
              .map((variant) => (
                <i
                  key={variant.id}
                  style={{ backgroundColor: variant.color?.hex }}
                />
              ))}
          </span>
          <span>
            {locale === "sv"
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
