// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi, afterEach } from "vitest";
import { heygenAdapter } from "../src/index.ts";

const claymation = {
  palette: {
    background: "#f6e7cc",
    accent: "#d45f3f",
    accent_2: "#2f8f9d",
    ink: "#2a2118",
    surface: "#fff3dc",
  },
  imagery: { treatment: "tabletop_model", alt: "Tactile clay-like Mosvera tesserae under warm builder-table light." },
  layout: { density: "roomy", radius: "8px" },
  motion: { pace: "bouncy", duration: "260ms" },
  typography: { display: "Fraunces", body: "Hanken Grotesk", scale: "friendly" },
  voice: {
    eyebrow: "Tactile builder mode",
    headline: "Same architecture, built out of warm clay and shop light.",
    body: "Keep the spec serious while the surface becomes handmade and constructive.",
  },
  aspect_ratio: "16:9",
  quality: "high",
};

describe("HeyGenAdapter.emit", () => {
  it("emits a deterministic avatar-video payload with provider options", () => {
    const emission = heygenAdapter.emit(claymation, {
      providerOptions: {
        avatar_id: "avatar-demo",
        voice_id: "voice-demo",
        script: "Welcome to the Mosvera quickstart.",
        title: "Mosvera quickstart",
        caption: true,
      },
    });

    expect(Object.keys(emission.payload)).toEqual(Object.keys(emission.payload).sort());
    expect(emission.payload).toMatchObject({
      aspect_ratio: "16:9",
      avatar_id: "avatar-demo",
      background: { value: "#f6e7cc" },
      caption: { file_format: "srt" },
      output_format: "mp4",
      resolution: "1080p",
      script: "Welcome to the Mosvera quickstart.",
      title: "Mosvera quickstart",
      type: "avatar",
      voice_id: "voice-demo",
    });
    expect(emission.prompt).toContain("imagery treatment: tabletop model");
    expect(emission.prompt).toContain("avatar body language should feel bouncy");
    expect(emission.prompt).toContain("headline intent: Same architecture");
    expect(emission.payload.motion_prompt).toBe(emission.prompt);
    expect(emission.warnings).toContainEqual({ construct: "palette.accent", action: "approximate" });
    expect(JSON.stringify(heygenAdapter.emit(claymation))).toBe(JSON.stringify(heygenAdapter.emit(claymation)));
  });

  it("maps non-HeyGen aspect ratios to the nearest video ratio", () => {
    const emission = heygenAdapter.emit({ subject: "A docs explainer", aspect_ratio: "2:3" });
    expect(emission.payload.aspect_ratio).toBe("9:16");
    expect(emission.prompt).toContain("video subject: A docs explainer");
  });

  it("keeps execution-only inputs out of Mosvera documents", () => {
    const emission = heygenAdapter.emit({ voice: { headline: "A local registry demo" } });
    expect(emission.payload).not.toHaveProperty("avatar_id");
    expect(emission.payload).not.toHaveProperty("script");
    expect(emission.payload.title).toBe("A local registry demo");
  });
});

describe("HeyGenAdapter.execute", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requires HEYGEN_API_KEY", async () => {
    await expect(heygenAdapter.execute({ avatar_id: "avatar", script: "Hello" })).rejects.toThrow("HEYGEN_API_KEY");
  });

  it("requires avatar_id and script or audio input before any network call", async () => {
    vi.stubEnv("HEYGEN_API_KEY", "test-key");
    await expect(heygenAdapter.execute({ script: "Hello" })).rejects.toThrow("avatar_id");
    await expect(heygenAdapter.execute({ avatar_id: "avatar" })).rejects.toThrow("script, audio_url, or audio_asset_id");
  });

  it("returns a video artifact after a completed poll response", async () => {
    vi.stubEnv("HEYGEN_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { video_id: "video-1" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { status: "completed", video_url: "https://cdn.example/video.mp4" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await heygenAdapter.execute(
      { avatar_id: "avatar", script: "Hello", output_format: "mp4" },
      { poll_interval_ms: 1, timeout_ms: 100 },
    );

    expect(result.images).toEqual([]);
    expect(result.artifacts).toEqual([
      {
        kind: "video",
        media_type: "video/mp4",
        url: "https://cdn.example/video.mp4",
        metadata: { provider: "heygen-avatar-video", status: "completed" },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
