# เปิดไหว (Perd Wai)

A Thai-first café launch simulator that helps aspiring founders stress-test startup capital, break-even sales, and six-month cash runway before committing their savings.

## What works

- Thai and English interface
- Honest first-run choice between a blank plan and a clearly labeled example
- Five-stage flow with contextual hints, optional loan/tax sections, and review before calculation
- Currency-aware baht inputs with local formatting and mobile numeric keyboards
- Transparent deterministic financial engine
- Six-month cash-flow forecast
- Pessimistic, base, and optimistic scenarios
- Break-even customers per day
- Start validating / revise plan / delay opening signal
- Recommendation rationale, most-sensitive assumption, and concrete next action
- Top-three sensitivity ranking
- Versioned local browser persistence
- CSV export and print-to-PDF
- Accessible monthly table and responsive layout
- Optional OpenRouter AI explanation with strict response validation and deterministic fallback
- Optional AI-assisted plan intake that drafts only user-provided numbers for review
- Radix-based shadcn/ui primitives with locally owned component source
- Semantic Perd Wai tokens and locally bundled Noto Sans Thai typography

The model deliberately excludes tax/VAT calculation, seasonality, lending approval, and AI-generated calculations or decisions. The optional AI explanation cannot change the deterministic forecast.

## Run locally

Requirements: Node.js 20.9 or newer and pnpm 11.

```bash
pnpm install --ignore-scripts
pnpm dev
```

Open <http://localhost:3000>.

### Optional OpenRouter explanation

Copy `.env.example` to `.env.local` and add an OpenRouter key. The default is pinned to a free model with structured-output support; change `OPENROUTER_MODEL` if you prefer another compatible model.

Provider data collection is denied by default. Set `OPENROUTER_ZDR=true` only when the selected model has Zero Data Retention endpoints available.

```bash
cp .env.example .env.local
```

The explanation route is server-side, sends only validated numeric assumptions and calculated summaries, requests strict JSON, and falls back to the normal forecast when the provider is unavailable.

## Verify

Install Playwright's pinned browser once:

```bash
pnpm exec playwright install chromium
```

Then run:

```bash
pnpm verify
```

The verification ladder runs lint, 14 unit tests, fourteen desktop/mobile E2E journeys, and a production build. The production build uses Next.js's Webpack compiler because Tailwind's PostCSS worker cannot bind its internal IPC port under the managed sandbox used for this project.

## Project map

- `app/lib/finance.ts` — deterministic domain calculations
- `app/lib/ai-explanation.ts` — shared AI response contract and validation
- `app/api/explain-plan/route.ts` — server-side OpenRouter explanation route
- `app/api/draft-plan/route.ts` — server-side OpenRouter intake-draft route
- `app/ui/simulator.tsx` — bilingual simulator and browser-side behavior
- `components/ui/` — shadcn/ui buttons, cards, fields, alerts, badges, and table primitives
- `components/ui/money-input.tsx` — owned currency-input behavior and presentation
- `tests/finance.test.ts` — financial behavior tests
- `tests/e2e/critical-path.spec.ts` — critical founder journeys
- `validation/` — interview guide, evidence rubric, and assumption register
- `prototype/` — dependency-free Phase 0 prototype retained for comparison
- `docs/ARCHITECTURE.md` — system boundaries and decisions
- `docs/TEST-REPORT.md` — verification evidence and remaining gates
- `docs/research/ux-research.md` — sourced UX findings and implementation priorities
- `docs/research/design-system-benchmark.md` — real-world product-system comparison and adopted direction
- `docs/research/llm-binding-perd-wai.md` — LLM/OpenRouter architecture, privacy, and evaluation research

## Validation status

The software is implementation-complete for local validation. It is not market-validated until three aspiring founders and two Thai accountants/operators complete the Phase 0 sessions defined in `validation/`.
