import type { ImageSceneSpec } from "./schema.js";
import type { ImageCodePath, ImageCodeReceipt, ImageSemanticSource } from "./types.js";

const defaultSemantic = {
  intent: "placeholder scene",
  subject: "placeholder subject",
  composition: {
    framing: "medium shot",
    camera: "neutral camera",
    depthPlan: ["foreground", "midground", "background"],
  },
  lighting: { mood: "neutral", key: "soft" },
  style: { references: [], palette: ["black", "white"] },
  constraints: { mustHave: [], negative: [] },
} as const;

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

function sameList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function hasLegacyTopLevelSemantic(scene: ImageSceneSpec): boolean {
  return (
    scene.intent !== defaultSemantic.intent ||
    scene.subject !== defaultSemantic.subject ||
    scene.composition.framing !== defaultSemantic.composition.framing ||
    scene.composition.camera !== defaultSemantic.composition.camera ||
    !sameList(scene.composition.depthPlan, defaultSemantic.composition.depthPlan) ||
    scene.lighting.mood !== defaultSemantic.lighting.mood ||
    scene.lighting.key !== defaultSemantic.lighting.key ||
    !sameList(scene.style.references, defaultSemantic.style.references) ||
    !sameList(scene.style.palette, defaultSemantic.style.palette) ||
    !sameList(scene.constraints.mustHave, defaultSemantic.constraints.mustHave) ||
    !sameList(scene.constraints.negative, defaultSemantic.constraints.negative)
  );
}

export function imageSemanticSource(scene: ImageSceneSpec): ImageSemanticSource {
  if (scene.semantic) {
    return "emitted";
  }
  if (hasLegacyTopLevelSemantic(scene)) {
    return "legacy-top-level";
  }
  return "absent";
}

export function imageCodeReceipt(scene: ImageSceneSpec): ImageCodeReceipt {
  const semanticSource = imageSemanticSource(scene);
  return {
    mode: scene.mode ?? "semantic-only",
    path: imageCodePath(scene),
    hasSemantic: semanticSource !== "absent",
    hasEmittedSemantic: semanticSource === "emitted",
    hasEffectiveSemantic: semanticSource !== "absent",
    semanticSource,
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
