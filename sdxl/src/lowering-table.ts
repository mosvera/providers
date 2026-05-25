// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

export const sdxlLoweringTable: LoweringTable = {
  adapter_id: "sdxl-replicate",
  clause_separator: ", ",
  rules: [
    {
      construct: "subject",
      action: "native",
      prompt_clause: { template: "{value}", order: 0 },
    },
    {
      construct: "medium",
      action: "approximate",
      prompt_clause: { template: "{value} style", order: 10, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "lighting.mood",
      action: "approximate",
      prompt_clause: {
        template: "{value} lighting",
        order: 30,
        transform: "lookup",
        lookup: { warm: "warm", neutral: "neutral", moody: "moody" },
      },
    },
    {
      construct: "lighting.scheme",
      action: "approximate",
      prompt_clause: {
        template: "{value} lighting setup",
        order: 31,
        transform: "lookup",
        lookup: { three_point: "three-point" },
      },
    },
    {
      construct: "lights",
      action: "emulate",
      prompt_clause: { template: "{value}", order: 32, transform: "computed", compute_fn: "describe_lights" },
    },
    {
      construct: "color_grade.contrast",
      action: "approximate",
      prompt_clause: {
        template: "{value} contrast",
        order: 40,
        transform: "lookup",
        lookup: { medium: "medium", high: "high", very_high: "very high" },
      },
    },
    {
      construct: "color_grade.saturation",
      action: "approximate",
      prompt_clause: {
        template: "{value} saturation",
        order: 41,
        transform: "lookup",
        lookup: { natural: "natural", desaturated: "desaturated" },
      },
    },
    {
      construct: "color_temperature",
      action: "approximate",
      prompt_clause: { template: "{value} tones", order: 42 },
    },
    {
      construct: "palette.accent",
      action: "approximate",
      prompt_clause: { template: "accent color ({value})", order: 50 },
    },
    {
      construct: "aspect_ratio",
      action: "native",
      parameters: [
        { parameter: "width", mapping: "computed", compute_fn: "aspect_width" },
        { parameter: "height", mapping: "computed", compute_fn: "aspect_height" },
      ],
    },
    {
      construct: "quality",
      action: "approximate",
      parameters: [
        {
          parameter: "num_inference_steps",
          mapping: "lookup",
          lookup: { low: 20, medium: 35, high: 50 },
        },
        {
          parameter: "guidance_scale",
          mapping: "lookup",
          lookup: { low: 5, medium: 7.5, high: 10 },
        },
      ],
    },
    {
      construct: "safety",
      action: "unsupported",
    },
  ],
};
