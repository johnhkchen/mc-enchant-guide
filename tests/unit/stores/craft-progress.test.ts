// tests/unit/stores/craft-progress.test.ts
// Unit tests for craft progress store

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'solid-js';

const STORAGE_KEY = 'mc-enchant:progress';

// We need to dynamically import the store module to reset it for each test
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let progressModule: any;

async function importFreshProgressModule() {
  // Clear module cache to get fresh instance
  vi.resetModules();
  progressModule = await import('../../../src/stores/craft-progress.js');
}

describe('Craft Progress Store', () => {
  beforeEach(async () => {
    localStorage.clear();
    await importFreshProgressModule();
  });

  describe('Initial State', () => {
    it('starts with empty progress when no localStorage data', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.progress()).toEqual({});
        expect(store.getProgress('any-recipe')).toEqual([]);
        dispose();
      });
    });

    it('loads existing progress from localStorage on init', async () => {
      const storedData = {
        'swords/god-sword': ['node_1', 'node_2'],
        'pickaxes/fortune-pick': ['node_1'],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.getProgress('swords/god-sword')).toEqual(['node_1', 'node_2']);
        expect(store.getProgress('pickaxes/fortune-pick')).toEqual(['node_1']);
        dispose();
      });
    });
  });

  describe('getProgress()', () => {
    it('returns empty array for unknown recipe', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.getProgress('non-existent-recipe')).toEqual([]);
        dispose();
      });
    });

    it('returns completed node IDs for known recipe', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');
        store.toggleNode('recipe-1', 'node_b');

        expect(store.getProgress('recipe-1')).toEqual(['node_a', 'node_b']);
        dispose();
      });
    });
  });

  describe('toggleNode()', () => {
    it('adds node to completed list when toggled on', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('swords/god-sword', 'node_1');

        expect(store.getProgress('swords/god-sword')).toEqual(['node_1']);
        expect(store.isCompleted('swords/god-sword', 'node_1')).toBe(true);
        dispose();
      });
    });

    it('removes node from completed list when toggled off', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('swords/god-sword', 'node_1');
        store.toggleNode('swords/god-sword', 'node_2');

        // Toggle off node_1
        store.toggleNode('swords/god-sword', 'node_1');

        expect(store.getProgress('swords/god-sword')).toEqual(['node_2']);
        expect(store.isCompleted('swords/god-sword', 'node_1')).toBe(false);
        dispose();
      });
    });

    it('removes recipe entry when all nodes are toggled off', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('swords/god-sword', 'node_1');

        // Toggle off the only node
        store.toggleNode('swords/god-sword', 'node_1');

        expect(store.progress()).toEqual({});
        expect(store.getProgress('swords/god-sword')).toEqual([]);
        dispose();
      });
    });

    it('handles multiple recipes independently', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');
        store.toggleNode('recipe-2', 'node_b');
        store.toggleNode('recipe-1', 'node_c');

        expect(store.getProgress('recipe-1')).toEqual(['node_a', 'node_c']);
        expect(store.getProgress('recipe-2')).toEqual(['node_b']);
        dispose();
      });
    });
  });

  describe('isCompleted()', () => {
    it('returns false for uncompleted node', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.isCompleted('recipe', 'node_1')).toBe(false);
        dispose();
      });
    });

    it('returns true for completed node', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        expect(store.isCompleted('recipe', 'node_1')).toBe(true);
        dispose();
      });
    });

    it('returns false after node is toggled off', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        store.toggleNode('recipe', 'node_1');
        expect(store.isCompleted('recipe', 'node_1')).toBe(false);
        dispose();
      });
    });

    it('returns false for unknown recipe', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.isCompleted('unknown', 'node_1')).toBe(false);
        dispose();
      });
    });
  });

  describe('reset()', () => {
    it('clears progress for specific recipe', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');
        store.toggleNode('recipe-1', 'node_b');
        store.toggleNode('recipe-2', 'node_c');

        store.reset('recipe-1');

        expect(store.getProgress('recipe-1')).toEqual([]);
        expect(store.getProgress('recipe-2')).toEqual(['node_c']);
        dispose();
      });
    });

    it('does not affect other recipes', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');
        store.toggleNode('recipe-2', 'node_b');
        store.toggleNode('recipe-3', 'node_c');

        store.reset('recipe-2');

        expect(store.getProgress('recipe-1')).toEqual(['node_a']);
        expect(store.getProgress('recipe-2')).toEqual([]);
        expect(store.getProgress('recipe-3')).toEqual(['node_c']);
        dispose();
      });
    });

    it('handles resetting unknown recipe gracefully', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');

        // Should not throw
        store.reset('non-existent');

        expect(store.getProgress('recipe-1')).toEqual(['node_a']);
        dispose();
      });
    });
  });

  describe('resetAll()', () => {
    it('clears all progress', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');
        store.toggleNode('recipe-2', 'node_b');
        store.toggleNode('recipe-3', 'node_c');

        store.resetAll();

        expect(store.progress()).toEqual({});
        expect(store.getProgress('recipe-1')).toEqual([]);
        expect(store.getProgress('recipe-2')).toEqual([]);
        expect(store.getProgress('recipe-3')).toEqual([]);
        dispose();
      });
    });

    it('works on empty progress', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.resetAll();
        expect(store.progress()).toEqual({});
        dispose();
      });
    });
  });

  describe('getCompletionPercent()', () => {
    it('returns 0 for empty progress', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.getCompletionPercent('recipe', 5)).toBe(0);
        dispose();
      });
    });

    it('calculates correct percentage', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        store.toggleNode('recipe', 'node_2');

        expect(store.getCompletionPercent('recipe', 4)).toBe(50);
        dispose();
      });
    });

    it('returns 100 for fully completed recipe', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        store.toggleNode('recipe', 'node_2');
        store.toggleNode('recipe', 'node_3');

        expect(store.getCompletionPercent('recipe', 3)).toBe(100);
        dispose();
      });
    });

    it('rounds to nearest integer', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');

        // 1/3 = 33.33...%
        expect(store.getCompletionPercent('recipe', 3)).toBe(33);
        dispose();
      });
    });

    it('returns 0 when totalNodes is 0', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.getCompletionPercent('recipe', 0)).toBe(0);
        dispose();
      });
    });

    it('returns 0 when totalNodes is negative', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.getCompletionPercent('recipe', -5)).toBe(0);
        dispose();
      });
    });
  });

  describe('isRecipeComplete()', () => {
    it('returns false for incomplete recipe', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        store.toggleNode('recipe', 'node_2');

        expect(store.isRecipeComplete('recipe', 5)).toBe(false);
        dispose();
      });
    });

    it('returns true when all nodes are completed', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        store.toggleNode('recipe', 'node_2');
        store.toggleNode('recipe', 'node_3');

        expect(store.isRecipeComplete('recipe', 3)).toBe(true);
        dispose();
      });
    });

    it('returns true when more nodes completed than totalNodes', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        store.toggleNode('recipe', 'node_2');
        store.toggleNode('recipe', 'node_3');

        // Should still be true even if totalNodes is less
        expect(store.isRecipeComplete('recipe', 2)).toBe(true);
        dispose();
      });
    });

    it('returns false when totalNodes is 0', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.isRecipeComplete('recipe', 0)).toBe(false);
        dispose();
      });
    });

    it('returns false when totalNodes is negative', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.isRecipeComplete('recipe', -1)).toBe(false);
        dispose();
      });
    });

    it('returns false for unknown recipe', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.isRecipeComplete('unknown', 5)).toBe(false);
        dispose();
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('saves to localStorage on toggleNode', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        expect(stored['recipe']).toEqual(['node_1']);
        dispose();
      });
    });

    it('saves to localStorage on reset', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');
        store.toggleNode('recipe-2', 'node_b');
        store.reset('recipe-1');

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        expect(stored['recipe-1']).toBeUndefined();
        expect(stored['recipe-2']).toEqual(['node_b']);
        dispose();
      });
    });

    it('saves to localStorage on resetAll', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe', 'node_1');
        store.resetAll();

        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        expect(stored).toEqual({});
        dispose();
      });
    });

    it('handles corrupted localStorage data gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json {{{');
      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.progress()).toEqual({});
        dispose();
      });
    });

    it('handles non-object localStorage data gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('just a string'));
      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.progress()).toEqual({});
        dispose();
      });
    });

    it('handles array localStorage data gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['item1', 'item2']));
      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.progress()).toEqual({});
        dispose();
      });
    });

    it('handles null localStorage data gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(null));
      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.progress()).toEqual({});
        dispose();
      });
    });

    it('filters out invalid node IDs from localStorage', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          'recipe-1': ['valid_node', 123, null, { obj: true }],
          'recipe-2': 'not an array',
          'recipe-3': ['valid_only'],
        })
      );
      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.getProgress('recipe-1')).toEqual(['valid_node']);
        expect(store.getProgress('recipe-2')).toEqual([]);
        expect(store.getProgress('recipe-3')).toEqual(['valid_only']);
        dispose();
      });
    });

    it('removes recipes with empty arrays after filtering', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          'recipe-1': [123, null], // All invalid
        })
      );
      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        expect(store.progress()).toEqual({});
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

      await importFreshProgressModule();

      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        // Should work without errors
        expect(store.progress()).toEqual({});
        store.toggleNode('recipe', 'node_1');
        expect(store.getProgress('recipe')).toEqual(['node_1']);
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
    it('exports craftProgressStore singleton', () => {
      expect(progressModule.craftProgressStore).toBeDefined();
      expect(typeof progressModule.craftProgressStore.toggleNode).toBe('function');
      expect(typeof progressModule.craftProgressStore.progress).toBe('function');
    });

    it('exports individual functions', () => {
      expect(typeof progressModule.progress).toBe('function');
      expect(typeof progressModule.getProgress).toBe('function');
      expect(typeof progressModule.toggleNode).toBe('function');
      expect(typeof progressModule.reset).toBe('function');
      expect(typeof progressModule.resetAll).toBe('function');
      expect(typeof progressModule.isCompleted).toBe('function');
      expect(typeof progressModule.getCompletionPercent).toBe('function');
      expect(typeof progressModule.isRecipeComplete).toBe('function');
    });

    it('exports createCraftProgressStore factory', () => {
      expect(typeof progressModule.createCraftProgressStore).toBe('function');
    });
  });

  describe('Reactivity', () => {
    it('progress signal updates when nodes are toggled', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();

        // Initially empty
        expect(store.progress()).toEqual({});

        store.toggleNode('recipe', 'node_1');
        expect(store.progress()).toEqual({ recipe: ['node_1'] });

        store.toggleNode('recipe', 'node_2');
        expect(store.progress()).toEqual({ recipe: ['node_1', 'node_2'] });

        dispose();
      });
    });

    it('progress signal updates on reset', () => {
      createRoot((dispose) => {
        const store = progressModule.createCraftProgressStore();
        store.toggleNode('recipe-1', 'node_a');
        store.toggleNode('recipe-2', 'node_b');

        store.reset('recipe-1');

        expect(store.progress()).toEqual({ 'recipe-2': ['node_b'] });
        dispose();
      });
    });
  });
});
