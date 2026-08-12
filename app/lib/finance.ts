export const FORECAST_MONTHS = 6;

export type FinancialInputs = {
  initialCapital: number;
  rent: number;
  depositMonths: number;
  equipmentRenovation: number;
  averageOrderValue: number;
  variableCostPerOrder: number;
  customersPerDay: number;
  openDaysPerMonth: number;
  staffWages: number;
  utilities: number;
  marketing: number;
  ownerWithdrawal: number;
  taxFeesReserve: number;
  loanAmount: number;
  monthlyLoanRepayment: number;
};

export type InputKey = keyof FinancialInputs;
export type Recommendation = "start-validating" | "revise-plan" | "delay-opening";

export type ForecastMonth = {
  month: number;
  revenue: number;
  expenses: number;
  cashMovement: number;
  endingCash: number;
};

export type Forecast = {
  startupCapitalRequired: number;
  openingCashAfterSetup: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  monthlyVariableCost: number;
  monthlyFixedCosts: number;
  monthlyExpenses: number;
  monthlyCashMovement: number;
  grossProfit: number;
  grossMarginPercentage: number;
  breakEvenRevenue: number;
  breakEvenCustomersPerDay: number;
  cashNegativeMonth: number | null;
  months: ForecastMonth[];
  recommendation: Recommendation;
};

export type ScenarioRange = { low: number; expected: number; high: number };
export type ScenarioInputs = {
  customersPerDay: ScenarioRange;
  averageOrderValue: ScenarioRange;
  variableCostPerOrder: ScenarioRange;
};

export type ScenarioErrors = Partial<Record<keyof ScenarioInputs, string[]>>;

export type ScenarioForecasts = {
  pessimistic: Forecast;
  base: Forecast;
  optimistic: Forecast;
};

export type Sensitivity = {
  key: InputKey;
  absoluteImpact: number;
  adverseValue: number;
};

export const DEFAULT_INPUTS: FinancialInputs = {
  initialCapital: 300_000,
  rent: 18_000,
  depositMonths: 2,
  equipmentRenovation: 160_000,
  averageOrderValue: 75,
  variableCostPerOrder: 24,
  customersPerDay: 55,
  openDaysPerMonth: 26,
  staffWages: 28_000,
  utilities: 7_000,
  marketing: 5_000,
  ownerWithdrawal: 15_000,
  taxFeesReserve: 0,
  loanAmount: 0,
  monthlyLoanRepayment: 0
};

const inputKeys = Object.keys(DEFAULT_INPUTS) as InputKey[];

export function validateInputs(inputs: FinancialInputs): Partial<Record<InputKey, string>> {
  const errors: Partial<Record<InputKey, string>> = {};

  for (const key of inputKeys) {
    if (!Number.isFinite(inputs[key]) || inputs[key] < 0) {
      errors[key] = "Enter a number greater than or equal to zero.";
    }
  }

  if (inputs.averageOrderValue <= 0) {
    errors.averageOrderValue = "Average order value must be greater than zero.";
  }
  if (inputs.variableCostPerOrder >= inputs.averageOrderValue) {
    errors.variableCostPerOrder = "Variable cost must be lower than average order value.";
  }
  if (inputs.customersPerDay <= 0) {
    errors.customersPerDay = "Customers per day must be greater than zero.";
  }
  if (
    !Number.isInteger(inputs.openDaysPerMonth) ||
    inputs.openDaysPerMonth < 1 ||
    inputs.openDaysPerMonth > 31
  ) {
    errors.openDaysPerMonth = "Opening days must be a whole number from 1 to 31.";
  }

  return errors;
}

export function calculateForecast(inputs: FinancialInputs): Forecast {
  const monthlyOrders = inputs.customersPerDay * inputs.openDaysPerMonth;
  const monthlyRevenue = monthlyOrders * inputs.averageOrderValue;
  const monthlyVariableCost = monthlyOrders * inputs.variableCostPerOrder;
  const monthlyFixedCosts =
    inputs.rent +
    inputs.staffWages +
    inputs.utilities +
    inputs.marketing +
    inputs.ownerWithdrawal +
    inputs.taxFeesReserve +
    inputs.monthlyLoanRepayment;
  const monthlyExpenses = monthlyVariableCost + monthlyFixedCosts;
  const monthlyCashMovement = monthlyRevenue - monthlyExpenses;
  const startupCapitalRequired = inputs.rent * inputs.depositMonths + inputs.equipmentRenovation;
  const openingCashAfterSetup = inputs.initialCapital + inputs.loanAmount - startupCapitalRequired;
  const grossProfit = monthlyRevenue - monthlyVariableCost;
  const grossMargin = monthlyRevenue > 0 ? grossProfit / monthlyRevenue : 0;
  const breakEvenRevenue = grossMargin > 0 ? monthlyFixedCosts / grossMargin : Number.POSITIVE_INFINITY;
  const breakEvenCustomersPerDay =
    breakEvenRevenue / inputs.openDaysPerMonth / inputs.averageOrderValue;

  let endingCash = openingCashAfterSetup;
  const months = Array.from({ length: FORECAST_MONTHS }, (_, index): ForecastMonth => {
    endingCash += monthlyCashMovement;
    return {
      month: index + 1,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
      cashMovement: monthlyCashMovement,
      endingCash
    };
  });

  const cashNegativeMonth =
    openingCashAfterSetup < 0
      ? 0
      : (months.find((month) => month.endingCash < 0)?.month ?? null);
  const reachesBreakEven = inputs.customersPerDay >= breakEvenCustomersPerDay;
  const recommendation: Recommendation =
    cashNegativeMonth !== null
      ? "delay-opening"
      : reachesBreakEven
        ? "start-validating"
        : "revise-plan";

  return {
    startupCapitalRequired,
    openingCashAfterSetup,
    monthlyOrders,
    monthlyRevenue,
    monthlyVariableCost,
    monthlyFixedCosts,
    monthlyExpenses,
    monthlyCashMovement,
    grossProfit,
    grossMarginPercentage: grossMargin * 100,
    breakEvenRevenue,
    breakEvenCustomersPerDay,
    cashNegativeMonth,
    months,
    recommendation
  };
}

