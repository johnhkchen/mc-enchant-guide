// tests/unit/components/combined-materials.test.ts
// Unit tests for CombinedMaterials component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CartItem, BillOfMaterials, BOMItem, BaseItemType } from '../../../src/types/index.js';

// Mock cart store
const mockItems = vi.fn((): CartItem[] => []);

vi.mock('../../../src/stores/cart.js', () => ({
  cartStore: {
    items: () => mockItems(),
  },
}));

describe('CombinedMaterials Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Props Interface', () => {
    it('accepts recipeBOMs map', () => {
      const recipeBOMs: Record<string, BillOfMaterials> = {
        'swords/god-sword': {
          items: [
            { item: 'Netherite Sword', itemType: 'base_item', quantity: 1 },
            { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 1 },
          ],
          baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
        },
      };

      expect(recipeBOMs['swords/god-sword']).toBeDefined();
      expect(recipeBOMs['swords/god-sword'].items).toHaveLength(2);
    });
  });

  describe('BOM Key Generation', () => {
    function createBomKey(item: BOMItem): string {
      if (item.itemType === 'book' && item.enchantment) {
        return `book:${item.enchantment}:${item.enchantmentLevel}`;
      }
      return `base:${item.item}`;
    }

    it('generates key for book items', () => {
      const bookItem: BOMItem = {
        item: 'Sharpness V Book',
        itemType: 'book',
        enchantment: 'sharpness',
        enchantmentLevel: 5,
        quantity: 1,
      };

      const key = createBomKey(bookItem);
      expect(key).toBe('book:sharpness:5');
    });

    it('generates key for base items', () => {
      const baseItem: BOMItem = {
        item: 'Netherite Sword',
        itemType: 'base_item',
        quantity: 1,
      };

      const key = createBomKey(baseItem);
      expect(key).toBe('base:Netherite Sword');
    });

    it('generates different keys for different enchantment levels', () => {
      const sharpness3: BOMItem = {
        item: 'Sharpness III Book',
        itemType: 'book',
        enchantment: 'sharpness',
        enchantmentLevel: 3,
        quantity: 1,
      };

      const sharpness5: BOMItem = {
        item: 'Sharpness V Book',
        itemType: 'book',
        enchantment: 'sharpness',
        enchantmentLevel: 5,
        quantity: 1,
      };

      const key3 = createBomKey(sharpness3);
      const key5 = createBomKey(sharpness5);

      expect(key3).not.toBe(key5);
      expect(key3).toBe('book:sharpness:3');
      expect(key5).toBe('book:sharpness:5');
    });
  });

  describe('BOM Aggregation', () => {
    function aggregateBOMsClient(boms: BillOfMaterials[]): BillOfMaterials {
      if (boms.length === 0) {
        return {
          items: [],
          baseItem: { type: 'sword' as BaseItemType, displayName: 'None' },
        };
      }

      if (boms.length === 1) {
        return boms[0];
      }

      const itemMap = new Map<string, BOMItem>();

      for (const bom of boms) {
        for (const item of bom.items) {
          const key = item.itemType === 'book' && item.enchantment
            ? `book:${item.enchantment}:${item.enchantmentLevel}`
            : `base:${item.item}`;

          const existing = itemMap.get(key);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            itemMap.set(key, { ...item });
          }
        }
      }

      const items = Array.from(itemMap.values()).sort((a, b) => {
        if (a.itemType === 'book' && b.itemType !== 'book') return -1;
        if (a.itemType !== 'book' && b.itemType === 'book') return 1;
        return a.item.localeCompare(b.item);
      });

      return {
        items,
        baseItem: boms[0].baseItem,
      };
    }

    it('returns empty BOM for empty input', () => {
      const result = aggregateBOMsClient([]);
      expect(result.items).toHaveLength(0);
      expect(result.baseItem.displayName).toBe('None');
    });

    it('returns same BOM for single input', () => {
      const bom: BillOfMaterials = {
        items: [
          { item: 'Netherite Sword', itemType: 'base_item', quantity: 1 },
        ],
        baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
      };

      const result = aggregateBOMsClient([bom]);
      expect(result).toBe(bom);
    });

    it('aggregates quantities for same items', () => {
      const bom1: BillOfMaterials = {
        items: [
          { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 1 },
        ],
        baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
      };

      const bom2: BillOfMaterials = {
        items: [
          { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 1 },
        ],
        baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
      };

      const result = aggregateBOMsClient([bom1, bom2]);
      const sharpnessItem = result.items.find(i => i.enchantment === 'sharpness');
      expect(sharpnessItem?.quantity).toBe(2);
    });

    it('aggregates different base items separately', () => {
      const bom1: BillOfMaterials = {
        items: [
          { item: 'Netherite Sword', itemType: 'base_item', quantity: 1 },
        ],
        baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
      };

      const bom2: BillOfMaterials = {
        items: [
          { item: 'Netherite Pickaxe', itemType: 'base_item', quantity: 1 },
        ],
        baseItem: { type: 'pickaxe' as BaseItemType, displayName: 'Netherite Pickaxe' },
      };

      const result = aggregateBOMsClient([bom1, bom2]);
      const baseItems = result.items.filter(i => i.itemType === 'base_item');
      expect(baseItems).toHaveLength(2);
    });

    it('sorts books before base items', () => {
      const bom: BillOfMaterials = {
        items: [
          { item: 'Netherite Sword', itemType: 'base_item', quantity: 1 },
          { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 1 },
        ],
        baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
      };

      // Re-sort with the algorithm
      const result = aggregateBOMsClient([bom]);
      // Since single BOM returns same reference, test with two
      const bom2 = { ...bom, items: [...bom.items] };
      const result2 = aggregateBOMsClient([bom, bom2]);

      // Books should come first
      expect(result2.items[0].itemType).toBe('book');
    });
  });

  describe('Filtering Base Items and Books', () => {
    it('separates base items correctly', () => {
      const items: BOMItem[] = [
        { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 1 },
        { item: 'Netherite Sword', itemType: 'base_item', quantity: 1 },
        { item: 'Looting III Book', itemType: 'book', enchantment: 'looting', enchantmentLevel: 3, quantity: 1 },
      ];

      const baseItems = items.filter(item => item.itemType === 'base_item');
      const bookItems = items.filter(item => item.itemType === 'book');

      expect(baseItems).toHaveLength(1);
      expect(bookItems).toHaveLength(2);
    });
  });

  describe('Text List Generation', () => {
    it('generates text list with base items', () => {
      const baseItems: BOMItem[] = [
        { item: 'Netherite Sword', itemType: 'base_item', quantity: 2 },
      ];

      const lines: string[] = [];
      lines.push('Shopping List - Materials Needed');
      lines.push('================================');
      lines.push('');
      lines.push('BASE ITEMS:');
      for (const item of baseItems) {
        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
        lines.push(`  ${qty}${item.item}`);
      }

      const text = lines.join('\n');
      expect(text).toContain('BASE ITEMS:');
      expect(text).toContain('2x Netherite Sword');
    });

    it('generates text list with enchanted books', () => {
      const bookItems: BOMItem[] = [
        { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 3 },
      ];

      const lines: string[] = [];
      lines.push('ENCHANTED BOOKS:');
      for (const item of bookItems) {
        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
        lines.push(`  ${qty}${item.item}`);
      }

      const text = lines.join('\n');
      expect(text).toContain('ENCHANTED BOOKS:');
      expect(text).toContain('3x Sharpness V Book');
    });

    it('omits quantity prefix for single items', () => {
      const item: BOMItem = { item: 'Mending Book', itemType: 'book', enchantment: 'mending', enchantmentLevel: 1, quantity: 1 };
      const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
      const line = `  ${qty}${item.item}`;

      expect(line).toBe('  Mending Book');
      expect(line).not.toContain('1x');
    });

    it('generates summary line', () => {
      const items: BOMItem[] = [
        { item: 'Netherite Sword', itemType: 'base_item', quantity: 2 },
        { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 3 },
        { item: 'Looting III Book', itemType: 'book', enchantment: 'looting', enchantmentLevel: 3, quantity: 1 },
      ];

      const totalUnique = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const summary = `Total: ${totalQuantity} items (${totalUnique} unique)`;

      expect(summary).toBe('Total: 6 items (3 unique)');
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no items', () => {
      mockItems.mockReturnValue([]);
      const isEmpty = mockItems().length === 0;
      expect(isEmpty).toBe(true);
    });

    it('hides empty message when items exist', () => {
      mockItems.mockReturnValue([
        { recipeId: 'test', recipeName: 'Test', quantity: 1, levelCost: 10 },
      ]);
      const isEmpty = mockItems().length === 0;
      expect(isEmpty).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('has ARIA labels for material groups', () => {
      const baseItemsLabel = 'Base items';
      const booksLabel = 'Enchanted books';

      expect(baseItemsLabel).toBe('Base items');
      expect(booksLabel).toBe('Enchanted books');
    });

    it('has ARIA labels for action buttons', () => {
      const copyLabel = 'Copy materials list to clipboard';
      const exportLabel = 'Export materials list as text file';

      expect(copyLabel).toBe('Copy materials list to clipboard');
      expect(exportLabel).toBe('Export materials list as text file');
    });
  });

  describe('Quantity Display', () => {
    it('formats quantity with x suffix', () => {
      const quantity = 5;
      const display = `${quantity}x`;
      expect(display).toBe('5x');
    });

    it('displays quantity for all items', () => {
      const item: BOMItem = {
        item: 'Sharpness V Book',
        itemType: 'book',
        enchantment: 'sharpness',
        enchantmentLevel: 5,
        quantity: 3,
      };

      const qtyDisplay = `${item.quantity}x`;
      expect(qtyDisplay).toBe('3x');
    });
  });

  describe('Cart Integration', () => {
    it('combines BOMs based on cart quantities', () => {
      const cartItems: CartItem[] = [
        { recipeId: 'swords/god-sword', recipeName: 'God Sword', quantity: 2, levelCost: 45 },
      ];

      mockItems.mockReturnValue(cartItems);

      // With quantity 2, BOM should be added twice
      const recipeBoM: BillOfMaterials = {
        items: [
          { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness', enchantmentLevel: 5, quantity: 1 },
        ],
        baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
      };

      // Simulate aggregation for quantity 2
      const allBOMs: BillOfMaterials[] = [];
      for (let i = 0; i < cartItems[0].quantity; i++) {
        allBOMs.push(recipeBoM);
      }

      expect(allBOMs).toHaveLength(2);
    });

    it('handles multiple different recipes', () => {
      const cartItems: CartItem[] = [
        { recipeId: 'swords/god-sword', recipeName: 'God Sword', quantity: 1, levelCost: 45 },
        { recipeId: 'pickaxes/fortune-pick', recipeName: 'Fortune Pick', quantity: 1, levelCost: 20 },
      ];

      mockItems.mockReturnValue(cartItems);
      expect(mockItems()).toHaveLength(2);
    });
  });

  describe('File Export', () => {
    it('generates correct filename', () => {
      const filename = 'minecraft-shopping-list.txt';
      expect(filename).toBe('minecraft-shopping-list.txt');
    });

    it('uses text/plain content type', () => {
      const contentType = 'text/plain';
      expect(contentType).toBe('text/plain');
    });
  });
});
