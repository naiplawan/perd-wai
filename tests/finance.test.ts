import { describe, expect, it } from "vitest";

import {
  calculatePlanningRecommendation,
  calculateForecast,
  calculateScenarios,
  rankSensitivities,
  validateInputs,
  validateScenarioInputs,
  type FinancialInputs
} from "../app/lib/finance";

const viableInputs: FinancialInputs = {
  initialCapital: 400_000,
  rent: 15_000,
  depositMonths: 2,
  equipmentRenovation: 120_000,
  averageOrderValue: 80,
  variableCostPerOrder: 24,
  customersPerDay: 60,
  openDaysPerMonth: 26,
  staffWages: 25_000,
  utilities: 6_000,
  marketing: 4_000,
  ownerWithdrawal: 12_000,
  taxFeesReserve: 0,
  loanAmount: 0,
  monthlyLoanRepayment: 0
};

describe("calculateForecast", () => {
  it("calculates deterministic monthly economics and six-month cash flow", () => {
    const result = calculateForecast(viableInputs);

    expect(result.startupCapitalRequired).toBe(150_000);
    expect(result.openingCashAfterSetup).toBe(250_000);
    expect(result.monthlyRevenue).toBe(124_800);
    expect(result.monthlyVariableCost).toBe(37_440);
    expect(result.monthlyFixedCosts).toBe(62_000);
    expect(result.monthlyCashMovement).toBe(25_360);
    expect(result.grossMarginPercentage).toBeCloseTo(70);
    expect(result.months).toHaveLength(6);
    expect(result.months[5].endingCash).toBe(402_160);
    expect(result.cashNegativeMonth).toBeNull();
    expect(result.recommendation).toBe("start-validating");
  });

  it("reports a pre-opening shortfall when startup costs exceed available cash", () => {
    const result = calculateForecast({ ...viableInputs, initialCapital: 100_000 });

    expect(result.openingCashAfterSetup).toBe(-50_000);
    expect(result.cashNegativeMonth).toBe(0);
    expect(result.recommendation).toBe("delay-opening");
  });

  it("includes loan proceeds at opening and repayments in monthly fixed costs", () => {
    const result = calculateForecast({
      ...viableInputs,
      loanAmount: 100_000,
      monthlyLoanRepayment: 8_000
    });

    expect(result.openingCashAfterSetup).toBe(350_000);
    expect(result.monthlyFixedCosts).toBe(70_000);
    expect(result.monthlyCashMovement).toBe(17_360);
  });

  it("delays opening when cash becomes negative within six months", () => {
    const result = calculateForecast({
      ...viableInputs,
      initialCapital: 180_000,
      customersPerDay: 30
    });

    expect(result.cashNegativeMonth).toBe(2);
    expect(result.recommendation).toBe("delay-opening");
  });

  it("recommends revision when cash survives but monthly sales miss break-even", () => {
    const result = calculateForecast({ ...viableInputs, customersPerDay: 40 });

    expect(result.cashNegativeMonth).toBeNull();
    expect(result.breakEvenCustomersPerDay).toBeGreaterThan(40);
    expect(result.recommendation).toBe("revise-plan");
  });
});

describe("validateInputs", () => {
  it("rejects impossible or unsafe numeric assumptions", () => {
    const errors = validateInputs({
      ...viableInputs,
      averageOrderValue: 0,
      variableCostPerOrder: 90,
      customersPerDay: -1,
      openDaysPerMonth: 32
    });

    expect(errors.averageOrderValue).toBeDefined();
    expect(errors.variableCostPerOrder).toBeDefined();
    expect(errors.customersPerDay).toBeDefined();
    expect(errors.openDaysPerMonth).toBeDefined();
  });
});

describe("calculateScenarios", () => {
  it("uses explicit low, expected, and high values for the three scenario drivers", () => {
    const scenarios = calculateScenarios(viableInputs, {
      customersPerDay: { low: 35, expected: 60, high: 75 },
      averageOrderValue: { low: 70, expected: 80, high: 90 },
      variableCostPerOrder: { low: 20, expected: 24, high: 30 }
    });

    expect(scenarios.pessimistic.monthlyCashMovement).toBeLessThan(scenarios.base.monthlyCashMovement);
    expect(scenarios.optimistic.monthlyCashMovement).toBeGreaterThan(scenarios.base.monthlyCashMovement);
    expect(scenarios.base.monthlyRevenue).toBe(124_800);
  });

  it("recommends revision when the base case is viable but pessimistic cash runs out", () => {
    const scenarios = calculateScenarios(viableInputs, {
      customersPerDay: { low: 10, expected: 60, high: 75 },
      averageOrderValue: { low: 70, expected: 80, high: 90 },
      variableCostPerOrder: { low: 20, expected: 24, high: 30 }
    });

    expect(scenarios.base.recommendation).toBe("start-validating");
    expect(scenarios.pessimistic.cashNegativeMonth).not.toBeNull();
    expect(calculatePlanningRecommendation(scenarios)).toBe("revise-plan");
  });

  it("gives base-case cash failure precedence over scenario revision", () => {
    const scenarios = calculateScenarios(
      { ...viableInputs, initialCapital: 100_000 },
      {
        customersPerDay: { low: 10, expected: 60, high: 75 },
        averageOrderValue: { low: 70, expected: 80, high: 90 },
        variableCostPerOrder: { low: 20, expected: 24, high: 30 }
      }
    );

    expect(calculatePlanningRecommendation(scenarios)).toBe("delay-opening");
  });
});

describe("validateScenarioInputs", () => {
  it("rejects inverted ranges and costs that erase gross margin", () => {
    const errors = validateScenarioInputs({
      customersPerDay: { low: 70, expected: 60, high: 50 },
      averageOrderValue: { low: 60, expected: 80, high: 90 },
      variableCostPerOrder: { low: 60, expected: 24, high: 30 }
    });

    expect(errors.customersPerDay).toBeDefined();
    expect(errors.averageOrderValue).toBeDefined();
    expect(errors.variableCostPerOrder).toBeDefined();
  });

  it("accepts ordered positive ranges with positive contribution margin", () => {
    expect(
      validateScenarioInputs({
        customersPerDay: { low: 35, expected: 60, high: 75 },
        averageOrderValue: { low: 70, expected: 80, high: 90 },
        variableCostPerOrder: { low: 20, expected: 24, high: 30 }
      })
    ).toEqual({});
  });
});

describe("rankSensitivities", () => {
  it("returns the three adjustable assumptions with the largest six-month cash impact", () => {
    const sensitivities = rankSensitivities(viableInputs);

    expect(sensitivities).toHaveLength(3);
    expect(sensitivities[0].absoluteImpact).toBeGreaterThanOrEqual(sensitivities[1].absoluteImpact);
    expect(sensitivities[1].absoluteImpact).toBeGreaterThanOrEqual(sensitivities[2].absoluteImpact);
    expect(sensitivities.map((item) => item.key)).toContain("customersPerDay");
  });
});
