// SPDX-License-Identifier: Apache-2.0

import type { CapabilityManifest } from "@mosvera/provider-base";

export const meshyTextTo3DManifest: CapabilityManifest = {
  provider: "meshy-text-to-3d",
  adapter_version: "0.1.2",
  constructs: {
    subject: { lowering_action: "native" },
    medium: { lowering_action: "approximate", note: "Folded into 3D prompt and art style." },
    quality: { lowering_action: "approximate", note: "Mapped to Meshy preview/refine choices." },
    safety: { lowering_action: "unsupported", note: "Safety policy is provider-managed." },
    lighting: { lowering_action: "approximate", note: "Folded into material/render prompt." },
    color_grade: { lowering_action: "approximate", note: "Folded into material/render prompt." },
    palette: { lowering_action: "approximate", note: "Folded into material color prompt." },
    imagery: { lowering_action: "approximate", note: "Folded into 3D asset treatment." },
    layout: { lowering_action: "approximate", note: "Folded into scale/surface language." },
  },
};
