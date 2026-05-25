// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const openaiManifest: CapabilityManifest = {
  provider: "openai-gpt-image-1",
  adapter_version: "0.1.0",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into prompt clause." },
    aspect_ratio: { lowering_action: "native", note: "Mapped to size enum." },
    quality: { lowering_action: "native", note: "Direct enum mapping." },
    safety: { lowering_action: "approximate", note: "standard -> auto, permissive -> low." },
    lighting: { lowering_action: "approximate", note: "Lighting mood/scheme folded into prompt." },
    color_grade: { lowering_action: "approximate", note: "Contrast/saturation folded into prompt." },
    palette: { lowering_action: "approximate", note: "Accent color injected into prompt." },
    lights: { lowering_action: "emulate", note: "Named lights emulated as descriptive prompt clauses." },
    color_temperature: { lowering_action: "approximate", note: "Folded into prompt." },
  },
};
