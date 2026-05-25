<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-flux

Reference Mosvera adapter for Black Forest Labs `flux-2-pro`.

## Setup

Install from the workspace root:

```sh
npm install
```

Manual execution requires:

```sh
BFL_API_KEY=... npm run execute:manual -w @mosvera/provider-flux
```

The manual script resolves `examples/cinematic-editorial/composition.json`,
emits a deterministic payload, starts a BFL generation, polls until the result
is ready, downloads the image, and writes generated files under
`flux/test/output/`. It is not run by CI.

When a direct BFL key is not available, the deterministic FLUX emission can be
run through Replicate's official `black-forest-labs/flux-2-pro` model:

```sh
REPLICATE_API_TOKEN=... npm run execute:replicate -w @mosvera/provider-flux
```

That script writes to `flux/test/output-replicate/`. It is a gallery
helper only; the adapter implementation still targets the official BFL API.

## Lowering Summary

| Construct | Action | Provider surface |
|-----------|--------|------------------|
| `subject` | `native` | First prompt clause |
| `medium` | `approximate` | Prompt clause |
| `aspect_ratio` | `native` | Computed `width` / `height` |
| `quality` | `unsupported` | Warn and drop; `flux-2-pro` exposes no quality knob |
| `safety` | `native` | `safety_tolerance` integer |
| `lighting`, `color_grade`, `color_temperature` | `approximate` | Prompt clauses |
| `palette.accent` | `approximate` | Prompt clause |
| `lights` | `emulate` | Descriptive prompt clause |

The emitted request defaults to `output_format: "png"` and
`safety_tolerance: 2`. Execution uses the BFL async polling URL returned by
the start request.
