# Task 011: Recipe Content Collection

## Status
DONE

## Description
Create the recipe content collection with markdown files defining pre-configured enchantment recipes. Each recipe specifies a base item and enchantment list, from which the optimizer computes the crafting tree at build time.

## Dependencies
- Task 006 (Enchantment content - for valid enchantment IDs)
- Task 008 (Base items - for valid base item references)

## Acceptance Criteria
- [x] `src/content/recipes/` directory structure created
- [x] Recipe schema in `src/content/config.ts` (already exists, verify)
- [x] Recipe lookup module `src/data/recipe-lookup.ts`:
  - `getRecipe(id: string): ComputedRecipe | undefined`
  - `getAllRecipes(): ComputedRecipe[]`
  - `getRecipesByCategory(category: RecipeCategory): ComputedRecipe[]`
- [x] At least 10 initial recipes created:
  - Swords: God Sword, Mob Farm Sword, PvP Sword
  - Pickaxes: God Pickaxe, Silk Touch Pick, Fortune Pick
  - Axes: God Axe
  - Armor: Protection Helmet, Protection Chestplate, Protection Boots
- [x] All recipes validated:
  - No conflicting enchantments
  - All enchantments applicable to base item
  - Computes under 39-level cap
- [x] Integration tests for recipe validation
- [x] Unit tests for recipe lookup (90%+ coverage)

## Files to Create/Modify
- `src/content/recipes/swords/*.md`
- `src/content/recipes/pickaxes/*.md`
- `src/content/recipes/axes/*.md`
- `src/content/recipes/armor/*.md`
- `src/data/recipe-lookup.ts`
- `tests/unit/data/recipe-lookup.test.ts`
- `tests/integration/recipe-validation.test.ts`

## Reference
- `specification.md`: Recipe frontmatter format, Base Catalog section
- `docs/REFERENCES.md`: Enchantment compatibility
- Existing enchantment content in `src/content/enchantments/`

## Recipe Frontmatter Format
```yaml
---
name: "God Sword"
category: swords
baseItem: netherite_sword
tags: ["pve", "pvp", "general"]
enchantments:
  - sharpness: 5
  - looting: 3
  - fire_aspect: 2
  - unbreaking: 3
  - mending: 1
---

Optional description text here.
```

## Initial Recipe Set

### Swords
| Recipe | Enchantments |
|--------|-------------|
| God Sword | Sharpness V, Looting III, Fire Aspect II, Unbreaking III, Mending |
| Mob Farm Sword | Smite V, Looting III, Fire Aspect II, Unbreaking III, Mending |
| PvP Sword | Sharpness V, Fire Aspect II, Unbreaking III, Mending |

### Pickaxes
| Recipe | Enchantments |
|--------|-------------|
| God Pickaxe | Efficiency V, Fortune III, Unbreaking III, Mending |
| Silk Touch Pick | Efficiency V, Silk Touch, Unbreaking III, Mending |
| Fortune Pick | Efficiency V, Fortune III, Unbreaking III |

### Axes
| Recipe | Enchantments |
|--------|-------------|
| God Axe | Efficiency V, Sharpness V, Unbreaking III, Mending |

### Armor (Protection Set)
| Recipe | Enchantments |
|--------|-------------|
| Protection Helmet | Protection IV, Unbreaking III, Mending |
| Protection Chestplate | Protection IV, Unbreaking III, Mending |
| Protection Boots | Protection IV, Feather Falling IV, Unbreaking III, Mending |

## Notes
- Recipe IDs are derived from file path: `swords/god-sword.md` → `swords/god-sword`
- The lookup module should integrate with optimizer to compute trees at load time
- Consider lazy computation for performance (compute on first access)
- Tags enable filtering in the UI (e.g., "pve", "pvp", "beginner")
