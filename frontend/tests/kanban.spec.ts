import { expect, test } from "@playwright/test";

const login = async (page) => {
  await page.goto("/");
  await page.getByPlaceholder("user").fill("user");
  await page.getByPlaceholder("password").fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
};

test("loads login page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to Kanban Studio" })).toBeVisible();
});

test("signs in and loads the kanban board", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
});

test("adds a card to a column", async ({ page }) => {
  await login(page);
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Playwright card");
  await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await expect(firstColumn.getByText("Playwright card")).toBeVisible();
});

test("persists board state across page reload", async ({ page }) => {
  const cardTitle = `Persistent card ${Date.now()}`;

  // Sign in and add a card
  await login(page);
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill(cardTitle);
  await firstColumn.getByPlaceholder("Details").fill("Should persist after reload.");
  const saveResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/boards") &&
      response.request().method() === "PATCH"
  );
  await firstColumn.getByRole("button", { name: /add card/i }).click();

  await expect((await saveResponse).ok()).toBe(true);
  await expect(page.getByText("Synced")).toBeVisible();
  
  // Reload page
  await page.reload();
  
  // Verify card still exists
  const persistedCard = firstColumn
    .locator('[data-testid^="card-"]')
    .filter({ hasText: cardTitle });
  await expect(persistedCard).toBeVisible();
  await expect(persistedCard.getByText("Should persist after reload.")).toBeVisible();
});

test("moves a card between columns", async ({ page }) => {
  await login(page);
  const card = page.getByTestId("card-card-1");
  const targetColumn = page.getByTestId("column-col-review");
  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Unable to resolve drag coordinates.");
  }

  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    columnBox.y + 120,
    { steps: 12 }
  );
  await page.mouse.up();
  await expect(targetColumn.getByTestId("card-card-1")).toBeVisible();
});
