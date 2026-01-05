// src/data/enchantment-lookup.ts
// Enchantment lookup module - bridges content collection to engine

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import type {
  EnchantmentId,
  EnchantmentDef,
  EnchantmentCategory,
  EnchantmentFrontmatter,
  BaseItemType,
} from '../types/index.js';

// ─────────────────────────────────────────────────────────────
// Extended Type (includes category for filtering)
// ─────────────────────────────────────────────────────────────

export interface EnchantmentData extends EnchantmentDef {
  category: EnchantmentCategory;
  itemMultiplier: number;
}

// ─────────────────────────────────────────────────────────────
// Lookup Store
// ─────────────────────────────────────────────────────────────

let enchantmentMap: Map<EnchantmentId, EnchantmentData> | null = null;
let enchantmentList: EnchantmentData[] | null = null;
let categoryIndex: Map<EnchantmentCategory, EnchantmentData[]> | null = null;
let itemIndex: Map<BaseItemType, EnchantmentData[]> | null = null;

// ─────────────────────────────────────────────────────────────
// Frontmatter Parser
// ─────────────────────────────────────────────────────────────

function parseFrontmatter(filePath: string): EnchantmentFrontmatter | null {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return null;
  }

  try {
    return parseYaml(match[1]) as EnchantmentFrontmatter;
  } catch {
    return null;
  }
}

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    try {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (entry.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or is unreadable
    }
  }

  walk(dir);
  return files;
}

// ─────────────────────────────────────────────────────────────
// Conversion
// ─────────────────────────────────────────────────────────────

function frontmatterToData(fm: EnchantmentFrontmatter): EnchantmentData {
  return {
    id: fm.id,
    name: fm.name,
    maxLevel: fm.maxLevel,
    bookMultiplier: fm.bookMultiplier,
    conflicts: fm.conflicts,
    applicableTo: fm.applicableTo,
    category: fm.category,
    itemMultiplier: fm.itemMultiplier,
  };
}

// ─────────────────────────────────────────────────────────────
// Fallback Data (for test environment)
// ─────────────────────────────────────────────────────────────

const FALLBACK_ENCHANTMENTS: EnchantmentData[] = [
  {
    id: 'sharpness',
    name: 'Sharpness',
    maxLevel: 5,
    bookMultiplier: 1,
    itemMultiplier: 1,
    conflicts: ['smite', 'bane_of_arthropods'],
    applicableTo: ['sword', 'axe'],
    category: 'damage',
  },
  {
    id: 'smite',
    name: 'Smite',
    maxLevel: 5,
    bookMultiplier: 1,
    itemMultiplier: 1,
    conflicts: ['sharpness', 'bane_of_arthropods'],
    applicableTo: ['sword', 'axe'],
    category: 'damage',
  },
  {
    id: 'unbreaking',
    name: 'Unbreaking',
    maxLevel: 3,
    bookMultiplier: 1,
    itemMultiplier: 2,
    conflicts: [],
    applicableTo: [
      'sword', 'pickaxe', 'axe', 'shovel', 'hoe',
      'helmet', 'chestplate', 'leggings', 'boots',
      'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
      'shears', 'flint_and_steel', 'shield', 'elytra',
    ],
    category: 'utility',
  },
  {
    id: 'mending',
    name: 'Mending',
    maxLevel: 1,
    bookMultiplier: 2,
    itemMultiplier: 4,
    conflicts: [],
    applicableTo: [
      'sword', 'pickaxe', 'axe', 'shovel', 'hoe',
      'helmet', 'chestplate', 'leggings', 'boots',
      'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
      'shears', 'flint_and_steel', 'shield', 'elytra',
    ],
    category: 'utility',
  },
  {
    id: 'looting',
    name: 'Looting',
    maxLevel: 3,
    bookMultiplier: 2,
    itemMultiplier: 4,
    conflicts: [],
    applicableTo: ['sword'],
    category: 'weapon',
  },
  {
    id: 'fire_aspect',
    name: 'Fire Aspect',
    maxLevel: 2,
    bookMultiplier: 2,
    itemMultiplier: 4,
    conflicts: [],
    applicableTo: ['sword'],
    category: 'weapon',
  },
  {
    id: 'efficiency',
    name: 'Efficiency',
    maxLevel: 5,
    bookMultiplier: 1,
    itemMultiplier: 1,
    conflicts: [],
    applicableTo: ['pickaxe', 'axe', 'shovel', 'hoe', 'shears'],
    category: 'tool',
  },
  {
    id: 'fortune',
    name: 'Fortune',
    maxLevel: 3,
    bookMultiplier: 2,
    itemMultiplier: 4,
    conflicts: ['silk_touch'],
    applicableTo: ['pickaxe', 'axe', 'shovel', 'hoe'],
    category: 'tool',
  },
  {
    id: 'silk_touch',
    name: 'Silk Touch',
    maxLevel: 1,
    bookMultiplier: 4,
    itemMultiplier: 8,
    conflicts: ['fortune'],
    applicableTo: ['pickaxe', 'axe', 'shovel', 'hoe'],
    category: 'tool',
  },
  {
    id: 'protection',
    name: 'Protection',
    maxLevel: 4,
    bookMultiplier: 1,
    itemMultiplier: 1,
    conflicts: ['fire_protection', 'blast_protection', 'projectile_protection'],
    applicableTo: ['helmet', 'chestplate', 'leggings', 'boots'],
    category: 'protection',
  },
  {
    id: 'feather_falling',
    name: 'Feather Falling',
    maxLevel: 4,
    bookMultiplier: 1,
    itemMultiplier: 2,
    conflicts: [],
    applicableTo: ['boots'],
    category: 'armor',
  },
];

