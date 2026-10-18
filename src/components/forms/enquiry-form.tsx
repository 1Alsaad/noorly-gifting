"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDictionary } from "@/content/translations";
import type { Locale } from "@/types/commerce";
import { trackEvent } from "@/lib/analytics/client";
export function EnquiryForm({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "newsletter" | "corporate";
}) {
  const t = getDictionary(locale);
  const [state, setState] = useState<
    "idle" | "sending" | "mock" | "success" | "error"
  >("idle");
  const submission = useRef<string | null>(null);
  const busy = useRef(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setState("sending");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      kind,
      email: fd.get("email"),
      website: fd.get("website") ?? "",
      consent: fd.get("consent") === "on",
      submissionId:
        submission.current ?? (submission.current = crypto.randomUUID()),
      ...(kind === "corporate"
        ? {
            name: fd.get("name"),
            company: fd.get("company"),
            volume: Number(fd.get("volume")),
            country: String(fd.get("country")).toUpperCase(),
            deliveryDate: fd.get("deliveryDate"),
            message: fd.get("message"),
          }
        : {}),
    };
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("form_failed");
      setState(data.mock ? "mock" : "success");
      trackEvent({
        name:
          kind === "newsletter"
            ? "newsletter_signup"
            : "corporate_gifting_enquiry",
        properties: { locale, source: "form" },
      });
      form.reset();
    } catch {
      setState("error");
    } finally {
      busy.current = false;
    }
  }
  return (
    <form
      className={`enquiry-form ${kind === "newsletter" ? "newsletter-form" : ""}`}
      onSubmit={submit}
    >
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${kind}-website`}>{t.forms.spam}</label>
        <input
          id={`${kind}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {kind === "corporate" && (
        <div className="form-grid">
          <label>
            {t.forms.name}
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            {t.forms.company}
            <input
              name="company"
              autoComplete="organization"
              required
              maxLength={150}
            />
          </label>
        </div>
      )}
      <label>
        {t.forms.email}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      {kind === "corporate" && (
        <>
          <div className="form-grid">
            <label>
              {t.forms.volume}
              <input
                name="volume"
                type="number"
                min={5}
                max={100000}
                required
                defaultValue={10}
              />
            </label>
            <label>
              {t.forms.country}
              <input
                name="country"
                autoComplete="country"
                minLength={2}
                maxLength={2}
                pattern="[a-zA-Z]{2}"
                required
                defaultValue="SE"
              />
            </label>
          </div>
          <label>
            {t.forms.date}
            <input type="date" name="deliveryDate" required />
          </label>
          <label>
            {t.forms.message}
            <textarea name="message" rows={4} maxLength={2000} />
          </label>
        </>
      )}
      <label className="check-label">
        <input type="checkbox" name="consent" required />
        <span>
          {kind === "newsletter" ? t.forms.newsletterConsent : t.forms.consent}{" "}
          <Link href={`/${locale}/privacy`}>{t.footer.privacy}</Link>
        </span>
      </label>
      <button
        className="button button-dark"
        disabled={
          state === "sending" || state === "mock" || state === "success"
        }
      >
        {state === "sending"
          ? t.forms.sending
          : kind === "newsletter"
            ? t.forms.subscribe
            : t.forms.send}
        <ArrowUpRight size={17} />
      </button>
      <div
        role="status"
        className={state === "error" ? "field-error" : "form-status"}
      >
        {state === "mock"
          ? t.forms.success
          : state === "success"
            ? t.forms.realSuccess
            : state === "error"
              ? t.forms.failure
              : ""}
      </div>
    </form>
  );
}
