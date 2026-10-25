"use client";

import { getConsent } from "./consent";

type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global {
  interface Window {
    clarity?: Clarity;
  }
}

let started = false;
let stopped = false;
let reloading = false;

/** Only public shopping/editorial pages; never forms, carts or private routes.
 * Clarity reads the document URL itself, so query/hash-bearing visits are excluded.
 */
export function isHeatmapUrl(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    ["noorlynordic.com", "www.noorlynordic.com"].includes(url.hostname) &&
    !url.search &&
    !url.hash &&
    /^\/(sv|en)(\/(shop|about|products\/[a-z0-9-]{1,100}|collections\/[a-z0-9-]{1,100}))?\/?$/.test(
      url.pathname,
    )
  );
}

function clearCookies() {
  const domains = ["", location.hostname, ".noorlynordic.com"];
  for (const name of ["_clck", "_clsk"])
    for (const domain of domains)
      document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} SameSite=Lax; Secure`;
}

/** A full reload on withdrawal also cancels an in-flight tag download and removes
 * all third-party listeners. Merely removing a script tag does not stop recording.
 */
export function stopHeatmap(reload = false) {
  if (!started) return;
  if (!stopped) {
    stopped = true;
    try {
      if (window.clarity?.q) window.clarity.q.length = 0;
      window.clarity?.("consentv2", {
        analytics_Storage: "denied",
        ad_Storage: "denied",
      });
      window.clarity?.("stop");
    } catch {
      // Cookie cleanup and runtime disposal must survive a vendor error.
    }
    clearCookies();
    document.querySelector("script[data-noorly-clarity]")?.remove();
  }
  if (reload && !reloading) {
    reloading = true;
    location.reload();
  }
}

export function updateHeatmapConsent() {
  if (typeof window === "undefined") return;
  if (!getConsent()?.analytics) {
    stopHeatmap(true);
    clearCookies();
    return;
  }
  if (!isHeatmapUrl(new URL(location.href))) {
    stopHeatmap();
    return;
  }
  // The vendor also reads document.referrer. Never expose private/query-bearing
  // referrers, even when the current shopping page itself has a clean URL.
  if (document.referrer) {
    try {
      if (!isHeatmapUrl(new URL(document.referrer))) return;
    } catch {
      return;
    }
  }
  const id = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  if (
    started ||
    stopped ||
    !id ||
    !/^[a-z0-9]{6,20}$/.test(id) ||
    process.env.NEXT_PUBLIC_COMMERCE_PROVIDER !== "shopify" ||
    process.env.NEXT_PUBLIC_PRODUCT_TEST_MODE !== "false"
  )
    return;

  // Enforce masking locally before the provider can inspect any DOM content.
  document.documentElement.setAttribute("data-clarity-mask", "true");
  const clarity: Clarity = (...args) => {
    clarity.q!.push(args);
  };
  clarity.q = [];
  window.clarity = clarity;
  // Heatmaps have analytics permission only. No Microsoft ad storage or identity.
  clarity("consentv2", { analytics_Storage: "granted", ad_Storage: "denied" });
  const script = document.createElement("script");
  script.async = true;
  script.dataset.noorlyClarity = "true";
  script.referrerPolicy = "no-referrer";
  script.src = `https://www.clarity.ms/tag/${id}`;
  started = true;
  document.head.append(script);
}

/** Stop before a link or form can replace the public document with private data. */
export function watchHeatmapNavigation() {
  const click = (event: MouseEvent) => {
    const anchor =
      event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (
      anchor instanceof HTMLAnchorElement &&
      !isHeatmapUrl(new URL(anchor.href))
    )
      stopHeatmap();
  };
  const submit = () => stopHeatmap();
  const navigate = (event: Event) => {
    const url = (event as Event & { destination?: { url?: string } })
      .destination?.url;
    if (url && !isHeatmapUrl(new URL(url))) stopHeatmap();
  };
  const navigation = (window as Window & { navigation?: EventTarget })
    .navigation;
  document.addEventListener("click", click, true);
  document.addEventListener("submit", submit, true);
  navigation?.addEventListener("navigate", navigate);
  return () => {
    document.removeEventListener("click", click, true);
    document.removeEventListener("submit", submit, true);
    navigation?.removeEventListener("navigate", navigate);
    stopHeatmap();
  };
}
