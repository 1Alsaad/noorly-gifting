import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_KEY, saveConsent } from "@/lib/analytics/consent";

afterEach(() => vi.unstubAllEnvs());

describe("marketing consent and genuine lead events", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.removeItem(CONSENT_KEY);
    document.querySelector("script[data-noorly-meta]")?.remove();
    delete window.fbq;
    delete window._fbq;
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "511816900240916");
  });

  it("does not load Meta or count a lead before marketing consent", async () => {
    const meta = await import("@/lib/analytics/meta");
    saveConsent({ analytics: true, marketing: false });
    meta.updateMetaConsent();
    expect(window.fbq).toBeUndefined();
    expect(document.querySelector("script[data-noorly-meta]")).toBeNull();
    expect(meta.trackInterestLead(crypto.randomUUID(), "candle-sand")).toBe(
      false,
    );
  });

  it("allows marketing independently of analytics, deduplicates and honors revocation", async () => {
    const meta = await import("@/lib/analytics/meta");
    saveConsent({ analytics: false, marketing: true });
    meta.updateMetaConsent();
    expect(document.querySelector("script[data-noorly-meta]")).toHaveAttribute(
      "src",
      "https://connect.facebook.net/en_US/fbevents.js",
    );
    const eventId = crypto.randomUUID();
    expect(meta.trackInterestLead(eventId, "candle-sand")).toBe(true);
    expect(meta.trackInterestLead(eventId, "candle-sand")).toBe(false);
    expect(window.fbq!.queue.filter((call) => call[1] === "Lead")).toHaveLength(
      1,
    );
    saveConsent({ analytics: false, marketing: false });
    meta.updateMetaConsent();
    expect(window.fbq!.queue).toEqual([["consent", "revoke"]]);
    expect(meta.trackInterestLead(crypto.randomUUID(), "candle-sand")).toBe(
      false,
    );
  });
});
