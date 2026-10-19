import { isProductTestMode } from "@/config/product-test";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { getDictionary, isLocale } from "@/content/translations";
export const metadata = { robots: { index: false, follow: false } };
export default async function MockCheckout({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (
    !isLocale(locale) ||
    isProductTestMode() ||
    process.env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify"
  )
    notFound();
  const t = getDictionary(locale);
  return (
    <div className="section-wrap page-content mock-checkout">
      <ShieldCheck size={48} strokeWidth={1} />
      <p className="eyebrow">{t.preview}</p>
      <h1>{t.mockCheckoutTitle}</h1>
      <p>{t.mockCheckoutText}</p>
      <Link className="button button-dark" href={`/${locale}/shop`}>
        <ArrowLeft size={16} />
        {t.returnShop}
      </Link>
    </div>
  );
}
