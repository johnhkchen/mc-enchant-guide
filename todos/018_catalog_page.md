# Task 018: Catalog Page

## Status
DONE

## Description
Implement the main catalog page (index.astro) that displays all recipes and bundles with search, filtering, and sorting capabilities. This is the primary entry point for users.

## Dependencies
- Task 015 (Layout & Theme CSS)
- Task 016 (Recipe Card)
- Task 017 (Bundle Card)
- Task 011 (Recipe content)
- Task 012 (Bundle content)
- Task 009 (Optimizer - for computing costs)

## Acceptance Criteria
- [x] `src/pages/index.astro` fully implemented
- [x] Header section:
  - Site title
  - Shopping List link with item count badge (reactive via Solid island)
- [x] Filter controls:
  - Search input (filters by name)
  - Sort dropdown: "XP Cost High→Low" (default), "XP Cost Low→High", "A-Z", "Z-A"
  - Category tabs: [All] [Swords] [Tools] [Armor] [Ranged] [Other]
- [x] Content grid:
  - Bundles section (if any match filters)
  - Recipes section
  - Responsive grid layout (3-4 columns desktop, 2 tablet, 1 mobile)
- [x] All recipes pre-computed at build time (no client-side optimization)
- [x] Empty state message when no results match filters
- [x] Accessible: skip links, proper headings, keyboard navigation

## Files to Create/Modify
- `src/pages/index.astro`
- `src/components/solid/CartBadge.tsx` (reactive item count)
- `src/components/solid/CatalogFilters.tsx` (search + sort + tabs)

## Reference
- `specification.md`: Page: Catalog (index)
- Recipe lookup: `src/data/recipe-lookup.ts`
- Bundle lookup: `src/data/bundle-lookup.ts`

## Page Structure
```
┌─────────────────────────────────────────────────────────┐
│  ⚒️ Minecraft Enchant Guide          [Shopping List (3)]│
├─────────────────────────────────────────────────────────┤
│  [🔍 Search recipes...]     [Sort: XP High→Low ▼]       │
│                                                         │
│  [All] [Swords] [Tools] [Armor] [Ranged] [Other]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  BUNDLES                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │Starter  │ │Mining   │ │Combat   │                   │
│  │Kit      │ │Setup    │ │Kit      │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
│                                                         │
│  RECIPES                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │God      │ │Mob Farm │ │Fortune  │ │Silk     │       │
│  │Sword    │ │Sword    │ │Pick     │ │Pick     │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Category Mapping
```typescript
const categoryTabs = {
  all: null,  // No filter
  swords: ['swords'],
  tools: ['pickaxes', 'axes', 'shovels', 'hoes'],
  armor: ['helmets', 'chestplates', 'leggings', 'boots'],
  ranged: ['bows', 'crossbows', 'tridents'],
  other: ['maces', 'fishing_rods'],
};
```

## Build-Time Data Flow
```
1. Load all recipes from content collection
2. For each recipe, compute optimal tree via optimizer
3. Load all bundles, resolve recipe references
4. Pass pre-computed data to page template
5. Render static HTML with Solid islands for interactivity
```

## Client-Side Interactivity (Solid Islands)
- `CartBadge`: Reads from cart store, shows count, links to /list
- `CatalogFilters`: Search input, sort select, category tabs
  - Filters are URL params or client-side state
  - Consider: client-side filtering (fast) vs URL params (shareable)

## Notes
- All recipe optimization happens at build time, not runtime
- Consider pagination or "load more" if recipe count grows large
- Search should be case-insensitive, match name and tags
- Category tabs filter both recipes AND bundles
- Mobile: filters might need a collapsible drawer
