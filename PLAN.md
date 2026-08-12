# เปิดไหว (Perd Wai)

## Thai Business Launch Simulator

### Product promise

> Test your business idea with real numbers before you spend your savings.

## 1. Product goal

Help a first-time Thai entrepreneur decide whether a small business is financially viable before opening it.

The first version will focus on one business type: a small café or drink shop.

## 2. Target user

A person who wants to open a café but does not have strong financial or accounting knowledge.

They need to understand:

- How much money they need to start
- How many customers they need each day
- When they will break even
- How long their cash will last
- What could cause the business to fail

## 3. Main user journey

```text
Choose business → Enter assumptions → See forecast → Test scenarios
→ Learn what matters → Make a decision → Export a summary
```

## 4. MVP inputs

- Location and opening date
- Initial capital
- Rent and deposit
- Equipment and renovation
- Average order value
- Variable cost per order (ingredients, packaging, and delivery)
- Expected customers per day
- Operating days per month
- Staff and wages
- Utilities
- Marketing budget
- Owner withdrawal
- Optional tax/fees reserve
- Optional loan amount and repayment

## 5. MVP outputs

- Startup capital required
- Monthly revenue
- Monthly expenses
- Gross profit and gross margin
- Break-even sales
- Break-even customers per day
- Six-month cash-flow forecast
- Month when cash becomes negative
- Cash runway
- Best-case, base-case, and worst-case scenarios
- Three assumptions with the biggest effect on survival

## 6. Financial formulas

Use transparent deterministic formulas. Do not let AI invent financial numbers.

```text
Revenue = customers per day × open days × average order value
Orders = customers per day × open days
Variable cost = orders × variable cost per order
Variable-cost percentage = variable cost ÷ revenue
Gross profit = revenue − variable cost
Monthly cash movement = cash inflows − cash outflows
Ending cash = opening cash + monthly cash movement
Break-even revenue = fixed costs ÷ gross-margin percentage
Break-even customers/day = break-even revenue ÷ open days ÷ average order value
```

Every result must include a “How is this calculated?” explanation.

Use ranges when the user is uncertain. Never present one forecast as guaranteed.

### Resolved MVP modeling rules

- The base case is always entered or confirmed by the user.
- Optimistic and pessimistic cases use low, expected, and high values for customers per day, average order value, and variable cost per order. The engine derives variable-cost percentage and gross margin. A one-at-a-time sensitivity analysis across all adjustable numeric inputs identifies the three assumptions with the biggest effect on survival.
- Startup costs occur in month 0. Rent, wages, utilities, marketing, owner withdrawal, loan repayment, and other operating costs occur monthly.
- Loan support uses the user-entered monthly repayment. Interest, fees, and lender approval are not calculated by the MVP; they must be included in that repayment amount.
- Seasonality is explicitly out of scope for the first release. The forecast represents a steady average month and labels this limitation beside the chart.
- Tax and VAT are not calculated. The user may enter a tax/fees reserve as an optional cash outflow, and the interface must state that the result is not tax or financial advice.
- Viability is a planning signal, not a promise:
  - **Start validating**: the base case stays cash-positive through month 6 and reaches break-even within six months.
  - **Revise the plan**: the base case stays cash-positive but misses the break-even condition, or the pessimistic case runs out of cash.
  - **Delay opening**: the base case becomes cash-negative during the six-month forecast.
- Every recommendation must show the conditions that triggered it and link back to the relevant assumptions.

## 7. Core feature: scenario simulator

The user can change one assumption and immediately see the impact.

Example:

```text
Customers per day: 60 → 45
Cash runs out: Month 7 → Month 3
Recommendation: reduce fixed costs, increase price, or delay opening
```

Scenarios:

- Optimistic
- Base case
- Pessimistic

## 8. StudyTech learning layer

The app teaches through decisions instead of long courses.

Examples:

- Explain gross margin beside the result.
- Show why rent affects runway.
- Ask which costs the user can control.
- Explain why profit and cash are different.
- Give a practical task, such as interviewing five customers or obtaining three supplier quotes.

## 9. Delivery plan

Implementation status as of 2026-08-12: Phases 1–3 are complete locally except public deployment. The UX research recommendations that can be resolved in software are implemented and covered by desktop/mobile browser journeys. Phase 0 interviews, expert review, and Phase 4 user validation remain external gates and have not been fabricated.

### Phase 0 — Validate, 3–5 days

- Interview three aspiring entrepreneurs.
- Interview two Thai accountants or business mentors.
- Collect realistic café cost assumptions.
- Prototype the input form and cash-flow chart.
- Use the Phase 0 validation kit in `validation/` to record comparable evidence.
- Use the dependency-free prototype in `prototype/` for the first five usability sessions.

