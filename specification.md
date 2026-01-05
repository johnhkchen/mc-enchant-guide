# Minecraft Enchant Guide - Technical Specification

## Overview

A static web application for Minecraft players who craft enchanted items at scale. The tool provides a catalog of pre-defined enchantment "recipes" with optimized anvil combination orders, displayed as interactive visual trees with progress tracking.

**Target User**: Players who enchant items frequently (e.g., shop owners, server economies) and need quick reference for optimal crafting sequences without re-calculating each time.

---

## Goals

1. **Minimal hosting footprint** - Static site deployable to GitHub Pages/Cloudflare Pages
2. **Good to great UX** - Minecraft-styled interface, visual tree-based crafting guides
3. **Minimal maintenance burden** - No server, no database, content-driven architecture
4. **Zero security surface** - Static files only, client-side storage

---

## Core Concepts

### XP Economy Insight

Minecraft's XP system is non-linear. Higher levels are exponentially harder to earn:

| Level | Total XP Required | XP for this level |
|-------|-------------------|-------------------|
| 30    | 1,395             | 62                |
| 40    | 2,920             | 85                |
| 50    | 5,345             | 108               |

**Implication**: A single 39-level craft is more efficient than two 20-level crafts. The UI should help users identify high-value single crafts ("spend big").

### Prior Work Penalty (PWP)

Each anvil operation increases an item's PWP: `2^n - 1` where n = number of prior operations.

| Operations | Penalty Added |
|------------|---------------|
| 0          | 0             |
| 1          | 1             |
| 2          | 3             |
| 3          | 7             |
| 4          | 15            |
| 5          | 31            |

**Survival cap**: 39 levels maximum per operation. Order matters significantly.

### Combination Tree

Anvil crafting is inherently a **binary tree** operation:
- Leaf nodes = base materials (sword, books)
- Internal nodes = intermediate combinations
- Root = final enchanted item

Optimal ordering minimizes total level cost while staying under the 39-level cap.

### Recipes vs Bundles

| Concept | Definition | Behavior |
|---------|------------|----------|
| **Recipe (SKU)** | Single craftable item | Has one crafting tree, one BOM, added to cart individually |
| **Bundle (Kit)** | Collection of recipe references | "Add all to cart" shortcut, no crafting tree of its own |

**Key principle**: The cart is always flat. Bundles are a convenience layer for quickly adding multiple recipes. The combined BOM shown on the shopping list page is computed dynamically from cart contents.

---

## Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Dev Environment | **Flox** | Reproducible, declarative environment with pinned versions |
| Runtime | **Bun** | Fast all-in-one JavaScript runtime, bundler, package manager |
| Framework | **Astro** | Content-driven, static-first, islands architecture |
| Content | **Markdown + Frontmatter** | Easy to maintain, version-controlled recipes |
| Interactive UI | **Solid.js** | TypeScript-native, fine-grained reactivity, small bundle |
| Styling | **CSS** | Minecraft-themed, no CSS framework |
| State | **Solid Signals + localStorage** | Reactive cart, persisted client-side |
| Hosting | **GitHub Pages / Cloudflare Pages** | Free, zero maintenance |

### Content-Driven Approach

Recipes are defined as markdown files with YAML frontmatter. Anvil steps and costs are **computed at build time** from the enchantment list.

### Project Structure

```
/
├── astro.config.mjs
├── package.json
├── docs/
│   └── REFERENCES.md          # Authoritative sources for enchant data
├── public/assets/             # fonts/, items/, ui/
├── src/
│   ├── content/
│   │   ├── config.ts            # Zod schemas for content collections
│   │   ├── enchantments/        # By category: damage/, protection/, utility/, etc.
│   │   ├── recipes/             # By item: swords/, pickaxes/, armor/, etc.
│   │   └── bundles/             # Kit definitions
│   ├── data/
│   │   ├── enchantment-lookup.ts
│   │   ├── base-items.ts
│   │   └── rules/               # Patch system for edge cases
│   ├── engine/
│   │   ├── optimizer.ts         # Combination tree calculation
│   │   ├── xp-calc.ts           # Level ↔ XP conversion
│   │   └── bom.ts               # Bill of materials generation
│   ├── components/
│   │   ├── astro/               # RecipeCard, BundleCard, Layout, etc.
│   │   └── solid/               # Interactive: CraftingTree, CartSidebar, modals
│   ├── stores/
│   │   ├── cart.ts              # Shopping list state
│   │   └── craft-progress.ts    # Per-recipe step completion
│   ├── pages/
│   │   ├── index.astro          # Catalog view
│   │   └── list.astro           # Shopping list page
│   ├── styles/                  # minecraft.css, components.css, tree.css
│   └── types/index.ts
└── tests/
```

