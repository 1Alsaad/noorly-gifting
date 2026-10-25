import { expect, test } from "@playwright/test";

test("mobile purchase shortcut preserves the selected colour and price", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/products/candle-sand");
  const reject = page.getByRole("button", { name: "Reject optional" });
  if (await reject.isVisible()) await reject.click();
  const pink = page.getByRole("radio", {
    name: "Dusty Rose · Maison de Roses",
  });
  await pink.check();
  const price = await page.locator(".product-price").innerText();
  await page.locator("footer").scrollIntoViewIfNeeded();
  const bar = page.locator(".mobile-purchase-bar");
  await expect(bar).toBeVisible();
  await expect(bar).toContainText(price);
  await expect(bar).toContainText("Dusty Rose · Maison de Roses");
  await bar.getByRole("link", { name: "Back to my selection" }).click();
  await expect(pink).toBeChecked();
  await expect(pink).toBeInViewport();
  await expect(page.locator(".product-price")).toHaveText(price);
  await expect(
    page.getByRole("button", { name: "Add to bag", exact: true }),
  ).toHaveCount(1);
  await page.getByText("Delivery & pre-orders", { exact: true }).click();
  await expect(
    page.getByText(/An arrival date is not yet confirmed/),
  ).toBeVisible();
});
