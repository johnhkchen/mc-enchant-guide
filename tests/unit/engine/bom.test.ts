// tests/unit/engine/bom.test.ts
// Unit tests for the BOM (Bill of Materials) generator

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateBOM,
  aggregateBOMs,
  _resetCache,
  _parseBookItem,
  _getEnchantmentIdByName,
} from '../../../src/engine/bom';
import { computeOptimalTree, _resetNodeIdCounter } from '../../../src/engine/optimizer';
import type { CraftingTreeNode, BillOfMaterials } from '../../../src/types/index';

// ─────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────

function createLeafNode(id: string, item: string): CraftingTreeNode {
  return {
    id,
    type: 'leaf',
    item,
    enchantments: item.endsWith(' Book') ? [item.replace(' Book', '')] : [],
  };
}

function createCombineNode(
  id: string,
  left: CraftingTreeNode,
  right: CraftingTreeNode,
  levelCost: number = 10
): CraftingTreeNode {
  return {
    id,
    type: 'combine',
    left,
    right,
    levelCost,
    xpCost: 100,
    resultingPWP: 1,
    resultLabel: 'Result',
    enchantments: [],
  };
}

// ─────────────────────────────────────────────────────────────
// Book Item Parsing Tests
// ─────────────────────────────────────────────────────────────

