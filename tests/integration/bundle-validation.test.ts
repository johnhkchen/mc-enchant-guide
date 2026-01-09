/**
 * Integration tests for bundle content validation.
 *
 * Tests cover:
 * - All bundles have valid schema
 * - All recipe references exist
 * - No duplicate recipe references
 * - Computed properties are accurate
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { parse as parseYaml } from 'yaml';
import { getRecipe, getAllRecipes } from '../../src/data/recipe-lookup.js';
import {
  getBundle,
  getAllBundles,
  getBundleRecipes,
} from '../../src/data/bundle-lookup.js';

// ─────────────────────────────────────────────────────────────
// Types for parsed frontmatter
// ─────────────────────────────────────────────────────────────

interface ParsedBundle {
  name: string;
  description?: string;
  recipes: string[];
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

const BUNDLES_DIR = join(process.cwd(), 'src/content/bundles');

/**
 * Get all .md files in a directory
 */
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isFile() && entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(filePath: string): ParsedBundle | null {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return null;
  }

  try {
    return parseYaml(match[1]) as ParsedBundle;
  } catch {
    return null;
  }
}

/**
 * Get bundle ID from file path
 */
function getBundleId(filePath: string): string {
  return relative(BUNDLES_DIR, filePath).replace(/\.md$/, '');
}

// ─────────────────────────────────────────────────────────────
// Test Data Collection
// ─────────────────────────────────────────────────────────────

const bundleFiles = getAllMarkdownFiles(BUNDLES_DIR);
const parsedBundles = bundleFiles.map((file) => ({
  file,
  id: getBundleId(file),
  data: parseFrontmatter(file),
}));

// Get all available recipe IDs
let availableRecipeIds: string[] = [];
beforeAll(() => {
  availableRecipeIds = getAllRecipes().map((r) => r.id);
});

// ─────────────────────────────────────────────────────────────
// Schema Validation Tests
// ─────────────────────────────────────────────────────────────

describe('bundle schema validation', () => {
  it.each(parsedBundles.filter((b) => b.data !== null))(
    '$id has valid frontmatter',
    ({ data }) => {
      expect(data).not.toBeNull();
      expect(data?.name).toBeDefined();
      expect(typeof data?.name).toBe('string');
      expect(data?.name.length).toBeGreaterThan(0);
    }
  );

  it.each(parsedBundles.filter((b) => b.data !== null))(
    '$id has valid recipes array',
    ({ data }) => {
      expect(Array.isArray(data?.recipes)).toBe(true);
      expect(data?.recipes.length).toBeGreaterThan(0);
    }
  );

  it.each(parsedBundles.filter((b) => b.data !== null))(
    '$id has valid tags array if present',
    ({ data }) => {
      if (data?.tags !== undefined) {
        expect(Array.isArray(data.tags)).toBe(true);
        for (const tag of data.tags) {
          expect(typeof tag).toBe('string');
        }
      }
    }
  );
});

// ─────────────────────────────────────────────────────────────
// Recipe Reference Validation Tests
// ─────────────────────────────────────────────────────────────

describe('recipe reference validation', () => {
  it.each(parsedBundles.filter((b) => b.data !== null))(
    '$id references only existing recipes',
    ({ id, data }) => {
      for (const recipeId of data!.recipes) {
        const recipe = getRecipe(recipeId);
        expect(
          recipe,
          `Bundle "${id}" references non-existent recipe "${recipeId}"`
        ).toBeDefined();
      }
    }
  );

  it.each(parsedBundles.filter((b) => b.data !== null))(
    '$id has no duplicate recipe references',
    ({ id, data }) => {
      const seen = new Set<string>();
      for (const recipeId of data!.recipes) {
        expect(
          seen.has(recipeId),
          `Bundle "${id}" has duplicate recipe reference "${recipeId}"`
        ).toBe(false);
        seen.add(recipeId);
      }
    }
  );
});

// ─────────────────────────────────────────────────────────────
// Computed Properties Tests
// ─────────────────────────────────────────────────────────────

