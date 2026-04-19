import { buildClipTimelineCss } from "./slideshow-timeline-css.js";

export interface PlayableSlideshowHtmlInput {
  svgs: string[];
  /** One duration per slide (seconds). Length must match `svgs`. */
  durationsSec: number[];
  /** Document title and `<h1>` (visually hidden for screen readers). */
  title?: string;
  /** When true (default), CSS timeline loops forever in the browser. */
  loop?: boolean;
  stageWidth?: number;
  stageHeight?: number;
}

function stripXmlDeclaration(svg: string): string {
  return svg.replace(/^\uFEFF?<\?xml[^>]*>\s*/i, "").trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Self-contained HTML: open in a browser and the SVG slides animate via CSS (no HyperFrames CLI).
 */
export function buildPlayableSlideshowHtml(input: PlayableSlideshowHtmlInput): string {
  const svgs = input.svgs;
  if (svgs.length === 0) {
    throw new Error("buildPlayableSlideshowHtml requires at least one SVG.");
  }
  if (input.durationsSec.length !== svgs.length) {
    throw new Error("buildPlayableSlideshowHtml: durationsSec length must match svgs length.");
  }

  const width = input.stageWidth ?? 1920;
  const height = input.stageHeight ?? 1080;
  const title = input.title ?? "Animated slideshow";
  const loop = input.loop !== false;

  let t = 0;
  const clips = svgs.map((svg, index) => {
    const start = t;
    const durationSec = input.durationsSec[index] ?? 3;
    t += durationSec;
    return { svg, index, start, durationSec };
  });
  const totalDurationSec = Math.max(t, 0.25);

  const timelineCss = buildClipTimelineCss(
    clips.map((c) => ({ index: c.index, start: c.start, durationSec: c.durationSec })),
    totalDurationSec,
    { iterationCount: loop ? "infinite" : 1 },
  );

  const bodyInner = clips.map(({ svg, index, start, durationSec }) => {
    const trackIndex = index % 8;
    return [
      `<div`,
      `  class="hf-clip hf-clip--${index}"`,
      `  style="z-index:${10 + index}"`,
      `  data-start="${start}"`,
      `  data-duration="${durationSec}"`,
      `  data-track-index="${trackIndex}"`,
      `>`,
      `  <div class="hf-svg-slide" role="img" aria-label="slide ${index + 1}">`,
      stripXmlDeclaration(svg),
      `  </div>`,
      `</div>`,
    ].join("\n");
  });

  return [
    "<!doctype html>",
    `<html lang="en">`,
    `<head>`,
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<title>${escapeHtml(title)}</title>`,
    `<style>`,
    `:root { color-scheme: dark; }`,
    `html, body { height: 100%; margin: 0; background: #000; }`,
    `body { display: flex; align-items: center; justify-content: center; min-height: 100%; }`,
    `#wrap { width: min(96vw, calc(96vh * 16 / 9)); aspect-ratio: 16 / 9; max-height: 96vh; }`,
    `#stage { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; }`,
    `.hf-clip { position: absolute; inset: 0; display: grid; place-items: center; padding: 2.5%; box-sizing: border-box; opacity: 0; }`,
    `.hf-svg-slide { width: 100%; height: 100%; display: grid; place-items: center; box-sizing: border-box; }`,
    `.hf-svg-slide > svg { width: auto; height: auto; max-width: 100%; max-height: 100%; display: block; }`,
    timelineCss,
    `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }`,
    `@media (prefers-reduced-motion: reduce) {`,
    `  .hf-clip { animation: none !important; opacity: 0 !important; }`,
    `  .hf-clip--0 { opacity: 1 !important; }`,
    `}`,
    `</style>`,
    `</head>`,
    `<body>`,
    `<h1 class="sr-only">${escapeHtml(title)}</h1>`,
    `<div id="wrap">`,
    `<div id="stage" data-duration="${totalDurationSec}" data-width="${width}" data-height="${height}">`,
    ...bodyInner,
    `</div>`,
    `</div>`,
    `</body>`,
    `</html>`,
    "",
  ].join("\n");
}
