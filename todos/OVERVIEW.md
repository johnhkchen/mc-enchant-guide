# Todo Overview

**Project**: Minecraft Enchant Guide
**Stack**: Flox + Bun + Astro + Solid.js
**Spec**: [specification.md](../specification.md)
**Refs**: [docs/REFERENCES.md](../docs/REFERENCES.md)

## Status

| # | Task | Status | Blockers |
|---|------|--------|----------|
| 001 | Project scaffolding | DONE | - |
| 002 | Test scaffolding | DONE | - |
| 003 | Core types | DONE | - |
| 004 | XP calculator | DONE | - |
| 005 | Rules engine | DONE | 003 |
| 006 | Enchantment content | DONE | 003, 005 |
| 007 | Enchantment lookup | DONE | 006 |
| 008 | Base items data | DONE | 003 |
| 009 | Optimizer engine | DONE | 004, 005, 007, 008 |
| 010 | BOM generator | DONE | 009 |
| 011 | Recipe content | DONE | 006, 008 |
| 012 | Bundle content | DONE | 011 |
| 013 | Cart store | DONE | 003 |
| 014 | Craft progress store | DONE | 003, 013 |
| 015 | Layout & Minecraft theme | DONE | 001 |
| 016 | Recipe card component | DONE | 015, 011, 009, 013 |
| 017 | Bundle card component | DONE | 015, 012, 013 |
| 018 | Catalog page | DONE | - |
| 019 | Quick Craft modal | DONE | 016, 009, 010, 014, 015 |
| 020 | Shopping List page | DONE | 013, 010, 015, 009 |
| 021 | Crafting Tree component | DONE | 009, 014, 015 |
| 022 | Improved Craft Modal | DONE | 019, 021 |
| 023 | Enchanted Book Labels | DONE | 009, 021 |
| 024 | Tree Auto-Scaling | DONE | 022 |
| 025 | Tree Connector Lines | DONE | 024 |
| 026 | Complete Enchantments | DONE | 006 |
| 027 | Fix Craft Tree Layout | DONE | 021, 025 |
| 028 | Nested HTML Tree Layout | DONE | 027 |
| 029 | Mobile Crafting Tree View | DONE | 028 |
| 030 | Inline Leaf Nodes | IN_PROGRESS | 029 |

## Current Focus

Task 030: Inline Leaf Nodes - Reduce dead space by rendering isolated leaves (base items) adjacent to their parent combine operations.

## Next Task Candidates

- Task 030: Inline Leaf Nodes (ready to start)

## Recent Updates

- Task 029 complete: Mobile Crafting Tree View
  - **Comprehensive mobile modal and tree improvements**
  - `src/styles/modal.css`: Full-screen mobile modal
    - Complete reset of modal constraints for mobile (`min-width: 0`, etc.)
    - CSS Grid layout (`grid-template-rows: auto auto 1fr`) for header/tabs/body
    - `position: fixed; inset: 0` ensures modal fills viewport exactly
    - Safe area padding for notched phones (`env(safe-area-inset-*)`)
    - Larger close button (40x40px) always accessible
  - `src/components/solid/CraftingTree.tsx`: Dynamic fit-to-width scaling
    - Measures tree natural width vs container width
    - Calculates and applies scale factor (min 0.3, max 1.0)
    - Recalculates on resize and tree changes
    - Wrapped tree in `.crafting-tree-scaler` for transform scaling
  - `src/components/solid/TreeNode.tsx`: Layout class detection
    - Added `tree-children--leaf-left/right` classes for asymmetric layouts
    - Identifies when leaf is paired with complex subtree
  - `src/styles/tree.css`: Touch-friendly + scaling support
    - `.crafting-tree-scaler` wrapper with `width: max-content`
    - Momentum scrolling, larger tap targets
  - `src/components/astro/Layout.astro`: Added `viewport-fit=cover` for iOS
  - 898 tests passing, build successful
  - **Known limitation**: Dead space from base items in corners (Task 030)
