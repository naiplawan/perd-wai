"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CircleAlert, Clock, Download, Info, PencilLine, Printer, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PlanDraft, PlanExplanation } from "../lib/ai-explanation";
import {
  DEFAULT_INPUTS,
  calculatePlanningRecommendation,
  calculateScenarios,
  rankSensitivities,
  validateInputs,
  validateScenarioInputs,
  type FinancialInputs,
  type InputKey,
  type ScenarioInputs
} from "../lib/finance";
import { BreakEvenBullet, CashRunwayChart, MoneyFlow, SensitivityBars } from "./charts";
import {
  EXAMPLE_SCENARIOS,
  cashRunoutText,
  copy,
  currency,
  customersNeeded,
  decimal,
  downloadCsv,
  explanationDriverLabel,
  fieldCopy,
  forecastTakeaway,
  nextAction,
  plainSummary,
  recommendationEvidence,
  recommendationTitles,
  reviewValue,
  scenarioLabel,
  scenarioOrder,
  sections,
  suggestedScenarios,
  type Language,
  type ScenarioDriver,
  type ScenarioName
} from "./content";
import { PlanInputs } from "./plan-inputs";

type PlanMode = "choice" | "custom" | "example";
type SavedPlan = {
  version: 3;
  language: Language;
  mode: Exclude<PlanMode, "choice">;
  inputs: FinancialInputs;
  scenarios: ScenarioInputs;
  usesLoan: boolean;
  showsTaxReserve: boolean;
  /** Optional so plans saved before example values existed still load. */
  customRanges?: boolean;
  confirmed?: InputKey[];
};
type LegacySavedPlan =
  | { version: 2; language: Language; mode: Exclude<PlanMode, "choice">; inputs: FinancialInputs; scenarios: ScenarioInputs; usesLoan: boolean; showsTaxReserve: boolean }
  | { version: 1; inputs: FinancialInputs; scenarios: ScenarioInputs };

const STORAGE_KEY = "perd-wai-plan-v1";
const ALL_KEYS = Object.keys(DEFAULT_INPUTS) as InputKey[];
const examplePreview = calculateScenarios(DEFAULT_INPUTS, EXAMPLE_SCENARIOS);
const rangesEntered = (ranges: ScenarioInputs) => Object.values(ranges).some((range) => range.low !== 0 || range.high !== 0);

