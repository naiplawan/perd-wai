import type { PlanExplanation } from "../lib/ai-explanation";
import type {
  FinancialInputs,
  Forecast,
  InputKey,
  Recommendation,
  ScenarioForecasts,
  ScenarioInputs
} from "../lib/finance";

export type Language = "en" | "th";
export type ScenarioName = "pessimistic" | "base" | "optimistic";
export type ScenarioDriver = keyof ScenarioInputs;

export const scenarioOrder: ScenarioName[] = ["pessimistic", "base", "optimistic"];
export const scenarioDrivers: ScenarioDriver[] = ["customersPerDay", "averageOrderValue", "variableCostPerOrder"];

export const EXAMPLE_SCENARIOS: ScenarioInputs = {
  customersPerDay: { low: 41, expected: 55, high: 69 },
  averageOrderValue: { low: 67.5, expected: 75, high: 82.5 },
  variableCostPerOrder: { low: 21.6, expected: 24, high: 26.4 }
};

/** Automatic slow/good cases, the same spread as the example café: ±25% demand, ±10% price and cost. */
export function suggestedScenarios(inputs: FinancialInputs): ScenarioInputs {
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    customersPerDay: { low: round(inputs.customersPerDay * 0.75), expected: inputs.customersPerDay, high: round(inputs.customersPerDay * 1.25) },
    averageOrderValue: { low: round(inputs.averageOrderValue * 0.9), expected: inputs.averageOrderValue, high: round(inputs.averageOrderValue * 1.1) },
    variableCostPerOrder: { low: round(inputs.variableCostPerOrder * 0.9), expected: inputs.variableCostPerOrder, high: round(inputs.variableCostPerOrder * 1.1) }
  };
}

export type SectionId = "money" | "sales" | "costs";

export const sections: { id: SectionId; title: Record<Language, string>; question: Record<Language, string>; keys: InputKey[] }[] = [
  {
    id: "money",
    title: { en: "Opening the shop", th: "ก่อนเปิดร้าน" },
    question: { en: "How much does it cost to open?", th: "เปิดร้านต้องใช้เงินเท่าไร?" },
    keys: ["initialCapital", "rent", "depositMonths", "equipmentRenovation"]
  },
  {
    id: "sales",
    title: { en: "Selling", th: "ยอดขาย" },
    question: { en: "How much will you sell?", th: "จะขายได้เท่าไร?" },
    keys: ["customersPerDay", "averageOrderValue", "variableCostPerOrder", "openDaysPerMonth"]
  },
  {
    id: "costs",
    title: { en: "Monthly bills", th: "ค่าใช้จ่ายรายเดือน" },
    question: { en: "What must you pay every month?", th: "ทุกเดือนต้องจ่ายอะไรบ้าง?" },
    keys: ["staffWages", "ownerWithdrawal", "utilities", "marketing"]
  }
];

type FieldCopy = {
  en: string;
  th: string;
  unit: Record<Language, string>;
  hint?: Record<Language, string>;
  max: number;
  step: number;
  decimal?: boolean;
};

