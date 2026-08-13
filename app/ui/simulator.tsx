"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PlanExplanation } from "../lib/ai-explanation";

import {
  DEFAULT_INPUTS,
  calculateForecast,
  calculatePlanningRecommendation,
  calculateScenarios,
  rankSensitivities,
  validateInputs,
  validateScenarioInputs,
  type FinancialInputs,
  type Forecast,
  type InputKey,
  type Recommendation,
  type ScenarioInputs
} from "../lib/finance";

type Language = "en" | "th";
type PlanMode = "choice" | "custom" | "example";
type SavedPlan = {
  version: 2;
  language: Language;
  mode: Exclude<PlanMode, "choice">;
  inputs: FinancialInputs;
  scenarios: ScenarioInputs;
  currentStep: number;
  maxStep: number;
  showResults: boolean;
  usesLoan: boolean;
  showsTaxReserve: boolean;
};
type LegacySavedPlan = { version: 1; inputs: FinancialInputs; scenarios: ScenarioInputs };

const STORAGE_KEY = "perd-wai-plan-v1";

const EMPTY_INPUTS: FinancialInputs = {
  initialCapital: 0,
  rent: 0,
  depositMonths: 0,
  equipmentRenovation: 0,
  averageOrderValue: 0,
  variableCostPerOrder: 0,
  customersPerDay: 0,
  openDaysPerMonth: 0,
  staffWages: 0,
  utilities: 0,
  marketing: 0,
  ownerWithdrawal: 0,
  taxFeesReserve: 0,
  loanAmount: 0,
  monthlyLoanRepayment: 0
};

const EMPTY_SCENARIOS: ScenarioInputs = {
  customersPerDay: { low: 0, expected: 0, high: 0 },
  averageOrderValue: { low: 0, expected: 0, high: 0 },
  variableCostPerOrder: { low: 0, expected: 0, high: 0 }
};

const EXAMPLE_SCENARIOS: ScenarioInputs = {
  customersPerDay: { low: 41, expected: 55, high: 69 },
  averageOrderValue: { low: 67.5, expected: 75, high: 82.5 },
  variableCostPerOrder: { low: 21.6, expected: 24, high: 26.4 }
};

const stages: { title: Record<Language, string>; keys: InputKey[] }[] = [
  {
    title: { en: "Money before opening", th: "เงินก่อนเปิดร้าน" },
    keys: ["initialCapital", "rent", "depositMonths", "equipmentRenovation"]
  },
  {
    title: { en: "Sales assumptions", th: "สมมติฐานยอดขาย" },
    keys: ["averageOrderValue", "variableCostPerOrder", "customersPerDay", "openDaysPerMonth"]
  },
  {
    title: { en: "Monthly operating costs", th: "ค่าใช้จ่ายดำเนินงานรายเดือน" },
    keys: ["staffWages", "utilities", "marketing", "ownerWithdrawal"]
  },
  { title: { en: "Stress-test the plan", th: "ทดสอบแผนหลายสถานการณ์" }, keys: [] },
  { title: { en: "Review assumptions", th: "ตรวจสอบสมมติฐาน" }, keys: [] }
];

const fieldCopy: Record<InputKey, {
  en: string;
  th: string;
  unit: Record<Language, string>;
  hint?: Record<Language, string>;
  step?: number;
  decimal?: boolean;
}> = {
  initialCapital: { en: "Initial capital", th: "เงินทุนตั้งต้น", unit: { en: "THB", th: "บาท" }, step: 1000 },
  rent: { en: "Monthly rent", th: "ค่าเช่ารายเดือน", unit: { en: "THB", th: "บาท" }, step: 500 },
  depositMonths: { en: "Rent deposit", th: "เงินประกันค่าเช่า", unit: { en: "months", th: "เดือน" } },
  equipmentRenovation: { en: "Equipment and renovation", th: "อุปกรณ์และตกแต่ง", unit: { en: "THB", th: "บาท" }, step: 1000 },
  averageOrderValue: { en: "Average order value", th: "ยอดซื้อต่อบิล", unit: { en: "THB/order", th: "บาท/บิล" }, decimal: true },
  variableCostPerOrder: {
    en: "Variable cost per order",
    th: "ต้นทุนผันแปรต่อบิล",
    unit: { en: "THB/order", th: "บาท/บิล" },
    decimal: true,
    hint: {
      en: "Ingredients, cup, lid, packaging, and fees incurred for each order.",
      th: "เช่น วัตถุดิบ แก้ว ฝา บรรจุภัณฑ์ และค่าธรรมเนียมที่เกิดทุกออเดอร์"
    }
  },
  customersPerDay: { en: "Expected customers per day", th: "ลูกค้าที่คาดต่อวัน", unit: { en: "customers/day", th: "คน/วัน" }, decimal: true },
  openDaysPerMonth: { en: "Opening days per month", th: "วันเปิดต่อเดือน", unit: { en: "days", th: "วัน" } },
  staffWages: { en: "Staff wages", th: "ค่าจ้างพนักงาน", unit: { en: "THB/month", th: "บาท/เดือน" }, step: 500 },
  utilities: { en: "Utilities", th: "ค่าน้ำค่าไฟ", unit: { en: "THB/month", th: "บาท/เดือน" }, step: 500 },
  marketing: { en: "Marketing", th: "การตลาด", unit: { en: "THB/month", th: "บาท/เดือน" }, step: 500 },
  ownerWithdrawal: {
    en: "Owner withdrawal",
    th: "เงินถอนของเจ้าของ",
    unit: { en: "THB/month", th: "บาท/เดือน" },
    step: 500,
    hint: { en: "Cash you need to take from the business for personal living costs.", th: "เงินที่เจ้าของต้องนำออกจากร้านเพื่อใช้จ่ายส่วนตัว" }
  },
  taxFeesReserve: {
    en: "Tax and fees reserve",
    th: "เงินสำรองภาษีและค่าธรรมเนียม",
    unit: { en: "THB/month", th: "บาท/เดือน" },
    step: 500,
    hint: { en: "Optional cash reserve only; this tool does not calculate tax or VAT.", th: "เป็นเงินสำรองเท่านั้น ระบบไม่ได้คำนวณภาษีหรือ VAT" }
  },
  loanAmount: { en: "Loan proceeds", th: "เงินกู้ที่ได้รับ", unit: { en: "THB", th: "บาท" }, step: 1000 },
  monthlyLoanRepayment: {
    en: "Loan repayment",
    th: "ผ่อนชำระเงินกู้",
    unit: { en: "THB/month", th: "บาท/เดือน" },
    step: 500,
    hint: { en: "Enter the full monthly cash payment including interest and fees.", th: "ใส่ยอดชำระเงินจริงต่อเดือน รวมดอกเบี้ยและค่าธรรมเนียม" }
  }
};

const scenarioDriverCopy: Record<keyof ScenarioInputs, Record<Language, string>> = {
  customersPerDay: { en: "customers per day", th: "ลูกค้าต่อวัน" },
  averageOrderValue: { en: "average order value", th: "ยอดซื้อต่อบิล" },
  variableCostPerOrder: { en: "variable cost per order", th: "ต้นทุนผันแปรต่อบิล" }
};

