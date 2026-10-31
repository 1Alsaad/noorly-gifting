"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useParams } from "next/navigation";
import { getDictionary } from "@/content/translations";
export default function NotFound() {
  const params = useParams();
  const locale = params.locale === "en" ? "en" : "sv";
  const t = getDictionary(locale);
  return (
    <div className="section-wrap page-content not-found-page">
      <p className="eyebrow">404</p>
      <h1>{t.notFound.title}</h1>
      <p>{t.notFound.text}</p>
      <Link className="button button-dark" href={`/${locale}/shop`}>
        {t.browse}{" "}
        <ArrowUpRight
          size={16}
          aria-hidden="true"
          focusable="false"
          className="inline-block shrink-0 align-text-bottom"
        />
      </Link>
    </div>
  );
}
