# Research: Should Perd Wai bind an LLM?

**Date:** 2026-08-13
**Question:** What would improve if Perd Wai connected to an LLM, and what should remain deterministic?

## Executive recommendation

Yes, but only as a constrained assistant around the simulator—not as the calculator or the decision-maker.

The best first integration is an optional **Explain this plan** experience. Perd Wai already has a deterministic finance engine in `app/lib/finance.ts`; it validates inputs, calculates the forecast, break-even point, cash runway, scenarios, and recommendation. That engine should remain the source of truth. The LLM should receive the validated inputs and calculated results, then explain them in Thai or English, surface assumptions, and suggest questions to verify.

Do not let the model invent numbers, silently change inputs, calculate the forecast, or tell a user that opening a café is financially safe. Those are high-trust decisions and are better handled by code plus explicit user confirmation.

## What an LLM would genuinely improve

| Use case | Value to the user | Recommendation |
| --- | --- | --- |
| Explain a result in plain Thai/English | Makes terms such as gross margin, break-even, and cash-negative month easier to understand | **Ship first** |
| Turn a user’s free-text idea into draft inputs | Reduces form friction for users who think in sentences rather than fields | **Ship second; draft only** |
| Identify missing assumptions | Helps the user notice that a rent quote, staffing plan, or opening-days estimate is unverified | **Ship with evidence labels** |
| Summarize a scenario comparison | Makes low/base/high assumptions easier to compare | **Ship after explanation** |
| Research local prices, taxes, or regulations | Potentially useful, but requires current sources and retrieval/citations | **Later, separately scoped** |
| Calculate revenue, expenses, or break-even | No meaningful benefit; adds nondeterminism and arithmetic risk | **Keep in code** |
| Decide “open now” / “delay” autonomously | High financial and trust risk | **Do not do this** |

