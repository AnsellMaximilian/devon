# Dev On!

A local-first Next.js MVP for a tactical programming-themed card battler. Build a 20-card developer deck, configure four work areas, claim projects from a shared backlog, and resolve four-sequence sprints against a computer opponent.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open the local URL printed by Next.js. Validate a production build with `pnpm typecheck` and `pnpm build`.

## Project map

- `components/DevOn.tsx` — menus, deck builder, battle state, AI, action planner, and animations
- `lib/game-data.ts` — developer roster, traits, projects, tasks, and role modifiers
- `public/developers/` — reusable text-free 3:4 portrait artwork
- `docs/GAME_RULES.md` — canonical MVP rules and balance constants
- `docs/STRATEGIES.md` — emergent strategies and playtest questions
- `docs/ASSET_PIPELINE.md` — reproducible art direction and generation prompts

All game state is local in this MVP. The data and resolver boundaries are intentionally explicit so server authority and knowledge-based rules help can be added later.
