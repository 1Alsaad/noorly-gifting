import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product, Locale } from "@/types/commerce";
import { formatMoney } from "@/lib/utils/money";
import { getDictionary } from "@/content/translations";
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
        <Image
          src={product.images[0]?.url || "/media/products/winter-evening.svg"}
          alt={product.images[0]?.alt || product.title[locale]}
          fill
          sizes="(max-width: 680px) 90vw, (max-width: 1000px) 45vw, 30vw"
        />
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
        <span>{formatMoney(product.price, locale)}</span>
      </div>
      <p>{product.description[locale]}</p>
      {!product.available && (
        <span className="small-label">{t.unavailable}</span>
      )}
    </article>
  );
}
