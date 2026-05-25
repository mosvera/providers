// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const fluxManifest: CapabilityManifest = {
  provider: "bfl-flux-2-pro",
  adapter_version: "0.1.0",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into prompt." },
    aspect_ratio: { lowering_action: "native", note: "Resolved to width/height pixels." },
    quality: { lowering_action: "unsupported", note: "flux-2-pro does not expose steps/guidance." },
    safety: { lowering_action: "native", note: "Mapped to safety_tolerance int." },
    lighting: { lowering_action: "approximate", note: "Folded into prompt." },
    color_grade: { lowering_action: "approximate", note: "Folded into prompt." },
    palette: { lowering_action: "approximate", note: "Accent color injected into prompt." },
    lights: { lowering_action: "emulate", note: "Described in prompt." },
    color_temperature: { lowering_action: "approximate", note: "Folded into prompt." },
  },
};
