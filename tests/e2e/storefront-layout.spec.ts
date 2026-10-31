import { expect, test, type Page } from "@playwright/test";
import { candleSand } from "../../src/content/candle-sand";
import { launchProductDefinitions } from "../../src/content/launch-catalog";
import { capturePageForReview } from "./visual-review";

async function rejectOptional(page: Page) {
  const button = page.getByRole("button", {
    name: "Reject optional",
    exact: true,
  });
  if (await button.isVisible()) await button.click();
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    )
    .toBeLessThanOrEqual(1);
}

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  test(`${viewport.name} navigation and product cards lead to readable product pages`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    await rejectOptional(page);
    const header = page.getByRole("banner");
    if (viewport.name === "mobile") {
      await header.locator("summary").click();
      await header
        .getByRole("navigation", { name: "Open navigation" })
        .getByRole("link", { name: "Shop all", exact: true })
        .click();
      await expect(header.locator("details")).not.toHaveAttribute("open", "");
    } else {
      await header
        .getByRole("navigation", { name: "All gifts" })
        .getByRole("link", { name: "Shop all", exact: true })
        .click();
    }
    await expect(page).toHaveURL("/en/shop");

    const cards = page.getByRole("main").getByRole("article");
    await expect(cards).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
    const bounds = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
    for (const card of bounds) {
      expect(card.x).toBeGreaterThanOrEqual(0);
      expect(card.x + card.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(card.width).toBeGreaterThan(140);
      expect(card.height).toBeGreaterThan(140);
    }
    // The desktop collection should be browsable side by side, not a long text list.
    if (viewport.name === "desktop") {
      expect(
        Math.max(...bounds.map(({ y }) => y)) -
          Math.min(...bounds.map(({ y }) => y)),
      ).toBeLessThanOrEqual(1);
      for (let index = 1; index < bounds.length; index++) {
        expect(bounds[index].x).toBeGreaterThanOrEqual(
          bounds[index - 1].x + bounds[index - 1].width,
        );
      }
    }
    await capturePageForReview(
      page,
      testInfo,
      `shop-${viewport.name}-${viewport.width}.png`,
    );

    for (const { handle } of launchProductDefinitions) {
      const href = `/en/products/${handle}`;
      const card = cards.filter({ has: page.locator(`a[href="${href}"]`) });
      const productLink = card.getByRole("heading").getByRole("link");
      await expect(productLink).toHaveAttribute("href", href);
      await productLink.click();
      await expect(page).toHaveURL(href);
      await expect(
        page.getByRole("main").getByRole("heading", { level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Open full-size image/ }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await capturePageForReview(
        page,
        testInfo,
        `product-${handle}-${viewport.name}-${viewport.width}.png`,
      );
      await page.goto("/en/shop");
    }
  });

  test(`${viewport.name} customer care links and FAQ disclosures remain usable`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en/shop");
    await rejectOptional(page);
    const footer = page.getByRole("contentinfo");
    const main = page.getByRole("main");
    await footer.locator('a[href="/en/about"]').click();
    await expect(page).toHaveURL("/en/about");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capturePageForReview(
      page,
      testInfo,
      `about-${viewport.name}-${viewport.width}.png`,
    );
    await footer.locator('a[href="/en/faq"]').click();
    await expect(page).toHaveURL("/en/faq");
    const question = main.locator("details").first();
    await expect(question).not.toHaveAttribute("open", "");
    await question.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(question).toHaveAttribute("open", "");
    await expect(question.locator("p").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capturePageForReview(
      page,
      testInfo,
      `faq-expanded-${viewport.name}-${viewport.width}.png`,
    );

    await footer.locator('a[href="/en/contact"]').click();
    await expect(page).toHaveURL("/en/contact");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      main.locator('a[href="mailto:support@noorlynordic.com"]').first(),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capturePageForReview(
      page,
      testInfo,
      `contact-${viewport.name}-${viewport.width}.png`,
    );

    await footer.locator('a[href="/en/shipping-returns"]').click();
    await expect(page).toHaveURL("/en/shipping-returns");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capturePageForReview(
      page,
      testInfo,
      `shipping-${viewport.name}-${viewport.width}.png`,
    );
    await page.goto("/en/cart");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capturePageForReview(
      page,
      testInfo,
      `cart-empty-${viewport.name}-${viewport.width}.png`,
    );
  });
}

test("desktop colour selection keeps the selected price and enlarged gallery together", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  // CI's mock candle exercises the same presentation. Live launch prices and
  // Shopify merchandise IDs are covered by the launch-catalog component fixtures.
  await page.goto("/en/products/candle-sand");
  await rejectOptional(page);
  const pink = candleSand.variants.find(({ sku }) => sku === "CSand-07")!;
  const colour = page.getByRole("radio", { name: pink.label!.en, exact: true });
  await colour.check();
  await expect(colour).toBeChecked();
  await expect(page.locator(".selected-variant")).toHaveText(pink.label!.en);
  await expect(page.locator(".product-price")).toContainText(
    String(pink.price.amount),
  );
  const gallery = page.getByRole("link", { name: /Open full-size image/ });
  await expect(gallery).toHaveAttribute("href", pink.images![0].url);
  await page.getByRole("button", { name: /^Image 2:/ }).click();
  await expect(gallery).toHaveAttribute("href", pink.images![1].url);
  await gallery.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveAttribute(
    "alt",
    pink.images![1].alt,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(gallery).toBeFocused();
  await expect(gallery).toHaveAttribute("href", pink.images![1].url);
  await expect(colour).toBeChecked();
  await expectNoHorizontalOverflow(page);
});
