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
let lastPageView: string | null = null;

/** Load nothing before marketing consent. Never pass email or form fields. */
export function updateMetaConsent() {
  if (typeof window === "undefined") return;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId || !/^\d+$/.test(pixelId)) return;
  if (!getConsent()?.marketing) {
    lastPageView = null;
    if (window.fbq) {
      if (!window.fbq.callMethod) initialized = false;
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

/** Standard Meta browser events: marketing consent only, never in admin preview. */
function consentedPixelId(): string | null {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (
    typeof window === "undefined" ||
    !getConsent()?.marketing ||
    !pixelId ||
    !/^\d+$/.test(pixelId)
  )
    return null;
  updateMetaConsent();
  return window.fbq ? pixelId : null;
}

/** One PageView per visited locale path, including when consent is first granted. */
export function trackMetaPageView(pathname: string): boolean {
  if (
    !/^\/(sv|en)(\/|$)/.test(pathname) ||
    /[?#]/.test(pathname) ||
    lastPageView === pathname
  )
    return false;
  const pixelId = consentedPixelId();
  if (!pixelId || !window.fbq) return false;
  try {
    window.fbq("trackSingle", pixelId, "PageView");
    lastPageView = pathname;
    return true;
  } catch {
    return false;
  }
}

/** Only genuine product details, not the non-purchasable planned bundle. */
export function trackMetaViewContent(
  productHandle: string,
  value?: number,
): boolean {
  if (
    !/^[a-z0-9-]{1,100}$/.test(productHandle) ||
    (value !== undefined && (!Number.isFinite(value) || value < 0))
  )
    return false;
  const pixelId = consentedPixelId();
  if (!pixelId || !window.fbq) return false;
  try {
    window.fbq("trackSingle", pixelId, "ViewContent", {
      content_type: "product",
      content_ids: [productHandle],
      content_name: productHandle,
      ...(value !== undefined ? { value, currency: "SEK" } : {}),
    });
    return true;
  } catch {
    return false;
  }
}

/** Only after the server confirms a valid Shopify checkout redirect. */
export function trackMetaInitiateCheckout(value?: number): boolean {
  if (value === undefined || !Number.isFinite(value) || value <= 0)
    return false;
  const pixelId = consentedPixelId();
  if (!pixelId || !window.fbq) return false;
  try {
    window.fbq("trackSingle", pixelId, "InitiateCheckout", {
      value,
      currency: "SEK",
    });
    return true;
  } catch {
    return false;
  }
}

/** Checkout sends consent status and first-party click identifiers, never email or names. */
export function getMetaCheckoutAttributes(): Record<string, string> {
  const denied = {
    _noorly_meta_consent: "denied",
    _noorly_meta_fbp: "",
    _noorly_meta_fbc: "",
  };
  if (typeof window === "undefined" || !getConsent()?.marketing)
    return denied;
  const cookie = (name: string) => {
    const pair = document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${name}=`));
    if (!pair) return "";
    const value = pair.slice(name.length + 1);
    return /^fb\.\d+\.\d+\.[A-Za-z0-9_-]{1,160}$/.test(value) ? value : "";
  };
  return {
    _noorly_meta_consent: "granted",
    _noorly_meta_fbp: cookie("_fbp"),
    _noorly_meta_fbc: cookie("_fbc"),
  };
}

/** Only call after durable, non-mock acceptance; no lead on click or retry. */
export function trackInterestLead(eventId: string, productHandle: string) {
  if (
    typeof window === "undefined" ||
    !getConsent()?.marketing ||
    !/^\d+$/.test(process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "") ||
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
