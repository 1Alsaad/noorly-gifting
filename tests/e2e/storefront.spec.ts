import {
  launchBundleHandle,
  launchBundlePhotos,
  supplierBowlUrl,
} from "../../src/content/launch-bundle";
import { installTestSceneMedia } from "./media-fixture";
import { createHash } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  // Isolate rate-limit counters between independent browser sessions without changing production limits.
  const suffix = createHash("sha256")
    .update(info.testId)
    .digest("hex")
    .slice(0, 8);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `e2e-${suffix}` });
});

async function rejectOptional(page: Page) {
  const reject = page.getByRole("button", {
    name: "Reject optional",
    exact: true,
  });
  if (await reject.isVisible()) await reject.click();
}
async function expectSupplierBowlGallery(page: Page) {
  const firstPhoto = launchBundlePhotos[0];
  const gallery = page.locator("main .gallery-main");
  const image = gallery.locator("img");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("alt", firstPhoto.alt.en);
  await expect(gallery).toHaveAttribute("href", firstPhoto.url);
  const imageSource = new URL((await image.getAttribute("src"))!, page.url());
  expect(imageSource.searchParams.get("url")).toBe(firstPhoto.url);
  await expect(
    page.locator("main .planned-bundle-photo-note a"),
  ).toHaveAttribute("href", supplierBowlUrl);
  await expect(page.locator("main .planned-bundle-photo-note p")).toHaveText(
    "The supplier's teak-bowl photographs show model TeakB-37. Shape and grain vary naturally. The fruit is styling and is not included. The photographs show the individual products. The complete Ljusstund set has not yet been photographed.",
  );
}
async function continueBuilder(page: Page) {
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function addCandle(page: Page) {
  await page.goto("/en/products/winter-candle");
  await rejectOptional(page);
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Added to your bag", exact: true }),
  ).toBeVisible();
}

test("the seasonal home renders conventional shopping and skips the cinematic story", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Step into\s+the season\./,
  );
  await rejectOptional(page);
  await page.getByRole("link", { name: "Skip experience" }).first().click();
  await expect(page).toHaveURL(/\/en#gifts$/);
  await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
  await expect(page.locator("#gifts")).toBeInViewport();
  await expect(
    page.locator("#gifts").getByRole("heading", { name: "Noorly Ljusstund" }),
  ).toBeVisible();
  await expect(page.locator('a[href*="build-a-box"]')).toHaveCount(0);
  await expect(page.locator('a[href*="products/candle-sand"]')).toHaveCount(0);
  await expect(
    page.locator("#gifts").getByText(/Planned set price: SEK 799/),
  ).toBeVisible();
});