- Task 028 complete: Nested HTML Tree Layout
  - **Replaced level-based flat rendering with nested HTML structure**
  - `src/components/solid/TreeNode.tsx`: Recursive rendering (children above content)
    - Children rendered first in `.tree-children` container
    - Parent content rendered below, creating top-down visual flow
  - `src/components/solid/CraftingTree.tsx`: Simplified, removed SVG connector code
    - No more JS-based connector calculation
    - No ResizeObserver needed
  - `src/components/solid/tree-layout.ts`: Simplified to analysis utilities only
    - `analyzeTree()` for testing/validation
    - `countNodes()`, `getTreeDepth()` helpers
  - `src/styles/tree.css`: CSS pseudo-element connectors
    - `::before` on children for vertical drop lines
    - `::after` on children for horizontal bar segments
    - First/last/only-child selectors handle edge cases
    - Responsive with CSS custom properties
  - Bundle size reduced: QuickCraftModal 16.79 kB → 14.40 kB
  - 898 tests passing, build successful

## Previous Updates

- Task 027 complete: Fix Craft Tree Layout (CSS Grid approach)
  - **Replaced absolute positioning with CSS Grid/Flexbox** for natural responsive layout
  - `src/components/solid/tree-layout.ts`: Level-based organization (NOT pixel positions)
    - Organizes nodes by visual level (level 0 = leaves at top)
    - Provides tree structure for CSS Grid rendering
    - Left-to-right sorting within levels
  - `src/components/solid/CraftingTree.tsx`: CSS Grid layout with post-render SVG connectors
    - Uses `flex-direction: column` for levels
    - SVG connectors calculated from `getBoundingClientRect()` after CSS layout
    - ResizeObserver for responsive updates
  - `src/components/solid/TreeNode.tsx`: Content-only rendering (no positioning)
    - CSS handles all layout via parent grid/flex containers
  - `src/styles/tree.css`: Complete rewrite using CSS best practices
    - `.tree-levels`: Flexbox column for vertical level separation
    - `.tree-level`: Flexbox row with `justify-content: center`
    - `.tree-node`: Content-sized with `min-width`/`max-width` constraints
    - Responsive breakpoints for mobile
  - 17 tree-layout tests for level organization
  - 894 tests passing, build successful
- Task 026 complete: Complete Enchantments
  - Added 29 new enchantments across all categories
  - **Sword**: sweeping_edge, knockback, bane_of_arthropods
  - **Armor**: fire_protection, blast_protection, projectile_protection, thorns, respiration, aqua_affinity, depth_strider, frost_walker, soul_speed, swift_sneak
  - **Bow**: power, punch, flame, infinity
  - **Crossbow**: multishot, piercing, quick_charge
  - **Trident**: impaling, loyalty, riptide, channeling
  - **Mace**: density, breach, wind_burst
  - **Fishing rod**: luck_of_the_sea, lure
  - **Curses**: curse_of_binding, curse_of_vanishing
  - Fixed mending/infinity conflict symmetry
  - All data verified against wiki (REFERENCES.md)
  - 878 tests passing, build successful
- Task 025 complete: Tree Connector Lines
  - Replaced CSS pseudo-element connectors with SVG-based connectors
  - `src/components/solid/CraftingTree.tsx`: Added SVG connector calculation and rendering
  - `src/components/solid/TreeNode.tsx`: Added data attributes for node position tracking
  - `src/styles/tree.css`: Removed pseudo-element connectors, added SVG connector styles
  - Connectors now reliably render at all scale factors and tree depths
  - 59 tree component tests passing, build successful