---

## Data Models

### Type Definitions

```typescript
// src/types/index.ts

// ─────────────────────────────────────────────────────────────
// Enchantment Data
// ─────────────────────────────────────────────────────────────

export type EnchantmentId =
  | 'sharpness' | 'smite' | 'bane_of_arthropods'
  | 'knockback' | 'fire_aspect' | 'looting' | 'sweeping_edge'
  | 'efficiency' | 'silk_touch' | 'fortune' | 'unbreaking'
  | 'mending' | 'protection' | 'fire_protection' | 'blast_protection'
  | 'projectile_protection' | 'thorns' | 'respiration' | 'aqua_affinity'
  | 'depth_strider' | 'frost_walker' | 'feather_falling' | 'soul_speed'
  | 'swift_sneak' | 'power' | 'punch' | 'flame' | 'infinity'
  | 'loyalty' | 'riptide' | 'channeling' | 'impaling'
  | 'multishot' | 'piercing' | 'quick_charge'
  | 'density' | 'breach' | 'wind_burst'  // 1.21 mace enchants
  | 'lure' | 'luck_of_the_sea'
  | 'curse_of_binding' | 'curse_of_vanishing';

export interface EnchantmentDef {
  id: EnchantmentId;
  name: string;
  maxLevel: number;
  bookMultiplier: number;
  conflicts: EnchantmentId[];
  applicableTo: BaseItemType[];
}

// ─────────────────────────────────────────────────────────────
// Enchantment Content (Content Collection)
// ─────────────────────────────────────────────────────────────

export type EnchantmentCategory =
  | 'damage' | 'protection' | 'utility' | 'weapon' | 'tool'
  | 'armor' | 'bow' | 'crossbow' | 'trident' | 'mace' | 'curse';

export interface EnchantmentFrontmatter {
  id: EnchantmentId;
  name: string;
  category: EnchantmentCategory;
  maxLevel: number;
  bookMultiplier: number;
  itemMultiplier: number;
  conflicts: EnchantmentId[];
  applicableTo: BaseItemType[];
  icon?: string;
  color?: string;
  levelStats: EnchantmentLevelStat[];
}

export interface EnchantmentLevelStat {
  level: number;
  effect: string;
  numericValue?: number;
  unit?: string;
}

// ─────────────────────────────────────────────────────────────
// Base Items
// ─────────────────────────────────────────────────────────────

export type BaseItemType =
  | 'sword' | 'pickaxe' | 'axe' | 'shovel' | 'hoe'
  | 'helmet' | 'chestplate' | 'leggings' | 'boots'
  | 'bow' | 'crossbow' | 'trident' | 'mace' | 'fishing_rod'
  | 'shears' | 'flint_and_steel' | 'shield' | 'elytra';

export type ItemMaterial =
  | 'netherite' | 'diamond' | 'iron' | 'gold' | 'stone' | 'wood'
  | 'leather' | 'chainmail' | 'turtle';

export interface BaseItem {
  type: BaseItemType;
  material?: ItemMaterial;
  displayName: string;
}

// ─────────────────────────────────────────────────────────────
// Recipe (Content Collection)
// ─────────────────────────────────────────────────────────────

export type RecipeCategory =
  | 'swords' | 'pickaxes' | 'axes' | 'shovels' | 'hoes'
  | 'helmets' | 'chestplates' | 'leggings' | 'boots'
  | 'bows' | 'crossbows' | 'tridents' | 'maces' | 'fishing_rods';

export interface RecipeFrontmatter {
  name: string;
  category: RecipeCategory;
  baseItem: string;                // e.g., "netherite_sword"
  tags?: string[];
  enchantments: Record<EnchantmentId, number>[];  // [{smite: 5}, {looting: 3}]
}

// ─────────────────────────────────────────────────────────────
// Bundle (Kit)
// ─────────────────────────────────────────────────────────────

export interface BundleFrontmatter {
  name: string;
  description?: string;
  recipes: string[];               // ["swords/god-sword", "pickaxes/god-pickaxe"]
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────
// Computed Crafting Data (Build Time)
// ─────────────────────────────────────────────────────────────

export interface CraftingTreeNode {
  id: string;
  type: 'leaf' | 'combine';
  item?: string;                   // Leaf: "Smite V Book" or "Netherite Sword"
  left?: CraftingTreeNode;
  right?: CraftingTreeNode;
  levelCost?: number;
  xpCost?: number;
  resultingPWP?: number;
  resultLabel?: string;            // "Book A", "Book B", etc.
  enchantments?: string[];         // Display: ["Smite V", "Mending"]
}

export interface ComputedRecipe {
  tree: CraftingTreeNode;
  totalLevelCost: number;
  totalXpCost: number;             // Incremental (earn, spend, repeat)
  totalXpCostBulk: number;         // Save to max level first
  stepCount: number;
}

export interface BOMItem {
  item: string;
  itemType: 'book' | 'base_item';
  enchantment?: EnchantmentId;
  enchantmentLevel?: number;
  quantity: number;
}

export interface BillOfMaterials {
  items: BOMItem[];
  baseItem: BaseItem;
}

// ─────────────────────────────────────────────────────────────
// User State (Client-Side)
// ─────────────────────────────────────────────────────────────

export interface CartItem {
  recipeId: string;
  recipeName: string;
  quantity: number;
  levelCost: number;
}

export interface CraftProgress {
  recipeId: string;
  completedNodeIds: string[];
}
```

