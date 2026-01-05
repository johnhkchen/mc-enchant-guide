// tests/unit/stores/cart.test.ts
// Unit tests for shopping cart store

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'solid-js';

const STORAGE_KEY = 'mc-enchant:cart';

// We need to dynamically import the store module to reset it for each test
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cartModule: any;

async function importFreshCartModule() {
  // Clear module cache to get fresh instance
  vi.resetModules();
  cartModule = await import('../../../src/stores/cart.js');
}

describe('Cart Store', () => {
  beforeEach(async () => {
    localStorage.clear();
    await importFreshCartModule();
  });

  describe('Initial State', () => {
    it('starts with empty cart when no localStorage data', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        expect(store.items()).toEqual([]);
        expect(store.isEmpty()).toBe(true);
        expect(store.totalItems()).toBe(0);
        expect(store.totalLevels()).toBe(0);
        dispose();
      });
    });

    it('loads existing items from localStorage on init', async () => {
      const storedData = {
        items: [
          { recipeId: 'swords/god-sword', recipeName: 'God Sword', quantity: 2, levelCost: 45 },
        ],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      await importFreshCartModule();

      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        expect(store.items()).toHaveLength(1);
        expect(store.items()[0]).toEqual({
          recipeId: 'swords/god-sword',
          recipeName: 'God Sword',
          quantity: 2,
          levelCost: 45,
        });
        dispose();
      });
    });
  });

  describe('add()', () => {
    it('adds new item to empty cart', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        expect(store.items()).toHaveLength(1);
        expect(store.items()[0]).toEqual({
          recipeId: 'swords/basic',
          recipeName: 'Basic Sword',
          quantity: 1,
          levelCost: 10,
        });
        dispose();
      });
    });

    it('increments quantity when adding same item twice', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        expect(store.items()).toHaveLength(1);
        expect(store.items()[0].quantity).toBe(2);
        dispose();
      });
    });

    it('adds multiple different items', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.add({ id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 });

        expect(store.items()).toHaveLength(2);
        dispose();
      });
    });
  });

  describe('addBundle()', () => {
    it('adds multiple recipes at once', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.addBundle([
          { id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 },
          { id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 },
          { id: 'axes/lumber', name: 'Lumber Axe', totalLevels: 12 },
        ]);

        expect(store.items()).toHaveLength(3);
        expect(store.totalItems()).toBe(3);
        dispose();
      });
    });

    it('increments quantities for duplicate recipes in bundle', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.addBundle([
          { id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 },
          { id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 },
        ]);

        expect(store.items()).toHaveLength(1);
        expect(store.items()[0].quantity).toBe(2);
        dispose();
      });
    });

    it('handles empty bundle', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.addBundle([]);
        expect(store.items()).toHaveLength(0);
        dispose();
      });
    });
  });

  describe('remove()', () => {
    it('removes item from cart', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.add({ id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 });

        store.remove('swords/basic');

        expect(store.items()).toHaveLength(1);
        expect(store.items()[0].recipeId).toBe('pickaxes/miner');
        dispose();
      });
    });

    it('handles removing non-existent item gracefully', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        store.remove('non-existent');

        expect(store.items()).toHaveLength(1);
        dispose();
      });
    });

    it('removes item with multiple quantity entirely', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        expect(store.items()[0].quantity).toBe(2);

        store.remove('swords/basic');

        expect(store.items()).toHaveLength(0);
        dispose();
      });
    });
  });

  describe('updateQuantity()', () => {
    it('updates quantity of existing item', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        store.updateQuantity('swords/basic', 5);

        expect(store.items()[0].quantity).toBe(5);
        dispose();
      });
    });

    it('removes item when quantity set to 0', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        store.updateQuantity('swords/basic', 0);

        expect(store.items()).toHaveLength(0);
        dispose();
      });
    });

    it('removes item when quantity set to negative', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        store.updateQuantity('swords/basic', -1);

        expect(store.items()).toHaveLength(0);
        dispose();
      });
    });

    it('handles updating non-existent item gracefully', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.updateQuantity('non-existent', 5);
        expect(store.items()).toHaveLength(0);
        dispose();
      });
    });
  });

  describe('clear()', () => {
    it('empties the cart', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.add({ id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 });

        store.clear();

        expect(store.items()).toHaveLength(0);
        expect(store.isEmpty()).toBe(true);
        dispose();
      });
    });

    it('works on already empty cart', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.clear();
        expect(store.items()).toHaveLength(0);
        dispose();
      });
    });
  });

  describe('Derived Signals', () => {
    describe('totalLevels()', () => {
      it('calculates sum of (levelCost × quantity)', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
          store.add({ id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 });

          // 10 * 1 + 15 * 1 = 25
          expect(store.totalLevels()).toBe(25);
          dispose();
        });
      });

      it('accounts for quantities', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
          store.updateQuantity('swords/basic', 3);

          // 10 * 3 = 30
          expect(store.totalLevels()).toBe(30);
          dispose();
        });
      });

      it('returns 0 for empty cart', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          expect(store.totalLevels()).toBe(0);
          dispose();
        });
      });
    });

    describe('totalItems()', () => {
      it('sums all quantities', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
          store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
          store.add({ id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 });

          // 2 + 1 = 3
          expect(store.totalItems()).toBe(3);
          dispose();
        });
      });

      it('returns 0 for empty cart', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          expect(store.totalItems()).toBe(0);
          dispose();
        });
      });
    });

    describe('isEmpty()', () => {
      it('returns true for empty cart', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          expect(store.isEmpty()).toBe(true);
          dispose();
        });
      });

      it('returns false when cart has items', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
          expect(store.isEmpty()).toBe(false);
          dispose();
        });
      });

      it('returns true after clearing cart', () => {
        createRoot((dispose) => {
          const store = cartModule.createCartStore();
          store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
          store.clear();
          expect(store.isEmpty()).toBe(true);
          dispose();
        });
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('saves to localStorage on add', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });

        // Effect runs synchronously
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        expect(stored.items).toHaveLength(1);
        expect(stored.items[0].recipeId).toBe('swords/basic');
        dispose();
      });
    });

    it('saves to localStorage on remove', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.add({ id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 });
        store.remove('swords/basic');

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        expect(stored.items).toHaveLength(1);
        expect(stored.items[0].recipeId).toBe('pickaxes/miner');
        dispose();
      });
    });

    it('saves to localStorage on quantity update', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.updateQuantity('swords/basic', 5);

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        expect(stored.items[0].quantity).toBe(5);
        dispose();
      });
    });

    it('saves to localStorage on clear', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        store.clear();

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        expect(stored.items).toHaveLength(0);
        dispose();
      });
    });

    it('handles corrupted localStorage data gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json {{{');
      await importFreshCartModule();

      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        expect(store.items()).toEqual([]);
        dispose();
      });
    });

    it('handles missing items array in localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
      await importFreshCartModule();

      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        expect(store.items()).toEqual([]);
        dispose();
      });
    });

    it('filters out invalid items from localStorage', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items: [
            { recipeId: 'valid', recipeName: 'Valid', quantity: 1, levelCost: 10 },
            { recipeId: 'invalid' }, // missing fields
            { recipeId: 'bad-qty', recipeName: 'Bad', quantity: 0, levelCost: 10 }, // zero qty
            null,
            'string item',
          ],
        })
      );
      await importFreshCartModule();

      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        expect(store.items()).toHaveLength(1);
        expect(store.items()[0].recipeId).toBe('valid');
        dispose();
      });
    });

    it('handles negative levelCost gracefully', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items: [
            { recipeId: 'bad', recipeName: 'Bad', quantity: 1, levelCost: -5 },
          ],
        })
      );
      await importFreshCartModule();

      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        expect(store.items()).toHaveLength(0);
        dispose();
      });
    });
  });

  describe('SSR Safety', () => {
    it('handles missing window/localStorage gracefully', async () => {
      // Save original
      const originalLocalStorage = globalThis.localStorage;

      // Simulate SSR environment
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
      });

      await importFreshCartModule();

      createRoot((dispose) => {
        const store = cartModule.createCartStore();
        // Should work without errors
        expect(store.items()).toEqual([]);
        store.add({ id: 'test', name: 'Test', totalLevels: 10 });
        expect(store.items()).toHaveLength(1);
        dispose();
      });

      // Restore
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });
  });

  describe('Singleton Export', () => {
    it('exports cartStore singleton', () => {
      expect(cartModule.cartStore).toBeDefined();
      expect(typeof cartModule.cartStore.add).toBe('function');
      expect(typeof cartModule.cartStore.items).toBe('function');
    });

    it('exports individual functions', () => {
      expect(typeof cartModule.add).toBe('function');
      expect(typeof cartModule.addBundle).toBe('function');
      expect(typeof cartModule.remove).toBe('function');
      expect(typeof cartModule.updateQuantity).toBe('function');
      expect(typeof cartModule.clear).toBe('function');
      expect(typeof cartModule.items).toBe('function');
      expect(typeof cartModule.totalLevels).toBe('function');
      expect(typeof cartModule.totalItems).toBe('function');
      expect(typeof cartModule.isEmpty).toBe('function');
    });

    it('exports createCartStore factory', () => {
      expect(typeof cartModule.createCartStore).toBe('function');
    });
  });

  describe('Reactivity', () => {
    it('derived signals update when items change', () => {
      createRoot((dispose) => {
        const store = cartModule.createCartStore();

        // Initially empty
        expect(store.totalLevels()).toBe(0);

        store.add({ id: 'swords/basic', name: 'Basic Sword', totalLevels: 10 });
        expect(store.totalLevels()).toBe(10);

        store.add({ id: 'pickaxes/miner', name: 'Miner Pick', totalLevels: 15 });
        expect(store.totalLevels()).toBe(25);

        dispose();
      });
    });
  });
});
