import type { Metadata } from "next";
import { brand } from "@/config/brand";
import type { Locale } from "@/types/commerce";
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        sv: `/sv${path}`,
        en: `/en${path}`,
        "x-default": `/sv${path}`,
      },
    },
    openGraph: {
      title: `${title} · ${brand.name}`,
      description,
      url: `/${locale}${path}`,
      locale: locale === "sv" ? "sv_SE" : "en_SE",
      alternateLocale: locale === "sv" ? ["en_SE"] : ["sv_SE"],
      images: [
        {
          url: "/media/winter/entrance-poster-desktop.webp",
          width: 1536,
          height: 1024,
        },
      ],
    },
  };
}
