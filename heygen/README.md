<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-heygen

Translate a resolved Mosvera aesthetic into a deterministic HeyGen
avatar-video payload.

This package follows the same provider contract as the image adapters:

- `emit(canonical, options)` is pure and deterministic. It lowers Mosvera
  palette, imagery, motion, layout, typography, and voice cues into a HeyGen
  avatar-video payload and an assembled direction prompt.
- `execute(payload)` is the optional provider network boundary. It reads
  `HEYGEN_API_KEY` from the environment, creates a video, polls until complete,
  and returns a `video` artifact.

MCP uses this adapter only for deterministic payload compilation. It does not
call HeyGen.

## Install

```sh
npm install @mosvera/provider-heygen
```

## Emit

```ts
import { heygenAdapter } from "@mosvera/provider-heygen";

const emission = heygenAdapter.emit(canonical, {
  providerOptions: {
    avatar_id: "your-avatar-id",
    voice_id: "optional-voice-id",
    script: "Welcome to the Mosvera quickstart.",
    title: "Mosvera quickstart",
  },
});

console.log(emission.payload);
```

Provider execution inputs such as `avatar_id`, `voice_id`, and `script` are
provider configuration. They do not belong in Mosvera aesthetic documents or
packs.

## Execute

```sh
HEYGEN_API_KEY=... \
HEYGEN_AVATAR_ID=... \
npm run execute:manual -w @mosvera/provider-heygen
```

The manual script writes metadata and any downloaded video to
`heygen/test/output/`. That directory is ignored by git.
