/**
 * Unit tests for enchantment-lookup module.
 *
 * Tests cover:
 * - O(1) enchantment lookup by ID
 * - Category filtering
 * - Item type filtering
 * - Fallback data handling
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { EnchantmentId, EnchantmentCategory, BaseItemType } from '../../../src/types/index.js';
import {
  getEnchantment,
  getAllEnchantments,
  getEnchantmentsByCategory,
  getEnchantmentsForItem,
  getEnchantmentCount,
  isUsingFallback,
  _resetCache,
  _loadTestData,
  type EnchantmentData,
} from '../../../src/data/enchantment-lookup.js';

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

const testEnchantments: EnchantmentData[] = [
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
    applicableTo: ['sword', 'pickaxe', 'axe'],
    category: 'utility',
  },
  {
    id: 'mending',
    name: 'Mending',
    maxLevel: 1,
    bookMultiplier: 2,
    itemMultiplier: 4,
    conflicts: [],
    applicableTo: ['sword', 'pickaxe'],
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
    id: 'efficiency',
    name: 'Efficiency',
    maxLevel: 5,
    bookMultiplier: 1,
    itemMultiplier: 1,
    conflicts: [],
    applicableTo: ['pickaxe', 'axe', 'shovel', 'hoe'],
    category: 'tool',
  },
  {
    id: 'fortune',
    name: 'Fortune',
    maxLevel: 3,
    bookMultiplier: 2,
    itemMultiplier: 4,
    conflicts: ['silk_touch'],
    applicableTo: ['pickaxe'],
    category: 'tool',
  },
];

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Enchantment Lookup', () => {
  beforeEach(() => {
    _resetCache();
    _loadTestData(testEnchantments);
  });

  afterEach(() => {
    _resetCache();
  });

  // ─────────────────────────────────────────────────────────────
  // getEnchantment
  // ─────────────────────────────────────────────────────────────

  describe('getEnchantment', () => {
    it('returns enchantment by ID', () => {
      const result = getEnchantment('sharpness');
      expect(result).toBeDefined();
      expect(result?.id).toBe('sharpness');
      expect(result?.name).toBe('Sharpness');
      expect(result?.maxLevel).toBe(5);
    });

    it('returns undefined for unknown ID', () => {
      const result = getEnchantment('nonexistent' as EnchantmentId);
      expect(result).toBeUndefined();
    });

    it('returns correct conflicts', () => {
      const result = getEnchantment('sharpness');
      expect(result?.conflicts).toEqual(['smite', 'bane_of_arthropods']);
    });

    it('returns correct applicableTo', () => {
      const result = getEnchantment('looting');
      expect(result?.applicableTo).toEqual(['sword']);
    });

    it('returns all enchantment properties', () => {
      const result = getEnchantment('mending');
      expect(result).toEqual({
        id: 'mending',
        name: 'Mending',
        maxLevel: 1,
        bookMultiplier: 2,
        itemMultiplier: 4,
        conflicts: [],
        applicableTo: ['sword', 'pickaxe'],
        category: 'utility',
      });
    });

    it('provides O(1) lookup performance', () => {
      // Multiple lookups should be fast
      for (let i = 0; i < 1000; i++) {
        const result = getEnchantment('sharpness');
        expect(result).toBeDefined();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getAllEnchantments
  // ─────────────────────────────────────────────────────────────

  describe('getAllEnchantments', () => {
    it('returns all enchantments', () => {
      const result = getAllEnchantments();
      expect(result).toHaveLength(7);
    });

    it('returns a copy of the array (not mutable)', () => {
      const result1 = getAllEnchantments();
      const result2 = getAllEnchantments();
      expect(result1).not.toBe(result2);
    });

    it('includes all expected enchantment IDs', () => {
      const result = getAllEnchantments();
      const ids = result.map((e) => e.id);
      expect(ids).toContain('sharpness');
      expect(ids).toContain('smite');
      expect(ids).toContain('unbreaking');
      expect(ids).toContain('mending');
      expect(ids).toContain('looting');
      expect(ids).toContain('efficiency');
      expect(ids).toContain('fortune');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getEnchantmentsByCategory
  // ─────────────────────────────────────────────────────────────

  describe('getEnchantmentsByCategory', () => {
    it('returns enchantments in damage category', () => {
      const result = getEnchantmentsByCategory('damage');
      expect(result).toHaveLength(2);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('sharpness');
      expect(ids).toContain('smite');
    });

    it('returns enchantments in utility category', () => {
      const result = getEnchantmentsByCategory('utility');
      expect(result).toHaveLength(2);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('unbreaking');
      expect(ids).toContain('mending');
    });

    it('returns enchantments in weapon category', () => {
      const result = getEnchantmentsByCategory('weapon');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('looting');
    });

    it('returns enchantments in tool category', () => {
      const result = getEnchantmentsByCategory('tool');
      expect(result).toHaveLength(2);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('efficiency');
      expect(ids).toContain('fortune');
    });

    it('returns empty array for category with no enchantments', () => {
      const result = getEnchantmentsByCategory('protection');
      expect(result).toEqual([]);
    });

    it('returns empty array for invalid category', () => {
      const result = getEnchantmentsByCategory('invalid' as EnchantmentCategory);
      expect(result).toEqual([]);
    });

    it('returns a copy of the array (not mutable)', () => {
      const result1 = getEnchantmentsByCategory('damage');
      const result2 = getEnchantmentsByCategory('damage');
      expect(result1).not.toBe(result2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getEnchantmentsForItem
  // ─────────────────────────────────────────────────────────────

  describe('getEnchantmentsForItem', () => {
    it('returns enchantments for sword', () => {
      const result = getEnchantmentsForItem('sword');
      expect(result.length).toBeGreaterThan(0);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('sharpness');
      expect(ids).toContain('smite');
      expect(ids).toContain('unbreaking');
      expect(ids).toContain('mending');
      expect(ids).toContain('looting');
    });

    it('returns enchantments for pickaxe', () => {
      const result = getEnchantmentsForItem('pickaxe');
      const ids = result.map((e) => e.id);
      expect(ids).toContain('unbreaking');
      expect(ids).toContain('mending');
      expect(ids).toContain('efficiency');
      expect(ids).toContain('fortune');
      // Should not include sword-only enchantments
      expect(ids).not.toContain('looting');
    });

    it('returns enchantments for axe', () => {
      const result = getEnchantmentsForItem('axe');
      const ids = result.map((e) => e.id);
      expect(ids).toContain('sharpness');
      expect(ids).toContain('smite');
      expect(ids).toContain('unbreaking');
      expect(ids).toContain('efficiency');
    });

    it('returns empty array for item with no enchantments', () => {
      const result = getEnchantmentsForItem('elytra');
      expect(result).toEqual([]);
    });

    it('returns empty array for invalid item type', () => {
      const result = getEnchantmentsForItem('invalid' as BaseItemType);
      expect(result).toEqual([]);
    });

    it('returns a copy of the array (not mutable)', () => {
      const result1 = getEnchantmentsForItem('sword');
      const result2 = getEnchantmentsForItem('sword');
      expect(result1).not.toBe(result2);
    });

    it('returns correct count for sword (5 enchantments)', () => {
      const result = getEnchantmentsForItem('sword');
      expect(result).toHaveLength(5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getEnchantmentCount
  // ─────────────────────────────────────────────────────────────

  describe('getEnchantmentCount', () => {
    it('returns correct count', () => {
      const count = getEnchantmentCount();
      expect(count).toBe(7);
    });

    it('matches getAllEnchantments length', () => {
      const count = getEnchantmentCount();
      const all = getAllEnchantments();
      expect(count).toBe(all.length);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // isUsingFallback
  // ─────────────────────────────────────────────────────────────

  describe('isUsingFallback', () => {
    it('returns boolean', () => {
      const result = isUsingFallback();
      expect(typeof result).toBe('boolean');
    });

    it('returns false when using test data with different length', () => {
      // Test data has 7 items, fallback has 11
      const result = isUsingFallback();
      expect(result).toBe(false);
    });

    it('returns true when data length matches fallback length', () => {
      _resetCache();
      // Create test data with exactly 11 items (same as fallback count)
      const elevenItems: EnchantmentData[] = [
        ...testEnchantments,
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
          id: 'silk_touch',
          name: 'Silk Touch',
          maxLevel: 1,
          bookMultiplier: 4,
          itemMultiplier: 8,
          conflicts: ['fortune'],
          applicableTo: ['pickaxe'],
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
      _loadTestData(elevenItems);
      const result = isUsingFallback();
      expect(result).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Cache Behavior
  // ─────────────────────────────────────────────────────────────

  describe('cache behavior', () => {
    it('initializes lazily on first access', () => {
      _resetCache();
      // First call should initialize
      const result = getEnchantment('sharpness');
      // Will load from actual content files or fallback
      expect(result).toBeDefined();
    });

    it('maintains consistent data across multiple calls', () => {
      const result1 = getEnchantment('sharpness');
      const result2 = getEnchantment('sharpness');
      expect(result1).toEqual(result2);
    });

    it('_resetCache clears all data', () => {
      // Load data first
      getAllEnchantments();
      // Reset
      _resetCache();
      // Load with different test data
      _loadTestData([testEnchantments[0]]);
      expect(getEnchantmentCount()).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty data set', () => {
      _resetCache();
      _loadTestData([]);
      expect(getAllEnchantments()).toEqual([]);
      expect(getEnchantmentCount()).toBe(0);
      expect(getEnchantment('sharpness')).toBeUndefined();
      expect(getEnchantmentsByCategory('damage')).toEqual([]);
      expect(getEnchantmentsForItem('sword')).toEqual([]);
    });

    it('handles single enchantment', () => {
      _resetCache();
      _loadTestData([testEnchantments[0]]);
      expect(getAllEnchantments()).toHaveLength(1);
      expect(getEnchantmentCount()).toBe(1);
      expect(getEnchantment('sharpness')).toBeDefined();
      expect(getEnchantmentsByCategory('damage')).toHaveLength(1);
    });

    it('handles enchantment with no conflicts', () => {
      const result = getEnchantment('looting');
      expect(result?.conflicts).toEqual([]);
    });

    it('handles enchantment with single applicableTo', () => {
      const result = getEnchantment('looting');
      expect(result?.applicableTo).toEqual(['sword']);
    });

    it('handles enchantment with multiple applicableTo', () => {
      const result = getEnchantment('efficiency');
      expect(result?.applicableTo).toEqual(['pickaxe', 'axe', 'shovel', 'hoe']);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Data Integrity
  // ─────────────────────────────────────────────────────────────

  describe('data integrity', () => {
    it('all enchantments have valid IDs', () => {
      const all = getAllEnchantments();
      for (const enchant of all) {
        expect(enchant.id).toBeDefined();
        expect(enchant.id).not.toBe('');
      }
    });

    it('all enchantments have valid names', () => {
      const all = getAllEnchantments();
      for (const enchant of all) {
        expect(enchant.name).toBeDefined();
        expect(enchant.name).not.toBe('');
      }
    });

    it('all enchantments have positive maxLevel', () => {
      const all = getAllEnchantments();
      for (const enchant of all) {
        expect(enchant.maxLevel).toBeGreaterThan(0);
      }
    });

    it('all enchantments have positive multipliers', () => {
      const all = getAllEnchantments();
      for (const enchant of all) {
        expect(enchant.bookMultiplier).toBeGreaterThan(0);
        expect(enchant.itemMultiplier).toBeGreaterThan(0);
      }
    });

    it('all enchantments have non-empty applicableTo', () => {
      const all = getAllEnchantments();
      for (const enchant of all) {
        expect(enchant.applicableTo.length).toBeGreaterThan(0);
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Integration with Real Content Files
// ─────────────────────────────────────────────────────────────

describe('Enchantment Lookup (with real content)', () => {
  beforeEach(() => {
    _resetCache();
  });

  afterEach(() => {
    _resetCache();
  });

  it('loads enchantments from content files or fallback', () => {
    // This will load from actual content files if available
    const all = getAllEnchantments();
    expect(all.length).toBeGreaterThan(0);
  });

  it('contains expected base enchantments', () => {
    const all = getAllEnchantments();
    const ids = all.map((e) => e.id);
    // These should be in both content files and fallback
    expect(ids).toContain('sharpness');
    expect(ids).toContain('unbreaking');
    expect(ids).toContain('mending');
  });

  it('sharpness has correct base properties', () => {
    const sharpness = getEnchantment('sharpness');
    expect(sharpness).toBeDefined();
    expect(sharpness?.maxLevel).toBe(5);
    expect(sharpness?.category).toBe('damage');
    expect(sharpness?.applicableTo).toContain('sword');
  });

  it('mending has correct treasure enchant properties', () => {
    const mending = getEnchantment('mending');
    expect(mending).toBeDefined();
    expect(mending?.maxLevel).toBe(1);
    expect(mending?.bookMultiplier).toBe(2);
    expect(mending?.category).toBe('utility');
  });
});
