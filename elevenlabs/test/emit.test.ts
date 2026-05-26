// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { elevenLabsTtsAdapter } from "../src/index.ts";

describe("ElevenLabsTtsAdapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("emits a deterministic text-to-speech payload with provider options", () => {
    const emission = elevenLabsTtsAdapter.emit(
      {
        subject: "Mosvera quickstart",
        voice: { eyebrow: "Quickstart", headline: "Aesthetic packs are local.", body: "Preview, import, resolve, compile." },
        motion: { pace: "warm" },
        quality: "high",
      },
      { providerOptions: { voice_id: "voice-demo" } },
    );
    expect(Object.keys(emission.payload)).toEqual(Object.keys(emission.payload).sort());
    expect(emission.payload).toMatchObject({
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      text: expect.stringContaining("Aesthetic packs are local."),
      voice_id: "voice-demo",
    });
  });

  it("executes text-to-speech into an audio artifact", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(Buffer.from("audio"), { status: 200 })));
    const result = await elevenLabsTtsAdapter.execute({ voice_id: "voice-demo", text: "Hello", model_id: "eleven_flash_v2_5" });
    expect(result.images).toEqual([]);
    expect(result.artifacts).toEqual([
      { kind: "audio", media_type: "audio/mpeg", data: Buffer.from("audio").toString("base64"), metadata: { provider: "elevenlabs-tts", voice_id: "voice-demo" } },
    ]);
  });
});
