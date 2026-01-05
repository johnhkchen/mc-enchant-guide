# Task 008: Base Items Data

## Status
DONE

## Description
Create the base items data module defining all enchantable items in Minecraft. This provides item metadata used by recipes, the optimizer, and UI components.

## Dependencies
- Task 003 (Core types)

## Acceptance Criteria
- [x] `src/data/base-items.ts` created
- [x] `getBaseItem(type, material?): BaseItem`
- [x] `getAllBaseItems(): BaseItem[]`
- [x] `getBaseItemsByType(type): BaseItem[]`
- [x] All item types from spec covered:
  - Weapons: sword, axe, bow, crossbow, trident, mace
  - Tools: pickaxe, shovel, hoe, fishing_rod, shears, flint_and_steel
  - Armor: helmet, chestplate, leggings, boots
  - Other: shield, elytra
- [x] Material variants for applicable items (netherite, diamond, iron, etc.)
- [x] Display names generated correctly ("Netherite Sword", "Diamond Pickaxe")
- [x] Unit tests with 85%+ coverage (achieved 100%)

## Files to Create/Modify
- `src/data/base-items.ts`
- `tests/unit/data/base-items.test.ts`

## Reference
- `specification.md`: BaseItem, BaseItemType, ItemMaterial types
- `src/types/index.ts`: Type definitions

## Notes
- Not all items have material variants (bow, crossbow, trident, mace, fishing_rod, shears, flint_and_steel, shield, elytra)
- Turtle shell is a special helmet material
- Consider which materials are most commonly enchanted (netherite, diamond primarily)
