import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { codecV2 } from "@wittgenstein/schemas";
import { describe, expect, it } from "vitest";
import { audioCodec, parseAudioPlan } from "../src/index.js";

describe("@wittgenstein/codec-audio", () => {
  it("exports a typed v2 audio codec with default route validation", async () => {
    expect(audioCodec.name).toBe("audio");
    expect(audioCodec.id).toBe("audio");
    const validated = await audioCodec.schema["~standard"].validate({
      modality: "audio",
      prompt: "Render a short audio artifact.",
    });
    expect("value" in validated).toBe(true);
    expect(parseAudioPlan("{}").ok).toBe(true);
  });

  it("produces a wav artifact for speech with ambient overlay", async () => {
    const dir = await mkdtemp(join(tmpdir(), "witt-audio-"));
    const art = await audioCodec.produce(
      {
        modality: "audio",
        prompt: "Wittgenstein ships a hackathon-ready audio demo.",
        route: "speech",
        ambient: "rain",
      },
      {
        runId: "test-run",
        parentRunId: null,
        runDir: dir,
        seed: 7,
        outPath: join(dir, "speech.wav"),
        logger: console,
        clock: {
          now: () => Date.now(),
          iso: () => new Date().toISOString(),
        },
        sidecar: codecV2.createRunSidecar(),
        services: {
          dryRun: true,
        },
        fork: () => {
          throw new Error("not used in this test");
        },
      },
    );

    expect(art.mime).toBe("audio/wav");
    expect(art.outPath.endsWith(".wav")).toBe(true);
    expect(art.metadata.route).toBe("speech");
    expect(art.metadata.artifactSha256).toHaveLength(64);
    expect((await stat(art.outPath)).size).toBeGreaterThan(44);
  });

  it("keeps request-side route hints in codec-owned routing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "witt-audio-"));
    const art = await audioCodec.produce(
      {
        modality: "audio",
        prompt: "A small procedural melody.",
        route: "music",
      },
      {
        runId: "test-run",
        runDir: dir,
        seed: 7,
        parentRunId: null,
        outPath: join(dir, "music.wav"),
        logger: console,
        clock: {
          now: () => Date.now(),
          iso: () => new Date().toISOString(),
        },
        sidecar: codecV2.createRunSidecar(),
        services: {
          dryRun: true,
        },
        fork: () => {
          throw new Error("not used in this test");
        },
      },
    );

    expect(art.metadata.route).toBe("music");
    expect((await stat(art.outPath)).size).toBeGreaterThan(44);
  });
});
