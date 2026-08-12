# Design-system benchmark for Perd Wai

Date: 2026-08-12

Implementation status: applied locally. Perd Wai now uses semantic shadcn-compatible tokens, locally bundled Noto Sans Thai, an owned currency-input primitive, a review-assumptions stage, focused and linked error recovery, flatter result surfaces, and a textual takeaway plus tabular equivalent for the cash chart.

## Recommendation

Use **Wise Design as the primary product-design reference**, but do not install or copy Wise's branded component library. Keep the existing locally owned shadcn/Radix components and create a **Perd Wai design system** that combines:

1. Wise's financial interaction language, money-specific controls, localization discipline, and concise tone.
2. GOV.UK's researched form, validation, and check-answers patterns.
3. IBM Carbon's result hierarchy, tables, and accessible data-visualization guidance.
4. Shopify Polaris's merchant-facing table and internationalization details.
5. WFP Design System's registry and token architecture as a practical shadcn implementation reference.

This is an inference from the evidence below. No single external system covers Thai typography, financial forecasting, guided forms, accessible charts, and the project's existing shadcn stack equally well.

## Research question

Which real-world product design system is the most suitable reference for a Thai-first café viability simulator that asks non-accountants for financial assumptions and turns a deterministic forecast into a decision?

## Evaluation criteria

The comparison weights the needs of this product rather than general design-system popularity:

| Criterion | Weight |
|---|---:|
| Financial trust and domain relevance | 25% |
| Guided forms and error recovery | 20% |
| Results, tables, and data visualization | 15% |
| Localization and Thai adaptability | 15% |
| Accessibility guidance and evidence | 15% |
| Compatibility with locally owned shadcn components | 10% |

Scores are evaluative judgments, not claims made by the design-system owners.

| Candidate | Weighted fit / 5 | Best contribution | Main limitation for Perd Wai |
|---|---:|---|---|
| Wise Design | **4.45** | Money inputs, summaries, progressive financial flows, localization, trust | Wise's exact visual brand and React packages would create unnecessary coupling |
| GOV.UK Design System | **4.25** | Evidence-backed transactional forms, errors, review and recovery | Visually institutional; limited financial-chart language |
| IBM Carbon | **4.08** | Mature result hierarchy, tables, accessibility, and data visualization | More technical and dense than a first-time founder tool should feel |
| Shopify Polaris | **4.00** | Merchant context, numeric tables, and internationalization | Current implementation targets Shopify surfaces and web components |
| WFP Design System | **3.95** | Exact React 19 + shadcn + Radix + Tailwind + Lucide architecture | Domain and visual brand are humanitarian, not small-business finance |
| Singapore Government Design System | **3.90** | Accessible, reliable, mobile-friendly regional service design | Less specific guidance for financial forecasting and scenario analysis |

## Why Wise is the closest product reference

Wise Design covers product foundations, components, and repeated patterns across web and mobile. Its published component inventory includes Money Input, Summary, Table, Progress Bar, alerts, and form controls—the same interaction families Perd Wai needs. Wise also documents 48 px main actions, 3 px high-contrast input focus, and content designed to expand during translation.

The most relevant principles are:

- Treat money entry as a first-class control rather than a generic number field.
- Keep the main action large and singular.
- Use a summary pattern to make financial details scannable.
- Keep titles and supporting copy concise enough to survive localization.
- Make keyboard focus unmistakable.
- Transcreate for local language and culture instead of merely translating English strings.

Sources:

- https://wise.design/design-at-wise/get-started
- https://wise.design/components
- https://wise.design/components/money-input
- https://wise.design/components/summary
- https://wise.design/foundations/size
- https://wise.design/foundations/focus-states
- https://wise.design/foundations/tone-of-voice
- https://wise.design/patterns/text-stack

### Why not install Wise components

