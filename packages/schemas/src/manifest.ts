import { z } from "zod";

export const AudioRenderManifestSchema = z.object({
  sampleRateHz: z.number().int().positive(),
  channels: z.number().int().positive(),
  durationSec: z.number().nonnegative(),
  container: z.literal("wav"),
  bitDepth: z.number().int().positive(),
  determinismClass: z.enum(["byte-parity", "structural-parity"]),
  decoderId: z.string(),
  decoderHash: z.string().optional(),
});

export const RunManifestSchema = z.object({
  runId: z.string(),
  gitSha: z.string().nullable(),
  lockfileHash: z.string().nullable(),
  nodeVersion: z.string(),
  wittgensteinVersion: z.string(),

  command: z.string(),
  args: z.array(z.string()),
  seed: z.number().int().nullable(),

  codec: z.string(),
  tier: z.string().nullable().optional(),
  route: z.string().optional(),

  llmProvider: z.string(),
  llmModel: z.string(),
  llmTokens: z.object({
    input: z.number().int().nonnegative(),
    output: z.number().int().nonnegative(),
  }),
  costUsd: z.number().nonnegative(),

  promptRaw: z.string(),
  promptExpanded: z.string().nullable(),
  llmOutputRaw: z.string().nullable(),
  llmOutputParsed: z.unknown().nullable(),

  artifactPath: z.string().nullable(),
  artifactSha256: z.string().nullable(),
  audioRender: AudioRenderManifestSchema.optional(),

  startedAt: z.string(),
  durationMs: z.number().nonnegative(),
  ok: z.boolean(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type AudioRenderManifest = z.infer<typeof AudioRenderManifestSchema>;
export type RunManifest = z.infer<typeof RunManifestSchema>;
