import Link from "next/link";
import { getDictionary } from "@/content/translations";
export default function NotFound() {
  const t = getDictionary("sv");
  return (
    <main className="section-wrap page-content not-found-page">
      <p className="eyebrow">404</p>
      <h1>{t.notFound.title}</h1>
      <p>{t.notFound.text}</p>
      <Link className="button button-dark" href="/sv/shop">
        {t.browse} ↗
      </Link>
    </main>
  );
}
