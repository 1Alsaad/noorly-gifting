import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { brand } from "@/config/brand";
import { getDictionary } from "@/content/translations";
import type { Locale } from "@/types/commerce";
import { ConsentSettingsButton } from "@/components/consent/consent-banner";
export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const groups = [
    {
      title: t.footer.explore,
      links: [
        ["shop", t.shop],
        ["collections/winter", t.collection],
        ["build-a-box", t.builder],
        ["corporate-gifting", t.corporate],
      ],
    },
    {
      title: t.footer.help,
      links: [
        ["about", t.about],
        ["faq", t.footer.faq],
        ["shipping-returns", t.footer.shipping],
        ["accessibility", t.footer.accessibility],
      ],
    },
    {
      title: t.footer.details,
      links: [
        ["privacy", t.footer.privacy],
        ["cookies", t.footer.cookies],
        ["terms", t.footer.terms],
      ],
    },
  ];
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Link href={`/${locale}`} className="wordmark">
            {brand.name}
            <span className="wordmark-dot">®</span>
          </Link>
          <p>{t.footer.text}</p>
          <a className="footer-email" href={`mailto:${brand.supportEmail}`}>
            {brand.supportEmail}
            <ArrowUpRight size={15} />
          </a>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={`/${locale}/${href}`}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 {t.footer.rights.replace("STILLA", brand.name)}</span>
        <ConsentSettingsButton locale={locale} />
        <span>{t.edition}</span>
      </div>
    </footer>
  );
}