for (const linkName of ["Skip experience", "Explore the collection"]) {
  test(`${linkName} keeps gifts in view when video metadata arrives late`, async ({
    page,
  }) => {
    // Hold media responses so metadata cannot arrive before anchor navigation.
    await page.route("**/*.mp4", () => {});
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await rejectOptional(page);
    await expect(
      page.locator('[data-scene="winter-entrance"] video'),
    ).toHaveCount(1);
    await page.getByRole("link", { name: linkName }).first().click();
    await expect(page).toHaveURL(/\/en#gifts$/);

    // Reproduce the late event that previously expanded a scene after skipping.
    await page.evaluate(() => {
      document
        .querySelectorAll(".cinematic-experience video")
        .forEach((video) => video.dispatchEvent(new Event("loadedmetadata")));
    });
    await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
    for (const scene of ["winter-entrance"]) {
      await expect(page.locator(`[data-scene="${scene}"]`)).toHaveAttribute(
        "data-enhanced",
        "false",
      );
      await expect(page.locator(`[data-scene="${scene}"]`)).toHaveAttribute(
        "data-pinned",
        "false",
      );
    }
    await expect(page.locator("#gifts")).toBeInViewport();
  });
}

test("late metadata preserves the reserved scene ranges and gifts position", async ({
  page,
}) => {
  await page.route("**/*.mp4", () => {});
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const entrance = page.locator('[data-scene="winter-entrance"]');
  await expect(entrance).toHaveAttribute("data-pinned", "true");
  await expect(entrance).toHaveAttribute("data-enhanced", "false");
  await expect(entrance.locator("video")).toHaveCount(1);
  const geometry = () =>
    page.evaluate(() => ({
      heights: [...document.querySelectorAll<HTMLElement>("[data-scene]")].map(
        (scene) => scene.offsetHeight,
      ),
      gifts:
        document.getElementById("gifts")!.getBoundingClientRect().top +
        window.scrollY,
    }));
  const before = await geometry();
  await entrance.locator("video").dispatchEvent("loadedmetadata");
  await expect(entrance).toHaveAttribute("data-enhanced", "true");
  expect(await geometry()).toEqual(before);
});

test("the planned bundle is keyboard accessible and cannot be purchased", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await rejectOptional(page);
  const link = page.locator(".cinema-static-product-button");
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/en/products/" + launchBundleHandle);
  await expect(
    page.getByRole("heading", { name: "Noorly Ljusstund", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This gift set is currently unavailable to order. Contact us to ask when it will be available.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "One 300 g pouch of candle sand in your chosen colour and scent",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/not a heat-resistant candle vessel/),
  ).toBeVisible();
  await expect(
    page.getByText("One decorative teakwood bowl, AWGifts model TeakB-37"),
  ).toBeVisible();
  await expectSupplierBowlGallery(page);
  await expect(page.locator("main .gallery-thumbnails button")).toHaveCount(
    launchBundlePhotos.length,
  );
  await expect(
    page.getByRole("button", { name: /Add to|checkout/i }),
  ).toHaveCount(0);
  const json = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(json.join("")).not.toContain('"@type":"Offer"');
});

test("scroll progress seeks forward and backward with a deterministic test media adapter", async ({
  page,
}) => {
  // This validates scroll/media integration independently of replaceable merchant video files.
  // Real decoding, keyframes and bandwidth remain a media acceptance check before launch.
  await installTestSceneMedia(page);
  await page.goto("/en");
  await rejectOptional(page);
  const entrance = page.locator('[data-scene="winter-entrance"]');
  await expect(entrance).toHaveAttribute("data-enhanced", "true");
  await entrance.evaluate((scene: HTMLElement) =>
    window.scrollTo(
      0,
      scene.getBoundingClientRect().top +
        window.scrollY +
        (scene.offsetHeight - window.innerHeight) * 0.7,
    ),
  );
  await expect
    .poll(async () => Number(await entrance.getAttribute("data-progress")))
    .toBeGreaterThan(60);
  const forwardTime = await entrance
    .locator("video")
    .evaluate((video: HTMLVideoElement) => video.currentTime);
  expect(forwardTime).toBeGreaterThan(4);
  await entrance.evaluate((scene: HTMLElement) =>
    window.scrollTo(
      0,
      scene.getBoundingClientRect().top +
        window.scrollY +
        (scene.offsetHeight - window.innerHeight) * 0.2,
    ),
  );
  await expect
    .poll(async () => Number(await entrance.getAttribute("data-progress")))
    .toBeLessThan(30);
  expect(
    await entrance
      .locator("video")
      .evaluate((video: HTMLVideoElement) => video.currentTime),
  ).toBeLessThan(forwardTime);
  await expect
    .poll(() =>
      entrance
        .locator("video")
        .evaluate((video: HTMLVideoElement) =>
          Math.abs(video.currentTime - 14.96 * 0.2),
        ),
    )
    .toBeLessThan(0.03);
  // Force a single wheel-sized step; the video must render intermediate times
  // even though the document itself moves immediately.
  const step = await entrance.evaluate(async (scene: HTMLElement) => {
    const video = scene.querySelector("video")!;
    const before = video.currentTime;
    const times = new Set<number>();
    window.scrollBy({ top: 120, behavior: "instant" });
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const sample = (now: number) => {
        times.add(video.currentTime);
        if (now - started < 450) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return { before, after: video.currentTime, updates: times.size };
  });
  expect(step.after).toBeGreaterThan(step.before);
  expect(step.updates).toBeGreaterThan(3);
  await entrance.evaluate((scene: HTMLElement) =>
    window.scrollTo({
      top: scene.offsetTop + (scene.offsetHeight - innerHeight) * 0.8,
      behavior: "instant",
    }),
  );
  const details = entrance
    .locator(".cinema-shopping")
    .getByRole("link", { name: "Discover Ljusstund" });
  await expect(details).toBeVisible();
  await expect(details).toHaveAttribute(
    "href",
    "/en/products/" + launchBundleHandle,
  );
  await expect(entrance.locator(".cinema-shopping button")).toHaveCount(0);
});

test("the continuous film clears copy for the orbit, shops during the hold, and hands off to the collection", async ({
  page,
}) => {
  await installTestSceneMedia(page);
  await page.goto("/en");
  await rejectOptional(page);
  const scene = page.locator('[data-scene="winter-entrance"]');
  const seek = async (progress: number) =>
    scene.evaluate(
      (element: HTMLElement, p) =>
        window.scrollTo({
          top: element.offsetTop + (element.offsetHeight - innerHeight) * p,
          behavior: "instant",
        }),
      progress,
    );
  const opacity = (selector: string) =>
    scene
      .locator(selector)
      .evaluate((element) => Number(getComputedStyle(element).opacity));
  await expect(scene).toHaveAttribute("data-enhanced", "true");
  await expect(page.locator(".cinema-scene")).toHaveCount(1);
  await seek(0.2);
  await expect.poll(() => opacity(".cinema-copy")).toBeLessThan(0.01);
  await expect.poll(() => opacity(".cinema-story-beat")).toBeGreaterThan(0.99);
  await scene
    .locator(".cinema-actions")
    .getByRole("link", { name: "Explore the collection" })
    .focus();
  await expect.poll(() => opacity(".cinema-copy")).toBe(1);

  await scene.getByRole("link", { name: "Skip experience" }).focus();
  await seek(0.5);
  await expect.poll(() => opacity(".cinema-story-beat")).toBe(0);
  const shopping = scene.locator(".cinema-shopping");
  await expect(shopping).toHaveAttribute("inert", "");
  await expect(
    shopping.getByRole("button", { name: "Add to cart" }),
  ).toHaveCount(0);
  // Requested time alone must not reveal commerce before a decoded hold frame.
  await scene.locator("video").evaluate((video) => {
    video.dataset.holdDecode = "true";
  });
  await seek(0.8);
  await expect
    .poll(() =>
      scene
        .locator("video")
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeGreaterThan(11.9);
  await expect(shopping).toHaveAttribute("inert", "");
  await scene.locator("video").evaluate((video) => {
    delete video.dataset.holdDecode;
    video.dispatchEvent(new Event("seeked"));
  });
  await expect(shopping).toHaveAttribute("data-visible", "true");
  const accessibility = await new AxeBuilder({ page })
    .include(".cinema-shopping")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);

  await expect(shopping.getByText(/Planned set price: SEK 799/)).toBeVisible();
  await expect(
    shopping.getByText("Ordering is currently unavailable.", { exact: true }),
  ).toBeVisible();
  await expect(shopping.getByRole("button")).toHaveCount(0);
  await scene.getByRole("link", { name: "Skip experience" }).focus();
  await seek(0.4);
  await expect(shopping).toHaveAttribute("inert", "");
  // The collection rises over a stationary final frame.
  await seek(1.08);
  await expect(scene).toHaveAttribute("data-floating", "true");
  expect(
    await scene
      .locator(".cinema-stage")
      .evaluate((element) => element.getBoundingClientRect().top),
  ).toBe(0);
  const panel = await page
    .locator(".cinema-collection-handoff")
    .evaluate((element) => ({
      top: element.getBoundingClientRect().top,
      viewport: innerHeight,
    }));
  expect(panel.top).toBeGreaterThan(0);
  expect(panel.top).toBeLessThan(panel.viewport);
  await page.keyboard.press("ArrowLeft");
  await shopping.getByRole("link", { name: "Discover Ljusstund" }).focus();
  expect(
    await page
      .locator(".cinema-collection-handoff")
      .evaluate((element) => element.getBoundingClientRect().top - innerHeight),
  ).toBeGreaterThanOrEqual(-1);
  await seek(0.98);
  await shopping.getByRole("link", { name: "Explore the collection" }).click();
  await expect(page).toHaveURL(/#gifts$/);
  await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
  await expect(page.locator("#gifts")).toBeInViewport();
});

test("product variants, cart quantities and preview checkout work without optional consent", async ({
  page,
}) => {
  await page.goto("/en/products/winter-candle");
  await rejectOptional(page);
  await page.getByLabel("Choose an option").selectOption("winter-candle-large");
  await expect(
    page.getByRole("button", { name: "Currently unavailable", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Choose an option")
    .selectOption("winter-candle-default");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Added to your bag", exact: true }),
  ).toBeVisible();
  await page.goto("/en/cart");
  await expect(
    page.getByRole("heading", { name: "Winter Candle", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to bag: Winter Candle", exact: true })
    .click();
  await expect(page.getByLabel("Quantity", { exact: true })).toHaveText("2");
  await page
    .getByRole("button", { name: "Quantity −: Winter Candle", exact: true })
    .click();
  await expect(page.getByLabel("Quantity", { exact: true })).toHaveText("1");
  await page
    .getByRole("button", { name: "Continue to secure checkout", exact: true })
    .click();
  await expect(page).toHaveURL("/en/mock-checkout");
  await expect(
    page.getByRole("heading", { name: "Your preview bag is ready." }),
  ).toBeVisible();
  await expect(
    page.getByText(/No payment is collected and no order has been placed/),
  ).toBeVisible();
  await expect(page.locator('input[autocomplete^="cc-"]')).toHaveCount(0);
});

test("a six-step box survives refresh, groups its lines and can be edited before checkout", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/en/build-a-box");
  await rejectOptional(page);
  await expect(
    page.getByRole("button", { name: /The little box/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await continueBuilder(page);
  await expect(
    page.getByRole("button", { name: /Winter Candle/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await continueBuilder(page);
  await continueBuilder(page);
  await expect(
    page.getByText("Please complete this step.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Forest Tea/ }).click();
  await page.getByRole("button", { name: /Dark Chocolate/ }).click();
  await expect(
    page.getByRole("button", { name: /Linen Napkin/ }),
  ).toBeDisabled();
  await continueBuilder(page);
  await page.getByRole("button", { name: /Greeting Card/ }).click();
  await continueBuilder(page);
  const message = "For your quieter winter mornings. ".repeat(12).slice(0, 280);
  await page.getByLabel("Your personal message", { exact: true }).fill(message);
  await expect(
    page.getByLabel("Your personal message", { exact: true }),
  ).toHaveAttribute("maxlength", "280");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("stilla-box-builder-v1") ?? "{}")
            .giftMessage,
      ),
    )
    .toBe(message);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /The little box/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await continueBuilder(page);
  await continueBuilder(page);
  await expect(
    page.getByRole("button", { name: /Forest Tea/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Dark Chocolate/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await continueBuilder(page);
  await expect(
    page.getByRole("button", { name: /Greeting Card/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await continueBuilder(page);
  await expect(
    page.getByLabel("Your personal message", { exact: true }),
  ).toHaveValue(message);
  await continueBuilder(page);
  await page
    .getByRole("button", { name: "Add your gift box to bag", exact: true })
    .click();
  await expect(
    page.getByText("Your personal gift box is in the bag.", { exact: true }),
  ).toBeVisible();
  await page.goto("/en/cart");
  await expect(
    page.getByRole("heading", { name: "Your own gift box", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".cart-group")).toHaveCount(1);
  await expect(page.locator(".cart-line")).toHaveCount(5);
  await expect(page.locator("blockquote")).toHaveText(message.trim());
  const edit = page.getByRole("link", { name: "Edit your box", exact: true });
  const originalHref = await edit.getAttribute("href");
  await edit.click();
  await expect(page).toHaveURL(/\/en\/build-a-box\?edit=/);
  await continueBuilder(page);
  await continueBuilder(page);
  await continueBuilder(page);
  await continueBuilder(page);
  await page
    .getByLabel("Your personal message", { exact: true })
    .fill("A new note, with the same thoughtful box.");
  await continueBuilder(page);
  await page
    .getByRole("button", { name: "Add your gift box to bag", exact: true })
    .click();
  await expect(
    page.getByText("Your personal gift box is in the bag.", { exact: true }),
  ).toBeVisible();
  await page.goto("/en/cart");
  await expect(page.locator(".cart-group")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Edit your box", exact: true }),
  ).toHaveAttribute("href", originalHref!);
  await expect(page.locator("blockquote")).toHaveText(
    "A new note, with the same thoughtful box.",
  );
  await page
    .getByRole("button", { name: "Continue to secure checkout", exact: true })
    .click();
  await expect(page).toHaveURL("/en/mock-checkout");
});

test("consent can be rejected, reopened, customized and revoked with focus restoration", async ({
  page,
}) => {
  const optionalRequests: string[] = [];
  page.on("request", (request) => {
    if (/googletagmanager|google-analytics|posthog/.test(request.url()))
      optionalRequests.push(request.url());
  });
  await page.goto("/en");
  await page
    .getByRole("button", { name: "Reject optional", exact: true })
    .click();
  expect(optionalRequests).toEqual([]);
  const settings = page.getByRole("button", {
    name: "Cookie settings",
    exact: true,
  });
  await settings.click();
  const dialog = page.getByRole("dialog", {
    name: "Your choices, at your pace",
  });
  await expect(dialog.getByLabel("Necessary", { exact: true })).toBeChecked();
  await expect(dialog.getByLabel("Necessary", { exact: true })).toBeDisabled();
  await expect(
    dialog.getByLabel("Analytics", { exact: true }),
  ).not.toBeChecked();
  await dialog.getByLabel("Analytics", { exact: true }).check();
  await dialog
    .getByRole("button", { name: "Save my choices", exact: true })
    .click();
  await expect(settings).toBeFocused();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("stilla-consent-v1") ?? "{}")
            .analytics,
      ),
    )
    .toBe(true);
  await settings.click();
  await dialog.getByLabel("Analytics", { exact: true }).uncheck();
  await dialog
    .getByRole("button", { name: "Save my choices", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("stilla-consent-v1") ?? "{}")
            .analytics,
      ),
    )
    .toBe(false);
  await expect(settings).toBeFocused();
});

test("reduced motion retains shopping and keyboard skip navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await rejectOptional(page);
  await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
  await expect(page.locator('[data-scene="winter-entrance"]')).toHaveAttribute(
    "data-enhanced",
    "false",
  );
  await page.getByRole("link", { name: "Skip experience" }).first().click();
  await expect(page.locator("#gifts")).toBeInViewport();
  await page
    .locator("#gifts")
    .getByRole("link", { name: "Discover Ljusstund" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Noorly Ljusstund", level: 1 }),
  ).toBeVisible();
});

test("important shopping pages pass automated WCAG accessibility checks", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await addCandle(page);
  for (const path of [
    "/en",
    "/en/shop",
    "/en/products/" + launchBundleHandle,
    "/en/collections/winter",
    "/en/cart",
  ]) {
    await test.step(`accessibility ${path}`, async () => {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        result.violations,
        JSON.stringify(
          result.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            nodes: nodes.map((node) => ({
              target: node.target,
              summary: node.failureSummary,
            })),
          })),
          null,
          2,
        ),
      ).toEqual([]);
    });
  }
});

test("the conventional catalogue remains useful without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto("/en");
    await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
    await page.getByRole("link", { name: "Skip experience" }).first().click();
    await expect(page.locator("#gifts")).toBeInViewport();
    await page.goto("/en/shop");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Noorly Ljusstund", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Discover Ljusstund" }).click();
    await expect(page).toHaveURL("/en/products/" + launchBundleHandle);
    await expect(
      page.getByText("Decorative teakwood bowl, AWGifts model TeakB-37"),
    ).toBeVisible();
    await expectSupplierBowlGallery(page);
    for (const [index, photo] of launchBundlePhotos.entries()) {
      await expect(
        page.getByRole("link", { name: `Image ${index + 1} ·`, exact: true }),
      ).toHaveAttribute("href", photo.url);
    }
  } finally {
    await context.close();
  }
});

test("locale links preserve the route and update the document language", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/sv");
  await expect(page.locator("html")).toHaveAttribute("lang", "sv");
  await page.goto("/sv/shop");
  await page.getByRole("link", { name: "Språk: EN", exact: true }).click();
  await expect(page).toHaveURL("/en/shop");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: "All gifts", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Language: SV", exact: true }).click();
  await expect(page).toHaveURL("/sv/shop");
  await expect(page.locator("html")).toHaveAttribute("lang", "sv");
  await expect(
    page.getByRole("heading", { level: 1, name: "Alla gåvor", exact: true }),
  ).toBeVisible();
});

test("unavailable cinematic videos restore posters and conventional product controls", async ({
  page,
}) => {
  let attempted = 0;
  await page.route("**/*.mp4", async (route) => {
    attempted += 1;
    await route.abort();
  });
  await page.goto("/en");
  await rejectOptional(page);
  const scene = page.locator('[data-scene="winter-entrance"]');
  await scene.scrollIntoViewIfNeeded();
  await expect.poll(() => attempted).toBeGreaterThan(0);
  await expect(scene).toHaveAttribute("data-enhanced", "false");
  await expect(scene.locator("video")).toHaveCount(0);
  await expect(scene.locator(".cinema-poster")).not.toHaveClass(
    /cinema-poster-hidden/,
  );
  const link = scene.locator(".cinema-static-product-button");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/en/products/" + launchBundleHandle);
});

test("Save-Data suppresses video requests while keeping shopping available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: Object.assign(new EventTarget(), {
        saveData: true,
        effectiveType: "4g",
      }),
    });
  });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp4")) requests.push(request.url());
  });
  await page.goto("/en");
  await rejectOptional(page);
  const link = page.locator(".cinema-static-product-button");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toHaveAttribute(
    "href",
    "/en/products/" + launchBundleHandle,
  );
  await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("portrait shopping uses its own film and Swedish commerce copy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installTestSceneMedia(page);
  await page.goto("/sv");
  const reject = page.getByRole("button", {
    name: "Avvisa valfria",
    exact: true,
  });
  if (await reject.isVisible()) await reject.click();
  const scene = page.locator('[data-scene="winter-entrance"]');
  await expect(scene).toHaveAttribute("data-enhanced", "true");
  await expect(scene.locator("video")).toHaveAttribute(
    "data-test-source",
    /0e98a61d-fd67-4fee-8c28-793ca27c6fce.mp4$/,
  );
  await scene.evaluate((element: HTMLElement) =>
    window.scrollTo({
      top: element.offsetTop + (element.offsetHeight - innerHeight) * 0.8,
      behavior: "instant",
    }),
  );
  const card = scene.locator(".cinema-shopping");
  await expect(card).toHaveAttribute("data-visible", "true");
  await expect(
    card.getByRole("heading", { name: "Noorly Ljusstund" }),
  ).toBeVisible();
  await expect(card.getByText(/Planerat setpris: 799 kr/)).toBeVisible();
  await expect(card.getByRole("button")).toHaveCount(0);
  // Visibility changes before the 240ms entrance transition finishes. Measure
  // the settled layout while preserving the original viewport-clearance check.
  await expect(card).toHaveCSS("transform", "none");
  const geometry = await scene.evaluate((element) => {
    const video = element.querySelector("video")!;
    const media = element
      .querySelector(".cinema-media")!
      .getBoundingClientRect();
    const panel = element
      .querySelector(".cinema-shopping")!
      .getBoundingClientRect();
    return {
      mediaBottom: media.bottom,
      mediaHeight: media.height,
      panelTop: panel.top,
      panelBottom: panel.bottom,
      viewport: innerHeight,
      fit: getComputedStyle(video).objectFit,
    };
  });
  expect(geometry.mediaBottom).toBeLessThanOrEqual(geometry.panelTop + 1);
  expect(geometry.mediaHeight).toBeGreaterThan(300);
  expect(geometry.panelBottom).toBeLessThan(geometry.viewport - 30);
  expect(geometry.fit).toBe("contain");

  await expect(
    card.getByRole("link", { name: "Upptäck Ljusstund", exact: true }),
  ).toHaveAttribute("href", "/sv/products/" + launchBundleHandle);
  await card.getByRole("link", { name: "Upptäck kollektionen" }).click();
  await expect(page).toHaveURL(/#gifts$/);
  await expect(scene).toHaveAttribute("data-pinned", "false");
  await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
  await expect(page.locator("#gifts")).toBeInViewport();
});

