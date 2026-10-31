import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo/metadata";
import { StructuredData } from "@/components/ui/structured-data";
import { getCustomerPolicy } from "@/content/customer-policies";
import {
  CustomerCareNavigation,
  CustomerPolicyContent,
} from "@/components/content/customer-policy";
import "@/styles/customer-pages.css";

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
  if (policy)
    return (
      <CustomerPolicyContent policy={policy} locale={locale} page={page} />
    );
  const t = getDictionary(locale);
  if (!Object.hasOwn(t.pages, page)) notFound();
  const content = t.pages[page as keyof typeof t.pages];
  const sv = locale === "sv";
  const about = page === "about";
  const faq = page === "faq";
  const title = about
    ? sv
      ? "Om Noorly"
      : "About Noorly"
    : faq
      ? sv
        ? "Vanliga frågor"
        : "Frequently asked questions"
      : content.title;
  return (
    <div
      className={`section-wrap customer-pages${about ? " customer-about" : faq ? " customer-faq" : ""}`}
    >
      <div className="customer-page-heading">
        <p className="eyebrow">{about ? "NOORLY" : content.eyebrow}</p>
        <h1>{title}</h1>
        {!about && <p>{content.text}</p>}
      </div>
      {!about && <CustomerCareNavigation locale={locale} activePage={page} />}
      {about ? (
        <section className="customer-about-story">
          <figure className="customer-about-image">
            <Image
              src="/media/products/alva/noorly-alva-editorial.webp"
              alt={
                sv
                  ? "Alva, dekorativ teakskål i en stylad miljö"
                  : "Alva decorative teak bowl in a styled scene"
              }
              width={1536}
              height={1024}
              sizes="(max-width: 760px) 90vw, 50vw"
            />
            <figcaption>
              {sv
                ? "Alva · Dekorativ teakskål · Miljöbild"
                : "Alva · Decorative teak bowl · Styled scene"}
            </figcaption>
          </figure>
          <div className="customer-about-copy">
            <h2>
              {sv ? "En plats för det enkla." : "Room for the simple things."}
            </h2>
            <p>{content.text}</p>
            <p>{content.extra}</p>
            <Link className="button button-dark" href={`/${locale}/shop`}>
              {sv ? "Upptäck kollektionen" : "Explore the collection"}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <div className="customer-information-layout">
          <div className="customer-information-body">
            {faq ? (
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
                <div className="customer-faq-list">
                  {t.faqs.map((f, index) => (
                    <details className="faq-item" key={f.q}>
                      <summary>
                        <span
                          className="customer-faq-number"
                          aria-hidden="true"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{f.q}</span>
                      </summary>
                      <p>{f.a}</p>
                    </details>
                  ))}
                </div>
              </>
            ) : (
              <p>{content.extra}</p>
            )}
          </div>
          <aside className="customer-contact-card">
            <Mail size={25} strokeWidth={1.4} aria-hidden="true" />
            <h2>{sv ? "Vi hjälper dig gärna" : "We’re here to help"}</h2>
            <p>
              {faq
                ? content.extra
                : sv
                  ? "Hör av dig om du har en fråga eller behöver hjälp."
                  : "Get in touch with a question or if you need a hand."}
            </p>
            <Link className="text-link" href={`/${locale}/contact`}>
              {sv ? "Kontakta oss" : "Contact us"}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      )}
      <div className="customer-page-bottom">
        <Link className="text-link" href={`/${locale}/shop`}>
          {t.browse}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        {about && (
          <a className="text-link" href={`mailto:${brand.supportEmail}`}>
            {brand.supportEmail}
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}
