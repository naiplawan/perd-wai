import { describe, expect, it } from "vitest";

import { explanationDisclaimer, isPlanExplanation } from "../app/lib/ai-explanation";

describe("AI explanation contract", () => {
  it("accepts a bounded explanation payload", () => {
    expect(
      isPlanExplanation({
        summary: "The plan is most sensitive to sales assumptions.",
        keyDrivers: [{ key: "customersPerDay", why: "Demand changes the cash available each month." }],
        assumptionsToVerify: ["Count customers at the location."],
        nextSteps: ["Run a small sales test."],
        disclaimer: explanationDisclaimer("en")
      })
    ).toBe(true);
  });

  it("rejects unknown driver keys and oversized model output", () => {
    expect(
      isPlanExplanation({
        summary: "The plan needs review.",
        keyDrivers: [{ key: "invented-metric", why: "This should not be rendered." }],
        assumptionsToVerify: [],
        nextSteps: [],
        disclaimer: explanationDisclaimer("en")
      })
    ).toBe(false);

    expect(
      isPlanExplanation({
        summary: "x".repeat(501),
        keyDrivers: [],
        assumptionsToVerify: [],
        nextSteps: [],
        disclaimer: explanationDisclaimer("en")
      })
    ).toBe(false);
  });
});
