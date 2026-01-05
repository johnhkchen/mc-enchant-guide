# Task 010: Bill of Materials Generator

## Status
DONE

## Description
Create the BOM (Bill of Materials) generator that extracts the list of required materials from a crafting tree. This powers the shopping list and pick list features.

## Dependencies
- Task 009 (Optimizer engine)

## Acceptance Criteria
- [x] `src/engine/bom.ts` created
- [x] `generateBOM(tree: CraftingTreeNode): BillOfMaterials`
- [x] `aggregateBOMs(boms: BillOfMaterials[]): BillOfMaterials`
- [x] Correctly extracts all leaf nodes from tree
- [x] Groups identical items with quantities
- [x] Separates base item from enchanted books
- [x] Output format matches BOMItem interface:
  - item: display string ("Sharpness V Book")
  - itemType: 'book' | 'base_item'
  - enchantment: EnchantmentId (for books)
  - enchantmentLevel: number (for books)
  - quantity: number
- [x] aggregateBOMs merges multiple recipes correctly
- [x] Unit tests with 90%+ coverage

## Files to Create/Modify
- `src/engine/bom.ts`
- `tests/unit/engine/bom.test.ts`

## Reference
- `specification.md`: BOMItem, BillOfMaterials interfaces
- `src/types/index.ts`: Type definitions

## Test Cases
- Single enchantment recipe → 1 book + 1 base item
- Multi-enchantment recipe → N books + 1 base item
- Aggregate 2 sword recipes → 2 swords + combined books
- Aggregate same recipe x2 → quantities doubled

## Notes
- BOM is computed from the tree's leaf nodes
- Display strings should be human-readable ("Smite V Book", "Netherite Sword")
- aggregateBOMs is used for the shopping list page to combine cart items
