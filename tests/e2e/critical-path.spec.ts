import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function openEnglish(page: Page, start: "Start with my café" | "Look at an example café") {
  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: start }).click();
}

test("first-time founder chooses their starting mode in a Thai-first experience", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.getByRole("heading", { level: 1, name: /ร้านกาแฟของคุณ/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "เริ่มวางแผนร้านของฉัน" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ดูร้านตัวอย่าง" })).toBeVisible();
  await expect(page.getByTestId("onboarding-guide")).toContainText("มีข้อมูลเหล่านี้ไว้จะง่ายขึ้น");
  await expect(page.getByTestId("onboarding-guide")).toContainText("ต้องมีลูกค้าวันละกี่คน");
  await expect(page.getByLabel("เงินที่พร้อมลงทุน", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("recommendation")).toHaveCount(0);

  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Start with my café" })).toBeVisible();
});

test("a new plan starts from example numbers and shows an answer straight away", async ({ page }) => {
  await openEnglish(page, "Start with my café");

  await expect(page.getByTestId("recommendation")).toContainText("Risky — adjust the plan first");
  await expect(page.getByTestId("plain-summary")).toContainText("You need 56 customers a day");
  await expect(page.getByTestId("examples-left")).toContainText("12 of your numbers are still examples");
  await expect(page.getByLabel("Money you can invest", { exact: true })).toHaveValue("300,000");

  await page.getByLabel("Money you can invest", { exact: true }).fill("400000");
  await expect(page.getByTestId("examples-left")).toContainText("11 of your numbers");
  await page.getByRole("button", { name: "Keep the example value for Rent per month" }).click();
  await expect(page.getByTestId("examples-left")).toContainText("10 of your numbers");
});

test("founder can explore an example, stress-test it, and export the plan", async ({ page }) => {
  await openEnglish(page, "Look at an example café");

  await expect(page.getByText("This is an example café.")).toBeVisible();
  await expect(page.getByTestId("examples-left")).toHaveCount(0);
  await expect(page.getByTestId("recommendation")).toContainText("Risky — adjust the plan first");
  await expect(page.getByTestId("decision-most-sensitive")).toContainText("Average spend per customer");
  await expect(page.getByTestId("decision-next-action")).toBeVisible();
  await expect(page.getByTestId("ending-cash-month-6")).toContainText("103,580");
  await expect(page.getByTestId("simulation-dashboard").locator(".recharts-surface")).toBeVisible();

  await page.getByLabel("Slow sales: customers per day").fill("30");
  await expect(page.getByTestId("scenario-pessimistic")).toContainText("Runs out in month 3");
  await expect(page.getByTestId("recommendation")).toContainText("If sales are slow, you run out of money in month 3");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download spreadsheet" }).click();
  await expect((await download).suggestedFilename()).toBe("perd-wai-plan.csv");
});

test("founder can focus the dashboard on each sales case", async ({ page }) => {
  await openEnglish(page, "Look at an example café");

  await expect(page.getByTestId("scenario-base")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("scenario-pessimistic").click();
  await expect(page.getByTestId("scenario-pessimistic")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("runway-tile")).toContainText("Runs out in month 4");

  await page.getByTestId("scenario-optimistic").click();
  await expect(page.getByTestId("runway-tile")).toContainText("More than 6 months");
});

test("moving a slider updates the answer instantly", async ({ page }) => {
  await openEnglish(page, "Look at an example café");

  await expect(page.getByTestId("break-even-chart")).toContainText("You need 1 more customer a day to stop losing money");
  await page.getByRole("slider", { name: "Customers per day slider" }).fill("80");

  await expect(page.getByLabel("Customers per day", { exact: true })).toHaveValue("80");
  await expect(page.getByTestId("break-even-chart")).toContainText("a day than you need");
  await expect(page.getByTestId("money-flow")).toContainText("Left over each month");
  await expect(page.getByTestId("ending-cash-month-6")).not.toContainText("103,580");
});

test("founder can request an optional AI explanation without changing the forecast", async ({ page }) => {
  await page.route("**/api/explain-plan", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      summary: "The plan is most sensitive to demand and cash runway.",
      keyDrivers: [{ key: "customersPerDay", why: "Demand changes the cash available each month." }],
      assumptionsToVerify: ["Count customers at the location."],
      nextSteps: ["Run a small sales test."],
      disclaimer: "Numbers are calculated by Perd Wai. This AI explanation is educational."
    })
  }));

  await openEnglish(page, "Look at an example café");
  const endingCash = page.getByTestId("ending-cash-month-6");
  await expect(endingCash).toContainText("103,580");

  await page.getByRole("button", { name: "Explain my plan in simple words" }).click();
  await expect(page.getByTestId("ai-explanation-card")).toContainText("The plan is most sensitive to demand");
  await expect(endingCash).toContainText("103,580");
});

