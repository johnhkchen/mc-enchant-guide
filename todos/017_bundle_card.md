# Task 017: Bundle Card Component

## Status
DONE

## Description
Create the BundleCard component for displaying recipe bundles (kits) in the catalog. Shows bundle name, description, included recipes summary, total level cost, and action buttons.

## Dependencies
- Task 015 (Layout & Theme CSS)
- Task 012 (Bundle content)
- Task 013 (Cart store - for Add All)

## Acceptance Criteria
- [x] `src/components/astro/BundleCard.astro` created
- [x] Displays:
  - Bundle name (prominent)
  - Description (if present)
  - Item count (e.g., "7 items")
  - Total level cost (sum of all recipes)
  - Tags as small chips (if present)
- [x] Action buttons:
  - [View Items] - expands to show recipe list (or links to detail)
  - [Add All] - adds all recipes to cart store
- [x] Props interface:
  - `bundle`: Bundle data from content collection
  - `recipes`: Array of resolved recipe data with computed costs
- [x] Visual distinction from RecipeCard (different accent color or icon)
- [x] Responsive: cards work in grid layout alongside RecipeCards
- [x] Accessible: proper heading levels, button labels
- [x] Smoke test: BundleCard renders with sample data

## Files to Create/Modify
- `src/components/astro/BundleCard.astro`
- `src/styles/components.css` (add bundle-specific styles if needed)

## Reference
- `specification.md`: Page: Catalog (index)
- Task 012 for bundle data structure

## Component Props
```typescript
interface BundleCardProps {
  bundle: {
    id: string;           // e.g., "starter-kit"
    data: {
      name: string;
      description?: string;
      recipes: string[];  // Recipe IDs
      tags?: string[];
    };
  };
  // Pre-resolved recipe data for display
  resolvedRecipes: Array<{
    id: string;
    name: string;
    totalLevels: number;
  }>;
  totalLevelCost: number;  // Sum of all recipe costs
}
```

## Visual Structure (ASCII)
```
┌─────────────────────────────────┐
│  📦  Starter Kit                │
│      ══════════                 │
│                                 │
│  Everything a new player needs  │
│  for survival                   │
│                                 │
│  Contains 7 items               │
│  Total: 285 levels              │
│                                 │
│  #beginner  #survival           │
│                                 │
│  [View Items]    [Add All]      │
└─────────────────────────────────┘
```

## View Items Expansion (Optional)
Could show inline list on click:
```
┌─────────────────────────────────┐
│  📦  Starter Kit          [▼]   │
│  ├─ God Sword (45 lvl)          │
│  ├─ God Pickaxe (38 lvl)        │
│  ├─ God Axe (32 lvl)            │
│  ├─ Protection Helmet (28 lvl)  │
│  └─ ... 3 more                  │
└─────────────────────────────────┘
```

## Notes
- Use Astro component (static rendering)
- "Add All" button needs client-side JS (Solid island or inline script)
- Consider different border/accent color to distinguish from recipes
- Bundle icon could be a chest or package emoji/icon
- [View Items] could be a collapsible section or link to filtered catalog view
