/**
 * Integration tests for recipe content validation.
 *
 * Tests cover:
 * - All recipes have valid schema
 * - All recipes reference valid base items
 * - All recipes reference valid enchantments
 * - No conflicting enchantments in recipes
 * - All recipes compute under survival cap (39 levels)
 * - All enchantments are applicable to base item
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { parse as parseYaml } from 'yaml';
import type { EnchantmentId, RecipeCategory, BaseItemType } from '../../src/types/index.js';
import { getEnchantment, getAllEnchantments } from '../../src/data/enchantment-lookup.js';
import { getBaseItem, itemTypeRequiresMaterial, getValidMaterials } from '../../src/data/base-items.js';
import { computeRecipe, isRecipeValid } from '../../src/engine/optimizer.js';

// ─────────────────────────────────────────────────────────────
// Types for parsed frontmatter
// ─────────────────────────────────────────────────────────────

interface ParsedRecipe {
  name: string;
  category: RecipeCategory;
  baseItem: string;
  tags?: string[];
  enchantments: Record<string, number>[];
}

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

const RECIPES_DIR = join(process.cwd(), 'src/content/recipes');

/**
 * Recursively get all .md files in a directory
 */
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    try {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (entry.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or is unreadable
    }
  }

  walk(dir);
  return files;
}

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(filePath: string): ParsedRecipe | null {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return null;
  }

  try {
    return parseYaml(match[1]) as ParsedRecipe;
  } catch {
    return null;
  }
}

/**
 * Get recipe ID from file path
 */
function getRecipeId(filePath: string): string {
  return relative(RECIPES_DIR, filePath).replace(/\.md$/, '').replace(/\\/g, '/');
}

/**
 * Parse base item string to type and material
 */
function parseBaseItemString(baseItem: string): { type: BaseItemType; material?: string } | null {
  const singletonTypes: BaseItemType[] = [
    'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
    'shears', 'flint_and_steel', 'shield', 'elytra',
  ];

  if (singletonTypes.includes(baseItem as BaseItemType)) {
    return { type: baseItem as BaseItemType };
  }

  if (baseItem === 'fishing_rod') return { type: 'fishing_rod' };
  if (baseItem === 'flint_and_steel') return { type: 'flint_and_steel' };
  if (baseItem === 'turtle_shell' || baseItem === 'turtle_helmet') {
    return { type: 'helmet', material: 'turtle' };
  }

  const parts = baseItem.split('_');
  if (parts.length >= 2) {
    const material = parts[0];
    const type = parts.slice(1).join('_') as BaseItemType;
    return { type, material };
  }

  return null;
}

/**
 * Get base item type from base item string
 */
function getBaseItemType(baseItemStr: string): BaseItemType | null {
  const parsed = parseBaseItemString(baseItemStr);
  return parsed?.type ?? null;
}

// ─────────────────────────────────────────────────────────────
// Valid Values
// ─────────────────────────────────────────────────────────────

const VALID_CATEGORIES: RecipeCategory[] = [
  'swords', 'pickaxes', 'axes', 'shovels', 'hoes',
  'helmets', 'chestplates', 'leggings', 'boots',
  'bows', 'crossbows', 'tridents', 'maces', 'fishing_rods',
];

const VALID_MATERIALS = [
  'netherite', 'diamond', 'iron', 'gold', 'stone', 'wood',
  'leather', 'chainmail', 'turtle',
];

