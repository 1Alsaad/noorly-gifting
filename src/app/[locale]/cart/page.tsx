import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { CartView } from "@/features/cart/cart-view";
import { TrackView } from "@/components/analytics/track-view";
import { pageMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale)
    ? {
        ...pageMetadata(
          locale,
          "/cart",
          getDictionary(locale).cart,
          getDictionary(locale).delivery,
        ),
        robots: { index: false, follow: false },
      }
    : {};
}
export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (process.env.NOORLY_PUBLIC_PREVIEW === "true") redirect(`/${locale}/shop`);
  const t = getDictionary(locale);
  return (
    <div className="section-wrap page-content">
      <TrackView name="cart_viewed" properties={{ locale }} />
      <div className="page-heading">
        <p className="eyebrow">{t.edition}</p>
        <h1>{t.cart}</h1>
      </div>
      <CartView locale={locale} />
    </div>
  );
}
