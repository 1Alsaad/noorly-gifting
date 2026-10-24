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
    <div className="section-wrap page-content corporate-page">
      <div className="page-heading">
        <p className="eyebrow">{t.corporate}</p>
        <h1>{t.forms.corporateTitle}</h1>
        <p>{t.forms.corporateText}</p>
        <p className="muted">{t.deliveryText}</p>
      </div>
      {process.env.NOORLY_PUBLIC_PREVIEW === "true" ? (
        <a className="button button-dark" href={`mailto:${brand.supportEmail}`}>
          {locale === "sv" ? "Kontakta Noorly" : "Contact Noorly"}
        </a>
      ) : (
        <EnquiryForm locale={locale} kind="corporate" />
      )}
    </div>
  );
}
