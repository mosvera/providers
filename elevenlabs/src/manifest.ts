// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const elevenLabsTtsManifest: CapabilityManifest = {
  provider: "elevenlabs-tts",
  adapter_version: "0.1.2",
  constructs: {
    subject: { lowering_action: "approximate", note: "Folded into narration context." },
    medium: { lowering_action: "approximate", note: "Folded into delivery style." },
    quality: { lowering_action: "approximate", note: "Mapped to model/speed defaults where possible." },
    safety: { lowering_action: "unsupported", note: "Safety policy is provider-managed." },
    voice: { lowering_action: "native", note: "Mosvera voice copy becomes text and delivery direction." },
    motion: { lowering_action: "approximate", note: "Motion pace influences delivery direction." },
    typography: { lowering_action: "approximate", note: "Type character informs narration style." },
    palette: { lowering_action: "approximate", note: "Palette mood is folded into delivery context." },
  },
};
