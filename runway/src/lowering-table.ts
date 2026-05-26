// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

const promptRules = [
  { construct: "subject", action: "native" as const, prompt_clause: { template: "{value}", order: 0 } },
  { construct: "medium", action: "approximate" as const, prompt_clause: { template: "{value} style", order: 10, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "voice.headline", action: "approximate" as const, prompt_clause: { template: "headline intent: {value}", order: 15 } },
  { construct: "palette.background", action: "approximate" as const, prompt_clause: { template: "background color {value}", order: 20 } },
  { construct: "palette.accent", action: "approximate" as const, prompt_clause: { template: "accent color {value}", order: 21 } },
  { construct: "imagery.treatment", action: "approximate" as const, prompt_clause: { template: "imagery treatment: {value}", order: 30, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "imagery.alt", action: "approximate" as const, prompt_clause: { template: "scene reference: {value}", order: 31 } },
  { construct: "layout.density", action: "approximate" as const, prompt_clause: { template: "layout density: {value}", order: 40, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "lighting.mood", action: "approximate" as const, prompt_clause: { template: "{value} lighting", order: 50, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "lighting.scheme", action: "approximate" as const, prompt_clause: { template: "{value} lighting setup", order: 51, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "lights", action: "emulate" as const, prompt_clause: { template: "{value}", order: 52, transform: "computed" as const, compute_fn: "describe_lights" } },
  { construct: "color_grade.contrast", action: "approximate" as const, prompt_clause: { template: "{value} contrast", order: 60, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "color_grade.saturation", action: "approximate" as const, prompt_clause: { template: "{value} saturation", order: 61, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "color_temperature", action: "approximate" as const, prompt_clause: { template: "{value} tones", order: 62, transform: "computed" as const, compute_fn: "humanize_value" } },
];

export const runwayGen4ImageLoweringTable: LoweringTable = {
  adapter_id: "runway-gen4-image",
  clause_separator: ", ",
  rules: [
    ...promptRules,
    {
      construct: "aspect_ratio",
      action: "native",
      parameters: [{ parameter: "ratio", mapping: "computed", compute_fn: "runway_image_ratio" }],
    },
    { construct: "quality", action: "unsupported" },
    { construct: "safety", action: "unsupported" },
  ],
};

export const runwayGen45VideoLoweringTable: LoweringTable = {
  adapter_id: "runway-gen45-video",
  clause_separator: ", ",
  rules: [
    ...promptRules,
    {
      construct: "motion.pace",
      action: "approximate",
      prompt_clause: { template: "{value} camera movement", order: 70, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "aspect_ratio",
      action: "native",
      parameters: [{ parameter: "ratio", mapping: "computed", compute_fn: "runway_video_ratio" }],
    },
    { construct: "quality", action: "unsupported" },
    { construct: "safety", action: "unsupported" },
  ],
};
