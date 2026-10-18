"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT } from "@/lib/analytics/consent";
import { trackEvent, updateAnalyticsConsent } from "@/lib/analytics/client";

export function AnalyticsProvider({ locale }: { locale: "sv" | "en" }) {
  const pathname = usePathname();
  useEffect(() => {
    const update = () => {
      try {
        updateAnalyticsConsent();
        trackEvent(
          { name: "page_viewed", properties: { locale, path: pathname } },
          `page:${pathname}`,
        );
      } catch {
        /* Provider failures must not affect browsing. */
      }
    };
    update();
    window.addEventListener(CONSENT_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CONSENT_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [locale, pathname]);
  return null;
}