export const fieldCopy: Record<InputKey, FieldCopy> = {
  initialCapital: {
    en: "Money you can invest",
    th: "เงินที่พร้อมลงทุน",
    unit: { en: "THB", th: "บาท" },
    max: 2_000_000,
    step: 10_000,
    hint: { en: "Only money you can afford to put into the café. Keep emergency savings separate.", th: "ใส่เฉพาะเงินที่พร้อมใช้กับร้าน แยกเงินฉุกเฉินไว้ต่างหาก" }
  },
  rent: { en: "Rent per month", th: "ค่าเช่าต่อเดือน", unit: { en: "THB", th: "บาท" }, max: 100_000, step: 500 },
  depositMonths: {
    en: "Rent deposit",
    th: "เงินมัดจำค่าเช่า",
    unit: { en: "months of rent", th: "เดือน" },
    max: 6,
    step: 1,
    hint: { en: "How many months of rent you pay the landlord up front.", th: "ต้องจ่ายค่าเช่าล่วงหน้าให้เจ้าของที่กี่เดือน" }
  },
  equipmentRenovation: {
    en: "Machines, furniture and decoration",
    th: "เครื่องชง อุปกรณ์ และตกแต่งร้าน",
    unit: { en: "THB", th: "บาท" },
    max: 1_500_000,
    step: 10_000,
    hint: { en: "Everything you buy once before opening.", th: "ของทุกอย่างที่ต้องซื้อครั้งเดียวก่อนเปิดร้าน" }
  },
  averageOrderValue: {
    en: "Average spend per customer",
    th: "ลูกค้าจ่ายเฉลี่ยต่อคน",
    unit: { en: "THB", th: "บาท" },
    max: 300,
    step: 1,
    decimal: true,
    hint: { en: "What one customer pays on a typical visit.", th: "ลูกค้าหนึ่งคนจ่ายเท่าไรต่อการซื้อหนึ่งครั้ง" }
  },
  variableCostPerOrder: {
    en: "Ingredients and cup per customer",
    th: "ค่าวัตถุดิบและแก้วต่อลูกค้า",
    unit: { en: "THB", th: "บาท" },
    max: 150,
    step: 1,
    decimal: true,
    hint: { en: "Coffee, milk, cup, lid, bag, and delivery-app fees for one order.", th: "กาแฟ นม แก้ว ฝา ถุง และค่าธรรมเนียมแอปส่งอาหารต่อหนึ่งออเดอร์" }
  },
  customersPerDay: {
    en: "Customers per day",
    th: "ลูกค้าต่อวัน",
    unit: { en: "people", th: "คน" },
    max: 300,
    step: 1,
    decimal: true,
    hint: { en: "Be honest. If you can, count people walking past the location for a few days.", th: "ประเมินตามจริง ถ้าทำได้ลองไปนับคนที่เดินผ่านทำเลจริงสักสองสามวัน" }
  },
  openDaysPerMonth: { en: "Days open per month", th: "วันที่เปิดร้านต่อเดือน", unit: { en: "days", th: "วัน" }, max: 31, step: 1 },
  staffWages: {
    en: "Staff wages per month",
    th: "ค่าจ้างพนักงานต่อเดือน",
    unit: { en: "THB", th: "บาท" },
    max: 150_000,
    step: 1000,
    hint: { en: "Total for all staff. Enter 0 if you work alone.", th: "รวมพนักงานทุกคน ใส่ 0 ถ้าทำคนเดียว" }
  },
  utilities: { en: "Water and electricity per month", th: "ค่าน้ำค่าไฟต่อเดือน", unit: { en: "THB", th: "บาท" }, max: 50_000, step: 500 },
  marketing: { en: "Advertising per month", th: "ค่าโฆษณาต่อเดือน", unit: { en: "THB", th: "บาท" }, max: 50_000, step: 500 },
  ownerWithdrawal: {
    en: "Your own pay per month",
    th: "เงินเดือนของคุณเอง",
    unit: { en: "THB", th: "บาท" },
    max: 100_000,
    step: 1000,
    hint: { en: "What you need to take home to live.", th: "เงินที่คุณต้องใช้จ่ายส่วนตัวในแต่ละเดือน" }
  },
  taxFeesReserve: {
    en: "Money set aside for tax and fees",
    th: "เงินกันไว้จ่ายภาษีและค่าธรรมเนียม",
    unit: { en: "THB", th: "บาท" },
    max: 50_000,
    step: 500,
    hint: { en: "A simple monthly amount. This tool does not calculate tax or VAT.", th: "ใส่เป็นยอดต่อเดือนแบบง่าย ระบบไม่ได้คำนวณภาษีหรือ VAT ให้" }
  },
  loanAmount: { en: "Loan amount", th: "ยอดเงินกู้", unit: { en: "THB", th: "บาท" }, max: 2_000_000, step: 10_000 },
  monthlyLoanRepayment: {
    en: "Loan payment per month",
    th: "ค่างวดเงินกู้ต่อเดือน",
    unit: { en: "THB", th: "บาท" },
    max: 100_000,
    step: 500,
    hint: { en: "The full amount you pay each month, including interest.", th: "ยอดที่จ่ายจริงต่อเดือน รวมดอกเบี้ยแล้ว" }
  }
};

export const scenarioDriverCopy: Record<ScenarioDriver, Record<Language, string>> = {
  customersPerDay: { en: "customers per day", th: "ลูกค้าต่อวัน" },
  averageOrderValue: { en: "spend per customer", th: "ยอดจ่ายต่อคน" },
  variableCostPerOrder: { en: "ingredient cost", th: "ค่าวัตถุดิบ" }
};