- Task 026 created: Complete Enchantments - add missing enchantment definitions (sweeping_edge, etc.)
- Task 023 complete: Enchanted Book Labels
  - `src/engine/optimizer.ts`: Changed intermediate book labels from "Book A/B/C" to "Enchanted Book"
  - `src/components/solid/TreeNode.tsx`: Now shows enchantments on all combine nodes (not just root)
  - `src/styles/tree.css`: Added `.tree-combine-enchants--intermediate` styling for non-root nodes
  - Intermediate steps now display accumulated enchantments (e.g., "Sharpness V", "Looting III")
  - Final item still shows actual name (e.g., "Netherite Sword")
  - 878 tests passing
- Task 024 complete: Tree Auto-Scaling
  - `src/components/solid/CraftingTree.tsx`: Added auto-scaling wrapper with ResizeObserver
  - `src/styles/tree.css`: Fixed node widths (110px leaves, 120px operations)
  - Tree measures its natural size and applies CSS transform scale to fit container
  - Scale capped at min 0.5, max 1.0 for readability
  - Recalculates on window resize and container resize
  - 877 tests passing
- Task 022 complete: Improved Craft Modal
  - `src/components/solid/QuickCraftModal.tsx`: Added drag/resize functionality
  - `src/styles/modal.css`: Larger default size (900x650), resize handles, drag states
  - `src/styles/tree.css`: Flexible tree nodes that scale to fit container
  - Modal is draggable by header, resizable by edges/corners
  - Viewport boundary constraints prevent dragging off-screen
  - Mobile: full-width modal, drag/resize disabled
  - Tree nodes use flexible widths (80-140px leaves, 100-200px operations)
  - Keyboard accessibility preserved (Escape, Tab trap)
  - 878 total tests passing
- Task 020 complete: Shopping List Page
  - `src/pages/list.astro`: Main shopping list page at `/list` route
  - `src/components/solid/CartItemList.tsx`: Cart items with quantity controls [−][+], View, Remove
  - `src/components/solid/CombinedMaterials.tsx`: Aggregated BOM grouped by Base Items / Enchanted Books
  - Grand total levels displayed with purple accent styling
  - Clear All button with confirmation (click twice to confirm)
  - Copy List and Export as Text buttons for materials list
  - Empty state with link back to catalog
  - Reactive updates via cart-updated events and localStorage
  - Accessible: ARIA labels, proper headings, keyboard navigation
  - Pre-computes BOMs at build time to avoid client-side Node.js dependencies
  - 44 new tests (20 CartItemList + 24 CombinedMaterials)
  - 878 total tests passing
- Task 019 complete: Quick Craft Modal
  - `src/components/solid/QuickCraftModal.tsx`: Two-tab modal (Craft Order + Pick List)
  - `src/components/solid/PickListTab.tsx`: BOM checklist with copy button
  - `src/styles/modal.css`: Minecraft-themed modal styles
  - Opens on `quick-craft` event from RecipeCard
  - Craft Order tab: Reuses CraftingTree with progress tracking
  - Pick List tab: Material checklist with local gathering progress
  - Accessible: focus trap, ARIA attributes, keyboard navigation (Escape/Tab)
  - SSR-safe with browser checks
  - 75 new tests (PickListTab + QuickCraftModal)
  - 834 total tests passing
- Task 021 complete: Crafting Tree Component
  - `src/components/solid/CraftingTree.tsx`: Main tree visualization component
  - `src/components/solid/TreeNode.tsx`: Recursive node renderer (leaf/combine)
  - `src/styles/tree.css`: Minecraft-themed tree styles with connectors
  - Top-down flow: materials at top, final item at bottom
  - Interactive checkboxes synced with craft-progress store
  - Visual states: completed (green/dimmed), final (purple border)
  - Accessible: keyboard navigation, ARIA labels
  - Responsive: adapts to container width
  - 59 component tests, 759 total tests passing