The CFPB’s research on financial chatbots is a useful warning: generative chatbots can provide inaccurate or insufficient information, struggle with complex problems, create privacy/security risks, and leave users in unhelpful loops when there is no clear fallback. That is directly relevant to a financial-planning tool, even though Perd Wai is not a bank. See [CFPB: Chatbots in consumer finance](https://www.consumerfinance.gov/data-research/research-reports/chatbots-in-consumer-finance/chatbots-in-consumer-finance/).

## Recommended architecture

```text
User form
  -> deterministic validation
  -> deterministic finance engine (source of truth)
  -> structured payload: inputs + forecast + scenario results
  -> optional LLM explanation endpoint
  -> schema validation + output safety checks
  -> user-visible explanation with “AI-generated” label
```

1. Keep `validateInputs`, `calculateForecast`, and scenario calculations as the only place that computes financial values.
2. Add a server-side route such as `POST /api/explain-plan`; never expose an API key in the browser.
3. Send only the minimum structured data needed: currency, language, validated inputs, forecast metrics, and scenario summaries. Do not send names, phone numbers, payment details, or raw saved-plan metadata.
4. Ask for a typed response such as:

   ```json
   {
     "summary": "...",
     "keyDrivers": [{"label": "...", "value": "...", "whyItMatters": "..."}],
     "assumptionsToVerify": ["..."],
     "questionsToConsider": ["..."],
     "disclaimer": "..."
   }
   ```

5. Validate the returned schema and ranges on the server. Render only validated fields. If parsing fails or the request times out, show the deterministic result without the AI panel.
6. If a later intake assistant proposes changing inputs, show a diff and require the user to confirm each change before recalculating.

OpenAI’s current API documentation supports the Responses API, function calling, and Structured Outputs. Structured Outputs can enforce a supplied JSON schema, while function arguments still need application-side validation before execution. See the [Responses API reference](https://platform.openai.com/docs/api-reference/responses), [function calling guide](https://platform.openai.com/docs/guides/function-calling), and [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs).

For a new integration, use the server-side Responses API and keep the API key out of client bundles. OpenAI’s authentication reference describes API-key authentication for server requests; a browser should call Perd Wai’s own route instead. See [API authentication](https://platform.openai.com/docs/api-reference/authentication).

## Guardrails that matter for this product

### Make the boundary visible

Label the panel **AI explanation** and keep the calculated cards visually separate. Use copy such as “Numbers are calculated by Perd Wai. The explanation below is generated by AI.” Never present an AI narrative beside a number without showing the deterministic number and its input drivers.

### Separate facts, assumptions, and suggestions

Every statement should be one of:

- **Calculated:** directly derived from the finance engine.
- **User assumption:** supplied by the user.
- **To verify:** a question or missing evidence.
- **General guidance:** non-personalized educational context.

The model should not create a benchmark and present it as a fact. If the user asks for market data, use a separate cited retrieval flow and display the source and date.

### Avoid consequential decisions

Perd Wai can explain why the deterministic recommendation is `start-validating`, `revise-plan`, or `delay-opening`; it should not turn that into a guarantee, loan approval, tax conclusion, or legal advice. If the product later influences lending or eligibility decisions, explainability and adverse-action obligations become a separate compliance project. The CFPB states that creditors using complex algorithms or AI still must provide specific, accurate reasons for adverse actions; see [CFPB Circular 2022-03](https://www.consumerfinance.gov/compliance/circulars/circular-2022-03-adverse-action-notification-requirements-in-connection-with-complex-algorithms/).

### Protect user data

Use data minimization, explicit consent for external processing, a short-lived request by default, and a clear delete/export story. OpenAI states that API inputs and outputs may be retained for up to 30 days by default for abuse monitoring, with zero-data-retention controls available for eligible use cases; the exact endpoint and account settings matter. See [OpenAI enterprise privacy](https://openai.com/enterprise-privacy/) and [API data controls by endpoint](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint).

Treat any free-text field as untrusted input. Do not allow user text to override the system’s role, reveal hidden instructions, or trigger arbitrary tools. For the first version, use no tools at all: send the already-calculated payload and return explanation text only.

Add request rate limits, a hashed per-session safety identifier, adversarial prompt-injection tests, and a human/off-ramp for questions outside the product’s scope. These are operational controls, not substitutes for output validation. See OpenAI’s [safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices).

Rate limiting should be implemented at the Perd Wai route as well as configured at the provider project. Handle `429` responses and timeouts without retry storms; use bounded retries with jitter, and record p50/p95 latency, timeout rate, token usage, and cost per explanation. See OpenAI’s [rate-limit guidance](https://developers.openai.com/api/docs/guides/rate-limits), [cost optimization](https://developers.openai.com/api/docs/guides/cost-optimization), and [latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization).

For this Thai product, the Bank of Thailand’s 2025 AI-risk-management policy is a useful local benchmark. It calls for responsible AI, fairness, accountability, transparency, lifecycle testing, explainability, customer protection, prompt-injection controls, data masking/hashing, input sanitization, and clear third-party data boundaries. It also expects users to be told when they are interacting with AI and to have a human-contact option. See the [Bank of Thailand AI risk-management policy (PDF)](https://www.bot.or.th/content/dam/bot/fipcs/documents/FOG/2568/ThaiPDF/25680178.pdf). This is a design benchmark, not a determination that every provision applies to Perd Wai.

## UX proposal

The LLM should be opt-in and non-blocking:

1. The user completes the existing flow.
2. The result page shows the deterministic forecast immediately.
3. A secondary button, **Explain my plan**, opens an accessible panel or sheet.
4. The panel starts with a two-sentence summary, then shows three cards: **What drives this**, **What to verify**, and **Questions to consider**.
5. A **Copy explanation** action copies the explanation, while **Use these changes** is not shown until a future draft-and-confirm flow exists.
6. The same response schema supports Thai and English; language changes should be explicit and should not alter the underlying numbers.

This keeps the assistant useful without making the user wait for an LLM response or making the interface feel like a generic chat app.

## Additional research findings (2026-08-13)

### Model, cost, and throughput

The explanation task is short, structured, and non-agentic, so it does not need a large reasoning model by default. A current cost-sensitive candidate is GPT-5.6 Luna: its model page lists Responses support, Structured Outputs support, and a price of $0.20 per million input tokens plus $1.20 per million output tokens. Model aliases and prices can change, so the model must be configured rather than hard-coded into product copy. See the [GPT-5.6 Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

Illustrative cost only: a request with 1,500 input tokens and 400 output tokens would be approximately **$0.00078** at those listed rates, before any caching, retries, or other features. At 100,000 such calls, that is approximately **$78**. Actual usage must be measured from API usage records; reasoning tokens, prompt growth, retries, and model changes can change the result.

Do not make the forecast screen wait for the model. Render the deterministic result first, then load the explanation asynchronously. This makes AI latency a progressive enhancement rather than a failure of the core workflow. Add a per-user rate limit and a project spend limit even if the unit cost appears small; the model documentation states that rate limits vary by usage tier and automatically increase as usage and spend increase.

### Data retention is more nuanced than `store: false`

OpenAI’s data-controls documentation says API data is not used to train models by default, but abuse-monitoring logs may contain prompts, responses, and derived metadata and are retained for up to 30 days by default. For `/v1/responses`, application state is retained for 30 days by default or when `store` is true; `store: false` prevents that application-state persistence in the documented cases, but it does not by itself remove abuse-monitoring retention or every feature-specific exception. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

Product consequence: the privacy notice should say that the optional explanation sends the selected financial assumptions and forecast summary to an external AI provider, explain the retention setting in plain language, and provide a no-AI path. Do not describe this as “zero retention” unless the account and endpoint are actually approved and configured for Zero Data Retention.

### Evaluation should be a release gate

OpenAI describes evals as tests for style and content criteria and recommends the loop of defining a task, running test inputs, analyzing results, and iterating. The current Evals platform is scheduled to become read-only on October 31, 2026 and shut down on November 30, 2026, so Perd Wai should keep its core regression set in the repository rather than making product correctness depend on that hosted platform. See [Working with evals](https://developers.openai.com/api/docs/guides/evals).

Create a local fixture set with at least:

- Healthy plan: explanation must not claim certainty or invent benchmarks.
- Cash-negative plan: explanation must mention the negative-cash month and distinguish it from a prediction.
- Break-even miss: explanation must identify the relevant drivers without changing the computed value.
- Invalid or extreme inputs: request is rejected before the model call.
- Thai and English variants: numbers and meaning stay identical across languages.
- Prompt-injection text: the model stays within the explanation schema and ignores instruction-like content in user text.

Score each response for numeric fidelity, assumption traceability, prohibited advice, language quality, schema validity, and useful next steps. A response that sounds polished but changes a number or invents a market fact is a failure.

Do not rely on a model grader alone for financial-domain quality. OpenAI’s grader guidance warns that graders can be hacked or optimized against; calibrate automated checks against human-reviewed examples and keep hard assertions (schema, numeric equality, allowed recommendation enum) in ordinary code tests. See the [graders guide](https://developers.openai.com/api/docs/guides/graders).

### Safety controls should be narrow and testable

OpenAI’s safety guidance recommends moderation, adversarial testing for prompt injection, human oversight for high-stakes uses, constrained input/output, and an easy way for users to report issues. For this MVP, the safest implementation is to accept no free-form prompt at all: the UI sends only the typed language plus the structured calculator payload. If free text is added later, cap its length, treat it as untrusted context, and test it separately. See [Safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices).

### Thailand data-governance implications

The Bank of Thailand’s 2025 AI-risk guideline is formally directed at banks and payment providers, not every café-planning app. It is still a useful local design benchmark because it explicitly covers governance, data/model/cyber risks, and responsible-AI controls. Perd Wai should adopt the applicable product-level controls without presenting the guideline as a legal certification.

The Thai PDPC’s GPPC materials describe personal-data processing broadly as collecting, using, storing, disclosing, and deleting personal data, and emphasize documenting the processing basis and privacy notice. For an explanation-only MVP, the cleanest approach is to keep the payload anonymous and numeric; if the app later stores accounts, contact details, or free-form financial notes, perform a formal PDPA review and maintain a processing inventory. See the [PDPC GPPC privacy materials](https://gppc.pdpc.or.th/privacy-policy/).

Thai government PDPA guidance also describes consent and data-subject rights, including access, correction, objection, and deletion, and discusses security safeguards and breach-notification duties. Treat this as a compliance discovery input—not a substitute for counsel—when deciding whether the external AI request needs a separate consent checkbox or privacy-notice section. See the [Thai government PDPA guidance](https://personal.prd.go.th/th/content/category/detail/id/1832/iid/100260).

If Perd Wai later imports bank or payment data, the Bank of Thailand’s [Your Data guidance](https://www.bot.or.th/en/news-and-media/news/news-20251110.html) is a relevant benchmark for customer consent, standardized sharing, security, and customer protection. That is outside the explanation-only MVP.

## OpenRouter-specific decision

OpenRouter is a good fit for a prototype because it exposes an OpenAI-compatible `/api/v1/chat/completions` endpoint and can be used through the OpenAI SDK by changing the base URL. See the [OpenRouter quickstart](https://openrouter.ai/docs/quickstart).

Use the free tier for development and low-volume demos, but do not treat it as a production reliability guarantee. OpenRouter’s FAQ currently states that free models are limited to 50 requests per day unless at least $10 in credits have been purchased, after which the free-model limit is 1,000 requests per day; it also warns that free models usually have lower limits and are often unsuitable for production. See the [OpenRouter FAQ](https://openrouter.ai/docs/faq).

For reproducible evaluations, avoid `openrouter/free` as the permanent model: that router selects a free model at random, so model behavior can change between requests. Pin a specific model’s `:free` variant when one supports the required features, and keep a fallback response that shows the deterministic result without AI. See the [Free Models Router](https://openrouter.ai/docs/guides/routing/routers/free-router) and [free model variants](https://openrouter.ai/docs/guides/routing/model-variants/free).

Require the provider to support the parameters you send. OpenRouter’s Structured Outputs guide recommends strict JSON Schema and `require_parameters: true`; its routing guide also exposes `data_collection` and `zdr` controls. For this app, the request should prefer:

```json
{
  "provider": {
    "require_parameters": true,
    "data_collection": "deny",
    "zdr": true
  }
}
```

These settings can reduce the available free-provider pool and may cause a request to fail, which is acceptable for financial inputs: fail closed to the non-AI result rather than silently routing to an unknown logging policy. OpenRouter documents that provider policies differ by endpoint and that unclear policies are treated conservatively. See [Structured Outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [Provider Routing](https://openrouter.ai/docs/guides/routing/provider-selection), [Zero Data Retention](https://openrouter.ai/docs/guides/features/zdr), and [Provider Logging](https://openrouter.ai/docs/guides/privacy/provider-logging/).

The practical MVP configuration is therefore: one pinned `:free` model, no tools, strict JSON Schema, `stream: false`, a short output limit, provider privacy filters, a server-side OpenRouter key, and a deterministic fallback. Treat the free model as an experiment surface; if users rely on the explanation, move to a paid pinned model with predictable availability and a reviewed provider policy.

## Phased plan

### Phase 0 — Keep the current deterministic core

Add tests around the finance engine and create a small set of known input/forecast fixtures. This gives the LLM something stable to explain.

### Phase 1 — Explanation-only MVP

Add one server route and one optional result-panel action. Use a pinned model version, a strict response schema, low output length, timeout handling, and no tools. Set `store: false` unless persisted conversations are an explicit product requirement, while reviewing the endpoint’s current retention exceptions. Log only request metadata needed for reliability; avoid storing financial payloads unless the user explicitly opts in. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data#default-usage-policies-by-endpoint).

### Phase 2 — Draft intake assistant

Let the user type: “I expect 60 customers, average ticket 80 baht, rent 20,000.” Return a proposed input diff with field names, parsed values, and uncertainty flags. The user must confirm before the deterministic engine recalculates.

### Phase 3 — Cited research (optional)

If users need local market or regulatory information, add a separate retrieval feature with source URLs, publication dates, and an “information may be outdated” state. Do not mix uncited web research into the core forecast.

## Go / no-go decision

**Go** for a small, optional explanation layer if the product can maintain the deterministic boundary, data-minimization policy, visible AI labeling, and a graceful no-AI fallback.

**No-go** for an always-on chatbot, autonomous financial recommendations, model-generated calculations, or sending raw personal financial records without a reviewed privacy/retention policy.

This document is product and engineering research, not legal, tax, accounting, or investment advice. Before launch, review the data flow against the privacy requirements that apply to the deployment country and user population.

## Primary references

- [OpenAI Responses API reference](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI function calling guide](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs)
- [OpenAI enterprise privacy](https://openai.com/enterprise-privacy/)
- [OpenAI API data controls by endpoint](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)
- [CFPB: Chatbots in consumer finance](https://www.consumerfinance.gov/data-research/research-reports/chatbots-in-consumer-finance/chatbots-in-consumer-finance/)
- [CFPB Circular 2022-03: adverse action notices and complex algorithms](https://www.consumerfinance.gov/compliance/circulars/circular-2022-03-adverse-action-notification-requirements-in-connection-with-complex-algorithms/)
- [OpenAI GPT-5.6 Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
- [OpenAI Working with evals](https://developers.openai.com/api/docs/guides/evals)
- [OpenAI safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices)
- [OpenAI rate limits](https://developers.openai.com/api/docs/guides/rate-limits)
- [OpenAI cost optimization](https://developers.openai.com/api/docs/guides/cost-optimization)
- [OpenAI latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization)
- [OpenAI graders](https://developers.openai.com/api/docs/guides/graders)
- [Thai PDPC GPPC privacy materials](https://gppc.pdpc.or.th/privacy-policy/)
- [Thai government PDPA guidance](https://personal.prd.go.th/th/content/category/detail/id/1832/iid/100260)
- [Bank of Thailand Your Data guidance](https://www.bot.or.th/en/news-and-media/news/news-20251110.html)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
- [OpenRouter FAQ](https://openrouter.ai/docs/faq)
- [OpenRouter Free Models Router](https://openrouter.ai/docs/guides/routing/routers/free-router)
- [OpenRouter free model variants](https://openrouter.ai/docs/guides/routing/model-variants/free)
- [OpenRouter Structured Outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [OpenRouter Provider Routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [OpenRouter Zero Data Retention](https://openrouter.ai/docs/guides/features/zdr)
- [OpenRouter Provider Logging](https://openrouter.ai/docs/guides/privacy/provider-logging/)