export const copy = {
  en: {
    heroEyebrow: "Before you open",
    heroTitle: "Can your café survive the first six months?",
    heroBody: "Change a few numbers and instantly see whether your money will last.",
    notice: "This is a planning estimate, not financial or tax advice. Check your numbers with real customers, suppliers, and an adviser.",
    previewCaption: "Example café · money over six months",
    chooseTitle: "How would you like to begin?",
    timeEstimate: "About 5 minutes",
    autoSave: "Saved on this device automatically",
    prepareTitle: "Good to have nearby",
    prepareBody: "Rough guesses are fine. You can change anything later.",
    prepareItems: ["How much money you have to start", "Your rent and shop setup costs", "Your prices and monthly bills"],
    outcomeTitle: "You will see",
    outcomeItems: ["How much money is left after opening", "How many customers a day you need", "Which number to double-check first"],
    createPlan: "Start with my café",
    createPlanBody: "We fill in example numbers. You just change what's different.",
    exploreExample: "Look at an example café",
    exploreExampleBody: "See how it works before using your own numbers.",
    intakeTitle: "Or just describe your café idea",
    intakeBody: "Write in your own words. AI picks out the numbers you mention for you to check.",
    intakePlaceholder: "Example: I have 300,000 baht, rent may be 18,000 a month, and I expect about 40 customers a day…",
    intakeButton: "Fill in my numbers",
    intakeLoading: "Reading…",
    intakeError: "The AI couldn't help right now. You can still type the numbers yourself.",
    intakeDraftTitle: "Here's what we found",
    intakeSuggested: "Numbers we picked out",
    intakeMissing: "We'll use example numbers for the rest",
    intakeVerify: "Worth double-checking",
    intakeApply: "Use these numbers",
    intakeDisclosure: "Nothing changes until you press “Use these numbers”.",
    exampleBanner: "This is an example café. Use “Start over” to plan your own.",
    saved: "Saved on this device",
    startOver: "Start over",
    optional: "Optional",
    addLoan: "I'm taking a loan",
    removeLoan: "Remove loan",
    addTax: "Set money aside for tax",
    removeTax: "Remove tax money",
    yourPlan: "Your numbers",
    adjustHint: "Slide or type. Your answer updates as you go.",
    slider: "slider",
    exampleTag: "Example",
    keepValue: "Keep",
    keepValueLabel: (field: string) => `Keep the example value for ${field}`,
    setupSubtotal: "Opening cost",
    revenueSubtotal: "Sales per month",
    costsSubtotal: "Bills per month",
    rangesTitle: "Advanced: change the slow and good sales cases",
    scenarioBody: "We automatically test 25% fewer or more customers, and 10% lower or higher prices and costs. Change these only if you have better information.",
    scenarioErrorBody: "Slow sales must be lower than planned, and good sales higher.",
    automaticRanges: "Go back to automatic",
    pessimistic: "Slow sales",
    base: "As planned",
    optimistic: "Good sales",
    answerQuestion: "Can your café survive 6 months?",
    examplesLeft: (count: number) => `${count} of your numbers are still examples. Replace them to get your real answer.`,
    dashboardTitle: "Your answer",
    estimate: "Based on your numbers",
    emptyTitle: "Some numbers need fixing",
    emptyBody: "Check these:",
    openingCash: "Money left after opening",
    openingCashNote: "Your money − opening cost",
    monthlyCash: "Profit or loss each month",
    monthlyCashNote: "Sales − all monthly bills",
    breakEven: "Customers you need per day",
    runway: "Your money lasts",
    noRunout: "More than 6 months",
    beforeOpening: "Not enough to open",
    runsOut: (month: number) => `Runs out in month ${month}`,
    month: "Month",
    open: "Opening",
    cashChartTitle: "Your money over 6 months",
    howToRead: "How to read this: the line is your money each month. The shaded area shows slow to good sales. Below the red dashed line means you have run out of money.",
    zeroLine: "Out of money",
    legendHint: "Choose a case to see it on the chart",
    breakEvenTitle: "Customers you need each day",
    youExpect: "You expect",
    breakEvenMarker: "Needed",
    aboveBreakEven: (gap: string) => `You expect ${gap} more ${gap === "1" ? "customer" : "customers"} a day than you need`,
    belowBreakEven: (gap: string) => `You need ${gap} more ${gap === "1" ? "customer" : "customers"} a day to stop losing money`,
    moneyFlowTitle: "Where each month's money goes",
    revenue: "Sales",
    variableCosts: "Ingredients and cups",
    leftOver: "Left over each month",
    shortfall: "Short each month",
    verifyFirst: "Double-check this number first",
    nextAction: "What to do next",
    sensitivity: "What matters most",
    sensitivityTitle: "Which numbers change the answer most?",
    sensitivityBody: "If one of these is 10% worse than you think, you'd have this much less money by month 6.",
    calculation: "How we calculate:",
    calculationBody: "Money at the end of each month = money left after opening + sales − ingredient costs − monthly bills.",
    showNumbers: "See the month-by-month numbers",
    endingCash: "Money at month end",
    cashMovement: "Profit / loss",
    expenses: "Costs",
    exportCsv: "Download spreadsheet",
    printPdf: "Print or save PDF",
    limitations: "What this does not include",
    limitationBody: "It assumes sales are the same every month. It does not include busy or quiet seasons, VAT, tax, loan interest, or whether a bank will lend to you.",
    seeAnswer: "See answer",
    explainPlan: "Explain my plan in simple words",
    aiExplanation: "AI helper",
    aiDisclosure: "Perd Wai calculates the numbers. AI only explains them.",
    aiLoading: "Writing an explanation…",
    aiSummary: "In short",
    aiDrivers: "What affects the result",
    aiVerify: "What to check",
    aiNextSteps: "Questions to think about",
    aiUnavailable: "The AI helper isn't available right now. Your numbers above are still complete.",
    aiRetry: "Try again",
    aiCopy: "Copy",
    aiCopied: "Copied",
    aiHuman: "For tax, legal, or investment questions, talk to a qualified adviser.",
    footer: "Clear numbers. Better decisions."
  },
  th: {
    heroEyebrow: "ก่อนเปิดร้าน",
    heroTitle: "ร้านกาแฟของคุณจะอยู่รอดหกเดือนแรกได้ไหม?",
    heroBody: "เปลี่ยนตัวเลขไม่กี่ค่า แล้วดูทันทีว่าเงินของคุณจะพอหรือไม่",
    notice: "เป็นเพียงประมาณการเพื่อวางแผน ไม่ใช่คำแนะนำทางการเงินหรือภาษี ควรตรวจสอบตัวเลขกับลูกค้าจริง ซัพพลายเออร์ และผู้เชี่ยวชาญ",
    previewCaption: "ร้านตัวอย่าง · เงินตลอดหกเดือน",
    chooseTitle: "อยากเริ่มแบบไหน?",
    timeEstimate: "ใช้เวลาประมาณ 5 นาที",
    autoSave: "บันทึกในเครื่องนี้ให้อัตโนมัติ",
    prepareTitle: "มีข้อมูลเหล่านี้ไว้จะง่ายขึ้น",
    prepareBody: "ใช้ตัวเลขคร่าว ๆ ได้ และแก้ภายหลังได้ทุกเมื่อ",
    prepareItems: ["มีเงินเริ่มต้นเท่าไร", "ค่าเช่าและค่าเปิดร้าน", "ราคาขายและค่าใช้จ่ายรายเดือน"],
    outcomeTitle: "คุณจะได้เห็น",
    outcomeItems: ["เงินเหลือเท่าไรหลังเปิดร้าน", "ต้องมีลูกค้าวันละกี่คน", "ตัวเลขไหนควรตรวจให้ชัวร์ก่อน"],
    createPlan: "เริ่มวางแผนร้านของฉัน",
    createPlanBody: "เราใส่ตัวเลขตัวอย่างให้ก่อน คุณแค่แก้ส่วนที่ต่างไป",
    exploreExample: "ดูร้านตัวอย่าง",
    exploreExampleBody: "ดูวิธีใช้งานก่อนใส่ตัวเลขของคุณ",
    intakeTitle: "หรือเล่าไอเดียร้านของคุณ",
    intakeBody: "เขียนด้วยคำพูดของคุณเอง AI จะดึงตัวเลขที่คุณพูดถึงมาให้ตรวจสอบ",
    intakePlaceholder: "เช่น มีเงินทุน 300,000 บาท ค่าเช่าน่าจะ 18,000 บาทต่อเดือน และคาดว่ามีลูกค้า 40 คนต่อวัน…",
    intakeButton: "ช่วยกรอกตัวเลขให้",
    intakeLoading: "กำลังอ่าน…",
    intakeError: "ตอนนี้ AI ยังช่วยไม่ได้ คุณยังพิมพ์ตัวเลขเองได้",
    intakeDraftTitle: "นี่คือสิ่งที่เราเจอ",
    intakeSuggested: "ตัวเลขที่ดึงมาได้",
    intakeMissing: "ส่วนที่เหลือเราจะใช้ตัวเลขตัวอย่างไปก่อน",
    intakeVerify: "ควรตรวจสอบเพิ่ม",
    intakeApply: "ใช้ตัวเลขชุดนี้",
    intakeDisclosure: "จะยังไม่มีอะไรเปลี่ยนจนกว่าคุณจะกด “ใช้ตัวเลขชุดนี้”",
    exampleBanner: "นี่คือร้านตัวอย่าง กด “เริ่มใหม่” เพื่อวางแผนร้านของคุณเอง",
    saved: "บันทึกในเครื่องนี้แล้ว",
    startOver: "เริ่มใหม่",
    optional: "ไม่บังคับ",
    addLoan: "มีเงินกู้",
    removeLoan: "นำเงินกู้ออก",
    addTax: "กันเงินไว้จ่ายภาษี",
    removeTax: "นำเงินภาษีออก",
    yourPlan: "ตัวเลขของคุณ",
    adjustHint: "เลื่อนหรือพิมพ์ได้เลย คำตอบจะเปลี่ยนตามทันที",
    slider: "ตัวเลื่อน",
    exampleTag: "ค่าตัวอย่าง",
    keepValue: "ใช้ค่านี้",
    keepValueLabel: (field: string) => `ใช้ค่าตัวอย่างสำหรับ${field}`,
    setupSubtotal: "ค่าเปิดร้าน",
    revenueSubtotal: "ยอดขายต่อเดือน",
    costsSubtotal: "ค่าใช้จ่ายต่อเดือน",
    rangesTitle: "ขั้นสูง: ปรับกรณีขายไม่ดีและขายดี",
    scenarioBody: "ระบบทดสอบให้อัตโนมัติ: ลูกค้าน้อยลงหรือมากขึ้น 25% และราคากับต้นทุนต่ำลงหรือสูงขึ้น 10% เปลี่ยนเฉพาะเมื่อคุณมีข้อมูลที่ดีกว่า",
    scenarioErrorBody: "กรณีขายไม่ดีต้องน้อยกว่าตามแผน และกรณีขายดีต้องมากกว่า",
    automaticRanges: "กลับไปใช้แบบอัตโนมัติ",
    pessimistic: "ขายไม่ดี",
    base: "ตามแผน",
    optimistic: "ขายดี",
    answerQuestion: "ร้านของคุณอยู่รอด 6 เดือนไหม?",
    examplesLeft: (count: number) => `ยังมีตัวเลขตัวอย่างอยู่ ${count} ช่อง เปลี่ยนเป็นตัวเลขจริงเพื่อดูคำตอบของคุณ`,
    dashboardTitle: "คำตอบของคุณ",
    estimate: "คำนวณจากตัวเลขของคุณ",
    emptyTitle: "มีตัวเลขที่ต้องแก้",
    emptyBody: "ตรวจช่องเหล่านี้:",
    openingCash: "เงินเหลือหลังเปิดร้าน",
    openingCashNote: "เงินของคุณ − ค่าเปิดร้าน",
    monthlyCash: "กำไรหรือขาดทุนต่อเดือน",
    monthlyCashNote: "ยอดขาย − ค่าใช้จ่ายทั้งหมดต่อเดือน",
    breakEven: "ลูกค้าที่ต้องมีต่อวัน",
    runway: "เงินของคุณพอใช้",
    noRunout: "เกิน 6 เดือน",
    beforeOpening: "ไม่พอเปิดร้าน",
    runsOut: (month: number) => `หมดในเดือนที่ ${month}`,
    month: "เดือน",
    open: "เปิดร้าน",
    cashChartTitle: "เงินของคุณใน 6 เดือน",
    howToRead: "วิธีอ่านกราฟ: เส้นคือเงินคงเหลือแต่ละเดือน พื้นที่แรเงาคือช่วงตั้งแต่ขายไม่ดีถึงขายดี ถ้าต่ำกว่าเส้นประสีแดงแปลว่าเงินหมด",
    zeroLine: "เงินหมด",
    legendHint: "เลือกกรณีเพื่อดูบนกราฟ",
    breakEvenTitle: "ลูกค้าที่ต้องมีในแต่ละวัน",
    youExpect: "คุณคาด",
    breakEvenMarker: "ต้องมี",
    aboveBreakEven: (gap: string) => `คุณคาดลูกค้ามากกว่าที่ต้องมี ${gap} คนต่อวัน`,
    belowBreakEven: (gap: string) => `ต้องมีลูกค้าเพิ่มอีก ${gap} คนต่อวันจึงจะไม่ขาดทุน`,
    moneyFlowTitle: "เงินแต่ละเดือนไปไหน",
    revenue: "ยอดขาย",
    variableCosts: "วัตถุดิบและแก้ว",
    leftOver: "เหลือต่อเดือน",
    shortfall: "ขาดต่อเดือน",
    verifyFirst: "ตรวจตัวเลขนี้ให้ชัวร์ก่อน",
    nextAction: "ควรทำอะไรต่อ",
    sensitivity: "อะไรสำคัญที่สุด",
    sensitivityTitle: "ตัวเลขไหนเปลี่ยนคำตอบมากที่สุด?",
    sensitivityBody: "ถ้าตัวเลขเหล่านี้แย่กว่าที่คิด 10% เงินในเดือนที่ 6 จะหายไปเท่านี้",
    calculation: "วิธีคำนวณ:",
    calculationBody: "เงินปลายเดือน = เงินเหลือหลังเปิดร้าน + ยอดขาย − ค่าวัตถุดิบ − ค่าใช้จ่ายรายเดือน",
    showNumbers: "ดูตัวเลขรายเดือน",
    endingCash: "เงินปลายเดือน",
    cashMovement: "กำไร / ขาดทุน",
    expenses: "ค่าใช้จ่าย",
    exportCsv: "ดาวน์โหลดตาราง",
    printPdf: "พิมพ์หรือบันทึก PDF",
    limitations: "สิ่งที่ยังไม่ได้รวม",
    limitationBody: "สมมติว่ายอดขายเท่ากันทุกเดือน ยังไม่รวมช่วงขายดีหรือขายเงียบตามฤดูกาล VAT ภาษี ดอกเบี้ยเงินกู้ หรือการอนุมัติสินเชื่อ",
    seeAnswer: "ดูคำตอบ",
    explainPlan: "อธิบายแผนของฉันแบบเข้าใจง่าย",
    aiExplanation: "ผู้ช่วย AI",
    aiDisclosure: "เปิดไหวเป็นผู้คำนวณตัวเลข AI แค่ช่วยอธิบาย",
    aiLoading: "กำลังเขียนคำอธิบาย…",
    aiSummary: "สรุปสั้น ๆ",
    aiDrivers: "อะไรมีผลต่อคำตอบ",
    aiVerify: "สิ่งที่ควรตรวจสอบ",
    aiNextSteps: "คำถามที่ควรคิดต่อ",
    aiUnavailable: "ตอนนี้ผู้ช่วย AI ใช้งานไม่ได้ ตัวเลขด้านบนยังครบถ้วน",
    aiRetry: "ลองอีกครั้ง",
    aiCopy: "คัดลอก",
    aiCopied: "คัดลอกแล้ว",
    aiHuman: "หากมีคำถามด้านภาษี กฎหมาย หรือการลงทุน ควรปรึกษาผู้เชี่ยวชาญ",
    footer: "เห็นตัวเลขชัด ตัดสินใจได้ดีขึ้น"
  }
};