const copy = {
  en: {
    heroEyebrow: "Before you open",
    heroTitle: "Can your café survive the first six months?",
    heroBody: "Build a forecast from your own assumptions, understand the risk, and leave with one practical next step.",
    notice: "Planning estimate only — not financial or tax advice. Verify assumptions with customers, suppliers, and a qualified adviser.",
    chooseTitle: "How would you like to begin?",
    chooseBody: "Rough estimates are fine — you can change them later. Your numbers remain on this device.",
    timeEstimate: "About 5 minutes",
    autoSave: "Saved automatically",
    prepareTitle: "Have these numbers nearby",
    prepareBody: "You do not need perfect figures. Use your best current estimate and note what still needs checking.",
    prepareItems: ["Cash and one-time setup costs", "Expected orders, prices, and opening days", "Monthly bills and operating costs"],
    outcomeTitle: "Your plan will show",
    outcomeItems: ["How much cash remains after setup", "Customers needed per day to break even", "The riskiest assumption and one next action"],
    stepHelpTitle: "What this step tells you",
    practicalTip: "Helpful starting point",
    createPlan: "Create my plan",
    createPlanBody: "Start with your own café assumptions.",
    exploreExample: "Explore an example café",
    exploreExampleBody: "See how the simulator works before entering your numbers.",
    exampleBanner: "Example plan — replace these assumptions with your own before deciding.",
    saved: "Saved on this device",
    startOver: "Start over",
    back: "Back",
    optional: "Optional",
    addLoan: "Add a loan",
    removeLoan: "Remove loan",
    addTax: "Add tax and fees reserve",
    removeTax: "Remove tax reserve",
    pessimistic: "Pessimistic",
    base: "Expected",
    optimistic: "Optimistic",
    scenarioBody: "Enter your low and high assumptions. These are estimates, not probabilities.",
    forecast: "Your six-month decision",
    estimate: "Estimate based on your assumptions",
    startup: "Upfront setup cost",
    openingCash: "Cash available after setup",
    revenue: "Estimated monthly revenue",
    expenses: "Estimated monthly expenses",
    grossMargin: "Gross margin",
    breakEven: "Break-even customers/day",
    runway: "Estimated cash runway",
    noRunout: "Beyond 6 months",
    beforeOpening: "Before opening",
    month: "Month",
    endingCash: "Ending cash",
    cashMovement: "Cash movement",
    recommendation: "What the model found",
    why: "Why it matters",
    verifyFirst: "Verify this assumption first",
    nextAction: "One action to take next",
    sensitivity: "Sensitivity check",
    sensitivityBody: "Estimated Month 6 cash impact when one assumption becomes 10% worse.",
    calculation: "How is this calculated?",
    exportCsv: "Export CSV",
    printPdf: "Print / Save PDF",
    limitations: "Model boundaries",
    limitationBody: "Steady monthly demand; no seasonality, VAT, tax calculation, loan interest, or lender approval. Tax reserve and loan repayment are user-entered cash outflows.",
    monthlyDetail: "Monthly cash detail",
    tableHint: "Scroll the table sideways to see every column on a small screen.",
    scenarioComparison: "Scenario comparison",
    scenarioErrorTitle: "Check your scenario estimates",
    scenarioErrorBody: "Enter low, expected, and high values in that order.",
    fixStep: "Check the highlighted assumptions before continuing.",
    reviewIntro: "Check the numbers that will drive your estimate. Change any section before calculating.",
    change: "Change",
    calculateForecast: "Calculate my forecast",
    returnToReview: "Return to review",
    errorSummaryTitle: "Check these assumptions",
    seeForecast: "See my forecast",
    explainPlan: "Explain my plan",
    aiExplanation: "AI explanation",
    aiDisclosure: "Numbers are calculated by Perd Wai. This explanation is generated by AI.",
    aiLoading: "Preparing an explanation…",
    aiSummary: "In plain language",
    aiDrivers: "What drives this result",
    aiVerify: "What to verify",
    aiNextSteps: "Questions to consider",
    aiUnavailable: "The AI explanation is unavailable right now. Your calculated forecast is still complete.",
    aiRetry: "Try again",
    aiCopy: "Copy explanation",
    aiCopied: "Copied",
    aiHuman: "For tax, legal, or investment questions, speak with a qualified adviser."
  },
  th: {
    heroEyebrow: "ก่อนเปิดร้าน",
    heroTitle: "ร้านกาแฟของคุณจะอยู่รอดหกเดือนแรกได้ไหม?",
    heroBody: "สร้างประมาณการจากตัวเลขของคุณ เข้าใจความเสี่ยง และเลือกงานถัดไปที่ทำได้จริง",
    notice: "เป็นเพียงประมาณการเพื่อวางแผน ไม่ใช่คำแนะนำทางการเงินหรือภาษี ควรตรวจสอบข้อมูลกับลูกค้า ซัพพลายเออร์ และผู้เชี่ยวชาญ",
    chooseTitle: "อยากเริ่มแบบไหน?",
    chooseBody: "ใช้ตัวเลขคร่าว ๆ ได้ และกลับมาแก้ภายหลังได้ ข้อมูลจะเก็บไว้ในอุปกรณ์นี้",
    timeEstimate: "ใช้เวลาประมาณ 5 นาที",
    autoSave: "บันทึกให้อัตโนมัติ",
    prepareTitle: "เตรียมตัวเลขเหล่านี้ไว้ใกล้มือ",
    prepareBody: "ไม่ต้องมีตัวเลขที่สมบูรณ์ ใช้ค่าที่คาดไว้ก่อน แล้วจดว่าค่าไหนยังต้องตรวจสอบ",
    prepareItems: ["เงินที่มีและค่าเปิดร้านครั้งเดียว", "จำนวนลูกค้า ราคา และวันเปิดร้าน", "บิลและค่าใช้จ่ายดำเนินงานรายเดือน"],
    outcomeTitle: "แผนนี้จะช่วยให้เห็น",
    outcomeItems: ["เงินสดที่เหลือหลังจ่ายค่าเปิดร้าน", "จำนวนลูกค้าต่อวันที่ทำให้คุ้มทุน", "สมมติฐานที่เสี่ยงที่สุดและงานถัดไปหนึ่งอย่าง"],
    stepHelpTitle: "ขั้นตอนนี้ช่วยตอบอะไร",
    practicalTip: "จุดเริ่มต้นที่ใช้ได้",
    createPlan: "สร้างแผนของฉัน",
    createPlanBody: "เริ่มจากตัวเลขของร้านที่คุณกำลังวางแผน",
    exploreExample: "ดูตัวอย่างร้าน",
    exploreExampleBody: "ดูวิธีทำงานของระบบก่อนใส่ตัวเลขของคุณ",
    exampleBanner: "แผนตัวอย่าง — เปลี่ยนเป็นตัวเลขของคุณก่อนตัดสินใจ",
    saved: "บันทึกในอุปกรณ์นี้แล้ว",
    startOver: "เริ่มใหม่",
    back: "ย้อนกลับ",
    optional: "ไม่บังคับ",
    addLoan: "เพิ่มเงินกู้",
    removeLoan: "นำเงินกู้ออก",
    addTax: "เพิ่มเงินสำรองภาษีและค่าธรรมเนียม",
    removeTax: "นำเงินสำรองภาษีออก",
    pessimistic: "กรณีแย่",
    base: "ค่าคาดการณ์",
    optimistic: "กรณีดี",
    scenarioBody: "ใส่ค่าต่ำและค่าสูงจากหลักฐานที่คุณมี ค่าเหล่านี้เป็นประมาณการ ไม่ใช่ความน่าจะเป็น",
    forecast: "การตัดสินใจจากประมาณการหกเดือน",
    estimate: "ประมาณการจากสมมติฐานของคุณ",
    startup: "ค่าใช้จ่ายก่อนเปิดร้าน",
    openingCash: "เงินสดหลังหักค่าเปิดร้าน",
    revenue: "รายรับต่อเดือนโดยประมาณ",
    expenses: "รายจ่ายต่อเดือนโดยประมาณ",
    grossMargin: "อัตรากำไรขั้นต้น",
    breakEven: "ลูกค้าคุ้มทุนต่อวัน",
    runway: "ระยะเวลาเงินสดโดยประมาณ",
    noRunout: "เกิน 6 เดือน",
    beforeOpening: "ก่อนเปิดร้าน",
    month: "เดือน",
    endingCash: "เงินสดปลายเดือน",
    cashMovement: "เงินสดเปลี่ยนแปลง",
    recommendation: "แบบจำลองพบอะไร",
    why: "ทำไมจึงสำคัญ",
    verifyFirst: "ตรวจสอบสมมติฐานนี้ก่อน",
    nextAction: "งานถัดไปหนึ่งอย่าง",
    sensitivity: "การทดสอบความไว",
    sensitivityBody: "ผลต่อเงินสดเดือน 6 โดยประมาณ เมื่อสมมติฐานหนึ่งแย่ลง 10%",
    calculation: "คำนวณอย่างไร?",
    exportCsv: "ส่งออก CSV",
    printPdf: "พิมพ์ / บันทึก PDF",
    limitations: "ขอบเขตของแบบจำลอง",
    limitationBody: "สมมติยอดขายคงที่ทุกเดือน ยังไม่คำนวณฤดูกาล VAT ภาษี ดอกเบี้ยเงินกู้ หรือการอนุมัติสินเชื่อ เงินสำรองภาษีและค่างวดเป็นค่าที่ผู้ใช้กรอก",
    monthlyDetail: "รายละเอียดเงินสดรายเดือน",
    tableHint: "เลื่อนตารางไปด้านข้างเพื่อดูทุกคอลัมน์บนหน้าจอขนาดเล็ก",
    scenarioComparison: "เปรียบเทียบสถานการณ์",
    scenarioErrorTitle: "ตรวจสอบค่าประมาณของสถานการณ์",
    scenarioErrorBody: "ใส่ค่าต่ำ ค่าคาดการณ์ และค่าสูงตามลำดับ",
    fixStep: "ตรวจสอบสมมติฐานที่ระบุก่อนดำเนินการต่อ",
    reviewIntro: "ตรวจสอบตัวเลขที่จะใช้คำนวณประมาณการ เปลี่ยนแต่ละส่วนได้ก่อนคำนวณ",
    change: "แก้ไข",
    calculateForecast: "คำนวณประมาณการ",
    returnToReview: "กลับไปตรวจสอบ",
    errorSummaryTitle: "ตรวจสอบสมมติฐานเหล่านี้",
    seeForecast: "ดูประมาณการของฉัน",
    explainPlan: "อธิบายแผนของฉัน",
    aiExplanation: "คำอธิบายจาก AI",
    aiDisclosure: "ตัวเลขคำนวณโดยเปิดไหว ส่วนคำอธิบายนี้สร้างโดย AI",
    aiLoading: "กำลังเตรียมคำอธิบาย…",
    aiSummary: "สรุปให้เข้าใจง่าย",
    aiDrivers: "อะไรเป็นตัวขับเคลื่อนผลลัพธ์",
    aiVerify: "สิ่งที่ควรตรวจสอบ",
    aiNextSteps: "คำถามที่ควรคิดต่อ",
    aiUnavailable: "คำอธิบายจาก AI ยังใช้งานไม่ได้ ข้อมูลประมาณการที่คำนวณไว้ยังครบถ้วน",
    aiRetry: "ลองอีกครั้ง",
    aiCopy: "คัดลอกคำอธิบาย",
    aiCopied: "คัดลอกแล้ว",
    aiHuman: "หากมีคำถามด้านภาษี กฎหมาย หรือการลงทุน ควรปรึกษาผู้เชี่ยวชาญ"
  }
} as const;

