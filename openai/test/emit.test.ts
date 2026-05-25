// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { EmissionError } from "@mosvera/provider-base";
import { openaiAdapter } from "../src/index.ts";

const minimal = {
  subject: "a lighthouse on a basalt cliff at dusk",
  aspect_ratio: "3:2",
};

const standard = {
  ...minimal,
  medium: "cinematic",
  lighting: { mood: "warm", scheme: "three_point" },
  color_grade: { contrast: "very_high", saturation: "desaturated" },
  quality: "high",
  safety: "standard",
};

const cinematicEditorial = {
  ...standard,
  lights: [
    { name: "key", power: 6 },
    { name: "fill", power: 5 },
    { name: "rim", power: 2 },
  ],
  color_temperature: "warm",
  palette: { accent: "#c8943f" },
};

describe("OpenAIAdapter.emit", () => {
  it("emits a minimal gpt-image-1 payload", () => {
    expect(openaiAdapter.emit(minimal)).toMatchInlineSnapshot(`
      {
        "payload": {
          "model": "gpt-image-1",
          "n": 1,
          "output_format": "png",
          "prompt": "a lighthouse on a basalt cliff at dusk",
          "size": "1536x1024",
        },
        "prompt": "a lighthouse on a basalt cliff at dusk",
        "provenance": {
          "prompt.0": {
            "canonical_construct": "subject",
            "lowering_action": "native",
            "source_value": "a lighthouse on a basalt cliff at dusk",
          },
          "size": {
            "canonical_construct": "aspect_ratio",
            "lowering_action": "native",
            "source_value": "3:2",
          },
        },
        "warnings": [],
      }
    `);
  });

  it("emits the full cinematic-editorial prompt and payload", () => {
    expect(openaiAdapter.emit(cinematicEditorial)).toMatchInlineSnapshot(`
      {
        "payload": {
          "model": "gpt-image-1",
          "moderation": "auto",
          "n": 1,
          "output_format": "png",
          "prompt": "a lighthouse on a basalt cliff at dusk, cinematic style, warm lighting, three-point lighting setup, key light at power 6, fill light at power 5, rim light at power 2, very high contrast, desaturated saturation, warm tones, accent color (#c8943f)",
          "quality": "high",
          "size": "1536x1024",
        },
        "prompt": "a lighthouse on a basalt cliff at dusk, cinematic style, warm lighting, three-point lighting setup, key light at power 6, fill light at power 5, rim light at power 2, very high contrast, desaturated saturation, warm tones, accent color (#c8943f)",
        "provenance": {
          "moderation": {
            "canonical_construct": "safety",
            "lowering_action": "approximate",
            "source_value": "standard",
          },
          "prompt.0": {
            "canonical_construct": "subject",
            "lowering_action": "native",
            "source_value": "a lighthouse on a basalt cliff at dusk",
          },
          "prompt.1": {
            "canonical_construct": "medium",
            "lowering_action": "approximate",
            "source_value": "cinematic",
          },
          "prompt.2": {
            "canonical_construct": "lighting.mood",
            "lowering_action": "approximate",
            "source_value": "warm",
          },
          "prompt.3": {
            "canonical_construct": "lighting.scheme",
            "lowering_action": "approximate",
            "source_value": "three_point",
          },
          "prompt.4": {
            "canonical_construct": "lights",
            "lowering_action": "emulate",
            "source_value": [
              {
                "name": "key",
                "power": 6,
              },
              {
                "name": "fill",
                "power": 5,
              },
              {
                "name": "rim",
                "power": 2,
              },
            ],
          },
          "prompt.5": {
            "canonical_construct": "color_grade.contrast",
            "lowering_action": "approximate",
            "source_value": "very_high",
          },
          "prompt.6": {
            "canonical_construct": "color_grade.saturation",
            "lowering_action": "approximate",
            "source_value": "desaturated",
          },
          "prompt.7": {
            "canonical_construct": "color_temperature",
            "lowering_action": "approximate",
            "source_value": "warm",
          },
          "prompt.8": {
            "canonical_construct": "palette.accent",
            "lowering_action": "approximate",
            "source_value": "#c8943f",
          },
          "quality": {
            "canonical_construct": "quality",
            "lowering_action": "native",
            "source_value": "high",
          },
          "size": {
            "canonical_construct": "aspect_ratio",
            "lowering_action": "native",
            "source_value": "3:2",
          },
        },
        "warnings": [
          {
            "action": "approximate",
            "construct": "color_grade.contrast",
          },
          {
            "action": "approximate",
            "construct": "color_grade.saturation",
          },
          {
            "action": "approximate",
            "construct": "color_temperature",
          },
          {
            "action": "approximate",
            "construct": "lighting.mood",
          },
          {
            "action": "approximate",
            "construct": "lighting.scheme",
          },
          {
            "action": "emulate",
            "construct": "lights",
          },
          {
            "action": "approximate",
            "construct": "medium",
          },
          {
            "action": "approximate",
            "construct": "palette.accent",
          },
          {
            "action": "approximate",
            "construct": "safety",
          },
        ],
      }
    `);
  });

  it("throws for a required construct the adapter cannot lower", () => {
    expect(() => openaiAdapter.emit({ ...minimal, unsupported_field: true }, { criticality: { unsupported_field: "required" } })).toThrow(EmissionError);
  });

  it("warns and drops optional unsupported palette roles", () => {
    const out = openaiAdapter.emit({ ...minimal, palette: { accent: "#c8943f", secondary: "#f5e6d3" } });
    expect(out.warnings).toContainEqual({ construct: "palette.secondary", action: "unsupported" });
    expect(out.prompt).toContain("accent color (#c8943f)");
  });

  it("is deterministic", () => {
    expect(JSON.stringify(openaiAdapter.emit(standard))).toBe(JSON.stringify(openaiAdapter.emit(standard)));
  });
});
