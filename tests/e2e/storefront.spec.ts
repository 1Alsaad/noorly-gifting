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
  await expect(
    page.getByRole("heading", { name: "Thoughtfully brought together" }),
  ).toBeInViewport();
  for (const name of ["Winter Evening", "Quiet Morning", "New Home"]) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: "Create your gift box" }),
  ).toHaveAttribute("href", "/en/build-a-box");
});

test("a static scene product opens a keyboard-accessible drawer and preserves focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await rejectOptional(page);
  const trigger = page.getByRole("button", { name: /Winter Candle.*295/ });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Winter Candle" });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("img", { name: "Winter Candle", exact: true }),
  ).toBeVisible();
  await drawer.getByLabel("Variant").selectOption("winter-candle-large");
  await expect(
    drawer.getByText("Temporarily sold out", { exact: true }),
  ).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Add to cart", exact: true }),
  ).toBeDisabled();
  await drawer.getByLabel("Variant").selectOption("winter-candle-default");
  await drawer
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();
  await expect(
    drawer.getByRole("button", { name: "Added to cart", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Your bag (1)", exact: true }),
  ).toBeVisible();
});

test("scroll progress seeks forward and backward with a deterministic test media adapter", async ({
  page,
}) => {
  // This validates scroll/media integration independently of replaceable merchant video files.
  // Real decoding, keyframes and bandwidth remain a media acceptance check before launch.
  await page.addInitScript(() => {
    const setup = (video: HTMLVideoElement) => {
      if (video.dataset.testMedia) return;
      video.dataset.testMedia = "true";
      video.removeAttribute("src");
      let time = 0;
      Object.defineProperty(video, "duration", {
        configurable: true,
        get: () => 8,
      });
      Object.defineProperty(video, "seeking", {
        configurable: true,
        get: () => false,
      });
      Object.defineProperty(video, "readyState", {
        configurable: true,
        get: () => 4,
      });
      Object.defineProperty(video, "currentTime", {
        configurable: true,
        get: () => time,
        set: (value: number) => {
          time = value;
        },
      });
      setTimeout(() => {
        video.dispatchEvent(new Event("loadedmetadata"));
        video.dispatchEvent(new Event("loadeddata"));
      }, 50);
    };
    new MutationObserver(() =>
      document.querySelectorAll("video").forEach(setup),
    ).observe(document, { childList: true, subtree: true });
  });
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
  const room = page.locator('[data-scene="winter-candle-room"]');
  await room.scrollIntoViewIfNeeded();
  await expect(room).toHaveAttribute("data-enhanced", "true");
  await room.evaluate((scene: HTMLElement) =>
    window.scrollTo(
      0,
      scene.getBoundingClientRect().top +
        window.scrollY +
        (scene.offsetHeight - window.innerHeight) * 0.5,
    ),
  );
  await expect(
    room.getByRole("button", { name: "Discover the winter candle" }),
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
  await expect(
    page.getByRole("heading", { name: "Thoughtfully brought together" }),
  ).toBeInViewport();
  await page.getByRole("link", { name: "Create your gift box" }).click();
  await expect(
    page.getByRole("heading", { name: "Make it theirs.", level: 1 }),
  ).toBeVisible();
});

test("important shopping pages pass automated WCAG accessibility checks", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await addCandle(page);
  for (const path of ["/en", "/en/shop", "/en/build-a-box", "/en/cart"]) {
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
    await page.goto("/en/shop");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Winter Candle", exact: true }),
    ).toBeVisible();
    const product = page
      .locator('a[href="/en/products/winter-candle"]')
      .first();
    await product.click();
    await expect(page).toHaveURL("/en/products/winter-candle");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Winter Candle",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("A soft light for long evenings.", { exact: false }),
    ).toBeVisible();
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
