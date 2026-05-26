// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

export const fireflyImageLoweringTable: LoweringTable = {
  adapter_id: "adobe-firefly-image",
  clause_separator: ", ",
  rules: [
    { construct: "subject", action: "native", prompt_clause: { template: "{value}", order: 0 } },
    { construct: "medium", action: "approximate", prompt_clause: { template: "{value} style", order: 10, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "voice.headline", action: "approximate", prompt_clause: { template: "headline intent: {value}", order: 15 } },
    { construct: "palette.background", action: "approximate", prompt_clause: { template: "background color {value}", order: 20 } },
    { construct: "palette.accent", action: "approximate", prompt_clause: { template: "accent color {value}", order: 21 } },
    { construct: "imagery.treatment", action: "approximate", prompt_clause: { template: "imagery treatment: {value}", order: 30, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "imagery.alt", action: "approximate", prompt_clause: { template: "scene reference: {value}", order: 31 } },
    { construct: "layout.density", action: "approximate", prompt_clause: { template: "layout density: {value}", order: 40, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "lighting.mood", action: "approximate", prompt_clause: { template: "{value} lighting", order: 50, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "lighting.scheme", action: "approximate", prompt_clause: { template: "{value} lighting setup", order: 51, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "lights", action: "emulate", prompt_clause: { template: "{value}", order: 52, transform: "computed", compute_fn: "describe_lights" } },
    { construct: "color_grade.contrast", action: "approximate", prompt_clause: { template: "{value} contrast", order: 60, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "color_grade.saturation", action: "approximate", prompt_clause: { template: "{value} saturation", order: 61, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "color_temperature", action: "approximate", prompt_clause: { template: "{value} tones", order: 62, transform: "computed", compute_fn: "humanize_value" } },
    {
      construct: "aspect_ratio",
      action: "native",
      parameters: [{ parameter: "aspectRatio", mapping: "computed", compute_fn: "firefly_aspect_ratio" }],
    },
    { construct: "quality", action: "unsupported" },
    { construct: "safety", action: "unsupported" },
  ],
};