export type Copy = (typeof copy)[Language];

export const scenarioLabel = (scenario: ScenarioName, t: Copy) =>
  scenario === "pessimistic" ? t.pessimistic : scenario === "base" ? t.base : t.optimistic;

export const recommendationTitles: Record<Recommendation, Record<Language, string>> = {
  "start-validating": { en: "Looks workable — test it before you invest", th: "มีแนวโน้มไปได้ — ลองทดสอบก่อนลงเงินจริง" },
  "revise-plan": { en: "Risky — adjust the plan first", th: "ยังเสี่ยง — ควรปรับแผนก่อน" },
  "delay-opening": { en: "Not yet — the money runs out", th: "ยังไม่ควรเปิด — เงินไม่พอ" }
};

export const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
export const decimal = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
export const compactBaht = (value: number) => `${value < 0 ? "−" : ""}฿${compact.format(Math.abs(value))}`;
/** Customers are whole people: always round the requirement up. */
export const customersNeeded = (forecast: Forecast) => Math.ceil(forecast.breakEvenCustomersPerDay);

export function localizedInputError(field: InputKey, language: Language) {
  if (language === "th") {
    if (field === "averageOrderValue") return "ยอดจ่ายต่อคนต้องมากกว่า 0";
    if (field === "variableCostPerOrder") return "ค่าวัตถุดิบต้องน้อยกว่ายอดที่ลูกค้าจ่าย";
    if (field === "customersPerDay") return "จำนวนลูกค้าต้องมากกว่า 0";
    if (field === "openDaysPerMonth") return "ใส่จำนวนวันระหว่าง 1 ถึง 31";
    return "ใส่ตัวเลขตั้งแต่ 0 ขึ้นไป";
  }
  if (field === "averageOrderValue") return "Spend per customer must be more than 0.";
  if (field === "variableCostPerOrder") return "Ingredient cost must be less than what the customer pays.";
  if (field === "customersPerDay") return "Customers per day must be more than 0.";
  if (field === "openDaysPerMonth") return "Enter a number of days from 1 to 31.";
  return "Enter a number of 0 or more.";
}

