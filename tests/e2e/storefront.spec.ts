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
  await page.getByText("About the photographs", { exact: true }).click();
  const firstPhoto = launchBundlePhotos[0];
  const gallery = page.locator("main .gallery-main");
  const image = gallery.locator("img");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("alt", firstPhoto.alt.en);
  await expect(gallery).toHaveAttribute("href", firstPhoto.url);
  const imageSource = new URL((await image.getAttribute("src"))!, page.url());
  expect(imageSource.searchParams.get("url")).toBe(firstPhoto.url);
  await expect(page.locator("main .catalog-photo-note")).toHaveText(
    "Each bowl has a unique shape and grain. Fruit and styling accessories are not included.",
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

test("the home leads directly to the three products", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Your colour\.\s+Your candle moment\./,
  );
  await rejectOptional(page);
  await page
    .getByRole("link", { name: "Skip experience", exact: true })
    .click();
  await expect(page).toHaveURL(/\/en#gifts$/);
  await expect(page.locator("#gifts")).toBeInViewport();
  await expect(page.locator("#gifts article")).toHaveCount(3);
  await expect(
    page
      .locator("#gifts")
      .getByRole("heading", { name: "Luma · Candle sand 300 g" }),
  ).toBeVisible();
  await expect(page.locator("#gifts").getByText(/From.*349/)).toBeVisible();
  await expect(page.locator('a[href*="build-a-box"]')).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(
    /\bAI\b|AI-generated|AI-styled/i,
  );
});

test("separate products and the bundle are keyboard accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await rejectOptional(page);
  const link = page
    .locator("#gifts")
    .getByRole("link", { name: /Choose colour & scent/ });
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/en/products/" + candleSandHandle);
  await expect(page.getByRole("radio")).toHaveCount(11);
  await page.goto("/en/products/" + teakBowlHandle);
  await expect(
    page.getByRole("heading", {
      name: "Alva · Decorative teak bowl",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/wipe gently with a soft, dry cloth/),
  ).toBeAttached();
  await expectBowlGallery(page);
  await expect(page.locator("main .gallery-thumbnails button")).toHaveCount(3);
  await expect(page.locator(".product-detail").getByRole("radio")).toHaveCount(
    0,
  );
  await expect(
    page
      .getByRole("region", { name: "Your moment, your choice." })
      .getByRole("radio"),
  ).toHaveCount(3);
  await page.goto("/en/products/" + launchBundleHandle);
  await expect(page).toHaveURL("/en/products/" + launchBundleHandle);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Luma + Alva · Candle sand & teak bowl",
  );
  await expect(page.getByText(/699/)).toBeVisible();
  await expect(
    page.getByText(/1 decorative teak bowl \+ 300 g candle sand/),
  ).toBeVisible();
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
    if (
      /googletagmanager|google-analytics|posthog|clarity\.ms|connect\.facebook\.net|facebook\.com\/tr|monorail-edge/.test(
        request.url(),
      )
    )
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
          JSON.parse(localStorage.getItem("noorly-consent-v3") ?? "{}")
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
          JSON.parse(localStorage.getItem("noorly-consent-v3") ?? "{}")
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
  await page
    .getByRole("link", { name: "Skip experience", exact: true })
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
    await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
    await page
      .getByRole("link", { name: "Skip experience", exact: true })
      .click();
    await expect(page.locator("#gifts")).toBeInViewport();
    await page.goto("/en/shop");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Luma · Candle sand 300 g",
        exact: true,
      }),
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
    /csand-07-supplier-5ghj.jpg$/,
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
    ).toHaveAttribute("href", /csand-11-supplier-5ghn.jpg$/);
  } finally {
    await context.close();
  }
});
