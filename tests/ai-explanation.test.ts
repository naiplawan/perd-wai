import { describe, expect, it } from "vitest";

import { draftDisclaimer, explanationDisclaimer, isPlanDraft, isPlanExplanation } from "../app/lib/ai-explanation";

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

describe("AI intake draft contract", () => {
  it("accepts partial, non-negative financial suggestions", () => {
    expect(isPlanDraft({
      summary: "I found a starting estimate for the shop.",
      suggestedInputs: { initialCapital: 300000, customersPerDay: 40 },
      assumptionsToVerify: ["Confirm the monthly rent with the landlord."],
      disclaimer: draftDisclaimer("en")
    })).toBe(true);
  });

  it("rejects unknown fields and negative suggestions", () => {
    expect(isPlanDraft({
      summary: "Draft",
      suggestedInputs: { inventedField: 10 },
      assumptionsToVerify: [],
      disclaimer: draftDisclaimer("en")
    })).toBe(false);

    expect(isPlanDraft({
      summary: "Draft",
      suggestedInputs: { rent: -1 },
      assumptionsToVerify: [],
      disclaimer: draftDisclaimer("en")
    })).toBe(false);
  });
});