export function reviewValue(field: InputKey, value: number, language: Language) {
  const item = fieldCopy[field];
  if (item.unit.en === "THB") return currency.format(value);
  return `${decimal.format(value)} ${item.unit[language]}`;
}

export function cashRunoutText(forecast: Forecast, t: Copy) {
  if (forecast.cashNegativeMonth === null) return t.noRunout;
  if (forecast.cashNegativeMonth === 0) return t.beforeOpening;
  return t.runsOut(forecast.cashNegativeMonth);
}

export function forecastTakeaway(forecast: Forecast, language: Language) {
  if (forecast.cashNegativeMonth === 0) return language === "en"
    ? "Opening the shop costs more than the money you have."
    : "ค่าเปิดร้านสูงกว่าเงินที่คุณมี";
  if (forecast.cashNegativeMonth !== null) return language === "en"
    ? `With these numbers, you run out of money in month ${forecast.cashNegativeMonth}.`
    : `ด้วยตัวเลขนี้ เงินจะหมดในเดือนที่ ${forecast.cashNegativeMonth}`;
  return language === "en"
    ? `Your money lasts all six months, with ${currency.format(forecast.months[5].endingCash)} left at the end.`
    : `เงินพอใช้ครบหกเดือน และเหลือ ${currency.format(forecast.months[5].endingCash)} เมื่อจบเดือนที่ 6`;
}

