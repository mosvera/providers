// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { googleGeminiImageAdapter, googleVeoVideoAdapter } from "../src/index.ts";

const canonical = {
  subject: "a tactile clay Mosvera helper on a builder table",
  medium: "claymation",
  palette: { background: "#f6e7cc", accent: "#d45f3f" },
  imagery: { treatment: "tabletop_model" },
  motion: { pace: "bouncy" },
  voice: { headline: "A local registry demo" },
  aspect_ratio: "16:9",
  quality: "low",
};

describe("Google adapters", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("emits deterministic Gemini image and Veo video payloads", () => {
    const image = googleGeminiImageAdapter.emit(canonical);
    const video = googleVeoVideoAdapter.emit(canonical, { providerOptions: { duration_seconds: 5 } });

    expect(Object.keys(image.payload)).toEqual(Object.keys(image.payload).sort());
    expect(image.payload).toMatchObject({
      model: "gemini-3.1-flash-image-preview",
      generationConfig: { imageConfig: { aspectRatio: "16:9" }, responseModalities: ["TEXT", "IMAGE"] },
    });
    expect(image.prompt).toContain("claymation style");
    expect(video.payload).toMatchObject({
      model: "veo-3.1-generate-preview",
      parameters: { aspectRatio: "16:9", durationSeconds: 4, resolution: "720p" },
    });
    expect(video.prompt).toContain("bouncy camera and body movement");
    expect(JSON.stringify(googleVeoVideoAdapter.emit(canonical))).toBe(JSON.stringify(googleVeoVideoAdapter.emit(canonical)));
  });

  it("keeps user prompts first while appending Mosvera aesthetic direction", () => {
    const image = googleGeminiImageAdapter.emit(canonical, { providerOptions: { prompt: "A friendly clay builder desk." } });
    const video = googleVeoVideoAdapter.emit(canonical, { providerOptions: { prompt: "A clay tile rotates.", duration_seconds: 5 } });

    const imageText = image.payload.contents as Array<{ parts: Array<{ text: string }> }>;
    const videoInstances = video.payload.instances as Array<{ prompt: string }>;
    expect(imageText[0]?.parts[0]?.text).toContain("A friendly clay builder desk.\n\nMosvera aesthetic direction:");
    expect(imageText[0]?.parts[0]?.text).toContain("claymation style");
    expect(videoInstances[0]?.prompt).toContain("A clay tile rotates.\n\nMosvera aesthetic direction:");
    expect(videoInstances[0]?.prompt).toContain("bouncy camera and body movement");
  });

  it("executes Gemini image responses with inline image data", async () => {
    vi.stubEnv("GOOGLE_GEMINI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ inlineData: { data: "aW1hZ2U=", mimeType: "image/png" } }] } }],
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await googleGeminiImageAdapter.execute({ model: "gemini-test", contents: [{ parts: [{ text: "hi" }] }] });
    expect(result.images).toEqual([{ data: "aW1hZ2U=", media_type: "image/png" }]);
    expect(result.artifacts?.[0]).toMatchObject({ kind: "image", media_type: "image/png" });
  });

  it("executes Veo by polling an operation until a video URL is ready", async () => {
    vi.stubEnv("GOOGLE_GEMINI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: "operations/video-1" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            done: true,
            response: { generateVideoResponse: { generatedSamples: [{ video: { uri: "https://example.com/video.mp4" } }] } },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleVeoVideoAdapter.execute(
      { model: "veo-test", instances: [{ prompt: "hi" }], parameters: { aspectRatio: "16:9" } },
      { poll_interval_ms: 1, timeout_ms: 100 },
    );
    expect(result.images).toEqual([]);
    expect(result.artifacts).toEqual([
      { kind: "video", media_type: "video/mp4", url: "https://example.com/video.mp4", metadata: { provider: "google-veo-video", model: "veo-test" } },
    ]);
  });
});
