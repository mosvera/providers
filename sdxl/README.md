<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-sdxl

Reference SDXL adapter for Mosvera, implemented through Replicate's
`stability-ai/sdxl` model.

## Setup

Install dependencies from the repository root:

```sh
npm install
```

Live execution requires:

```sh
export REPLICATE_API_TOKEN=...
npm run execute:manual -w @mosvera/provider-sdxl
```

`emit()` does not require credentials. It is the deterministic boundary and is
safe to call in tests, MCP tools, and local inspection flows.

## Provider Target

The adapter pins this Replicate model version:

```text
stability-ai/sdxl:2a865c9a94c9992b6689365b75db2d678d5022505ed3f63a5f53929a31a46947
```

## Supported Constructs

| Construct | Lowering action | SDXL mapping |
|-----------|-----------------|--------------|
| `subject` | `native` | Prompt root text |
| `medium` | `approximate` | Prompt style clause |
| `aspect_ratio` | `native` | `width` / `height` |
| `quality` | `approximate` | `num_inference_steps` + `guidance_scale` |
| `safety` | `unsupported` | Warn/drop; no canonical moderation knob |
| `lighting` | `approximate` | Prompt clauses |
| `color_grade` | `approximate` | Prompt clauses |
| `palette.accent` | `approximate` | Prompt clause |
| `lights` | `emulate` | Descriptive prompt clause |
| `color_temperature` | `approximate` | Prompt clause |

## SDXL Configuration

These controls are adapter configuration, not canonical Mosvera constructs:

| Config | Default |
|--------|---------|
| `default_negative_prompt` | `ugly, blurry, low quality, distorted, disfigured` |
| `scheduler` | `K_EULER` |
| `refine` | `expert_ensemble_refiner` |
| `high_noise_frac` | `0.8` |
| `seed` | unset |

Override them by constructing a configured adapter:

```ts
import { SDXLAdapter } from "@mosvera/provider-sdxl";

const adapter = new SDXLAdapter({
  scheduler: "DDIM",
  seed: 1234,
});
```

The default exported `sdxlAdapter` uses the defaults above.

## Differences From OpenAI And FLUX

OpenAI exposes `quality` natively and has an approximate moderation mapping.
Hosted FLUX `pro` exposes safety natively but no quality control. SDXL is the
inverse of that: `quality` maps approximately to sampling controls, while
`safety` is unsupported.

SDXL also has `negative_prompt`, scheduler, and refiner controls. ADR-0013
keeps these fenced in adapter configuration until a cross-provider semantic
construct is justified.

