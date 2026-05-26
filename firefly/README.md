<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-firefly

Adobe Firefly provider for Mosvera.

`adobe-firefly-image` compiles a resolved Mosvera aesthetic into an Image5
payload. `emit()` is deterministic and performs no network calls. `execute()`
is optional and reads Adobe Firefly credentials from the environment.

When `providerOptions.prompt` is supplied, the adapter keeps that prompt first
and appends a deterministic `Mosvera aesthetic direction:` block so the user's
requested subject survives while the selected aesthetic still affects the
provider payload.
