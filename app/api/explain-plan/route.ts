import { NextResponse } from "next/server";
import {
  DEFAULT_INPUTS,
  calculateForecast,
  calculatePlanningRecommendation,
  calculateScenarios,
  validateInputs,
  validateScenarioInputs,
  type FinancialInputs,
  type InputKey,
  type ScenarioInputs
} from "@/app/lib/finance";
import { explanationDisclaimer, isPlanExplanation, type ExplanationRequest } from "@/app/lib/ai-explanation";

const inputKeys = Object.keys(DEFAULT_INPUTS) as InputKey[];
const languageValues = new Set(["en", "th"]);
const model = process.env.OPENROUTER_MODEL ?? "openrouter/free";
const requestWindowMs = 60_000;
const requestLimit = 5;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "A concise explanation without numeric values." },
    keyDrivers: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: {
            type: "string",
            enum: [
              ...inputKeys,
              "startup-costs",
              "cash-runway",
              "break-even",
              "scenario-range"
            ]
          },
          why: { type: "string", description: "Why this driver matters, without numeric values." }
        },
        required: ["key", "why"]
      }
    },
    assumptionsToVerify: {
      type: "array",
      maxItems: 5,
      items: { type: "string" }
    },
    nextSteps: {
      type: "array",
      maxItems: 4,
      items: { type: "string" }
    }
  },
  required: ["summary", "keyDrivers", "assumptionsToVerify", "nextSteps"]
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeInputs(value: unknown): FinancialInputs | null {
  if (!isRecord(value)) return null;
  const inputs = Object.fromEntries(inputKeys.map((key) => [key, value[key]])) as FinancialInputs;
  if (!inputKeys.every((key) => typeof inputs[key] === "number" && Number.isFinite(inputs[key]))) return null;
  return Object.keys(validateInputs(inputs)).length === 0 ? inputs : null;
}

function normalizeScenarios(value: unknown): ScenarioInputs | null {
  if (!isRecord(value)) return null;
  const drivers = ["customersPerDay", "averageOrderValue", "variableCostPerOrder"] as const;
  const bands = ["low", "expected", "high"] as const;
  const scenarios = Object.fromEntries(drivers.map((driver) => [driver, value[driver]])) as ScenarioInputs;
  if (!drivers.every((driver) => {
    const range = scenarios[driver];
    return isRecord(range) && bands.every((band) => typeof range[band] === "number" && Number.isFinite(range[band]));
  })) return null;
  return Object.keys(validateScenarioInputs(scenarios)).length === 0 ? scenarios : null;
}

function buildSummary(inputs: FinancialInputs, scenarios: ScenarioInputs) {
  const forecast = calculateForecast(inputs);
  const scenarioForecasts = calculateScenarios(inputs, scenarios);
  return {
    recommendation: calculatePlanningRecommendation(scenarioForecasts),
    forecast: {
      openingCashAfterSetup: forecast.openingCashAfterSetup,
      monthlyRevenue: forecast.monthlyRevenue,
      monthlyExpenses: forecast.monthlyExpenses,
      monthlyCashMovement: forecast.monthlyCashMovement,
      grossMarginPercentage: forecast.grossMarginPercentage,
      breakEvenCustomersPerDay: forecast.breakEvenCustomersPerDay,
      cashNegativeMonth: forecast.cashNegativeMonth,
      endingCashAtMonth6: forecast.months[5].endingCash
    },
    scenarios: Object.fromEntries(
      (["pessimistic", "base", "optimistic"] as const).map((key) => [key, {
        cashNegativeMonth: scenarioForecasts[key].cashNegativeMonth,
        endingCashAtMonth6: scenarioForecasts[key].months[5].endingCash,
        recommendation: scenarioForecasts[key].recommendation
      }])
    )
  };
}

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "anonymous";
}

function withinRequestLimit(request: Request) {
  const now = Date.now();
  const key = requestKey(request);
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + requestWindowMs });
    if (requestCounts.size > 1000) {
      for (const [entryKey, entry] of requestCounts) {
        if (entry.resetAt <= now) requestCounts.delete(entryKey);
      }
    }
    return true;
  }
  if (current.count >= requestLimit) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!withinRequestLimit(request)) {
    return errorResponse("Too many explanation requests. Try again shortly.", 429, "RATE_LIMITED");
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return errorResponse("AI explanation is not configured.", 503, "AI_NOT_CONFIGURED");
  }

  let body: Partial<ExplanationRequest>;
  try {
    body = await request.json() as Partial<ExplanationRequest>;
  } catch {
    return errorResponse("Invalid request body.", 400, "INVALID_BODY");
  }

  if (typeof body.language !== "string" || !languageValues.has(body.language)) {
    return errorResponse("Unsupported language.", 400, "INVALID_LANGUAGE");
  }
  const inputs = normalizeInputs(body.inputs);
  const scenarios = normalizeScenarios(body.scenarios);
  if (!inputs || !scenarios) return errorResponse("Invalid financial assumptions.", 400, "INVALID_INPUTS");

  const summary = buildSummary(inputs, scenarios);
  const systemMessage = body.language === "en"
    ? "You explain a deterministic café financial forecast. Never calculate, change, or invent numbers. Do not include any numeric digits or currency amounts in your text; the UI renders authoritative numbers separately. Use only the supplied summary. Return only the requested JSON schema. This is educational information, not financial, tax, legal, or investment advice."
    : "คุณอธิบายประมาณการการเงินร้านกาแฟที่คำนวณแบบตายตัว ห้ามคำนวณ เปลี่ยน หรือสร้างตัวเลขขึ้นเอง ห้ามใส่ตัวเลขอารบิกหรือจำนวนเงินในข้อความ เพราะ UI จะแสดงตัวเลขที่ถูกต้องแยกต่างหาก ใช้เฉพาะข้อมูลสรุปที่ให้มา ตอบเป็น JSON ตาม schema เท่านั้น ข้อมูลนี้มีไว้เพื่อการศึกษา ไม่ใช่คำแนะนำทางการเงิน ภาษี กฎหมาย หรือการลงทุน";
  const userMessage = JSON.stringify({ language: body.language, inputs, summary });

  let providerResponse: Response;
  try {
    providerResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": process.env.OPENROUTER_SITE_NAME ?? "Perd Wai"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "perd_wai_explanation", strict: true, schema: responseSchema }
        },
        provider: {
          require_parameters: true,
          data_collection: "deny",
          zdr: true
        },
        temperature: 0.2,
        max_tokens: 900,
        stream: false
      }, null, 2)
    });
  } catch {
    return errorResponse("The AI provider could not be reached.", 502, "AI_UNAVAILABLE");
  }

  if (!providerResponse.ok) {
    return errorResponse("The AI provider is temporarily unavailable.", 502, "AI_PROVIDER_ERROR");
  }

  const completion = await providerResponse.json() as {
    choices?: Array<{ message?: { content?: unknown; refusal?: unknown } }>;
  };
  const message = completion.choices?.[0]?.message;
  if (!message || typeof message.content !== "string") {
    return errorResponse("The AI returned no usable explanation.", 502, "AI_INVALID_RESPONSE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(message.content);
  } catch {
    return errorResponse("The AI returned invalid structured data.", 502, "AI_INVALID_RESPONSE");
  }

  const explanation = { ...(parsed as Record<string, unknown>), disclaimer: explanationDisclaimer(body.language as "en" | "th") };
  if (!isPlanExplanation(explanation)) {
    return errorResponse("The AI returned an unsupported explanation.", 502, "AI_INVALID_RESPONSE");
  }

  return NextResponse.json(explanation);
}
