<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-meshy

Meshy text-to-3D provider for Mosvera.

`meshy-text-to-3d` compiles resolved Mosvera aesthetics into Meshy preview or
refine payloads. `emit()` is deterministic and performs no network calls.
`execute()` is optional and reads `MESHY_API_KEY`.

When `providerOptions.prompt` is supplied, the adapter keeps that prompt first
and appends a deterministic `Mosvera aesthetic direction:` block so the user's
requested object survives while the selected aesthetic still affects the
provider payload.