Wise's public web implementation has its own CSS, tokens, providers, React components, and brand assumptions. Perd Wai already owns accessible shadcn/Radix primitives and needs a Thai identity. Installing a second component system would duplicate primitives and split styling and accessibility ownership. Use Wise's interaction principles, not its branded package.

## The strongest real-world analogue: MoneyHelper

MoneyHelper's production Pension Calculator is unusually close to Perd Wai's product logic. It uses a structured five-step journey, deterministic assumptions, scenario adjustments, estimated results, shortfall/surplus presentation, and actionable next steps. Its official transparency record explicitly labels projections as illustrative rather than guaranteed and leaves the final decision with the user. The related Budget Planner is a React-based, deterministic financial tool with category-based inputs, a summary dashboard, export, and personalized recommendations.

This validates Perd Wai's overall journey:

```text
staged assumptions → transparent estimate → adjustable scenario
→ visible risk or gap → concrete next action
```

It does not establish a public MoneyHelper component system to adopt wholesale. For form behavior, GOV.UK provides the stronger reusable pattern library.

Sources:

- https://www.gov.uk/algorithmic-transparency-records/money-and-pensions-service-pension-calculator
- https://www.gov.uk/algorithmic-transparency-records/money-and-pensions-service-budget-planner
- https://www.moneyhelper.org.uk/en/about-us/who-we-are

## What to adopt from GOV.UK

GOV.UK's form patterns have long-running service evidence and are a better source than aesthetic references for error recovery. Its guidance says to preserve users' entered values, explain what happened and how to fix it, place errors next to fields and in a summary, and avoid validating before users have finished unless research shows a need. Its check-answers pattern gives users a second chance to detect errors and recommends showing only relevant sections.

Apply these patterns to Perd Wai:

- Validate a stage when the user selects Continue, not on every keystroke.
- Preserve every assumption after an error.
- Move focus to an error summary when a stage cannot continue.
- Add a compact “Review assumptions” summary before the forecast.
- Let users jump back to one stage and return directly to review/results.
- Keep optional loan and reserve fields absent until selected.

Sources:

- https://design-system.service.gov.uk/patterns/validation/
- https://design-system.service.gov.uk/components/error-message/
- https://design-system.service.gov.uk/patterns/check-answers/
- https://design-system.service.gov.uk/accessibility-statement/

## What to adopt from IBM Carbon

Carbon provides the deepest result and visualization system among the candidates. Its official guidance covers chart selection, comparison and trend displays, dashboard hierarchy, accessible alternatives, and data-table keyboard behavior. It also documents programmatically exposed form errors, helper text, keyboard interaction, and accessible names.

Apply Carbon as an information-architecture reference rather than a component dependency:

- Put the decision and most important metric first; do not make every metric equally prominent.
- Use comparison charts for scenarios and trend charts for runway over time.
- Keep legends, status, and meaning independent of color alone.
- Pair visualizations with a table or structured textual equivalent.
- Keep future dashboards small and task-specific rather than adding every available metric.

Carbon's React library and tokens would compete with the shadcn layer, and its enterprise density is too high for first-time founders. Recreate only the relevant hierarchy and visualization contracts with owned components.

Sources:

- https://carbondesignsystem.com/guidelines/accessibility/overview/
- https://carbondesignsystem.com/components/form/accessibility/
- https://carbondesignsystem.com/data-visualization/chart-types/
- https://carbondesignsystem.com/data-visualization/dashboards/
- https://carbondesignsystem.com/components/data-table/accessibility/

## What to adopt from Shopify Polaris

Polaris is relevant because Shopify serves merchants and treats analytics as operational decision support. Its guidance adds practical details for numeric tables: right-align values, keep decimal precision consistent, make units clear, use semantic table markup, and support responsive overflow. Its data-visualization guidance also requires an alternative data format, sufficient contrast, and meaning that does not depend on color alone.

Perd Wai already pairs its chart with a monthly table. The next design-system step is to formalize this as one reusable `ForecastChart` contract, using Carbon for chart hierarchy and Polaris for merchant-facing table details: every chart must have a short text takeaway and an equivalent table or list.

