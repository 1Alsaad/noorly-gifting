import type { Metadata } from "next";
import { headers } from "next/headers";
import { brand } from "@/config/brand";
import { isStorefrontOpen } from "@/lib/commerce/launch";
import "@/styles/globals.css";
import "@/styles/retail.css";
export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description:
    "Noorly — dekorativa teakskålar och förpackad ljussand. Se vår första upplaga och kontakta oss för information.",
  robots: {
    index:
      isStorefrontOpen() &&
      process.env.DEPLOYMENT_ENV === "production" &&
      process.env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify",
    follow:
      isStorefrontOpen() &&
      process.env.DEPLOYMENT_ENV === "production" &&
      process.env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify",
  },
  openGraph: {
    siteName: brand.name,
    type: "website",
    images: [
      {
        url: "/media/winter/entrance-poster-desktop.webp",
        width: 1536,
        height: 1024,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const locale = h.get("x-locale") === "en" ? "en" : "sv";
  return (
    <html lang={locale} data-clarity-mask="true" data-scroll-behavior="smooth">
      <body className="noorly-store">{children}</body>
    </html>
  );
}