export function calculateScenarios(
  inputs: FinancialInputs,
  ranges: ScenarioInputs
): ScenarioForecasts {
  return {
    pessimistic: calculateForecast({
      ...inputs,
      customersPerDay: ranges.customersPerDay.low,
      averageOrderValue: ranges.averageOrderValue.low,
      variableCostPerOrder: ranges.variableCostPerOrder.high
    }),
    base: calculateForecast({
      ...inputs,
      customersPerDay: ranges.customersPerDay.expected,
      averageOrderValue: ranges.averageOrderValue.expected,
      variableCostPerOrder: ranges.variableCostPerOrder.expected
    }),
    optimistic: calculateForecast({
      ...inputs,
      customersPerDay: ranges.customersPerDay.high,
      averageOrderValue: ranges.averageOrderValue.high,
      variableCostPerOrder: ranges.variableCostPerOrder.low
    })
  };
}

export function calculatePlanningRecommendation(scenarios: ScenarioForecasts): Recommendation {
  if (scenarios.base.cashNegativeMonth !== null) {
    return "delay-opening";
  }

  if (
    scenarios.base.recommendation === "revise-plan" ||
    scenarios.pessimistic.cashNegativeMonth !== null
  ) {
    return "revise-plan";
  }

  return "start-validating";
}

export function validateScenarioInputs(ranges: ScenarioInputs): ScenarioErrors {
  const errors: ScenarioErrors = {};
  const drivers = Object.keys(ranges) as (keyof ScenarioInputs)[];
  const bands = ["low", "expected", "high"] as const;

  function addError(driver: keyof ScenarioInputs, message: string) {
    const driverErrors = errors[driver] ?? [];
    if (!driverErrors.includes(message)) {
      errors[driver] = [...driverErrors, message];
    }
  }

  for (const driver of drivers) {
    const range = ranges[driver];
    for (const band of bands) {
      const value = range[band];
      const mustBePositive = driver !== "variableCostPerOrder";
      if (!Number.isFinite(value) || value < 0 || (mustBePositive && value === 0)) {
        addError(driver, "Scenario values must be valid positive numbers.");
      }
    }

    if (range.low > range.expected || range.expected > range.high) {
      addError(driver, "Values must be ordered from low to expected to high.");
    }
  }

  for (const band of bands) {
    if (ranges.variableCostPerOrder[band] >= ranges.averageOrderValue[band]) {
      addError("averageOrderValue", "Order value must exceed variable cost in every scenario.");
      addError("variableCostPerOrder", "Variable cost must stay below order value in every scenario.");
    }
  }

  return errors;
}

const adverseDirection: Record<InputKey, "increase" | "decrease"> = {
  initialCapital: "decrease",
  rent: "increase",
  depositMonths: "increase",
  equipmentRenovation: "increase",
  averageOrderValue: "decrease",
  variableCostPerOrder: "increase",
  customersPerDay: "decrease",
  openDaysPerMonth: "decrease",
  staffWages: "increase",
  utilities: "increase",
  marketing: "increase",
  ownerWithdrawal: "increase",
  taxFeesReserve: "increase",
  loanAmount: "decrease",
  monthlyLoanRepayment: "increase"
};

export function rankSensitivities(inputs: FinancialInputs): Sensitivity[] {
  const baseEndingCash = calculateForecast(inputs).months.at(-1)?.endingCash ?? 0;

  return inputKeys
    .map((key): Sensitivity => {
      const value = inputs[key];
      const changedValue = adverseDirection[key] === "increase" ? value * 1.1 : value * 0.9;
      const adverseValue = key === "openDaysPerMonth" ? Math.max(1, Math.round(changedValue)) : changedValue;
      const forecast = calculateForecast({ ...inputs, [key]: adverseValue });
      const endingCash = forecast.months.at(-1)?.endingCash ?? forecast.openingCashAfterSetup;

      return {
        key,
        adverseValue,
        absoluteImpact: Math.abs(baseEndingCash - endingCash)
      };
    })
    .sort((a, b) => b.absoluteImpact - a.absoluteImpact)
    .slice(0, 3);
}
