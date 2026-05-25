// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const sdxlManifest: CapabilityManifest = {
  provider: "sdxl-replicate",
  adapter_version: "0.1.0",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into prompt." },
    aspect_ratio: { lowering_action: "native", note: "Resolved to width/height pixels." },
    quality: { lowering_action: "approximate", note: "Mapped to num_inference_steps and guidance_scale profiles." },
    safety: { lowering_action: "unsupported", note: "SDXL Replicate surface has no canonical moderation parameter." },
    lighting: { lowering_action: "approximate", note: "Folded into prompt." },
    color_grade: { lowering_action: "approximate", note: "Folded into prompt." },
    palette: { lowering_action: "approximate", note: "Accent color injected into prompt." },
    lights: { lowering_action: "emulate", note: "Described in prompt." },
    color_temperature: { lowering_action: "approximate", note: "Folded into prompt." },
  },
};
