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

  it("tracks consented browser events without preview tracking or Purchase", async () => {
    const meta = await import("@/lib/analytics/meta");
    expect(meta.trackMetaPageView("/sv")).toBe(false);
    expect(meta.trackMetaViewContent("noorly-gift", 799)).toBe(false);
    expect(meta.trackMetaInitiateCheckout(799)).toBe(false);
    expect(document.querySelector("script[data-noorly-meta]")).toBeNull();

    saveConsent({ analytics: false, marketing: true });
    expect(meta.trackMetaPageView("/admin-preview")).toBe(false);
    expect(meta.trackMetaPageView("/sv?email=user@example.com")).toBe(false);
    expect(meta.trackMetaPageView("/sv")).toBe(true);
    expect(meta.trackMetaPageView("/sv")).toBe(false);
    expect(meta.trackMetaPageView("/sv/shop")).toBe(true);
    expect(meta.trackMetaViewContent("noorly-gift", 799)).toBe(true);
    expect(meta.trackMetaViewContent("bad@example.com", 799)).toBe(false);
    expect(meta.trackMetaInitiateCheckout(-1)).toBe(false);
    expect(meta.trackMetaInitiateCheckout(799)).toBe(true);
    const commands = window.fbq!.queue;
    expect(commands.filter((call) => call[2] === "PageView")).toHaveLength(2);
    expect(commands.filter((call) => call[2] === "ViewContent")).toHaveLength(1);
    expect(
      commands.filter((call) => call[2] === "InitiateCheckout"),
    ).toHaveLength(1);
    expect(commands.some((call) => call[2] === "Purchase")).toBe(false);

    saveConsent({ analytics: false, marketing: false });
    meta.updateMetaConsent();
    expect(meta.trackMetaPageView("/sv")).toBe(false);
    expect(meta.trackMetaInitiateCheckout(799)).toBe(false);
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
