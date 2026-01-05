# Task 005: Rules Engine

## Status
DONE

## Description
Implement the rules/patch engine that handles edge cases like conditional conflicts (Mending+Infinity on bows), max level overrides, and cost modifiers.

## Dependencies
- Task 003 (Core types)

## Acceptance Criteria
- [x] `src/data/rules/patches.yaml` created with initial rules from spec
- [x] `src/data/rules/index.ts` implements `RulesEngine` class:
  - `hasConflict(enchantA, enchantB, itemType, baseConflicts): boolean`
  - `getMaxLevel(enchantId, baseMaxLevel): number`
  - `getCostModifier(enchantId): { bookMultiplierAdd, bookMultiplierMult }`
  - `canApplyTo(enchantId, itemType): boolean`
- [x] Conflict cache built for O(1) lookups
- [x] Singleton export `rulesEngine`
- [x] Unit tests cover:
  - Conditional conflict detection (mending+infinity on bow)
  - Conditional conflict ignored on other items
  - Base conflicts respected
  - Bidirectional conflict check
  - Max level overrides
  - Cost modifiers
  - Disabled rules ignored
  - Empty rules handled

## Files to Create/Modify
- `src/data/rules/types.ts` (already in 003, verify)
- `src/data/rules/patches.yaml`
- `src/data/rules/index.ts`
- `tests/unit/rules/rules-engine.test.ts`
- `tests/fixtures/rules.ts`

## Reference
- `specification.md` section: Rules Engine (Patch System)
- `docs/REFERENCES.md` section: Enchantment Conflicts

## Initial Rules to Include
```yaml
- mending-infinity-bow (conditional_conflict)
- riptide-loyalty (conditional_conflict)
- riptide-channeling (conditional_conflict)
- multishot-piercing (conditional_conflict)
- depth-strider-frost-walker (conditional_conflict)
- silk-touch-fortune (conditional_conflict)
- soul-speed-max (max_level_override)
- swift-sneak-max (max_level_override)
- treasure-enchant-cost (cost_modifier)
- curse-binding-wearables (item_restriction)
- sweeping-edge-java-only (item_restriction)
```

## Notes
- Need YAML parser - consider `yaml` package or inline JSON
- Build conflict cache in constructor for performance
- Rules should be testable in isolation (pass rules to constructor)