### Content Collection Schema

```typescript
// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const levelStatSchema = z.object({
  level: z.number(),
  effect: z.string(),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
});

const enchantments = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum([
      'damage', 'protection', 'utility', 'weapon', 'tool',
      'armor', 'bow', 'crossbow', 'trident', 'mace', 'curse'
    ]),
    maxLevel: z.number(),
    bookMultiplier: z.number(),
    itemMultiplier: z.number(),
    conflicts: z.array(z.string()).default([]),
    applicableTo: z.array(z.string()),
    icon: z.string().optional(),
    color: z.string().optional(),
    levelStats: z.array(levelStatSchema),
  }),
});

const recipes = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'swords', 'pickaxes', 'axes', 'shovels', 'hoes',
      'helmets', 'chestplates', 'leggings', 'boots',
      'bows', 'crossbows', 'tridents', 'maces', 'fishing_rods'
    ]),
    baseItem: z.string(),
    tags: z.array(z.string()).optional(),
    enchantments: z.array(z.record(z.string(), z.number())),
  }),
});

const bundles = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    recipes: z.array(z.string()),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { enchantments, recipes, bundles };
```

### Content Examples

```yaml
# src/content/enchantments/damage/sharpness.md
---
id: sharpness
name: "Sharpness"
category: damage
maxLevel: 5
bookMultiplier: 1
itemMultiplier: 2
conflicts: ["smite", "bane_of_arthropods"]
applicableTo: ["sword", "axe"]
levelStats:
  - level: 1
    effect: "+1 damage"
    numericValue: 1.0
    unit: "damage"
  # ... levels 2-5
---

Increases melee damage dealt to all mobs.
```

```yaml
# src/content/recipes/swords/mob-farm-sword.md
---
name: "Mob Farm Sword"
category: swords
baseItem: netherite_sword
tags: ["no-knockback", "pve", "grinder"]
enchantments:
  - smite: 5
  - looting: 3
  - fire_aspect: 2
  - sweeping_edge: 3
  - unbreaking: 3
  - mending: 1
---

Perfect for XP farms - no knockback means mobs stay in the kill chamber.
```

