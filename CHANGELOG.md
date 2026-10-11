# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project is pre-1.0 and has no
release tags yet.

## [Unreleased]

### Added

- Live dashboard: every assumption has a slider and a number field, and all charts update
  as you type or drag.
- Cash chart (Recharts) showing money from opening day through month 6, with a slow-to-good
  sales band, a red "out of money" line, hover tooltips, and a "how to read this" caption.
- Break-even bullet chart, monthly "where the money goes" breakdown, and ranked
  "which numbers matter most" bars.
- Plain-language answer card ("Can your café survive 6 months?") with a summary sentence built
  from the calculated numbers, one next action, and a link to the number to double-check first.
- New plans start from the example café's numbers, each tagged "Example" with a Keep button,
  plus a banner counting how many numbers are still examples.
- Automatic slow/good sales cases (±25% customers, ±10% price and cost); editing them is
  optional under an "Advanced" section with a reset to automatic.
- Fixed bottom answer bar on phones.

### Changed

- Replaced the five-step wizard and review step with the single live dashboard.
- Rewrote Thai and English copy in everyday language (e.g. "Slow sales / As planned / Good
  sales", "Your own pay per month", "Customers you need per day").
- Customers needed per day are shown as whole people, rounded up.
- Money inputs show thousands separators from the start (`300,000`).
- Larger text sizes throughout for readability.
- AI-drafted plans fill unmentioned numbers with example values (tagged "Example") instead of
  zeros.
- Saved plans gain `customRanges` and `confirmed` fields; plans saved by earlier versions still
  load, with all their numbers treated as the user's own.

### Removed

- Wizard step navigation, review step, and the scenario range slider; choosing a case now
  happens from the scenario cards under the cash chart.

### Internal

- Split `app/ui/simulator.tsx` into `content.ts` (copy and formatting), `charts.tsx`,
  `plan-inputs.tsx`, and the simulator shell.
- Added `recharts@3.10.1`.
- Rewrote the Playwright critical-path suite for the new flows (10 tests × desktop and mobile).
