<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# @mosvera/provider-elevenlabs

ElevenLabs text-to-speech provider for Mosvera.

`elevenlabs-tts` compiles resolved Mosvera voice/tone intent into an
ElevenLabs speech payload. `emit()` is deterministic and performs no network
calls. `execute()` is optional and reads `ELEVENLABS_API_KEY`.

`voice_id`, model overrides, and output format are provider execution options;
they do not belong in Mosvera documents.
