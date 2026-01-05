// src/data/rules/index.ts
// Rules engine for handling enchantment edge cases

import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { BaseItemType, EnchantmentId } from '../../types/index.js';
import type {
  Rule,
  PatchFile,
  ConditionalConflictRule,
  MaxLevelOverrideRule,
  CostModifierRule,
  ItemRestrictionRule,
  CostModifier,
} from './types.js';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CostModifierResult {
  bookMultiplierAdd: number;
  bookMultiplierMult: number;
}

type ConflictCacheKey = `${string}:${string}:${string}`;

// ─────────────────────────────────────────────────────────────
// RulesEngine Class
// ─────────────────────────────────────────────────────────────

export class RulesEngine {
  private rules: Rule[];
  private conflictCache: Map<ConflictCacheKey, boolean>;
  private maxLevelOverrides: Map<EnchantmentId, number>;
  private costModifiers: Map<EnchantmentId, CostModifier>;
  private itemRestrictions: Map<EnchantmentId, ItemRestrictionRule>;

  constructor(rules: Rule[] = []) {
    this.rules = rules.filter((r) => r.enabled !== false);
    this.conflictCache = new Map();
    this.maxLevelOverrides = new Map();
    this.costModifiers = new Map();
    this.itemRestrictions = new Map();

    this.buildCaches();
  }

  /**
   * Build lookup caches from rules for O(1) access.
   */
  private buildCaches(): void {
    for (const rule of this.rules) {
      switch (rule.type) {
        case 'conditional_conflict':
          this.cacheConflictRule(rule as ConditionalConflictRule);
          break;
        case 'max_level_override':
          this.cacheMaxLevelRule(rule as MaxLevelOverrideRule);
          break;
        case 'cost_modifier':
          this.cacheCostModifierRule(rule as CostModifierRule);
          break;
        case 'item_restriction':
          this.cacheItemRestrictionRule(rule as ItemRestrictionRule);
          break;
      }
    }
  }

  private cacheConflictRule(rule: ConditionalConflictRule): void {
    const [enchantA, enchantB] = rule.enchantments;
    const itemTypes = rule.condition?.item_types ?? [];

    for (const itemType of itemTypes) {
      // Cache both directions for symmetric lookup
      const keyAB = this.conflictKey(enchantA, enchantB, itemType);
      const keyBA = this.conflictKey(enchantB, enchantA, itemType);
      this.conflictCache.set(keyAB, true);
      this.conflictCache.set(keyBA, true);
    }
  }

  private cacheMaxLevelRule(rule: MaxLevelOverrideRule): void {
    this.maxLevelOverrides.set(rule.enchantment, rule.max_level);
  }

  private cacheCostModifierRule(rule: CostModifierRule): void {
    for (const enchantId of rule.enchantments) {
      this.costModifiers.set(enchantId, rule.modifier);
    }
  }

  private cacheItemRestrictionRule(rule: ItemRestrictionRule): void {
    this.itemRestrictions.set(rule.enchantment, rule);
  }

  private conflictKey(
    enchantA: EnchantmentId,
    enchantB: EnchantmentId,
    itemType: BaseItemType
  ): ConflictCacheKey {
    return `${enchantA}:${enchantB}:${itemType}`;
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if two enchantments conflict on a given item type.
   * Considers both base conflicts (from enchantment definitions) and
   * conditional conflicts (from rules).
   *
   * @param enchantA First enchantment ID
   * @param enchantB Second enchantment ID
   * @param itemType The item type being enchanted
   * @param baseConflicts Conflicts defined in enchantment data
   * @returns true if the enchantments conflict
   */
  hasConflict(
    enchantA: EnchantmentId,
    enchantB: EnchantmentId,
    itemType: BaseItemType,
    baseConflicts: EnchantmentId[]
  ): boolean {
    // Same enchantment never conflicts with itself in this context
    if (enchantA === enchantB) {
      return false;
    }

    // Check base conflicts first (always apply)
    if (baseConflicts.includes(enchantB)) {
      return true;
    }

    // Check conditional conflicts from rules
    const key = this.conflictKey(enchantA, enchantB, itemType);
    return this.conflictCache.has(key);
  }

  /**
   * Get the effective max level for an enchantment.
   * Returns the override value if one exists, otherwise the base max level.
   *
   * @param enchantId Enchantment ID
   * @param baseMaxLevel Default max level from enchantment definition
   * @returns Effective max level
   */
  getMaxLevel(enchantId: EnchantmentId, baseMaxLevel: number): number {
    const override = this.maxLevelOverrides.get(enchantId);
    return override ?? baseMaxLevel;
  }

  /**
   * Get cost modifiers for an enchantment.
   * Returns additive and multiplicative modifiers for book multiplier.
   *
   * @param enchantId Enchantment ID
   * @returns Cost modifier values (defaults to 0 add, 1 mult)
   */
  getCostModifier(enchantId: EnchantmentId): CostModifierResult {
    const modifier = this.costModifiers.get(enchantId);
    return {
      bookMultiplierAdd: modifier?.book_multiplier_add ?? 0,
      bookMultiplierMult: modifier?.book_multiplier_mult ?? 1,
    };
  }

  /**
   * Check if an enchantment can be applied to a given item type.
   * Uses item restriction rules to enforce allowed/blocked items.
   *
   * @param enchantId Enchantment ID
   * @param itemType The item type to check
   * @returns true if the enchantment can be applied
   */
  canApplyTo(enchantId: EnchantmentId, itemType: BaseItemType): boolean {
    const restriction = this.itemRestrictions.get(enchantId);

    if (!restriction) {
      // No restriction rule means no additional restrictions
      return true;
    }

    // Check blocked items first (blacklist)
    if (restriction.blocked_items?.includes(itemType)) {
      return false;
    }

    // Check allowed items (whitelist) if specified
    if (restriction.allowed_items) {
      return restriction.allowed_items.includes(itemType);
    }

    // No whitelist means allowed by default
    return true;
  }

  /**
   * Get the number of loaded rules.
   */
  get ruleCount(): number {
    return this.rules.length;
  }
}

// ─────────────────────────────────────────────────────────────
// Load Rules from YAML
// ─────────────────────────────────────────────────────────────

function loadRulesFromYaml(): Rule[] {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const yamlPath = join(__dirname, 'patches.yaml');
    const content = readFileSync(yamlPath, 'utf-8');
    const patchFile = parseYaml(content) as PatchFile;
    return patchFile.rules ?? [];
  } catch (error) {
    // In browser or if file not found, return empty rules
    console.warn('Could not load rules from patches.yaml:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────

export const rulesEngine = new RulesEngine(loadRulesFromYaml());

// Re-export types for convenience
export type { Rule, PatchFile } from './types.js';
