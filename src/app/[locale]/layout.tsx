import { notFound } from "next/navigation";
import { isLocale, getDictionary } from "@/content/translations";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/features/cart/cart-provider";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { PresaleHold } from "@/components/layout/presale-hold";
import { isStorefrontOpen } from "@/lib/commerce/launch";
export const dynamic = "force-dynamic";
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!isStorefrontOpen()) return <PresaleHold locale={locale} />;
  const t = getDictionary(locale);
  return (
    <CartProvider>
      <a className="skip-link" href="#main-content">
        {t.skip}
      </a>
      <AnalyticsProvider locale={locale} />
      <Header locale={locale} />
      <main id="main-content">{children}</main>
      <Footer locale={locale} />
      <ConsentBanner locale={locale} />
      {process.env.NEXT_PUBLIC_COMMERCE_PROVIDER !== "shopify" && (
        <div className="preview-ribbon">{t.preview}</div>
      )}
    </CartProvider>
  );
}
