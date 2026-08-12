export const MONTHS = 6;

export const EMPTY_INPUTS = {
  initialCapital: "",
  rent: "",
  depositMonths: "",
  equipmentRenovation: "",
  averageOrderValue: "",
  variableCostPerOrder: "",
  customersPerDay: "",
  openDays: "",
  staffWages: "",
  utilities: "",
  marketing: "",
  ownerWithdrawal: "",
  taxReserve: "",
  loanAmount: "",
  loanRepayment: ""
};

export const DEMO_INPUTS = {
  initialCapital: 300000,
  rent: 18000,
  depositMonths: 2,
  equipmentRenovation: 160000,
  averageOrderValue: 75,
  variableCostPerOrder: 24,
  customersPerDay: 55,
  openDays: 26,
  staffWages: 28000,
  utilities: 7000,
  marketing: 5000,
  ownerWithdrawal: 15000,
  taxReserve: 0,
  loanAmount: 0,
  loanRepayment: 0
};

const numericKeys = Object.keys(EMPTY_INPUTS);

export function toNumbers(raw) {
  return Object.fromEntries(
    numericKeys.map((key) => [key, Number(raw[key])])
  );
}

export function validateInputs(raw) {
  const values = toNumbers(raw);
  const errors = {};

  for (const key of numericKeys) {
    if (!Number.isFinite(values[key]) || values[key] < 0) {
      errors[key] = "Enter a number greater than or equal to 0.";
    }
  }

  if (values.averageOrderValue <= 0) {
    errors.averageOrderValue = "Average order value must be greater than 0.";
  }
  if (values.variableCostPerOrder >= values.averageOrderValue) {
    errors.variableCostPerOrder = "Variable cost per order must be below the average order value.";
  }
  if (values.customersPerDay <= 0) {
    errors.customersPerDay = "Expected customers per day must be greater than 0.";
  }
  if (!Number.isInteger(values.openDays) || values.openDays < 1 || values.openDays > 31) {
    errors.openDays = "Opening days must be a whole number from 1 to 31.";
  }

  return { values, errors };
}

export function calculateForecast(values, customersPerDay = values.customersPerDay) {
  const orders = customersPerDay * values.openDays;
  const monthlyRevenue = orders * values.averageOrderValue;
  const monthlyVariableCost = orders * values.variableCostPerOrder;
  const fixedCosts =
    values.rent +
    values.staffWages +
    values.utilities +
    values.marketing +
    values.ownerWithdrawal +
    values.taxReserve +
    values.loanRepayment;
  const monthlyExpenses = fixedCosts + monthlyVariableCost;
  const monthlyCashMovement = monthlyRevenue - monthlyExpenses;
  const startupCosts = values.rent * values.depositMonths + values.equipmentRenovation;
  const openingCashAfterSetup = values.initialCapital + values.loanAmount - startupCosts;
  const grossProfit = monthlyRevenue - monthlyVariableCost;
  const grossMargin = monthlyRevenue > 0 ? grossProfit / monthlyRevenue : 0;
  const breakEvenRevenue = grossMargin > 0 ? fixedCosts / grossMargin : Infinity;
  const breakEvenCustomersPerDay =
    breakEvenRevenue === Infinity
      ? Infinity
      : breakEvenRevenue / values.openDays / values.averageOrderValue;

  let endingCash = openingCashAfterSetup;
  const months = Array.from({ length: MONTHS }, (_, index) => {
    endingCash += monthlyCashMovement;
    return {
      month: index + 1,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
      cashMovement: monthlyCashMovement,
      endingCash
    };
  });

  const firstNegativeMonth = months.find((month) => month.endingCash < 0)?.month ?? null;
  const cashRunout = openingCashAfterSetup < 0 ? "Before opening" : firstNegativeMonth;
  const reachesBreakEven = customersPerDay >= breakEvenCustomersPerDay;

  return {
    customersPerDay,
    orders,
    monthlyRevenue,
    monthlyExpenses,
    monthlyVariableCost,
    fixedCosts,
    monthlyCashMovement,
    startupCosts,
    openingCashAfterSetup,
    grossProfit,
    grossMargin,
    breakEvenRevenue,
    breakEvenCustomersPerDay,
    months,
    cashRunout,
    reachesBreakEven,
    recommendation:
      openingCashAfterSetup < 0 || firstNegativeMonth !== null
        ? "Delay opening"
        : reachesBreakEven && cashRunout === null
          ? "Start validating"
          : "Revise the plan"
  };
}
export function calculateComparison(values, scenarioCustomersPerDay) {
  return {
    base: calculateForecast(values),
    scenario: calculateForecast(values, scenarioCustomersPerDay)
  };
}
