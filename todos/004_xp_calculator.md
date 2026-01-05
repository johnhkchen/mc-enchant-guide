# Task 004: XP Calculator

## Status
DONE

## Description
Implement the XP/level calculation functions. These are used throughout the app to convert between levels and XP, and to calculate crafting costs.

## Dependencies
- Task 003 (Core types)

## Acceptance Criteria
- [x] `src/engine/xp-calc.ts` created with functions:
  - `levelToXp(level: number): number`
  - `xpToLevel(xp: number): number`
  - `xpBetweenLevels(from: number, to: number): number`
  - `calculateIncrementalXp(stepCosts: number[]): number`
  - `calculateBulkXp(stepCosts: number[]): number`
- [x] All formulas match Minecraft wiki exactly (see `docs/REFERENCES.md`)
- [x] Unit tests pass with reference values:
  - `levelToXp(0) === 0`
  - `levelToXp(7) === 91` (corrected from 37)
  - `levelToXp(15) === 315`
  - `levelToXp(30) === 1395`
  - `levelToXp(39) === 2727`
  - `levelToXp(50) === 5345`
- [x] Tests cover all three formula ranges (0-16, 17-31, 32+)
- [x] Edge cases handled (negative levels, fractional input)

## Files to Create/Modify
- `src/engine/xp-calc.ts`
- `tests/unit/engine/xp-calc.test.ts`

## Reference
- `specification.md` section: Engine > XP Calculation
- `docs/REFERENCES.md` section: Core Formulas > Experience (XP) to Level

## Formulas (from wiki)
```
For levels 0-16:
  Total XP = level² + 6 × level

For levels 17-31:
  Total XP = 2.5 × level² - 40.5 × level + 360

For levels 32+:
  Total XP = 4.5 × level² - 162.5 × level + 2220
```

## Notes
- Use `Math.floor()` for integer results where appropriate
- These functions are critical - test thoroughly
- Reference values are from Minecraft Wiki, verify in `docs/REFERENCES.md`
