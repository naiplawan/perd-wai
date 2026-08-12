# Architecture

## Objective

Deliver an auditable decision aid for first-time Thai café founders without introducing accounts, a database, or opaque generated assumptions before demand is validated.

## System flow

```text
User assumptions
      ↓
Boundary validation
      ↓
Pure TypeScript financial engine
      ├── Six-month forecast
      ├── Break-even result
      ├── Recommendation state
      ├── Three scenario forecasts
      └── Sensitivity ranking
      ↓
Next.js client interface
      ├── Accessible visual + table output
      ├── Versioned local storage
      ├── CSV export
      └── Browser print / PDF
```

## Components

| Component | Responsibility | Boundary |
|---|---|---|
| `app/lib/finance.ts` | Formulas, forecast, validation, scenarios, sensitivity | Pure and deterministic; no browser or framework imports |
| `app/ui/simulator.tsx` | User input, bilingual presentation, persistence, export | Does not invent financial values |
| App Router shell | Metadata, static route, global presentation | Statically prerendered |
| Local storage | Restore one plan on the same device | Versioned key; no account or cloud sync |
| CSV / print | User-controlled portability | Generated locally; no data upload |

## Key decisions and tradeoffs

- One deployable Next.js application instead of services: lower operational cost and enough scale for validation.
- Pure engine separated from React: formulas are independently testable and reusable.
- Global CSS instead of a design dependency: smaller dependency surface; fewer utility abstractions.
- Local storage instead of PostgreSQL/Supabase: gives up cross-device sync to avoid authentication, privacy, and support costs.
- Native HTML table plus a decorative CSS chart: gives up advanced chart interaction while preserving an accessible numeric equivalent.
- Browser print instead of a PDF library: gives up pixel-identical server PDFs to avoid a large client bundle.
- shadcn/ui source components on Radix with Tailwind CSS variables: adds frontend dependencies in exchange for consistent accessible primitives that remain owned and editable in the repository.

## Financial model boundaries

- Startup cost occurs before Month 1.
- Monthly demand is steady across six months.
- Variable cost is entered per order; gross-margin percentage is derived.
- Loans use user-entered proceeds and repayment, without interest or approval modeling.
- Tax/VAT is not calculated; users may add a reserve cash outflow.
- Recommendations are deterministic planning signals, never guarantees.

## Data and privacy

The MVP has no server-side user data. Inputs remain in the current browser and leave the device only when the user exports or prints them. No analytics are installed.
