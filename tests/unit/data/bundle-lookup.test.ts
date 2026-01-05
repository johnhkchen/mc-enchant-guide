/**
 * Unit tests for bundle-lookup module.
 *
 * Tests cover:
 * - Bundle lookup by ID
 * - Tag filtering
 * - Bundle recipes retrieval
 * - Computed properties (totalLevelCost, itemCount)
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { BundleFrontmatter } from '../../../src/types/index.js';
import type { RecipeData } from '../../../src/data/recipe-lookup.js';
import {
  getBundle,
  getAllBundles,
  getBundleRecipes,
  getBundleCount,
  getBundlesByTag,
  _resetCache,
  _loadTestData,
  _computeBundleFromFrontmatter,
  type BundleData,
} from '../../../src/data/bundle-lookup.js';
import {
  _loadTestData as loadRecipeTestData,
  _resetCache as resetRecipeCache,
} from '../../../src/data/recipe-lookup.js';

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

const testRecipes: RecipeData[] = [
  {
    id: 'swords/god-sword',
    name: 'God Sword',
    category: 'swords',
    baseItem: 'netherite_sword',
    tags: ['pve', 'pvp', 'general'],
    tree: {
      id: 'node_1',
      type: 'combine',
      left: { id: 'node_2', type: 'leaf', item: 'Netherite Sword', enchantments: [] },
      right: { id: 'node_3', type: 'leaf', item: 'Sharpness V Book', enchantments: ['Sharpness V'] },
      levelCost: 5,
      xpCost: 100,
      resultingPWP: 1,
      resultLabel: 'Netherite Sword',
      enchantments: ['Sharpness V'],
    },
    totalLevelCost: 25,
    totalXpCost: 500,
    totalXpCostBulk: 600,
    stepCount: 4,
  },
  {
    id: 'pickaxes/god-pickaxe',
    name: 'God Pickaxe',
    category: 'pickaxes',
    baseItem: 'netherite_pickaxe',
    tags: ['mining', 'general'],
    tree: {
      id: 'node_1',
      type: 'combine',
      left: { id: 'node_2', type: 'leaf', item: 'Netherite Pickaxe', enchantments: [] },
      right: { id: 'node_3', type: 'leaf', item: 'Efficiency V Book', enchantments: ['Efficiency V'] },
      levelCost: 5,
      xpCost: 100,
      resultingPWP: 1,
      resultLabel: 'Netherite Pickaxe',
      enchantments: ['Efficiency V'],
    },
    totalLevelCost: 22,
    totalXpCost: 450,
    totalXpCostBulk: 550,
    stepCount: 3,
  },
  {
    id: 'axes/god-axe',
    name: 'God Axe',
    category: 'axes',
    baseItem: 'netherite_axe',
    tags: ['combat', 'general'],
    tree: {
      id: 'node_1',
      type: 'combine',
      left: { id: 'node_2', type: 'leaf', item: 'Netherite Axe', enchantments: [] },
      right: { id: 'node_3', type: 'leaf', item: 'Efficiency V Book', enchantments: ['Efficiency V'] },
      levelCost: 5,
      xpCost: 100,
      resultingPWP: 1,
      resultLabel: 'Netherite Axe',
      enchantments: ['Efficiency V'],
    },
    totalLevelCost: 18,
    totalXpCost: 350,
    totalXpCostBulk: 450,
    stepCount: 3,
  },
];

const testBundles: BundleData[] = [
  {
    id: 'starter-kit',
    name: 'Starter Kit',
    description: 'Everything a new player needs',
    recipeIds: ['swords/god-sword', 'pickaxes/god-pickaxe', 'axes/god-axe'],
    tags: ['beginner', 'survival'],
    totalLevelCost: 65, // 25 + 22 + 18
    itemCount: 3,
  },
  {
    id: 'tool-set',
    name: 'Tool Set',
    description: 'Essential tools',
    recipeIds: ['pickaxes/god-pickaxe', 'axes/god-axe'],
    tags: ['tools', 'gathering'],
    totalLevelCost: 40, // 22 + 18
    itemCount: 2,
  },
  {
    id: 'combat-kit',
    name: 'Combat Kit',
    description: 'Battle-ready gear',
    recipeIds: ['swords/god-sword'],
    tags: ['combat', 'survival'],
    totalLevelCost: 25,
    itemCount: 1,
  },
];

// ─────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetCache();
  resetRecipeCache();
  loadRecipeTestData(testRecipes);
  _loadTestData(testBundles);
});

afterEach(() => {
  _resetCache();
  resetRecipeCache();
});

// ─────────────────────────────────────────────────────────────
// getBundle Tests
// ─────────────────────────────────────────────────────────────

describe('getBundle', () => {
  it('should return bundle by exact ID', () => {
    const bundle = getBundle('starter-kit');
    expect(bundle).toBeDefined();
    expect(bundle?.name).toBe('Starter Kit');
    expect(bundle?.id).toBe('starter-kit');
  });

  it('should return undefined for non-existent bundle', () => {
    const bundle = getBundle('non-existent-bundle');
    expect(bundle).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const bundle = getBundle('');
    expect(bundle).toBeUndefined();
  });

  it('should handle case-sensitive IDs', () => {
    const bundle = getBundle('Starter-Kit');
    expect(bundle).toBeUndefined();
  });

  it('should include computed properties', () => {
    const bundle = getBundle('starter-kit');
    expect(bundle?.totalLevelCost).toBe(65);
    expect(bundle?.itemCount).toBe(3);
  });

  it('should include description', () => {
    const bundle = getBundle('starter-kit');
    expect(bundle?.description).toBe('Everything a new player needs');
  });

  it('should include recipeIds array', () => {
    const bundle = getBundle('starter-kit');
    expect(bundle?.recipeIds).toHaveLength(3);
    expect(bundle?.recipeIds).toContain('swords/god-sword');
    expect(bundle?.recipeIds).toContain('pickaxes/god-pickaxe');
    expect(bundle?.recipeIds).toContain('axes/god-axe');
  });

  it('should include tags array', () => {
    const bundle = getBundle('starter-kit');
    expect(bundle?.tags).toContain('beginner');
    expect(bundle?.tags).toContain('survival');
  });
});

// ─────────────────────────────────────────────────────────────
// getAllBundles Tests
// ─────────────────────────────────────────────────────────────

describe('getAllBundles', () => {
  it('should return all loaded bundles', () => {
    const bundles = getAllBundles();
    expect(bundles).toHaveLength(3);
  });

  it('should return a copy (not a reference)', () => {
    const bundles1 = getAllBundles();
    const bundles2 = getAllBundles();
    expect(bundles1).not.toBe(bundles2);
    expect(bundles1).toEqual(bundles2);
  });

  it('should return empty array when no bundles loaded', () => {
    _loadTestData([]);
    const bundles = getAllBundles();
    expect(bundles).toHaveLength(0);
    expect(bundles).toEqual([]);
  });

  it('should include all bundle properties', () => {
    const bundles = getAllBundles();
    for (const bundle of bundles) {
      expect(bundle).toHaveProperty('id');
      expect(bundle).toHaveProperty('name');
      expect(bundle).toHaveProperty('recipeIds');
      expect(bundle).toHaveProperty('tags');
      expect(bundle).toHaveProperty('totalLevelCost');
      expect(bundle).toHaveProperty('itemCount');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// getBundleRecipes Tests
// ─────────────────────────────────────────────────────────────

describe('getBundleRecipes', () => {
  it('should return all recipes in a bundle', () => {
    const recipes = getBundleRecipes('starter-kit');
    expect(recipes).toHaveLength(3);
  });

  it('should return recipe data objects', () => {
    const recipes = getBundleRecipes('starter-kit');
    for (const recipe of recipes) {
      expect(recipe).toHaveProperty('id');
      expect(recipe).toHaveProperty('name');
      expect(recipe).toHaveProperty('category');
      expect(recipe).toHaveProperty('tree');
      expect(recipe).toHaveProperty('totalLevelCost');
    }
  });

  it('should return correct recipes for bundle', () => {
    const recipes = getBundleRecipes('tool-set');
    expect(recipes).toHaveLength(2);
    const ids = recipes.map(r => r.id);
    expect(ids).toContain('pickaxes/god-pickaxe');
    expect(ids).toContain('axes/god-axe');
  });

  it('should return empty array for non-existent bundle', () => {
    const recipes = getBundleRecipes('non-existent');
    expect(recipes).toHaveLength(0);
    expect(recipes).toEqual([]);
  });

  it('should return empty array for bundle with non-existent recipes', () => {
    _loadTestData([{
      id: 'broken-bundle',
      name: 'Broken Bundle',
      recipeIds: ['non-existent/recipe'],
      tags: [],
      totalLevelCost: 0,
      itemCount: 0,
    }]);
    const recipes = getBundleRecipes('broken-bundle');
    expect(recipes).toHaveLength(0);
  });

  it('should preserve recipe order', () => {
    const recipes = getBundleRecipes('starter-kit');
    expect(recipes[0].id).toBe('swords/god-sword');
    expect(recipes[1].id).toBe('pickaxes/god-pickaxe');
    expect(recipes[2].id).toBe('axes/god-axe');
  });
});

// ─────────────────────────────────────────────────────────────
// getBundleCount Tests
// ─────────────────────────────────────────────────────────────

describe('getBundleCount', () => {
  it('should return correct count', () => {
    expect(getBundleCount()).toBe(3);
  });

  it('should return 0 for empty data', () => {
    _loadTestData([]);
    expect(getBundleCount()).toBe(0);
  });

  it('should update after loading new data', () => {
    expect(getBundleCount()).toBe(3);
    _loadTestData([testBundles[0]]);
    expect(getBundleCount()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// getBundlesByTag Tests
// ─────────────────────────────────────────────────────────────

describe('getBundlesByTag', () => {
  it('should return bundles with matching tag', () => {
    const bundles = getBundlesByTag('survival');
    expect(bundles).toHaveLength(2);
    expect(bundles.map(b => b.id)).toContain('starter-kit');
    expect(bundles.map(b => b.id)).toContain('combat-kit');
  });

  it('should return single bundle for unique tag', () => {
    const bundles = getBundlesByTag('beginner');
    expect(bundles).toHaveLength(1);
    expect(bundles[0].id).toBe('starter-kit');
  });

  it('should return empty array for non-existent tag', () => {
    const bundles = getBundlesByTag('non-existent-tag');
    expect(bundles).toHaveLength(0);
  });

  it('should be case-sensitive', () => {
    const bundles = getBundlesByTag('Survival');
    expect(bundles).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// _computeBundleFromFrontmatter Tests
// ─────────────────────────────────────────────────────────────

describe('_computeBundleFromFrontmatter', () => {
  it('should compute bundle from frontmatter', () => {
    const fm: BundleFrontmatter = {
      name: 'Test Bundle',
      description: 'A test bundle',
      recipes: ['swords/god-sword', 'pickaxes/god-pickaxe'],
      tags: ['test'],
    };

    const bundle = _computeBundleFromFrontmatter('test-bundle', fm);
    expect(bundle.id).toBe('test-bundle');
    expect(bundle.name).toBe('Test Bundle');
    expect(bundle.description).toBe('A test bundle');
    expect(bundle.recipeIds).toEqual(['swords/god-sword', 'pickaxes/god-pickaxe']);
    expect(bundle.tags).toEqual(['test']);
  });

  it('should calculate totalLevelCost from recipes', () => {
    const fm: BundleFrontmatter = {
      name: 'Cost Test',
      recipes: ['swords/god-sword', 'pickaxes/god-pickaxe'],
    };

    const bundle = _computeBundleFromFrontmatter('cost-test', fm);
    expect(bundle.totalLevelCost).toBe(47); // 25 + 22
    expect(bundle.itemCount).toBe(2);
  });

  it('should handle empty recipes array', () => {
    const fm: BundleFrontmatter = {
      name: 'Empty Bundle',
      recipes: [],
    };

    const bundle = _computeBundleFromFrontmatter('empty', fm);
    expect(bundle.totalLevelCost).toBe(0);
    expect(bundle.itemCount).toBe(0);
  });

  it('should handle missing recipes gracefully', () => {
    const fm: BundleFrontmatter = {
      name: 'Missing Recipes',
      recipes: ['swords/god-sword', 'non-existent/recipe'],
    };

    const bundle = _computeBundleFromFrontmatter('missing', fm);
    expect(bundle.totalLevelCost).toBe(25); // Only god-sword counted
    expect(bundle.itemCount).toBe(1); // Only god-sword counted
  });

  it('should default tags to empty array', () => {
    const fm: BundleFrontmatter = {
      name: 'No Tags',
      recipes: [],
    };

    const bundle = _computeBundleFromFrontmatter('no-tags', fm);
    expect(bundle.tags).toEqual([]);
  });

  it('should handle undefined description', () => {
    const fm: BundleFrontmatter = {
      name: 'No Description',
      recipes: [],
    };

    const bundle = _computeBundleFromFrontmatter('no-desc', fm);
    expect(bundle.description).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// Edge Cases
// ─────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('should handle bundle with all recipes missing', () => {
    _loadTestData([{
      id: 'all-missing',
      name: 'All Missing',
      recipeIds: ['fake/recipe-1', 'fake/recipe-2'],
      tags: [],
      totalLevelCost: 0,
      itemCount: 0,
    }]);

    const recipes = getBundleRecipes('all-missing');
    expect(recipes).toHaveLength(0);
  });

  it('should handle duplicate recipe references in bundle', () => {
    const fm: BundleFrontmatter = {
      name: 'Duplicate Recipes',
      recipes: ['swords/god-sword', 'swords/god-sword'],
    };

    const bundle = _computeBundleFromFrontmatter('dupe', fm);
    expect(bundle.recipeIds).toHaveLength(2);
    expect(bundle.totalLevelCost).toBe(50); // 25 + 25
    expect(bundle.itemCount).toBe(2);
  });

  it('should maintain cache across multiple calls', () => {
    const bundle1 = getBundle('starter-kit');
    const bundle2 = getBundle('starter-kit');
    expect(bundle1).toEqual(bundle2);
  });

  it('should reset properly with _resetCache', () => {
    expect(getBundleCount()).toBe(3);
    _resetCache();
    // After reset, will reload from files (empty in test environment)
    // Since we're using _loadTestData, need to reload
    _loadTestData([]);
    expect(getBundleCount()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Computed Properties Tests
// ─────────────────────────────────────────────────────────────

describe('computed properties', () => {
  it('should calculate correct totalLevelCost for starter-kit', () => {
    const bundle = getBundle('starter-kit');
    // 25 (god-sword) + 22 (god-pickaxe) + 18 (god-axe) = 65
    expect(bundle?.totalLevelCost).toBe(65);
  });

  it('should calculate correct itemCount for tool-set', () => {
    const bundle = getBundle('tool-set');
    expect(bundle?.itemCount).toBe(2);
  });

  it('should calculate correct values for single-recipe bundle', () => {
    const bundle = getBundle('combat-kit');
    expect(bundle?.totalLevelCost).toBe(25);
    expect(bundle?.itemCount).toBe(1);
  });
});
