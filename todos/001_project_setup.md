# Task 001: Project Scaffolding

## Status
DONE

## Description
Initialize the Astro project with Solid.js integration, TypeScript configuration, and basic project structure per specification.

## Dependencies
None - this is the first task.

## Acceptance Criteria
- [x] Flox environment activated (`flox activate`)
- [x] Astro project initialized with `bunx create-astro@latest`
- [x] `@astrojs/solid-js` integration added
- [x] TypeScript configured (strict mode)
- [x] Directory structure created per spec:
  - `src/content/` (enchantments, recipes, bundles)
  - `src/data/rules/`
  - `src/engine/`
  - `src/components/astro/`
  - `src/components/solid/`
  - `src/stores/`
  - `src/types/`
  - `src/styles/`
  - `public/assets/`
- [x] `astro.config.mjs` configured for static output
- [x] Basic `src/pages/index.astro` renders
- [x] `bun run dev` starts without errors
- [x] `bun run build` completes without errors

## Files to Create/Modify
- `package.json`
- `astro.config.mjs`
- `tsconfig.json`
- `src/pages/index.astro`
- `src/layouts/Base.astro`
- Directory structure (empty placeholder files as needed)

## Reference
See `specification.md` sections:
- Architecture > Tech Stack
- Architecture > Project Structure

## Notes
- Activate Flox environment before starting: `flox activate`
- Use Bun as package manager (not npm)
- Use Astro 5.x
- Use Solid.js 1.9.x
- Configure path alias `@/` for `src/`
