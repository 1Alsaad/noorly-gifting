import {
  launchBundleHandle,
  launchBundlePhotos,
} from "../../src/content/launch-bundle";
import {
  candleSandHandle,
  teakBowlHandle,
} from "../../src/content/launch-catalog";
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
async function expectBowlGallery(page: Page) {
  const firstPhoto = launchBundlePhotos[0];
  const gallery = page.locator("main .gallery-main");
  const image = gallery.locator("img");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("alt", firstPhoto.alt.en);
  await expect(gallery).toHaveAttribute("href", firstPhoto.url);
  const imageSource = new URL((await image.getAttribute("src"))!, page.url());
  expect(imageSource.searchParams.get("url")).toBe(firstPhoto.url);
  await expect(page.locator("main .catalog-photo-note")).toHaveText(
    "Each teak bowl has its own shape and grain. The fruit in the photograph is styling and is not included.",
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

test("the home shows the real products and reaches the catalogue without a film", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Little details. A moment of your own.",
  );
  await rejectOptional(page);
  await page
    .getByRole("link", { name: "Explore the collection", exact: true })
    .click();
  await expect(page).toHaveURL(/\/en#gifts$/);
  await expect(page.locator("main video")).toHaveCount(0);
  await expect(page.locator("#gifts")).toBeInViewport();
  await expect(
    page
      .locator("#gifts")
      .getByRole("heading", { name: "Candle sand · 300 g" }),
  ).toBeVisible();
  await expect(page.locator('a[href*="build-a-box"]')).toHaveCount(0);
  await expect(page.locator("#gifts article")).toHaveCount(2);
  await expect(page.locator("#gifts").getByText(/From.*199/)).toBeVisible();
});

test("separate product pages are keyboard accessible and the former kit redirects to the catalogue", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await rejectOptional(page);
  const link = page.locator(".catalog-home-actions .button");
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/en/products/" + candleSandHandle);
  await expect(page.getByRole("radio")).toHaveCount(11);
  await page.goto("/en/products/" + teakBowlHandle);
  await expect(
    page.getByRole("heading", {
      name: "Decorative teak bowl",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/wipe gently with a soft, dry cloth/),
  ).toBeVisible();
  await expectBowlGallery(page);
  await expect(page.locator("main .gallery-thumbnails button")).toHaveCount(3);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.goto("/en/products/" + launchBundleHandle);
  await expect(page).toHaveURL("/en/shop");
  await expect(page.locator("main article")).toHaveCount(2);
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
  await expect(page.locator("main video")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Explore the collection", exact: true })
    .click();
  await expect(page.locator("#gifts")).toBeInViewport();
  await page
    .locator("#gifts")
    .getByRole("link", { name: "Choose colour & scent" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Candle Sand", level: 1 }),
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
    "/en/products/" + candleSandHandle,
    "/en/products/" + teakBowlHandle,
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
    await expect(page.locator("main video")).toHaveCount(0);
    await page
      .getByRole("link", { name: "Explore the collection", exact: true })
      .click();
    await expect(page.locator("#gifts")).toBeInViewport();
    await page.goto("/en/shop");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Candle sand · 300 g", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Choose colour & scent" }).click();
    await expect(page).toHaveURL("/en/products/" + candleSandHandle);
    await expect(page.getByRole("radio")).toHaveCount(11);
    await page.goto("/en/products/" + teakBowlHandle);
    await expect(
      page.getByText(/One decorative teak bowl\. Candle sand/),
    ).toBeVisible();
    await expectBowlGallery(page);
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
  const link = page.locator(".catalog-home-actions .button");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toHaveAttribute(
    "href",
    "/en/products/" + candleSandHandle,
  );
  await expect(page.locator("main video")).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("portrait home shows product photography and Swedish shopping links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sv");
  const reject = page.getByRole("button", {
    name: "Avvisa valfria",
    exact: true,
  });
  if (await reject.isVisible()) await reject.click();
  const hero = page.locator(".catalog-home");
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText(
    "Små detaljer. Din egen stund.",
  );
  await expect(hero.getByRole("img")).toBeVisible();
  await expect(page.locator("main video")).toHaveCount(0);
  await expect(
    hero.getByRole("link", { name: "Välj färg & doft", exact: true }),
  ).toHaveAttribute("href", "/sv/products/" + candleSandHandle);
  await hero.getByRole("link", { name: "Upptäck kollektionen" }).click();
  await expect(page).toHaveURL(/#gifts$/);
  await expect(page.locator("#gifts")).toBeInViewport();
});

test("short-screen shopping keeps the photo and copy separate", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await rejectOptional(page);
  const hero = page.locator(".catalog-home");
  const geometry = await hero.evaluate((element) => {
    const copy = element
      .querySelector(".catalog-home-copy")!
      .getBoundingClientRect();
    const photo = element
      .querySelector(".catalog-home-photo")!
      .getBoundingClientRect();
    return { copyBottom: copy.bottom, photoTop: photo.top };
  });
  expect(geometry.photoTop).toBeGreaterThan(geometry.copyBottom + 20);
  const link = page.locator(".catalog-home-actions .button");
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/en/products/" + candleSandHandle);
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