const VALID_ITEM_TYPES: BaseItemType[] = [
  'sword', 'pickaxe', 'axe', 'shovel', 'hoe',
  'helmet', 'chestplate', 'leggings', 'boots',
  'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
  'shears', 'flint_and_steel', 'shield', 'elytra',
];

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Recipe Content Validation', () => {
  let recipeFiles: string[];
  let recipes: Map<string, ParsedRecipe>;
  let availableEnchantmentIds: Set<string>;

  beforeAll(() => {
    recipeFiles = getAllMarkdownFiles(RECIPES_DIR);
    recipes = new Map();

    for (const file of recipeFiles) {
      const parsed = parseFrontmatter(file);
      if (parsed) {
        const id = getRecipeId(file);
        recipes.set(id, parsed);
      }
    }

    // Get available enchantment IDs from the lookup
    const allEnchantments = getAllEnchantments();
    availableEnchantmentIds = new Set(allEnchantments.map((e) => e.id));
  });

  // ─────────────────────────────────────────────────────────────
  // File Structure
  // ─────────────────────────────────────────────────────────────

  describe('file structure', () => {
    it('has at least 10 recipe files', () => {
      expect(recipeFiles.length).toBeGreaterThanOrEqual(10);
    });

    it('all files have valid frontmatter', () => {
      for (const file of recipeFiles) {
        const parsed = parseFrontmatter(file);
        expect(parsed, `Failed to parse frontmatter in ${file}`).not.toBeNull();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Schema Validation
  // ─────────────────────────────────────────────────────────────

  describe('schema validation', () => {
    it('all recipes have required fields', () => {
      for (const [id, recipe] of recipes) {
        expect(recipe.name, `${id}: missing name`).toBeDefined();
        expect(recipe.category, `${id}: missing category`).toBeDefined();
        expect(recipe.baseItem, `${id}: missing baseItem`).toBeDefined();
        expect(recipe.enchantments, `${id}: missing enchantments`).toBeDefined();
      }
    });

    it('all recipes have valid categories', () => {
      for (const [id, recipe] of recipes) {
        expect(
          VALID_CATEGORIES,
          `${id}: invalid category '${recipe.category}'`
        ).toContain(recipe.category);
      }
    });

    it('all recipes have non-empty names', () => {
      for (const [id, recipe] of recipes) {
        expect(recipe.name.length, `${id}: name cannot be empty`).toBeGreaterThan(0);
      }
    });

    it('all recipes have at least one enchantment', () => {
      for (const [id, recipe] of recipes) {
        expect(
          recipe.enchantments.length,
          `${id}: must have at least one enchantment`
        ).toBeGreaterThan(0);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Base Item Validation
  // ─────────────────────────────────────────────────────────────

  describe('base item validation', () => {
    it('all recipes reference valid base items', () => {
      for (const [id, recipe] of recipes) {
        const parsed = parseBaseItemString(recipe.baseItem);
        expect(parsed, `${id}: invalid baseItem '${recipe.baseItem}'`).not.toBeNull();

        if (parsed) {
          expect(
            VALID_ITEM_TYPES,
            `${id}: invalid item type '${parsed.type}'`
          ).toContain(parsed.type);

          if (parsed.material) {
            expect(
              VALID_MATERIALS,
              `${id}: invalid material '${parsed.material}'`
            ).toContain(parsed.material);
          }

          // Verify the base item exists in our data
          const baseItem = getBaseItem(parsed.type, parsed.material as any);
          expect(
            baseItem,
            `${id}: baseItem '${recipe.baseItem}' not found in base-items data`
          ).toBeDefined();
        }
      }
    });

    it('category matches base item type', () => {
      const categoryToType: Record<RecipeCategory, BaseItemType> = {
        swords: 'sword',
        pickaxes: 'pickaxe',
        axes: 'axe',
        shovels: 'shovel',
        hoes: 'hoe',
        helmets: 'helmet',
        chestplates: 'chestplate',
        leggings: 'leggings',
        boots: 'boots',
        bows: 'bow',
        crossbows: 'crossbow',
        tridents: 'trident',
        maces: 'mace',
        fishing_rods: 'fishing_rod',
      };

      for (const [id, recipe] of recipes) {
        const itemType = getBaseItemType(recipe.baseItem);
        const expectedType = categoryToType[recipe.category];
        expect(
          itemType,
          `${id}: category '${recipe.category}' expects item type '${expectedType}', but baseItem is '${recipe.baseItem}'`
        ).toBe(expectedType);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Enchantment Validation
  // ─────────────────────────────────────────────────────────────

  describe('enchantment validation', () => {
    it('all enchantments reference valid enchantment IDs', () => {
      for (const [id, recipe] of recipes) {
        for (const enchantSpec of recipe.enchantments) {
          for (const enchantId of Object.keys(enchantSpec)) {
            expect(
              availableEnchantmentIds.has(enchantId),
              `${id}: enchantment '${enchantId}' not found in available enchantments`
            ).toBe(true);
          }
        }
      }
    });

    it('all enchantment levels are valid', () => {
      for (const [id, recipe] of recipes) {
        for (const enchantSpec of recipe.enchantments) {
          for (const [enchantId, level] of Object.entries(enchantSpec)) {
            const enchantData = getEnchantment(enchantId as EnchantmentId);
            if (enchantData) {
              expect(
                level,
                `${id}: level ${level} for ${enchantId} exceeds maxLevel ${enchantData.maxLevel}`
              ).toBeLessThanOrEqual(enchantData.maxLevel);
              expect(
                level,
                `${id}: level ${level} for ${enchantId} must be positive`
              ).toBeGreaterThan(0);
            }
          }
        }
      }
    });

    it('all enchantments are applicable to base item type', () => {
      for (const [id, recipe] of recipes) {
        const itemType = getBaseItemType(recipe.baseItem);
        if (!itemType) continue;

        for (const enchantSpec of recipe.enchantments) {
          for (const enchantId of Object.keys(enchantSpec)) {
            const enchantData = getEnchantment(enchantId as EnchantmentId);
            if (enchantData) {
              expect(
                enchantData.applicableTo,
                `${id}: enchantment '${enchantId}' is not applicable to '${itemType}'`
              ).toContain(itemType);
            }
          }
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Conflict Validation
  // ─────────────────────────────────────────────────────────────

  describe('conflict validation', () => {
    it('no conflicting enchantments in recipes', () => {
      const conflicts: string[] = [];

      for (const [id, recipe] of recipes) {
        const enchantIds = recipe.enchantments.flatMap((spec) => Object.keys(spec));

        for (let i = 0; i < enchantIds.length; i++) {
          const enchant = getEnchantment(enchantIds[i] as EnchantmentId);
          if (!enchant) continue;

          for (let j = i + 1; j < enchantIds.length; j++) {
            if (enchant.conflicts.includes(enchantIds[j] as EnchantmentId)) {
              conflicts.push(
                `${id}: '${enchantIds[i]}' conflicts with '${enchantIds[j]}'`
              );
            }
          }
        }
      }

      expect(conflicts, conflicts.join('\n')).toHaveLength(0);
    });

    it('no duplicate enchantments in recipes', () => {
      const duplicates: string[] = [];

      for (const [id, recipe] of recipes) {
        const enchantIds = recipe.enchantments.flatMap((spec) => Object.keys(spec));
        const seen = new Set<string>();

        for (const enchantId of enchantIds) {
          if (seen.has(enchantId)) {
            duplicates.push(`${id}: duplicate enchantment '${enchantId}'`);
          }
          seen.add(enchantId);
        }
      }

      expect(duplicates, duplicates.join('\n')).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Survival Cap Validation
  // ─────────────────────────────────────────────────────────────

  describe('survival cap validation', () => {
    it('all recipes compute under survival cap (39 levels per step)', () => {
      const failures: string[] = [];

      for (const [id, recipe] of recipes) {
        const parsed = parseBaseItemString(recipe.baseItem);
        if (!parsed) continue;

        const baseItem = getBaseItem(parsed.type, parsed.material as any);
        if (!baseItem) continue;

        const isValid = isRecipeValid(recipe.enchantments, baseItem.displayName);
        if (!isValid) {
          failures.push(`${id}: exceeds 39 level survival cap`);
        }
      }

      expect(failures, failures.join('\n')).toHaveLength(0);
    });

    it('all recipes compute successfully', () => {
      const failures: string[] = [];

      for (const [id, recipe] of recipes) {
        const parsed = parseBaseItemString(recipe.baseItem);
        if (!parsed) continue;

        const baseItem = getBaseItem(parsed.type, parsed.material as any);
        if (!baseItem) continue;

        try {
          const computed = computeRecipe(recipe.enchantments, baseItem.displayName);
          if (computed.totalLevelCost === Infinity) {
            failures.push(`${id}: computation returned infinite cost`);
          }
        } catch (error) {
          failures.push(`${id}: computation failed with error: ${error}`);
        }
      }

      expect(failures, failures.join('\n')).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Recipe Set Completeness
  // ─────────────────────────────────────────────────────────────

  describe('recipe set completeness', () => {
    const requiredRecipes = [
      'swords/god-sword',
      'swords/mob-farm-sword',
      'swords/pvp-sword',
      'pickaxes/god-pickaxe',
      'pickaxes/silk-touch-pick',
      'pickaxes/fortune-pick',
      'axes/god-axe',
      'armor/protection-helmet',
      'armor/protection-chestplate',
      'armor/protection-boots',
    ];

    it.each(requiredRecipes)('has %s recipe', (recipeId) => {
      expect(recipes.has(recipeId), `Missing required recipe: ${recipeId}`).toBe(true);
    });

    it('has sword recipes', () => {
      const swordRecipes = Array.from(recipes.entries())
        .filter(([_, r]) => r.category === 'swords');
      expect(swordRecipes.length).toBeGreaterThanOrEqual(3);
    });

    it('has pickaxe recipes', () => {
      const pickaxeRecipes = Array.from(recipes.entries())
        .filter(([_, r]) => r.category === 'pickaxes');
      expect(pickaxeRecipes.length).toBeGreaterThanOrEqual(3);
    });

    it('has armor recipes', () => {
      const armorCategories = ['helmets', 'chestplates', 'boots'];
      const armorRecipes = Array.from(recipes.entries())
        .filter(([_, r]) => armorCategories.includes(r.category));
      expect(armorRecipes.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tag Consistency
  // ─────────────────────────────────────────────────────────────

  describe('tag consistency', () => {
    it('tags are arrays of strings when present', () => {
      for (const [id, recipe] of recipes) {
        if (recipe.tags !== undefined) {
          expect(Array.isArray(recipe.tags), `${id}: tags must be an array`).toBe(true);
          for (const tag of recipe.tags) {
            expect(typeof tag, `${id}: all tags must be strings`).toBe('string');
          }
        }
      }
    });

    it('tags are lowercase', () => {
      for (const [id, recipe] of recipes) {
        if (recipe.tags) {
          for (const tag of recipe.tags) {
            expect(tag, `${id}: tag '${tag}' should be lowercase`).toBe(tag.toLowerCase());
          }
        }
      }
    });
  });
});