describe('computed properties', () => {
  it.each(parsedBundles.filter((b) => b.data !== null))(
    '$id has correct itemCount',
    ({ id }) => {
      const bundle = getBundle(id);
      expect(bundle).toBeDefined();

      const recipes = getBundleRecipes(id);
      expect(bundle?.itemCount).toBe(recipes.length);
    }
  );

  it.each(parsedBundles.filter((b) => b.data !== null))(
    '$id has correct totalLevelCost',
    ({ id }) => {
      const bundle = getBundle(id);
      expect(bundle).toBeDefined();

      const recipes = getBundleRecipes(id);
      const expectedCost = recipes.reduce((sum, r) => sum + r.totalLevelCost, 0);
      expect(bundle?.totalLevelCost).toBe(expectedCost);
    }
  );
});

// ─────────────────────────────────────────────────────────────
// Collection-Level Tests
// ─────────────────────────────────────────────────────────────

describe('bundle collection', () => {
  it('should have at least 5 bundles', () => {
    expect(bundleFiles.length).toBeGreaterThanOrEqual(5);
  });

  it('should have all bundles loadable via getAllBundles', () => {
    const loadedBundles = getAllBundles();
    expect(loadedBundles.length).toBe(bundleFiles.length);
  });

  it('should have unique bundle IDs', () => {
    const ids = getAllBundles().map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique bundle names', () => {
    const names = getAllBundles().map((b) => b.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

// ─────────────────────────────────────────────────────────────
// Specific Bundle Tests
// ─────────────────────────────────────────────────────────────

describe('specific bundles', () => {
  describe('starter-pack', () => {
    it('should exist', () => {
      const bundle = getBundle('starter-pack');
      expect(bundle).toBeDefined();
    });

    it('should have essential items', () => {
      const bundle = getBundle('starter-pack');
      expect(bundle?.recipeIds).toContain('pickaxes/fortune-pick');
      expect(bundle?.recipeIds).toContain('axes/fortune-axe');
      expect(bundle?.recipeIds).toContain('swords/looting-sword');
      expect(bundle?.recipeIds).toContain('elytra/elytra');
    });

    it('should be tagged as essential', () => {
      const bundle = getBundle('starter-pack');
      expect(bundle?.tags).toContain('essential');
    });
  });

  describe('slayer', () => {
    it('should exist', () => {
      const bundle = getBundle('slayer');
      expect(bundle).toBeDefined();
    });

    it('should have smite sword and protection armor', () => {
      const bundle = getBundle('slayer');
      expect(bundle?.recipeIds).toContain('swords/smite-sword');
      expect(bundle?.recipeIds).toContain('armor/protection-chestplate');
    });
  });

  describe('gatherer', () => {
    it('should exist', () => {
      const bundle = getBundle('gatherer');
      expect(bundle).toBeDefined();
    });

    it('should have fortune and silk touch pickaxes', () => {
      const bundle = getBundle('gatherer');
      expect(bundle?.recipeIds).toContain('pickaxes/fortune-pick');
      expect(bundle?.recipeIds).toContain('pickaxes/silk-touch-pick');
    });
  });

  describe('builder', () => {
    it('should exist', () => {
      const bundle = getBundle('builder');
      expect(bundle).toBeDefined();
    });

    it('should have silk touch tools', () => {
      const bundle = getBundle('builder');
      expect(bundle?.recipeIds).toContain('pickaxes/silk-touch-pick');
      expect(bundle?.recipeIds).toContain('axes/silk-touch-axe');
    });
  });

  describe('explorer', () => {
    it('should exist', () => {
      const bundle = getBundle('explorer');
      expect(bundle).toBeDefined();
    });

    it('should have mobility items', () => {
      const bundle = getBundle('explorer');
      expect(bundle?.recipeIds).toContain('elytra/elytra');
      expect(bundle?.recipeIds).toContain('tridents/riptide-trident');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// getBundleRecipes Integration Tests
// ─────────────────────────────────────────────────────────────

describe('getBundleRecipes integration', () => {
  it('should return correct number of recipes for each bundle', () => {
    for (const bundle of getAllBundles()) {
      const recipes = getBundleRecipes(bundle.id);
      expect(recipes.length).toBe(bundle.itemCount);
    }
  });

  it('should return full recipe data with trees', () => {
    for (const bundle of getAllBundles()) {
      const recipes = getBundleRecipes(bundle.id);
      for (const recipe of recipes) {
        expect(recipe.tree).toBeDefined();
        expect(recipe.totalLevelCost).toBeGreaterThan(0);
        expect(recipe.stepCount).toBeGreaterThan(0);
      }
    }
  });
});
