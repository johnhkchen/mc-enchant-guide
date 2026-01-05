# Task 002: Test Scaffolding

## Status
DONE

## Description
Set up Vitest testing infrastructure with proper configuration for Solid.js components, coverage reporting, and test utilities.

## Dependencies
- Task 001 (Project scaffolding)

## Acceptance Criteria
- [x] Vitest installed and configured
- [x] `vitest.config.ts` created per spec
- [x] `tests/setup.ts` with localStorage mock
- [x] Test directory structure created:
  - `tests/fixtures/`
  - `tests/unit/engine/`
  - `tests/unit/rules/`
  - `tests/unit/stores/`
  - `tests/integration/`
  - `tests/components/`
- [x] Sample test file runs successfully
- [x] Coverage reporting works (`bun run test:coverage`)
- [x] Scripts added: `test`, `test:run`, `test:ui`, `test:coverage`, `test:watch`
- [x] Performance tracking system with `test:perf` script
- [x] `expectSlow()` decorator for marking intentionally slow tests
- [x] `trackPerf()` wrapper for tracking test durations

## Files to Create/Modify
- `package.json` (add devDependencies + scripts)
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/fixtures/enchantments.ts` (placeholder)
- `tests/fixtures/rules.ts` (placeholder)
- `tests/unit/example.test.ts` (verify setup works)

## Reference
See `specification.md` section: Testing Strategy

## Dependencies to Install
```
vitest
@vitest/coverage-v8
@vitest/ui
jsdom
vite-plugin-solid
```

## Notes
- Configure coverage thresholds per spec (90% engine, 85% rules)
- Use `globals: true` for cleaner test syntax
- Configure path aliases to match tsconfig
