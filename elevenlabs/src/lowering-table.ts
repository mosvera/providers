// SPDX-License-Identifier: Apache-2.0

import type { LoweringTable } from "@mosvera/provider-base";

export const elevenLabsTtsLoweringTable: LoweringTable = {
  adapter_id: "elevenlabs-tts",
  clause_separator: " ",
  rules: [
    { construct: "subject", action: "approximate", prompt_clause: { template: "Context: {value}.", order: 0 } },
    { construct: "voice.eyebrow", action: "native", prompt_clause: { template: "{value}.", order: 10 } },
    { construct: "voice.headline", action: "native", prompt_clause: { template: "{value}", order: 11 } },
    { construct: "voice.body", action: "native", prompt_clause: { template: "{value}", order: 12 } },
    { construct: "motion.pace", action: "approximate", prompt_clause: { template: "Delivery should feel {value}.", order: 20, transform: "computed", compute_fn: "humanize_value" } },
    { construct: "typography.display", action: "approximate", prompt_clause: { template: "Visual character: {value}.", order: 30 } },
    { construct: "palette.accent", action: "approximate", prompt_clause: { template: "Accent mood: {value}.", order: 40 } },
    {
      construct: "quality",
      action: "approximate",
      parameters: [{ parameter: "model_id", mapping: "lookup", lookup: { low: "eleven_flash_v2_5", medium: "eleven_flash_v2_5", high: "eleven_multilingual_v2" } }],
    },
    { construct: "safety", action: "unsupported" },
  ],
};
