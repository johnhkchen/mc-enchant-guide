# Task 016: Recipe Card Component

## Status
DONE

## Description
Create the RecipeCard component for displaying individual recipes in the catalog. Shows recipe name, total level cost, enchantment list, tags, and action buttons.

## Dependencies
- Task 015 (Layout & Theme CSS)
- Task 011 (Recipe content)
- Task 009 (Optimizer - for computing tree/costs)
- Task 013 (Cart store - for Add to List)

## Acceptance Criteria
- [x] `src/components/astro/RecipeCard.astro` created
- [x] Displays:
  - Recipe name (prominent)
  - Base item icon placeholder (or text fallback)
  - Total level cost (gold text)
  - Enchantment chips (purple, show level e.g., "Sharpness V")
  - Tags as small chips (if present)
- [x] Action buttons:
  - [Quick Craft] - opens modal (event dispatch, modal in later task)
  - [Add to List] - adds recipe to cart store
- [x] Props interface:
  - `recipe`: RecipeData from recipe-lookup (includes computed tree and costs)
- [x] Responsive: cards work in grid layout
- [x] Accessible: proper heading levels, button labels
- [x] Smoke test: RecipeCard renders with sample data

## Files to Create/Modify
- `src/components/astro/RecipeCard.astro`
- `src/styles/components.css` (add card-specific styles if needed)

## Reference
- `specification.md`: Page: Catalog (index)
- Task 011 for recipe data structure

## Component Props
```typescript
interface RecipeCardProps {
  recipe: {
    id: string;           // e.g., "swords/god-sword"
    data: {
      name: string;
      category: RecipeCategory;
      baseItem: string;
      tags?: string[];
      enchantments: Record<string, number>[];
    };
  };
  computed: ComputedRecipe;  // From optimizer
}
```

## Visual Structure (ASCII)
```
┌─────────────────────────────────┐
│  ⚔️  God Sword                  │
│      ═══════════                │
│                                 │
│  [Sharpness V] [Looting III]    │
│  [Fire Aspect II] [Unbreaking III] │
│  [Sweeping Edge III] [Mending]  │
│  [Knockback II]                 │
│                                 │
│  #god-tier  #pve               │
│                                 │
│  Total: 45 levels              │
│                                 │
│  [Quick Craft]  [Add to List]  │
└─────────────────────────────────┘
```

## Notes
- Use Astro component (static rendering)
- "Add to List" button needs client-side JS (Solid island or inline script)
- "Quick Craft" dispatches custom event for modal system (later task)
- Consider hover states for buttons
- Enchantment chips should be visually distinct from tag chips
