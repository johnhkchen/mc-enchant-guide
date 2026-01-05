# Task 026: Complete Enchantment Content Collection

## Status
DONE

## Description
The enchantment content collection is incomplete. Recipes reference enchantments that don't exist in the content, causing validation test failures. Need to add all missing enchantments to ensure recipes can reference any valid Minecraft enchantment.

Current issue: `mob-farm-sword` recipe references `sweeping_edge` but that enchantment is not defined.

## Dependencies
- Task 006 (Enchantment content collection - initial setup)

## Acceptance Criteria
- [x] All enchantments referenced by existing recipes are defined
- [x] Add sweeping_edge enchantment
- [x] Add any other missing sword enchantments (knockback, etc.)
- [x] Add armor enchantments (protection variants, thorns, etc.)
- [x] Add tool enchantments (efficiency, fortune, silk_touch already exist)
- [x] Add bow/crossbow enchantments (power, punch, infinity, etc.)
- [x] Add trident enchantments (riptide, loyalty, channeling, impaling)
- [x] All enchantment data verified against wiki (multipliers, max levels, conflicts)
- [x] Recipe validation tests pass (877+ tests)

## Files to Create/Modify
- `src/content/enchantments/*.yaml` - Add missing enchantment definitions

## Reference
- `docs/REFERENCES.md` - Minecraft wiki links for enchantment data
- `src/content/config.ts` - Enchantment schema
- Existing enchantments: sharpness, smite, unbreaking, mending, looting, fire_aspect, efficiency, fortune, silk_touch, protection, feather_falling

## Notes
- Each enchantment needs: id, name, maxLevel, bookMultiplier, itemMultiplier, conflicts, applicableTo
- Verify multipliers against wiki anvil mechanics page
- Check for conflicts (e.g., silk_touch vs fortune, protection variants)
