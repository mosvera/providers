<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-runway

Runway provider adapters for Mosvera.

- `runway-gen4-image` compiles a named aesthetic into a Gen-4 image payload.
- `runway-gen45-video` compiles a named aesthetic into a short Gen-4.5 video
  payload.

`emit()` is deterministic and performs no network calls. `execute()` is
optional and reads `RUNWAY_API_KEY`.

When `providerOptions.prompt_text` is supplied, the adapter keeps that prompt
first and appends a deterministic `Mosvera aesthetic direction:` block so the
user's requested subject survives while the selected aesthetic still affects
the provider payload.
