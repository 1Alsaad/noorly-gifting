import { expect, test } from "@playwright/test";

test("admin ad drafts require login and logout revokes this browser session", async ({
  page,
}) => {
  await page.goto("/admin-preview/ads");
  await expect(page).toHaveURL(/\/admin-preview$/);
  const password = page.getByLabel("Administratörslösenord");
  await password.fill("wrong-password");
  await page.getByRole("button", { name: "Visa förhandsvisningen" }).click();
  await expect(page.getByRole("alert")).toContainText("Fel lösenord");
  await password.fill("test-only-generated-password-1234567890");
  await page.getByRole("button", { name: "Visa förhandsvisningen" }).click();
  await expect(page).toHaveURL(/\/sv$/);
  await page.goto("/admin-preview/ads");
  await expect(
    page.getByRole("heading", {
      name: "Doft och levande ljus till hemmakvällen.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "En presentidé för den som tycker om att skapa hemma.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("UTKAST / EJ PUBLICERAD", { exact: true }),
  ).toHaveCount(2);
  await page.goto("/admin-preview");
  await page.getByRole("button", { name: "Logga ut", exact: true }).click();
  await page.goto("/admin-preview/ads");
  await expect(page).toHaveURL(/\/admin-preview$/);
  await expect(page.getByLabel("Administratörslösenord")).toBeVisible();
});
