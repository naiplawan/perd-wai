"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FinancialInputs, Forecast, ScenarioForecasts, ScenarioInputs, Sensitivity } from "../lib/finance";
import {
  compactBaht,
  currency,
  customersNeeded,
  decimal,
  fieldCopy,
  scenarioLabel,
  scenarioOrder,
  type Copy,
  type Language,
  type ScenarioName
} from "./content";

type CashPoint = {
  label: string;
  pessimistic: number;
  base: number;
  optimistic: number;
  range: [number, number];
};

/** Round axis bounds outward to a 1/2/5 × 10ⁿ step so ticks land on readable values. */
function niceTicks(min: number, max: number, count = 4) {
  const raw = (max - min) / count || 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ?? raw;
  const ticks: number[] = [];
  for (let tick = Math.floor(min / step) * step; tick <= Math.ceil(max / step) * step + step / 2; tick += step) ticks.push(tick);
  return ticks;
}

function cashSeries(forecast: Forecast) {
  return [forecast.openingCashAfterSetup, ...forecast.months.map((month) => month.endingCash)];
}

/**
 * Month-0 (opening day) through Month 6 cash, with the pessimistic–optimistic
 * band behind the focused scenario's line. The line turns red below zero.
 */
export function CashRunwayChart({ scenarios, focus, showRange, t, height = 280, interactive = true }: {
  scenarios: ScenarioForecasts;
  focus: ScenarioName;
  showRange: boolean;
  t: Copy;
  height?: number;
  interactive?: boolean;
}) {
  const series = {
    pessimistic: cashSeries(scenarios.pessimistic),
    base: cashSeries(scenarios.base),
    optimistic: cashSeries(scenarios.optimistic)
  };
  const data: CashPoint[] = series.base.map((_, index) => ({
    label: index === 0 ? t.open : `${t.month} ${index}`,
    pessimistic: series.pessimistic[index],
    base: series.base[index],
    optimistic: series.optimistic[index],
    range: [series.pessimistic[index], series.optimistic[index]]
  }));
  const focused = series[focus];
  const visible = showRange ? [...series.pessimistic, ...series.optimistic, ...focused] : focused;
  const ticks = niceTicks(Math.min(...visible, 0), Math.max(...visible, 0));
  // Where zero sits inside the focused line's own extent, for the green→red split.
  const lineMax = Math.max(...focused);
  const lineMin = Math.min(...focused);
  const zeroOffset = lineMax <= 0 ? 0 : lineMin >= 0 ? 1 : lineMax / (lineMax - lineMin);
  // A flat line has a zero-height bounding box, which would hide a gradient stroke.
  const lineStroke = lineMax === lineMin ? (lineMax < 0 ? "var(--negative)" : "var(--chart-1)") : "url(#cash-line-split)";

  return (
    <ResponsiveContainer height={height} width="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="cash-line-split" x1="0" x2="0" y1="0" y2="1">
            <stop offset={zeroOffset} stopColor="var(--chart-1)" />
            <stop offset={zeroOffset} stopColor="var(--negative)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
        <XAxis axisLine={{ stroke: "var(--axis)" }} dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} />
        <YAxis
          axisLine={false}
          domain={[ticks[0], ticks.at(-1) ?? 1]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={compactBaht}
          tickLine={false}
          ticks={ticks}
          width={56}
        />
        <ReferenceLine
          ifOverflow="extendDomain"
          label={{ value: t.zeroLine, position: "insideBottomRight", fill: "var(--negative)", fontSize: 11 }}
          stroke="var(--negative)"
          strokeDasharray="4 4"
          y={0}
        />
        {showRange ? (
          <Area
            activeDot={false}
            dataKey="range"
            fill="var(--chart-band)"
            isAnimationActive={false}
            stroke="var(--chart-2)"
            strokeDasharray="3 3"
            strokeWidth={1}
            type="monotone"
          />
        ) : null}
        <Line
          activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
          dataKey={focus}
          dot={{ r: 3, fill: "var(--card)", stroke: lineStroke, strokeWidth: 2 }}
          isAnimationActive={false}
          stroke={lineStroke}
          strokeWidth={2.5}
          type="monotone"
        />
        {interactive ? (
          <Tooltip
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as CashPoint | undefined;
              if (!active || !point) return null;
              const rows = showRange ? [...scenarioOrder].reverse() : (["base"] as ScenarioName[]);
              return (
                <div className="chart-tooltip">
                  <strong>{point.label}</strong>
                  {rows.map((scenario) => (
                    <div className={scenario === focus ? "is-focus" : undefined} key={scenario}>
                      <span>{scenarioLabel(scenario, t)}</span>
                      <b className={point[scenario] < 0 ? "is-negative" : undefined}>{currency.format(point[scenario])}</b>
                    </div>
                  ))}
                </div>
              );
            }}
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
          />
        ) : null}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Bullet chart: expected customers (and the slow–good range) against the customers needed to cover bills. */