Sources:

- https://polaris-react.shopify.com/design/data-visualizations
- https://polaris-react.shopify.com/components/tables/data-table
- https://polaris-react.shopify.com/foundations/internationalization
- https://shopify.dev/docs/api/polaris

## What to adopt from WFP and regional government systems

WFP Design System is the closest technical reference: its current documented stack is React 19, TypeScript 5, shadcn/ui, Radix, Tailwind, and Lucide. It demonstrates that an organization can preserve shadcn's locally owned model while adding branded foundations, components, blocks, and governance.

Singapore's government system is a useful regional service reference because it explicitly targets fast, accessible, mobile-friendly, reliable digital services. Neither system should determine Perd Wai's visual identity, but both support a token-led, accessibility-first implementation.

Sources:

- https://designsystem.wfp.org/docs
- https://www.designsystem.tech.gov.sg/

## Implications for the current interface

### Keep

- Locally owned shadcn components and Lucide icons.
- Thai-first language selection.
- Four progressive input stages.
- Clearly labeled example mode.
- Scenario comparison, recommendation rationale, and accessible result table.

### Change in the next design-system pass

1. **Unify tokens.** The current stylesheet has a custom hex palette and a separate set of generic shadcn OKLCH variables. Map all product colors to semantic tokens such as `--background`, `--surface`, `--foreground`, `--border`, `--action`, `--positive`, `--warning`, and `--negative`.
2. **Load real Thai typefaces.** The CSS names Noto Sans Thai and Noto Serif Thai, but the layout loads only Geist's Latin subset. Use a deliberately loaded Thai family and test Thai line height, combining marks, bold weights, and numeric alignment.
3. **Use sans-serif for operational UI.** Keep expressive display type only for the first-run promise. Use the Thai sans family for stages, form labels, metrics, tables, and recommendations.
4. **Create a money-input primitive.** Add an integrated baht suffix, formatting-on-blur, unformatted edit state, right-aligned tabular numerals, hint/error slots, and accessible descriptions.
5. **Reduce card nesting.** Use spacing and dividers for related results; reserve bordered cards for a decision, warning, or independently actionable group.
6. **Add review before calculation.** Present a summary grouped by stage with accessible Change actions.
7. **Standardize visualization contracts.** Every visual needs a sentence-level takeaway, non-color status cue, and equivalent data view.
8. **Document content rules.** Thai labels should be direct, sentence-length help should be short, uncertainty must say “estimate,” and recommendations must pair evidence with one next action.

## Proposed Perd Wai design-system foundation

| Foundation | Direction |
|---|---|
| Product character | Calm, practical, candid, encouraging—not institutional or playful |
| Primary reference | Wise Design interaction and content principles |
| Form behavior | GOV.UK transactional patterns |
| Visualization behavior | IBM Carbon hierarchy and accessibility, with Polaris table details |
| Component architecture | Existing shadcn/Radix ownership, organized like WFP's registry approach |
| Typography | Thai-capable sans for all operational UI; optional restrained display face for marketing heading only |
| Shape | 8–12 px controls, 12–16 px decision surfaces; avoid making every section a floating card |
| Motion | Minimal state feedback; no decorative financial animation |
| Icons | Lucide, 16–20 px in controls, never used without an accessible text label where meaning matters |
| Numbers | Tabular numerals, explicit THB/บาท context, locale formatting, estimates visibly labeled |

## Decision

Do not migrate the application to Carbon, Polaris, GOV.UK Frontend, or Wise's React package. Define a small Perd Wai system on top of the shadcn code already in the repository. Use Wise as the product benchmark, MoneyHelper as the journey benchmark, GOV.UK as the form-behavior authority, Carbon as the result and visualization authority, and Polaris for merchant-facing table details.

This gives the product a credible financial-service language without making it look like another company's product or introducing a second UI runtime.
