"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function parseMoneyDraft(raw: string) {
  const normalized = raw.replaceAll(",", "").trim();
  if (!/^\d+(?:\.\d*)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

type MoneyInputProps = Omit<React.ComponentProps<"input">, "onChange" | "type" | "value"> & {
  decimal?: boolean;
  suffix: string;
  testId?: string;
  value: number;
  onValueChange: (value: number) => void;
};

function MoneyInput({ className, decimal = false, suffix, testId, value, onBlur, onValueChange, ...props }: MoneyInputProps) {
  const formatter = decimal ? decimalFormatter : integerFormatter;
  const [draft, setDraft] = React.useState(() => formatter.format(value));
  const [previousValue, setPreviousValue] = React.useState(value);

  if (value !== previousValue) {
    setPreviousValue(value);
    if (parseMoneyDraft(draft) !== value) setDraft(formatter.format(value));
  }

  return (
    <div className="money-input" data-slot="money-input" data-testid={testId}>
      <Input
        {...props}
        className={cn("money-input-control", className)}
        inputMode={decimal ? "decimal" : "numeric"}
        spellCheck={false}
        type="text"
        value={draft}
        onBlur={(event) => {
          const parsed = parseMoneyDraft(draft);
          setDraft(parsed === null ? String(value) : formatter.format(parsed));
          onBlur?.(event);
        }}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          const parsed = parseMoneyDraft(nextDraft);
          if (parsed !== null) onValueChange(parsed);
        }}
      />
      <span className="money-input-suffix" aria-hidden="true">{suffix}</span>
    </div>
  );
}

export { MoneyInput };
