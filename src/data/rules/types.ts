// src/data/rules/types.ts
// Rule type definitions for the patch/rules engine

import type { BaseItemType, EnchantmentId } from '../../types/index.js';

// ─────────────────────────────────────────────────────────────
// Rule Type Definitions
// ─────────────────────────────────────────────────────────────

export type RuleType =
  | 'conditional_conflict'
  | 'override_conflict'
  | 'max_level_override'
  | 'cost_modifier'
  | 'item_restriction'
  | 'custom_validation';

export type Edition = 'java' | 'bedrock' | 'both';

export interface RuleCondition {
  item_types?: BaseItemType[];
  edition?: Edition;
  min_version?: string;
  max_version?: string;
}

export interface BaseRule {
  id: string;
  type: RuleType;
  description?: string;
  condition?: RuleCondition;
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Specific Rule Types
// ─────────────────────────────────────────────────────────────

/**
 * Enchantments conflict only under specific conditions (e.g., on certain item types).
 * Example: Mending and Infinity conflict only on bows.
 */
export interface ConditionalConflictRule extends BaseRule {
  type: 'conditional_conflict';
  enchantments: [EnchantmentId, EnchantmentId];
}

/**
 * Removes an existing conflict in a specific context.
 * Used for future-proofing or edition-specific overrides.
 */
export interface OverrideConflictRule extends BaseRule {
  type: 'override_conflict';
  enchantments: [EnchantmentId, EnchantmentId];
  remove_conflict: boolean;
}

/**
 * Overrides the maximum level for an enchantment on specific items.
 * Example: Soul Speed has a max of III.
 */
export interface MaxLevelOverrideRule extends BaseRule {
  type: 'max_level_override';
  enchantment: EnchantmentId;
  max_level: number;
}

/**
 * Modifier applied to anvil cost calculations.
 */
export interface CostModifier {
  book_multiplier_add?: number;
  book_multiplier_mult?: number;
  item_multiplier_add?: number;
  item_multiplier_mult?: number;
}

/**
 * Adjusts anvil cost for specific enchantments.
 * Example: Treasure enchants have a surcharge.
 */
export interface CostModifierRule extends BaseRule {
  type: 'cost_modifier';
  enchantments: EnchantmentId[];
  modifier: CostModifier;
}

/**
 * Restricts which items an enchantment can be applied to.
 * Can specify allowed_items (whitelist) or blocked_items (blacklist).
 */
export interface ItemRestrictionRule extends BaseRule {
  type: 'item_restriction';
  enchantment: EnchantmentId;
  allowed_items?: BaseItemType[];
  blocked_items?: BaseItemType[];
}

/**
 * Escape hatch for complex validation logic that can't be expressed declaratively.
 * The validator function name references a registered handler.
 */
export interface CustomValidationRule extends BaseRule {
  type: 'custom_validation';
  validator: string;  // Name of registered validator function
  params?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Union Type & Patch File
// ─────────────────────────────────────────────────────────────

export type Rule =
  | ConditionalConflictRule
  | OverrideConflictRule
  | MaxLevelOverrideRule
  | CostModifierRule
  | ItemRestrictionRule
  | CustomValidationRule;

export interface PatchFile {
  version: string;
  minecraft_version?: string;
  edition?: Edition;
  rules: Rule[];
}