Success gate: at least 4 of 5 interview participants can complete the prototype without coaching, correctly explain cash runway, and name a concrete next action. At least two accountants or café mentors must review the model boundaries and identify no critical formula or interpretation error.

### Phase 1 — Financial engine, 3–4 days

- Define TypeScript input and output schemas.
- Implement projection functions.
- Implement scenario comparison.
- Test revenue, costs, break-even, loan repayment, and negative-cash cases.
- Add test-only café fixture data; do not present unvalidated fixture values as recommendations.

Success gate: identical inputs always produce identical outputs.

### Phase 2 — MVP interface, 1–2 weeks

- Build Thai/English onboarding.
- Build the step-by-step assumption form.
- Add a review-assumptions step with direct Change actions before calculation.
- Build the cash-flow dashboard.
- Add editable assumptions and instant recalculation.
- Add learning explanations.
- Add start/revise/validate recommendation.
- Add PDF and CSV export.
- Keep plans in local browser state for the MVP; exports are the persistence mechanism.

### Phase 3 — Portfolio quality, 4–7 days

- Responsive mobile layout
- Loading, empty, validation, and error states
- Keyboard navigation
- Accessible chart alternatives
- Semantic design tokens, Thai-capable local typography, and currency-aware money inputs
- Playwright critical-path test
- Public deployment
- Architecture and product case study

### Phase 4 — User validation, 1 week

- Give the prototype to five potential founders.
- Ask each person to create a scenario without help.
- Record confusion and abandonment points.
- Compare assumptions with an accountant or café operator.
- Measure whether the result changes their decision or next action.

## 10. Recommended stack

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL or Supabase
- Vitest
- Playwright
- Accessible chart library
- PWA support after the web version works

PostgreSQL/Supabase and authentication are post-validation options, not MVP dependencies.

## 11. Do not build initially

- Full accounting or POS
- Bank integrations
- Loan approval or credit scoring
- Tax filing
- Investor matching
- Native mobile apps
- AI-generated financial assumptions without confirmation
- Support for every business type
- User accounts, cloud sync, and saved-plan history

## 12. Success metrics

- Percentage completing the assumption form
- Time to first forecast
- Percentage creating a second scenario
- Percentage understanding the cash-runway result
- Number of exported plans
- Number of users who change a decision after using the simulator

The most important metric is:

> Scenario completion followed by a concrete decision.

Phase 4 passes when at least 4 of 5 users complete a scenario without help and at least 3 of 5 take a concrete next action or change their launch decision. If fewer than 3 understand why cash runs out, revise the model explanation before adding features.

## 13. Portfolio deliverables

1. Live demo
2. GitHub repository
3. Architecture diagram
4. Financial-model explanation
5. Unit and end-to-end test report
6. Responsive screenshots
7. Research and interview summary
8. Limitations and future improvements

### Portfolio headline

> Designed and built a Thai-first business launch simulator that helps first-time entrepreneurs stress-test cash flow before opening a business.

## 14. Resolved product decisions

| Question | Decision | Why |
|---|---|---|
| Where do assumptions come from? | Start with user-entered values. Add reference ranges only after Phase 0 interviews, with a visible source note and date. | Prevents false precision and unsupported defaults. |
| How are uncertain values handled? | Use low/expected/high values for the three sensitivity drivers; keep fixed costs explicit. | Makes scenarios understandable and auditable. |
| How are seasonality, tax, and VAT handled? | Exclude calculations from MVP; show steady-demand and tax/VAT limitations, with an optional reserve line. | Keeps the model explainable while avoiding misleading accounting claims. |
| How are loans handled? | Accept loan proceeds and the user's monthly repayment; do not calculate approval, interest, or credit risk. | Covers cash impact without pretending to be a lending tool. |
| What counts as viable? | Use the three deterministic recommendation states above, based on six-month cash position and break-even timing. | Gives users an actionable signal without claiming certainty. |
| Do users need accounts? | No. Use local state plus CSV/PDF export until validation proves saved plans are valuable. | Removes authentication, privacy, and support costs from the first test. |
| What is the first release proving? | That users understand the forecast well enough to make a concrete decision. | Ties delivery to the product promise rather than feature count. |
| What should a first-time visitor see? | A Thai-first choice between creating a blank plan and exploring a clearly labeled example; do not silently present fixture data as the user's plan. | Establishes trust and avoids false ownership of example assumptions. |
| How should the assumption form be structured? | Four progressive stages, contextual field guidance, and optional loan/tax sections using locally owned shadcn primitives. | Reduces initial cognitive load while keeping the model auditable. |
| What should the result prioritize? | Recommendation rationale, the most sensitive assumption, and one concrete next action before detailed metrics and tables. | Turns a forecast into a decision aid instead of a data dashboard. |