const stageHelp: { body: Record<Language, string>; tip: Record<Language, string> }[] = [
  {
    body: {
      en: "We subtract setup costs from the cash available to show what remains on opening day.",
      th: "ระบบจะหักค่าเปิดร้านออกจากเงินที่มี เพื่อดูว่าในวันเปิดร้านจะเหลือเงินสดเท่าไร"
    },
    tip: {
      en: "Enter only cash you can actually commit to the café. Keep personal emergency savings separate.",
      th: "ใส่เฉพาะเงินที่พร้อมใช้กับร้านจริง และแยกเงินฉุกเฉินส่วนตัวไว้ต่างหาก"
    }
  },
  {
    body: {
      en: "Monthly revenue is estimated as customers per day × opening days × average order value.",
      th: "รายรับต่อเดือนประมาณจาก ลูกค้าต่อวัน × วันเปิดร้าน × ยอดซื้อต่อบิล"
    },
    tip: {
      en: "Use a small sales test or three days of location counts when possible — not your best-case guess.",
      th: "ถ้าเป็นไปได้ ใช้ข้อมูลจากการทดลองขายหรือการนับลูกค้าที่ทำเลจริง 3 วัน แทนการเดาแบบดีที่สุด"
    }
  },
  {
    body: {
      en: "These are the bills the café must cover each month, even when sales are below target.",
      th: "นี่คือค่าใช้จ่ายที่ร้านต้องจ่ายทุกเดือน แม้ยอดขายจะต่ำกว่าเป้า"
    },
    tip: {
      en: "Use recent quotes or bills. Add owner withdrawal if the café must also support your living costs.",
      th: "ใช้ใบเสนอราคาหรือบิลล่าสุด และเพิ่มเงินถอนของเจ้าของหากร้านต้องจ่ายค่าครองชีพให้คุณด้วย"
    }
  },
  {
    body: {
      en: "A low and high range shows whether the plan still works when reality differs from your expectation.",
      th: "ค่าต่ำและค่าสูงช่วยดูว่าแผนยังไหวหรือไม่ เมื่อของจริงไม่ตรงกับที่คาด"
    },
    tip: {
      en: "Set a lower sales case and a higher cost case using evidence you could realistically observe.",
      th: "ตั้งกรณียอดขายต่ำและต้นทุนสูงจากสิ่งที่มีโอกาสเกิดจริงและมีหลักฐานรองรับ"
    }
  },
  {
    body: {
      en: "This is the final check before calculation. Focus on any number that is still an untested guess.",
      th: "นี่คือการตรวจครั้งสุดท้ายก่อนคำนวณ ให้สังเกตตัวเลขที่ยังเป็นเพียงการคาดเดา"
    },
    tip: {
      en: "Use Change to correct a section. The forecast will not be shown until you choose Calculate.",
      th: "กด แก้ไข เพื่อกลับไปเปลี่ยนแต่ละส่วน ระบบจะแสดงผลเมื่อคุณกดคำนวณเท่านั้น"
    }
  }
];

const recommendationTitles: Record<Recommendation, Record<Language, string>> = {
  "start-validating": { en: "Start validating", th: "เริ่มทดสอบตลาด" },
  "revise-plan": { en: "Revise the plan", th: "ปรับแผนก่อน" },
  "delay-opening": { en: "Delay opening", th: "ชะลอการเปิดร้าน" }
};

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });

