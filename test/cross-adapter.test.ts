// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { fluxAdapter } from "../flux/src/index.ts";
import { openaiAdapter } from "../openai/src/index.ts";
import { sdxlAdapter } from "../sdxl/src/index.ts";

const fixtures = [
  {
    name: "minimal",
    canonical: {
      subject: "a lighthouse on a basalt cliff at dusk",
      aspect_ratio: "3:2",
    },
    expectedClauses: ["a lighthouse on a basalt cliff at dusk"],
  },
  {
    name: "full cinematic-editorial",
    canonical: {
      subject: "a lighthouse on a basalt cliff at dusk",
      medium: "cinematic",
      lighting: { mood: "warm", scheme: "three_point" },
      lights: [
        { name: "key", power: 6 },
        { name: "fill", power: 5 },
        { name: "rim", power: 2 },
      ],
      color_grade: { contrast: "very_high", saturation: "desaturated" },
      color_temperature: "warm",
      palette: { accent: "#c8943f" },
      aspect_ratio: "3:2",
      quality: "high",
      safety: "standard",
    },
    expectedClauses: ["cinematic style", "warm lighting", "very high contrast", "accent color (#c8943f)"],
  },
  {
    name: "palette-heavy",
    canonical: {
      subject: "an editorial product still life",
      palette: { accent: "#c8943f", secondary: "#f5e6d3", background: "#1a1410" },
      aspect_ratio: "1:1",
    },
    expectedClauses: ["an editorial product still life", "accent color (#c8943f)"],
  },
] as const;

const VALID_WARNING_ACTIONS = new Set(["approximate", "emulate", "unsupported"]);

describe("cross-adapter emission", () => {
  for (const fixture of fixtures) {
    it(`keeps structural prompt equivalence for ${fixture.name}`, () => {
      const openai = openaiAdapter.emit(fixture.canonical);
      const flux = fluxAdapter.emit(fixture.canonical);
      const sdxl = sdxlAdapter.emit(fixture.canonical);

      expect(openai.prompt).toContain(String(fixture.canonical.subject));
      expect(flux.prompt).toContain(String(fixture.canonical.subject));
      expect(sdxl.prompt).toContain(String(fixture.canonical.subject));
      for (const clause of fixture.expectedClauses) {
        expect(openai.prompt).toContain(clause);
        expect(flux.prompt).toContain(clause);
        expect(sdxl.prompt).toContain(clause);
      }
    });
  }

  it("documents required manifest divergences across the image adapters", () => {
    const openai = openaiAdapter.manifest();
    const flux = fluxAdapter.manifest();
    const sdxl = sdxlAdapter.manifest();
    expect(openai.constructs.quality?.lowering_action).toBe("native");
    expect(flux.constructs.quality?.lowering_action).toBe("unsupported");
    expect(sdxl.constructs.quality?.lowering_action).toBe("approximate");
    expect(openai.constructs.safety?.lowering_action).toBe("approximate");
    expect(flux.constructs.safety?.lowering_action).toBe("native");
    expect(sdxl.constructs.safety?.lowering_action).toBe("unsupported");
  });

  it("emits structurally valid MEP-0003 warnings", () => {
    const canonical = fixtures[1]!.canonical;
    const emissions = [openaiAdapter.emit(canonical), fluxAdapter.emit(canonical), sdxlAdapter.emit(canonical)];
    for (const emission of emissions) {
      for (const warning of emission.warnings) {
        expect(typeof warning.construct).toBe("string");
        expect(VALID_WARNING_ACTIONS.has(warning.action)).toBe(true);
      }
    }
  });

  it("keeps SDXL negative prompts adapter-local", () => {
    const canonical = fixtures[0]!.canonical;
    const openai = openaiAdapter.emit(canonical);
    const flux = fluxAdapter.emit(canonical);
    const sdxl = sdxlAdapter.emit(canonical);

    expect(openai.payload).not.toHaveProperty("negative_prompt");
    expect(flux.payload).not.toHaveProperty("negative_prompt");
    expect(sdxl.payload).toHaveProperty("negative_prompt");
  });
});
