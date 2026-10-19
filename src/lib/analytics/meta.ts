"use client";

import { getConsent } from "./consent";

type Pixel = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push?: Pixel;
  loaded?: boolean;
  version?: string;
};
declare global {
  interface Window {
    fbq?: Pixel;
    _fbq?: Pixel;
  }
}
const sent = new Set<string>();
let initialized = false;

/** Load nothing before marketing consent. Never pass email or form fields. */
export function updateMetaConsent() {
  if (typeof window === "undefined") return;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId || !/^\d+$/.test(pixelId)) return;
  if (!getConsent()?.marketing) {
    if (window.fbq) {
      window.fbq.queue = [];
      window.fbq("consent", "revoke");
    }
    for (const name of ["_fbp", "_fbc"]) {
      const parts = location.hostname.split(".");
      const domains = ["", ...parts.map((_, i) => parts.slice(i).join("."))];
      for (const domain of domains)
        document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} SameSite=Lax`;
    }
    return;
  }
  if (!window.fbq) {
    const queue: Pixel = Object.assign(
      (...args: unknown[]) => {
        if (queue.callMethod) queue.callMethod(...args);
        else queue.queue.push(args);
      },
      { queue: [] as unknown[][], loaded: true, version: "2.0" },
    );
    queue.push = queue;
    window.fbq = queue;
    window._fbq = queue;
  }
  window.fbq("consent", "grant");
  if (!initialized) {
    // Disable automatic button/form events and automatic matching.
    window.fbq("set", "autoConfig", false, pixelId);
    window.fbq("init", pixelId);
    initialized = true;
  }
  if (!document.querySelector("script[data-noorly-meta]")) {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.noorlyMeta = "true";
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.append(script);
  }
}

/** Only call after durable, non-mock acceptance; no lead on click or retry. */
export function trackInterestLead(eventId: string, productHandle: string) {
  if (
    typeof window === "undefined" ||
    !getConsent()?.marketing ||
    sent.has(eventId) ||
    !/^[0-9a-f-]{36}$/i.test(eventId) ||
    !/^[a-z0-9-]{1,100}$/.test(productHandle)
  )
    return false;
  try {
    updateMetaConsent();
    if (!window.fbq || !process.env.NEXT_PUBLIC_META_PIXEL_ID) return false;
  window.fbq(
    "track",
    "Lead",
    { content_name: productHandle, content_category: "product_interest" },
    { eventID: eventId },
  );
  sent.add(eventId);
    return true;
  } catch {
    return false;
  }
}