test("founder can review and apply an AI-drafted starting plan", async ({ page }) => {
  await page.route("**/api/draft-plan", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      summary: "I found a few starting values from your description.",
      suggestedInputs: {
        initialCapital: 350000,
        rent: 20000,
        customersPerDay: 40
      },
      assumptionsToVerify: ["Confirm the rent and customer estimate."],
      disclaimer: "These are AI-drafted starting points."
    })
  }));

  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByLabel("Or just describe your café idea").fill("I have savings and a possible café location.");
  await page.getByRole("button", { name: "Fill in my numbers" }).click();

  await expect(page.getByTestId("intake-draft")).toContainText("I found a few starting values");
  await expect(page.getByTestId("intake-draft")).toContainText("350,000");
  await page.getByRole("button", { name: "Use these numbers" }).click();

  await expect(page.getByRole("heading", { name: "Opening the shop" })).toBeVisible();
  await expect(page.getByLabel("Money you can invest", { exact: true })).toHaveValue("350,000");
  await expect(page.getByLabel("Rent per month", { exact: true })).toHaveValue("20,000");
  await expect(page.getByLabel("Customers per day", { exact: true })).toHaveValue("40");
  await expect(page.getByTestId("examples-left")).toContainText("9 of your numbers are still examples");
});

test("an impossible number hides the answer and links to the field to fix", async ({ page }) => {
  await openEnglish(page, "Start with my café");

  await page.getByLabel("Customers per day", { exact: true }).fill("0");
  await expect(page.getByText("Customers per day must be more than 0.")).toBeVisible();
  await expect(page.getByTestId("recommendation")).toHaveCount(0);

  const emptyState = page.getByTestId("empty-state");
  await emptyState.getByRole("button", { name: "Customers per day" }).click();
  await expect(page.getByLabel("Customers per day", { exact: true })).toBeFocused();
});

test("slow and good cases are automatic, and custom ranges are validated", async ({ page }) => {
  await openEnglish(page, "Start with my café");

  await page.getByText("Advanced: change the slow and good sales cases").click();
  await expect(page.getByLabel("Slow sales: customers per day")).toHaveValue("41.3");

  await page.getByLabel("Slow sales: customers per day").fill("70");
  await expect(page.getByText("Slow sales must be lower than planned, and good sales higher.").first()).toBeVisible();
  await expect(page.getByTestId("recommendation")).toHaveCount(0);

  await page.getByRole("button", { name: "Go back to automatic" }).click();
  await expect(page.getByTestId("recommendation")).toBeVisible();
});

test("money fields show thousands separators and persist locally", async ({ page }) => {
  await openEnglish(page, "Start with my café");

  const capital = page.getByLabel("Money you can invest", { exact: true });
  await expect(capital).toHaveAttribute("inputmode", "numeric");
  await expect(page.getByTestId("money-input-initialCapital")).toContainText("THB");
  await capital.fill("400000");
  await capital.blur();
  await expect(capital).toHaveValue("400,000");
  await expect(page.getByText("Saved on this device")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Money you can invest", { exact: true })).toHaveValue("400,000");
  await expect(page.getByTestId("examples-left")).toContainText("11 of your numbers");
});
