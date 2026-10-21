"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { productTestCopy } from "@/config/product-test";
import { trackEvent } from "@/lib/analytics/client";
import { trackInterestLead } from "@/lib/analytics/meta";
import type { Locale } from "@/types/commerce";

export function InterestForm({
  locale,
  productHandle,
  variantId,
  boxContents,
  enabled,
}: {
  locale: Locale;
  productHandle: string;
  variantId?: string;
  boxContents: string[];
  enabled: boolean;
}) {
  const copy = productTestCopy[locale];
  const busy = useRef(false);
  const submission = useRef<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy.current || state === "success") return;
    busy.current = true;
    setState("sending");
    const form = event.currentTarget;
    const fields = new FormData(form);
    const submissionId =
      submission.current ?? (submission.current = crypto.randomUUID());
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "product_interest",
          email: fields.get("email"),
          consent: fields.get("consent") === "on",
          website: fields.get("website") ?? "",
          submissionId,
          productHandle,
          variantId,
          boxContents,
          locale,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || result.mock !== false)
        throw new Error("interest_not_saved");
      setState("success");
      form.reset();
      if (!result.duplicate) {
        trackEvent(
          {
            name: "product_interest_registered",
            properties: { locale, product_handle: productHandle },
          },
          `interest:${submissionId}`,
        );
        trackInterestLead(submissionId, productHandle);
      }
    } catch {
      setState("error");
    } finally {
      busy.current = false;
    }
  }

  if (!enabled) return <p role="status">{copy.closed}</p>;

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label>
        {locale === "sv" ? "E-postadress" : "Email address"}
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          disabled={state === "success"}
        />
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          name="consent"
          required
          disabled={state === "success"}
        />
        <span>
          {copy.consent}{" "}
          <Link href={`/${locale}/privacy`}>
            {locale === "sv" ? "Integritet" : "Privacy"}
          </Link>
        </span>
      </label>
      <button
        className="button button-dark"
        disabled={state === "sending" || state === "success"}
      >
        {state === "sending"
          ? locale === "sv"
            ? "Sparar…"
            : "Saving…"
          : copy.cta}
      </button>
      <p role="status" aria-live="polite">
        {state === "success"
          ? copy.success
          : state === "error"
            ? copy.failure
            : ""}
      </p>
      <noscript>{copy.noScript}</noscript>
    </form>
  );
}