/** The headline answer in one or two everyday sentences, built only from calculated numbers. */
export function plainSummary(inputs: FinancialInputs, forecast: Forecast, language: Language) {
  const opening = currency.format(Math.abs(forecast.openingCashAfterSetup));
  const monthly = currency.format(Math.abs(forecast.monthlyCashMovement));
  const needed = customersNeeded(forecast);
  const expected = decimal.format(inputs.customersPerDay);
  if (language === "en") {
    const start = forecast.openingCashAfterSetup < 0
      ? `Opening the shop costs ${opening} more than you have.`
      : `After opening the shop you have ${opening} left.`;
    const month = forecast.monthlyCashMovement >= 0
      ? `Each month you make about ${monthly} after all bills.`
      : `Each month you lose about ${monthly}.`;
    return `${start} ${month} You need ${needed} customers a day to cover your bills — you expect ${expected}.`;
  }
  const start = forecast.openingCashAfterSetup < 0
    ? `ค่าเปิดร้านเกินเงินที่มีอยู่ ${opening}`
    : `หลังเปิดร้านคุณจะเหลือเงิน ${opening}`;
  const month = forecast.monthlyCashMovement >= 0
    ? `แต่ละเดือนมีกำไรหลังหักค่าใช้จ่ายประมาณ ${monthly}`
    : `แต่ละเดือนขาดทุนประมาณ ${monthly}`;
  return `${start} ${month} ต้องมีลูกค้าวันละ ${needed} คนจึงจะพอจ่ายค่าใช้จ่าย — คุณคาดไว้ ${expected} คน`;
}

