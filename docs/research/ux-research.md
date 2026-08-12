# Perd Wai UX Research

Date: 2026-08-12
Scope: Current local MVP at desktop and 390 × 844 mobile viewport
Audience: First-time Thai café or drink-shop founders with limited accounting experience

## Summary

Perd Wai has a strong visual foundation, clear grouping, transparent formulas, bilingual copy, and a recommendation that now cites the conditions behind it. It is suitable for a supervised usability pilot.

It is not yet ready for an unsupervised public release. The largest risk is not visual polish; it is whether a novice understands which numbers are examples, completes the long form accurately, and turns the forecast into a sound next action.

The recommended UX direction is:

1. Make the first-run state trustworthy and explicit.
2. Stage the 21 numeric controls into a short guided flow, especially on mobile.
3. Present the decision as evidence → meaning → next action.
4. Make Thai the genuine primary experience, including document-language metadata.
5. Validate comprehension with real novice founders before adding product scope.

## Research question

How should Perd Wai improve its UX so a first-time Thai founder can enter assumptions, understand cash risk, and choose a concrete next action without coaching?

## Method and limitations

This review combined:

- Live heuristic inspection in English and Thai at desktop and 390 × 844 mobile sizes.
- Keyboard and accessibility-tree inspection of labels, controls, headings, and results.
- Inspection of first-run state, language metadata, control dimensions, validation, scenario comparison, and decision output.
- Comparison with WCAG 2.2, official government design systems, financial-regulator research, and Bank of Thailand evidence.

This is expert research, not user research. No conclusion here proves that Thai founders understand the product. The existing five-session validation gate remains necessary.

## Current UX strengths

- Inputs are grouped into opening money, sales, and monthly costs.
- Units are visible beside fields.
- The result distinguishes base, pessimistic, and optimistic cases.
- The recommendation now states the break-even gap and pessimistic cash-runout month.
- Limitations are visible and do not claim tax, VAT, interest, or lender approval calculations.
- Inputs have accessible labels, the monthly data has a table alternative, and keyboard navigation works.
- The interface is visually consistent and responsive without broken layout or console errors.

## Prioritized findings

### P0 — Make the first-run state honest

**Observed:** A new visitor immediately receives a fully populated forecast using `DEFAULT_INPUTS`, while the page says that no benchmark is inserted without confirmation. “Load example” is available even though the example is already loaded. “Reset” clears only initial capital and renovation while retaining most example values.

**Risk:** A novice may mistake fixture values for a recommendation or locally realistic benchmark. That weakens trust and conflicts with the product rule that base assumptions must be entered or confirmed by the user.

**Recommendation:** Start with an explicit choice:

- “Create my plan” — empty or guided fields.
- “Explore an example café” — visibly labelled example data that cannot be mistaken for sourced guidance.

Keep an “Example plan” banner visible until the user replaces or confirms the assumptions. Make Reset consistently return to the chosen starting mode.

**Validation:** Ask each participant where the initial numbers came from and whether they believe the app recommends those values. Target 5/5 correct answers.

### P0 — Reduce form burden through meaningful stages

**Observed:** The first task exposes 15 business inputs and 6 scenario inputs at once. On mobile, users scroll through the entire form before reaching the recommendation. Financing fields remain visible even when no loan is used.

