# Research: model provider APIs (2026-11-12)

Purpose: the facts the provider interface in `../plan.md` section 5 rests on.

Evidence tags: **[O]** official page read today through a summarising fetcher (wording and numbers must be rechecked against the page before anything is hard-coded); **[K]** the `claude-api` skill bundled with this session (cached 2026-11-03); **[R]** already recorded in this repository (`packages/core/src/price-table.ts`, verified 2026-11-11); **[S]** secondary; **[?]** could not confirm. No API key was used and no request was sent to any provider.

Model names that appear in fetched pages (for example "GPT-5.6", "Gemini 4") are quoted as the fetcher returned them and are **not** to be written into code or configuration from this file.

## 1. Comparison

| Topic | Anthropic Messages API | OpenAI Responses API | Google Gemini API | Local / self-hosted (Ollama as the reference) |
|---|---|---|---|---|
| Endpoint shape | `POST /v1/messages`; stateless, full history each call [K] | `POST /v1/responses`; items in `input`, items out in `output`; optionally stateful with `previous_response_id` [O] | Docs now lead with an "Interactions API" (`function_call` / `function_result` steps, optional `previous_interaction_id`, stateless with `store=false`); `generateContent` still exists [O] | OpenAI-compatible `/v1/chat/completions` and non-stateful `/v1/responses`; also an Anthropic-compatible `/v1/messages` [O] |
| Tool definition | `name`, `description`, `input_schema` (JSON Schema); `strict: true` needs `additionalProperties: false` and `required` [K] | `type: "function"`, `name`, `description`, `parameters`, `strict`; strict needs `additionalProperties: false` and every property in `required` [O] | `type: "function"`, `name`, `description`, `parameters` (object with `type`, `properties`, `required`); supported schema subset not stated on the page [O / ?] | As the compatible surface; quality depends on the model [O] |
| Tool call returned as | `tool_use` content block: `id`, `name`, `input` (object) [K] | `function_call` output item: `call_id`, `name`, `arguments` (**JSON string**) [O] | `function_call` step: `id`, `name`, `arguments` (**object**) [O] | As the compatible surface |
| Tool result sent as | `tool_result` block in a user message, `tool_use_id`, optional `is_error`; all results of one turn in **one** user message [K] | `function_call_output` item with `call_id` and `output` (string, or image/file array) [O] | `function_result` step with `name`, `call_id`, `result` (content blocks) [O] | As the compatible surface |
| Parallel tool calls | On by default; `disable_parallel_tool_use` [K] | On by default; `parallel_tool_calls: false` gives zero or one [O] | Supported [O] | Model dependent [?] |
| Forcing a tool | `tool_choice` `any` / `tool` return **400 on the current Sonnet, Opus and Fable models**; `auto` and `none` work [K] | `auto`, `required`, a named function, `allowed_tools`, `none` [O] | `auto`, `any`, `none`, `validated`, `allowed_tools` [O] | Ollama chat completions: `tool_choice` **not supported** [O] |
| Structured output | `output_config.format` (JSON schema) [K] | Structured outputs via strict schemas [O, function-calling page only] | Structured output listed for the OpenAI-compatible layer [O] | Model dependent [?] |
| Reasoning state to replay | `thinking` blocks must be passed back unchanged; only the producing model family can read them; history must be append-only on current models [K] | Reasoning items in `output` are appended back with the rest [O, implied by "append the model's output items"] | "Resend the full history, including the model's steps exactly as received"; SDKs handle thought signatures [O] | None |
| Prompt caching | Explicit `cache_control` breakpoints (max 4) or top-level automatic; prefix match; TTL 5 min or 1 h; minimum prefix is model dependent (512 tokens on the current models per the skill, "check before relying") [K] | Automatic; minimum 1,024 tokens on the newest models; retention option (`prompt_cache_options.ttl` `30m` default or `12h` on the newest models; `in_memory` / `24h` on earlier ones); optional `prompt_cache_key` [O] | Implicit caching on by default (2.5 and newer), minimum 2,048 to 4,096 tokens by model; explicit cache objects only on `generateContent` for some models, not in the Interactions API [O] | None; Ollama's `/v1/messages` lists `cache_control` as unsupported [O] |
| Cache usage fields | `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`; `input_tokens` is the uncached remainder [K] | `usage.input_tokens_details.cached_tokens`, plus `cache_write_tokens` [O]; whether `input_tokens` includes the cached part is **[?]** (believed yes; must be tested) | `usage.total_cached_tokens` in the SDKs [O]; relation to total input **[?]** | Not reported |
| Cache pricing | Write 1.25x (5 min) or 2x (1 h), read 0.1x of input [R] | Read "discounted up to 95%"; 0.1x on the newest models [O] | "We automatically pass on cost savings"; rate not on the page [?] | Not applicable |
| Batch | Message Batches: 50% off, up to 100,000 requests or 256 MB, most finish within 1 hour, maximum 24 hours, results kept 29 days, results in any order keyed by `custom_id` [K, R] | Batch API: 50% off, 24 h window, JSONL file upload, one model per file, 50,000 requests or 200 MB [O] | Batch API: 50% of standard cost, target 24 h, expires at 48 h, inline (under 20 MB) or file; creation is **not idempotent** [O] | None; Ollama's `/v1/messages/batches` is unsupported [O] |
| Token counting before a call | `POST /v1/messages/count_tokens` [K] | Not checked [?] | Not checked [?] | Ollama: unsupported on the Anthropic-compatible surface [O] |
| Usage in streams | Final `message_delta` carries usage [K] | Not checked for Responses [?]; chat completions needs `stream_options.include_usage` on compatible servers [O, Ollama page] | Not checked [?] | `include_usage` supported on chat completions [O] |
| Provider-executed tools | Web search, web fetch, code execution, MCP connector run on Anthropic's side [K] | Built-in tools exist (web search, tool search) [O] | Google Search grounding [O] | None |
| Sampling parameters | `temperature`, `top_p`, `top_k` rejected on current models [K] | Not checked [?] | Not checked [?] | Accepted |
| Refusal signalling | `stop_reason: "refusal"` with `stop_details`; optional server-side `fallbacks` (beta) on some models, not on the Haiku tier, not on Batches [K] | Not checked [?] | Not checked [?] | None |
| Key and endpoint | `x-api-key`, `api.anthropic.com` [K] | Bearer key [O] | Gemini API key; OpenAI-compatible base `https://generativelanguage.googleapis.com/v1beta/openai/` ("still in beta") [O] | No key by default; **must be reachable from Cloudflare's network**, so a public HTTPS endpoint or tunnel is required [J] |

