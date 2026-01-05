# Task 007: Enchantment Lookup

## Status
DONE

## Description
Create the enchantment lookup module that bridges content collection data to the engine. This provides fast O(1) access to enchantment definitions by ID, used by the optimizer and UI components.

## Dependencies
- Task 006 (Enchantment content)

## Acceptance Criteria
- [x] `src/data/enchantment-lookup.ts` created
- [x] `getEnchantment(id: EnchantmentId): EnchantmentDef | undefined`
- [x] `getAllEnchantments(): EnchantmentDef[]`
- [x] `getEnchantmentsByCategory(category): EnchantmentDef[]`
- [x] `getEnchantmentsForItem(itemType): EnchantmentDef[]`
- [x] Data loaded from content collection at build time
- [x] Fallback to hardcoded data for test environment
- [x] Unit tests with 90%+ coverage

## Files to Create/Modify
- `src/data/enchantment-lookup.ts`
- `tests/unit/data/enchantment-lookup.test.ts`

## Reference
- `specification.md`: Project Structure, EnchantmentDef interface
- `src/types/index.ts`: EnchantmentDef, EnchantmentId types

## Notes
- Must work both at build time (Astro) and in tests (Vitest)
- Consider using a Map for O(1) lookups
- Include itemMultiplier from content (not in EnchantmentDef type - may need to extend)