export function recommendationEvidence(scenarios: ScenarioForecasts, recommendation: Recommendation, language: Language) {
  const base = scenarios.base;
  const slow = scenarios.pessimistic;
  if (recommendation === "delay-opening") {
    if (base.cashNegativeMonth === 0) return language === "en"
      ? "You don't have enough money to open the shop with these costs."
      : "ด้วยค่าใช้จ่ายนี้ เงินที่มียังไม่พอเปิดร้าน";
    return language === "en"
      ? `Even if sales go as planned, you run out of money in month ${base.cashNegativeMonth}.`
      : `แม้ขายได้ตามแผน เงินก็จะหมดในเดือนที่ ${base.cashNegativeMonth}`;
  }
  if (recommendation === "revise-plan") {
    const reasons: string[] = [];
    if (base.recommendation === "revise-plan") reasons.push(language === "en"
      ? "As planned, sales don't quite cover your monthly bills."
      : "ถ้าขายได้ตามแผน ยอดขายยังไม่พอจ่ายค่าใช้จ่ายรายเดือน");
    if (slow.cashNegativeMonth !== null) reasons.push(slow.cashNegativeMonth === 0
      ? language === "en" ? "If sales are slow, you can't afford to open." : "ถ้าขายไม่ดี เงินจะไม่พอเปิดร้าน"
      : language === "en" ? `If sales are slow, you run out of money in month ${slow.cashNegativeMonth}.` : `ถ้าขายไม่ดี เงินจะหมดในเดือนที่ ${slow.cashNegativeMonth}`);
    return reasons.join(" ");
  }
  return language === "en"
    ? "As planned you cover your bills, and even with slow sales your money lasts six months."
    : "ถ้าขายได้ตามแผนจะพอจ่ายค่าใช้จ่าย และแม้ขายไม่ดีเงินก็ยังพอใช้ครบหกเดือน";
}

