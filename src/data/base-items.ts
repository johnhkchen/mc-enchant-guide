// src/data/base-items.ts
// Base items data module - defines all enchantable items in Minecraft

import type { BaseItem, BaseItemType, ItemMaterial } from '../types/index.js';

// ─────────────────────────────────────────────────────────────
// Material Configuration
// ─────────────────────────────────────────────────────────────

// Items that have material variants
const TOOL_WEAPON_MATERIALS: ItemMaterial[] = [
  'netherite', 'diamond', 'iron', 'gold', 'stone', 'wood',
];

const ARMOR_MATERIALS: ItemMaterial[] = [
  'netherite', 'diamond', 'iron', 'gold', 'chainmail', 'leather',
];

// Item types that use tool/weapon materials
const TOOL_WEAPON_TYPES: BaseItemType[] = [
  'sword', 'axe', 'pickaxe', 'shovel', 'hoe',
];

// Item types that use armor materials
const ARMOR_TYPES: BaseItemType[] = [
  'helmet', 'chestplate', 'leggings', 'boots',
];

// Item types without material variants (singleton items)
const SINGLETON_TYPES: BaseItemType[] = [
  'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
  'shears', 'flint_and_steel', 'shield', 'elytra',
];

// ─────────────────────────────────────────────────────────────
// Display Name Generation
// ─────────────────────────────────────────────────────────────

const TYPE_DISPLAY_NAMES: Record<BaseItemType, string> = {
  sword: 'Sword',
  axe: 'Axe',
  pickaxe: 'Pickaxe',
  shovel: 'Shovel',
  hoe: 'Hoe',
  helmet: 'Helmet',
  chestplate: 'Chestplate',
  leggings: 'Leggings',
  boots: 'Boots',
  bow: 'Bow',
  crossbow: 'Crossbow',
  trident: 'Trident',
  mace: 'Mace',
  fishing_rod: 'Fishing Rod',
  shears: 'Shears',
  flint_and_steel: 'Flint and Steel',
  shield: 'Shield',
  elytra: 'Elytra',
};

const MATERIAL_DISPLAY_NAMES: Record<ItemMaterial, string> = {
  netherite: 'Netherite',
  diamond: 'Diamond',
  iron: 'Iron',
  gold: 'Golden',
  stone: 'Stone',
  wood: 'Wooden',
  leather: 'Leather',
  chainmail: 'Chainmail',
  turtle: 'Turtle Shell',
};

function generateDisplayName(type: BaseItemType, material?: ItemMaterial): string {
  if (!material) {
    return TYPE_DISPLAY_NAMES[type];
  }

  // Special case: turtle shell helmet
  if (material === 'turtle' && type === 'helmet') {
    return 'Turtle Shell';
  }

  return `${MATERIAL_DISPLAY_NAMES[material]} ${TYPE_DISPLAY_NAMES[type]}`;
}

// ─────────────────────────────────────────────────────────────
// Data Generation
// ─────────────────────────────────────────────────────────────

let allItems: BaseItem[] | null = null;
let itemByKey: Map<string, BaseItem> | null = null;
let itemsByType: Map<BaseItemType, BaseItem[]> | null = null;

function makeKey(type: BaseItemType, material?: ItemMaterial): string {
  return material ? `${material}_${type}` : type;
}

function generateAllItems(): BaseItem[] {
  const items: BaseItem[] = [];

  // Generate tool/weapon items with materials
  for (const type of TOOL_WEAPON_TYPES) {
    for (const material of TOOL_WEAPON_MATERIALS) {
      items.push({
        type,
        material,
        displayName: generateDisplayName(type, material),
      });
    }
  }

  // Generate armor items with materials
  for (const type of ARMOR_TYPES) {
    for (const material of ARMOR_MATERIALS) {
      items.push({
        type,
        material,
        displayName: generateDisplayName(type, material),
      });
    }
    // Special case: turtle shell helmet
    if (type === 'helmet') {
      items.push({
        type,
        material: 'turtle',
        displayName: generateDisplayName(type, 'turtle'),
      });
    }
  }

  // Generate singleton items (no material)
  for (const type of SINGLETON_TYPES) {
    items.push({
      type,
      displayName: generateDisplayName(type),
    });
  }

  return items;
}

function initializeData(): void {
  if (allItems !== null) {
    return; // Already initialized
  }

  allItems = generateAllItems();
  itemByKey = new Map();
  itemsByType = new Map();

  for (const item of allItems) {
    // Key lookup
    const key = makeKey(item.type, item.material);
    itemByKey.set(key, item);

    // Type index
    const typeList = itemsByType.get(item.type) ?? [];
    typeList.push(item);
    itemsByType.set(item.type, typeList);
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Get a specific base item by type and optional material.
 * For singleton items (bow, shield, etc.), omit the material.
 * Returns undefined if the combination is invalid.
 *
 * @param type - The item type
 * @param material - The item material (optional for singleton items)
 * @returns The base item or undefined
 */
export function getBaseItem(
  type: BaseItemType,
  material?: ItemMaterial
): BaseItem | undefined {
  initializeData();
  const key = makeKey(type, material);
  return itemByKey!.get(key);
}

/**
 * Get all base items.
 *
 * @returns Array of all base items
 */
export function getAllBaseItems(): BaseItem[] {
  initializeData();
  return [...allItems!];
}

/**
 * Get all base items of a specific type.
 *
 * @param type - The item type to filter by
 * @returns Array of base items of that type
 */
export function getBaseItemsByType(type: BaseItemType): BaseItem[] {
  initializeData();
  return [...(itemsByType!.get(type) ?? [])];
}

/**
 * Get the total count of base items.
 *
 * @returns The number of base items
 */
export function getBaseItemCount(): number {
  initializeData();
  return allItems!.length;
}

/**
 * Check if an item type requires a material.
 *
 * @param type - The item type to check
 * @returns true if the item type needs a material, false for singletons
 */
export function itemTypeRequiresMaterial(type: BaseItemType): boolean {
  return !SINGLETON_TYPES.includes(type);
}

/**
 * Get valid materials for an item type.
 *
 * @param type - The item type
 * @returns Array of valid materials, or empty array for singleton items
 */
export function getValidMaterials(type: BaseItemType): ItemMaterial[] {
  if (TOOL_WEAPON_TYPES.includes(type)) {
    return [...TOOL_WEAPON_MATERIALS];
  }
  if (ARMOR_TYPES.includes(type)) {
    // Helmet has turtle as additional material
    if (type === 'helmet') {
      return [...ARMOR_MATERIALS, 'turtle'];
    }
    return [...ARMOR_MATERIALS];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// Testing Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Reset the data cache. For testing purposes only.
 */
export function _resetCache(): void {
  allItems = null;
  itemByKey = null;
  itemsByType = null;
}
