# Task 006: Enchantment Content Collection

## Status
DONE

## Description
Create the Astro content collection for enchantments with Zod schema validation, and populate with initial enchantment data verified against `docs/REFERENCES.md`.

## Dependencies
- Task 003 (Core types)
- Task 005 (Rules engine - for conflict validation)

## Acceptance Criteria
- [x] `src/content/config.ts` created with `enchantments` collection schema
- [x] Schema validates:
  - `id`, `name`, `category`, `maxLevel`
  - `bookMultiplier`, `itemMultiplier`
  - `conflicts[]`, `applicableTo[]`
  - `icon` (optional), `color` (optional)
  - `levelStats[]` with `level`, `effect`, `numericValue`, `unit`
- [x] Directory structure: `src/content/enchantments/{category}/`
- [x] Initial enchantments created (minimum viable set):
  - damage/sharpness.md
  - damage/smite.md
  - utility/unbreaking.md
  - utility/mending.md
  - weapon/looting.md
  - weapon/fire_aspect.md
  - tool/efficiency.md
  - tool/fortune.md
  - tool/silk_touch.md
- [x] All data verified against `docs/REFERENCES.md`
- [x] Content collection builds without errors
- [x] Integration test: all conflicts reference valid enchantments

## Files to Create/Modify
- `src/content/config.ts`
- `src/content/enchantments/damage/sharpness.md`
- `src/content/enchantments/damage/smite.md`
- `src/content/enchantments/utility/unbreaking.md`
- `src/content/enchantments/utility/mending.md`
- `src/content/enchantments/weapon/looting.md`
- `src/content/enchantments/weapon/fire_aspect.md`
- `src/content/enchantments/tool/efficiency.md`
- `src/content/enchantments/tool/fortune.md`
- `src/content/enchantments/tool/silk_touch.md`
- `tests/integration/content-validation.test.ts`

## Reference
- `specification.md` sections:
  - Content Collection Schema
  - Enchantment Frontmatter Examples
- `docs/REFERENCES.md` section: Enchantment Multiplier Table

## Data Verification Checklist
For each enchantment, verify against `docs/REFERENCES.md`:
- [x] Max level correct
- [x] Book multiplier correct
- [x] Item multiplier correct
- [x] Conflicts list complete
- [x] Applicable items accurate
- [x] Level stats match wiki

## Notes
- Start with core enchantments, expand later
- Markdown body contains description/flavor text
- Use lowercase_snake_case for IDs
- levelStats array length MUST equal maxLevel