describe('_parseBookItem', () => {
  beforeEach(() => {
    _resetCache();
  });

  describe('valid book items', () => {
    it('parses single-level enchantment book (Mending)', () => {
      const result = _parseBookItem('Mending Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('mending');
      expect(result!.level).toBe(1);
      expect(result!.displayName).toBe('Mending Book');
    });

    it('parses level I enchantment book', () => {
      const result = _parseBookItem('Unbreaking I Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('unbreaking');
      expect(result!.level).toBe(1);
    });

    it('parses level II enchantment book', () => {
      const result = _parseBookItem('Fire Aspect II Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('fire_aspect');
      expect(result!.level).toBe(2);
    });

    it('parses level III enchantment book', () => {
      const result = _parseBookItem('Looting III Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('looting');
      expect(result!.level).toBe(3);
    });

    it('parses level IV enchantment book', () => {
      // Note: Sharpness IV is valid
      const result = _parseBookItem('Sharpness IV Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('sharpness');
      expect(result!.level).toBe(4);
    });

    it('parses level V enchantment book', () => {
      const result = _parseBookItem('Smite V Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('smite');
      expect(result!.level).toBe(5);
    });

    it('parses Sharpness V Book', () => {
      const result = _parseBookItem('Sharpness V Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('sharpness');
      expect(result!.level).toBe(5);
    });

    it('parses Efficiency V Book', () => {
      const result = _parseBookItem('Efficiency V Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('efficiency');
      expect(result!.level).toBe(5);
    });

    it('parses Silk Touch Book', () => {
      const result = _parseBookItem('Silk Touch Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('silk_touch');
      expect(result!.level).toBe(1);
    });

    it('parses Fortune III Book', () => {
      const result = _parseBookItem('Fortune III Book');
      expect(result).toBeDefined();
      expect(result!.enchantmentId).toBe('fortune');
      expect(result!.level).toBe(3);
    });
  });

  describe('invalid items', () => {
    it('returns undefined for non-book items', () => {
      expect(_parseBookItem('Netherite Sword')).toBeUndefined();
      expect(_parseBookItem('Diamond Pickaxe')).toBeUndefined();
    });

    it('returns undefined for unknown enchantments', () => {
      expect(_parseBookItem('Unknown Enchant Book')).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(_parseBookItem('')).toBeUndefined();
    });

    it('returns undefined for just "Book"', () => {
      expect(_parseBookItem('Book')).toBeUndefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Enchantment ID Lookup Tests
// ─────────────────────────────────────────────────────────────

describe('_getEnchantmentIdByName', () => {
  beforeEach(() => {
    _resetCache();
  });

  it('looks up enchantment by exact name', () => {
    expect(_getEnchantmentIdByName('Sharpness')).toBe('sharpness');
    expect(_getEnchantmentIdByName('Smite')).toBe('smite');
    expect(_getEnchantmentIdByName('Mending')).toBe('mending');
  });

  it('looks up enchantment case-insensitively', () => {
    expect(_getEnchantmentIdByName('sharpness')).toBe('sharpness');
    expect(_getEnchantmentIdByName('SHARPNESS')).toBe('sharpness');
    expect(_getEnchantmentIdByName('ShArPnEsS')).toBe('sharpness');
  });

  it('looks up multi-word enchantment names', () => {
    expect(_getEnchantmentIdByName('Fire Aspect')).toBe('fire_aspect');
    expect(_getEnchantmentIdByName('Silk Touch')).toBe('silk_touch');
  });

  it('returns undefined for unknown enchantments', () => {
    expect(_getEnchantmentIdByName('Unknown')).toBeUndefined();
    expect(_getEnchantmentIdByName('')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// Generate BOM Tests
// ─────────────────────────────────────────────────────────────

describe('generateBOM', () => {
  beforeEach(() => {
    _resetCache();
    _resetNodeIdCounter();
  });

  describe('single enchantment recipe', () => {
    it('extracts 1 book + 1 base item', () => {
      const tree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const bom = generateBOM(tree);

      expect(bom.items.length).toBe(2);
      expect(bom.items.filter((i) => i.itemType === 'book').length).toBe(1);
      expect(bom.items.filter((i) => i.itemType === 'base_item').length).toBe(1);
    });

    it('identifies base item correctly', () => {
      const tree = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
      const bom = generateBOM(tree);

      expect(bom.baseItem.displayName).toBe('Netherite Sword');
      expect(bom.baseItem.type).toBe('sword');
    });

    it('includes enchantment details for books', () => {
      const tree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const bom = generateBOM(tree);

      const book = bom.items.find((i) => i.itemType === 'book');
      expect(book).toBeDefined();
      expect(book!.enchantment).toBe('sharpness');
      expect(book!.enchantmentLevel).toBe(5);
      expect(book!.quantity).toBe(1);
    });

    it('formats book display name correctly', () => {
      const tree = computeOptimalTree([{ smite: 5 }], 'Netherite Sword');
      const bom = generateBOM(tree);

      const book = bom.items.find((i) => i.itemType === 'book');
      expect(book!.item).toBe('Smite V Book');
    });
  });

  describe('multi-enchantment recipe', () => {
    it('extracts N books + 1 base item for N enchantments', () => {
      const tree = computeOptimalTree(
        [{ smite: 5 }, { looting: 3 }, { mending: 1 }],
        'Netherite Sword'
      );
      const bom = generateBOM(tree);

      expect(bom.items.filter((i) => i.itemType === 'book').length).toBe(3);
      expect(bom.items.filter((i) => i.itemType === 'base_item').length).toBe(1);
    });

    it('includes all enchantments', () => {
      const tree = computeOptimalTree(
        [{ smite: 5 }, { looting: 3 }, { mending: 1 }],
        'Netherite Sword'
      );
      const bom = generateBOM(tree);

      const books = bom.items.filter((i) => i.itemType === 'book');
      const enchantmentIds = books.map((b) => b.enchantment);

      expect(enchantmentIds).toContain('smite');
      expect(enchantmentIds).toContain('looting');
      expect(enchantmentIds).toContain('mending');
    });

    it('handles mob farm sword correctly', () => {
      const tree = computeOptimalTree(
        [
          { smite: 5 },
          { looting: 3 },
          { fire_aspect: 2 },
          { unbreaking: 3 },
          { mending: 1 },
        ],
        'Netherite Sword'
      );
      const bom = generateBOM(tree);

      expect(bom.items.filter((i) => i.itemType === 'book').length).toBe(5);
      expect(bom.baseItem.displayName).toBe('Netherite Sword');
    });
  });

  describe('item grouping with quantities', () => {
    it('groups identical books with quantities', () => {
      // Create a tree with duplicate books manually
      const book1 = createLeafNode('b1', 'Sharpness V Book');
      const book2 = createLeafNode('b2', 'Sharpness V Book');
      const base = createLeafNode('s', 'Netherite Sword');
      const combine1 = createCombineNode('c1', book1, book2, 5);
      const combine2 = createCombineNode('c2', base, combine1, 10);

      const bom = generateBOM(combine2);

      const sharpnessBooks = bom.items.filter(
        (i) => i.itemType === 'book' && i.enchantment === 'sharpness'
      );
      expect(sharpnessBooks.length).toBe(1);
      expect(sharpnessBooks[0].quantity).toBe(2);
    });

    it('keeps different books separate', () => {
      const tree = computeOptimalTree(
        [{ sharpness: 5 }, { smite: 5 }],
        'Netherite Sword'
      );
      const bom = generateBOM(tree);

      const books = bom.items.filter((i) => i.itemType === 'book');
      expect(books.length).toBe(2);
      expect(books.every((b) => b.quantity === 1)).toBe(true);
    });
  });

  describe('sorting', () => {
    it('sorts books before base items', () => {
      const tree = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
      const bom = generateBOM(tree);

      const bookIndex = bom.items.findIndex((i) => i.itemType === 'book');
      const baseIndex = bom.items.findIndex((i) => i.itemType === 'base_item');

      expect(bookIndex).toBeLessThan(baseIndex);
    });

    it('sorts books alphabetically', () => {
      const tree = computeOptimalTree(
        [{ smite: 5 }, { mending: 1 }, { looting: 3 }],
        'Netherite Sword'
      );
      const bom = generateBOM(tree);

      const books = bom.items.filter((i) => i.itemType === 'book');
      const names = books.map((b) => b.item);

      // Should be sorted alphabetically
      expect(names).toEqual([...names].sort());
    });
  });

  describe('edge cases', () => {
    it('handles empty tree (base item only)', () => {
      const tree = computeOptimalTree([], 'Diamond Pickaxe');
      const bom = generateBOM(tree);

      expect(bom.items.length).toBe(1);
      expect(bom.items[0].itemType).toBe('base_item');
      expect(bom.baseItem.displayName).toBe('Diamond Pickaxe');
    });

    it('handles single-level enchantment (no Roman numeral)', () => {
      const tree = computeOptimalTree([{ mending: 1 }], 'Diamond Sword');
      const bom = generateBOM(tree);

      const book = bom.items.find((i) => i.itemType === 'book');
      expect(book!.item).toBe('Mending Book');
      expect(book!.enchantmentLevel).toBe(1);
    });

    it('handles different base item types', () => {
      const swordTree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const pickTree = computeOptimalTree([{ efficiency: 5 }], 'Diamond Pickaxe');

      const swordBom = generateBOM(swordTree);
      const pickBom = generateBOM(pickTree);

      expect(swordBom.baseItem.type).toBe('sword');
      expect(pickBom.baseItem.type).toBe('pickaxe');
    });

    it('handles singleton items (no material)', () => {
      const tree = computeOptimalTree([{ unbreaking: 3 }], 'Bow');
      const bom = generateBOM(tree);

      expect(bom.baseItem.displayName).toBe('Bow');
      expect(bom.baseItem.type).toBe('bow');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Aggregate BOMs Tests
// ─────────────────────────────────────────────────────────────

describe('aggregateBOMs', () => {
  beforeEach(() => {
    _resetCache();
    _resetNodeIdCounter();
  });

  describe('empty input', () => {
    it('returns empty BOM for empty array', () => {
      const result = aggregateBOMs([]);
      expect(result.items.length).toBe(0);
    });
  });

  describe('single BOM', () => {
    it('returns the same BOM for single input', () => {
      const tree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const bom = generateBOM(tree);

      const result = aggregateBOMs([bom]);

      expect(result.items.length).toBe(bom.items.length);
      expect(result.baseItem).toEqual(bom.baseItem);
    });
  });

  describe('multiple BOMs', () => {
    it('merges quantities for identical items', () => {
      const tree1 = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const tree2 = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const bom1 = generateBOM(tree1);
      const bom2 = generateBOM(tree2);

      const result = aggregateBOMs([bom1, bom2]);

      const sharpnessBooks = result.items.filter(
        (i) => i.itemType === 'book' && i.enchantment === 'sharpness'
      );
      expect(sharpnessBooks.length).toBe(1);
      expect(sharpnessBooks[0].quantity).toBe(2);
    });

    it('merges base items with quantities', () => {
      const tree1 = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const tree2 = computeOptimalTree([{ smite: 5 }], 'Netherite Sword');
      const bom1 = generateBOM(tree1);
      const bom2 = generateBOM(tree2);

      const result = aggregateBOMs([bom1, bom2]);

      const swords = result.items.filter((i) => i.itemType === 'base_item');
      expect(swords.length).toBe(1);
      expect(swords[0].quantity).toBe(2);
    });

    it('keeps different items separate', () => {
      const tree1 = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const tree2 = computeOptimalTree([{ smite: 5 }], 'Diamond Sword');
      const bom1 = generateBOM(tree1);
      const bom2 = generateBOM(tree2);

      const result = aggregateBOMs([bom1, bom2]);

      const books = result.items.filter((i) => i.itemType === 'book');
      expect(books.length).toBe(2);

      const swords = result.items.filter((i) => i.itemType === 'base_item');
      expect(swords.length).toBe(2);
    });

    it('aggregates complex recipes correctly', () => {
      // Two mob farm swords
      const tree1 = computeOptimalTree(
        [{ smite: 5 }, { looting: 3 }, { mending: 1 }],
        'Netherite Sword'
      );
      const tree2 = computeOptimalTree(
        [{ smite: 5 }, { looting: 3 }, { mending: 1 }],
        'Netherite Sword'
      );

      const bom1 = generateBOM(tree1);
      const bom2 = generateBOM(tree2);
      const result = aggregateBOMs([bom1, bom2]);

      // Should have 3 unique book types with quantity 2 each
      const books = result.items.filter((i) => i.itemType === 'book');
      expect(books.length).toBe(3);
      expect(books.every((b) => b.quantity === 2)).toBe(true);

      // And 1 sword entry with quantity 2
      const swords = result.items.filter((i) => i.itemType === 'base_item');
      expect(swords.length).toBe(1);
      expect(swords[0].quantity).toBe(2);
    });
  });

  describe('test case: aggregate 2 sword recipes', () => {
    it('combines books correctly for 2 different sword recipes', () => {
      // Sharpness sword
      const tree1 = computeOptimalTree([{ sharpness: 5 }, { mending: 1 }], 'Netherite Sword');
      // Smite sword
      const tree2 = computeOptimalTree([{ smite: 5 }, { mending: 1 }], 'Netherite Sword');

      const bom1 = generateBOM(tree1);
      const bom2 = generateBOM(tree2);
      const result = aggregateBOMs([bom1, bom2]);

      // Should have: Sharpness V (1), Smite V (1), Mending (2), Sword (2)
      const sharpness = result.items.find((i) => i.enchantment === 'sharpness');
      const smite = result.items.find((i) => i.enchantment === 'smite');
      const mending = result.items.find((i) => i.enchantment === 'mending');
      const swords = result.items.filter((i) => i.itemType === 'base_item');

      expect(sharpness?.quantity).toBe(1);
      expect(smite?.quantity).toBe(1);
      expect(mending?.quantity).toBe(2);
      expect(swords.length).toBe(1);
      expect(swords[0].quantity).toBe(2);
    });
  });

  describe('test case: aggregate same recipe x2', () => {
    it('doubles quantities for identical recipes', () => {
      const tree = computeOptimalTree([{ sharpness: 5 }, { looting: 3 }], 'Netherite Sword');
      const bom = generateBOM(tree);

      const result = aggregateBOMs([bom, bom]);

      for (const item of result.items) {
        if (item.itemType === 'book') {
          expect(item.quantity).toBe(2);
        } else {
          expect(item.quantity).toBe(2);
        }
      }
    });
  });

  describe('sorting after aggregation', () => {
    it('maintains book-before-base-item order', () => {
      const tree1 = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const tree2 = computeOptimalTree([{ efficiency: 5 }], 'Diamond Pickaxe');
      const bom1 = generateBOM(tree1);
      const bom2 = generateBOM(tree2);

      const result = aggregateBOMs([bom1, bom2]);

      const books = result.items.filter((i) => i.itemType === 'book');
      const baseItems = result.items.filter((i) => i.itemType === 'base_item');

      // All books should come before all base items
      const lastBookIndex = result.items.lastIndexOf(books[books.length - 1]);
      const firstBaseIndex = result.items.indexOf(baseItems[0]);

      expect(lastBookIndex).toBeLessThan(firstBaseIndex);
    });
  });

  describe('does not mutate input', () => {
    it('preserves original BOM quantities', () => {
      const tree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      const bom = generateBOM(tree);
      const originalQuantity = bom.items[0].quantity;

      aggregateBOMs([bom, bom]);

      expect(bom.items[0].quantity).toBe(originalQuantity);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Integration Tests
// ─────────────────────────────────────────────────────────────

describe('BOM integration', () => {
  beforeEach(() => {
    _resetCache();
    _resetNodeIdCounter();
  });

  it('full workflow: recipe -> BOM -> aggregate', () => {
    // Create two recipes
    const sword = computeOptimalTree(
      [{ sharpness: 5 }, { looting: 3 }, { mending: 1 }],
      'Netherite Sword'
    );
    const pick = computeOptimalTree(
      [{ efficiency: 5 }, { fortune: 3 }, { mending: 1 }],
      'Diamond Pickaxe'
    );

    // Generate BOMs
    const swordBom = generateBOM(sword);
    const pickBom = generateBOM(pick);

    // Aggregate
    const combined = aggregateBOMs([swordBom, pickBom]);

    // Verify structure
    expect(combined.items.length).toBeGreaterThan(0);

    // Mending should appear twice (combined)
    const mending = combined.items.find((i) => i.enchantment === 'mending');
    expect(mending?.quantity).toBe(2);

    // Other enchantments should appear once
    const sharpness = combined.items.find((i) => i.enchantment === 'sharpness');
    expect(sharpness?.quantity).toBe(1);
  });

  it('handles god sword BOM correctly', () => {
    const tree = computeOptimalTree(
      [
        { sharpness: 5 },
        { looting: 3 },
        { fire_aspect: 2 },
        { unbreaking: 3 },
        { mending: 1 },
      ],
      'Netherite Sword'
    );
    const bom = generateBOM(tree);

    // 5 books + 1 sword = 6 items
    expect(bom.items.length).toBe(6);

    // Verify all enchantments present
    const enchantments = bom.items
      .filter((i) => i.itemType === 'book')
      .map((i) => i.enchantment);

    expect(enchantments).toContain('sharpness');
    expect(enchantments).toContain('looting');
    expect(enchantments).toContain('fire_aspect');
    expect(enchantments).toContain('unbreaking');
    expect(enchantments).toContain('mending');
  });
});

// ─────────────────────────────────────────────────────────────
// Edge Case Coverage
// ─────────────────────────────────────────────────────────────

describe('edge cases', () => {
  beforeEach(() => {
    _resetCache();
    _resetNodeIdCounter();
  });

  it('handles tree with unknown base item display name', () => {
    // Create a tree with a base item not in the lookup
    const unknownBase = createLeafNode('b', 'Unknown Magic Item');
    const book = createLeafNode('book', 'Mending Book');
    const tree = createCombineNode('c', unknownBase, book, 5);

    const bom = generateBOM(tree);

    expect(bom.items.length).toBe(2);
    expect(bom.baseItem.displayName).toBe('Unknown Magic Item');
  });

  it('handles leaf node without item property', () => {
    const emptyLeaf: CraftingTreeNode = {
      id: 'empty',
      type: 'leaf',
    };

    const bom = generateBOM(emptyLeaf);

    expect(bom.items.length).toBe(0);
  });

  it('handles deeply nested tree', () => {
    // Create a tree with 3 levels of nesting
    const book1 = createLeafNode('b1', 'Sharpness V Book');
    const book2 = createLeafNode('b2', 'Smite V Book');
    const book3 = createLeafNode('b3', 'Mending Book');
    const book4 = createLeafNode('b4', 'Looting III Book');
    const base = createLeafNode('base', 'Netherite Sword');

    const combine1 = createCombineNode('c1', book1, book2, 5);
    const combine2 = createCombineNode('c2', book3, book4, 5);
    const combine3 = createCombineNode('c3', combine1, combine2, 10);
    const combine4 = createCombineNode('c4', base, combine3, 15);

    const bom = generateBOM(combine4);

    expect(bom.items.filter((i) => i.itemType === 'book').length).toBe(4);
    expect(bom.items.filter((i) => i.itemType === 'base_item').length).toBe(1);
  });

  it('handles aggregating many BOMs', () => {
    const tree = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
    const bom = generateBOM(tree);

    // Aggregate 10 copies
    const boms = Array(10).fill(bom);
    const result = aggregateBOMs(boms);

    const mending = result.items.find((i) => i.enchantment === 'mending');
    expect(mending?.quantity).toBe(10);

    const sword = result.items.find((i) => i.itemType === 'base_item');
    expect(sword?.quantity).toBe(10);
  });
});
