// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const runwayGen4ImageManifest: CapabilityManifest = {
  provider: "runway-gen4-image",
  adapter_version: "0.1.2",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into promptText." },
    aspect_ratio: { lowering_action: "native", note: "Mapped to Runway ratio." },
    quality: { lowering_action: "unsupported", note: "Runway Gen-4 image quality is model-controlled." },
    safety: { lowering_action: "unsupported", note: "Runway moderation is provider-managed." },
    lighting: { lowering_action: "approximate", note: "Folded into promptText." },
    color_grade: { lowering_action: "approximate", note: "Folded into promptText." },
    palette: { lowering_action: "approximate", note: "Folded into promptText." },
    imagery: { lowering_action: "approximate", note: "Folded into promptText." },
    layout: { lowering_action: "approximate", note: "Folded into composition instructions." },
  },
};

export const runwayGen45VideoManifest: CapabilityManifest = {
  provider: "runway-gen45-video",
  adapter_version: "0.1.2",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into promptText." },
    aspect_ratio: { lowering_action: "native", note: "Mapped to Runway ratio." },
    quality: { lowering_action: "unsupported", note: "Runway Gen-4.5 video quality is model-controlled." },
    safety: { lowering_action: "unsupported", note: "Runway moderation is provider-managed." },
    lighting: { lowering_action: "approximate", note: "Folded into promptText." },
    color_grade: { lowering_action: "approximate", note: "Folded into promptText." },
    palette: { lowering_action: "approximate", note: "Folded into promptText." },
    imagery: { lowering_action: "approximate", note: "Folded into promptText." },
    motion: { lowering_action: "approximate", note: "Motion pace becomes video prompt direction." },
  },
};