export function Simulator() {
  const [language, setLanguage] = useState<Language>("th");
  const [mode, setMode] = useState<PlanMode>("choice");
  const [inputs, setInputs] = useState<FinancialInputs>(DEFAULT_INPUTS);
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInputs>(EXAMPLE_SCENARIOS);
  const [customRanges, setCustomRanges] = useState(false);
  const [confirmed, setConfirmed] = useState<ReadonlySet<InputKey>>(new Set());
  const [selectedScenario, setSelectedScenario] = useState<ScenarioName>("base");
  const [usesLoan, setUsesLoan] = useState(false);
  const [showsTaxReserve, setShowsTaxReserve] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<PlanExplanation | null>(null);
  const [aiState, setAiState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiCopied, setAiCopied] = useState(false);
  const [aiFingerprint, setAiFingerprint] = useState<string | null>(null);
  const [intakeDescription, setIntakeDescription] = useState("");
  const [intakeDraft, setIntakeDraft] = useState<PlanDraft | null>(null);
  const [intakeState, setIntakeState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as SavedPlan | LegacySavedPlan;
          setInputs(saved.inputs);
          setScenarioInputs(saved.scenarios);
          // Older plans were typed in by hand: treat every number and any entered range as the user's own.
          setCustomRanges(saved.version === 3 && saved.customRanges !== undefined ? saved.customRanges : rangesEntered(saved.scenarios));
          setConfirmed(new Set(saved.version === 3 && saved.confirmed ? saved.confirmed : ALL_KEYS));
          if (saved.version === 1) {
            setMode("custom");
            setUsesLoan(saved.inputs.loanAmount > 0 || saved.inputs.monthlyLoanRepayment > 0);
            setShowsTaxReserve(saved.inputs.taxFeesReserve > 0);
          } else {
            setLanguage(saved.language);
            setMode(saved.mode);
            setUsesLoan(saved.usesLoan);
            setShowsTaxReserve(saved.showsTaxReserve);
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

  useEffect(() => {
    if (!hydrated || mode === "choice") return;
    const saved: SavedPlan = { version: 3, language, mode, inputs, scenarios: scenarioInputs, usesLoan, showsTaxReserve, customRanges, confirmed: [...confirmed] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [hydrated, language, mode, inputs, scenarioInputs, usesLoan, showsTaxReserve, customRanges, confirmed]);

  const t = copy[language];
  const ranges = useMemo(() => customRanges ? scenarioInputs : suggestedScenarios(inputs), [customRanges, scenarioInputs, inputs]);
  const errors = useMemo(() => validateInputs(inputs), [inputs]);
  const scenarioErrors = useMemo(() => validateScenarioInputs(ranges), [ranges]);
  const isValid = Object.keys(errors).length === 0;
  const scenariosValid = Object.keys(scenarioErrors).length === 0;
  const scenarios = useMemo(() => calculateScenarios(inputs, ranges), [inputs, ranges]);
  const sensitivities = useMemo(() => rankSensitivities(inputs), [inputs]);
  const focus: ScenarioName = scenariosValid ? selectedScenario : "base";
  const forecast = scenarios[focus];
  const planningRecommendation = calculatePlanningRecommendation(scenarios);
  const visibleKeys: InputKey[] = [
    ...sections[0].keys, ...(usesLoan ? ["loanAmount", "monthlyLoanRepayment"] as const : []),
    ...sections[1].keys,
    ...sections[2].keys, ...(showsTaxReserve ? ["taxFeesReserve"] as const : [])
  ];
  const invalidKeys = visibleKeys.filter((key) => errors[key]);
  const exampleKeys = mode === "custom" ? visibleKeys.filter((key) => !confirmed.has(key)) : [];
  const planFingerprint = useMemo(() => JSON.stringify({ language, inputs, scenarios: ranges }), [language, inputs, ranges]);
  const currentAiState = aiFingerprint === planFingerprint ? aiState : "idle";
  const currentAiExplanation = aiFingerprint === planFingerprint ? aiExplanation : null;
  const focusCustomers = focus === "base" ? inputs.customersPerDay : ranges.customersPerDay[focus === "pessimistic" ? "low" : "high"];

  function changeLanguage(next: Language) {
    setLanguage(next);
    document.documentElement.lang = next;
  }

  function loadPlan(nextMode: Exclude<PlanMode, "choice">, nextInputs: FinancialInputs, nextRanges: ScenarioInputs | null, nextConfirmed: Iterable<InputKey>) {
    setMode(nextMode);
    setInputs(nextInputs);
    setScenarioInputs(nextRanges ?? suggestedScenarios(nextInputs));
    setCustomRanges(nextRanges !== null);
    setConfirmed(new Set(nextConfirmed));
    setSelectedScenario("base");
    setUsesLoan(nextInputs.loanAmount > 0 || nextInputs.monthlyLoanRepayment > 0);
    setShowsTaxReserve(nextInputs.taxFeesReserve > 0);
    window.scrollTo({ top: 0 });
  }

  function startOver() {
    localStorage.removeItem(STORAGE_KEY);
    setMode("choice");
    setSelectedScenario("base");
    setIntakeDescription("");
    setIntakeDraft(null);
    setIntakeState("idle");
  }

  function confirmField(field: InputKey) {
    setConfirmed((current) => current.has(field) ? current : new Set(current).add(field));
  }

  function updateInput(field: InputKey, value: number) {
    setInputs((current) => ({ ...current, [field]: value }));
    confirmField(field);
    if (field === "customersPerDay" || field === "averageOrderValue" || field === "variableCostPerOrder") {
      setScenarioInputs((current) => ({ ...current, [field]: { ...current[field], expected: value } }));
    }
  }

  function updateScenario(driver: ScenarioDriver, band: "low" | "high", value: number) {
    // The first manual edit starts from the automatic ranges the user was looking at.
    const base = customRanges ? scenarioInputs : ranges;
    setScenarioInputs({ ...base, [driver]: { ...base[driver], [band]: value } });
    setCustomRanges(true);
  }

  function toggleLoan() {
    if (usesLoan) setInputs((current) => ({ ...current, loanAmount: 0, monthlyLoanRepayment: 0 }));
    setUsesLoan(!usesLoan);
  }

  function toggleTaxReserve() {
    if (showsTaxReserve) setInputs((current) => ({ ...current, taxFeesReserve: 0 }));
    setShowsTaxReserve(!showsTaxReserve);
  }

  function focusField(key: InputKey) {
    const element = document.getElementById(key);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    element?.focus({ preventScroll: true });
  }

  async function explainPlan() {
    if (currentAiState === "loading") return;
    setAiFingerprint(planFingerprint);
    setAiExplanation(null);
    setAiState("loading");
    setAiCopied(false);
    try {
      const response = await fetch("/api/explain-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, inputs, scenarios: ranges })
      });
      const payload = await response.json() as PlanExplanation | { error?: string };
      if (!response.ok || !("summary" in payload)) throw new Error("AI explanation unavailable");
      setAiExplanation(payload);
      setAiState("ready");
    } catch {
      setAiState("error");
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

  async function draftPlanFromDescription() {
    if (intakeState === "loading" || intakeDescription.trim().length < 10) return;
    setIntakeState("loading");
    setIntakeDraft(null);
    try {
      const response = await fetch("/api/draft-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, description: intakeDescription })
      });
      const payload = await response.json() as PlanDraft | { error?: string };
      if (!response.ok || !("suggestedInputs" in payload)) throw new Error("AI draft unavailable");
      setIntakeDraft(payload);
      setIntakeState("ready");
    } catch {
      setIntakeState("error");
    }
  }

  function applyIntakeDraft() {
    if (!intakeDraft) return;
    loadPlan("custom", { ...DEFAULT_INPUTS, ...intakeDraft.suggestedInputs }, null, Object.keys(intakeDraft.suggestedInputs) as InputKey[]);
  }

  const verdictIcon = planningRecommendation === "start-validating" ? <ShieldCheck /> : planningRecommendation === "revise-plan" ? <TriangleAlert /> : <CircleAlert />;

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><ArrowUpRight /></span><span><strong>เปิดไหว</strong><small>Perd Wai</small></span></a>
        <ToggleGroup aria-label="Language" onValueChange={(value) => value && changeLanguage(value as Language)} type="single" value={language}>
          <ToggleGroupItem aria-label="ไทย" value="th">ไทย</ToggleGroupItem>
          <ToggleGroupItem aria-label="EN" value="en">EN</ToggleGroupItem>
        </ToggleGroup>
      </header>

      {mode === "choice" ? (
        <main id="top" className="shell">
          <section className="landing">
            <div className="landing-hero">
              <p className="eyebrow">{t.heroEyebrow}</p>
              <h1>{t.heroTitle}</h1>
              <p className="hero-body">{t.heroBody}</p>
              <h2 className="sr-only">{t.chooseTitle}</h2>
              <div className="start-options">
                <Button onClick={() => loadPlan("custom", DEFAULT_INPUTS, null, [])} variant="start">
                  <span><strong>{t.createPlan}</strong><small>{t.createPlanBody}</small></span><ArrowRight aria-hidden="true" />
                </Button>
                <Button onClick={() => loadPlan("example", DEFAULT_INPUTS, EXAMPLE_SCENARIOS, ALL_KEYS)} variant="startOutline">
                  <span><strong>{t.exploreExample}</strong><small>{t.exploreExampleBody}</small></span><ArrowRight aria-hidden="true" />
                </Button>
              </div>
              <p className="start-facts"><Clock aria-hidden="true" /> {t.timeEstimate} <span aria-hidden="true">·</span> <ShieldCheck aria-hidden="true" /> {t.autoSave}</p>
            </div>
            <figure className="landing-preview card" aria-hidden="true">
              <div className="landing-preview-head">
                <span className="verdict-chip is-warn"><TriangleAlert /> {recommendationTitles["revise-plan"][language]}</span>
                <strong>{currency.format(examplePreview.base.months[5].endingCash)}</strong>
              </div>
              {hydrated ? <CashRunwayChart focus="base" height={210} interactive={false} scenarios={examplePreview} showRange t={t} /> : <div style={{ height: 210 }} />}
              <figcaption>{t.previewCaption}</figcaption>
            </figure>
          </section>

          <section className="landing-lower">
            <Card className="intake-card" data-testid="intake-assistant">
              <p className="eyebrow"><Sparkles aria-hidden="true" /> AI</p>
              <h3>{t.intakeTitle}</h3>
              <p className="muted-copy">{t.intakeBody}</p>
              <textarea
                aria-label={t.intakeTitle}
                className="intake-textarea"
                maxLength={2000}
                onChange={(event) => setIntakeDescription(event.target.value)}
                placeholder={t.intakePlaceholder}
                rows={4}
                value={intakeDescription}
              />
              <div className="intake-actions">
                <p>{t.intakeDisclosure}</p>
                <Button disabled={intakeState === "loading" || intakeDescription.trim().length < 10} onClick={draftPlanFromDescription} type="button" variant="actionOutline">
                  {intakeState === "loading" ? t.intakeLoading : t.intakeButton}
                </Button>
              </div>
              {intakeState === "error" ? <Alert className="border-destructive/30 bg-destructive/5" data-testid="intake-error" variant="destructive"><AlertDescription>{t.intakeError}</AlertDescription></Alert> : null}
              {intakeDraft ? (
                <div className="intake-draft" data-testid="intake-draft">
                  <div><p className="eyebrow">{t.intakeDraftTitle}</p><p className="muted-copy">{intakeDraft.summary}</p></div>
                  {Object.keys(intakeDraft.suggestedInputs).length > 0 ? (
                    <section>
                      <h4>{t.intakeSuggested}</h4>
                      <dl className="intake-values">
                        {(Object.entries(intakeDraft.suggestedInputs) as Array<[InputKey, number]>).map(([key, value]) => <div key={key}><dt>{fieldCopy[key][language]}</dt><dd>{reviewValue(key, value, language)}</dd></div>)}
                      </dl>
                    </section>
                  ) : null}
                  <p className="muted-copy">{t.intakeMissing}</p>
                  {intakeDraft.assumptionsToVerify.length > 0 ? <section><h4>{t.intakeVerify}</h4><ul className="intake-list">{intakeDraft.assumptionsToVerify.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
                  <Button onClick={applyIntakeDraft} type="button" variant="action">{t.intakeApply}</Button>
                </div>
              ) : null}
            </Card>
            <Card className="guide-card" data-testid="onboarding-guide">
              <section>
                <h3>{t.prepareTitle}</h3>
                <p>{t.prepareBody}</p>
                <ol className="guide-steps">{t.prepareItems.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
              </section>
              <section>
                <h3>{t.outcomeTitle}</h3>
                <ul className="guide-checks">{t.outcomeItems.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
              </section>
            </Card>
          </section>
          <p className="notice"><Info aria-hidden="true" /> <span>{t.notice}</span></p>
        </main>
      ) : (
        <main id="top" className="workspace">
          <aside className="panel" aria-labelledby="panel-heading">
            <div className="panel-head">
              <div>
                <h2 id="panel-heading">{t.yourPlan}</h2>
                <p>{t.adjustHint}</p>
              </div>
              <Button onClick={startOver} type="button" variant="quietLink">{t.startOver}</Button>
            </div>
            {mode === "example" ? <Alert className="example-banner"><AlertDescription>{t.exampleBanner}</AlertDescription></Alert> : null}
            <PlanInputs
              confirmed={confirmed}
              customRanges={customRanges}
              errors={errors}
              inputs={inputs}
              language={language}
              scenarioErrors={scenarioErrors}
              scenarioInputs={ranges}
              showExampleTags={mode === "custom"}
              showsTaxReserve={showsTaxReserve}
              t={t}
              usesLoan={usesLoan}
              onInput={updateInput}
              onKeep={confirmField}
              onResetRanges={() => setCustomRanges(false)}
              onScenario={updateScenario}
              onToggleLoan={toggleLoan}
              onToggleTax={toggleTaxReserve}
            />
            {hydrated ? <p className="save-state" aria-live="polite"><Check aria-hidden="true" /> {t.saved}</p> : null}
          </aside>

          <section className="dashboard" id="forecast" aria-labelledby="forecast-heading">
            <div className="dashboard-head">
              <div>
                <p className="eyebrow">{t.estimate}</p>
                <h2 id="forecast-heading">{t.dashboardTitle}</h2>
              </div>
              {isValid ? (
                <div className="button-row no-print">
                  <Button onClick={() => downloadCsv(inputs, forecast)} type="button" variant="actionOutline"><Download aria-hidden="true" /> {t.exportCsv}</Button>
                  <Button onClick={() => window.print()} type="button" variant="actionOutline"><Printer aria-hidden="true" /> {t.printPdf}</Button>
                </div>
              ) : null}
            </div>

            {!isValid ? (
              <Card className="empty-state" data-testid="empty-state">
                <CircleAlert aria-hidden="true" />
                <div>
                  <h3>{t.emptyTitle}</h3>
                  <p className="muted-copy">{t.emptyBody}</p>
                  <ul className="missing-list">
                    {invalidKeys.map((key) => <li key={key}><button onClick={() => focusField(key)} type="button">{fieldCopy[key][language]} <ArrowRight aria-hidden="true" /></button></li>)}
                  </ul>
                </div>
              </Card>
            ) : (
              <>
                {exampleKeys.length > 0 ? (
                  <div className="examples-left" data-testid="examples-left">
                    <PencilLine aria-hidden="true" />
                    <div>
                      <p>{t.examplesLeft(exampleKeys.length)}</p>
                      <ul className="missing-list">
                        {exampleKeys.map((key) => <li key={key}><button onClick={() => focusField(key)} type="button">{fieldCopy[key][language]}</button></li>)}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {scenariosValid ? (
                  <div className={`verdict verdict-${planningRecommendation}`} data-testid="recommendation" role="status">
                    <div className="verdict-main">
                      <span className="verdict-icon" aria-hidden="true">{verdictIcon}</span>
                      <div>
                        <p className="eyebrow">{t.answerQuestion}</p>
                        <h3>{recommendationTitles[planningRecommendation][language]}</h3>
                        <p className="verdict-summary" data-testid="plain-summary">{plainSummary(inputs, scenarios.base, language)}</p>
                        <p>{recommendationEvidence(scenarios, planningRecommendation, language)}</p>
                      </div>
                    </div>
                    <div className="verdict-side">
                      <div data-testid="decision-next-action">
                        <span>{t.nextAction}</span>
                        <strong>{nextAction(planningRecommendation, language)}</strong>
                      </div>
                      <div data-testid="decision-most-sensitive">
                        <span>{t.verifyFirst}</span>
                        <button className="link-button" onClick={() => focusField(sensitivities[0].key)} type="button">{fieldCopy[sensitivities[0].key][language]} <ArrowRight aria-hidden="true" /></button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="tiles">
                  <div className={`tile ${forecast.cashNegativeMonth !== null ? "is-bad" : "is-good"}`} data-testid="runway-tile">
                    <span>{t.runway}</span>
                    <strong>{cashRunoutText(forecast, t)}</strong>
                    <small>{t.month} 6: {currency.format(forecast.months[5].endingCash)}</small>
                  </div>
                  <div className={`tile ${forecast.openingCashAfterSetup < 0 ? "is-bad" : ""}`}>
                    <span>{t.openingCash}</span>
                    <strong>{currency.format(forecast.openingCashAfterSetup)}</strong>
                    <small>{t.openingCashNote}</small>
                  </div>
                  <div className={`tile ${forecast.monthlyCashMovement < 0 ? "is-bad" : "is-good"}`}>
                    <span>{t.monthlyCash}</span>
                    <strong>{forecast.monthlyCashMovement >= 0 ? "+" : ""}{currency.format(forecast.monthlyCashMovement)}</strong>
                    <small>{t.monthlyCashNote}</small>
                  </div>
                  <div className="tile">
                    <span>{t.breakEven}</span>
                    <strong>{customersNeeded(forecast)}</strong>
                    <small>{t.youExpect} {decimal.format(focusCustomers)}</small>
                  </div>
                </div>

                <Card className="chart-card" data-testid="simulation-dashboard">
                  <h3 id="cash-chart-title">{t.cashChartTitle}</h3>
                  <p className="chart-takeaway" data-testid="forecast-takeaway" id="cash-chart-takeaway">{forecastTakeaway(forecast, language)}</p>
                  <figure aria-labelledby="cash-chart-title cash-chart-takeaway" className="cash-figure">
                    <CashRunwayChart focus={focus} scenarios={scenarios} showRange={scenariosValid} t={t} />
                    <figcaption className="how-to-read"><Info aria-hidden="true" /> {t.howToRead}</figcaption>
                  </figure>
                  {scenariosValid ? (
                    <div className="scenario-legend" role="group" aria-label={t.legendHint}>
                      {scenarioOrder.map((scenario) => (
                        <button
                          aria-pressed={focus === scenario}
                          className={`scenario-pick scenario-pick-${scenario}`}
                          data-testid={`scenario-${scenario}`}
                          key={scenario}
                          onClick={() => setSelectedScenario(scenario)}
                          type="button"
                        >
                          <span className="scenario-swatch" aria-hidden="true" />
                          <span className="scenario-name">{scenarioLabel(scenario, t)}</span>
                          <strong>{cashRunoutText(scenarios[scenario], t)}</strong>
                          <small>{t.month} 6: {currency.format(scenarios[scenario].months[5].endingCash)}</small>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Card>

                <div className="chart-grid">
                  <Card className="chart-card">
                    <h3>{t.breakEvenTitle}</h3>
                    <BreakEvenBullet customers={focusCustomers} forecast={forecast} range={scenariosValid ? ranges.customersPerDay : null} t={t} />
                  </Card>
                  <Card className="chart-card">
                    <h3>{t.moneyFlowTitle}</h3>
                    <MoneyFlow forecast={forecast} inputs={inputs} language={language} t={t} />
                  </Card>
                </div>

                <div className="chart-grid">
                  <Card className="chart-card sensitivity-card">
                    <p className="eyebrow">{t.sensitivity}</p>
                    <h3>{t.sensitivityTitle}</h3>
                    <p className="muted-copy">{t.sensitivityBody}</p>
                    <SensitivityBars inputs={inputs} language={language} sensitivities={sensitivities} />
                  </Card>

                  <Card className="chart-card ai-card no-print" data-testid="ai-explanation-card">
                    <p className="eyebrow"><Sparkles aria-hidden="true" /> {t.aiExplanation}</p>
                    <h3>{t.explainPlan}</h3>
                    <p className="muted-copy">{t.aiDisclosure}</p>
                    <Button className="self-start" disabled={currentAiState === "loading"} onClick={explainPlan} type="button" variant="action">
                      <Sparkles aria-hidden="true" /> {currentAiState === "loading" ? t.aiLoading : t.explainPlan}
                    </Button>
                    {currentAiState === "loading" ? <p aria-live="polite" className="muted-copy">{t.aiLoading}</p> : null}
                    {currentAiState === "error" ? (
                      <Alert className="border-destructive/30 bg-destructive/5" variant="destructive">
                        <AlertDescription className="flex flex-wrap items-center gap-3">
                          <span>{t.aiUnavailable}</span>
                          <Button onClick={explainPlan} size="sm" type="button" variant="outline">{t.aiRetry}</Button>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    {currentAiExplanation ? (
                      <div className="ai-result">
                        <section><h4>{t.aiSummary}</h4><p>{currentAiExplanation.summary}</p></section>
                        <section>
                          <h4>{t.aiDrivers}</h4>
                          <ul className="ai-drivers">{currentAiExplanation.keyDrivers.map((driver) => <li key={`${driver.key}-${driver.why}`}><strong>{explanationDriverLabel(driver.key, language)}</strong><span>{driver.why}</span></li>)}</ul>
                        </section>
                        {currentAiExplanation.assumptionsToVerify.length > 0 ? <section><h4>{t.aiVerify}</h4><ul className="intake-list">{currentAiExplanation.assumptionsToVerify.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
                        {currentAiExplanation.nextSteps.length > 0 ? <section><h4>{t.aiNextSteps}</h4><ul className="intake-list">{currentAiExplanation.nextSteps.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
                        <div className="ai-foot">
                          <p>{currentAiExplanation.disclaimer} {t.aiHuman}</p>
                          <Button onClick={copyExplanation} size="sm" type="button" variant="ghost">{aiCopied ? t.aiCopied : t.aiCopy}</Button>
                        </div>
                      </div>
                    ) : null}
                  </Card>
                </div>

                <Card className="chart-card numbers-card">
                  <details>
                    <summary>{t.showNumbers} — {scenarioLabel(focus, t)}</summary>
                    <Table>
                      <TableHeader><TableRow><TableHead>{t.month}</TableHead><TableHead>{t.revenue}</TableHead><TableHead>{t.expenses}</TableHead><TableHead>{t.cashMovement}</TableHead><TableHead>{t.endingCash}</TableHead></TableRow></TableHeader>
                      <TableBody>{forecast.months.map((month) => <TableRow key={month.month}><TableHead>{month.month}</TableHead><TableCell>{currency.format(month.revenue)}</TableCell><TableCell>{currency.format(month.expenses)}</TableCell><TableCell>{currency.format(month.cashMovement)}</TableCell><TableCell data-testid={`ending-cash-month-${month.month}`}>{currency.format(month.endingCash)}</TableCell></TableRow>)}</TableBody>
                    </Table>
                    <p className="muted-copy"><b>{t.calculation}</b> {t.calculationBody}</p>
                  </details>
                </Card>

                <p className="notice"><Info aria-hidden="true" /> <span><b>{t.limitations}:</b> {t.limitationBody} {t.notice}</span></p>
              </>
            )}
          </section>

          {isValid ? (
            <a className="mobile-result no-print" href="#forecast">
              <span className={forecast.cashNegativeMonth !== null ? "is-bad" : "is-good"}>{t.runway}: <b>{cashRunoutText(forecast, t)}</b></span>
              <span>{t.seeAnswer} <ArrowDown aria-hidden="true" /></span>
            </a>
          ) : null}
        </main>
      )}
      <footer><span>เปิดไหว / Perd Wai</span><span>{t.footer}</span></footer>
    </>
  );
}
