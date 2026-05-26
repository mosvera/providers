// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const heygenManifest: CapabilityManifest = {
  provider: "heygen-avatar-video",
  adapter_version: "0.1.1",
  constructs: {
    subject: { lowering_action: "approximate", note: "Folded into avatar-video direction." },
    medium: { lowering_action: "approximate", note: "Folded into avatar-video direction." },
    aspect_ratio: { lowering_action: "approximate", note: "Mapped to HeyGen-supported aspect-ratio values." },
    quality: { lowering_action: "approximate", note: "Mapped to HeyGen resolution presets." },
    safety: { lowering_action: "unsupported", note: "HeyGen policy controls are not exposed as a Mosvera canonical field." },
    lighting: { lowering_action: "approximate", note: "Folded into avatar-video direction." },
    color_grade: { lowering_action: "approximate", note: "Folded into avatar-video direction." },
    color_temperature: { lowering_action: "approximate", note: "Folded into avatar-video direction." },
    lights: { lowering_action: "emulate", note: "Named lights are described as visual direction." },
    palette: { lowering_action: "approximate", note: "Palette roles are mapped to direction and optional background color." },
    typography: { lowering_action: "approximate", note: "Type character is folded into the communication style." },
    layout: { lowering_action: "approximate", note: "Layout density and surface shape are folded into direction." },
    motion: { lowering_action: "approximate", note: "Motion pace becomes avatar body-language direction." },
    imagery: { lowering_action: "approximate", note: "Imagery treatment is folded into avatar-video direction." },
    voice: { lowering_action: "approximate", note: "Voice/tone copy informs script delivery direction; voice_id stays provider configuration." },
  },
};
