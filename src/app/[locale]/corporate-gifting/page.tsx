import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import "@/styles/customer-pages.css";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { brand } from "@/config/brand";
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
        "/corporate-gifting",
        getDictionary(locale).corporate,
        getDictionary(locale).forms.corporateText,
      )
    : {};
}
export default async function CorporatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="section-wrap customer-pages customer-corporate">
      <div className="customer-page-heading">
        <p className="eyebrow">NOORLY</p>
        <h1>{t.corporate}</h1>
        <p>
          {locale === "sv"
            ? "Berätta vad du söker, antal och önskat datum. Vi återkommer om vad som är möjligt."
            : "Tell us what you have in mind, the quantity and your preferred date. We’ll let you know what is possible."}
        </p>
      </div>
      <div className="customer-corporate-layout">
        <aside className="customer-corporate-intro">
          <h2>
            {locale === "sv" ? "Låt oss prata gåvor" : "Let’s talk gifts"}
          </h2>
          <p>{t.home.corporateText}</p>
          <p>{t.deliveryText}</p>
          <p>
            {locale === "sv"
              ? "Ingen bekräftad lagerankomstdag ännu."
              : "An arrival date is not yet confirmed."}
          </p>
          <Link className="text-link" href={`/${locale}/shop`}>
            {locale === "sv" ? "Se kollektionen" : "See the collection"}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </aside>
        <div className="customer-corporate-form">
          <h2>{locale === "sv" ? "Din förfrågan" : "Your enquiry"}</h2>
          {process.env.NOORLY_PUBLIC_PREVIEW === "true" ? (
            <a
              className="button button-dark"
              href={`mailto:${brand.supportEmail}`}
            >
              {locale === "sv" ? "Kontakta Noorly" : "Contact Noorly"}
            </a>
          ) : (
            <EnquiryForm locale={locale} kind="corporate" />
          )}
        </div>
      </div>
    </div>
  );
}
