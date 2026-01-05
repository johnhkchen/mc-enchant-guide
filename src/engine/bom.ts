// src/engine/bom.ts
// Bill of Materials generator - extracts required materials from crafting trees

import type {
  CraftingTreeNode,
  BOMItem,
  BillOfMaterials,
  EnchantmentId,
  BaseItem,
  BaseItemType,
  ItemMaterial,
} from '../types/index.js';
import { getAllEnchantments } from '../data/enchantment-lookup.js';
import { getBaseItem, getAllBaseItems } from '../data/base-items.js';

// ─────────────────────────────────────────────────────────────
// Roman Numeral Parsing
// ─────────────────────────────────────────────────────────────

const ROMAN_NUMERALS: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
};

/**
 * Parse a Roman numeral to a number.
 * Returns undefined if not a valid Roman numeral (I-V).
 */
function parseRomanNumeral(roman: string): number | undefined {
  return ROMAN_NUMERALS[roman];
}

// ─────────────────────────────────────────────────────────────
// Enchantment Name Lookup
// ─────────────────────────────────────────────────────────────

let nameToIdMap: Map<string, EnchantmentId> | null = null;

function initializeNameLookup(): void {
  if (nameToIdMap !== null) {
    return;
  }

  nameToIdMap = new Map();
  const enchantments = getAllEnchantments();

  for (const enchant of enchantments) {
    // Map display name (lowercase) to ID
    nameToIdMap.set(enchant.name.toLowerCase(), enchant.id);
  }
}

/**
 * Look up an enchantment ID by its display name.
 * Returns undefined if not found.
 */
function getEnchantmentIdByName(name: string): EnchantmentId | undefined {
  initializeNameLookup();
  return nameToIdMap!.get(name.toLowerCase());
}

// ─────────────────────────────────────────────────────────────
// Base Item Parsing
// ─────────────────────────────────────────────────────────────

let displayNameToBaseItem: Map<string, BaseItem> | null = null;

function initializeBaseItemLookup(): void {
  if (displayNameToBaseItem !== null) {
    return;
  }

  displayNameToBaseItem = new Map();
  const items = getAllBaseItems();

  for (const item of items) {
    displayNameToBaseItem.set(item.displayName.toLowerCase(), item);
  }
}

/**
 * Look up a base item by its display name.
 * Returns undefined if not found.
 */
function getBaseItemByDisplayName(displayName: string): BaseItem | undefined {
  initializeBaseItemLookup();
  return displayNameToBaseItem!.get(displayName.toLowerCase());
}

// ─────────────────────────────────────────────────────────────
// Book Parsing
// ─────────────────────────────────────────────────────────────

interface ParsedBook {
  enchantmentId: EnchantmentId;
  level: number;
  displayName: string;
}

/**
 * Parse a book item string like "Smite V Book" or "Mending Book".
 * Returns the enchantment ID and level, or undefined if parsing fails.
 */
function parseBookItem(item: string): ParsedBook | undefined {
  // Must end with " Book"
  if (!item.endsWith(' Book')) {
    return undefined;
  }

  // Remove " Book" suffix
  const withoutBook = item.slice(0, -5);

  // Try to split into enchantment name and level
  // Format: "Enchantment Name [RomanNumeral]" or just "Enchantment Name" for level 1
  const parts = withoutBook.split(' ');

  if (parts.length === 0) {
    return undefined;
  }

  // Try last part as Roman numeral
  const lastPart = parts[parts.length - 1];
  const level = parseRomanNumeral(lastPart);

  let enchantmentName: string;
  let actualLevel: number;

  if (level !== undefined) {
    // Has Roman numeral suffix
    enchantmentName = parts.slice(0, -1).join(' ');
    actualLevel = level;
  } else {
    // No Roman numeral - level 1 enchantment (like Mending)
    enchantmentName = withoutBook;
    actualLevel = 1;
  }

  const enchantmentId = getEnchantmentIdByName(enchantmentName);

  if (enchantmentId === undefined) {
    return undefined;
  }

  return {
    enchantmentId,
    level: actualLevel,
    displayName: item,
  };
}

// ─────────────────────────────────────────────────────────────
// Tree Traversal
// ─────────────────────────────────────────────────────────────

interface LeafInfo {
  item: string;
  isBook: boolean;
}

/**
 * Collect all leaf nodes from a crafting tree.
 */
function collectLeaves(node: CraftingTreeNode): LeafInfo[] {
  if (node.type === 'leaf') {
    if (!node.item) {
      return [];
    }
    return [{
      item: node.item,
      isBook: node.item.endsWith(' Book'),
    }];
  }

  // Combine node - traverse children
  const leaves: LeafInfo[] = [];

  if (node.left) {
    leaves.push(...collectLeaves(node.left));
  }
  if (node.right) {
    leaves.push(...collectLeaves(node.right));
  }

  return leaves;
}

