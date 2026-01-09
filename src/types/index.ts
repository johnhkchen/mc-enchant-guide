// src/types/index.ts
// Core type definitions for Minecraft Enchant Guide

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
  | 'bows' | 'crossbows' | 'tridents' | 'maces' | 'fishing_rods'
  | 'elytra' | 'shields' | 'shears';

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
