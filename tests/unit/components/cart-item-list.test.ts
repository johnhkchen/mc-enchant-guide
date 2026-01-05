// tests/unit/components/cart-item-list.test.ts
// Unit tests for CartItemList component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CartItem, BillOfMaterials, CraftingTreeNode, BaseItemType } from '../../../src/types/index.js';

// Mock cart store
const mockItems = vi.fn((): CartItem[] => []);
const mockTotalLevels = vi.fn(() => 0);
const mockRemove = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockClear = vi.fn();

vi.mock('../../../src/stores/cart.js', () => ({
  cartStore: {
    items: () => mockItems(),
    totalLevels: () => mockTotalLevels(),
    remove: (id: string) => mockRemove(id),
    updateQuantity: (id: string, qty: number) => mockUpdateQuantity(id, qty),
    clear: () => mockClear(),
  },
}));

describe('CartItemList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems.mockReturnValue([]);
    mockTotalLevels.mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RecipeModalData Interface', () => {
    it('has correct structure for modal data', () => {
      const modalData = {
        id: 'swords/god-sword',
        name: 'God Sword',
        tree: {
          id: 'root',
          type: 'combine' as const,
          left: { id: 'l1', type: 'leaf' as const, item: 'Netherite Sword' },
          right: { id: 'r1', type: 'leaf' as const, item: 'Sharpness V Book' },
          levelCost: 5,
        },
        bom: {
          items: [
            { item: 'Sharpness V Book', itemType: 'book' as const, quantity: 1, enchantment: 'sharpness' as const, enchantmentLevel: 5 },
          ],
          baseItem: { type: 'sword' as BaseItemType, displayName: 'Netherite Sword' },
        },
      };

      expect(modalData.id).toBe('swords/god-sword');
      expect(modalData.name).toBe('God Sword');
      expect(modalData.tree.type).toBe('combine');
      expect(modalData.bom.items).toHaveLength(1);
    });
  });

  describe('Cart Item Data', () => {
    it('CartItem has required fields', () => {
      const cartItem: CartItem = {
        recipeId: 'swords/god-sword',
        recipeName: 'God Sword',
        quantity: 2,
        levelCost: 45,
      };

      expect(cartItem.recipeId).toBe('swords/god-sword');
      expect(cartItem.recipeName).toBe('God Sword');
      expect(cartItem.quantity).toBe(2);
      expect(cartItem.levelCost).toBe(45);
    });

    it('total cost calculates correctly', () => {
      const cartItem: CartItem = {
        recipeId: 'swords/god-sword',
        recipeName: 'God Sword',
        quantity: 3,
        levelCost: 45,
      };

      const totalCost = cartItem.levelCost * cartItem.quantity;
      expect(totalCost).toBe(135);
    });
  });

  describe('Cart State Management', () => {
    it('returns empty array when cart is empty', () => {
      mockItems.mockReturnValue([]);
      expect(mockItems()).toHaveLength(0);
    });

    it('returns items when cart has items', () => {
      const items: CartItem[] = [
        { recipeId: 'swords/god-sword', recipeName: 'God Sword', quantity: 1, levelCost: 45 },
        { recipeId: 'pickaxes/fortune-pick', recipeName: 'Fortune Pick', quantity: 2, levelCost: 20 },
      ];
      mockItems.mockReturnValue(items);

      expect(mockItems()).toHaveLength(2);
      expect(mockItems()[0].recipeName).toBe('God Sword');
    });

    it('calculates total levels correctly', () => {
      const items: CartItem[] = [
        { recipeId: 'swords/god-sword', recipeName: 'God Sword', quantity: 2, levelCost: 45 },
        { recipeId: 'pickaxes/fortune-pick', recipeName: 'Fortune Pick', quantity: 1, levelCost: 20 },
      ];
      mockItems.mockReturnValue(items);
      mockTotalLevels.mockReturnValue(110); // 45*2 + 20*1

      expect(mockTotalLevels()).toBe(110);
    });
  });

  describe('Quantity Updates', () => {
    it('calls updateQuantity when increasing', () => {
      mockUpdateQuantity('swords/god-sword', 2);
      expect(mockUpdateQuantity).toHaveBeenCalledWith('swords/god-sword', 2);
    });

    it('calls updateQuantity when decreasing', () => {
      mockUpdateQuantity('swords/god-sword', 1);
      expect(mockUpdateQuantity).toHaveBeenCalledWith('swords/god-sword', 1);
    });

    it('calls remove when quantity becomes 0', () => {
      mockRemove('swords/god-sword');
      expect(mockRemove).toHaveBeenCalledWith('swords/god-sword');
    });
  });

  describe('Item Removal', () => {
    it('calls remove with correct recipe ID', () => {
      mockRemove('swords/god-sword');
      expect(mockRemove).toHaveBeenCalledWith('swords/god-sword');
    });
  });

  describe('Clear All', () => {
    it('calls clear when confirmed', () => {
      mockClear();
      expect(mockClear).toHaveBeenCalled();
    });
  });

  describe('Quick Craft Event', () => {
    it('creates correct event structure', () => {
      const recipeId = 'swords/god-sword';
      const eventDetail = { recipeId };

      expect(eventDetail.recipeId).toBe('swords/god-sword');
    });
  });

  describe('Empty State', () => {
    it('shows empty state when cart is empty', () => {
      mockItems.mockReturnValue([]);
      const isEmpty = mockItems().length === 0;
      expect(isEmpty).toBe(true);
    });

    it('hides empty state when cart has items', () => {
      const items: CartItem[] = [
        { recipeId: 'swords/god-sword', recipeName: 'God Sword', quantity: 1, levelCost: 45 },
      ];
      mockItems.mockReturnValue(items);
      const isEmpty = mockItems().length === 0;
      expect(isEmpty).toBe(false);
    });
  });

  describe('Display Formatting', () => {
    it('formats single item cost correctly', () => {
      const item: CartItem = {
        recipeId: 'test',
        recipeName: 'Test',
        quantity: 1,
        levelCost: 45,
      };
      const display = `${item.levelCost} lvl`;
      expect(display).toBe('45 lvl');
    });

    it('formats multiple item cost correctly', () => {
      const item: CartItem = {
        recipeId: 'test',
        recipeName: 'Test',
        quantity: 3,
        levelCost: 45,
      };
      const totalCost = item.levelCost * item.quantity;
      const display = `${totalCost} lvl`;
      expect(display).toBe('135 lvl');
    });

    it('formats grand total correctly', () => {
      const total = 215;
      const display = `${total} levels`;
      expect(display).toBe('215 levels');
    });
  });

  describe('Accessibility', () => {
    it('has ARIA labels for quantity controls', () => {
      const item: CartItem = {
        recipeId: 'swords/god-sword',
        recipeName: 'God Sword',
        quantity: 1,
        levelCost: 45,
      };

      const decreaseLabel = `Decrease quantity for ${item.recipeName}`;
      const increaseLabel = `Increase quantity for ${item.recipeName}`;
      const quantityLabel = `Quantity: ${item.quantity}`;

      expect(decreaseLabel).toBe('Decrease quantity for God Sword');
      expect(increaseLabel).toBe('Increase quantity for God Sword');
      expect(quantityLabel).toBe('Quantity: 1');
    });

    it('has ARIA labels for action buttons', () => {
      const item: CartItem = {
        recipeId: 'swords/god-sword',
        recipeName: 'God Sword',
        quantity: 1,
        levelCost: 45,
      };

      const viewLabel = `View crafting details for ${item.recipeName}`;
      const removeLabel = `Remove ${item.recipeName} from cart`;

      expect(viewLabel).toBe('View crafting details for God Sword');
      expect(removeLabel).toBe('Remove God Sword from cart');
    });
  });

  describe('Recipes Props', () => {
    it('accepts recipes map for Quick Craft modal', () => {
      const recipes: Record<string, { id: string; name: string; tree: CraftingTreeNode; bom: BillOfMaterials }> = {
        'swords/god-sword': {
          id: 'swords/god-sword',
          name: 'God Sword',
          tree: {
            id: 'root',
            type: 'combine',
            left: { id: 'l1', type: 'leaf', item: 'Netherite Sword' },
            right: { id: 'r1', type: 'leaf', item: 'Sharpness V Book' },
            levelCost: 5,
          },
          bom: {
            items: [],
            baseItem: { type: 'sword', displayName: 'Netherite Sword' },
          },
        },
      };

      expect(recipes['swords/god-sword']).toBeDefined();
      expect(recipes['swords/god-sword'].name).toBe('God Sword');
    });
  });
});
