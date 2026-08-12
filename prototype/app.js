import {
  DEMO_INPUTS,
  EMPTY_INPUTS,
  calculateComparison,
  validateInputs
} from "./engine.js";

const form = document.querySelector("#assumptions-form");
const scenarioInput = document.querySelector("#scenario-customers");
const scenarioValue = document.querySelector("#scenario-customers-value");
const resultPanel = document.querySelector("#results");
const validationPanel = document.querySelector("#validation-message");
const chart = document.querySelector("#cash-chart");
const tableBody = document.querySelector("#cash-table-body");
const demoButton = document.querySelector("#load-demo");

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});
const number = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });

const labels = {
  initialCapital: "Initial capital",
  rent: "Monthly rent",
  depositMonths: "Rent deposit (months)",
  equipmentRenovation: "Equipment + renovation",
  averageOrderValue: "Average order value",
  variableCostPerOrder: "Variable cost per order",
  customersPerDay: "Expected customers/day",
  openDays: "Opening days/month",
  staffWages: "Staff wages/month",
  utilities: "Utilities/month",
  marketing: "Marketing/month",
  ownerWithdrawal: "Owner withdrawal/month",
  taxReserve: "Tax/fees reserve/month",
  loanAmount: "Loan proceeds",
  loanRepayment: "Loan repayment/month"
};

function readForm() {
  return Object.fromEntries(
    [...form.elements]
      .filter((element) => element.name)
      .map((element) => [element.name, element.value])
  );
}

function formatMoney(value) {
  return Number.isFinite(value) ? currency.format(value) : "—";
}

function formatNumber(value) {
  return Number.isFinite(value) ? number.format(value) : "—";
}

function renderValidation(errors) {
  const entries = Object.entries(errors);
  validationPanel.hidden = entries.length === 0;
  validationPanel.innerHTML = entries.length
    ? `<strong>Check these inputs:</strong><ul>${entries
        .map(([key, message]) => `<li>${labels[key]}: ${message}</li>`)
        .join("")}</ul>`
    : "";
}

function renderRecommendation(forecast) {
  const tone = forecast.recommendation === "Start validating" ? "positive" : "caution";
  document.querySelector("#recommendation").className = `recommendation ${tone}`;
  document.querySelector("#recommendation-title").textContent = forecast.recommendation;
  document.querySelector("#recommendation-copy").textContent =
    forecast.recommendation === "Start validating"
      ? "The base case stays cash-positive for six months and reaches break-even. Validate the assumptions with real customers and supplier quotes before committing money."
      : forecast.recommendation === "Delay opening"
        ? "The model reaches negative cash during setup or the six-month forecast. Reduce startup or monthly costs, increase demand confidence, or delay opening."
        : "The base case needs revision before opening. Test price, demand, or controllable costs and confirm the assumptions with evidence.";
}

function renderChart(months) {
  const values = months.map((month) => month.endingCash);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  chart.innerHTML = months
    .map((month) => {
      const height = Math.max(8, (Math.abs(month.endingCash) / span) * 100);
      const position = month.endingCash >= 0 ? "above" : "below";
      return `<div class="bar-column">
        <span class="bar-value ${position}">${formatMoney(month.endingCash)}</span>
        <div class="bar-track"><div class="bar ${position}" style="height:${height}%"></div></div>
        <span class="bar-label">Month ${month.month}</span>
      </div>`;
    })
    .join("");
}

function renderTable(months) {
  tableBody.innerHTML = months
    .map(
      (month) => `<tr>
        <th scope="row">Month ${month.month}</th>
        <td>${formatMoney(month.revenue)}</td>
        <td>${formatMoney(month.expenses)}</td>
        <td class="${month.endingCash < 0 ? "negative" : "positive-number"}">${formatMoney(month.endingCash)}</td>
      </tr>`
    )
    .join("");
}

function render(values, scenarioCustomersPerDay) {
  const comparison = calculateComparison(values, scenarioCustomersPerDay);
  const forecast = comparison.base;
  const scenario = comparison.scenario;

  resultPanel.hidden = false;
  document.querySelector("#startup-cost").textContent = formatMoney(forecast.startupCosts);
  document.querySelector("#monthly-revenue").textContent = formatMoney(forecast.monthlyRevenue);
  document.querySelector("#monthly-expenses").textContent = formatMoney(forecast.monthlyExpenses);
  document.querySelector("#gross-margin").textContent = `${formatNumber(forecast.grossMargin * 100)}%`;
  document.querySelector("#break-even").textContent = `${formatNumber(forecast.breakEvenCustomersPerDay)} customers/day`;
  document.querySelector("#cash-runout").textContent =
    forecast.cashRunout === null ? "Not within 6 months" : `Month ${forecast.cashRunout}`;
  document.querySelector("#cash-runout-detail").textContent =
    forecast.cashRunout === null
      ? "The model remains cash-positive through the forecast."
      : forecast.cashRunout === "Before opening"
        ? "Startup costs exceed capital and loan proceeds."
        : `Cash becomes negative after the Month ${forecast.cashRunout} movement.`;
  document.querySelector("#scenario-summary").textContent =
    scenario.cashRunout === forecast.cashRunout
      ? `At ${formatNumber(scenarioCustomersPerDay)} customers/day, the cash-runout month does not change.`
      : `At ${formatNumber(scenarioCustomersPerDay)} customers/day, cash runs out ${scenario.cashRunout === null ? "after the six-month forecast" : `in Month ${scenario.cashRunout}`} instead of ${forecast.cashRunout === null ? "after the six-month forecast" : `Month ${forecast.cashRunout}`}.`;
  document.querySelector("#scenario-ending-cash").textContent = `Scenario ending cash: ${formatMoney(scenario.months.at(-1).endingCash)}`;

  renderRecommendation(forecast);
  renderChart(forecast.months);
  renderTable(forecast.months);
}

function update() {
  const { values, errors } = validateInputs(readForm());
  renderValidation(errors);
  if (Object.keys(errors).length > 0) {
    resultPanel.hidden = true;
    return;
  }

  if (!scenarioInput.dataset.touched) {
    scenarioInput.value = values.customersPerDay;
    scenarioInput.max = Math.max(200, values.customersPerDay * 2);
  }
  const scenarioCustomers = Number(scenarioInput.value);
  scenarioValue.textContent = `${formatNumber(scenarioCustomers)} customers/day`;
  render(values, scenarioCustomers);
}

function setFormValues(values) {
  for (const [key, value] of Object.entries(values)) {
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  }
  scenarioInput.value = values.customersPerDay;
  scenarioInput.min = 0;
  scenarioInput.max = Math.max(200, values.customersPerDay * 2);
  scenarioInput.step = 1;
  update();
}

form.addEventListener("input", update);
scenarioInput.addEventListener("input", () => {
  scenarioInput.dataset.touched = "true";
  update();
});
demoButton.addEventListener("click", () => setFormValues(DEMO_INPUTS));

setFormValues(EMPTY_INPUTS);
