// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

const sharedPromptRules = [
  { construct: "subject", action: "native" as const, prompt_clause: { template: "{value}", order: 0 } },
  { construct: "medium", action: "approximate" as const, prompt_clause: { template: "{value} style", order: 10, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "voice.eyebrow", action: "approximate" as const, prompt_clause: { template: "context label: {value}", order: 15 } },
  { construct: "voice.headline", action: "approximate" as const, prompt_clause: { template: "headline intent: {value}", order: 16 } },
  { construct: "voice.body", action: "approximate" as const, prompt_clause: { template: "delivery tone: {value}", order: 17 } },
  { construct: "palette.background", action: "approximate" as const, prompt_clause: { template: "background color {value}", order: 20 } },
  { construct: "palette.surface", action: "approximate" as const, prompt_clause: { template: "surface color {value}", order: 21 } },
  { construct: "palette.accent", action: "approximate" as const, prompt_clause: { template: "accent color {value}", order: 22 } },
  { construct: "palette.accent_2", action: "approximate" as const, prompt_clause: { template: "secondary accent {value}", order: 23 } },
  { construct: "palette.ink", action: "approximate" as const, prompt_clause: { template: "text color {value}", order: 24 } },
  { construct: "imagery.treatment", action: "approximate" as const, prompt_clause: { template: "imagery treatment: {value}", order: 30, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "imagery.alt", action: "approximate" as const, prompt_clause: { template: "scene reference: {value}", order: 31 } },
  { construct: "layout.density", action: "approximate" as const, prompt_clause: { template: "layout density: {value}", order: 40, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "layout.radius", action: "approximate" as const, prompt_clause: { template: "surface radius: {value}", order: 41 } },
  { construct: "lighting.mood", action: "approximate" as const, prompt_clause: { template: "{value} lighting", order: 50, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "lighting.scheme", action: "approximate" as const, prompt_clause: { template: "{value} lighting setup", order: 51, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "lights", action: "emulate" as const, prompt_clause: { template: "{value}", order: 52, transform: "computed" as const, compute_fn: "describe_lights" } },
  { construct: "color_grade.contrast", action: "approximate" as const, prompt_clause: { template: "{value} contrast", order: 60, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "color_grade.saturation", action: "approximate" as const, prompt_clause: { template: "{value} saturation", order: 61, transform: "computed" as const, compute_fn: "humanize_value" } },
  { construct: "color_temperature", action: "approximate" as const, prompt_clause: { template: "{value} tones", order: 62, transform: "computed" as const, compute_fn: "humanize_value" } },
];

export const googleGeminiImageLoweringTable: LoweringTable = {
  adapter_id: "google-gemini-image",
  clause_separator: ", ",
  rules: [
    ...sharedPromptRules,
    {
      construct: "aspect_ratio",
      action: "approximate",
      prompt_clause: { template: "compose for {value} aspect ratio", order: 70 },
      parameters: [{ parameter: "aspectRatio", mapping: "direct" }],
    },
    { construct: "quality", action: "unsupported" },
    { construct: "safety", action: "unsupported" },
  ],
};

export const googleVeoVideoLoweringTable: LoweringTable = {
  adapter_id: "google-veo-video",
  clause_separator: ", ",
  rules: [
    ...sharedPromptRules,
    {
      construct: "motion.pace",
      action: "approximate",
      prompt_clause: { template: "{value} camera and body movement", order: 65, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "motion.duration",
      action: "approximate",
      prompt_clause: { template: "motion timing: {value}", order: 66 },
    },
    {
      construct: "aspect_ratio",
      action: "native",
      parameters: [{ parameter: "aspectRatio", mapping: "computed", compute_fn: "veo_aspect_ratio" }],
    },
    {
      construct: "quality",
      action: "approximate",
      parameters: [{ parameter: "resolution", mapping: "lookup", lookup: { low: "720p", medium: "720p", high: "1080p" } }],
    },
    { construct: "safety", action: "unsupported" },
  ],
};
