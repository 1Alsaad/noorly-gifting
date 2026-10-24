import { afterEach, describe, expect, it, vi } from "vitest";
import {
  launchBundleCopy,
  launchBundleHandle,
  launchBundleHref,
  legacyLaunchBundleHandle,
} from "@/content/launch-bundle";
import { getDictionary } from "@/content/translations";
import { getCustomerPolicy } from "@/content/customer-policies";

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
          ...["terms", "shipping-returns", "privacy"].flatMap(
            (page) =>
              getCustomerPolicy(locale, page)?.sections.flatMap(
                (section) => section.paragraphs,
              ) ?? [],
          ),
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
    expect(live.deliveryText).toContain("Shipping within Sweden is included");
    expect(live.deliveryText).not.toContain("Ljusstund");
    const terms = getCustomerPolicy("en", "terms");
    const termsText = terms?.sections
      .flatMap((section) => section.paragraphs)
      .join(" ");
    expect(termsText).toContain("Shopify checkout");
    expect(termsText).not.toMatch(/not open|fictional|no purchase/i);
    expect(live.pages.cookies.text).not.toMatch(/no marketing provider/i);
    expect(live.footer.rights).toBe("NOORLY");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    const preparation = getDictionary("en");
    expect(preparation.pages.about).toEqual(live.pages.about);
    expect(getCustomerPolicy("en", "terms")).toEqual(terms);
  });
});
