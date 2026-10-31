import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getCommerceProvider } from "@/lib/commerce";
import { getEnv } from "@/lib/env/server";
import { isLocale } from "@/content/translations";
import { InterestForm } from "@/components/forms/interest-form";
import { productTestCopy } from "@/config/product-test";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(
    locale,
    "/interest",
    productTestCopy[locale].title,
    productTestCopy[locale].intro,
  );
}

export default async function InterestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string; variant?: string; box?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (process.env.NOORLY_PUBLIC_PREVIEW === "true") redirect(`/${locale}/shop`);
  const query = await searchParams;
  const products = await getCommerceProvider().getProducts();
  const handle = query.product ?? "candle-sand";
  const product = products.find((item) => item.handle === handle);
  if (!product) notFound();
  const variant = query.variant
    ? product.variants.find((item) => item.id === query.variant)
    : undefined;
  if (query.variant && !variant) notFound();
  const boxContents = query.box?.split(",") ?? [];
  if (
    boxContents.length > 6 ||
    boxContents.some((item) => !products.some((p) => p.handle === item))
  )
    notFound();
  const copy = productTestCopy[locale];
  const env = getEnv();
  const enabled = Boolean(
    env.PRODUCT_INTEREST_ENABLED &&
    env.RATE_LIMIT_PROVIDER_URL &&
    env.RATE_LIMIT_PROVIDER_TOKEN &&
    env.FORM_DELIVERY_URL &&
    env.FORM_DELIVERY_TOKEN,
  );
  const image = variant?.images?.[0] ?? product.images[0];
  return (
    <section className="section-wrap page-content">
      <p className="eyebrow">{copy.label}</p>
      <h1>{copy.title}</h1>
      <p className="section-intro">{copy.intro}</p>
      <div className="product-detail">
        <div>
          <Image
            src={image.url}
            alt={image.alt}
            width={800}
            height={800}
            sizes="(max-width:760px) 90vw, 45vw"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
        <div>
          <h2>{product.title[locale]}</h2>
          {variant && <p>{variant.label?.[locale] ?? variant.title}</p>}
          <p>{product.description[locale]}</p>
          {product.included && <p>{product.included[locale]}</p>}
          {boxContents.length > 0 && (
            <>
              <p>{copy.concept}</p>
              <ul>
                {boxContents.map((item) => (
                  <li key={item}>
                    {products.find((p) => p.handle === item)?.title[locale]}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p>{copy.note}</p>
          <InterestForm
            locale={locale}
            productHandle={product.handle}
            variantId={variant?.id}
            boxContents={boxContents}
            enabled={enabled}
          />
          <Link className="text-link" href={`/${locale}/shop`}>
            {locale === "sv" ? "Utforska produkterna" : "Explore the products"}{" "}
            <ArrowUpRight
              size={16}
              aria-hidden="true"
              focusable="false"
              className="inline-block shrink-0 align-text-bottom"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
