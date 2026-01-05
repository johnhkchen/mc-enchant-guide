/**
 * Mock rules data for testing the RulesEngine.
 */

import type {
  Rule,
  ConditionalConflictRule,
  MaxLevelOverrideRule,
  CostModifierRule,
  ItemRestrictionRule,
} from '../../src/data/rules/types.js';

// ─────────────────────────────────────────────────────────────
// Conditional Conflict Rules
// ─────────────────────────────────────────────────────────────

export const mendingInfinityConflict: ConditionalConflictRule = {
  id: 'mending-infinity-bow',
  type: 'conditional_conflict',
  description: 'Mending and Infinity conflict only on bows',
  enchantments: ['mending', 'infinity'],
  condition: {
    item_types: ['bow'],
  },
};

export const silkTouchFortuneConflict: ConditionalConflictRule = {
  id: 'silk-touch-fortune-tools',
  type: 'conditional_conflict',
  description: 'Silk Touch and Fortune conflict on tools',
  enchantments: ['silk_touch', 'fortune'],
  condition: {
    item_types: ['pickaxe', 'axe', 'shovel', 'hoe'],
  },
};

export const depthStriderFrostWalkerConflict: ConditionalConflictRule = {
  id: 'depth-strider-frost-walker-boots',
  type: 'conditional_conflict',
  description: 'Depth Strider and Frost Walker conflict on boots',
  enchantments: ['depth_strider', 'frost_walker'],
  condition: {
    item_types: ['boots'],
  },
};

export const riptideLoyaltyConflict: ConditionalConflictRule = {
  id: 'riptide-loyalty-trident',
  type: 'conditional_conflict',
  description: 'Riptide and Loyalty conflict on tridents',
  enchantments: ['riptide', 'loyalty'],
  condition: {
    item_types: ['trident'],
  },
};

export const multishotPiercingConflict: ConditionalConflictRule = {
  id: 'multishot-piercing-crossbow',
  type: 'conditional_conflict',
  description: 'Multishot and Piercing conflict on crossbows',
  enchantments: ['multishot', 'piercing'],
  condition: {
    item_types: ['crossbow'],
  },
};

// ─────────────────────────────────────────────────────────────
// Max Level Override Rules
// ─────────────────────────────────────────────────────────────

export const soulSpeedMaxLevel: MaxLevelOverrideRule = {
  id: 'soul-speed-max',
  type: 'max_level_override',
  description: 'Soul Speed has a maximum level of 3',
  enchantment: 'soul_speed',
  max_level: 3,
};

export const swiftSneakMaxLevel: MaxLevelOverrideRule = {
  id: 'swift-sneak-max',
  type: 'max_level_override',
  description: 'Swift Sneak has a maximum level of 3',
  enchantment: 'swift_sneak',
  max_level: 3,
};

// ─────────────────────────────────────────────────────────────
// Cost Modifier Rules
// ─────────────────────────────────────────────────────────────

export const treasureEnchantCost: CostModifierRule = {
  id: 'treasure-enchant-cost',
  type: 'cost_modifier',
  description: 'Treasure enchantments have higher book multipliers',
  enchantments: ['mending', 'frost_walker', 'soul_speed', 'swift_sneak'],
  modifier: {
    book_multiplier_add: 1,
  },
};

export const expensiveEnchantCost: CostModifierRule = {
  id: 'expensive-enchant-test',
  type: 'cost_modifier',
  description: 'Test rule with multiplicative modifier',
  enchantments: ['infinity'],
  modifier: {
    book_multiplier_add: 2,
    book_multiplier_mult: 1.5,
  },
};

// ─────────────────────────────────────────────────────────────
// Item Restriction Rules
// ─────────────────────────────────────────────────────────────

export const curseBindingRestriction: ItemRestrictionRule = {
  id: 'curse-binding-wearables',
  type: 'item_restriction',
  description: 'Curse of Binding only applies to wearable items',
  enchantment: 'curse_of_binding',
  allowed_items: ['helmet', 'chestplate', 'leggings', 'boots', 'elytra'],
};

export const sweepingEdgeRestriction: ItemRestrictionRule = {
  id: 'sweeping-edge-java-only',
  type: 'item_restriction',
  description: 'Sweeping Edge is Java Edition only, swords only',
  enchantment: 'sweeping_edge',
  allowed_items: ['sword'],
  condition: {
    edition: 'java',
  },
};

export const blockedItemRestriction: ItemRestrictionRule = {
  id: 'test-blocked-items',
  type: 'item_restriction',
  description: 'Test rule with blocked items',
  enchantment: 'thorns',
  blocked_items: ['elytra', 'shield'],
};

// ─────────────────────────────────────────────────────────────
// Disabled Rule (for testing enabled flag)
// ─────────────────────────────────────────────────────────────

export const disabledConflictRule: ConditionalConflictRule = {
  id: 'disabled-conflict',
  type: 'conditional_conflict',
  description: 'This rule is disabled',
  enchantments: ['sharpness', 'smite'],
  condition: {
    item_types: ['sword'],
  },
  enabled: false,
};

// ─────────────────────────────────────────────────────────────
// Rule Collections
// ─────────────────────────────────────────────────────────────

export const allConflictRules: ConditionalConflictRule[] = [
  mendingInfinityConflict,
  silkTouchFortuneConflict,
  depthStriderFrostWalkerConflict,
  riptideLoyaltyConflict,
  multishotPiercingConflict,
];

export const allMaxLevelRules: MaxLevelOverrideRule[] = [
  soulSpeedMaxLevel,
  swiftSneakMaxLevel,
];

export const allCostModifierRules: CostModifierRule[] = [
  treasureEnchantCost,
  expensiveEnchantCost,
];

export const allItemRestrictionRules: ItemRestrictionRule[] = [
  curseBindingRestriction,
  sweepingEdgeRestriction,
  blockedItemRestriction,
];

export const allMockRules: Rule[] = [
  ...allConflictRules,
  ...allMaxLevelRules,
  ...allCostModifierRules,
  ...allItemRestrictionRules,
];

export const mockRulesWithDisabled: Rule[] = [
  ...allMockRules,
  disabledConflictRule,
];
