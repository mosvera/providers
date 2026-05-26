// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

export const meshyTextTo3DLoweringTable: LoweringTable = {
  adapter_id: "meshy-text-to-3d",
  clause_separator: ", ",
  rules: [
    { construct: "subject", action: "native", prompt_clause: { template: "{value}", order: 0 } },
    { construct: "medium", action: "approximate", prompt_clause: { template: "{value} 3D asset style", order: 10, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "palette.background", action: "approximate", prompt_clause: { template: "background color {value}", order: 20 } },
    { construct: "palette.accent", action: "approximate", prompt_clause: { template: "accent material color {value}", order: 21 } },
    { construct: "palette.accent_2", action: "approximate", prompt_clause: { template: "secondary material color {value}", order: 22 } },
    { construct: "imagery.treatment", action: "approximate", prompt_clause: { template: "{value} tactile treatment", order: 30, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "imagery.alt", action: "approximate", prompt_clause: { template: "asset reference: {value}", order: 31 } },
    { construct: "layout.density", action: "approximate", prompt_clause: { template: "{value} object complexity", order: 40, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "lighting.mood", action: "approximate", prompt_clause: { template: "{value} studio lighting", order: 50, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "color_grade.contrast", action: "approximate", prompt_clause: { template: "{value} material contrast", order: 60, transform: "computed", compute_fn: "humanize_value" } },
    {
      construct: "quality",
      action: "approximate",
      parameters: [{ parameter: "target_polycount", mapping: "lookup", lookup: { low: 30000, medium: 50000, high: 80000 } }],
    },
    { construct: "safety", action: "unsupported" },
  ],
};
