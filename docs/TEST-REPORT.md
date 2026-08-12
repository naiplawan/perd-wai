# Test report

Date: 2026-08-12
Runtime: Node.js 24.15.0
Timezone used by E2E: Asia/Bangkok

## Automated evidence

| Layer | Command | Result | Coverage |
|---|---|---|---|
| Type checking | `tsc --noEmit` | Pass | Strict TypeScript application and tests |
| Lint | `eslint .` | Pass | Next.js Core Web Vitals and TypeScript rules |
| Unit | `vitest run` | 12 passed | Revenue, costs, cash flow, break-even, loans, negative cash, input/scenario validation, cross-scenario recommendations, sensitivity |
| Build | `next build --webpack` | Pass | Optimized static production route generated with Tailwind/shadcn styles |
| E2E desktop | `playwright test --project=chromium` | 6 passed | Thai-first onboarding; example and staged custom flows; review-before-calculation; money-input context; focused error recovery; decision evidence; invalid-result suppression; persistence; export |
| E2E mobile | `playwright test --project=mobile` | 6 passed | Same six critical outcomes at a Pixel 7 viewport |

Playwright captures screenshots and video on failure and traces on the first retry. Tests use roles, labels, and stable domain test IDs without fixed waits.

## TDD evidence

The financial suite was executed before `app/lib/finance.ts` existed and failed on the missing module. The minimum typed engine was then implemented and the original eight tests passed. Four additional unit tests were added before correcting scenario validation and cross-scenario recommendation behavior; they failed first, then passed after the implementation. The first UX redesign began with five failing browser requirements per viewport. The design-system pass added two more failing requirements: review-before-calculation with a textual chart takeaway, and currency-aware fields with focused, linked error recovery. After implementation and consolidation, the suite contains six journeys per viewport and all twelve pass.

## Visual evidence

- [First run — desktop](../dogfood-output/screenshots/first-run-desktop.png)
- [Example forecast — desktop](../dogfood-output/screenshots/example-desktop.png)
- [First run — mobile](../dogfood-output/screenshots/first-run-mobile.png)
- [Example forecast — mobile](../dogfood-output/screenshots/example-mobile.png)
- [Design system first run — desktop](../dogfood-output/screenshots/design-system-first-run-desktop.png)
- [Review and forecast — desktop](../dogfood-output/screenshots/design-system-review-desktop.png)
- [Review and forecast — mobile](../dogfood-output/screenshots/design-system-review-mobile.png)

All four captures were inspected for hierarchy, overflow, form usability, result readability, and responsive stacking. The browser console and page-error stream were clean; only development-mode React tooling notices appeared in the console.

## Remaining validation gates

Automated tests cannot prove that first-time Thai founders understand cash runway or change a real decision. Release to public users remains gated on:

1. Three aspiring-founder sessions.
2. Two Thai accountant/operator reviews.
3. At least four of five participants completing the prototype without coaching and explaining cash runway correctly.
4. No critical formula or interpretation issue from expert review.

Public deployment is also unperformed because no hosting account or target was supplied.
