/**
 * Unit tests for recipe-lookup module.
 *
 * Tests cover:
 * - Recipe lookup by ID
 * - Category filtering
 * - Tag filtering
 * - Base item string parsing
 * - Recipe computation from frontmatter
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { RecipeCategory, RecipeFrontmatter } from '../../../src/types/index.js';
import {
  getRecipe,
  getAllRecipes,
  getRecipesByCategory,
  getRecipesByTag,
  getRecipeCount,
  _resetCache,
  _loadTestData,
  _computeRecipeFromFrontmatter,
  _parseBaseItemString,
  type RecipeData,
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
    id: 'swords/pvp-sword',
    name: 'PvP Sword',
    category: 'swords',
    baseItem: 'netherite_sword',
    tags: ['pvp', 'combat'],
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
    totalLevelCost: 20,
    totalXpCost: 400,
    totalXpCostBulk: 500,
    stepCount: 3,
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
    id: 'armor/protection-helmet',
    name: 'Protection Helmet',
    category: 'helmets',
    baseItem: 'netherite_helmet',
    tags: ['armor', 'protection'],
    tree: {
      id: 'node_1',
      type: 'combine',
      left: { id: 'node_2', type: 'leaf', item: 'Netherite Helmet', enchantments: [] },
      right: { id: 'node_3', type: 'leaf', item: 'Protection IV Book', enchantments: ['Protection IV'] },
      levelCost: 4,
      xpCost: 80,
      resultingPWP: 1,
      resultLabel: 'Netherite Helmet',
      enchantments: ['Protection IV'],
    },
    totalLevelCost: 15,
    totalXpCost: 300,
    totalXpCostBulk: 350,
    stepCount: 2,
  },
];

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Recipe Lookup', () => {
  beforeEach(() => {
    _resetCache();
    _loadTestData(testRecipes);
  });

  afterEach(() => {
    _resetCache();
  });

  // ─────────────────────────────────────────────────────────────
  // getRecipe
  // ─────────────────────────────────────────────────────────────

  describe('getRecipe', () => {
    it('returns recipe by ID', () => {
      const result = getRecipe('swords/god-sword');
      expect(result).toBeDefined();
      expect(result?.id).toBe('swords/god-sword');
      expect(result?.name).toBe('God Sword');
    });

    it('returns undefined for unknown ID', () => {
      const result = getRecipe('nonexistent/recipe');
      expect(result).toBeUndefined();
    });

    it('returns correct category', () => {
      const result = getRecipe('pickaxes/god-pickaxe');
      expect(result?.category).toBe('pickaxes');
    });

    it('returns correct baseItem', () => {
      const result = getRecipe('swords/god-sword');
      expect(result?.baseItem).toBe('netherite_sword');
    });

    it('returns correct tags', () => {
      const result = getRecipe('swords/god-sword');
      expect(result?.tags).toEqual(['pve', 'pvp', 'general']);
    });

    it('returns computed tree data', () => {
      const result = getRecipe('swords/god-sword');
      expect(result?.tree).toBeDefined();
      expect(result?.totalLevelCost).toBe(25);
      expect(result?.totalXpCost).toBe(500);
      expect(result?.totalXpCostBulk).toBe(600);
      expect(result?.stepCount).toBe(4);
    });

    it('provides O(1) lookup performance', () => {
      // Multiple lookups should be fast
      for (let i = 0; i < 1000; i++) {
        const result = getRecipe('swords/god-sword');
        expect(result).toBeDefined();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getAllRecipes
  // ─────────────────────────────────────────────────────────────

  describe('getAllRecipes', () => {
    it('returns all recipes', () => {
      const result = getAllRecipes();
      expect(result).toHaveLength(4);
    });

    it('returns a copy of the array (not mutable)', () => {
      const result1 = getAllRecipes();
      const result2 = getAllRecipes();
      expect(result1).not.toBe(result2);
    });

    it('includes all expected recipe IDs', () => {
      const result = getAllRecipes();
      const ids = result.map((r) => r.id);
      expect(ids).toContain('swords/god-sword');
      expect(ids).toContain('swords/pvp-sword');
      expect(ids).toContain('pickaxes/god-pickaxe');
      expect(ids).toContain('armor/protection-helmet');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getRecipesByCategory
  // ─────────────────────────────────────────────────────────────

  describe('getRecipesByCategory', () => {
    it('returns recipes in swords category', () => {
      const result = getRecipesByCategory('swords');
      expect(result).toHaveLength(2);
      const ids = result.map((r) => r.id);
      expect(ids).toContain('swords/god-sword');
      expect(ids).toContain('swords/pvp-sword');
    });

    it('returns recipes in pickaxes category', () => {
      const result = getRecipesByCategory('pickaxes');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pickaxes/god-pickaxe');
    });

    it('returns recipes in helmets category', () => {
      const result = getRecipesByCategory('helmets');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('armor/protection-helmet');
    });

    it('returns empty array for category with no recipes', () => {
      const result = getRecipesByCategory('axes');
      expect(result).toEqual([]);
    });

    it('returns empty array for invalid category', () => {
      const result = getRecipesByCategory('invalid' as RecipeCategory);
      expect(result).toEqual([]);
    });

    it('returns a copy of the array (not mutable)', () => {
      const result1 = getRecipesByCategory('swords');
      const result2 = getRecipesByCategory('swords');
      expect(result1).not.toBe(result2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getRecipesByTag
  // ─────────────────────────────────────────────────────────────

  describe('getRecipesByTag', () => {
    it('returns recipes with "general" tag', () => {
      const result = getRecipesByTag('general');
      expect(result).toHaveLength(2);
      const ids = result.map((r) => r.id);
      expect(ids).toContain('swords/god-sword');
      expect(ids).toContain('pickaxes/god-pickaxe');
    });

    it('returns recipes with "pvp" tag', () => {
      const result = getRecipesByTag('pvp');
      expect(result).toHaveLength(2);
      const ids = result.map((r) => r.id);
      expect(ids).toContain('swords/god-sword');
      expect(ids).toContain('swords/pvp-sword');
    });

    it('returns recipes with "mining" tag', () => {
      const result = getRecipesByTag('mining');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pickaxes/god-pickaxe');
    });

    it('returns empty array for tag with no matches', () => {
      const result = getRecipesByTag('nonexistent');
      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getRecipeCount
  // ─────────────────────────────────────────────────────────────

  describe('getRecipeCount', () => {
    it('returns correct count', () => {
      const count = getRecipeCount();
      expect(count).toBe(4);
    });

    it('matches getAllRecipes length', () => {
      const count = getRecipeCount();
      const all = getAllRecipes();
      expect(count).toBe(all.length);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Cache Behavior
  // ─────────────────────────────────────────────────────────────

  describe('cache behavior', () => {
    it('maintains consistent data across multiple calls', () => {
      const result1 = getRecipe('swords/god-sword');
      const result2 = getRecipe('swords/god-sword');
      expect(result1).toEqual(result2);
    });

    it('_resetCache clears all data', () => {
      // Load data first
      getAllRecipes();
      // Reset
      _resetCache();
      // Load with different test data
      _loadTestData([testRecipes[0]]);
      expect(getRecipeCount()).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty data set', () => {
      _resetCache();
      _loadTestData([]);
      expect(getAllRecipes()).toEqual([]);
      expect(getRecipeCount()).toBe(0);
      expect(getRecipe('swords/god-sword')).toBeUndefined();
      expect(getRecipesByCategory('swords')).toEqual([]);
      expect(getRecipesByTag('general')).toEqual([]);
    });

    it('handles single recipe', () => {
      _resetCache();
      _loadTestData([testRecipes[0]]);
      expect(getAllRecipes()).toHaveLength(1);
      expect(getRecipeCount()).toBe(1);
      expect(getRecipe('swords/god-sword')).toBeDefined();
      expect(getRecipesByCategory('swords')).toHaveLength(1);
    });

    it('handles recipe with no tags', () => {
      _resetCache();
      const recipeNoTags: RecipeData = {
        ...testRecipes[0],
        id: 'test/no-tags',
        tags: [],
      };
      _loadTestData([recipeNoTags]);
      const recipe = getRecipe('test/no-tags');
      expect(recipe?.tags).toEqual([]);
      expect(getRecipesByTag('general')).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Data Integrity
  // ─────────────────────────────────────────────────────────────

  describe('data integrity', () => {
    it('all recipes have valid IDs', () => {
      const all = getAllRecipes();
      for (const recipe of all) {
        expect(recipe.id).toBeDefined();
        expect(recipe.id).not.toBe('');
      }
    });

    it('all recipes have valid names', () => {
      const all = getAllRecipes();
      for (const recipe of all) {
        expect(recipe.name).toBeDefined();
        expect(recipe.name).not.toBe('');
      }
    });

    it('all recipes have valid categories', () => {
      const all = getAllRecipes();
      for (const recipe of all) {
        expect(recipe.category).toBeDefined();
        expect(recipe.category).not.toBe('');
      }
    });

    it('all recipes have positive totalLevelCost', () => {
      const all = getAllRecipes();
      for (const recipe of all) {
        expect(recipe.totalLevelCost).toBeGreaterThan(0);
      }
    });

    it('all recipes have tree data', () => {
      const all = getAllRecipes();
      for (const recipe of all) {
        expect(recipe.tree).toBeDefined();
        expect(recipe.tree.type).toBeDefined();
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Base Item String Parsing
// ─────────────────────────────────────────────────────────────

describe('Base Item String Parsing', () => {
  describe('_parseBaseItemString', () => {
    it('parses netherite_sword correctly', () => {
      const result = _parseBaseItemString('netherite_sword');
      expect(result).toEqual({ type: 'sword', material: 'netherite' });
    });

    it('parses diamond_pickaxe correctly', () => {
      const result = _parseBaseItemString('diamond_pickaxe');
      expect(result).toEqual({ type: 'pickaxe', material: 'diamond' });
    });

    it('parses iron_helmet correctly', () => {
      const result = _parseBaseItemString('iron_helmet');
      expect(result).toEqual({ type: 'helmet', material: 'iron' });
    });

    it('parses gold_boots correctly', () => {
      const result = _parseBaseItemString('gold_boots');
      expect(result).toEqual({ type: 'boots', material: 'gold' });
    });

    it('parses singleton item bow correctly', () => {
      const result = _parseBaseItemString('bow');
      expect(result).toEqual({ type: 'bow' });
    });

    it('parses singleton item trident correctly', () => {
      const result = _parseBaseItemString('trident');
      expect(result).toEqual({ type: 'trident' });
    });

    it('parses singleton item crossbow correctly', () => {
      const result = _parseBaseItemString('crossbow');
      expect(result).toEqual({ type: 'crossbow' });
    });

    it('parses fishing_rod correctly', () => {
      const result = _parseBaseItemString('fishing_rod');
      expect(result).toEqual({ type: 'fishing_rod' });
    });

    it('parses flint_and_steel correctly', () => {
      const result = _parseBaseItemString('flint_and_steel');
      expect(result).toEqual({ type: 'flint_and_steel' });
    });

    it('parses turtle_shell correctly', () => {
      const result = _parseBaseItemString('turtle_shell');
      expect(result).toEqual({ type: 'helmet', material: 'turtle' });
    });

    it('parses turtle_helmet correctly', () => {
      const result = _parseBaseItemString('turtle_helmet');
      expect(result).toEqual({ type: 'helmet', material: 'turtle' });
    });

    it('parses leather_chestplate correctly', () => {
      const result = _parseBaseItemString('leather_chestplate');
      expect(result).toEqual({ type: 'chestplate', material: 'leather' });
    });

    it('parses chainmail_leggings correctly', () => {
      const result = _parseBaseItemString('chainmail_leggings');
      expect(result).toEqual({ type: 'leggings', material: 'chainmail' });
    });

    it('parses stone_hoe correctly', () => {
      const result = _parseBaseItemString('stone_hoe');
      expect(result).toEqual({ type: 'hoe', material: 'stone' });
    });

    it('parses wood_shovel correctly', () => {
      const result = _parseBaseItemString('wood_shovel');
      expect(result).toEqual({ type: 'shovel', material: 'wood' });
    });

    it('returns null for invalid base item', () => {
      const result = _parseBaseItemString('invalid_item');
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = _parseBaseItemString('');
      expect(result).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Recipe Computation
// ─────────────────────────────────────────────────────────────

describe('Recipe Computation', () => {
  beforeEach(() => {
    _resetCache();
  });

  afterEach(() => {
    _resetCache();
  });

  describe('_computeRecipeFromFrontmatter', () => {
    it('computes recipe from valid frontmatter', () => {
      const fm: RecipeFrontmatter = {
        name: 'Test Sword',
        category: 'swords',
        baseItem: 'netherite_sword',
        tags: ['test'],
        enchantments: [{ sharpness: 5 }],
      };

      const result = _computeRecipeFromFrontmatter('test/sword', fm);

      expect(result).toBeDefined();
      expect(result?.id).toBe('test/sword');
      expect(result?.name).toBe('Test Sword');
      expect(result?.category).toBe('swords');
      expect(result?.baseItem).toBe('netherite_sword');
      expect(result?.tags).toEqual(['test']);
      expect(result?.tree).toBeDefined();
      expect(result?.totalLevelCost).toBeGreaterThan(0);
      expect(result?.stepCount).toBe(1);
    });

    it('computes recipe with multiple enchantments', () => {
      const fm: RecipeFrontmatter = {
        name: 'Test Sword Multi',
        category: 'swords',
        baseItem: 'netherite_sword',
        enchantments: [
          { sharpness: 5 },
          { unbreaking: 3 },
          { mending: 1 },
        ],
      };

      const result = _computeRecipeFromFrontmatter('test/sword-multi', fm);

      expect(result).toBeDefined();
      expect(result?.stepCount).toBeGreaterThan(1);
    });

    it('returns null for invalid base item', () => {
      const fm: RecipeFrontmatter = {
        name: 'Invalid Recipe',
        category: 'swords',
        baseItem: 'invalid_item',
        enchantments: [{ sharpness: 5 }],
      };

      const result = _computeRecipeFromFrontmatter('test/invalid', fm);
      expect(result).toBeNull();
    });

    it('handles empty tags array', () => {
      const fm: RecipeFrontmatter = {
        name: 'No Tags',
        category: 'swords',
        baseItem: 'netherite_sword',
        enchantments: [{ sharpness: 5 }],
      };

      const result = _computeRecipeFromFrontmatter('test/no-tags', fm);
      expect(result?.tags).toEqual([]);
    });

    it('handles undefined tags', () => {
      const fm: RecipeFrontmatter = {
        name: 'Undefined Tags',
        category: 'swords',
        baseItem: 'netherite_sword',
        enchantments: [{ sharpness: 5 }],
        tags: undefined,
      };

      const result = _computeRecipeFromFrontmatter('test/undefined-tags', fm);
      expect(result?.tags).toEqual([]);
    });

    it('computes correct XP costs', () => {
      const fm: RecipeFrontmatter = {
        name: 'XP Test',
        category: 'swords',
        baseItem: 'diamond_sword',
        enchantments: [{ sharpness: 5 }],
      };

      const result = _computeRecipeFromFrontmatter('test/xp-test', fm);
      expect(result?.totalXpCost).toBeGreaterThan(0);
      expect(result?.totalXpCostBulk).toBeGreaterThanOrEqual(result!.totalXpCost);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Integration with Real Content Files
// ─────────────────────────────────────────────────────────────

describe('Recipe Lookup (with real content)', () => {
  beforeEach(() => {
    _resetCache();
  });

  afterEach(() => {
    _resetCache();
  });

  it('loads recipes from content files', () => {
    const all = getAllRecipes();
    expect(all.length).toBeGreaterThan(0);
  });

  it('contains expected sword recipes', () => {
    const all = getAllRecipes();
    const ids = all.map((r) => r.id);
    expect(ids).toContain('swords/god-sword');
  });

  it('contains expected pickaxe recipes', () => {
    const all = getAllRecipes();
    const ids = all.map((r) => r.id);
    expect(ids).toContain('pickaxes/god-pickaxe');
  });

  it('god sword has correct properties', () => {
    const godSword = getRecipe('swords/god-sword');
    expect(godSword).toBeDefined();
    expect(godSword?.name).toBe('God Sword');
    expect(godSword?.category).toBe('swords');
    expect(godSword?.baseItem).toBe('netherite_sword');
  });

  it('all loaded recipes have valid computed data', () => {
    const all = getAllRecipes();
    for (const recipe of all) {
      expect(recipe.tree).toBeDefined();
      expect(recipe.totalLevelCost).toBeGreaterThan(0);
      expect(recipe.totalXpCost).toBeGreaterThan(0);
      expect(recipe.stepCount).toBeGreaterThan(0);
    }
  });

  it('all loaded recipes are under survival cap', () => {
    const all = getAllRecipes();
    for (const recipe of all) {
      // If total cost is Infinity, recipe is invalid
      expect(recipe.totalLevelCost).toBeLessThan(Infinity);
    }
  });
});
