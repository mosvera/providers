// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { elevenLabsTtsAdapter } from "../elevenlabs/src/index.ts";
import { fireflyImageAdapter } from "../firefly/src/index.ts";
import { fluxAdapter } from "../flux/src/index.ts";
import { googleGeminiImageAdapter, googleVeoVideoAdapter } from "../google/src/index.ts";
import { heygenAdapter } from "../heygen/src/index.ts";
import { meshyTextTo3DAdapter } from "../meshy/src/index.ts";
import { openaiAdapter } from "../openai/src/index.ts";
import { runwayGen4ImageAdapter, runwayGen45VideoAdapter } from "../runway/src/index.ts";
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

  it("keeps HeyGen video payload assertions separate from image adapters", () => {
    const emission = heygenAdapter.emit(
      {
        voice: { headline: "A local registry demo" },
        motion: { pace: "bouncy" },
        palette: { background: "#f6e7cc", accent: "#d45f3f" },
        aspect_ratio: "16:9",
      },
      { providerOptions: { avatar_id: "avatar-demo", script: "Hello from Mosvera." } },
    );

    expect(heygenAdapter.manifest().provider).toBe("heygen-avatar-video");
    expect(emission.payload).toMatchObject({
      aspect_ratio: "16:9",
      avatar_id: "avatar-demo",
      background: { value: "#f6e7cc" },
      output_format: "mp4",
      resolution: "1080p",
      script: "Hello from Mosvera.",
      type: "avatar",
    });
    expect(emission.prompt).toContain("avatar body language should feel bouncy");
    expect(emission.prompt).toContain("headline intent: A local registry demo");
  });

  it("covers deterministic multi-modal provider emissions without executing providers", () => {
    const canonical = {
      subject: "a clay Mosvera helper demonstrating a local registry",
      medium: "claymation",
      palette: { background: "#f6e7cc", accent: "#d45f3f" },
      imagery: { treatment: "tabletop_model" },
      motion: { pace: "gentle" },
      voice: { headline: "Preview, import, resolve, compile.", body: "Mosvera keeps aesthetics local." },
      aspect_ratio: "16:9",
      quality: "low",
    };
    const adapters = [
      googleGeminiImageAdapter,
      googleVeoVideoAdapter,
      runwayGen4ImageAdapter,
      runwayGen45VideoAdapter,
      elevenLabsTtsAdapter,
      fireflyImageAdapter,
      meshyTextTo3DAdapter,
    ];

    expect(adapters.map((adapter) => adapter.id)).toEqual([
      "google-gemini-image",
      "google-veo-video",
      "runway-gen4-image",
      "runway-gen45-video",
      "elevenlabs-tts",
      "adobe-firefly-image",
      "meshy-text-to-3d",
    ]);

    for (const adapter of adapters) {
      const emission = adapter.emit(canonical, {
        providerOptions: {
          duration: 5,
          duration_seconds: 5,
          script: "A short Mosvera demo.",
          text: "A short Mosvera demo.",
          voice_id: "voice-demo",
        },
      });
      expect(emission.prompt.length).toBeGreaterThan(10);
      expect(Object.keys(emission.payload)).toEqual(Object.keys(emission.payload).sort());
    }

    expect(googleGeminiImageAdapter.emit(canonical).payload).toHaveProperty("generationConfig");
    expect(googleVeoVideoAdapter.emit(canonical).payload).toHaveProperty("parameters");
    expect(runwayGen4ImageAdapter.emit(canonical).payload).toHaveProperty("ratio");
    expect(runwayGen45VideoAdapter.emit(canonical).payload).toHaveProperty("duration");
    expect(elevenLabsTtsAdapter.emit(canonical, { providerOptions: { voice_id: "voice-demo" } }).payload).toHaveProperty("voice_id");
    expect(fireflyImageAdapter.emit(canonical).payload).toHaveProperty("referenceBlobs");
    expect(meshyTextTo3DAdapter.emit(canonical).payload).toHaveProperty("target_formats");
  });
});
