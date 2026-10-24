import { notFound, redirect } from "next/navigation";
import { getCommerceProvider } from "@/lib/commerce";
import { getDictionary, isLocale } from "@/content/translations";
import { BoxBuilder } from "@/features/box-builder/box-builder";
import { pageMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale)
    ? pageMetadata(
        locale,
        "/build-a-box",
        getDictionary(locale).builder,
        getDictionary(locale).builderCopy.intro,
      )
    : {};
}
export default async function BuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string; edit?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (process.env.NOORLY_PUBLIC_PREVIEW === "true") redirect(`/${locale}/shop`);
  const query = await searchParams;
  const t = getDictionary(locale);
  const products = await getCommerceProvider().getProducts();
  return (
    <div className="section-wrap page-content">
      <div className="page-heading">
        <p className="eyebrow">{t.home.buildLabel}</p>
        <h1>{t.builderCopy.title}</h1>
        <p>{t.builderCopy.intro}</p>
      </div>
      <BoxBuilder
        products={products}
        locale={locale}
        preselected={query.product}
        editBundleId={query.edit}
      />
    </div>
  );
}
