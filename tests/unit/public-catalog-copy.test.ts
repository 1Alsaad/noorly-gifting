import { afterEach, describe, expect, it, vi } from "vitest";
import {
  launchBundleCopy,
  launchBundleHandle,
  launchBundleHref,
  legacyLaunchBundleHandle,
} from "@/content/launch-bundle";
import { getDictionary } from "@/content/translations";

afterEach(() => vi.unstubAllEnvs());

describe("Noorly public stock and product copy", () => {
  it("describes teak bowls and packaged candle sand, not the old glass set", () => {
    for (const locale of ["sv", "en"] as const) {
      const copy = launchBundleCopy[locale];
      const text = [
        copy.description,
        copy.preorderExplanation,
        copy.provenance,
        copy.contents.join(" "),
      ].join(" ");
      expect(text).toContain("TeakB-37");
      expect(text).not.toMatch(/ELYSIA|Candledust|Nordic Lights|Dark Honey/);
      expect(copy.provenance).toMatch(
        locale === "sv" ? /träskålen/i : /wooden bowl/i,
      );
    }
    expect(launchBundleHref("sv")).toContain(launchBundleHandle);
    expect(legacyLaunchBundleHandle).not.toBe(launchBundleHandle);
  });

  it.each(["true", "false"])(
    "has no fictional or demo public copy when test mode is %s",
    (mode) => {
      vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", mode);
      for (const locale of ["sv", "en"] as const) {
        const t = getDictionary(locale);
        const visible = [
          t.footer.rights,
          t.pages.about.text,
          t.pages.terms.text,
          t.pages["shipping-returns"].text,
          t.pages.privacy.text,
          t.home.text,
          t.home.reviewsText,
        ].join(" ");
        expect(visible).not.toMatch(
          /fictional|fiktiv|demonstration|demo store|mock|preview submission|arbetskoncept|utkast/i,
        );
      }
    },
  );

  it("keeps live purchase labels and the factual service copy without reviving closed-sale terms", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    const live = getDictionary("en");
    expect(live.checkout).toBe("Continue to secure checkout");
    expect(live.deliveryText).toContain("included for Ljusstund");
    expect(live.pages.terms.text).toContain("Shopify checkout");
    expect(live.pages.terms.text).not.toMatch(
      /not open|fictional|no purchase/i,
    );
    expect(live.pages.cookies.text).not.toMatch(/no marketing provider/i);
    expect(live.footer.rights).toBe("NOORLY");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    const preparation = getDictionary("en");
    expect(preparation.pages.about).toEqual(live.pages.about);
    expect(preparation.pages.privacy).toEqual(live.pages.privacy);
    expect(preparation.pages.terms.text).toMatch(/not open yet/i);
  });
});
