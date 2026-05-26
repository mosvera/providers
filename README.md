<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Mosvera Providers

Reference provider adapters for Mosvera. Each adapter implements the provider
compilation contract: translate Mosvera's canonical composition model into a
specific generative provider payload without leaking provider vocabulary back
into the specification.

The Phase 4 architecture is recorded in
[ADR-0012](https://github.com/mosvera/spec/blob/main/docs/decisions/0012-adapter-emission-architecture.md). The
provider pairing is recorded in
[ADR-0008](https://github.com/mosvera/spec/blob/main/docs/decisions/0008-provider-adapter-pairing.md).

## Which Package Do I Need?

Install `@mosvera/provider-base` only if you are building a new provider
adapter or using the shared emission helpers directly.

Install a concrete provider package when you want to compile resolved Mosvera
intent into that provider's payload shape:

```bash
npm install @mosvera/provider-openai
npm install @mosvera/provider-flux
npm install @mosvera/provider-sdxl
```

Provider packages depend on `@mosvera/runtime` and `@mosvera/provider-base`;
your package manager installs those dependencies automatically.

## Reference Set

| Package | Provider | Surface signal |
|---------|----------|----------------|
| [`_base/`](./_base/) | Shared contract | Adapter interface, lowering table schema, pure clause assembly, `BaseAdapter`. |
| [`openai/`](./openai/) | OpenAI `gpt-image-1` | Sync SDK call, enum-coded `quality`, `moderation`, `size` enum. |
| [`flux/`](./flux/) | BFL `flux-2-pro` | Async polling URL, computed `width` / `height`, `safety_tolerance`; `quality` is unsupported on hosted `pro`. |
| [`sdxl/`](./sdxl/) | SDXL via Replicate | Open-weights aggregator surface, computed `width` / `height`, approximate `quality` via sampling controls, adapter-local negative prompt/refiner config; `safety` is unsupported. |

The deterministic boundary is `emit()`: same canonical composition, adapter,
and manifest produce byte-identical payloads. `execute()` is the
non-deterministic provider network boundary.

## Testing

From the repository root:

```sh
npm install
npm run ci
```

Workspace tests cover the shared assembler and adapter emission
snapshots. `test/` covers cross-adapter structural equivalence and the
language-neutral emission vectors mirrored from
[`mosvera/spec`](https://github.com/mosvera/spec/tree/main/compliance/emission).

## Phase 5 Open-Weights Adapter

`sdxl/` — Stable Diffusion XL via [Replicate](https://replicate.com) lands in
Phase 5 per ADR-0008 and ADR-0013, introducing the open-weights /
community-aggregator axis.

## Phase 8 Motion Adapter

`runway/` — Runway Gen-4 lands in Phase 8 alongside Mosvera's introduction of
motion / temporal primitives.

## Exclusion Policy

Per ADR-0008, **Mosvera does not accept provider adapters that rely on
unofficial or reverse-engineered APIs.** This rules out third-party Midjourney
integrations until and unless a broadly available official Midjourney API
ships. Adapter PRs against unofficial endpoints will be closed.

## Adding A Provider

When the maintainer pool is open to provider contributions, the path is:

1. File a MEP if the existing compilation contract does not cover the
   provider's surface cleanly.
2. Implement against the shared contract in `_base/`.
3. Add a self-contained directory under `<provider-name>/` with its
   own README, adapter implementation, tests, and example composition.

## Layout

| Directory | Purpose |
|-----------|---------|
| `_base/` | Shared adapter contract and emission engine. |
| `openai/` | OpenAI `gpt-image-1` adapter, tests, and manual execution script. |
| `flux/` | BFL `flux-2-pro` adapter, tests, and manual execution script. |
| `sdxl/` | SDXL via Replicate adapter, tests, and manual execution script. |
| `test/` | Cross-adapter and emission-vector tests. |

## License

Apache-2.0 per
[ADR-0001](https://github.com/mosvera/spec/blob/main/docs/decisions/0001-license-choice.md).