export function BreakEvenBullet({ forecast, customers, range, t }: {
  forecast: Forecast;
  customers: number;
  range: ScenarioInputs["customersPerDay"] | null;
  t: Copy;
}) {
  const needed = customersNeeded(forecast);
  const scaleMax = Math.max(needed, customers, range?.high ?? 0) * 1.2 || 1;
  const pct = (value: number) => `${Math.min(100, Math.max(0, (value / scaleMax) * 100))}%`;
  const healthy = customers >= forecast.breakEvenCustomersPerDay;
  const gap = healthy ? Math.floor(customers - forecast.breakEvenCustomersPerDay) : Math.max(1, Math.ceil(forecast.breakEvenCustomersPerDay - customers));

  return (
    <div className="bullet" data-testid="break-even-chart">
      <p className={`bullet-status ${healthy ? "is-good" : "is-warn"}`}>
        <span aria-hidden="true">{healthy ? "▲" : "▼"}</span>
        {healthy ? t.aboveBreakEven(decimal.format(gap)) : t.belowBreakEven(decimal.format(gap))}
      </p>
      <div className="bullet-track" role="img" aria-label={`${t.breakEvenMarker} ${needed} · ${t.youExpect} ${decimal.format(customers)}`}>
        <div className="bullet-loss" style={{ width: pct(needed) }} />
        {range ? <div className="bullet-range" style={{ left: pct(range.low), width: `calc(${pct(range.high)} - ${pct(range.low)})` }} /> : null}
        <div className="bullet-target" style={{ left: pct(needed) }}>
          <span>{t.breakEvenMarker} <b>{needed}</b></span>
        </div>
        <div className={`bullet-marker ${healthy ? "is-good" : "is-warn"}`} style={{ left: pct(customers) }}>
          <span>{t.youExpect} <b>{decimal.format(customers)}</b></span>
        </div>
      </div>
      <div className="bullet-scale" aria-hidden="true"><span>0</span><span>{Math.round(scaleMax)}</span></div>
    </div>
  );
}

const flowLabels: Record<"rent" | "staffWages" | "ownerWithdrawal" | "utilities" | "marketing" | "taxFeesReserve" | "monthlyLoanRepayment", Record<Language, string>> = {
  rent: { en: "Rent", th: "ค่าเช่า" },
  staffWages: { en: "Staff", th: "พนักงาน" },
  ownerWithdrawal: { en: "Your pay", th: "เงินเดือนคุณ" },
  utilities: { en: "Water and electricity", th: "ค่าน้ำค่าไฟ" },
  marketing: { en: "Advertising", th: "โฆษณา" },
  taxFeesReserve: { en: "Tax money", th: "เงินกันภาษี" },
  monthlyLoanRepayment: { en: "Loan payment", th: "ค่างวดเงินกู้" }
};

/** Revenue against each monthly cost line, ending in what is left over (or short). */
export function MoneyFlow({ forecast, inputs, t, language }: {
  forecast: Forecast;
  inputs: FinancialInputs;
  t: Copy;
  language: Language;
}) {
  const costs = [
    { label: t.variableCosts, value: forecast.monthlyVariableCost },
    ...(["rent", "staffWages", "ownerWithdrawal", "utilities", "marketing", "taxFeesReserve", "monthlyLoanRepayment"] as const)
      .map((key) => ({ label: flowLabels[key][language], value: inputs[key] }))
  ].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const scale = Math.max(forecast.monthlyRevenue, forecast.monthlyExpenses, 1);
  const net = forecast.monthlyCashMovement;
  const width = (value: number) => `${Math.max(0.5, (value / scale) * 100)}%`;

  return (
    <div className="flow" data-testid="money-flow">
      <div className="flow-row flow-revenue">
        <span>{t.revenue}</span>
        <div className="flow-bar"><i style={{ width: width(forecast.monthlyRevenue) }} /></div>
        <b>{currency.format(forecast.monthlyRevenue)}</b>
      </div>
      {costs.map((item) => (
        <div className="flow-row" key={item.label}>
          <span>{item.label}</span>
          <div className="flow-bar"><i style={{ width: width(item.value) }} /></div>
          <b>−{currency.format(item.value)}</b>
        </div>
      ))}
      <div className={`flow-row flow-net ${net >= 0 ? "is-good" : "is-bad"}`}>
        <span><span aria-hidden="true">{net >= 0 ? "▲ " : "▼ "}</span>{net >= 0 ? t.leftOver : t.shortfall}</span>
        <div className="flow-bar"><i style={{ width: width(Math.abs(net)) }} /></div>
        <b>{net >= 0 ? "+" : "−"}{currency.format(Math.abs(net))}</b>
      </div>
    </div>
  );
}

export function SensitivityBars({ sensitivities, inputs, language }: {
  sensitivities: Sensitivity[];
  inputs: FinancialInputs;
  language: Language;
}) {
  const top = Math.max(...sensitivities.map((item) => item.absoluteImpact), 1);
  return (
    <ol className="sensitivity-bars">
      {sensitivities.map((item) => (
        <li key={item.key}>
          <div className="sensitivity-head">
            <b>{fieldCopy[item.key][language]}</b>
            <strong>−{currency.format(item.absoluteImpact)}</strong>
          </div>
          <div className="flow-bar"><i style={{ width: `${(item.absoluteImpact / top) * 100}%` }} /></div>
          <small>{language === "en" ? "If" : "ถ้า"} {decimal.format(inputs[item.key])} → {decimal.format(item.adverseValue)}</small>
        </li>
      ))}
    </ol>
  );
}
