import { expect, test } from "@playwright/test";

test("protects the dashboard and preserves the destination", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Tekrar hoş geldin" })).toBeVisible();
});

test("exposes the single-owner setup form", async ({ page }) => {
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "İlk kurulumu tamamla" })).toBeVisible();
  await expect(page.getByLabel("Kurulum anahtarı")).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
});

test("protects nested module pages and preserves each destination", async ({ page }) => {
  for (const pathname of ["/movies/tv", "/courses", "/learning", "/learning/kali-linux", "/learning/kali-linux/items/example-item", "/settings/tags"]) {
    await page.goto(pathname);
    await expect(page.getByRole("heading", { name: "Tekrar hoş geldin" })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("next")).toBe(pathname);
  }
});

