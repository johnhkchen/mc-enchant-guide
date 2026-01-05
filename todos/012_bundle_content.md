# Task 012: Bundle Content Collection

## Status
DONE

## Description
Create the bundle content collection with markdown files defining recipe bundles (kits). Bundles are convenience groupings that allow users to add multiple recipes to their cart at once. They reference existing recipes by ID.

## Dependencies
- Task 011 (Recipe content - bundles reference recipes)

## Acceptance Criteria
- [x] `src/content/bundles/` directory created
- [x] Bundle schema in `src/content/config.ts` (already exists, verify)
- [x] Bundle lookup module `src/data/bundle-lookup.ts`:
  - `getBundle(id: string): Bundle | undefined`
  - `getAllBundles(): Bundle[]`
  - `getBundleRecipes(id: string): ComputedRecipe[]`
- [x] At least 5 initial bundles created:
  - Starter Kit (sword + pickaxe + axe + armor)
  - Mining Setup (fortune pick + silk touch pick)
  - Combat Kit (sword + armor)
  - Tool Set (pickaxe + axe)
  - Sword Collection (god-sword + mob-farm-sword + pvp-sword)
- [x] All bundles validated:
  - All recipe references exist
  - No duplicate recipe references
- [x] Computed bundle properties:
  - Total level cost (sum of recipe costs)
  - Total item count
- [x] Integration tests for bundle validation
- [x] Unit tests for bundle lookup (90%+ coverage)

## Files to Create/Modify
- `src/content/bundles/*.md`
- `src/data/bundle-lookup.ts`
- `tests/unit/data/bundle-lookup.test.ts`
- `tests/integration/bundle-validation.test.ts`

## Reference
- `specification.md`: Bundle frontmatter format, Base Catalog section
- Task 011 for recipe IDs to reference

## Bundle Frontmatter Format
```yaml
---
name: "Starter Kit"
description: "Everything a new player needs for survival"
recipes:
  - swords/god-sword
  - pickaxes/god-pickaxe
  - axes/god-axe
  - armor/protection-helmet
  - armor/protection-chestplate
  - armor/protection-leggings
  - armor/protection-boots
tags: ["beginner", "survival"]
---

Optional longer description here.
```

## Initial Bundle Set

| Bundle | Recipes | Purpose |
|--------|---------|---------|
| Starter Kit | God Sword, God Pickaxe, God Axe, Full Protection Armor | New player essentials |
| Mining Setup | Fortune Pick, Silk Touch Pick | Efficient mining |
| Combat Kit | God Sword, Protection Armor | Battle-ready |
| Full Armor Set | Helmet, Chestplate, Leggings, Boots | Complete armor |
| Tool Set | God Pickaxe, God Axe, Shovel | Basic tools |

## Bundle Interface
```typescript
interface Bundle {
  id: string;
  name: string;
  description?: string;
  recipeIds: string[];
  tags?: string[];
  // Computed
  totalLevelCost: number;
  itemCount: number;
}
```

## Notes
- Bundle IDs are derived from filename: `starter-kit.md` → `starter-kit`
- Bundles don't have their own crafting trees - they aggregate recipe data
- The "Add All" button adds each recipe individually to the cart
- Total costs are computed by summing individual recipe costs
- Consider showing a preview of included recipes in the UI