- Task 018 complete: Catalog Page
  - `src/pages/index.astro`: Main catalog page with recipes and bundles
  - `src/components/solid/CatalogFilters.tsx`: Search, sort, and category tabs
  - `src/components/solid/CartBadge.tsx`: Reactive cart item count
  - Hero section with recipe/bundle counts
  - Responsive card grid (auto-fill 300-320px columns)
  - Filter controls: search by name/tags, sort 4 ways, 6 category tabs
  - Category tabs map to recipe categories (Tools = pickaxes+axes+shovels+hoes)
  - Empty state shown when no results match filters
  - Skip link for accessibility, proper ARIA labels
  - All recipes pre-computed at build time
  - 50 new component tests (21 CartBadge + 29 CatalogFilters)
  - 700 total tests (699 passing, 1 flaky perf test)
- Task 017 complete: Bundle Card Component
  - `src/components/astro/BundleCard.astro`: Displays bundle info with recipe list, stats, and actions
  - Green-tinted border for visual distinction from RecipeCard
  - Expandable "View Items" section shows all recipes with costs
  - "Add All to List" button adds entire bundle to cart via `addBundle()`
  - Uses package icon, shows item count and total level cost
  - 11 smoke tests for props interface and data transformations
  - 650 total tests passing
- Task 016 complete: Recipe Card Component
  - `src/components/astro/RecipeCard.astro`: Displays recipe info with enchantments, tags, and action buttons
  - `src/utils/format.ts`: Reusable formatting utilities (toRomanNumeral, formatEnchantment)
  - RecipeData extended to include raw enchantments for display
  - Quick Craft button dispatches custom event for modal system
  - Add to List button integrates with cart store
  - Responsive layout, accessible with proper heading levels and button labels
  - 20 unit tests for format utilities
  - 639 total tests passing
- Task 015 complete: Layout & Minecraft Theme
  - `src/styles/minecraft.css`: CSS custom properties (colors, spacing, typography)
  - `src/styles/components.css`: Buttons, cards, chips, form inputs, tooltips
  - `src/components/astro/Layout.astro`: Main layout with header, nav, footer
  - Minecraft color palette verified against wiki (gray panels, gold accents, purple enchantments)
  - Responsive foundation (desktop-first, 640px+ support)
  - Cart badge reads from localStorage, updates cross-tab
  - Build + all 619 tests passing
- Task 014 complete: Craft Progress Store
  - `src/stores/craft-progress.ts`: Solid.js reactive store with signals
  - Actions: `toggleNode`, `reset`, `resetAll`
  - State access: `getProgress`, `isCompleted`
  - Derived: `getCompletionPercent`, `isRecipeComplete`
  - localStorage persistence (key: `mc-enchant:progress`)
  - SSR-safe, handles corrupted data gracefully
  - 44 unit tests, 100% coverage across all metrics
  - 619 total tests passing
- Task 013 complete: Shopping Cart Store
  - `src/stores/cart.ts`: Solid.js reactive store with signals
  - Actions: `add`, `addBundle`, `remove`, `updateQuantity`, `clear`
  - Derived signals: `totalLevels`, `totalItems`, `isEmpty`
  - localStorage persistence (key: `mc-enchant:cart`)
  - SSR-safe (no window access during server render)
  - 38 unit tests, 100% statements, 93.33% branches coverage
  - 575 total tests passing
- Task 012 complete: Bundle content collection
  - `src/content/bundles/`: 5 bundles (starter-kit, mining-setup, combat-kit, tool-set, sword-collection)
  - `src/data/bundle-lookup.ts`: Bundle lookup module with lazy computation
  - Functions: `getBundle`, `getAllBundles`, `getBundleRecipes`, `getBundlesByTag`
  - Computed properties: `totalLevelCost`, `itemCount` per bundle
  - 38 unit tests, 52 integration tests, 93.58% statements coverage
  - All bundles validated (recipe references exist, no duplicates)
  - 537 total tests passing
- Task 011 complete: Recipe content collection
  - `src/content/recipes/`: 10 recipes across swords, pickaxes, axes, armor
  - `src/data/recipe-lookup.ts`: Recipe lookup module with lazy computation
  - Added protection and feather_falling enchantments to content
  - Functions: `getRecipe`, `getAllRecipes`, `getRecipesByCategory`, `getRecipesByTag`
  - 61 unit tests, 30 integration tests, 94.17% statements coverage
  - All recipes validated (no conflicts, under survival cap)
  - 447 total tests passing
