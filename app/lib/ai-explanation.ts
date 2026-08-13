import type { InputKey, Recommendation, ScenarioInputs } from "./finance";

export type ExplanationDriverKey =
  | InputKey
  | "startup-costs"
  | "cash-runway"
  | "break-even"
  | "scenario-range";

export type PlanExplanation = {
  summary: string;
  keyDrivers: Array<{ key: ExplanationDriverKey; why: string }>;
  assumptionsToVerify: string[];
  nextSteps: string[];
  disclaimer: string;
};

export type PlanDraft = {
  summary: string;
  suggestedInputs: Partial<Record<InputKey, number>>;
  assumptionsToVerify: string[];
  disclaimer: string;
};

const driverKeys = new Set<ExplanationDriverKey>([
  "initialCapital",
  "rent",
  "depositMonths",
  "equipmentRenovation",
  "averageOrderValue",
  "variableCostPerOrder",
  "customersPerDay",
  "openDaysPerMonth",
  "staffWages",
  "utilities",
  "marketing",
  "ownerWithdrawal",
  "taxFeesReserve",
  "loanAmount",
  "monthlyLoanRepayment",
  "startup-costs",
  "cash-runway",
  "break-even",
  "scenario-range"
]);

function isString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function isPlanExplanation(value: unknown): value is PlanExplanation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const keyDrivers = candidate.keyDrivers;
  const assumptionsToVerify = candidate.assumptionsToVerify;
  const nextSteps = candidate.nextSteps;

  return isString(candidate.summary, 500)
    && Array.isArray(keyDrivers)
    && keyDrivers.length <= 4
    && keyDrivers.every((driver) => {
      if (!driver || typeof driver !== "object") return false;
      const item = driver as Record<string, unknown>;
      return typeof item.key === "string" && driverKeys.has(item.key as ExplanationDriverKey)
        && isString(item.why, 280);
    })
    && Array.isArray(assumptionsToVerify)
    && assumptionsToVerify.length <= 5
    && assumptionsToVerify.every((item) => isString(item, 240))
    && Array.isArray(nextSteps)
    && nextSteps.length <= 4
    && nextSteps.every((item) => isString(item, 240))
    && typeof candidate.disclaimer === "string"
    && isString(candidate.disclaimer, 280);
}

export function isPlanDraft(value: unknown): value is PlanDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const suggestedInputs = candidate.suggestedInputs;
  const assumptionsToVerify = candidate.assumptionsToVerify;

  return isString(candidate.summary, 500)
    && Boolean(suggestedInputs)
    && typeof suggestedInputs === "object"
    && !Array.isArray(suggestedInputs)
    && Object.entries(suggestedInputs as Record<string, unknown>).every(([key, item]) =>
      driverKeys.has(key as ExplanationDriverKey)
        && key !== "startup-costs"
        && key !== "cash-runway"
        && key !== "break-even"
        && key !== "scenario-range"
        && typeof item === "number"
        && Number.isFinite(item)
        && item >= 0
    )
    && assumptionsToVerify !== undefined
    && Array.isArray(assumptionsToVerify)
    && assumptionsToVerify.length <= 8
    && assumptionsToVerify.every((item) => isString(item, 240))
    && typeof candidate.disclaimer === "string"
    && isString(candidate.disclaimer, 280);
}

export function explanationDisclaimer(language: "en" | "th") {
  return language === "en"
    ? "Numbers are calculated by Perd Wai. This AI explanation is educational, not financial, tax, legal, or investment advice."
    : "ตัวเลขคำนวณโดยเปิดไหว คำอธิบายจาก AI นี้มีไว้เพื่อการศึกษา ไม่ใช่คำแนะนำทางการเงิน ภาษี กฎหมาย หรือการลงทุน";
}

export function draftDisclaimer(language: "en" | "th") {
  return language === "en"
    ? "These are AI-drafted starting points from your description. Review every value before using the forecast."
    : "ตัวเลขเหล่านี้เป็นร่างเริ่มต้นจาก AI ตามคำอธิบายของคุณ ควรตรวจสอบทุกค่าก่อนใช้ประมาณการ";
}

export type ExplanationRequest = {
  language: "en" | "th";
  inputs: Record<InputKey, number>;
  scenarios: ScenarioInputs;
};

export type ExplanationSummary = {
  recommendation: Recommendation;
  forecast: {
    openingCashAfterSetup: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyCashMovement: number;
    grossMarginPercentage: number;
    breakEvenCustomersPerDay: number;
    cashNegativeMonth: number | null;
    endingCashAtMonth6: number;
  };
  scenarios: Record<"pessimistic" | "base" | "optimistic", {
    cashNegativeMonth: number | null;
    endingCashAtMonth6: number;
    recommendation: Recommendation;
  }>;
};