function parseNumericDraft(raw: string) {
  const normalized = raw.replaceAll(",", "").trim();
  if (!/^\d+(?:\.\d*)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function EditableNumberInput({
  ariaDescribedBy,
  ariaInvalid,
  ariaLabel,
  decimalInput = false,
  id,
  name,
  value,
  onValueChange
}: {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaLabel?: string;
  decimalInput?: boolean;
  id?: string;
  name?: string;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [previousValue, setPreviousValue] = useState(value);

  if (value !== previousValue) {
    setPreviousValue(value);
    if (parseNumericDraft(draft) !== value) setDraft(String(value));
  }

  return (
    <Input
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-label={ariaLabel}
      id={id}
      inputMode={decimalInput ? "decimal" : "numeric"}
      name={name}
      spellCheck={false}
      type="text"
      value={draft}
      onBlur={() => {
        const parsed = parseNumericDraft(draft);
        if (parsed === null) setDraft(String(value));
      }}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        const parsed = parseNumericDraft(nextDraft);
        if (parsed !== null) onValueChange(parsed);
      }}
    />
  );
}

function localizedInputError(field: InputKey, language: Language) {
  if (language === "th") {
    if (field === "averageOrderValue") return "ยอดซื้อต่อบิลต้องมากกว่าศูนย์";
    if (field === "variableCostPerOrder") return "ต้นทุนผันแปรต้องต่ำกว่ายอดซื้อต่อบิล";
    if (field === "customersPerDay") return "จำนวนลูกค้าต่อวันต้องมากกว่าศูนย์";
    if (field === "openDaysPerMonth") return "จำนวนวันเปิดต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 31";
    return "ใส่ตัวเลขตั้งแต่ศูนย์ขึ้นไป";
  }
  if (field === "averageOrderValue") return "Average order value must be greater than zero.";
  if (field === "variableCostPerOrder") return "Variable cost must be lower than average order value.";
  if (field === "customersPerDay") return "Customers per day must be greater than zero.";
  if (field === "openDaysPerMonth") return "Opening days must be a whole number from 1 to 31.";
  return "Enter a number greater than or equal to zero.";
}

function NumberField({ field, value, language, invalid, onChange }: {
  field: InputKey;
  value: number;
  language: Language;
  invalid: boolean;
  onChange: (field: InputKey, value: number) => void;
}) {
  const item = fieldCopy[field];
  const isMoney = item.unit.en.startsWith("THB");
  const hintId = item.hint ? `${field}-hint` : undefined;
  const unitId = `${field}-unit`;
  const errorId = invalid ? `${field}-error` : undefined;
  const describedBy = [unitId, hintId, errorId].filter(Boolean).join(" ");

  return (
    <Field className="field" data-invalid={invalid}>
      <FieldLabel className="field-label" htmlFor={field}>{item[language]}</FieldLabel>
      <span className={isMoney ? "sr-only" : "field-unit"} id={unitId}>{item.unit[language]}</span>
      {isMoney ? (
        <MoneyInput
          aria-describedby={describedBy}
          aria-invalid={invalid}
          decimal={item.decimal}
          id={field}
          name={field}
          suffix={language === "en" ? "THB" : "บาท"}
          testId={`money-input-${field}`}
          value={value}
          onValueChange={(nextValue) => onChange(field, nextValue)}
        />
      ) : (
        <EditableNumberInput
          ariaDescribedBy={describedBy}
          ariaInvalid={invalid}
          decimalInput={item.decimal}
          id={field}
          name={field}
          value={value}
          onValueChange={(nextValue) => onChange(field, nextValue)}
        />
      )}
      {item.hint ? <p className="field-hint" id={hintId}>{item.hint[language]}</p> : null}
      {invalid ? <FieldError className="field-error" id={errorId}>{localizedInputError(field, language)}</FieldError> : null}
    </Field>
  );
}

function Metric({ label, value, note, featured = false }: { label: string; value: string; note: string; featured?: boolean }) {
  return <div className={`metric ${featured ? "metric-featured" : ""}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function reviewValue(field: InputKey, value: number, language: Language) {
  const item = fieldCopy[field];
  if (item.unit.en.startsWith("THB")) return currency.format(value);
  return `${decimal.format(value)} ${item.unit[language]}`;
}

function cashRunoutText(forecast: Forecast, language: Language) {
  if (forecast.cashNegativeMonth === null) return copy[language].noRunout;
  if (forecast.cashNegativeMonth === 0) return copy[language].beforeOpening;
  return `${copy[language].month} ${forecast.cashNegativeMonth}`;
}

function forecastTakeaway(forecast: Forecast, language: Language) {
  if (forecast.cashNegativeMonth === 0) return language === "en"
    ? "Setup costs use more cash than the plan has available before opening."
    : "ค่าเปิดร้านสูงกว่าเงินสดที่แผนมีอยู่ก่อนเปิดร้าน";
  if (forecast.cashNegativeMonth !== null) return language === "en"
    ? `At the current assumptions, cash becomes negative in Month ${forecast.cashNegativeMonth}.`
    : `จากสมมติฐานปัจจุบัน เงินสดจะติดลบในเดือน ${forecast.cashNegativeMonth}`;
  return language === "en"
    ? `The plan remains cash-positive for six months and ends with ${currency.format(forecast.months[5].endingCash)}.`
    : `แผนยังมีเงินสดตลอดหกเดือน และเหลือ ${currency.format(forecast.months[5].endingCash)} เมื่อจบเดือน 6`;
}

function recommendationEvidence(inputs: FinancialInputs, scenarios: ReturnType<typeof calculateScenarios>, recommendation: Recommendation, language: Language) {
  const base = scenarios.base;
  const pessimistic = scenarios.pessimistic;
  if (recommendation === "delay-opening") {
    if (base.cashNegativeMonth === 0) return language === "en"
      ? `Opening cash is ${currency.format(Math.abs(base.openingCashAfterSetup))} below zero after setup costs.`
      : `เงินสดก่อนเปิดร้านขาด ${currency.format(Math.abs(base.openingCashAfterSetup))} หลังหักค่าเปิดร้าน`;
    return language === "en"
      ? `The base case runs out of cash in Month ${base.cashNegativeMonth}.`
      : `กรณีฐานเงินสดหมดในเดือน ${base.cashNegativeMonth}`;
  }
  if (recommendation === "revise-plan") {
    const reasons: string[] = [];
    if (base.recommendation === "revise-plan") reasons.push(language === "en"
      ? `The base case assumes ${decimal.format(inputs.customersPerDay)} customers/day but needs ${decimal.format(base.breakEvenCustomersPerDay)} to break even.`
      : `กรณีฐานคาดลูกค้า ${decimal.format(inputs.customersPerDay)} คน/วัน แต่ต้องมี ${decimal.format(base.breakEvenCustomersPerDay)} คน/วันจึงจะคุ้มทุน`);
    if (pessimistic.cashNegativeMonth !== null) {
      const timing = pessimistic.cashNegativeMonth === 0
        ? language === "en" ? "before opening" : "ก่อนเปิดร้าน"
        : language === "en" ? `in Month ${pessimistic.cashNegativeMonth}` : `ในเดือน ${pessimistic.cashNegativeMonth}`;
      reasons.push(language === "en" ? `The pessimistic case runs out of cash ${timing}.` : `กรณีค่าต่ำเงินสดหมด${timing}`);
    }
    return reasons.join(" ");
  }
  return language === "en"
    ? `The base case reaches break-even at ${decimal.format(base.breakEvenCustomersPerDay)} customers/day, and the pessimistic case stays cash-positive for six months.`
    : `กรณีฐานคุ้มทุนที่ ${decimal.format(base.breakEvenCustomersPerDay)} คน/วัน และกรณีค่าต่ำยังมีเงินสดตลอดหกเดือน`;
}

function nextAction(recommendation: Recommendation, language: Language) {
  if (recommendation === "delay-opening") return language === "en"
    ? "Reduce one setup cost or confirm additional funding before signing a lease."
    : "ลดค่าเปิดร้านหนึ่งรายการหรือยืนยันแหล่งเงินเพิ่มก่อนเซ็นสัญญาเช่า";
  if (recommendation === "revise-plan") return language === "en"
    ? "Count potential customers at the location for three comparable days, then update this plan."
    : "นับลูกค้าเป้าหมายที่ทำเลจริง 3 วันที่ใกล้เคียงกัน แล้วกลับมาอัปเดตแผน";
  return language === "en"
    ? "Interview five potential customers and obtain three supplier quotes before committing capital."
    : "สัมภาษณ์ลูกค้าเป้าหมาย 5 คน และขอราคาจากซัพพลายเออร์ 3 รายก่อนลงทุน";
}

function explanationDriverLabel(key: PlanExplanation["keyDrivers"][number]["key"], language: Language) {
  if (key === "startup-costs") return language === "en" ? "Startup costs" : "ค่าเปิดร้าน";
  if (key === "cash-runway") return language === "en" ? "Cash runway" : "ระยะเวลาเงินสด";
  if (key === "break-even") return language === "en" ? "Break-even" : "จุดคุ้มทุน";
  if (key === "scenario-range") return language === "en" ? "Scenario range" : "ช่วงสถานการณ์";
  return fieldCopy[key][language];
}

function downloadCsv(inputs: FinancialInputs, forecast: Forecast) {
  const rows = [["Perd Wai plan", "Value"], ...Object.entries(inputs), [], ["Month", "Revenue", "Expenses", "Cash movement", "Ending cash"], ...forecast.months.map((month) => [month.month, month.revenue, month.expenses, month.cashMovement, month.endingCash])];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "perd-wai-plan.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Simulator() {
  const [language, setLanguage] = useState<Language>("th");
  const [mode, setMode] = useState<PlanMode>("choice");
  const [inputs, setInputs] = useState<FinancialInputs>(EMPTY_INPUTS);
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInputs>(EMPTY_SCENARIOS);
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [usesLoan, setUsesLoan] = useState(false);
  const [showsTaxReserve, setShowsTaxReserve] = useState(false);
  const [showStepErrors, setShowStepErrors] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<PlanExplanation | null>(null);
  const [aiState, setAiState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCopied, setAiCopied] = useState(false);
  const [aiFingerprint, setAiFingerprint] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as SavedPlan | LegacySavedPlan;
          if (saved.version === 2) {
            setLanguage(saved.language);
            setMode(saved.mode);
            setInputs(saved.inputs);
            setScenarioInputs(saved.scenarios);
            setCurrentStep(saved.currentStep);
            setMaxStep(saved.maxStep);
            setShowResults(saved.showResults);
            setUsesLoan(saved.usesLoan);
            setShowsTaxReserve(saved.showsTaxReserve);
          } else if (saved.version === 1) {
            setMode("custom");
            setInputs(saved.inputs);
            setScenarioInputs(saved.scenarios);
            setCurrentStep(3);
            setMaxStep(3);
            setShowResults(true);
            setUsesLoan(saved.inputs.loanAmount > 0 || saved.inputs.monthlyLoanRepayment > 0);
            setShowsTaxReserve(saved.inputs.taxFeesReserve > 0);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const errors = useMemo(() => validateInputs(inputs), [inputs]);
  const scenarioErrors = useMemo(() => validateScenarioInputs(scenarioInputs), [scenarioInputs]);
  const isValid = Object.keys(errors).length === 0;
  const areScenariosValid = Object.keys(scenarioErrors).length === 0;
  const canShowResults = mode !== "choice" && showResults && isValid && areScenariosValid;
  const forecast = useMemo(() => calculateForecast(inputs), [inputs]);
  const scenarios = useMemo(() => calculateScenarios(inputs, scenarioInputs), [inputs, scenarioInputs]);
  const sensitivities = useMemo(() => rankSensitivities(inputs), [inputs]);
  const planningRecommendation = calculatePlanningRecommendation(scenarios);
  const planFingerprint = useMemo(() => JSON.stringify({ language, inputs, scenarios: scenarioInputs }), [language, inputs, scenarioInputs]);
  const currentAiState = aiFingerprint === planFingerprint ? aiState : "idle";
  const currentAiExplanation = aiFingerprint === planFingerprint ? aiExplanation : null;
  const currentAiError = aiFingerprint === planFingerprint ? aiError : null;
  const currentAiCopied = aiFingerprint === planFingerprint && aiCopied;
  const recommendationBody = recommendationEvidence(inputs, scenarios, planningRecommendation, language);
  const maxCash = Math.max(...forecast.months.map((month) => Math.abs(month.endingCash)), 1);
  const currentStepErrorKeys = currentStep < 3
    ? stages[currentStep].keys.filter((key) => Boolean(errors[key]))
    : [];
  const t = copy[language];

  function persist(overrides: Partial<Omit<SavedPlan, "version">> = {}) {
    if (mode === "choice" && !overrides.mode) return;
    const nextMode = overrides.mode ?? mode;
    if (nextMode === "choice") return;
    const saved: SavedPlan = {
      version: 2,
      language: overrides.language ?? language,
      mode: nextMode,
      inputs: overrides.inputs ?? inputs,
      scenarios: overrides.scenarios ?? scenarioInputs,
      currentStep: overrides.currentStep ?? currentStep,
      maxStep: overrides.maxStep ?? maxStep,
      showResults: overrides.showResults ?? showResults,
      usesLoan: overrides.usesLoan ?? usesLoan,
      showsTaxReserve: overrides.showsTaxReserve ?? showsTaxReserve
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    persist({ language: nextLanguage });
  }

  function chooseMode(nextMode: Exclude<PlanMode, "choice">) {
    const isExample = nextMode === "example";
    const nextInputs = isExample ? DEFAULT_INPUTS : EMPTY_INPUTS;
    const nextScenarios = isExample ? EXAMPLE_SCENARIOS : EMPTY_SCENARIOS;
    const step = isExample ? 3 : 0;
    setMode(nextMode);
    setInputs(nextInputs);
    setScenarioInputs(nextScenarios);
    setCurrentStep(step);
    setMaxStep(step);
    setShowResults(isExample);
    setUsesLoan(false);
    setShowsTaxReserve(false);
    setShowStepErrors(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, language, mode: nextMode, inputs: nextInputs, scenarios: nextScenarios, currentStep: step, maxStep: step, showResults: isExample, usesLoan: false, showsTaxReserve: false } satisfies SavedPlan));
  }

  function startOver() {
    localStorage.removeItem(STORAGE_KEY);
    setMode("choice");
    setInputs(EMPTY_INPUTS);
    setScenarioInputs(EMPTY_SCENARIOS);
    setCurrentStep(0);
    setMaxStep(0);
    setShowResults(false);
    setUsesLoan(false);
    setShowsTaxReserve(false);
  }

  function updateInput(field: InputKey, value: number) {
    const nextInputs = { ...inputs, [field]: value };
    let nextScenarios = scenarioInputs;
    if (field === "customersPerDay" || field === "averageOrderValue" || field === "variableCostPerOrder") {
      nextScenarios = { ...scenarioInputs, [field]: { ...scenarioInputs[field], expected: value } };
      setScenarioInputs(nextScenarios);
    }
    setInputs(nextInputs);
    persist({ inputs: nextInputs, scenarios: nextScenarios });
  }

  function updateScenario(driver: keyof ScenarioInputs, band: "low" | "high", value: number) {
    const nextScenarios = { ...scenarioInputs, [driver]: { ...scenarioInputs[driver], [band]: value } };
    setScenarioInputs(nextScenarios);
    persist({ scenarios: nextScenarios });
  }

  function toggleLoan() {
    const next = !usesLoan;
    const nextInputs = next ? inputs : { ...inputs, loanAmount: 0, monthlyLoanRepayment: 0 };
    setUsesLoan(next);
    setInputs(nextInputs);
    persist({ usesLoan: next, inputs: nextInputs });
  }

  function toggleTaxReserve() {
    const next = !showsTaxReserve;
    const nextInputs = next ? inputs : { ...inputs, taxFeesReserve: 0 };
    setShowsTaxReserve(next);
    setInputs(nextInputs);
    persist({ showsTaxReserve: next, inputs: nextInputs });
  }

  function stepIsValid(step: number) {
    if (step === 3) return areScenariosValid;
    if (step === 4) return true;
    return stages[step].keys.every((key) => !errors[key]);
  }

  function goForward() {
    if (!stepIsValid(currentStep)) {
      setShowStepErrors(true);
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    setShowStepErrors(false);
    if (currentStep < 4) {
      const nextStep = maxStep >= 4 ? 4 : currentStep + 1;
      const nextMax = Math.max(maxStep, nextStep);
      setCurrentStep(nextStep);
      setMaxStep(nextMax);
      persist({ currentStep: nextStep, maxStep: nextMax });
    } else {
      setShowResults(true);
      persist({ showResults: true });
      window.requestAnimationFrame(() => document.getElementById("forecast-heading")?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  function goToStep(step: number) {
    if (step > maxStep) return;
    setCurrentStep(step);
    setShowStepErrors(false);
    persist({ currentStep: step });
  }

  async function explainPlan() {
    if (currentAiState === "loading") return;
    setAiFingerprint(planFingerprint);
    setAiExplanation(null);
    setAiState("loading");
    setAiError(null);
    setAiCopied(false);
    try {
      const response = await fetch("/api/explain-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, inputs, scenarios: scenarioInputs })
      });
      const payload = await response.json() as PlanExplanation | { error?: string };
      if (!response.ok || !("summary" in payload)) throw new Error("AI explanation unavailable");
      setAiExplanation(payload);
      setAiState("ready");
    } catch {
      setAiState("error");
      setAiError(t.aiUnavailable);
    }
  }

  async function copyExplanation() {
    if (!aiExplanation) return;
    const text = [
      aiExplanation.summary,
      ...aiExplanation.keyDrivers.map((driver) => `${explanationDriverLabel(driver.key, language)}: ${driver.why}`),
      ...aiExplanation.assumptionsToVerify,
      ...aiExplanation.nextSteps,
      aiExplanation.disclaimer
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setAiCopied(true);
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><ArrowUpRight /></span><span><strong>เปิดไหว</strong><small>Perd Wai</small></span></a>
        <ToggleGroup aria-label="Language" onValueChange={(value) => value && changeLanguage(value as Language)} type="single" value={language}>
          <ToggleGroupItem aria-label="ไทย" value="th">ไทย</ToggleGroupItem>
          <ToggleGroupItem aria-label="EN" value="en">EN</ToggleGroupItem>
        </ToggleGroup>
      </header>

      <main id="top" className={`shell ${mode !== "choice" ? "shell-workspace" : ""}`}>
        <section className={`hero ${mode !== "choice" ? "hero-workspace" : ""}`}>
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p className="hero-body">{t.heroBody}</p>
          <p className="notice"><Info aria-hidden="true" /> <span>{t.notice}</span></p>
        </section>

        {mode === "choice" ? (
          <Card className="start-card">
            <h2>{t.chooseTitle}</h2>
            <p className="muted-copy">{t.chooseBody}</p>
            <div className="start-facts" aria-label={language === "en" ? "Plan details" : "รายละเอียดการทำแผน"}>
              <span>{t.timeEstimate}</span><span aria-hidden="true">·</span><span>{t.autoSave}</span>
            </div>
            <div className="onboarding-guide" data-testid="onboarding-guide">
              <section>
                <div><h3>{t.prepareTitle}</h3><p>{t.prepareBody}</p><ul>{t.prepareItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </section>
              <section className="guide-outcome">
                <div><h3>{t.outcomeTitle}</h3><ul>{t.outcomeItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </section>
            </div>
            <div className="start-options">
              <Button onClick={() => chooseMode("custom")} variant="start">
                <span><strong>{t.createPlan}</strong><small>{t.createPlanBody}</small></span><ArrowRight aria-hidden="true" />
              </Button>
              <Button onClick={() => chooseMode("example")} variant="startOutline">
                <span><strong>{t.exploreExample}</strong><small>{t.exploreExampleBody}</small></span><ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <section className="guided-workspace" aria-labelledby="stage-heading">
              {mode === "example" ? <Alert className="example-banner"><AlertDescription>{t.exampleBanner}</AlertDescription></Alert> : null}
              <nav className="step-nav" aria-label={language === "en" ? "Plan steps" : "ขั้นตอนวางแผน"}>
                {stages.map((stage, index) => (
                  <Button key={stage.title.en} aria-current={currentStep === index ? "step" : undefined} aria-label={stage.title[language]} disabled={index > maxStep} onClick={() => goToStep(index)} variant="step">
                    <span className="step-index">{index + 1}</span><span className="step-label">{stage.title[language]}</span>
                  </Button>
                ))}
              </nav>

              <Card className="form-card staged-card">
                <div className="section-heading">
                  <div><p className="eyebrow">0{currentStep + 1} / 05</p><h2 id="stage-heading">{stages[currentStep].title[language]}</h2></div>
                  <Button onClick={startOver} type="button" variant="quietLink">{t.startOver}</Button>
                </div>

                <aside className="stage-explainer" data-testid="stage-explainer">
                  <Info aria-hidden="true" />
                  <div>
                    <h3>{t.stepHelpTitle}</h3>
                    <p>{stageHelp[currentStep].body[language]}</p>
                    <p className="stage-tip"><strong>{t.practicalTip}:</strong> {stageHelp[currentStep].tip[language]}</p>
                  </div>
                </aside>

                {currentStep < 3 ? (
                  <fieldset>
                    <legend className="sr-only">{stages[currentStep].title[language]}</legend>
                    <div className="field-grid">
                      {stages[currentStep].keys.map((field) => <NumberField key={field} field={field} value={inputs[field]} language={language} invalid={showStepErrors && Boolean(errors[field])} onChange={updateInput} />)}
                      {currentStep === 0 && usesLoan ? <><NumberField field="loanAmount" value={inputs.loanAmount} language={language} invalid={showStepErrors && Boolean(errors.loanAmount)} onChange={updateInput} /><NumberField field="monthlyLoanRepayment" value={inputs.monthlyLoanRepayment} language={language} invalid={showStepErrors && Boolean(errors.monthlyLoanRepayment)} onChange={updateInput} /></> : null}
                      {currentStep === 2 && showsTaxReserve ? <NumberField field="taxFeesReserve" value={inputs.taxFeesReserve} language={language} invalid={showStepErrors && Boolean(errors.taxFeesReserve)} onChange={updateInput} /> : null}
                    </div>
                    {currentStep === 0 ? <Button onClick={toggleLoan} type="button" variant="optional">{usesLoan ? t.removeLoan : t.addLoan} <span className="optional-label">({t.optional})</span></Button> : null}
                    {currentStep === 2 ? <Button onClick={toggleTaxReserve} type="button" variant="optional">{showsTaxReserve ? t.removeTax : t.addTax} <span className="optional-label">({t.optional})</span></Button> : null}
                  </fieldset>
                ) : currentStep === 3 ? (
                  <div className="scenario-step">
                    <p className="muted-copy">{t.scenarioBody}</p>
                    {(["customersPerDay", "averageOrderValue", "variableCostPerOrder"] as const).map((driver) => {
                      const invalid = (showStepErrors || showResults) && Boolean(scenarioErrors[driver]);
                      const errorId = invalid ? `${driver}-scenario-error` : undefined;
                      const pessimisticBand = driver === "variableCostPerOrder" ? "high" : "low";
                      const optimisticBand = driver === "variableCostPerOrder" ? "low" : "high";
                      const isMoneyDriver = driver !== "customersPerDay";
                      return (
                        <fieldset className="scenario-group" key={driver}>
                          <legend>{fieldCopy[driver][language]}</legend>
                          <div className="scenario-fields">
                            <label>{t.pessimistic}{isMoneyDriver ? <MoneyInput aria-describedby={errorId} aria-invalid={invalid} aria-label={`${t.pessimistic} ${scenarioDriverCopy[driver][language]}`} decimal suffix={language === "en" ? "THB" : "บาท"} value={scenarioInputs[driver][pessimisticBand]} onValueChange={(value) => updateScenario(driver, pessimisticBand, value)} /> : <EditableNumberInput ariaDescribedBy={errorId} ariaInvalid={invalid} ariaLabel={`${t.pessimistic} ${scenarioDriverCopy[driver][language]}`} decimalInput value={scenarioInputs[driver][pessimisticBand]} onValueChange={(value) => updateScenario(driver, pessimisticBand, value)} />}</label>
                            <label>{t.base}<output>{decimal.format(inputs[driver])}{isMoneyDriver ? ` ${language === "en" ? "THB" : "บาท"}` : ""}</output></label>
                            <label>{t.optimistic}{isMoneyDriver ? <MoneyInput aria-describedby={errorId} aria-invalid={invalid} aria-label={`${t.optimistic} ${scenarioDriverCopy[driver][language]}`} decimal suffix={language === "en" ? "THB" : "บาท"} value={scenarioInputs[driver][optimisticBand]} onValueChange={(value) => updateScenario(driver, optimisticBand, value)} /> : <EditableNumberInput ariaDescribedBy={errorId} ariaInvalid={invalid} ariaLabel={`${t.optimistic} ${scenarioDriverCopy[driver][language]}`} decimalInput value={scenarioInputs[driver][optimisticBand]} onValueChange={(value) => updateScenario(driver, optimisticBand, value)} />}</label>
                          </div>
                          {invalid ? <FieldError className="scenario-error" id={errorId}>{t.scenarioErrorBody}</FieldError> : null}
                        </fieldset>
                      );
                    })}
                  </div>
                ) : (
                  <div className="review-step">
                    <p className="muted-copy">{t.reviewIntro}</p>
                    <div className="review-list">
                      {stages.slice(0, 3).map((stage, index) => {
                        const optionalKeys: InputKey[] = index === 0 && usesLoan
                          ? ["loanAmount", "monthlyLoanRepayment"]
                          : index === 2 && showsTaxReserve ? ["taxFeesReserve"] : [];
                        const keys = [...stage.keys, ...optionalKeys];
                        const testIds = ["review-money-before-opening", "review-sales-assumptions", "review-monthly-costs"];
                        return (
                          <section className="review-section" data-testid={testIds[index]} key={stage.title.en}>
                            <div className="review-section-heading">
                              <h3>{stage.title[language]}</h3>
                              <Button aria-label={`${t.change} ${stage.title[language]}`} onClick={() => goToStep(index)} type="button" variant="review">{t.change}</Button>
                            </div>
                            <dl>{keys.map((key) => <div key={key}><dt>{fieldCopy[key][language]}</dt><dd>{reviewValue(key, inputs[key], language)}</dd></div>)}</dl>
                          </section>
                        );
                      })}
                      <section className="review-section" data-testid="review-scenarios">
                        <div className="review-section-heading">
                          <h3>{stages[3].title[language]}</h3>
                          <Button aria-label={`${t.change} ${stages[3].title[language]}`} onClick={() => goToStep(3)} type="button" variant="review">{t.change}</Button>
                        </div>
                        <dl>{(["customersPerDay", "averageOrderValue", "variableCostPerOrder"] as const).map((driver) => <div key={driver}><dt>{fieldCopy[driver][language]}</dt><dd>{decimal.format(scenarioInputs[driver].low)} / {decimal.format(scenarioInputs[driver].expected)} / {decimal.format(scenarioInputs[driver].high)}</dd></div>)}</dl>
                      </section>
                    </div>
                  </div>
                )}

                {showStepErrors && !stepIsValid(currentStep) ? (
                  <Alert className="error-summary" data-testid="stage-error-summary" ref={errorSummaryRef} tabIndex={-1} variant="destructive">
                    <AlertTitle>{t.errorSummaryTitle}</AlertTitle>
                    <AlertDescription>
                      <p>{currentStep === 3 ? t.scenarioErrorBody : t.fixStep}</p>
                      {currentStepErrorKeys.length > 0 ? <ul>{currentStepErrorKeys.map((key) => <li key={key}><a href={`#${key}`}>{fieldCopy[key][language]}</a></li>)}</ul> : null}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="stage-actions">
                  <Button disabled={currentStep === 0} onClick={() => goToStep(currentStep - 1)} type="button" variant="actionOutline">{t.back}</Button>
                  <Button onClick={goForward} type="button" variant="action">
                    {currentStep === 4
                      ? t.calculateForecast
                      : maxStep >= 4
                        ? t.returnToReview
                        : `${language === "en" ? "Next" : "ถัดไป"}: ${stages[currentStep + 1].title[language]}`}
                  </Button>
                </div>
                {hydrated ? <p className="save-state" aria-live="polite"><Check aria-hidden="true" /> {t.saved}</p> : null}
              </Card>
            </section>

            {showResults && (!isValid || !areScenariosValid) ? <Alert className="error-summary results-error" variant="destructive"><AlertTitle>{!areScenariosValid ? t.scenarioErrorTitle : t.fixStep}</AlertTitle><AlertDescription>{!areScenariosValid ? t.scenarioErrorBody : t.fixStep}</AlertDescription></Alert> : null}

            {canShowResults ? (
              <section className="results" aria-labelledby="forecast-heading">
                <div className="section-heading result-heading">
                  <div><p className="eyebrow">06</p><h2 id="forecast-heading">{t.forecast}</h2><p className="estimate-label">{t.estimate}</p></div>
                  <div className="button-row no-print"><Button type="button" variant="actionOutline" onClick={() => downloadCsv(inputs, forecast)}>{t.exportCsv}</Button><Button type="button" variant="action" onClick={() => window.print()}>{t.printPdf}</Button></div>
                </div>

                <Alert className={`recommendation recommendation-${planningRecommendation}`} data-testid="recommendation">
                  <span className="signal-icon" aria-hidden="true">{planningRecommendation === "start-validating" ? <Check /> : <TriangleAlert />}</span>
                  <div className="decision-content">
                    <p className="eyebrow">{t.recommendation}</p>
                    <AlertTitle><h3>{recommendationTitles[planningRecommendation][language]}</h3></AlertTitle>
                    <AlertDescription><p>{recommendationBody}</p></AlertDescription>
                    <div className="decision-grid">
                      <div data-testid="decision-most-sensitive"><span>{t.verifyFirst}</span><strong>{fieldCopy[sensitivities[0].key][language]}</strong><small>{decimal.format(inputs[sensitivities[0].key])} <ArrowRight className="value-arrow" aria-hidden="true" /> {decimal.format(sensitivities[0].adverseValue)} · {currency.format(sensitivities[0].absoluteImpact)}</small></div>
                      <div data-testid="decision-next-action"><span>{t.nextAction}</span><strong>{nextAction(planningRecommendation, language)}</strong></div>
                    </div>
                  </div>
                </Alert>

                <Card className="mt-4 gap-4 border border-border bg-muted/20 p-5" data-testid="ai-explanation-card">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="eyebrow">{t.aiExplanation}</p>
                      <h3 className="text-base font-semibold">{t.explainPlan}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t.aiDisclosure}</p>
                    </div>
                    <Button className="self-start" disabled={currentAiState === "loading"} onClick={explainPlan} type="button" variant="actionOutline">
                      {currentAiState === "loading" ? t.aiLoading : t.explainPlan}
                    </Button>
                  </div>

                  {currentAiState === "loading" ? <p aria-live="polite" className="text-sm text-muted-foreground">{t.aiLoading}</p> : null}
                  {currentAiState === "error" ? (
                    <Alert className="border-destructive/30 bg-destructive/5" variant="destructive">
                      <AlertDescription className="flex flex-wrap items-center gap-3">
                        <span>{currentAiError ?? t.aiUnavailable}</span>
                        <Button onClick={explainPlan} size="sm" type="button" variant="outline">{t.aiRetry}</Button>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {currentAiExplanation ? (
                    <div className="grid gap-5 border-t border-border pt-5 text-sm">
                      <section>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.aiSummary}</p>
                        <p>{currentAiExplanation.summary}</p>
                      </section>
                      <section>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.aiDrivers}</p>
                        <ul className="grid gap-2">
                          {currentAiExplanation.keyDrivers.map((driver) => <li className="grid gap-1 rounded-md border border-border bg-background p-3" key={`${driver.key}-${driver.why}`}><strong>{explanationDriverLabel(driver.key, language)}</strong><span className="text-muted-foreground">{driver.why}</span></li>)}
                        </ul>
                      </section>
                      {currentAiExplanation.assumptionsToVerify.length > 0 ? (
                        <section>
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.aiVerify}</p>
                          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{currentAiExplanation.assumptionsToVerify.map((item) => <li key={item}>{item}</li>)}</ul>
                        </section>
                      ) : null}
                      {currentAiExplanation.nextSteps.length > 0 ? (
                        <section>
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.aiNextSteps}</p>
                          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{currentAiExplanation.nextSteps.map((item) => <li key={item}>{item}</li>)}</ul>
                        </section>
                      ) : null}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                        <p className="max-w-2xl text-xs text-muted-foreground">{currentAiExplanation.disclaimer} {t.aiHuman}</p>
                        <Button onClick={copyExplanation} size="sm" type="button" variant="ghost">{currentAiCopied ? t.aiCopied : t.aiCopy}</Button>
                      </div>
                    </div>
                  ) : null}
                </Card>

                <div className="metrics metrics-five">
                  <Metric featured label={t.startup} value={currency.format(forecast.startupCapitalRequired)} note={language === "en" ? "Deposit + equipment + renovation" : "เงินประกัน + อุปกรณ์ + ตกแต่ง"} />
                  <Metric label={t.openingCash} value={currency.format(forecast.openingCashAfterSetup)} note={language === "en" ? "Capital + loan − setup cost" : "เงินทุน + เงินกู้ − ค่าเปิดร้าน"} />
                  <Metric label={t.revenue} value={currency.format(forecast.monthlyRevenue)} note={language === "en" ? "Customers × days × order value" : "ลูกค้า × วันเปิด × ยอดต่อบิล"} />
                  <Metric label={t.expenses} value={currency.format(forecast.monthlyExpenses)} note={language === "en" ? "Fixed + variable costs" : "ต้นทุนคงที่ + ผันแปร"} />
                  <Metric label={t.grossMargin} value={`${decimal.format(forecast.grossMarginPercentage)}%`} note={language === "en" ? "Before fixed costs" : "ก่อนหักต้นทุนคงที่"} />
                </div>

                <div className="insight-grid">
                  <Card className="chart-card">
                    <div className="card-title"><div><p className="eyebrow">{t.runway}</p><h3 id="cash-chart-title">{cashRunoutText(forecast, language)}</h3></div><strong>{t.breakEven}<br /><span>{decimal.format(forecast.breakEvenCustomersPerDay)}</span></strong></div>
                    <p className="chart-takeaway" data-testid="forecast-takeaway" id="cash-chart-takeaway">{forecastTakeaway(forecast, language)}</p>
                    <figure aria-labelledby="cash-chart-title cash-chart-takeaway">
                      <div className="cash-chart" aria-hidden="true">{forecast.months.map((month) => <div className="bar-column" key={month.month}><span>{currency.format(month.endingCash)}</span><div className="bar-track"><div className={month.endingCash < 0 ? "bar negative" : "bar"} style={{ height: `${Math.max(6, Math.abs(month.endingCash) / maxCash * 100)}%` }} /></div><small>{t.month} {month.month}</small></div>)}</div>
                      <figcaption className="sr-only">{language === "en" ? "The same six-month values are available in the monthly cash detail table below." : "ดูค่าทั้งหกเดือนในตารางรายละเอียดเงินสดด้านล่าง"}</figcaption>
                    </figure>
                    <details><summary>{t.calculation}</summary><p>{language === "en" ? "Ending cash = cash after setup + each month's revenue − variable costs − fixed costs." : "เงินสดปลายเดือน = เงินสดหลังค่าเปิดร้าน + รายรับ − ต้นทุนผันแปร − ต้นทุนคงที่ของแต่ละเดือน"}</p></details>
                  </Card>

                  <Card className="scenario-results">
                    <p className="eyebrow">{t.scenarioComparison}</p>
                    {(["pessimistic", "base", "optimistic"] as const).map((scenario) => <div className="scenario-result" data-testid={`scenario-${scenario}`} key={scenario}><span>{scenario === "pessimistic" ? t.pessimistic : scenario === "base" ? t.base : t.optimistic}</span><strong>{cashRunoutText(scenarios[scenario], language)}</strong><small>{t.month} 6: {currency.format(scenarios[scenario].months[5].endingCash)}</small></div>)}
                  </Card>
                </div>

                <div className="insight-grid lower-grid">
                  <Card className="sensitivity-card">
                    <p className="eyebrow">{t.sensitivity}</p><h3>{language === "en" ? "What changes Month 6 cash most?" : "อะไรเปลี่ยนเงินสดเดือน 6 มากที่สุด?"}</h3><p className="muted-copy">{t.sensitivityBody}</p>
                    <ol>{sensitivities.map((item) => <li key={item.key}><span><b>{fieldCopy[item.key][language]}</b><small>{decimal.format(inputs[item.key])} <ArrowRight className="value-arrow" aria-hidden="true" /> {decimal.format(item.adverseValue)}</small></span><strong>{currency.format(item.absoluteImpact)}</strong></li>)}</ol>
                  </Card>
                  <Card className="limitations-card"><p className="eyebrow">{t.limitations}</p><h3>{language === "en" ? "What this estimate leaves out" : "สิ่งที่ประมาณการนี้ยังไม่รวม"}</h3><p>{t.limitationBody}</p></Card>
                </div>

                <Card className="table-card">
                  <h3>{t.monthlyDetail}</h3><p className="table-hint">{t.tableHint}</p>
                  <Table><TableHeader><TableRow><TableHead>{t.month}</TableHead><TableHead>{t.revenue}</TableHead><TableHead>{t.expenses}</TableHead><TableHead>{t.cashMovement}</TableHead><TableHead>{t.endingCash}</TableHead></TableRow></TableHeader><TableBody>{forecast.months.map((month) => <TableRow key={month.month}><TableHead>{month.month}</TableHead><TableCell>{currency.format(month.revenue)}</TableCell><TableCell>{currency.format(month.expenses)}</TableCell><TableCell>{currency.format(month.cashMovement)}</TableCell><TableCell data-testid={`ending-cash-month-${month.month}`}>{currency.format(month.endingCash)}</TableCell></TableRow>)}</TableBody></Table>
                </Card>
              </section>
            ) : null}
          </>
        )}
      </main>
      <footer><span>เปิดไหว / Perd Wai</span><span>{language === "en" ? "Transparent numbers. Better decisions." : "เห็นตัวเลขชัด ตัดสินใจได้ดีขึ้น"}</span></footer>
    </>
  );
}
