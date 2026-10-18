"use client";

import {
  analyticsEventSchema,
  type AnalyticsEvent,
  type AnalyticsProperties,
} from "./schema";
import { getConsent } from "./consent";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}
const seen = new Set<string>();
const SESSION_KEY = "stilla-analytics-session";
const ATTRIBUTION_KEY = "stilla-attribution-v1";
let inMemorySession: string | undefined;
let enabled = false;

function sessionId() {
  if (!getConsent()?.analytics) return undefined;
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    inMemorySession ??= crypto.randomUUID();
    return inMemorySession;
  }
}

export function captureAttribution() {
  if (!getConsent()?.analytics) return {};
  try {
    const params = new URLSearchParams(location.search);
    const safe = (key: string) => {
      const value = params.get(key);
      return value && /^[\w .~-]{1,80}$/.test(value) ? value : undefined;
    };
    const referrerOrigin = document.referrer
      ? new URL(document.referrer).origin
      : undefined;
    const touch = {
      source: safe("utm_source"),
      medium: safe("utm_medium"),
      campaign: safe("utm_campaign"),
      referrer: referrerOrigin !== location.origin ? referrerOrigin : undefined,
    };
    const existing = JSON.parse(
      sessionStorage.getItem(ATTRIBUTION_KEY) ?? "{}",
    ) as Pick<AnalyticsProperties, "first_touch" | "last_touch">;
    const hasCampaign = Boolean(
      touch.source || touch.medium || touch.campaign || touch.referrer,
    );
    const result = {
      first_touch: existing.first_touch ?? touch,
      last_touch: hasCampaign ? touch : (existing.last_touch ?? touch),
    };
    const validated = analyticsEventSchema.parse({
      name: "page_viewed",
      properties: result,
    }).properties;
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(validated));
    return validated;
  } catch {
    return {};
  }
}

/** No provider, event storage or anonymous ID exists before analytics consent. */
export function trackEvent(event: AnalyticsEvent, dedupeKey?: string): boolean {
  try {
    return dispatchEvent(event, dedupeKey);
  } catch {
    return false;
  }
}
function dispatchEvent(event: AnalyticsEvent, dedupeKey?: string): boolean {
  if (
    typeof window === "undefined" ||
    !getConsent()?.analytics ||
    event.name === "purchase"
  )
    return false;
  const parsed = analyticsEventSchema.safeParse(event);
  if (!parsed.success || (dedupeKey && seen.has(dedupeKey))) return false;
  if (dedupeKey) seen.add(dedupeKey);
  const properties = {
    ...captureAttribution(),
    ...parsed.data.properties,
    anonymous_session_id: sessionId(),
    device_category:
      window.innerWidth < 768
        ? "mobile"
        : window.innerWidth < 1024
          ? "tablet"
          : "desktop",
    reduced_motion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };
  try {
    if (enabled && process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID)
      window.gtag?.("event", event.name, properties);
  } catch {
    /* Analytics is never critical. */
  }
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (enabled && key && host) {
    try {
      void fetch(`${host.replace(/\/$/, "")}/capture/`, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          event: event.name,
          distinct_id: properties.anonymous_session_id,
          properties: { ...properties, $process_person_profile: false },
        }),
      }).catch(() => undefined);
    } catch {
      /* Offline and blocked providers cannot affect commerce. */
    }
  }
  if (process.env.NODE_ENV === "development")
    console.debug("[analytics]", event.name, properties);
  return true;
}

export function updateAnalyticsConsent() {
  const granted = Boolean(getConsent()?.analytics);
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  enabled = granted;
  if (measurementId)
    (window as unknown as Record<string, unknown>)[
      `ga-disable-${measurementId}`
    ] = !granted;
  if (!granted) {
    try {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    } catch {
      /* Continue clearing identifiers even if the vendor fails. */
    }
    document.querySelector("script[data-stilla-analytics]")?.remove();
    seen.clear();
    inMemorySession = undefined;
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(ATTRIBUTION_KEY);
    } catch {
      /* Storage may be blocked. */
    }
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (name?.startsWith("_ga")) {
        const host = location.hostname;
        const domains = [
          "",
          host,
          ...host
            .split(".")
            .map((_, index, parts) => parts.slice(index).join("."))
            .filter((domain) => domain.includes(".")),
        ];
        for (const domain of domains)
          document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} SameSite=Lax`;
      }
    }
    return;
  }
  captureAttribution();
  if (!measurementId || document.querySelector("script[data-stilla-analytics]"))
    return;
  window.dataLayer ??= [];
  // gtag's documented queue uses an Arguments object, rather than an event array.
  window.gtag ??= function () {
    // eslint-disable-next-line prefer-rest-params -- gtag's official queue protocol requires an Arguments object.
    window.dataLayer!.push(arguments);
  };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.dataset.stillaAnalytics = "true";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
}

export function getAnalyticsCheckoutAttributes(): Record<string, string> {
  try {
    const id = sessionId();
    return {
      _stilla_analytics_consent: id ? "granted" : "denied",
      _stilla_analytics_session: id ?? "",
    };
  } catch {
    return {
      _stilla_analytics_consent: "denied",
      _stilla_analytics_session: "",
    };
  }
}
