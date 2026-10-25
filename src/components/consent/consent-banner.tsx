"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  consentSnapshot,
  getConsent,
  parseConsent,
  saveConsent,
  subscribeConsent,
} from "@/lib/analytics/consent";
import { trackEvent } from "@/lib/analytics/client";
import { consentCopy } from "./copy";

const OPEN_EVENT = "stilla:open-consent";
const CONSENT_ACTION_CLASS =
  "min-h-11 rounded-full border border-black bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

export function ConsentSettingsButton({ locale }: { locale: "sv" | "en" }) {
  return (
    <button
      type="button"
      className="underline underline-offset-4"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      {consentCopy[locale].settings}
    </button>
  );
}

export function ConsentBanner({ locale }: { locale: "sv" | "en" }) {
  const copy = consentCopy[locale];
  const snapshot = useSyncExternalStore(
    subscribeConsent,
    consentSnapshot,
    () => "",
  );
  const current = parseConsent(snapshot);
  const [forcedOpen, setForcedOpen] = useState(false);
  const visible = forcedOpen || !current;
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const open = () => {
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const state = getConsent();
      setAnalytics(state?.analytics ?? false);
      setMarketing(state?.marketing ?? false);
      setForcedOpen(true);
      setCustomize(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, []);
  function choose(a: boolean, m: boolean) {
    saveConsent({ analytics: a, marketing: m });
    // The privacy event is subject to the same analytics gate as every other event.
    trackEvent({
      name: "consent_updated",
      properties: { locale, analytics: a, marketing: m },
    });
    setForcedOpen(false);
    setCustomize(false);
    setAnnouncement(copy.updated);
    returnFocus.current?.focus();
  }
  return (
    <>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {visible && !customize && (
        <section
          aria-label={copy.title}
          className="fixed bottom-4 left-4 right-4 z-[80] mx-auto max-w-3xl rounded-xl border border-stone-300 bg-[#f8f5ef] p-5 text-[#252c26] shadow-lg sm:p-6"
        >
          <h2 className="text-xl">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6">
            {copy.description}{" "}
            <Link className="underline" href={`/${locale}/cookies`}>
              {copy.privacy}
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={CONSENT_ACTION_CLASS}
              onClick={() => choose(false, false)}
            >
              {copy.reject}
            </button>
            <button
              type="button"
              className={CONSENT_ACTION_CLASS}
              onClick={() => choose(true, true)}
            >
              {copy.accept}
            </button>
            <button
              type="button"
              className="min-h-11 px-3 text-sm underline"
              onClick={() => {
                returnFocus.current = document.activeElement as HTMLElement;
                setCustomize(true);
              }}
            >
              {copy.customize}
            </button>
          </div>
        </section>
      )}
      <Dialog.Root
        open={visible && customize}
        onOpenChange={(open) => {
          if (!open) {
            setCustomize(false);
            if (getConsent()) setForcedOpen(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/40" />
          <Dialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current?.focus();
            }}
            className="fixed left-1/2 top-1/2 z-[100] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-[#f8f5ef] p-6 text-[#252c26] shadow-xl"
          >
            <Dialog.Title className="text-2xl">{copy.title}</Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-6">
              {copy.description}
            </Dialog.Description>
            <div className="my-6 space-y-5">
              <div>
                <label className="flex gap-3 font-medium">
                  <input type="checkbox" checked disabled />
                  {copy.necessary}
                </label>
                <p className="mt-1 text-sm">{copy.necessaryDescription}</p>
              </div>
              <div>
                <label className="flex min-h-11 items-center gap-3 font-medium">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                  {copy.analytics}
                </label>
                <p className="text-sm">{copy.analyticsDescription}</p>
              </div>
              <div>
                <label className="flex min-h-11 items-center gap-3 font-medium">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                  {copy.marketing}
                </label>
                <p className="text-sm">{copy.marketingDescription}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className={CONSENT_ACTION_CLASS}
                onClick={() => choose(analytics, marketing)}
              >
                {copy.save}
              </button>
              <button
                className="min-h-11 px-4 underline"
                onClick={() => setCustomize(false)}
              >
                {copy.cancel}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
