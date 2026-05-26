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
npm install @mosvera/provider-heygen
npm install @mosvera/provider-google
npm install @mosvera/provider-runway
npm install @mosvera/provider-elevenlabs
npm install @mosvera/provider-firefly
npm install @mosvera/provider-meshy
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
| [`heygen/`](./heygen/) | HeyGen avatar video | Avatar-video surface, deterministic style/motion payload emission, async video status polling; returns a `video` artifact instead of images. |
| [`google/`](./google/) | Google Gemini image and Veo video | One package with still-image and short-video adapters; optional execution reads `GOOGLE_GEMINI_API_KEY` or `GOOGLE_API_KEY`. |
| [`runway/`](./runway/) | Runway Gen-4 image and Gen-4.5 video | Image/reference and short-video payload adapters with async task polling; optional execution reads `RUNWAY_API_KEY`. |
| [`elevenlabs/`](./elevenlabs/) | ElevenLabs TTS | Audio narration payloads; optional execution reads `ELEVENLABS_API_KEY` and keeps `voice_id` in provider configuration. |
| [`firefly/`](./firefly/) | Adobe Firefly Image | Firefly image payloads with token/client credential support; optional execution reads Firefly environment credentials. |
| [`meshy/`](./meshy/) | Meshy text-to-3D | Text-to-3D preview/refine payloads; optional execution reads `MESHY_API_KEY`. |

The deterministic boundary is `emit()`: same canonical composition, adapter,
and manifest produce byte-identical payloads. `execute()` is the
non-deterministic provider network boundary.

Prompt-like provider options are treated as user intent, not as replacements
for Mosvera. For prompt-only surfaces, adapters keep the supplied
`providerOptions.prompt` or `providerOptions.prompt_text` first and append a
`Mosvera aesthetic direction:` block compiled from the resolved aesthetic. For
speech/avatar surfaces, adapters keep user content fields such as `text` or
`script` as the spoken script and carry aesthetic direction through provider
style/motion fields where available.

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

## Phase 6J Video Adapter

`heygen/` — HeyGen avatar video extends the provider line beyond still images.
It keeps Mosvera aesthetics provider-neutral while allowing applications to
compile the same named aesthetic into an avatar-video payload. Live execution
is optional and reads `HEYGEN_API_KEY`; MCP remains compile-only for provider
payloads.

## Phase 6L Multi-Modal Expansion

`google/`, `runway/`, `elevenlabs/`, `firefly/`, and `meshy/` expand the
reference set across image, video, audio, and 3D model surfaces. The shared
provider contract now allows generated artifacts with `image`, `video`,
`audio`, and `model_3d` kinds while keeping the original `images` field for
compatibility with existing image adapters.

Live execution remains optional and local. Manual smoke scripts read provider
credentials from environment variables, write generated media only to ignored
`test/output/` directories, and are never part of CI.

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
| `heygen/` | HeyGen avatar-video adapter, tests, and manual execution script. |
| `google/` | Google Gemini image and Veo short-video adapters, tests, and manual execution script. |
| `runway/` | Runway Gen-4 image and Gen-4.5 short-video adapters, tests, and manual execution script. |
| `elevenlabs/` | ElevenLabs TTS adapter, tests, and manual execution script. |
| `firefly/` | Adobe Firefly image adapter, tests, and manual execution script. |
| `meshy/` | Meshy text-to-3D adapter, tests, and manual execution script. |
| `test/` | Cross-adapter and emission-vector tests. |

## License

Apache-2.0 per
[ADR-0001](https://github.com/mosvera/spec/blob/main/docs/decisions/0001-license-choice.md).
