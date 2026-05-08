# Wittgenstein website app

Stack:

- Vite
- React 19
- TypeScript
- Tailwind CSS
- shadcn-style component setup

Primary purpose:

- present the project thesis cleanly
- align the site copy with the real repository
- support deployment on `wittgenstein.wtf`

Important constraints:

- UI structure stays stable unless explicitly changed
- section framework stays stable
- copy should track actual engineering status

Useful commands:

- `pnpm dev:site`
- `pnpm --filter @wittgenstein/site build`
- `pnpm --filter @wittgenstein/site preview`
- `pnpm --filter @wittgenstein/site check`