- Task 010 complete: BOM generator
  - `src/engine/bom.ts`: Bill of Materials generator
  - `generateBOM(tree)`: Extracts leaf nodes, parses books/base items
  - `aggregateBOMs(boms)`: Merges multiple BOMs with quantity aggregation
  - Reverse lookup from enchantment display name to ID
  - 49 unit tests, 97.16% statements, 98.01% lines coverage
  - 356 total tests passing
- Task 009 complete: Optimizer engine
  - `src/engine/optimizer.ts`: Core optimization algorithm
  - `computeOptimalTree`: Finds minimum-cost combination order
  - `computeRecipe`: Returns tree with level/XP costs
  - `calculateCombineCost`: PWP + enchantment cost calculation
  - Brute-force permutation search (7! = 5040 tractable)
  - Survival cap (39 levels) validation per step
  - 68 unit tests, 89.47% branch coverage, 99.28% statements
  - God sword (7 enchants) computes in ~20ms
  - 307 total tests passing
- Task 008 complete: Base items data module
  - `src/data/base-items.ts`: 64 base items (tools, weapons, armor, singletons)
  - Functions: `getBaseItem`, `getAllBaseItems`, `getBaseItemsByType`, `getValidMaterials`, `itemTypeRequiresMaterial`
  - Material variants for tools/weapons (6) and armor (6 + turtle helmet)
  - Display name generation (e.g., "Netherite Sword", "Turtle Shell")
  - 72 unit tests, 100% coverage
  - 239 total tests passing
- Task 007 complete: Enchantment lookup module
  - `src/data/enchantment-lookup.ts`: O(1) lookup by ID, category filtering, item filtering
  - Extended `EnchantmentData` type includes category + itemMultiplier
  - Fallback data for test environments
  - 45 unit tests, 95%+ statements, 84%+ branches coverage
  - `vitest.config.ts` updated with coverage thresholds for data module
  - 167 total tests passing
- Task 006 complete: Enchantment content collection
  - `src/content/config.ts`: Zod schemas for enchantments, recipes, bundles
  - 9 enchantments: sharpness, smite, unbreaking, mending, looting, fire_aspect, efficiency, fortune, silk_touch
  - `tests/integration/content-validation.test.ts`: 25 tests for schema/conflict validation
  - All data verified against wiki (levelStats, multipliers, conflicts)
  - 122 total tests passing
- Task 005 complete: Rules engine implemented
  - `src/data/rules/patches.yaml`: 11 rules (conflicts, max levels, cost modifiers, item restrictions)
  - `src/data/rules/index.ts`: `RulesEngine` class with O(1) conflict cache
  - 49 tests, 96.72% coverage (exceeds 85% target)
  - Added `yaml` package for YAML parsing
- Task 004 complete: XP calculator implemented
  - `src/engine/xp-calc.ts`: 5 functions (levelToXp, xpToLevel, xpBetweenLevels, calculateIncrementalXp, calculateBulkXp)
  - 100% test coverage (40 tests)
  - Corrected reference value: level 7 = 91 XP (not 37 as originally listed)
- Task 003 complete: Core TypeScript types defined
  - `src/types/index.ts`: 17 types (enchantments, items, recipes, bundles, crafting, state)
  - `src/data/rules/types.ts`: 12 types (rule engine types for patch system)
- Task 002 complete: Vitest test infrastructure
  - Coverage reporting with thresholds per spec
  - Performance tracking system (`test:perf`)
  - `expectSlow()` decorator for intentionally slow tests
  - `trackPerf()` wrapper for duration tracking
- Task 001 complete: Astro 5.x + Solid.js 1.9.x initialized

## Known Issues

None currently.