## 2. What this means for the interface

1. **One normalised tool-call shape.** Arguments are always an object internally. The OpenAI adapter parses the JSON string and treats a parse failure as an invalid call (returned to the model as an error result, never executed). All adapters validate arguments against the tool's schema themselves; strict modes are a quality aid, not the safety mechanism.
2. **Forced tool choice is not portable.** It fails on Anthropic's current models and on Ollama. The runtime never depends on it: jobs that need structured results use the provider's structured-output feature when the capability flag is set, otherwise a single `emit_result` tool with `auto` plus a bounded retry when no call is made.
3. **Reasoning state is opaque and provider-bound.** The normalised message carries an opaque `providerState` blob per assistant turn. It is replayed byte-for-byte to the same provider and model family, and dropped when the model changes. Consequence: a run never switches model mid-run; a thread may switch between runs.
4. **History is append-only.** Required by Anthropic's current models and harmless elsewhere. Checkpoints store the message list as appended; compaction starts a new run segment from a summary rather than editing history.
5. **Caching differs in kind.** Anthropic needs explicit breakpoints; OpenAI and Gemini cache implicitly on a stable prefix. The portable rule is the same: stable content first (tools, system, Space context), volatile content last. The adapter turns one `cacheBoundary` marker into `cache_control` for Anthropic and ignores it elsewhere.
6. **Usage must be converted to disjoint categories** (uncached input, cache write, cache read, output) before `costMicroUsd` sees it. Anthropic already reports disjoint counts. For OpenAI and Gemini the adapter subtracts cached tokens from total input if the provider counts them inside it. This is the single most likely place for a silent metering error, so each adapter ships with a recorded-response test and the first-run self-test compares our computed cost for one call against the provider's own figure where one exists.
7. **Batch is a capability, not an assumption.** Deck and feed builds use it when present, and fall back to a synchronous call at low priority when absent or when the batch has not ended by the deadline. Gemini batch creation is not idempotent, so the batch id is written to storage before the alarm that submits it returns, and resubmission is keyed on our own job id.
8. **Provider-executed tools stay off for private runs** (M1 backlog item 3). They are expressed as capability flags so that a public research run may use them and the runner can refuse them elsewhere.
9. **Local models need an address Cloudflare can reach.** A Worker cannot call `localhost` or a private network address. Until the `local` runner exists (architecture D3), "local" means "self-hosted behind a public HTTPS endpoint or tunnel that the user controls".

## 3. Tool-name mapping

Later tool names contain a dot (`mail.send`). Provider function names are commonly restricted to letters, digits, underscore and hyphen [? for all four providers; not re-read today]. Each adapter therefore maps `connector.tool` to a wire name (`connector__tool`) and back, and rejects any model-returned name that does not map to a tool offered in that request.

## 4. Sources

- Anthropic: `claude-api` skill (bundled, cached 2026-11-03), files `SKILL.md`, `shared/prompt-caching.md`, `shared/tool-use-concepts.md`, `typescript/claude-api/batches.md`, `shared/platform-availability.md`; prices from `packages/core/src/price-table.ts` (source https://platform.claude.com/docs/en/about-claude/pricing, retrieved 2026-11-11).
- OpenAI: https://developers.openai.com/api/docs/guides/function-calling , https://developers.openai.com/api/docs/guides/prompt-caching , https://developers.openai.com/api/docs/guides/batch
- Google: https://aistudio.google.com/docs/function-calling , https://aistudio.google.com/docs/caching , https://aistudio.google.com/docs/batch-api , https://aistudio.google.com/docs/openai (these are where `ai.google.dev/gemini-api/docs/...` redirected today)
- Ollama: https://docs.ollama.com/api/openai-compatibility , https://docs.ollama.com/api/anthropic-compatibility

## 5. Not verified, and needed before the second adapter is specified

- Whether OpenAI `input_tokens` and Gemini total input include cached tokens.
- Function-name character rules for each provider.
- Usage reporting in streamed OpenAI Responses and Gemini calls.
- Gemini cached-token price and the supported JSON Schema subset.
- OpenAI and Gemini refusal and safety-block signalling.
- Current prices for any non-Anthropic model (none are recorded anywhere in this repository; each needs its own dated, sourced table).
- Whether OpenAI and Google terms place any restriction on a bring-your-own-key, user-deployed application (the Anthropic equivalent is risk R5).
