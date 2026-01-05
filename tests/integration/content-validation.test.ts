/**
 * Integration tests for content collection validation.
 *
 * Tests cover:
 * - All enchantments have valid schema
 * - All conflicts reference valid enchantments
 * - levelStats array length matches maxLevel
 * - Data consistency between enchantments
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import type { EnchantmentId } from '../../src/types/index.js';

// ─────────────────────────────────────────────────────────────
// Types for parsed frontmatter
// ─────────────────────────────────────────────────────────────

interface ParsedEnchantment {
  id: string;
  name: string;
  category: string;
  maxLevel: number;
  bookMultiplier: number;
  itemMultiplier: number;
  conflicts: string[];
  applicableTo: string[];
  levelStats: Array<{
    level: number;
    effect: string;
    numericValue?: number;
    unit?: string;
  }>;
  icon?: string;
  color?: string;
}

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

const ENCHANTMENTS_DIR = join(process.cwd(), 'src/content/enchantments');

/**
 * Recursively get all .md files in a directory
 */
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
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
  }

  walk(dir);
  return files;
}

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(filePath: string): ParsedEnchantment | null {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return null;
  }

  try {
    return parseYaml(match[1]) as ParsedEnchantment;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Valid Values
// ─────────────────────────────────────────────────────────────

const VALID_ENCHANTMENT_IDS: EnchantmentId[] = [
  'sharpness', 'smite', 'bane_of_arthropods',
  'knockback', 'fire_aspect', 'looting', 'sweeping_edge',
  'efficiency', 'silk_touch', 'fortune', 'unbreaking',
  'mending', 'protection', 'fire_protection', 'blast_protection',
  'projectile_protection', 'thorns', 'respiration', 'aqua_affinity',
  'depth_strider', 'frost_walker', 'feather_falling', 'soul_speed',
  'swift_sneak', 'power', 'punch', 'flame', 'infinity',
  'loyalty', 'riptide', 'channeling', 'impaling',
  'multishot', 'piercing', 'quick_charge',
  'density', 'breach', 'wind_burst',
  'lure', 'luck_of_the_sea',
  'curse_of_binding', 'curse_of_vanishing',
];

const VALID_CATEGORIES = [
  'damage', 'protection', 'utility', 'weapon', 'tool',
  'armor', 'bow', 'crossbow', 'trident', 'mace', 'curse',
];

const VALID_ITEM_TYPES = [
  'sword', 'pickaxe', 'axe', 'shovel', 'hoe',
  'helmet', 'chestplate', 'leggings', 'boots',
  'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
  'shears', 'flint_and_steel', 'shield', 'elytra',
];

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('Enchantment Content Validation', () => {
  let enchantmentFiles: string[];
  let enchantments: Map<string, ParsedEnchantment>;

  beforeAll(() => {
    enchantmentFiles = getAllMarkdownFiles(ENCHANTMENTS_DIR);
    enchantments = new Map();

    for (const file of enchantmentFiles) {
      const parsed = parseFrontmatter(file);
      if (parsed) {
        enchantments.set(parsed.id, parsed);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────
  // File Structure
  // ─────────────────────────────────────────────────────────────

  describe('file structure', () => {
    it('has at least one enchantment file', () => {
      expect(enchantmentFiles.length).toBeGreaterThan(0);
    });

    it('all files have valid frontmatter', () => {
      for (const file of enchantmentFiles) {
        const parsed = parseFrontmatter(file);
        expect(parsed, `Failed to parse frontmatter in ${file}`).not.toBeNull();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Schema Validation
  // ─────────────────────────────────────────────────────────────

  describe('schema validation', () => {
    it('all enchantments have required fields', () => {
      for (const [id, enchant] of enchantments) {
        expect(enchant.id, `${id}: missing id`).toBeDefined();
        expect(enchant.name, `${id}: missing name`).toBeDefined();
        expect(enchant.category, `${id}: missing category`).toBeDefined();
        expect(enchant.maxLevel, `${id}: missing maxLevel`).toBeDefined();
        expect(enchant.bookMultiplier, `${id}: missing bookMultiplier`).toBeDefined();
        expect(enchant.itemMultiplier, `${id}: missing itemMultiplier`).toBeDefined();
        expect(enchant.applicableTo, `${id}: missing applicableTo`).toBeDefined();
        expect(enchant.levelStats, `${id}: missing levelStats`).toBeDefined();
      }
    });

    it('all enchantments have valid id format (lowercase_snake_case)', () => {
      for (const [id, enchant] of enchantments) {
        expect(enchant.id).toMatch(/^[a-z][a-z0-9_]*$/);
        expect(enchant.id, `Filename ID mismatch for ${id}`).toBe(id);
      }
    });

    it('all enchantments have valid categories', () => {
      for (const [id, enchant] of enchantments) {
        expect(
          VALID_CATEGORIES,
          `${id}: invalid category '${enchant.category}'`
        ).toContain(enchant.category);
      }
    });

    it('all enchantments have positive maxLevel', () => {
      for (const [id, enchant] of enchantments) {
        expect(enchant.maxLevel, `${id}: maxLevel must be positive`).toBeGreaterThan(0);
      }
    });

    it('all enchantments have positive multipliers', () => {
      for (const [id, enchant] of enchantments) {
        expect(enchant.bookMultiplier, `${id}: bookMultiplier must be positive`).toBeGreaterThan(0);
        expect(enchant.itemMultiplier, `${id}: itemMultiplier must be positive`).toBeGreaterThan(0);
      }
    });

    it('all enchantments have valid applicableTo items', () => {
      for (const [id, enchant] of enchantments) {
        expect(enchant.applicableTo.length, `${id}: applicableTo cannot be empty`).toBeGreaterThan(0);
        for (const item of enchant.applicableTo) {
          expect(
            VALID_ITEM_TYPES,
            `${id}: invalid applicableTo item '${item}'`
          ).toContain(item);
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // levelStats Validation
  // ─────────────────────────────────────────────────────────────

  describe('levelStats validation', () => {
    it('levelStats length matches maxLevel', () => {
      for (const [id, enchant] of enchantments) {
        expect(
          enchant.levelStats.length,
          `${id}: levelStats length (${enchant.levelStats.length}) does not match maxLevel (${enchant.maxLevel})`
        ).toBe(enchant.maxLevel);
      }
    });

    it('levelStats have sequential level numbers', () => {
      for (const [id, enchant] of enchantments) {
        for (let i = 0; i < enchant.levelStats.length; i++) {
          expect(
            enchant.levelStats[i].level,
            `${id}: levelStats[${i}].level should be ${i + 1}`
          ).toBe(i + 1);
        }
      }
    });

    it('levelStats have non-empty effect descriptions', () => {
      for (const [id, enchant] of enchantments) {
        for (const stat of enchant.levelStats) {
          expect(
            stat.effect.length,
            `${id}: levelStats[${stat.level}].effect cannot be empty`
          ).toBeGreaterThan(0);
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Conflicts Validation
  // ─────────────────────────────────────────────────────────────

  describe('conflicts validation', () => {
    it('all conflicts reference valid enchantment IDs', () => {
      for (const [id, enchant] of enchantments) {
        if (!enchant.conflicts) continue;

        for (const conflict of enchant.conflicts) {
          expect(
            VALID_ENCHANTMENT_IDS,
            `${id}: conflict '${conflict}' is not a valid enchantment ID`
          ).toContain(conflict);
        }
      }
    });

    it('enchantments do not conflict with themselves', () => {
      for (const [id, enchant] of enchantments) {
        if (!enchant.conflicts) continue;

        expect(
          enchant.conflicts,
          `${id}: cannot conflict with itself`
        ).not.toContain(id);
      }
    });

    it('conflicts are symmetric (if A conflicts with B, B should conflict with A)', () => {
      const symmetryIssues: string[] = [];

      for (const [id, enchant] of enchantments) {
        if (!enchant.conflicts) continue;

        for (const conflict of enchant.conflicts) {
          const conflictingEnchant = enchantments.get(conflict);
          // Only check if the conflicting enchantment exists in our content
          if (conflictingEnchant && conflictingEnchant.conflicts) {
            if (!conflictingEnchant.conflicts.includes(id)) {
              symmetryIssues.push(
                `${id} conflicts with ${conflict}, but ${conflict} does not conflict with ${id}`
              );
            }
          }
        }
      }

      expect(symmetryIssues, symmetryIssues.join('\n')).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Data Consistency
  // ─────────────────────────────────────────────────────────────

  describe('data consistency', () => {
    it('no duplicate enchantment IDs', () => {
      const ids = new Set<string>();
      const duplicates: string[] = [];

      for (const file of enchantmentFiles) {
        const parsed = parseFrontmatter(file);
        if (parsed) {
          if (ids.has(parsed.id)) {
            duplicates.push(parsed.id);
          }
          ids.add(parsed.id);
        }
      }

      expect(duplicates, `Duplicate IDs found: ${duplicates.join(', ')}`).toHaveLength(0);
    });

    it('filename matches id (category/id.md)', () => {
      for (const file of enchantmentFiles) {
        const parsed = parseFrontmatter(file);
        if (parsed) {
          const filename = file.split('/').pop()?.replace('.md', '');
          expect(
            filename,
            `File ${file} should be named ${parsed.id}.md`
          ).toBe(parsed.id);
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Minimum Content Check
  // ─────────────────────────────────────────────────────────────

  describe('minimum content', () => {
    const requiredEnchantments = [
      'sharpness',
      'smite',
      'unbreaking',
      'mending',
      'looting',
      'fire_aspect',
      'efficiency',
      'fortune',
      'silk_touch',
    ];

    it.each(requiredEnchantments)('has %s enchantment', (enchantId) => {
      expect(enchantments.has(enchantId), `Missing required enchantment: ${enchantId}`).toBe(true);
    });
  });
});