// ─────────────────────────────────────────────────────────────
// BOM Generation
// ─────────────────────────────────────────────────────────────

/**
 * Create a BOM key for grouping identical items.
 */
function createBomKey(item: BOMItem): string {
  if (item.itemType === 'book' && item.enchantment) {
    return `book:${item.enchantment}:${item.enchantmentLevel}`;
  }
  return `base:${item.item}`;
}

/**
 * Generate a Bill of Materials from a crafting tree.
 * Extracts all leaf nodes and groups them by item type.
 *
 * @param tree - The crafting tree to extract materials from
 * @returns The bill of materials with items and base item
 */
export function generateBOM(tree: CraftingTreeNode): BillOfMaterials {
  const leaves = collectLeaves(tree);

  // Find the base item (the one that's not a book)
  let baseItemInfo: BaseItem | undefined;

  // Group items by key for quantity aggregation
  const itemMap = new Map<string, BOMItem>();

  for (const leaf of leaves) {
    if (leaf.isBook) {
      const parsed = parseBookItem(leaf.item);

      if (parsed) {
        const bomItem: BOMItem = {
          item: parsed.displayName,
          itemType: 'book',
          enchantment: parsed.enchantmentId,
          enchantmentLevel: parsed.level,
          quantity: 1,
        };

        const key = createBomKey(bomItem);
        const existing = itemMap.get(key);

        if (existing) {
          existing.quantity += 1;
        } else {
          itemMap.set(key, bomItem);
        }
      }
    } else {
      // Base item
      const baseItem = getBaseItemByDisplayName(leaf.item);

      if (baseItem) {
        baseItemInfo = baseItem;
      }

      const bomItem: BOMItem = {
        item: leaf.item,
        itemType: 'base_item',
        quantity: 1,
      };

      const key = createBomKey(bomItem);
      const existing = itemMap.get(key);

      if (existing) {
        existing.quantity += 1;
      } else {
        itemMap.set(key, bomItem);
      }
    }
  }

  // Convert map to array, sorting books first then base items
  const items = Array.from(itemMap.values()).sort((a, b) => {
    // Books first
    if (a.itemType === 'book' && b.itemType !== 'book') return -1;
    if (a.itemType !== 'book' && b.itemType === 'book') return 1;

    // Alphabetically within type
    return a.item.localeCompare(b.item);
  });

  // Fallback base item if not found in lookup
  if (!baseItemInfo) {
    const baseItemLeaf = leaves.find((l) => !l.isBook);
    baseItemInfo = baseItemLeaf
      ? { type: 'sword' as BaseItemType, displayName: baseItemLeaf.item }
      : { type: 'sword' as BaseItemType, displayName: 'Unknown Item' };
  }

  return {
    items,
    baseItem: baseItemInfo,
  };
}

// ─────────────────────────────────────────────────────────────
// BOM Aggregation
// ─────────────────────────────────────────────────────────────

/**
 * Aggregate multiple Bills of Materials into a combined BOM.
 * Used for the shopping list page to combine cart items.
 *
 * @param boms - Array of BOMs to aggregate
 * @returns Combined BOM with merged quantities
 */
export function aggregateBOMs(boms: BillOfMaterials[]): BillOfMaterials {
  if (boms.length === 0) {
    return {
      items: [],
      baseItem: { type: 'sword' as BaseItemType, displayName: 'None' },
    };
  }

  if (boms.length === 1) {
    return boms[0];
  }

  // Merge all items with quantity aggregation
  const itemMap = new Map<string, BOMItem>();

  for (const bom of boms) {
    for (const item of bom.items) {
      const key = createBomKey(item);
      const existing = itemMap.get(key);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        // Clone the item to avoid mutating the original
        itemMap.set(key, { ...item });
      }
    }
  }

  // Convert map to sorted array
  const items = Array.from(itemMap.values()).sort((a, b) => {
    // Books first
    if (a.itemType === 'book' && b.itemType !== 'book') return -1;
    if (a.itemType !== 'book' && b.itemType === 'book') return 1;

    // Alphabetically within type
    return a.item.localeCompare(b.item);
  });

  // Use first BOM's base item as representative (for single-item aggregate)
  // For multiple different base items, just pick the first
  const baseItem = boms[0].baseItem;

  return {
    items,
    baseItem,
  };
}

// ─────────────────────────────────────────────────────────────
// Testing Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Reset the name lookup cache. For testing purposes only.
 */
export function _resetCache(): void {
  nameToIdMap = null;
  displayNameToBaseItem = null;
}

/**
 * Parse a book item string. Exposed for testing.
 */
export function _parseBookItem(item: string): ParsedBook | undefined {
  return parseBookItem(item);
}

/**
 * Get enchantment ID by name. Exposed for testing.
 */
export function _getEnchantmentIdByName(name: string): EnchantmentId | undefined {
  return getEnchantmentIdByName(name);
}
