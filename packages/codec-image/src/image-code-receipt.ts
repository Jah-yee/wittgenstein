import type { ImageSceneSpec } from "./schema.js";
import type { ImageCodePath, ImageCodeReceipt } from "./types.js";

export function imageCodePath(scene: ImageSceneSpec): ImageCodePath {
  if (scene.providerLatents) {
    return "provider-latents";
  }
  if (scene.coarseVq) {
    return "coarse-vq";
  }
  if (scene.seedCode) {
    return "visual-seed-code";
  }
  return "semantic-fallback";
}

export function imageCodeReceipt(scene: ImageSceneSpec): ImageCodeReceipt {
  return {
    mode: scene.mode ?? "semantic-only",
    path: imageCodePath(scene),
    hasSemantic: scene.semantic !== undefined,
    hasSeedCode: scene.seedCode !== undefined,
    hasCoarseVq: scene.coarseVq !== undefined,
    hasProviderLatents: scene.providerLatents !== undefined,
    seedFamily: scene.seedCode?.family ?? null,
    seedMode: scene.seedCode?.mode ?? null,
    seedLength: scene.seedCode?.tokens.length ?? null,
    coarseVqGrid: scene.coarseVq?.tokenGrid ?? null,
    providerLatentGrid: scene.providerLatents?.tokenGrid ?? null,
  };
}
