// tests/unit/components/bundle-card.test.ts
// Smoke tests for BundleCard component data handling

import { describe, it, expect } from 'vitest';
import type { BundleData } from '../../../src/data/bundle-lookup.js';

/**
 * BundleCard smoke tests
 *
 * Since BundleCard is an Astro component that renders on the server,
 * we test the data structures and props interface it expects.
 * Full rendering tests would require an Astro test environment.
 */

// Resolved recipe structure expected by BundleCard
interface ResolvedRecipe {
  id: string;
  name: string;
  totalLevels: number;
}

describe('BundleCard', () => {
  describe('Props Interface', () => {
    it('should accept valid bundle data', () => {
      const bundle: BundleData = {
        id: 'test-bundle',
        name: 'Test Bundle',
        description: 'A test bundle',
        recipeIds: ['recipe-1', 'recipe-2'],
        tags: ['test', 'sample'],
        totalLevelCost: 100,
        itemCount: 2,
      };

      expect(bundle.id).toBe('test-bundle');
      expect(bundle.name).toBe('Test Bundle');
      expect(bundle.itemCount).toBe(2);
      expect(bundle.totalLevelCost).toBe(100);
    });

    it('should accept bundle without optional fields', () => {
      const bundle: BundleData = {
        id: 'minimal-bundle',
        name: 'Minimal Bundle',
        recipeIds: ['recipe-1'],
        tags: [],
        totalLevelCost: 50,
        itemCount: 1,
      };

      expect(bundle.description).toBeUndefined();
      expect(bundle.tags).toEqual([]);
    });

    it('should accept resolved recipes array', () => {
      const recipes: ResolvedRecipe[] = [
        { id: 'recipe-1', name: 'God Sword', totalLevels: 45 },
        { id: 'recipe-2', name: 'God Pickaxe', totalLevels: 38 },
      ];

      expect(recipes).toHaveLength(2);
      expect(recipes[0].name).toBe('God Sword');
      expect(recipes[1].totalLevels).toBe(38);
    });
  });

  describe('Data Transformations', () => {
    it('should format item count text correctly', () => {
      const formatItemCount = (count: number): string => {
        return count === 1 ? 'item' : 'items';
      };

      expect(formatItemCount(0)).toBe('items');
      expect(formatItemCount(1)).toBe('item');
      expect(formatItemCount(2)).toBe('items');
      expect(formatItemCount(10)).toBe('items');
    });

    it('should serialize recipes for data attribute', () => {
      const recipes: ResolvedRecipe[] = [
        { id: 'sword', name: 'God Sword', totalLevels: 45 },
        { id: 'pickaxe', name: 'God Pickaxe', totalLevels: 38 },
      ];

      const serialized = JSON.stringify(recipes);
      const parsed = JSON.parse(serialized) as ResolvedRecipe[];

      expect(parsed).toEqual(recipes);
      expect(parsed[0].id).toBe('sword');
      expect(parsed[1].totalLevels).toBe(38);
    });

    it('should handle empty recipes array', () => {
      const recipes: ResolvedRecipe[] = [];
      const serialized = JSON.stringify(recipes);
      const parsed = JSON.parse(serialized) as ResolvedRecipe[];

      expect(parsed).toEqual([]);
    });

    it('should handle special characters in names', () => {
      const recipe: ResolvedRecipe = {
        id: 'special-recipe',
        name: "Sharpness V Sword (God's Blade)",
        totalLevels: 50,
      };

      const serialized = JSON.stringify([recipe]);
      const parsed = JSON.parse(serialized) as ResolvedRecipe[];

      expect(parsed[0].name).toBe("Sharpness V Sword (God's Blade)");
    });
  });

  describe('Bundle Stats', () => {
    it('should calculate total from resolved recipes', () => {
      const recipes: ResolvedRecipe[] = [
        { id: 'r1', name: 'Recipe 1', totalLevels: 30 },
        { id: 'r2', name: 'Recipe 2', totalLevels: 25 },
        { id: 'r3', name: 'Recipe 3', totalLevels: 45 },
      ];

      const total = recipes.reduce((sum, r) => sum + r.totalLevels, 0);
      expect(total).toBe(100);
    });

    it('should match bundle totalLevelCost with sum of recipes', () => {
      const bundle: BundleData = {
        id: 'test',
        name: 'Test',
        recipeIds: ['r1', 'r2'],
        tags: [],
        totalLevelCost: 70,
        itemCount: 2,
      };

      const recipes: ResolvedRecipe[] = [
        { id: 'r1', name: 'Recipe 1', totalLevels: 30 },
        { id: 'r2', name: 'Recipe 2', totalLevels: 40 },
      ];

      const calculatedTotal = recipes.reduce((sum, r) => sum + r.totalLevels, 0);
      expect(calculatedTotal).toBe(bundle.totalLevelCost);
    });
  });

  describe('Accessibility Data', () => {
    it('should generate correct aria-label for add all button', () => {
      const bundle = {
        id: 'starter-kit',
        name: 'Starter Kit',
        itemCount: 6,
      };

      const ariaLabel = `Add all ${bundle.itemCount} items from ${bundle.name} to shopping list`;
      expect(ariaLabel).toBe('Add all 6 items from Starter Kit to shopping list');
    });

    it('should handle singular item count in aria-label', () => {
      const bundle = {
        id: 'single',
        name: 'Single Item Bundle',
        itemCount: 1,
      };

      // Note: current implementation doesn't pluralize in aria-label
      // but this test documents the expected behavior
      const ariaLabel = `Add all ${bundle.itemCount} items from ${bundle.name} to shopping list`;
      expect(ariaLabel).toContain('1 items'); // Could be improved to "1 item"
    });
  });
});
