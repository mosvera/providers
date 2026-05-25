<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-openai

Reference Mosvera adapter for OpenAI `gpt-image-1`.

## Setup

Install from the workspace root:

```sh
npm install
```

Manual execution requires:

```sh
OPENAI_API_KEY=... npm run execute:manual -w @mosvera/provider-openai
```

The manual script resolves `examples/cinematic-editorial/composition.json`,
emits a deterministic payload, calls OpenAI, and writes generated files under
`openai/test/output/`. It is not run by CI.

## Lowering Summary

| Construct | Action | Provider surface |
|-----------|--------|------------------|
| `subject` | `native` | First prompt clause |
| `medium` | `approximate` | Prompt clause |
| `aspect_ratio` | `native` | `size` enum |
| `quality` | `native` | `quality` enum |
| `safety` | `approximate` | `moderation` enum |
| `lighting`, `color_grade`, `color_temperature` | `approximate` | Prompt clauses |
| `palette.accent` | `approximate` | Prompt clause |
| `lights` | `emulate` | Descriptive prompt clause |

The emitted request defaults to `model: "gpt-image-1"`, `n: 1`, and
`output_format: "png"`.
