"use client";

import { useState } from "react";
import { Check, Coffee, Receipt, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import type { FinancialInputs, InputKey, ScenarioErrors, ScenarioInputs } from "../lib/finance";
import {
  currency,
  decimal,
  fieldCopy,
  localizedInputError,
  scenarioDriverCopy,
  scenarioDrivers,
  scenarioLabel,
  sections,
  type Copy,
  type Language,
  type ScenarioDriver,
  type SectionId
} from "./content";

function parseNumericDraft(raw: string) {
  const normalized = raw.replaceAll(",", "").trim();
  if (!/^\d+(?:\.\d*)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function EditableNumberInput({ ariaDescribedBy, ariaInvalid, ariaLabel, decimalInput = false, id, name, value, onValueChange }: {
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
        if (parseNumericDraft(draft) === null) setDraft(String(value));
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

function SliderField({ field, value, language, t, invalid, isExample, onChange, onKeep }: {
  field: InputKey;
  value: number;
  language: Language;
  t: Copy;
  invalid: boolean;
  isExample: boolean;
  onChange: (field: InputKey, value: number) => void;
  onKeep: (field: InputKey) => void;
}) {
  const item = fieldCopy[field];
  const isMoney = item.unit.en === "THB";
  const hintId = item.hint ? `${field}-hint` : undefined;
  const errorId = invalid ? `${field}-error` : undefined;
  const unitId = `${field}-unit`;
  const describedBy = [unitId, hintId, errorId].filter(Boolean).join(" ");
  const max = Math.max(item.max, value);
  const fill = `${Math.min(100, (value / max) * 100)}%`;

  return (
    <div className="slider-field" data-example={isExample || undefined} data-invalid={invalid || undefined}>
      <div className="slider-field-head">
        <label htmlFor={field}>{item[language]}</label>
        <span className={isMoney ? "sr-only" : "slider-unit"} id={unitId}>{item.unit[language]}</span>
        <div className="slider-value">
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
              onValueChange={(next) => onChange(field, next)}
            />
          ) : (
            <EditableNumberInput
              ariaDescribedBy={describedBy}
              ariaInvalid={invalid}
              decimalInput={item.decimal}
              id={field}
              name={field}
              value={value}
              onValueChange={(next) => onChange(field, next)}
            />
          )}
        </div>
      </div>
      <input
        aria-label={`${item[language]} ${t.slider}`}
        aria-valuetext={isMoney ? currency.format(value) : `${decimal.format(value)} ${item.unit[language]}`}
        className="range"
        max={max}
        min={0}
        step={item.step}
        style={{ "--fill": fill } as React.CSSProperties}
        type="range"
        value={value}
        onChange={(event) => onChange(field, Number(event.target.value))}
      />
      {item.hint ? <p className="slider-hint" id={hintId}>{item.hint[language]}</p> : null}
      {isExample ? (
        <p className="example-tag">
          <span>{t.exampleTag}</span>
          <button aria-label={t.keepValueLabel(item[language])} onClick={() => onKeep(field)} type="button"><Check aria-hidden="true" /> {t.keepValue}</button>
        </p>
      ) : null}
      {invalid ? <p className="slider-error" id={errorId}>{localizedInputError(field, language)}</p> : null}
    </div>
  );
}

const sectionIcons: Record<SectionId, typeof Store> = { money: Store, sales: Coffee, costs: Receipt };

export function PlanInputs({
  inputs,
  scenarioInputs,
  errors,
  scenarioErrors,
  confirmed,
  showExampleTags,
  customRanges,
  usesLoan,
  showsTaxReserve,
  language,
  t,
  onInput,
  onKeep,
  onScenario,
  onResetRanges,
  onToggleLoan,
  onToggleTax
}: {
  inputs: FinancialInputs;
  scenarioInputs: ScenarioInputs;
  errors: Partial<Record<InputKey, string>>;
  scenarioErrors: ScenarioErrors;
  confirmed: ReadonlySet<InputKey>;
  showExampleTags: boolean;
  customRanges: boolean;
  usesLoan: boolean;
  showsTaxReserve: boolean;
  language: Language;
  t: Copy;
  onInput: (field: InputKey, value: number) => void;
  onKeep: (field: InputKey) => void;
  onScenario: (driver: ScenarioDriver, band: "low" | "high", value: number) => void;
  onResetRanges: () => void;
  onToggleLoan: () => void;
  onToggleTax: () => void;
}) {
  const setupCost = inputs.rent * inputs.depositMonths + inputs.equipmentRenovation;
  const revenue = inputs.customersPerDay * inputs.openDaysPerMonth * inputs.averageOrderValue;
  const fixedCosts = inputs.rent + inputs.staffWages + inputs.utilities + inputs.marketing + inputs.ownerWithdrawal + inputs.taxFeesReserve + inputs.monthlyLoanRepayment;
  const subtotals: Record<SectionId, [string, number]> = {
    money: [t.setupSubtotal, setupCost],
    sales: [t.revenueSubtotal, revenue],
    costs: [t.costsSubtotal, fixedCosts]
  };
  const rangesInvalid = Object.keys(scenarioErrors).length > 0;

  const field = (key: InputKey) => (
    <SliderField
      field={key}
      invalid={Boolean(errors[key])}
      isExample={showExampleTags && !confirmed.has(key)}
      key={key}
      language={language}
      t={t}
      value={inputs[key]}
      onChange={onInput}
      onKeep={onKeep}
    />
  );

  return (
    <div className="plan-inputs">
      {sections.map((section, index) => {
        const Icon = sectionIcons[section.id];
        const optionalKeys: InputKey[] = section.id === "money" && usesLoan
          ? ["loanAmount", "monthlyLoanRepayment"]
          : section.id === "costs" && showsTaxReserve ? ["taxFeesReserve"] : [];
        const [subtotalLabel, subtotal] = subtotals[section.id];
        return (
          <section className="input-section" data-testid={`section-${section.id}`} key={section.id} aria-labelledby={`section-${section.id}-title`}>
            <header className="input-section-head">
              <span className="input-section-icon" aria-hidden="true"><Icon /></span>
              <div>
                <p className="input-section-step">{index + 1} / 3</p>
                <h3 id={`section-${section.id}-title`}>{section.title[language]}</h3>
                <p>{section.question[language]}</p>
              </div>
              <p className="input-section-total">{subtotalLabel}<b>{currency.format(subtotal)}</b></p>
            </header>
            {section.keys.map(field)}
            {optionalKeys.map(field)}
            {section.id === "money" ? (
              <Button onClick={onToggleLoan} type="button" variant="optional">
                {usesLoan ? t.removeLoan : t.addLoan} <span className="optional-label">({t.optional})</span>
              </Button>
            ) : null}
            {section.id === "costs" ? (
              <Button onClick={onToggleTax} type="button" variant="optional">
                {showsTaxReserve ? t.removeTax : t.addTax} <span className="optional-label">({t.optional})</span>
              </Button>
            ) : null}
          </section>
        );
      })}

      <details className="range-block" data-testid="scenario-ranges" open={customRanges || rangesInvalid || undefined}>
        <summary>{t.rangesTitle}</summary>
        <p className="muted-copy">{t.scenarioBody}</p>
        {scenarioDrivers.map((driver) => {
          const range = scenarioInputs[driver];
          const invalid = Boolean(scenarioErrors[driver]);
          const errorId = invalid ? `${driver}-scenario-error` : undefined;
          const slowBand = driver === "variableCostPerOrder" ? "high" : "low";
          const goodBand = driver === "variableCostPerOrder" ? "low" : "high";
          const isMoney = driver !== "customersPerDay";
          const bandInput = (band: "low" | "high", label: string) => isMoney ? (
            <MoneyInput
              aria-describedby={errorId}
              aria-invalid={invalid}
              aria-label={`${label}: ${scenarioDriverCopy[driver][language]}`}
              decimal
              suffix={language === "en" ? "THB" : "บาท"}
              value={range[band]}
              onValueChange={(value) => onScenario(driver, band, value)}
            />
          ) : (
            <EditableNumberInput
              ariaDescribedBy={errorId}
              ariaInvalid={invalid}
              ariaLabel={`${label}: ${scenarioDriverCopy[driver][language]}`}
              decimalInput
              value={range[band]}
              onValueChange={(value) => onScenario(driver, band, value)}
            />
          );
          return (
            <fieldset className="range-row" key={driver}>
              <legend>{fieldCopy[driver][language]}</legend>
              <div className="range-fields">
                <label>{scenarioLabel("pessimistic", t)}{bandInput(slowBand, t.pessimistic)}</label>
                <label>{scenarioLabel("base", t)}<output>{decimal.format(inputs[driver])}</output></label>
                <label>{scenarioLabel("optimistic", t)}{bandInput(goodBand, t.optimistic)}</label>
              </div>
              {invalid ? <p className="slider-error" id={errorId}>{t.scenarioErrorBody}</p> : null}
            </fieldset>
          );
        })}
        {customRanges ? <Button onClick={onResetRanges} type="button" variant="actionOutline">{t.automaticRanges}</Button> : null}
      </details>
    </div>
  );
}
