import { redirect, notFound } from "next/navigation";
import { isLocale, getDictionary } from "@/content/translations";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/features/cart/cart-provider";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { isPublicTestPreview, isStorefrontOpen } from "@/lib/commerce/launch";
import { hasAdminPreviewSession } from "@/lib/security/admin-preview";
import "@/styles/admin-preview.css";
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
  const adminPreview = !isStorefrontOpen() && (await hasAdminPreviewSession());
  const publicTestPreview = isPublicTestPreview() && !adminPreview;
  if (!isStorefrontOpen() && !adminPreview && !publicTestPreview)
    redirect("/admin-preview");
  const t = getDictionary(locale);
  return (
    <CartProvider>
      {adminPreview && (
        <aside
          className="admin-preview-bar"
          aria-label="Intern förhandsvisning"
        >
          <span>
            Intern designvisning. Exempelprodukter och exempelpriser.
            Beställning och betalning är stängda.
          </span>
          <form action="/api/admin-preview" method="post">
            <input type="hidden" name="action" value="logout" />
            <button type="submit">Logga ut</button>
          </form>
        </aside>
      )}
      {publicTestPreview && (
        <aside
          className="admin-preview-bar"
          aria-label={locale === "sv" ? "Testversion" : "Test preview"}
        >
          <span>
            {locale === "sv"
              ? "Noorlys första upplaga: teakskålar och ljussand finns i lager. Exakta set och köpvillkor bekräftas före säljstart."
              : "Noorly first edition: teak bowls and candle sand are in stock. Final set contents and terms will be confirmed before orders open."}
          </span>
        </aside>
      )}
      <a className="skip-link" href="#main-content">
        {t.skip}
      </a>
      {!adminPreview && <AnalyticsProvider locale={locale} />}
      <Header locale={locale} />
      <main id="main-content">{children}</main>
      <Footer locale={locale} />
      {!adminPreview && <ConsentBanner locale={locale} />}
      {process.env.NEXT_PUBLIC_COMMERCE_PROVIDER !== "shopify" && (
        <div className="preview-ribbon">{t.preview}</div>
      )}
    </CartProvider>
  );
}