**Evidence:** GOV.UK recommends starting complex forms with one meaningful thing per page because this supports focus, mobile use, and error recovery, then combining questions only when user research supports it. The FCA recommends layered content that puts essential information first and reveals detail without overwhelming consumers. [GOV.UK form structure](https://www.gov.uk/service-manual/design/form-structure), [FCA consumer-understanding review](https://www.fca.org.uk/publications/good-and-poor-practice/consumer-understanding-good-practice-areas-improvement)

**Recommendation:** Use four short stages:

1. Money before opening
2. Sales assumptions
3. Monthly operating costs
4. Stress-test the plan

Collapse loan fields behind “Will you use a loan?” and the tax reserve behind an optional-details disclosure. Keep automatic local saving. On desktop, grouped sections may remain on one page if testing shows that comparison speed matters more than staging.

**Trade-off:** More steps reduce visible complexity but add navigation. Test staged mobile flow against the current single-page version rather than treating “one question per page” as a universal rule.

### P0 — Make Thai the real primary experience

**Observed:** The Thai-first product opens in English. After switching all visible content to Thai, the document still reports `lang="en"`. Thai mobile headings also wrap more awkwardly than their English equivalents.

**Evidence:** WCAG 2.2 requires the human language of passages to be programmatically determinable so assistive technology can apply appropriate presentation and pronunciation rules. [W3C WCAG 3.1.2](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html)

**Recommendation:** Default to Thai or choose the initial language from the browser locale. Update the document `lang` when the user switches language, persist that preference, and tune Thai typography independently rather than treating it as translated English copy.

### P0 — Move from dashboard output to a decision aid

**Observed:** The recommendation contains useful evidence, but the practical next task is separated into the later “Model boundaries” card. On mobile, metrics, chart, scenarios, sensitivity, limitations, and table create a long path after the decision.

**Evidence:** FCA experimental research found that information presentation and timing affect financial comprehension; in one treatment, simplified information shown just before a decision improved repayment comprehension from 26% to 40%. The FCA cautions that comprehension remained low, so presentation alone is not sufficient. CFPB principles similarly recommend financial education that is actionable, relevant, timely, and supportive of follow-through. [FCA digital-design experiment](https://www.fca.org.uk/publication/research-notes/digital-design-financial-products-services.pdf), [CFPB five principles](https://www.consumerfinance.gov/data-research/research-reports/effective-financial-education-five-principles-and-how-use-them/)

**Recommendation:** Make the first result block answer four questions:

```text
What did the model find?
Why did it reach that result?
Which assumption matters most?
What should I verify next?
```

Example:

> ปรับแผนก่อน — คุณคาดลูกค้า 45 คน/วัน แต่ต้องได้ประมาณ 56 คน/วันจึงจะคุ้มทุน และกรณียอดขายต่ำเงินสดหมดในเดือน 4 งานถัดไป: นับลูกค้าหน้าร้านจริง 3 วันก่อนตัดสินใจเช่า

Put the detailed chart, model boundaries, and table below this summary as supporting evidence.

### P1 — Explain inputs at the point of use

**Observed:** Units are present, but concepts such as variable cost per order, owner withdrawal, and tax reserve have no short examples. Errors are currently English even when the interface is Thai. Scenario-range errors are summarized rather than attached to the exact low or high field.

**Evidence:** WCAG requires labels or instructions where user input is required and text descriptions of detected errors. GOV.UK recommends concrete number examples, explicit valid ranges, accessible unit prefixes or suffixes, and error messages that tell the user how to correct the value. [W3C labels and instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), [W3C error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/)

**Recommendation:** Add one-line, optional help only where confusion is likely. For example:

- “ต้นทุนผันแปรต่อบิล เช่น วัตถุดิบ แก้ว ฝา และค่าธรรมเนียมที่เกิดทุกออเดอร์”
- “จำนวนวันเปิดต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 31”

Localize all error text and connect each message to its field with `aria-describedby`.

### P1 — Reconsider native number inputs

**Observed:** The recent editable-draft fix resolves clearing and leading-zero behavior, but all financial controls still use native `type="number"`. Decimal scenario values appear as floating-point expansions in Chromium's accessibility representation.

**Evidence:** GOV.UK moved many numeric-data controls to text inputs with numeric or decimal input modes after documenting inconsistent number-input behavior, silent character rejection, accidental wheel changes, and browser rounding. Its current component guidance uses `inputmode` to summon the appropriate mobile keypad and recommends examples for decimal formats. [GOV.UK number-input rationale](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/), [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/)

**Recommendation:** Prototype `type="text"` with `inputmode="numeric"` or `inputmode="decimal"`, accepting pasted values such as `120,000` and normalizing them safely. Do not change this solely from guidance; test Thai keypad, separator, paste, and screen-reader behavior first.

### P1 — Clarify estimates and scenario provenance

**Observed:** The app displays exact baht values from uncertain assumptions. The scenario card does not explain how a founder should choose low and high values, and the result section repeats the label “Scenario ranges” even though it is a comparison. Sensitivity shows cash impact but not the adverse value used.

**Evidence:** UK Government Analysis guidance recommends calling estimates estimates, showing ranges, explaining assumptions and limitations, identifying the uncertainties with the largest impact, and connecting uncertainty to the decision. [Communicating quality, uncertainty and change](https://analysisfunction.civilservice.gov.uk/policy-store/communicating-quality-uncertainty-and-change/)

**Recommendation:**

- Rename the result card “Scenario comparison.”
- Label outputs “estimate based on your assumptions.”
- Explain each scenario's changed assumptions.
- Show sensitivity as “Average order value −10%, ฿75 → ฿67.50; Month 6 cash changes by ฿X.”
- Never attach probabilities unless the model actually estimates them.

### P1 — Correct financial labels before adding more metrics

**Observed:** “Startup capital required” is calculated as deposit plus equipment/renovation. It excludes operating runway, so the label can imply a more complete funding requirement than the calculation provides.

**Recommendation:** Rename it “Upfront setup cost” and show “Cash available after setup” beside it. If the product later claims a total amount required, define the required runway and calculation explicitly.

### P2 — Improve mobile reading density

**Observed:** At 390 px, inputs and action buttons are 32 px tall with roughly 12–13 px text. The layout is functional, but Thai headings wrap into narrow columns, chart labels become very small, and the five-column detail table is compressed.

**Evidence:** WCAG 2.2 defines a 24 × 24 CSS-pixel minimum target or sufficient spacing, while noting that larger targets improve usability. It also requires content at a 320 CSS-pixel equivalent width to reflow without loss of information or functionality, except where two-dimensional layout is essential. [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

**Recommendation:** Increase primary mobile control height and text size, let section headings use full width, replace the compressed table with month cards or a clearly signposted horizontal table, and simplify chart labels. These are usability improvements, not confirmed WCAG failures based on this review alone.

## Thai-user context

The Bank of Thailand's 2024 survey of 12,558 people reports overall financial-literacy performance of 72.6%, while finding comparatively weaker understanding of interest and compound-interest calculations. It also reports that only 23.7% had emergency savings sufficient for six months or more. These findings support plain-language calculations and cash-runway education, but they do not specifically describe novice café founders. [Bank of Thailand 2024 financial-literacy survey](https://www.bot.or.th/th/research-and-publications/articles-and-publications/bot-magazine-issues/phrasiam-69-1/FL-Survey-Report-2567.html)

The design implication is not that Thai users have low capability. It is that general digital familiarity or knowledge of financial vocabulary should not be treated as proof that users can interpret a business cash-flow model correctly.

## Proposed MVP flow

```text
Choose own plan or example
→ Enter opening money
→ Enter sales assumptions
→ Enter monthly costs
→ Confirm assumptions
→ See decision summary
→ Stress-test low/base/high cases
→ Export or take the recommended validation action
```

Scenario testing should remain part of the core outcome, but users should first understand the base case. Advanced accounting, user accounts, cloud history, AI-generated assumptions, and additional business types remain out of scope.

## Validation plan

Test with three aspiring founders and two Thai accountants or café operators. Include at least one participant with lower digital confidence.

Ask participants to complete the plan without coaching, then ask:

1. Which numbers came from you, and which came from the app?
2. How much cash remains after setup?
3. How many customers per day are needed to break even?
4. In which scenario does cash run out, and when?
5. What one action will you take before opening?

Measure:

- Completion without coaching.
- Correct explanation of cash runway and break-even.
- Scenario creation without assistance.
- Concrete next action.
- Field-level errors, backtracking, and abandonment point.
- Whether Thai and English terminology is understood consistently.

Retain the existing gate: at least 4 of 5 complete without coaching and explain cash runway correctly, and at least 3 of 5 take a concrete action or change their launch decision.

## Recommended implementation order

1. Fix first-run example state and Reset semantics.
2. Make language selection and `lang` metadata genuinely Thai-first.
3. Prototype staged mobile inputs and optional financing fields.
4. Consolidate the decision summary and next action.
5. Localize field-level help and errors.
6. Improve scenario and sensitivity explanations.
7. Run five comprehension sessions.
8. Only then decide whether numeric input type, chart design, or broader product features need further change.

## References

- [Bank of Thailand: 2024 financial-literacy survey](https://www.bot.or.th/th/research-and-publications/articles-and-publications/bot-magazine-issues/phrasiam-69-1/FL-Survey-Report-2567.html)
- [CFPB: Effective financial education—five principles](https://www.consumerfinance.gov/data-research/research-reports/effective-financial-education-five-principles-and-how-use-them/)
- [FCA: Consumer understanding—good practice and areas for improvement](https://www.fca.org.uk/publications/good-and-poor-practice/consumer-understanding-good-practice-areas-improvement)
- [FCA: Digital design for financial products and services](https://www.fca.org.uk/publication/research-notes/digital-design-financial-products-services.pdf)
- [GOV.UK: Structuring forms](https://www.gov.uk/service-manual/design/form-structure)
- [GOV.UK Design System: Text input](https://design-system.service.gov.uk/components/text-input/)
- [GOV.UK: Why the number-input guidance changed](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/)
- [UK Government Analysis Function: Communicating quality, uncertainty and change](https://analysisfunction.civilservice.gov.uk/policy-store/communicating-quality-uncertainty-and-change/)
- [W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C: Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)
- [W3C: Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html)
- [W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
