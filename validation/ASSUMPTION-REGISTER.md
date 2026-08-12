# Perd Wai — Assumption Register

Use this register to separate user-provided assumptions from evidence-backed reference ranges. Do not add a default number without a source and date.

## Status values

- `unverified` — user estimate or unresolved question
- `observed` — reported by one participant
- `triangulated` — supported by at least two independent participants or a credible business source
- `approved` — reviewed for MVP use by an accountant, operator, or mentor
- `rejected` — inconsistent, out of scope, or too uncertain for a default

## Register

| Assumption | Unit | Low | Expected | High | Source / participant IDs | Date | Status | Notes / limitation |
|---|---|---:|---:|---:|---|---|---|---|
| Average order value | THB/order |  |  |  |  |  | unverified |  |
| Customers per day | customers/day |  |  |  |  |  | unverified |  |
| Variable cost per order | THB/order |  |  |  |  |  | unverified | Include ingredients, packaging, and delivery. |
| Rent | THB/month |  |  |  |  |  | unverified | Record location type and floor area context. |
| Deposit | months of rent |  |  |  |  |  | unverified |  |
| Equipment and renovation | THB one-time |  |  |  |  |  | unverified | Separate essential from optional spend. |
| Staff wages | THB/month |  |  |  |  |  | unverified | Record headcount and working hours. |
| Utilities | THB/month |  |  |  |  |  | unverified |  |
| Marketing | THB/month |  |  |  |  |  | unverified |  |
| Owner withdrawal | THB/month |  |  |  |  |  | unverified |  |
| Tax/fees reserve | THB/month |  |  |  |  |  | unverified | Not a tax calculation. |

## Rules

1. Preserve the original source wording and context in interview notes.
2. Never merge different locations, shop sizes, or operating models into one range without recording the distinction.
3. Use ranges in the simulator when evidence disagrees.
4. If evidence is insufficient, leave the value blank and require the user to enter it.
