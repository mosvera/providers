<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-google

Google provider adapters for Mosvera.

- `google-gemini-image` compiles a resolved Mosvera aesthetic into a Gemini
  native image-generation payload.
- `google-veo-video` compiles the same model into a short Veo video payload.

`emit()` is deterministic and performs no network calls. `execute()` is
optional and reads `GOOGLE_GEMINI_API_KEY` or `GOOGLE_API_KEY`.

Provider execution options such as model overrides, reference images, and
video duration are passed through adapter options; they are not stored in
Mosvera documents.
