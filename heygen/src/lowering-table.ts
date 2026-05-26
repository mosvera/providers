// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

export const heygenLoweringTable: LoweringTable = {
  adapter_id: "heygen-avatar-video",
  clause_separator: "; ",
  rules: [
    {
      construct: "subject",
      action: "approximate",
      prompt_clause: { template: "video subject: {value}", order: 0 },
    },
    {
      construct: "medium",
      action: "approximate",
      prompt_clause: { template: "visual medium: {value}", order: 10, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "voice.eyebrow",
      action: "approximate",
      prompt_clause: { template: "context label: {value}", order: 15 },
    },
    {
      construct: "voice.headline",
      action: "approximate",
      prompt_clause: { template: "headline intent: {value}", order: 16 },
    },
    {
      construct: "voice.body",
      action: "approximate",
      prompt_clause: { template: "delivery tone: {value}", order: 17 },
    },
    {
      construct: "palette.background",
      action: "approximate",
      prompt_clause: { template: "background color {value}", order: 20 },
      parameters: [{ parameter: "background", mapping: "computed", compute_fn: "background_from_color" }],
    },
    {
      construct: "palette.surface",
      action: "approximate",
      prompt_clause: { template: "surface color {value}", order: 21 },
    },
    {
      construct: "palette.surface_alt",
      action: "approximate",
      prompt_clause: { template: "alternate surface color {value}", order: 22 },
    },
    {
      construct: "palette.accent",
      action: "approximate",
      prompt_clause: { template: "primary accent {value}", order: 23 },
    },
    {
      construct: "palette.accent_2",
      action: "approximate",
      prompt_clause: { template: "secondary accent {value}", order: 24 },
    },
    {
      construct: "palette.ink",
      action: "approximate",
      prompt_clause: { template: "primary text color {value}", order: 25 },
    },
    {
      construct: "palette.muted",
      action: "approximate",
      prompt_clause: { template: "muted text color {value}", order: 26 },
    },
    {
      construct: "palette.border",
      action: "approximate",
      prompt_clause: { template: "border color {value}", order: 27 },
    },
    {
      construct: "palette.code_bg",
      action: "approximate",
      prompt_clause: { template: "technical panel background {value}", order: 28 },
    },
    {
      construct: "palette.code_ink",
      action: "approximate",
      prompt_clause: { template: "technical panel text color {value}", order: 29 },
    },
    {
      construct: "imagery.treatment",
      action: "approximate",
      prompt_clause: { template: "imagery treatment: {value}", order: 30, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "imagery.alt",
      action: "approximate",
      prompt_clause: { template: "scene reference: {value}", order: 31 },
    },
    {
      construct: "layout.density",
      action: "approximate",
      prompt_clause: { template: "layout density: {value}", order: 40, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "layout.radius",
      action: "approximate",
      prompt_clause: { template: "surface radius: {value}", order: 41 },
    },
    {
      construct: "layout.shadow",
      action: "approximate",
      prompt_clause: { template: "shadow language: {value}", order: 42 },
    },
    {
      construct: "motion.pace",
      action: "approximate",
      prompt_clause: { template: "avatar body language should feel {value}", order: 50, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "motion.duration",
      action: "approximate",
      prompt_clause: { template: "motion timing: {value}", order: 51 },
    },
    {
      construct: "typography.display",
      action: "approximate",
      prompt_clause: { template: "display typography character: {value}", order: 60 },
    },
    {
      construct: "typography.body",
      action: "approximate",
      prompt_clause: { template: "body typography character: {value}", order: 61 },
    },
    {
      construct: "typography.mono",
      action: "approximate",
      prompt_clause: { template: "technical typography character: {value}", order: 62 },
    },
    {
      construct: "typography.scale",
      action: "approximate",
      prompt_clause: { template: "typographic scale: {value}", order: 63, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "lighting.mood",
      action: "approximate",
      prompt_clause: { template: "{value} lighting", order: 70, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "lighting.scheme",
      action: "approximate",
      prompt_clause: { template: "{value} lighting setup", order: 71, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "lights",
      action: "emulate",
      prompt_clause: { template: "{value}", order: 72, transform: "computed", compute_fn: "describe_lights" },
    },
    {
      construct: "color_grade.contrast",
      action: "approximate",
      prompt_clause: { template: "{value} contrast", order: 80, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "color_grade.saturation",
      action: "approximate",
      prompt_clause: { template: "{value} saturation", order: 81, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "color_temperature",
      action: "approximate",
      prompt_clause: { template: "{value} tones", order: 82, transform: "computed", compute_fn: "humanize_value" },
    },
    {
      construct: "aspect_ratio",
      action: "approximate",
      parameters: [{ parameter: "aspect_ratio", mapping: "computed", compute_fn: "heygen_aspect_ratio" }],
    },
    {
      construct: "quality",
      action: "approximate",
      parameters: [{ parameter: "resolution", mapping: "lookup", lookup: { low: "720p", medium: "1080p", high: "1080p" } }],
    },
    {
      construct: "safety",
      action: "unsupported",
    },
  ],
};
