# Codec Protocol

Every modality package exports a `WittgensteinCodec<Req, Parsed>`.

```ts
interface WittgensteinCodec<Req, Parsed> {
  name: string;
  modality: Modality;
  schemaPreamble(req: Req): string;
  requestSchema: z.ZodSchema<Req>;
  outputSchema: z.ZodSchema<Parsed>;
  parse(llmRaw: string): Result<Parsed>;
  render(parsed: Parsed, ctx: RenderCtx): Promise<RenderResult>;
}
```

## Contract Rules

- `requestSchema` validates the user-facing request.
- `schemaPreamble()` is the codec-owned prompt contract for the model.
- `outputSchema` validates the model-emitted IR or code-bearing contract.
- `parse()` must return structured success or failure, never throw for bad JSON.
- `render()` may throw structured implementation errors while the codec is stubbed.

## RenderResult

Renderers return the file path plus metadata needed for manifests:

- artifact path
- MIME type
- byte size
- codec name and route
- token usage
- cost
- duration
- seed

## Why This Matters

This contract is the seam that lets Image, Audio, Sensor, and future codecs work independently while the harness remains shared. For image, the output side is no longer interpreted as semantic JSON alone: the codec contract now needs to admit Visual Seed Code as the primary decoder-facing layer, with optional semantic IR and VQ hints behind the same typed boundary.
