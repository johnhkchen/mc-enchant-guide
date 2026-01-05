// src/data/bundle-lookup.ts
// Bundle lookup module - bridges bundle content collection to computed data

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { parse as parseYaml } from 'yaml';
import type { BundleFrontmatter } from '../types/index.js';
import { getRecipe, type RecipeData } from './recipe-lookup.js';

// ─────────────────────────────────────────────────────────────
// Extended Types
// ─────────────────────────────────────────────────────────────

/**
 * Bundle with computed metadata.
 * This is what consumers get from the lookup functions.
 */
export interface BundleData {
  id: string;
  name: string;
  description?: string;
  recipeIds: string[];
  tags: string[];
  // Computed
  totalLevelCost: number;
  itemCount: number;
}

// ─────────────────────────────────────────────────────────────
// Lookup Store
// ─────────────────────────────────────────────────────────────

let bundleMap: Map<string, BundleData> | null = null;
let bundleList: BundleData[] | null = null;

// ─────────────────────────────────────────────────────────────
// Frontmatter Parser
// ─────────────────────────────────────────────────────────────

function parseFrontmatter(filePath: string): BundleFrontmatter | null {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return null;
  }

  try {
    return parseYaml(match[1]) as BundleFrontmatter;
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
// Bundle Computation
// ─────────────────────────────────────────────────────────────

/**
 * Compute bundle metadata including total costs.
 */
function computeBundleFromFrontmatter(
  id: string,
  fm: BundleFrontmatter
): BundleData {
  // Calculate total level cost from all recipes
  let totalLevelCost = 0;
  let itemCount = 0;

  for (const recipeId of fm.recipes) {
    const recipe = getRecipe(recipeId);
    if (recipe) {
      totalLevelCost += recipe.totalLevelCost;
      itemCount++;
    }
  }

  return {
    id,
    name: fm.name,
    description: fm.description,
    recipeIds: fm.recipes,
    tags: fm.tags ?? [],
    totalLevelCost,
    itemCount,
  };
}

// ─────────────────────────────────────────────────────────────
// Data Loading
// ─────────────────────────────────────────────────────────────

function loadBundlesFromFiles(): BundleData[] {
  const bundlesDir = join(process.cwd(), 'src/content/bundles');
  const files = getAllMarkdownFiles(bundlesDir);

  if (files.length === 0) {
    return [];
  }

  const bundles: BundleData[] = [];

  for (const file of files) {
    const fm = parseFrontmatter(file);
    if (!fm) continue;

    // Generate ID from filename (e.g., "starter-kit")
    const relPath = relative(bundlesDir, file);
    const id = relPath.replace(/\.md$/, '').replace(/\\/g, '/');

    const bundleData = computeBundleFromFrontmatter(id, fm);
    bundles.push(bundleData);
  }

  return bundles;
}

function initializeData(): void {
  if (bundleMap !== null) {
    return; // Already initialized
  }

  const bundles = loadBundlesFromFiles();

  // Build lookup structures
  bundleMap = new Map();
  bundleList = bundles;

  for (const bundle of bundles) {
    bundleMap.set(bundle.id, bundle);
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Get a bundle by its ID.
 * Returns undefined if the bundle is not found.
 *
 * @param id - The bundle ID (e.g., "starter-kit")
 * @returns The bundle data or undefined
 */
export function getBundle(id: string): BundleData | undefined {
  initializeData();
  return bundleMap!.get(id);
}

/**
 * Get all loaded bundles.
 *
 * @returns Array of all bundle data
 */
export function getAllBundles(): BundleData[] {
  initializeData();
  return [...bundleList!];
}

/**
 * Get all recipes included in a bundle.
 *
 * @param id - The bundle ID
 * @returns Array of recipe data, or empty array if bundle not found
 */
export function getBundleRecipes(id: string): RecipeData[] {
  initializeData();
  const bundle = bundleMap!.get(id);
  if (!bundle) {
    return [];
  }

  const recipes: RecipeData[] = [];
  for (const recipeId of bundle.recipeIds) {
    const recipe = getRecipe(recipeId);
    if (recipe) {
      recipes.push(recipe);
    }
  }

  return recipes;
}

/**
 * Get the total count of loaded bundles.
 *
 * @returns The number of bundles
 */
export function getBundleCount(): number {
  initializeData();
  return bundleList!.length;
}

/**
 * Get all bundles with a specific tag.
 *
 * @param tag - The tag to filter by
 * @returns Array of bundles with that tag
 */
export function getBundlesByTag(tag: string): BundleData[] {
  initializeData();
  return bundleList!.filter((b) => b.tags.includes(tag));
}

// ─────────────────────────────────────────────────────────────
// Testing Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Reset the lookup cache. For testing purposes only.
 */
export function _resetCache(): void {
  bundleMap = null;
  bundleList = null;
}

/**
 * Load data with specific bundles. For testing purposes only.
 */
export function _loadTestData(bundles: BundleData[]): void {
  bundleMap = new Map();
  bundleList = bundles;

  for (const bundle of bundles) {
    bundleMap.set(bundle.id, bundle);
  }
}

/**
 * Compute a bundle from frontmatter for testing.
 * Exposed for testing validation without full file loading.
 */
export function _computeBundleFromFrontmatter(
  id: string,
  fm: BundleFrontmatter
): BundleData {
  return computeBundleFromFrontmatter(id, fm);
}
