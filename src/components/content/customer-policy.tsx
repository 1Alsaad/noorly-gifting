import Link from "next/link";
import type { CustomerPolicy } from "@/content/customer-policies";
import "./customer-policy.css";

export function CustomerPolicyContent({ policy }: { policy: CustomerPolicy }) {
  return (
    <div className="section-wrap page-content information-page customer-policy">
      <div className="page-heading">
        <p className="eyebrow">{policy.eyebrow}</p>
        <h1>{policy.title}</h1>
      </div>
      <div className="prose">
        <p className="prose-lead">{policy.description}</p>
        {policy.sections.map((section) => (
          <section id={section.id} key={section.id} className="policy-section">
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
  );
}