export function nextAction(recommendation: Recommendation, language: Language) {
  if (recommendation === "delay-opening") return language === "en"
    ? "Lower one opening cost, or find more money, before you sign a lease."
    : "ลดค่าเปิดร้านสักรายการ หรือหาเงินเพิ่ม ก่อนเซ็นสัญญาเช่า";
  if (recommendation === "revise-plan") return language === "en"
    ? "Go to the location for three similar days and count possible customers, then update your numbers."
    : "ไปนับลูกค้าที่ทำเลจริง 3 วันที่ใกล้เคียงกัน แล้วกลับมาแก้ตัวเลข";
  return language === "en"
    ? "Talk to five possible customers and get prices from three suppliers before you spend money."
    : "คุยกับลูกค้าเป้าหมาย 5 คน และขอราคาจากซัพพลายเออร์ 3 ราย ก่อนลงเงิน";
}

export function explanationDriverLabel(key: PlanExplanation["keyDrivers"][number]["key"], language: Language) {
  if (key === "startup-costs") return language === "en" ? "Opening cost" : "ค่าเปิดร้าน";
  if (key === "cash-runway") return language === "en" ? "How long the money lasts" : "เงินพอใช้นานแค่ไหน";
  if (key === "break-even") return language === "en" ? "Customers needed" : "ลูกค้าที่ต้องมี";
  if (key === "scenario-range") return language === "en" ? "Slow vs good sales" : "ขายไม่ดีกับขายดี";
  return fieldCopy[key][language];
}

export function downloadCsv(inputs: FinancialInputs, forecast: Forecast) {
  const rows = [["Perd Wai plan", "Value"], ...Object.entries(inputs), [], ["Month", "Revenue", "Expenses", "Cash movement", "Ending cash"], ...forecast.months.map((month) => [month.month, month.revenue, month.expenses, month.cashMovement, month.endingCash])];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "perd-wai-plan.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
