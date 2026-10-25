"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT } from "@/lib/analytics/consent";
import {
  updateHeatmapConsent,
  watchHeatmapNavigation,
} from "@/lib/analytics/clarity";

export function HeatmapProvider() {
  const path = usePathname();
  const search = useSearchParams();
  useLayoutEffect(() => {
    updateHeatmapConsent();
  }, [path, search]);
  useEffect(() => {
    const unwatch = watchHeatmapNavigation();
    window.addEventListener(CONSENT_EVENT, updateHeatmapConsent);
    window.addEventListener("storage", updateHeatmapConsent);
    window.addEventListener("hashchange", updateHeatmapConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, updateHeatmapConsent);
      window.removeEventListener("storage", updateHeatmapConsent);
      window.removeEventListener("hashchange", updateHeatmapConsent);
      unwatch();
    };
  }, []);
  return null;
}
