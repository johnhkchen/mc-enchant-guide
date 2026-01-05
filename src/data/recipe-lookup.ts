// src/data/recipe-lookup.ts
// Recipe lookup module - bridges recipe content collection to computed recipes

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { parse as parseYaml } from 'yaml';
import type {
  RecipeCategory,
  RecipeFrontmatter,
  ComputedRecipe,
  BaseItemType,
  ItemMaterial,
} from '../types/index.js';
import { computeRecipe, type EnchantmentSpec } from '../engine/optimizer.js';
import { getBaseItem } from './base-items.js';

// ─────────────────────────────────────────────────────────────
// Extended Types
// ─────────────────────────────────────────────────────────────

/**
 * Recipe with computed tree and metadata.
 * This is what consumers get from the lookup functions.
 */
export interface RecipeData extends ComputedRecipe {
  id: string;
  name: string;
  category: RecipeCategory;
  baseItem: string;
  tags: string[];
  enchantments: EnchantmentSpec[];
}

// ─────────────────────────────────────────────────────────────
// Lookup Store
// ─────────────────────────────────────────────────────────────

let recipeMap: Map<string, RecipeData> | null = null;
let recipeList: RecipeData[] | null = null;
let categoryIndex: Map<RecipeCategory, RecipeData[]> | null = null;

// ─────────────────────────────────────────────────────────────
// Frontmatter Parser
// ─────────────────────────────────────────────────────────────

function parseFrontmatter(filePath: string): RecipeFrontmatter | null {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return null;
  }

  try {
    return parseYaml(match[1]) as RecipeFrontmatter;
  } catch {
    return null;
  }
}

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

// ─────────────────────────────────────────────────────────────
// Base Item Resolution
// ─────────────────────────────────────────────────────────────

/**
 * Parse a baseItem string like "netherite_sword" into type and material.
 */
function parseBaseItemString(baseItem: string): { type: BaseItemType; material?: ItemMaterial } | null {
  // Try to match pattern: material_type (e.g., netherite_sword, diamond_pickaxe)
  const parts = baseItem.split('_');

  // Singleton items (no material)
  const singletonTypes: BaseItemType[] = [
    'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
    'shears', 'flint_and_steel', 'shield', 'elytra',
  ];

  // Check if it's a singleton (e.g., "bow", "trident")
  if (singletonTypes.includes(baseItem as BaseItemType)) {
    return { type: baseItem as BaseItemType };
  }

  // Check for fishing_rod (two-part singleton)
  if (baseItem === 'fishing_rod') {
    return { type: 'fishing_rod' };
  }

  // Check for flint_and_steel (three-part singleton)
  if (baseItem === 'flint_and_steel') {
    return { type: 'flint_and_steel' };
  }

  // For material + type combinations
  const materials: ItemMaterial[] = [
    'netherite', 'diamond', 'iron', 'gold', 'stone', 'wood',
    'leather', 'chainmail', 'turtle',
  ];

  const itemTypes: BaseItemType[] = [
    'sword', 'pickaxe', 'axe', 'shovel', 'hoe',
    'helmet', 'chestplate', 'leggings', 'boots',
  ];

  // Handle multi-word materials (turtle_shell -> turtle helmet)
  if (baseItem === 'turtle_shell' || baseItem === 'turtle_helmet') {
    return { type: 'helmet', material: 'turtle' };
  }

  // Standard pattern: material_type
  if (parts.length >= 2) {
    const material = parts[0] as ItemMaterial;
    const type = parts.slice(1).join('_') as BaseItemType;

    if (materials.includes(material) && itemTypes.includes(type)) {
      return { type, material };
    }
  }

  return null;
}

/**
 * Get display name for a base item string.
 */
function getBaseItemDisplayName(baseItemStr: string): string | null {
  const parsed = parseBaseItemString(baseItemStr);
  if (!parsed) return null;

  const item = getBaseItem(parsed.type, parsed.material);
  return item?.displayName ?? null;
}

// ─────────────────────────────────────────────────────────────
// Recipe Computation
// ─────────────────────────────────────────────────────────────

/**
 * Convert recipe frontmatter to computed recipe data.
 */
