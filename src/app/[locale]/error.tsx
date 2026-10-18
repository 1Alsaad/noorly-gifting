"use client";
import { useParams } from "next/navigation";
import { getDictionary } from "@/content/translations";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const t = getDictionary(params.locale === "en" ? "en" : "sv");
  return (
    <div className="section-wrap page-content">
      <h1>{t.errorTitle}</h1>
      <p>{t.errorText}</p>
      <button className="button button-dark" onClick={reset}>
        {t.retry}
      </button>
    </div>
  );
}