```yaml
# src/content/bundles/starter-kit.md
---
name: "Starter Kit"
description: "Everything a new player needs for survival"
recipes:
  - swords/god-sword
  - pickaxes/god-pickaxe
  - axes/god-axe
  - helmets/protection-helmet
  - chestplates/protection-chestplate
  - leggings/protection-leggings
  - boots/protection-boots
tags: ["beginner", "survival"]
---
```

---

## UI/UX Specification

### Visual Design

- **Theme**: Minecraft-styled UI (pixelated fonts, stone/dirt textures, inventory slot aesthetics)
- **Color Palette**: Based on Minecraft UI (gray panels, gold accents, enchantment purple)
- **Typography**: Minecraft font for headers, readable sans-serif for body
- **Responsive**: Desktop-first with "half-screen" support

### Tooltips

**Item Tooltip** (Minecraft style):
- Item name (aqua for tools)
- Enchantments list (purple text)
- Attribute modifiers (dark green)

**Enchantment Tooltip**:
- Name + level, effect at this level
- Description, applicable items, conflicts (red)
- Anvil cost info (gold)

### Page: Catalog (index)

- Header with title + Shopping List link (with count badge)
- Search bar + Sort dropdown (XP Cost High→Low default, alphabetical, etc.)
- Category tabs: [All] [Swords] [Tools] [Armor] [Ranged] [Mace] [Other]
- Recipe cards showing: icon, name, total levels, enchantment chips, tags, [Quick Craft] + [Add to List] buttons
- Bundle cards showing: icon, name, total levels, item count, [View Items] + [Add All] buttons

### Modal: Quick Craft

Two-tab interface: **Craft Order** (tree viz) and **Pick List** (BOM).

**Craft Order Tab**:
- Top-down flow: base materials at top, final item at bottom
- Visual connectors showing which items combine
- Each combine step: checkbox, level cost, intermediate label ("Book A")
- Checkboxes for progress tracking

**Pick List Tab**:
- Materials checklist: base item + all enchanted books
- Checkboxes for gathering progress
- [Copy to Clipboard] button

### Page: Shopping List

- Items to craft section with quantity controls [−][+], [View] button, level costs
- Grand total levels
- Combined materials list (aggregated BOM across all cart items)
- [Clear All], [Copy List], [Export as Text] buttons

---

## State Management

### Shopping Cart Store

Interface:
```typescript
// Actions
add(recipe: { id: string; name: string; totalLevels: number }): void;
addBundle(recipes: Array<...>): void;  // Adds each recipe individually
remove(recipeId: string): void;
updateQuantity(recipeId: string, quantity: number): void;
clear(): void;

// Derived
totalLevels: () => number;  // Sum of (levelCost × quantity)
totalItems: () => number;   // Sum of quantities
```

Persisted to `localStorage` key `mc-enchant:cart`.

### Craft Progress Store

Interface:
```typescript
toggleNode(recipeId: string, nodeId: string): void;
reset(recipeId: string): void;
isCompleted(recipeId: string, nodeId: string): boolean;
```

Persisted to `localStorage` key `mc-enchant:progress`.

---

## Rules Engine (Patch System)

Handles edge cases and version-specific behaviors through declarative YAML patches.

### Design Principles

1. **Declarative** - Rules in YAML, not scattered in code
2. **Additive patches** - Extend/override, never replace core logic
3. **Version/edition-aware** - Rules scoped to Minecraft versions or Java/Bedrock
4. **Fail-safe** - Unknown rules logged but don't break build

### Rule Types

| Type | Purpose | Example |
|------|---------|---------|
| `conditional_conflict` | Enchants conflict only on specific items | Mending+Infinity on bows |
| `override_conflict` | Remove a conflict in specific context | Future-proofing |
| `max_level_override` | Different max level on specific items | Soul Speed III cap |
| `cost_modifier` | Adjust anvil cost for specific combos | Treasure enchant surcharge |
| `item_restriction` | Further restrict where enchant applies | Curse of Binding on wearables only |
| `custom_validation` | Complex validation logic (escape hatch) | Multi-condition rules |