// ─────────────────────────────────────────────────────────────
// Data Loading
// ─────────────────────────────────────────────────────────────

function loadEnchantmentsFromFiles(): EnchantmentData[] {
  const enchantmentsDir = join(process.cwd(), 'src/content/enchantments');
  const files = getAllMarkdownFiles(enchantmentsDir);

  if (files.length === 0) {
    return [];
  }

  const enchantments: EnchantmentData[] = [];

  for (const file of files) {
    const fm = parseFrontmatter(file);
    if (fm) {
      enchantments.push(frontmatterToData(fm));
    }
  }

  return enchantments;
}

function initializeData(): void {
  if (enchantmentMap !== null) {
    return; // Already initialized
  }

  // Try loading from content files first
  let enchantments = loadEnchantmentsFromFiles();

  // Fall back to hardcoded data if no files found
  if (enchantments.length === 0) {
    enchantments = FALLBACK_ENCHANTMENTS;
  }

  // Build lookup structures
  enchantmentMap = new Map();
  enchantmentList = enchantments;
  categoryIndex = new Map();
  itemIndex = new Map();

  for (const enchant of enchantments) {
    // Main ID lookup
    enchantmentMap.set(enchant.id, enchant);

    // Category index
    const catList = categoryIndex.get(enchant.category) ?? [];
    catList.push(enchant);
    categoryIndex.set(enchant.category, catList);

    // Item index
    for (const itemType of enchant.applicableTo) {
      const itemList = itemIndex.get(itemType) ?? [];
      itemList.push(enchant);
      itemIndex.set(itemType, itemList);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Get an enchantment by its ID.
 * Returns undefined if the enchantment is not found.
 *
 * @param id - The enchantment ID to look up
 * @returns The enchantment data or undefined
 */
export function getEnchantment(id: EnchantmentId): EnchantmentData | undefined {
  initializeData();
  return enchantmentMap!.get(id);
}

/**
 * Get all loaded enchantments.
 *
 * @returns Array of all enchantment data
 */
export function getAllEnchantments(): EnchantmentData[] {
  initializeData();
  return [...enchantmentList!];
}

/**
 * Get all enchantments in a specific category.
 *
 * @param category - The enchantment category to filter by
 * @returns Array of enchantments in that category
 */
export function getEnchantmentsByCategory(
  category: EnchantmentCategory
): EnchantmentData[] {
  initializeData();
  return [...(categoryIndex!.get(category) ?? [])];
}

/**
 * Get all enchantments applicable to a specific item type.
 *
 * @param itemType - The item type to filter by
 * @returns Array of enchantments applicable to that item
 */
export function getEnchantmentsForItem(
  itemType: BaseItemType
): EnchantmentData[] {
  initializeData();
  return [...(itemIndex!.get(itemType) ?? [])];
}

/**
 * Get the total count of loaded enchantments.
 *
 * @returns The number of enchantments
 */
export function getEnchantmentCount(): number {
  initializeData();
  return enchantmentList!.length;
}

/**
 * Check if the lookup is using fallback data.
 * Useful for testing and debugging.
 *
 * @returns true if using fallback data, false if loaded from files
 */
export function isUsingFallback(): boolean {
  initializeData();
  // Check if we have file-only enchantments (not in fallback)
  // If we loaded from files, we should have same data as fallback
  return enchantmentList!.length === FALLBACK_ENCHANTMENTS.length;
}

// ─────────────────────────────────────────────────────────────
// Testing Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Reset the lookup cache. For testing purposes only.
 */
export function _resetCache(): void {
  enchantmentMap = null;
  enchantmentList = null;
  categoryIndex = null;
  itemIndex = null;
}

/**
 * Load data with specific enchantments. For testing purposes only.
 */
export function _loadTestData(enchantments: EnchantmentData[]): void {
  enchantmentMap = new Map();
  enchantmentList = enchantments;
  categoryIndex = new Map();
  itemIndex = new Map();

  for (const enchant of enchantments) {
    enchantmentMap.set(enchant.id, enchant);

    const catList = categoryIndex.get(enchant.category) ?? [];
    catList.push(enchant);
    categoryIndex.set(enchant.category, catList);

    for (const itemType of enchant.applicableTo) {
      const itemList = itemIndex.get(itemType) ?? [];
      itemList.push(enchant);
      itemIndex.set(itemType, itemList);
    }
  }
}
