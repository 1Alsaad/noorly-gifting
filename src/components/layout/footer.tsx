import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { brand } from "@/config/brand";
import { getDictionary } from "@/content/translations";
import type { Locale } from "@/types/commerce";
import { ConsentSettingsButton } from "@/components/consent/consent-banner";
import { customerWithdrawalLink } from "@/content/customer-policies";
import { candleSandHandle, teakBowlHandle } from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const withdrawal = customerWithdrawalLink(locale);
  const groups = [
    {
      title: locale === "sv" ? "Handla" : "Shop",
      links: [
        ["shop", locale === "sv" ? "Alla produkter" : "Shop all"],
        [
          `products/${candleSandHandle}`,
          locale === "sv" ? "Ljussand" : "Candle sand",
        ],
        [
          `products/${teakBowlHandle}`,
          locale === "sv" ? "Teakskålar" : "Teak bowls",
        ],
        [
          `products/${launchBundleHandle}`,
          locale === "sv" ? "Paket" : "Bundle",
        ],
      ],
    },
    {
      title: t.footer.help,
      links: [
        ["faq", t.footer.faq],
        ["contact", t.footer.contact],
        ["shipping-returns", t.footer.shipping],
      ],
    },
    {
      title: locale === "sv" ? "Noorly" : "Noorly",
      links: [
        ["about", locale === "sv" ? "Om oss" : "Our story"],
        ["corporate-gifting", t.corporate],
        ["accessibility", t.footer.accessibility],
      ],
    },
  ];
  return (
    <footer className="site-footer">
      <div className="footer-signature" aria-hidden="true">
        noorly.
      </div>
      <div className="footer-top">
        <div>
          <Link href={`/${locale}`} className="wordmark">
            {brand.name}
          </Link>
          <p>
            {locale === "sv"
              ? "Ljussand, naturlig teak och små stunder hemma."
              : "Candle sand, natural teak and little moments at home."}
          </p>
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
              {group.title === t.footer.help && (
                <li>
                  <a href={withdrawal.href}>{withdrawal.label}</a>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 {t.footer.rights}</span>
        <nav className="footer-legal" aria-label={t.footer.details}>
          <Link href={`/${locale}/privacy`}>{t.footer.privacy}</Link>
          <Link href={`/${locale}/terms`}>{t.footer.terms}</Link>
          <Link href={`/${locale}/cookies`}>{t.footer.cookies}</Link>
        </nav>
        <ConsentSettingsButton locale={locale} />
      </div>
    </footer>
  );
}
