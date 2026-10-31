import Link from "next/link";
import { ArrowRight, Mail, MessageCircle, Truck } from "lucide-react";
import { brand } from "@/config/brand";
import type { CustomerPolicy } from "@/content/customer-policies";
import type { Locale } from "@/types/commerce";
import "./customer-policy.css";
import "@/styles/customer-pages.css";

export function CustomerCareNavigation({
  locale,
  activePage,
}: {
  locale: Locale;
  activePage?: string;
}) {
  const sv = locale === "sv";
  const links = [
    { path: "contact", label: sv ? "Kontakt" : "Contact" },
    { path: "faq", label: sv ? "Vanliga frågor" : "FAQs" },
    {
      path: "shipping-returns",
      label: sv ? "Leverans & retur" : "Delivery & returns",
    },
    { path: "terms", label: sv ? "Köpvillkor" : "Terms" },
    { path: "privacy", label: sv ? "Integritet" : "Privacy" },
  ];
  return (
    <nav
      className="customer-care-nav"
      aria-label={sv ? "Kundservice" : "Customer care"}
    >
      {links.map(({ path, label }) => (
        <Link
          href={`/${locale}/${path}`}
          key={path}
          aria-current={activePage === path ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function CustomerPolicyContent({
  policy,
  locale,
  page,
}: {
  policy: CustomerPolicy;
  locale: Locale;
  page: string;
}) {
  const sv = locale === "sv";
  const contact = page === "contact";
  return (
    <div
      className={`section-wrap customer-pages customer-policy${contact ? " customer-contact" : ""}`}
    >
      <div className="customer-page-heading">
        <p className="eyebrow">{policy.eyebrow}</p>
        <h1>{policy.title}</h1>
        <p>{policy.description}</p>
      </div>
      <CustomerCareNavigation locale={locale} activePage={page} />
      {contact && (
        <div className="customer-help-cards">
          <a
            className="customer-help-card customer-help-card-primary"
            href={`mailto:${brand.supportEmail}`}
          >
            <Mail size={25} strokeWidth={1.4} aria-hidden="true" />
            <h2>{sv ? "Skriv till oss" : "Email customer care"}</h2>
            <p>
              {sv
                ? "Frågor om en vara eller din beställning."
                : "Questions about a product or your order."}
            </p>
            <ArrowRight size={20} aria-hidden="true" />
          </a>
          <Link className="customer-help-card" href={`/${locale}/faq`}>
            <MessageCircle size={25} strokeWidth={1.4} aria-hidden="true" />
            <h2>{sv ? "Hitta ett svar" : "Find an answer"}</h2>
            <p>
              {sv
                ? "Läs våra vanligaste frågor."
                : "Browse our frequently asked questions."}
            </p>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
          <Link
            className="customer-help-card"
            href={`/${locale}/shipping-returns`}
          >
            <Truck size={25} strokeWidth={1.4} aria-hidden="true" />
            <h2>{sv ? "Leverans & retur" : "Delivery & returns"}</h2>
            <p>
              {sv
                ? "Förbeställning, leverans och ångerrätt."
                : "Pre-orders, delivery and withdrawal."}
            </p>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      )}
      <div className="customer-policy-layout">
        {!contact && (
          <aside className="customer-policy-index">
            <p>{sv ? "På den här sidan" : "On this page"}</p>
            <nav aria-label={sv ? "Sidans innehåll" : "Page contents"}>
              {policy.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.heading}
                </a>
              ))}
            </nav>
          </aside>
        )}
        <div className="customer-policy-body">
          {policy.sections.map((section) => (
            <section
              id={section.id}
              key={section.id}
              className="policy-section"
            >
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.links && (
                <ul className="policy-links">
                  {section.links.map(({ label, href }) => (
                    <li key={`${label}-${href}`}>
                      {href.startsWith("/") ? (
                        <Link className="text-link" href={href}>
                          {label}
                        </Link>
                      ) : (
                        <a className="text-link" href={href}>
                          {label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