function computeRecipeFromFrontmatter(
  id: string,
  fm: RecipeFrontmatter
): RecipeData | null {
  const displayName = getBaseItemDisplayName(fm.baseItem);
  if (!displayName) {
    return null;
  }

  // Convert enchantments array format to EnchantmentSpec[]
  const enchantments: EnchantmentSpec[] = fm.enchantments;

  // Compute the recipe tree
  const computed = computeRecipe(enchantments, displayName);

  return {
    ...computed,
    id,
    name: fm.name,
    category: fm.category,
    baseItem: fm.baseItem,
    tags: fm.tags ?? [],
    enchantments,
  };
}

// ─────────────────────────────────────────────────────────────
// Data Loading
// ─────────────────────────────────────────────────────────────

function loadRecipesFromFiles(): RecipeData[] {
  const recipesDir = join(process.cwd(), 'src/content/recipes');
  const files = getAllMarkdownFiles(recipesDir);

  if (files.length === 0) {
    return [];
  }

  const recipes: RecipeData[] = [];

  for (const file of files) {
    const fm = parseFrontmatter(file);
    if (!fm) continue;

    // Generate ID from relative path (e.g., "swords/god-sword")
    const relPath = relative(recipesDir, file);
    const id = relPath.replace(/\.md$/, '').replace(/\\/g, '/');

    const recipeData = computeRecipeFromFrontmatter(id, fm);
    if (recipeData) {
      recipes.push(recipeData);
    }
  }

  return recipes;
}

function initializeData(): void {
  if (recipeMap !== null) {
    return; // Already initialized
  }

  const recipes = loadRecipesFromFiles();

  // Build lookup structures
  recipeMap = new Map();
  recipeList = recipes;
  categoryIndex = new Map();

  for (const recipe of recipes) {
    // Main ID lookup
    recipeMap.set(recipe.id, recipe);

    // Category index
    const catList = categoryIndex.get(recipe.category) ?? [];
    catList.push(recipe);
    categoryIndex.set(recipe.category, catList);
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Get a recipe by its ID.
 * Returns undefined if the recipe is not found.
 *
 * @param id - The recipe ID (e.g., "swords/god-sword")
 * @returns The recipe data or undefined
 */
export function getRecipe(id: string): RecipeData | undefined {
  initializeData();
  return recipeMap!.get(id);
}

/**
 * Get all loaded recipes.
 *
 * @returns Array of all recipe data
 */
export function getAllRecipes(): RecipeData[] {
  initializeData();
  return [...recipeList!];
}

/**
 * Get all recipes in a specific category.
 *
 * @param category - The recipe category to filter by
 * @returns Array of recipes in that category
 */
export function getRecipesByCategory(category: RecipeCategory): RecipeData[] {
  initializeData();
  return [...(categoryIndex!.get(category) ?? [])];
}

/**
 * Get the total count of loaded recipes.
 *
 * @returns The number of recipes
 */
export function getRecipeCount(): number {
  initializeData();
  return recipeList!.length;
}

/**
 * Get all recipes with a specific tag.
 *
 * @param tag - The tag to filter by
 * @returns Array of recipes with that tag
 */
export function getRecipesByTag(tag: string): RecipeData[] {
  initializeData();
  return recipeList!.filter((r) => r.tags.includes(tag));
}

// ─────────────────────────────────────────────────────────────
// Testing Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Reset the lookup cache. For testing purposes only.
 */
export function _resetCache(): void {
  recipeMap = null;
  recipeList = null;
  categoryIndex = null;
}

/**
 * Load data with specific recipes. For testing purposes only.
 */
export function _loadTestData(recipes: RecipeData[]): void {
  recipeMap = new Map();
  recipeList = recipes;
  categoryIndex = new Map();

  for (const recipe of recipes) {
    recipeMap.set(recipe.id, recipe);

    const catList = categoryIndex.get(recipe.category) ?? [];
    catList.push(recipe);
    categoryIndex.set(recipe.category, catList);
  }
}

/**
 * Compute a recipe from frontmatter for testing.
 * Exposed for testing validation without full file loading.
 */
export function _computeRecipeFromFrontmatter(
  id: string,
  fm: RecipeFrontmatter
): RecipeData | null {
  return computeRecipeFromFrontmatter(id, fm);
}

/**
 * Parse base item string for testing.
 */
export function _parseBaseItemString(
  baseItem: string
): { type: BaseItemType; material?: ItemMaterial } | null {
  return parseBaseItemString(baseItem);
}
