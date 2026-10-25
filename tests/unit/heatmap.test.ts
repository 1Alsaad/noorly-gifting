import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_KEY, saveConsent } from "@/lib/analytics/consent";

const reload = vi.fn();
function visit(path = "/sv/products/candle-sand", host = "noorlynordic.com") {
  const url = new URL(`https://${host}${path}`);
  vi.stubGlobal("location", { href: url.href, hostname: url.hostname, reload });
}
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  document.querySelector("script[data-noorly-clarity]")?.remove();
  delete window.clarity;
  reload.mockClear();
  vi.spyOn(document, "referrer", "get").mockReturnValue("");
  vi.stubEnv("NEXT_PUBLIC_CLARITY_PROJECT_ID", "testproject1");
  vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
  vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  visit();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
const tag = () =>
  document.querySelector<HTMLScriptElement>("script[data-noorly-clarity]");

describe("Clarity privacy boundary", () => {
  it("does not load for missing, rejected, expired, or marketing-only consent", async () => {
    const { updateHeatmapConsent } = await import("@/lib/analytics/clarity");
    updateHeatmapConsent();
    expect(tag()).toBeNull();
    saveConsent({ analytics: false, marketing: true });
    updateHeatmapConsent();
    expect(tag()).toBeNull();
    expect(window.clarity).toBeUndefined();
    expect(reload).not.toHaveBeenCalled();
    saveConsent({ analytics: false, marketing: false });
    updateHeatmapConsent();
    expect(tag()).toBeNull();
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        version: 1,
        necessary: true,
        analytics: true,
        marketing: true,
        updatedAt: Date.now() - 181 * 86400_000,
      }),
    );
    updateHeatmapConsent();
    expect(tag()).toBeNull();
  });
  it.each([
    "https://noorlynordic.com/sv/account",
    "https://noorlynordic.com/sv?email=private@example.com",
    "https://checkout.noorlynordic.com/checkouts/private",
    "https://example.com/private",
  ])("does not expose a non-public referrer %s", async (referrer) => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(referrer);
    saveConsent({ analytics: true, marketing: false });
    (await import("@/lib/analytics/clarity")).updateHeatmapConsent();
    expect(tag()).toBeNull();
  });
  it("loads once after independent analytics consent, with masking and ads denied", async () => {
    const { updateHeatmapConsent } = await import("@/lib/analytics/clarity");
    saveConsent({ analytics: true, marketing: false });
    updateHeatmapConsent();
    updateHeatmapConsent();
    expect(tag()?.src).toBe("https://www.clarity.ms/tag/testproject1");
    expect(
      document.querySelectorAll("script[data-noorly-clarity]"),
    ).toHaveLength(1);
    expect(document.documentElement).toHaveAttribute(
      "data-clarity-mask",
      "true",
    );
    expect(window.clarity?.q).toEqual([
      ["consentv2", { analytics_Storage: "granted", ad_Storage: "denied" }],
    ]);
  });
  it.each([
    "/admin-preview",
    "/sv/account",
    "/sv/checkout",
    "/sv/cart",
    "/sv/contact",
    "/sv/corporate-gifting",
    "/sv/interest",
    "/sv/mock-checkout",
    "/sv/products/candle-sand?email=private@example.com",
    "/sv#private",
  ])("never starts recording on %s", async (path) => {
    visit(path);
    saveConsent({ analytics: true, marketing: true });
    (await import("@/lib/analytics/clarity")).updateHeatmapConsent();
    expect(tag()).toBeNull();
  });
  it.each(["checkout.noorlynordic.com", "preview.vercel.app", "localhost"])(
    "rejects non-storefront host %s",
    async (host) => {
      visit("/sv", host);
      saveConsent({ analytics: true, marketing: true });
      (await import("@/lib/analytics/clarity")).updateHeatmapConsent();
      expect(tag()).toBeNull();
    },
  );
  it("fails closed for missing project configuration and mock commerce", async () => {
    saveConsent({ analytics: true, marketing: true });
    const { updateHeatmapConsent } = await import("@/lib/analytics/clarity");
    vi.stubEnv("NEXT_PUBLIC_CLARITY_PROJECT_ID", "");
    updateHeatmapConsent();
    expect(tag()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_CLARITY_PROJECT_ID", "testproject1");
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "mock");
    updateHeatmapConsent();
    expect(tag()).toBeNull();
  });
  it("withdraws loaded recording and disposes the runtime without changing marketing", async () => {
    const { updateHeatmapConsent } = await import("@/lib/analytics/clarity");
    saveConsent({ analytics: true, marketing: true });
    updateHeatmapConsent();
    const provider = vi.fn();
    window.clarity = provider;
    saveConsent({ analytics: false, marketing: true });
    updateHeatmapConsent();
    expect(provider.mock.calls).toEqual([
      ["consentv2", { analytics_Storage: "denied", ad_Storage: "denied" }],
      ["stop"],
    ]);
    expect(tag()).toBeNull();
    expect(reload).toHaveBeenCalledOnce();
    expect(
      (await import("@/lib/analytics/consent")).getConsent()?.marketing,
    ).toBe(true);
  });
  it("replaces pending grant commands if consent is withdrawn during tag loading", async () => {
    const { updateHeatmapConsent } = await import("@/lib/analytics/clarity");
    saveConsent({ analytics: true, marketing: false });
    updateHeatmapConsent();
    saveConsent({ analytics: false, marketing: false });
    updateHeatmapConsent();
    expect(window.clarity?.q).toEqual([
      ["consentv2", { analytics_Storage: "denied", ad_Storage: "denied" }],
      ["stop"],
    ]);
    expect(reload).toHaveBeenCalledOnce();
    expect(tag()).toBeNull();
  });
  it("stops before following an excluded checkout link and still reloads on later withdrawal", async () => {
    const { updateHeatmapConsent, watchHeatmapNavigation } =
      await import("@/lib/analytics/clarity");
    saveConsent({ analytics: true, marketing: false });
    updateHeatmapConsent();
    const provider = vi.fn();
    window.clarity = provider;
    const cleanup = watchHeatmapNavigation();
    const link = document.createElement("a");
    link.href = "https://checkout.noorlynordic.com/checkouts/private";
    link.addEventListener("click", (event) => event.preventDefault());
    document.body.append(link);
    link.click();
    expect(provider).toHaveBeenCalledWith("stop");
    expect(tag()).toBeNull();
    expect(reload).not.toHaveBeenCalled();
    saveConsent({ analytics: false, marketing: false });
    updateHeatmapConsent();
    expect(reload).toHaveBeenCalledOnce();
    link.remove();
    cleanup();
  });
  it("stops before a form submits", async () => {
    const { updateHeatmapConsent, watchHeatmapNavigation } =
      await import("@/lib/analytics/clarity");
    saveConsent({ analytics: true, marketing: false });
    updateHeatmapConsent();
    const provider = vi.fn();
    window.clarity = provider;
    const cleanup = watchHeatmapNavigation();
    document.dispatchEvent(new Event("submit"));
    expect(provider).toHaveBeenCalledWith("stop");
    expect(tag()).toBeNull();
    cleanup();
  });
});
