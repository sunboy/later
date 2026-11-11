# Later

Later is an open-source personal agent team that runs in your own Cloudflare account, on your own Anthropic API key. We host nothing on the request path.

**Status: pre-alpha.** There is no runnable product yet. This repository currently holds the shared protocol (cards, tools, template manifests) and the safety-critical core (policy gate, approvals, price table, budget ledger), all as pure TypeScript with tests.

- Architecture and decisions: [`docs/architecture.md`](docs/architecture.md)
- Protocol reference: [`docs/protocol.md`](docs/protocol.md)
- Work packages: [`docs/specs/`](docs/specs/)

## Development

Requires Node 22 and pnpm 10.

```sh
pnpm install
pnpm check   # typecheck, lint and tests
```

| Package                                | Purpose                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`@later/protocol`](packages/protocol) | zod schemas and types shared by everything                                                           |
| [`@later/core`](packages/core)         | pure domain logic: policy gate, approvals, pricing, budget ledger ([notes](packages/core/README.md)) |

## Licence

Apache-2.0. See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).
