// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const fireflyImageManifest: CapabilityManifest = {
  provider: "adobe-firefly-image",
  adapter_version: "0.1.2",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into Firefly prompt." },
    aspect_ratio: { lowering_action: "native", note: "Mapped to Firefly aspectRatio." },
    quality: { lowering_action: "unsupported", note: "Image5 quality is model-controlled." },
    safety: { lowering_action: "unsupported", note: "Safety policy is provider-managed." },
    lighting: { lowering_action: "approximate", note: "Folded into Firefly prompt." },
    color_grade: { lowering_action: "approximate", note: "Folded into Firefly prompt." },
    palette: { lowering_action: "approximate", note: "Folded into Firefly prompt and reference language." },
    imagery: { lowering_action: "approximate", note: "Folded into Firefly prompt." },
    layout: { lowering_action: "approximate", note: "Folded into composition language." },
  },
};
