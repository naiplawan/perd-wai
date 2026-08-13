import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("first-time founder chooses their starting mode in a Thai-first experience", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.getByRole("heading", { level: 1, name: /ร้านกาแฟของคุณ/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "สร้างแผนของฉัน" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ดูตัวอย่างร้าน" })).toBeVisible();
  await expect(page.getByTestId("onboarding-guide")).toContainText("เตรียมตัวเลขเหล่านี้ไว้ใกล้มือ");
  await expect(page.getByTestId("onboarding-guide")).toContainText("จำนวนลูกค้าต่อวันที่ทำให้คุ้มทุน");
  await expect(page.getByLabel("เงินทุนตั้งต้น")).toHaveCount(0);
  await expect(page.getByTestId("recommendation")).toHaveCount(0);

  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Create my plan" })).toBeVisible();
});

test("founder can explore an example, stress-test it, and export the plan", async ({ page }) => {
  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Explore an example café" }).click();

  await expect(page.getByText("Example plan — replace these assumptions with your own before deciding.")).toBeVisible();
  await expect(page.getByTestId("recommendation")).toContainText("Revise the plan");
  await expect(page.getByTestId("decision-most-sensitive")).toBeVisible();
  await expect(page.getByTestId("decision-next-action")).toBeVisible();
  await expect(page.getByTestId("ending-cash-month-6")).toContainText("103,580");

  await page.getByLabel("Pessimistic customers per day").fill("30");
  await expect(page.getByTestId("scenario-pessimistic")).toContainText("Month 3");
  await expect(page.getByTestId("recommendation")).toContainText("pessimistic case runs out of cash in Month 3");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  await expect((await download).suggestedFilename()).toBe("perd-wai-plan.csv");
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

  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Explore an example café" }).click();
  const endingCash = page.getByTestId("ending-cash-month-6");
  await expect(endingCash).toContainText("103,580");

  await page.getByRole("button", { name: "Explain my plan" }).click();
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
        initialCapital: 300000,
        rent: 18000,
        customersPerDay: 40
      },
      assumptionsToVerify: ["Confirm the rent and customer estimate."],
      disclaimer: "These are AI-drafted starting points."
    })
  }));

  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByLabel("Describe your café idea").fill("I have savings and a possible café location.");
  await page.getByRole("button", { name: "Draft my starting numbers" }).click();

  await expect(page.getByTestId("intake-draft")).toContainText("I found a few starting values");
  await expect(page.getByTestId("intake-draft")).toContainText("300,000");
  await page.getByRole("button", { name: "Use this draft in my plan" }).click();

  await expect(page.getByRole("heading", { name: "Money before opening" })).toBeVisible();
  await expect(page.getByLabel("Initial capital")).toHaveValue("300000");
  await expect(page.getByLabel("Monthly rent")).toHaveValue("18000");
  await page.getByRole("button", { name: "Next: Sales assumptions" }).click();
  await expect(page.getByLabel("Expected customers per day")).toHaveValue("40");
});

test("founder can complete the staged custom-plan flow", async ({ page }) => {
  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Create my plan" }).click();

  await expect(page.getByRole("heading", { name: "Money before opening" })).toBeVisible();
  await expect(page.getByTestId("stage-explainer")).toContainText("what remains on opening day");
  await expect(page.getByLabel("Average order value")).toHaveCount(0);
  await page.getByLabel("Initial capital").fill("400000");
  await page.getByLabel("Monthly rent").fill("15000");
  await page.getByLabel("Rent deposit").fill("2");
  await page.getByLabel("Equipment and renovation").fill("120000");
  await page.getByRole("button", { name: "Next: Sales assumptions" }).click();

  await expect(page.getByTestId("stage-explainer")).toContainText("customers per day × opening days × average order value");
  await page.getByLabel("Average order value").fill("80");
  await page.getByLabel("Variable cost per order").fill("24");
  await page.getByLabel("Expected customers per day").fill("60");
  await page.getByLabel("Opening days per month").fill("26");
  await page.getByRole("button", { name: "Next: Monthly operating costs" }).click();

  await page.getByLabel("Staff wages").fill("25000");
  await page.getByLabel("Utilities").fill("6000");
  await page.getByLabel("Marketing").fill("4000");
  await page.getByLabel("Owner withdrawal").fill("12000");
  await page.getByRole("button", { name: "Next: Stress-test the plan" }).click();

  await page.getByLabel("Pessimistic customers per day").fill("50");
  await page.getByLabel("Optimistic customers per day").fill("75");
  await page.getByLabel("Pessimistic average order value").fill("70");
  await page.getByLabel("Optimistic average order value").fill("90");
  await page.getByLabel("Pessimistic variable cost per order").fill("30");
  await page.getByLabel("Optimistic variable cost per order").fill("20");
  await page.getByRole("button", { name: "Next: Review assumptions" }).click();

  await expect(page.getByRole("heading", { name: "Review assumptions" })).toBeVisible();
  await expect(page.getByTestId("review-money-before-opening")).toContainText("400,000");
  await expect(page.getByRole("button", { name: "Change Money before opening" })).toBeVisible();
  await expect(page.getByTestId("recommendation")).toHaveCount(0);
  await page.getByRole("button", { name: "Calculate my forecast" }).click();

  await expect(page.getByTestId("recommendation")).toBeVisible();
  await expect(page.getByText("Cash available after setup")).toBeVisible();
  await expect(page.getByTestId("forecast-takeaway")).toBeVisible();
});

test("money fields expose currency context and invalid stages focus an actionable summary", async ({ page }) => {
  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Create my plan" }).click();

  const capital = page.getByLabel("Initial capital");
  await expect(capital).toHaveAttribute("inputmode", "numeric");
  await expect(page.getByTestId("money-input-initialCapital")).toContainText("THB");

  await page.getByRole("button", { name: "Next: Sales assumptions" }).click();
  await page.getByRole("button", { name: "Next: Monthly operating costs" }).click();
  const summary = page.getByTestId("stage-error-summary");
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("link", { name: "Average order value" })).toBeVisible();
  await expect(summary.getByRole("link", { name: "Opening days per month" })).toBeVisible();
});

test("invalid scenario ranges show field guidance and suppress decision results", async ({ page }) => {
  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Explore an example café" }).click();
  await page.getByLabel("Pessimistic customers per day").fill("70");

  await expect(page.getByText("Enter low, expected, and high values in that order.").first()).toBeVisible();
  await expect(page.getByTestId("recommendation")).toHaveCount(0);
});

test("formatted numeric assumptions remain editable and persist locally", async ({ page }) => {
  await page.getByRole("radio", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Explore an example café" }).click();
  await page.getByRole("button", { name: "Money before opening" }).click();

  const capital = page.getByLabel("Initial capital");
  await capital.fill("400,000");
  await expect(capital).toHaveValue("400,000");
  await expect(page.getByText("Saved on this device")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Money before opening" }).click();
  await expect(page.getByLabel("Initial capital")).toHaveValue("400000");
});
