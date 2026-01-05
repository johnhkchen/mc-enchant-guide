// tests/unit/utils/format.test.ts
// Tests for format utilities

import { describe, it, expect, beforeEach } from 'vitest';
import {
  toRomanNumeral,
  formatEnchantment,
  getEnchantmentEntries,
  formatEnchantments,
} from '../../../src/utils/format.js';
import { _loadTestData, _resetCache } from '../../../src/data/enchantment-lookup.js';
import type { EnchantmentData } from '../../../src/data/enchantment-lookup.js';

// ─────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────

const mockEnchantments: EnchantmentData[] = [
  {
    id: 'sharpness',
    name: 'Sharpness',
    maxLevel: 5,
    bookMultiplier: 1,
    itemMultiplier: 1,
    conflicts: [],
    applicableTo: ['sword'],
    category: 'damage',
  },
  {
    id: 'mending',
    name: 'Mending',
    maxLevel: 1,
    bookMultiplier: 2,
    itemMultiplier: 4,
    conflicts: [],
    applicableTo: ['sword'],
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
];

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Format Utilities', () => {
  beforeEach(() => {
    _resetCache();
    _loadTestData(mockEnchantments);
  });

  describe('toRomanNumeral', () => {
    it('converts 1 to I', () => {
      expect(toRomanNumeral(1)).toBe('I');
    });

    it('converts 2 to II', () => {
      expect(toRomanNumeral(2)).toBe('II');
    });

    it('converts 3 to III', () => {
      expect(toRomanNumeral(3)).toBe('III');
    });

    it('converts 4 to IV', () => {
      expect(toRomanNumeral(4)).toBe('IV');
    });

    it('converts 5 to V', () => {
      expect(toRomanNumeral(5)).toBe('V');
    });

    it('returns empty string for 0', () => {
      expect(toRomanNumeral(0)).toBe('');
    });

    it('returns number as string for values > 5', () => {
      expect(toRomanNumeral(6)).toBe('6');
      expect(toRomanNumeral(10)).toBe('10');
    });
  });

  describe('formatEnchantment', () => {
    it('formats enchantment with level as Roman numeral', () => {
      expect(formatEnchantment('sharpness', 5)).toBe('Sharpness V');
      expect(formatEnchantment('looting', 3)).toBe('Looting III');
      expect(formatEnchantment('fire_aspect', 2)).toBe('Fire Aspect II');
    });

    it('omits numeral for max level 1 enchantments at level 1', () => {
      expect(formatEnchantment('mending', 1)).toBe('Mending');
    });

    it('shows numeral for multi-level enchantments at level 1', () => {
      expect(formatEnchantment('sharpness', 1)).toBe('Sharpness I');
      expect(formatEnchantment('looting', 1)).toBe('Looting I');
    });

    it('handles unknown enchantments with fallback formatting', () => {
      expect(formatEnchantment('unknown_enchant', 3)).toBe('Unknown Enchant III');
    });

    it('capitalizes first letter of each word for unknown enchantments', () => {
      expect(formatEnchantment('some_multi_word_enchant', 2)).toBe('Some Multi Word Enchant II');
    });
  });

  describe('getEnchantmentEntries', () => {
    it('extracts entries from single-key objects', () => {
      const specs = [{ sharpness: 5 }, { looting: 3 }];
      const entries = getEnchantmentEntries(specs);

      expect(entries).toEqual([
        ['sharpness', 5],
        ['looting', 3],
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(getEnchantmentEntries([])).toEqual([]);
    });

    it('handles multiple entries in a single object', () => {
      // This shouldn't happen in practice, but test the behavior
      const specs = [{ sharpness: 5, looting: 3 }];
      const entries = getEnchantmentEntries(specs);

      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['sharpness', 5]);
      expect(entries).toContainEqual(['looting', 3]);
    });
  });

  describe('formatEnchantments', () => {
    it('formats array of enchantment specs', () => {
      const specs = [
        { sharpness: 5 },
        { looting: 3 },
        { mending: 1 },
      ];

      const result = formatEnchantments(specs);

      expect(result).toEqual([
        'Sharpness V',
        'Looting III',
        'Mending',
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(formatEnchantments([])).toEqual([]);
    });

    it('handles mixed known and unknown enchantments', () => {
      const specs = [
        { sharpness: 5 },
        { unknown_enchant: 2 },
      ];

      const result = formatEnchantments(specs);

      expect(result).toEqual([
        'Sharpness V',
        'Unknown Enchant II',
      ]);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// RecipeCard Smoke Tests
// ─────────────────────────────────────────────────────────────

describe('RecipeCard (smoke tests)', () => {
  it('format utilities work correctly for typical recipe', () => {
    // Simulates what RecipeCard does with a god sword recipe
    const enchantments = [
      { sharpness: 5 },
      { looting: 3 },
      { fire_aspect: 2 },
      { mending: 1 },
    ];

    const formatted = formatEnchantments(enchantments);

    expect(formatted).toEqual([
      'Sharpness V',
      'Looting III',
      'Fire Aspect II',
      'Mending',
    ]);
  });

  it('handles empty enchantments array', () => {
    const formatted = formatEnchantments([]);
    expect(formatted).toEqual([]);
  });
});