### Patches File Format

```yaml
# src/data/rules/patches.yaml
version: "1.0"
minecraft_version: "1.21"
edition: "java"

rules:
  - id: mending-infinity-bow
    type: conditional_conflict
    enchantments: [mending, infinity]
    condition:
      item_types: [bow]

  - id: silk-touch-fortune
    type: conditional_conflict
    enchantments: [silk_touch, fortune]
    condition:
      item_types: [pickaxe, axe, shovel, hoe]

  - id: soul-speed-max
    type: max_level_override
    enchantment: soul_speed
    max_level: 3

  - id: treasure-enchant-cost
    type: cost_modifier
    enchantments: [mending, frost_walker, soul_speed, swift_sneak]
    modifier:
      book_multiplier_add: 1

  - id: curse-binding-wearables
    type: item_restriction
    enchantment: curse_of_binding
    allowed_items: [helmet, chestplate, leggings, boots, elytra, carved_pumpkin]

  - id: sweeping-edge-java-only
    type: item_restriction
    enchantment: sweeping_edge
    condition:
      edition: java
```

### Rule Type Definitions

```typescript
// src/data/rules/types.ts

export type RuleType =
  | 'conditional_conflict' | 'override_conflict' | 'max_level_override'
  | 'cost_modifier' | 'item_restriction' | 'custom_validation';

export type Edition = 'java' | 'bedrock' | 'both';

export interface RuleCondition {
  item_types?: BaseItemType[];
  edition?: Edition;
  min_version?: string;
  max_version?: string;
}

export interface BaseRule {
  id: string;
  type: RuleType;
  description?: string;
  condition?: RuleCondition;
  enabled?: boolean;
}

// Specific rule interfaces extend BaseRule with their fields
// ConditionalConflictRule: enchantments: [EnchantmentId, EnchantmentId]
// MaxLevelOverrideRule: enchantment: EnchantmentId, max_level: number
// CostModifierRule: enchantments[], modifier: { book_multiplier_add?, etc. }
// ItemRestrictionRule: enchantment(s), allowed_items?, blocked_items?
```

### Rules Engine API

```typescript
class RulesEngine {
  hasConflict(enchantA, enchantB, itemType, baseConflicts): boolean;
  getMaxLevel(enchantId, baseMaxLevel): number;
  getCostModifier(enchantId): { bookMultiplierAdd, bookMultiplierMult };
  canApplyTo(enchantId, itemType): boolean;
}

export const rulesEngine = new RulesEngine();
```

---

## Engine: Optimization Algorithm

### Core Algorithm

The optimizer finds the minimum-cost binary tree for combining N enchanted books + 1 base item.

```typescript
interface EnchantedItem {
  id: string;
  enchantments: { enchantment: EnchantmentDef; level: number }[];
  pwp: number;  // Prior work penalty counter (not the cost, the count)
}

// Main entry point
function computeOptimalTree(
  enchantmentList: Record<string, number>[],
  baseItem: string
): CraftingTreeNode;

// Cost calculation: PWP for both items + enchantment costs from sacrifice
function calculateCombineCost(target: EnchantedItem, sacrifice: EnchantedItem): number {
  let cost = 0;
  cost += (2 ** target.pwp - 1);      // Target PWP
  cost += (2 ** sacrifice.pwp - 1);   // Sacrifice PWP
  // + enchantment costs (level × bookMultiplier)
  return cost;
}
```

### XP Calculation

```typescript
// Minecraft piecewise formula
function levelToXp(level: number): number {
  if (level <= 16) return level * level + 6 * level;
  if (level <= 31) return Math.floor(2.5 * level * level - 40.5 * level + 360);
  return Math.floor(4.5 * level * level - 162.5 * level + 2220);
}

function calculateIncrementalXp(stepCosts: number[]): number;  // Sum of levelToXp per step
function calculateBulkXp(stepCosts: number[]): number;         // levelToXp(max step)
```

---

## Testing Strategy

### Test Pyramid