test("short-screen static shopping stays below editorial copy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await rejectOptional(page);
  const scene = page.locator('[data-scene="winter-entrance"]');
  await expect(scene).toHaveAttribute("data-pinned", "false");
  const geometry = await scene.evaluate((element) => {
    const copy = element
      .querySelector(".cinema-scene-content")!
      .getBoundingClientRect();
    const product = element
      .querySelector(".cinema-static-product")!
      .getBoundingClientRect();
    return { copyBottom: copy.bottom, productTop: product.top };
  });
  expect(geometry.productTop).toBeGreaterThan(geometry.copyBottom + 20);
  const link = scene.locator(".cinema-static-product-button");
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/en/products/" + launchBundleHandle);
});

test("candle sand colour, gallery and cart stay matched on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/products/candle-sand");
  await rejectOptional(page);
  await expect(page.getByRole("radio")).toHaveCount(11);
  await page
    .getByRole("radio", { name: "Dusty Rose · Maison de Roses" })
    .check();
  await expect(page.locator(".gallery-main")).toHaveAttribute(
    "href",
    /csand-07-0.webp$/,
  );
  await page.getByRole("button", { name: /^Image 2:/ }).click();
  await expect(page.locator(".gallery-main")).toHaveAttribute(
    "href",
    /csand-07-2.webp$/,
  );
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.locator(".cart-next-step").click();
  await expect(page.locator(".cart-line-description")).toContainText(
    "Dusty Rose · Maison de Roses",
  );
  await expect(page.locator(".cart-image img")).toHaveAttribute(
    "src",
    /csand-07-0/,
  );
  await page.reload();
  await expect(page.locator(".cart-line-description")).toContainText(
    "Dusty Rose · Maison de Roses",
  );
  await expect(page.locator(".cart-image img")).toHaveAttribute(
    "src",
    /csand-07-0/,
  );
});

test("candle sand photos and variants remain accessible without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto("/en/products/candle-sand");
    await expect(
      page.getByRole("heading", { name: "Candle Sand", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Dusty Rose · Maison de Roses",
        exact: true,
      }),
    ).toHaveAttribute("href", /csand-07-0.webp$/);
    await expect(
      page.getByRole("link", { name: "Image 2 ·", exact: true }),
    ).toHaveAttribute("href", /csand-11-2.webp$/);
  } finally {
    await context.close();
  }
});
