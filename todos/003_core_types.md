# Task 003: Core Types

## Status
DONE

## Description
Define all TypeScript types and interfaces as specified. These form the foundation for all other modules.

## Dependencies
- Task 001 (Project scaffolding)

## Acceptance Criteria
- [x] `src/types/index.ts` created with all types from spec:
  - `EnchantmentId` (union type)
  - `EnchantmentDef`
  - `EnchantmentCategory`
  - `EnchantmentFrontmatter`
  - `EnchantmentLevelStat`
  - `BaseItemType`
  - `ItemMaterial`
  - `BaseItem`
  - `RecipeCategory`
  - `RecipeFrontmatter`
  - `BundleFrontmatter`
  - `CraftingTreeNode`
  - `ComputedRecipe`
  - `BOMItem`
  - `BillOfMaterials`
  - `CartItem`
  - `CraftProgress`
- [x] `src/data/rules/types.ts` created with rule types:
  - `RuleType`
  - `Edition`
  - `RuleCondition`
  - `BaseRule`
  - `ConditionalConflictRule`
  - `OverrideConflictRule`
  - `MaxLevelOverrideRule`
  - `CostModifierRule`
  - `ItemRestrictionRule`
  - `CustomValidationRule`
  - `Rule` (union)
  - `PatchFile`
- [x] Types compile without errors
- [x] Types are exported correctly

## Files to Create/Modify
- `src/types/index.ts`
- `src/data/rules/types.ts`

## Reference
See `specification.md` section: Data Models > Type Definitions

## Notes
- Follow spec exactly - these types are the contract
- Use `export type` for type-only exports
- Consider adding JSDoc comments for complex types
