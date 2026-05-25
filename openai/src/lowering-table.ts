// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

export const openaiLoweringTable: LoweringTable = {
  adapter_id: "openai-gpt-image-1",
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
        order: 20,
        transform: "lookup",
        lookup: { warm: "warm", neutral: "neutral", moody: "moody" },
      },
    },
    {
      construct: "lighting.scheme",
      action: "approximate",
      prompt_clause: {
        template: "{value} lighting setup",
        order: 21,
        transform: "lookup",
        lookup: { three_point: "three-point" },
      },
    },
    {
      construct: "lights",
      action: "emulate",
      prompt_clause: { template: "{value}", order: 25, transform: "computed", compute_fn: "describe_lights" },
    },
    {
      construct: "color_grade.contrast",
      action: "approximate",
      prompt_clause: {
        template: "{value} contrast",
        order: 30,
        transform: "lookup",
        lookup: { medium: "medium", high: "high", very_high: "very high" },
      },
    },
    {
      construct: "color_grade.saturation",
      action: "approximate",
      prompt_clause: {
        template: "{value} saturation",
        order: 31,
        transform: "lookup",
        lookup: { natural: "natural", desaturated: "desaturated" },
      },
    },
    {
      construct: "color_temperature",
      action: "approximate",
      prompt_clause: { template: "{value} tones", order: 40 },
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
        {
          parameter: "size",
          mapping: "lookup",
          lookup: {
            "1:1": "1024x1024",
            "3:2": "1536x1024",
            "2:3": "1024x1536",
            "16:9": "1536x1024",
            "9:16": "1024x1536",
            auto: "auto",
          },
        },
      ],
    },
    {
      construct: "quality",
      action: "native",
      parameters: [{ parameter: "quality", mapping: "direct" }],
    },
    {
      construct: "safety",
      action: "approximate",
      parameters: [
        {
          parameter: "moderation",
          mapping: "lookup",
          lookup: { standard: "auto", strict: "auto", permissive: "low" },
        },
      ],
    },
  ],
};