- **Unit tests** (base): Engine, rules, utilities - 85-90%+ coverage
- **Integration tests**: Content validation, recipe computation
- **Component tests** (top): Solid.js islands - smoke tests only

### Coverage Targets

| Area | Target |
|------|--------|
| Engine (optimizer) | 90%+ |
| Rules engine | 85%+ |
| XP calculations | 90%+ |
| Stores | 80%+ |
| Components | Smoke tests |

### Key Test Cases

**Optimizer**:
- Single enchantment → single leaf node
- God sword (7 enchants) → stays under 39-level cap per step
- Empty enchantment list → just base item
- Deterministic results for same input

**XP Calculator**:
- Known Minecraft wiki values: level 0→0, 7→37, 15→315, 30→1395, 40→2920, 50→5345
- Piecewise formula boundaries (16, 31)

**Rules Engine**:
- Conditional conflict detected on matching item (Mending+Infinity on bow)
- Conditional conflict ignored on non-matching item
- Base conflicts respected regardless of rules
- Bidirectional conflict check
- Max level override returns override value
- Cost modifier applies additively

**Content Validation** (integration):
- All enchantments have valid schema
- All conflicts reference valid enchantments
- All recipes reference valid enchantments
- No recipe has conflicting enchantments
- All bundles reference valid recipes

### Vitest Setup

- Environment: `jsdom`
- Mock `localStorage` for store tests
- Use `vite-plugin-solid` for component tests

---

## Build & Deployment

### Flox Environment

```bash
flox activate                    # Enter environment
flox activate --start-services   # Enter + start dev server
```

Provides: `bun@1.3.5`, `nodejs_24`, `git`, `jq`

### Dependencies

```json
{
  "dependencies": {
    "astro": "^5.x",
    "@astrojs/solid-js": "^5.x",
    "solid-js": "^1.9.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^3.x",
    "@vitest/coverage-v8": "^3.x",
    "jsdom": "^26.x",
    "vite-plugin-solid": "^2.x"
  }
}
```

### Astro Config

- `output: 'static'`
- `integrations: [solid()]`
- Configure `site` and `base` for GitHub Pages

### Deployment

GitHub Actions workflow: checkout → setup-bun → install → build → upload/deploy to GitHub Pages.

---

## Base Catalog

### Recipes

**Swords**: God Sword, Mob Farm Sword (Smite, no Knockback), Wither Killer, PvP Sword
**Pickaxes**: God Pickaxe, Silk Touch Pick, Mining Pick
**Axes**: God Axe, Woodcutting Axe
**Armor**: Max Protection set, specialized sets (Fire, Blast, Projectile)
**Tridents**: Loyalty Trident, Riptide Trident
**Maces** (1.21): Density Mace, Breach Mace
**Other**: God Bow, Fishing Rod

### Bundles

- **Starter Kit**: God Sword + God Pickaxe + God Axe + Full Protection Armor
- **Mining Setup**: Fortune Pick + Silk Touch Pick + Efficiency Shovel
- **Combat Kit**: God Sword + God Bow + Full Protection Armor
- **Nether Explorer**: Fire Protection Armor + God Sword + God Pickaxe
- **Ocean Kit**: Riptide + Loyalty Tridents + Depth Strider Boots + Respiration Helmet

---

## Reference Documentation

See **[docs/REFERENCES.md](./docs/REFERENCES.md)** for authoritative sources:

| Resource | URL |
|----------|-----|
| Anvil Mechanics | https://minecraft.wiki/w/Anvil_mechanics |
| Experience System | https://minecraft.wiki/w/Experience |
| Enchanting Overview | https://minecraft.wiki/w/Enchanting |
| minecraft-data JSON | https://github.com/PrismarineJS/minecraft-data |
| Reference Implementation | https://github.com/iamcal/enchant-order |

---

## Open Questions

1. Minecraft version toggle for different costs
2. Bedrock edition support
3. Import/Export JSON shopping lists
4. Print view for recipe cards
5. Offline support (PWA)
6. Enchantment source tips (villagers, fishing, etc.)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0   | TBD  | Initial specification |
