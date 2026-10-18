import { notFound } from "next/navigation";
import { getCommerceProvider } from "@/lib/commerce";
import { getDictionary, isLocale } from "@/content/translations";
import { ProductCard } from "@/components/product/product-card";
import { pageMetadata } from "@/lib/seo/metadata";
import { TrackView } from "@/components/analytics/track-view";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale)
    ? pageMetadata(
        locale,
        "/shop",
        getDictionary(locale).shop,
        getDictionary(locale).home.text,
      )
    : {};
}
export default async function Shop({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    price?: string;
    occasion?: string;
  }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const filters = await searchParams;
  const products = await getCommerceProvider().getProducts();
  const list = products.filter(
    (p) =>
      p.category !== "packaging" &&
      (filters.category !== "box" || p.category === "box") &&
      (filters.category !== "items" || p.category !== "box") &&
      (!filters.price || p.price.amount <= Number(filters.price)) &&
      (filters.occasion !== "home" ||
        ["new-home", "winter-candle", "linen-napkin"].includes(p.handle)) &&
      (filters.occasion !== "thanks" || p.price.amount <= 595),
  );
  return (
    <div className="section-wrap page-content">
      <TrackView
        name="product_list_viewed"
        properties={{ locale, source: "shop", quantity: list.length }}
      />
      <div className="page-heading">
        <p className="eyebrow">{t.edition}</p>
        <h1>{t.shop}</h1>
        <p>{t.home.text}</p>
      </div>
      <form className="shop-filters" action={`/${locale}/shop`}>
        <label>
          {t.category}
          <select name="category" defaultValue={filters.category ?? "all"}>
            <option value="all">{t.all}</option>
            <option value="box">{t.boxes}</option>
            <option value="items">{t.items}</option>
          </select>
        </label>
        <label>
          {t.price}
          <select name="price" defaultValue={filters.price ?? ""}>
            <option value="">{t.all}</option>
            <option value="300">300 SEK</option>
            <option value="600">600 SEK</option>
            <option value="800">800 SEK</option>
          </select>
        </label>
        <label>
          {t.occasion}
          <select name="occasion" defaultValue={filters.occasion ?? "all"}>
            <option value="all">{t.any}</option>
            <option value="winter">{t.winter}</option>
            <option value="home">{t.newHome}</option>
            <option value="thanks">{t.thanks}</option>
          </select>
        </label>
        <button className="button button-dark">{t.filter}</button>
      </form>
      <div className="product-grid three">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
      {!list.length && <p>{t.noResults}</p>}
    </div>
  );
}
