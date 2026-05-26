// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { runwayGen4ImageAdapter, runwayGen45VideoAdapter } from "../src/index.ts";

const canonical = {
  subject: "a clean product card on a warm table",
  medium: "cinematic",
  palette: { accent: "#d45f3f" },
  imagery: { treatment: "editorial_photo" },
  motion: { pace: "gentle" },
  aspect_ratio: "16:9",
};

describe("Runway adapters", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("emits deterministic image and video payloads", () => {
    const image = runwayGen4ImageAdapter.emit(canonical);
    const video = runwayGen45VideoAdapter.emit(canonical, { providerOptions: { duration: 5 } });
    expect(image.payload).toMatchObject({ model: "gen4_image", ratio: "1920:1080" });
    expect(image.prompt).toContain("editorial photo");
    expect(video.payload).toMatchObject({ model: "gen4.5", ratio: "1280:720", duration: 5 });
    expect(video.prompt).toContain("gentle camera movement");
    expect(Object.keys(video.payload)).toEqual(Object.keys(video.payload).sort());
  });

  it("executes image tasks as artifact URLs", async () => {
    vi.stubEnv("RUNWAY_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-1" }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-1", status: "succeeded", output: ["https://example.com/image.png"] }), { status: 200 })),
    );
    const result = await runwayGen4ImageAdapter.execute({ model: "gen4_image", promptText: "hi", ratio: "1920:1080" }, { poll_interval_ms: 1, timeout_ms: 100 });
    expect(result.images).toEqual([]);
    expect(result.artifacts).toEqual([{ kind: "image", media_type: "image/png", url: "https://example.com/image.png" }]);
  });

  it("executes video tasks as artifact URLs", async () => {
    vi.stubEnv("RUNWAY_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-2" }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: "task-2", status: "succeeded", output: ["https://example.com/video.mp4"] }), { status: 200 })),
    );
    const result = await runwayGen45VideoAdapter.execute({ model: "gen4.5", promptText: "hi", ratio: "1280:720", duration: 5 }, { poll_interval_ms: 1, timeout_ms: 100 });
    expect(result.images).toEqual([]);
    expect(result.artifacts).toEqual([{ kind: "video", media_type: "video/mp4", url: "https://example.com/video.mp4" }]);
  });
});
