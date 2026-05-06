import type { ImageSceneSpec } from "./schema.js";
import type { codecV2 } from "@wittgenstein/schemas";

export type ImageCodePath =
  | "provider-latents"
  | "coarse-vq"
  | "visual-seed-code"
  | "semantic-fallback";

export type ImageSemanticSource = "emitted" | "legacy-top-level" | "absent";

export interface ImageCodeReceipt {
  readonly mode: NonNullable<ImageSceneSpec["mode"]>;
  readonly path: ImageCodePath;
  readonly hasSemantic: boolean;
  readonly hasEmittedSemantic: boolean;
  readonly hasEffectiveSemantic: boolean;
  readonly semanticSource: ImageSemanticSource;
  readonly hasSeedCode: boolean;
  readonly hasCoarseVq: boolean;
  readonly hasProviderLatents: boolean;
  readonly seedFamily: string | null;
  readonly seedMode: string | null;
  readonly seedLength: number | null;
  readonly coarseVqGrid: readonly [number, number] | null;
  readonly providerLatentGrid: readonly [number, number] | null;
}

export interface ImageArtifactMetadata extends codecV2.BaseArtifactMetadata {
  readonly codec: "image";
  readonly route: "raster";
  warnings: codecV2.CodecWarning[];
  readonly llmTokens: { input: number; output: number };
  readonly costUsd: number;
  readonly durationMs: number;
  readonly seed: number | null;
  readonly promptExpanded: string | null;
  readonly llmOutputRaw: string | null;
  readonly llmOutputParsed: ImageSceneSpec | null;
  readonly imageCode: ImageCodeReceipt;
  readonly quality: {
    readonly structural: {
      readonly schemaValidated: boolean;
      readonly route: "raster";
      readonly imageCode: ImageCodeReceipt;
      readonly paletteCount: number;
      readonly palette: string[];
    };
    readonly partial: {
      readonly reason: "adapter-stub";
    };
  };
  readonly adapterHash: string;
  readonly decoderHash: {
    readonly value: string;
    readonly frozen: true;
    readonly slot: "LFQ-family-decoder";
  };
  artifactSha256: string | null;
}

export interface ImageArtifact extends codecV2.BaseArtifact {
  readonly outPath: string;
  bytes?: Uint8Array;
  readonly mime: "image/png";
  readonly width: number;
  readonly height: number;
  readonly metadata: ImageArtifactMetadata;
}
