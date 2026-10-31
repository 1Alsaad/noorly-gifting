"use client";
import {
  candleSandHandle,
  teakBowlHandle,
  launchCatalogCopy,
  launchCatalogHref,
} from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
import { isProductTestMode } from "@/config/product-test";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingBag, ArrowUpRight, Menu } from "lucide-react";
import { brand } from "@/config/brand";
import { getDictionary } from "@/content/translations";
import type { Locale } from "@/types/commerce";
import { useCart } from "@/features/cart/cart-provider";
import { trackEvent } from "@/lib/analytics/client";
import { BrandProof } from "./brand-proof";
export function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { cart } = useCart();
  const path = usePathname();
  const query = useSearchParams().toString();
  const other = locale === "sv" ? "en" : "sv";
  const otherPath =
    path.replace(/^\/(sv|en)(?=\/|$)/, `/${other}`) +
    (query ? `?${query}` : "");
  const nav = [
    {
      href: `/${locale}/shop`,
      label: locale === "sv" ? "Alla produkter" : "Shop all",
    },
    {
      href: `/${locale}/products/${candleSandHandle}`,
      label: locale === "sv" ? "Ljussand" : "Candle sand",
    },
    {
      href: `/${locale}/products/${teakBowlHandle}`,
      label: locale === "sv" ? "Teakskålar" : "Teak bowls",
    },
    {
      href: `/${locale}/products/${launchBundleHandle}`,
      label: locale === "sv" ? "Paket" : "Bundle",
    },
  ];
  return (
    <>
      <BrandProof locale={locale} />
      <header className="site-header">
        <Link
          className="wordmark campaign-wordmark"
          href={`/${locale}`}
          aria-label={`${brand.name} — ${locale === "sv" ? "Startsida" : "Home"}`}
        >
          noorly.
        </Link>
        <nav className="desktop-nav" aria-label={t.shop}>
          {nav.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={path === item.href ? "page" : undefined}
              onClick={() =>
                trackEvent({
                  name: "navigation_clicked",
                  properties: { locale, source: "header" },
                })
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <a
            href={otherPath}
            lang={other}
            hrefLang={other}
            className="locale-switch"
            aria-label={`${t.language}: ${other.toUpperCase()}`}
          >
            {locale.toUpperCase()}
            <span aria-hidden> / {other.toUpperCase()}</span>
          </a>
          {isProductTestMode() ? (
            <Link
              className="bag-link"
              href={launchCatalogHref(locale)}
              aria-label={launchCatalogCopy[locale].cta}
            >
              <ArrowUpRight size={19} />
              <span className="bag-label">{launchCatalogCopy[locale].cta}</span>
            </Link>
          ) : (
            <Link
              href={`/${locale}/cart`}
              className="bag-link"
              aria-label={`${t.cart} (${cart?.totalQuantity ?? 0})`}
            >
              <ShoppingBag size={19} strokeWidth={1.4} />
              <span className="bag-label">{t.cart}</span>
              <span className="bag-count">{cart?.totalQuantity ?? 0}</span>
            </Link>
          )}
          <details className="mobile-menu">
            <summary aria-label={t.menu}>
              <Menu size={23} />
            </summary>
            <nav aria-label={t.menu}>
              {nav.map((item) => (
                <Link
                  href={item.href}
                  key={item.href}
                  aria-current={path === item.href ? "page" : undefined}
                  onClick={(event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                  }
                >
                  {item.label}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              ))}
              <div className="mobile-menu-help">
                <Link
                  href={`/${locale}/about`}
                  onClick={(event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                  }
                >
                  {locale === "sv" ? "Om Noorly" : "About Noorly"}
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  onClick={(event) =>
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open")
                  }
                >
                  {locale === "sv" ? "Kundservice" : "Customer care"}
                </Link>
              </div>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
