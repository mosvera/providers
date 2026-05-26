// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const googleGeminiImageManifest: CapabilityManifest = {
  provider: "google-gemini-image",
  adapter_version: "0.1.2",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into Gemini image prompt text." },
    aspect_ratio: { lowering_action: "approximate", note: "Passed as an image-generation hint." },
    quality: { lowering_action: "unsupported", note: "Gemini native image generation does not expose a stable public quality enum." },
    safety: { lowering_action: "unsupported", note: "Safety policy is provider-managed." },
    lighting: { lowering_action: "approximate", note: "Folded into prompt text." },
    color_grade: { lowering_action: "approximate", note: "Folded into prompt text." },
    color_temperature: { lowering_action: "approximate", note: "Folded into prompt text." },
    palette: { lowering_action: "approximate", note: "Palette roles are folded into prompt text." },
    imagery: { lowering_action: "approximate", note: "Imagery treatment is folded into prompt text." },
    layout: { lowering_action: "approximate", note: "Layout density informs composition language." },
    voice: { lowering_action: "approximate", note: "Voice copy informs the prompt's intended usage." },
  },
};

export const googleVeoVideoManifest: CapabilityManifest = {
  provider: "google-veo-video",
  adapter_version: "0.1.2",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into Veo prompt text." },
    aspect_ratio: { lowering_action: "native", note: "Mapped to Veo aspectRatio." },
    quality: { lowering_action: "approximate", note: "Mapped to low-cost resolution presets." },
    safety: { lowering_action: "unsupported", note: "Safety policy is provider-managed." },
    lighting: { lowering_action: "approximate", note: "Folded into prompt text." },
    color_grade: { lowering_action: "approximate", note: "Folded into prompt text." },
    color_temperature: { lowering_action: "approximate", note: "Folded into prompt text." },
    palette: { lowering_action: "approximate", note: "Palette roles are folded into scene direction." },
    imagery: { lowering_action: "approximate", note: "Imagery treatment is folded into scene direction." },
    motion: { lowering_action: "approximate", note: "Motion pace informs camera/body movement." },
    voice: { lowering_action: "approximate", note: "Voice copy informs narration/dialogue intent." },
  },
};
