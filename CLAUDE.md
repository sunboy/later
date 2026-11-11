# Later

Open-source personal agent team that runs in the user's own Cloudflare account on their own Anthropic API key. We host nothing on the request path.

Read `docs/architecture.md` before changing anything structural. Work packages live in `docs/specs/`.

## Non-negotiables

1. **Side effects are gated by code, never by the model.** Anything that sends, pays, shares, posts or deletes goes through the policy gate in `@later/core`. No tool call bypasses it.
2. **Approvals bind to exact arguments.** An approval is valid for one tool call whose argument hash matches. Never render an approval from a model-written summary.
3. **Spend is capped before a run starts.** Every model call reserves budget first. Money is integer micro-USD; never floats.
4. **The model emits data, not UI.** Cards are typed data validated by `@later/protocol`. No HTML or markup from the model reaches a client.
5. **Templates are declarative.** No executable code in a template manifest. Unknown keys are rejected.
6. **No user data or keys on infrastructure we operate.**
7. **Space isolation.** Memory, connector scopes and budgets are per Space.

## Stack

- pnpm workspaces, Node 22, TypeScript strict, ESM only.
- `packages/protocol`: schemas and types shared by everything (zod). No other runtime dependencies.
- `packages/core`: pure, runtime-agnostic domain logic. No I/O, no clock or randomness except through injected parameters.
- Later: `apps/worker` (Cloudflare Workers, Durable Objects), `apps/web` (React, Tailwind, installable web app).
- Tests: vitest. `pnpm check` runs typecheck, lint and tests and must pass before any commit.
- Licence: Apache-2.0.

## Conventions

- Prefer pure functions and explicit state reducers. Inject time (`now: Date`) and ids.
- Return `Result` values for expected failures; throw only for programmer errors.
- Model ids, prices and API details are never written from memory. Check current documentation, and keep prices in the versioned price table.
- Research figures in `docs/` tagged `[?]` or `[S]` are unverified. Do not hard-code them.
- British spelling in docs; code identifiers in American spelling where an API dictates it.
- Do not add dependencies without a stated reason in the pull request or commit.

## How work is done

- The architect writes a spec with acceptance criteria. An implementation agent builds it. A separate agent writes tests from the spec without reading the implementation's internals. A third runs them. The architect reviews the diff.
- Third-party app screenshots used for design research must never be committed.
