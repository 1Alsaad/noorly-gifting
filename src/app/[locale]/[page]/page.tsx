import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo/metadata";
import { StructuredData } from "@/components/ui/structured-data";
import { getCustomerPolicy } from "@/content/customer-policies";
import { CustomerPolicyContent } from "@/components/content/customer-policy";
type Props = { params: Promise<{ locale: string; page: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, page } = await params;
  if (!isLocale(locale)) return {};
  const policy = getCustomerPolicy(locale, page);
  if (policy)
    return pageMetadata(locale, `/${page}`, policy.title, policy.description);
  const t = getDictionary(locale);
  if (!(page in t.pages)) return {};
  const c = t.pages[page as keyof typeof t.pages];
  return pageMetadata(locale, `/${page}`, c.title.replace("\n", " "), c.text);
}
export default async function InformationPage({ params }: Props) {
  const { locale, page } = await params;
  if (!isLocale(locale)) notFound();
  const policy = getCustomerPolicy(locale, page);
  if (policy) return <CustomerPolicyContent policy={policy} />;
  const t = getDictionary(locale);
  if (!Object.hasOwn(t.pages, page)) notFound();
  const content = t.pages[page as keyof typeof t.pages];
  return (
    <div className="section-wrap page-content information-page">
      <div className="page-heading">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
      </div>
      <div className="prose">
        <p className="prose-lead">{content.text}</p>
        <p>{content.extra}</p>
        {page === "faq" && (
          <>
            <StructuredData
              data={{
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: t.faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }}
            />
            {t.faqs.map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </>
        )}
        <p>
          <Link href={`/${locale}/shop`} className="text-link">
            {t.browse} ↗
          </Link>
        </p>
        <p>
          <a href={`mailto:${brand.supportEmail}`} className="text-link">
            {t.footer.contact}: {brand.supportEmail} ↗
          </a>
        </p>
      </div>
    </div>
  );
}
