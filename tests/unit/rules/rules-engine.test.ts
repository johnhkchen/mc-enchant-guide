/**
 * Unit tests for the RulesEngine.
 *
 * Tests cover:
 * - Conditional conflict detection (mending+infinity on bow)
 * - Conditional conflict ignored on other items
 * - Base conflicts respected
 * - Bidirectional conflict check
 * - Max level overrides
 * - Cost modifiers
 * - Item restrictions (allowed/blocked items)
 * - Disabled rules ignored
 * - Empty rules handled
 */

import { describe, it, expect } from 'vitest';
import { RulesEngine } from '../../../src/data/rules/index.js';
import type { EnchantmentId, BaseItemType } from '../../../src/types/index.js';
import {
  mendingInfinityConflict,
  silkTouchFortuneConflict,
  depthStriderFrostWalkerConflict,
  riptideLoyaltyConflict,
  multishotPiercingConflict,
  soulSpeedMaxLevel,
  swiftSneakMaxLevel,
  treasureEnchantCost,
  expensiveEnchantCost,
  curseBindingRestriction,
  sweepingEdgeRestriction,
  blockedItemRestriction,
  disabledConflictRule,
  allMockRules,
  mockRulesWithDisabled,
} from '../../fixtures/rules.js';

describe('RulesEngine', () => {
  // ─────────────────────────────────────────────────────────────
  // Constructor & Initialization
  // ─────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('initializes with empty rules', () => {
      const engine = new RulesEngine([]);
      expect(engine.ruleCount).toBe(0);
    });

    it('initializes with provided rules', () => {
      const engine = new RulesEngine(allMockRules);
      expect(engine.ruleCount).toBe(allMockRules.length);
    });

    it('filters out disabled rules', () => {
      const engine = new RulesEngine(mockRulesWithDisabled);
      // One rule is disabled, so count should be one less
      expect(engine.ruleCount).toBe(allMockRules.length);
    });

    it('handles undefined rules parameter', () => {
      const engine = new RulesEngine();
      expect(engine.ruleCount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // hasConflict - Conditional Conflicts
  // ─────────────────────────────────────────────────────────────

  describe('hasConflict - conditional conflicts', () => {
    it('detects mending+infinity conflict on bow', () => {
      const engine = new RulesEngine([mendingInfinityConflict]);

      expect(
        engine.hasConflict('mending', 'infinity', 'bow', [])
      ).toBe(true);
    });

    it('detects infinity+mending conflict on bow (bidirectional)', () => {
      const engine = new RulesEngine([mendingInfinityConflict]);

      expect(
        engine.hasConflict('infinity', 'mending', 'bow', [])
      ).toBe(true);
    });

    it('ignores mending+infinity conflict on sword (different item)', () => {
      const engine = new RulesEngine([mendingInfinityConflict]);

      expect(
        engine.hasConflict('mending', 'infinity', 'sword', [])
      ).toBe(false);
    });

    it('ignores mending+infinity conflict on crossbow', () => {
      const engine = new RulesEngine([mendingInfinityConflict]);

      expect(
        engine.hasConflict('mending', 'infinity', 'crossbow', [])
      ).toBe(false);
    });

    it('detects silk_touch+fortune conflict on pickaxe', () => {
      const engine = new RulesEngine([silkTouchFortuneConflict]);

      expect(
        engine.hasConflict('silk_touch', 'fortune', 'pickaxe', [])
      ).toBe(true);
    });

    it('detects fortune+silk_touch conflict on axe (bidirectional)', () => {
      const engine = new RulesEngine([silkTouchFortuneConflict]);

      expect(
        engine.hasConflict('fortune', 'silk_touch', 'axe', [])
      ).toBe(true);
    });

    it('ignores silk_touch+fortune conflict on sword', () => {
      const engine = new RulesEngine([silkTouchFortuneConflict]);

      expect(
        engine.hasConflict('silk_touch', 'fortune', 'sword', [])
      ).toBe(false);
    });

    it('detects depth_strider+frost_walker conflict on boots', () => {
      const engine = new RulesEngine([depthStriderFrostWalkerConflict]);

      expect(
        engine.hasConflict('depth_strider', 'frost_walker', 'boots', [])
      ).toBe(true);
    });

    it('ignores depth_strider+frost_walker conflict on leggings', () => {
      const engine = new RulesEngine([depthStriderFrostWalkerConflict]);

      expect(
        engine.hasConflict('depth_strider', 'frost_walker', 'leggings', [])
      ).toBe(false);
    });

    it('detects riptide+loyalty conflict on trident', () => {
      const engine = new RulesEngine([riptideLoyaltyConflict]);

      expect(
        engine.hasConflict('riptide', 'loyalty', 'trident', [])
      ).toBe(true);
    });

    it('detects multishot+piercing conflict on crossbow', () => {
      const engine = new RulesEngine([multishotPiercingConflict]);

      expect(
        engine.hasConflict('multishot', 'piercing', 'crossbow', [])
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // hasConflict - Base Conflicts
  // ─────────────────────────────────────────────────────────────

  describe('hasConflict - base conflicts', () => {
    it('respects base conflicts from enchantment definitions', () => {
      const engine = new RulesEngine([]);
      const baseConflicts: EnchantmentId[] = ['smite', 'bane_of_arthropods'];

      expect(
        engine.hasConflict('sharpness', 'smite', 'sword', baseConflicts)
      ).toBe(true);
    });

    it('respects base conflicts regardless of item type', () => {
      const engine = new RulesEngine([]);
      const baseConflicts: EnchantmentId[] = ['smite'];

      expect(
        engine.hasConflict('sharpness', 'smite', 'axe', baseConflicts)
      ).toBe(true);
    });

    it('returns false when no base conflict and no conditional conflict', () => {
      const engine = new RulesEngine([]);

      expect(
        engine.hasConflict('sharpness', 'looting', 'sword', [])
      ).toBe(false);
    });

    it('returns false for same enchantment check', () => {
      const engine = new RulesEngine([]);

      expect(
        engine.hasConflict('sharpness', 'sharpness', 'sword', ['sharpness'])
      ).toBe(false);
    });

    it('handles multiple base conflicts', () => {
      const engine = new RulesEngine([]);
      const baseConflicts: EnchantmentId[] = ['fire_protection', 'blast_protection', 'projectile_protection'];

      expect(
        engine.hasConflict('protection', 'fire_protection', 'chestplate', baseConflicts)
      ).toBe(true);

      expect(
        engine.hasConflict('protection', 'blast_protection', 'chestplate', baseConflicts)
      ).toBe(true);

      expect(
        engine.hasConflict('protection', 'unbreaking', 'chestplate', baseConflicts)
      ).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // hasConflict - Combined Base + Conditional
  // ─────────────────────────────────────────────────────────────

  describe('hasConflict - combined scenarios', () => {
    it('detects conflict from either base or conditional rules', () => {
      const engine = new RulesEngine([mendingInfinityConflict]);
      const baseConflicts: EnchantmentId[] = ['smite'];

      // Base conflict
      expect(
        engine.hasConflict('sharpness', 'smite', 'sword', baseConflicts)
      ).toBe(true);

      // Conditional conflict
      expect(
        engine.hasConflict('mending', 'infinity', 'bow', [])
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getMaxLevel
  // ─────────────────────────────────────────────────────────────

  describe('getMaxLevel', () => {
    it('returns override value for soul_speed', () => {
      const engine = new RulesEngine([soulSpeedMaxLevel]);

      expect(engine.getMaxLevel('soul_speed', 5)).toBe(3);
    });

    it('returns override value for swift_sneak', () => {
      const engine = new RulesEngine([swiftSneakMaxLevel]);

      expect(engine.getMaxLevel('swift_sneak', 5)).toBe(3);
    });

    it('returns base value when no override exists', () => {
      const engine = new RulesEngine([soulSpeedMaxLevel]);

      expect(engine.getMaxLevel('sharpness', 5)).toBe(5);
    });

    it('returns base value with empty rules', () => {
      const engine = new RulesEngine([]);

      expect(engine.getMaxLevel('efficiency', 5)).toBe(5);
    });

    it('handles multiple override rules', () => {
      const engine = new RulesEngine([soulSpeedMaxLevel, swiftSneakMaxLevel]);

      expect(engine.getMaxLevel('soul_speed', 5)).toBe(3);
      expect(engine.getMaxLevel('swift_sneak', 5)).toBe(3);
      expect(engine.getMaxLevel('mending', 1)).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getCostModifier
  // ─────────────────────────────────────────────────────────────

  describe('getCostModifier', () => {
    it('returns additive modifier for mending', () => {
      const engine = new RulesEngine([treasureEnchantCost]);
      const modifier = engine.getCostModifier('mending');

      expect(modifier.bookMultiplierAdd).toBe(1);
      expect(modifier.bookMultiplierMult).toBe(1); // Default
    });

    it('returns additive modifier for frost_walker', () => {
      const engine = new RulesEngine([treasureEnchantCost]);
      const modifier = engine.getCostModifier('frost_walker');

      expect(modifier.bookMultiplierAdd).toBe(1);
    });

    it('returns both additive and multiplicative modifiers', () => {
      const engine = new RulesEngine([expensiveEnchantCost]);
      const modifier = engine.getCostModifier('infinity');

      expect(modifier.bookMultiplierAdd).toBe(2);
      expect(modifier.bookMultiplierMult).toBe(1.5);
    });

    it('returns default values when no modifier exists', () => {
      const engine = new RulesEngine([treasureEnchantCost]);
      const modifier = engine.getCostModifier('sharpness');

      expect(modifier.bookMultiplierAdd).toBe(0);
      expect(modifier.bookMultiplierMult).toBe(1);
    });

    it('returns default values with empty rules', () => {
      const engine = new RulesEngine([]);
      const modifier = engine.getCostModifier('efficiency');

      expect(modifier.bookMultiplierAdd).toBe(0);
      expect(modifier.bookMultiplierMult).toBe(1);
    });

    it('handles multiple enchantments in one rule', () => {
      const engine = new RulesEngine([treasureEnchantCost]);

      expect(engine.getCostModifier('mending').bookMultiplierAdd).toBe(1);
      expect(engine.getCostModifier('frost_walker').bookMultiplierAdd).toBe(1);
      expect(engine.getCostModifier('soul_speed').bookMultiplierAdd).toBe(1);
      expect(engine.getCostModifier('swift_sneak').bookMultiplierAdd).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // canApplyTo
  // ─────────────────────────────────────────────────────────────

  describe('canApplyTo', () => {
    it('allows curse_of_binding on helmet', () => {
      const engine = new RulesEngine([curseBindingRestriction]);

      expect(engine.canApplyTo('curse_of_binding', 'helmet')).toBe(true);
    });

    it('allows curse_of_binding on elytra', () => {
      const engine = new RulesEngine([curseBindingRestriction]);

      expect(engine.canApplyTo('curse_of_binding', 'elytra')).toBe(true);
    });

    it('blocks curse_of_binding on sword', () => {
      const engine = new RulesEngine([curseBindingRestriction]);

      expect(engine.canApplyTo('curse_of_binding', 'sword')).toBe(false);
    });

    it('blocks curse_of_binding on pickaxe', () => {
      const engine = new RulesEngine([curseBindingRestriction]);

      expect(engine.canApplyTo('curse_of_binding', 'pickaxe')).toBe(false);
    });

    it('allows sweeping_edge on sword', () => {
      const engine = new RulesEngine([sweepingEdgeRestriction]);

      expect(engine.canApplyTo('sweeping_edge', 'sword')).toBe(true);
    });

    it('blocks sweeping_edge on axe', () => {
      const engine = new RulesEngine([sweepingEdgeRestriction]);

      expect(engine.canApplyTo('sweeping_edge', 'axe')).toBe(false);
    });

    it('blocks thorns on blocked items', () => {
      const engine = new RulesEngine([blockedItemRestriction]);

      expect(engine.canApplyTo('thorns', 'elytra')).toBe(false);
      expect(engine.canApplyTo('thorns', 'shield')).toBe(false);
    });

    it('allows thorns on non-blocked items', () => {
      const engine = new RulesEngine([blockedItemRestriction]);

      expect(engine.canApplyTo('thorns', 'chestplate')).toBe(true);
      expect(engine.canApplyTo('thorns', 'helmet')).toBe(true);
    });

    it('returns true when no restriction exists', () => {
      const engine = new RulesEngine([curseBindingRestriction]);

      expect(engine.canApplyTo('sharpness', 'sword')).toBe(true);
    });

    it('returns true with empty rules', () => {
      const engine = new RulesEngine([]);

      expect(engine.canApplyTo('efficiency', 'pickaxe')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Disabled Rules
  // ─────────────────────────────────────────────────────────────

  describe('disabled rules', () => {
    it('ignores disabled conflict rules', () => {
      const engine = new RulesEngine([disabledConflictRule]);

      // The disabled rule would make sharpness+smite conflict on sword
      // But since it's disabled, it should not conflict
      expect(
        engine.hasConflict('sharpness', 'smite', 'sword', [])
      ).toBe(false);
    });

    it('counts only enabled rules', () => {
      const engine = new RulesEngine([
        mendingInfinityConflict,
        disabledConflictRule,
      ]);

      expect(engine.ruleCount).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty base conflicts array', () => {
      const engine = new RulesEngine([]);

      expect(
        engine.hasConflict('sharpness', 'looting', 'sword', [])
      ).toBe(false);
    });

    it('handles multiple rules of different types', () => {
      const engine = new RulesEngine(allMockRules);

      // Conditional conflict
      expect(
        engine.hasConflict('mending', 'infinity', 'bow', [])
      ).toBe(true);

      // Max level override
      expect(engine.getMaxLevel('soul_speed', 5)).toBe(3);

      // Cost modifier
      expect(engine.getCostModifier('mending').bookMultiplierAdd).toBe(1);

      // Item restriction
      expect(engine.canApplyTo('curse_of_binding', 'helmet')).toBe(true);
      expect(engine.canApplyTo('curse_of_binding', 'sword')).toBe(false);
    });

    it('handles rules with no condition', () => {
      const ruleWithNoCondition = {
        id: 'no-condition-max-level',
        type: 'max_level_override' as const,
        enchantment: 'efficiency' as EnchantmentId,
        max_level: 4,
      };
      const engine = new RulesEngine([ruleWithNoCondition]);

      expect(engine.getMaxLevel('efficiency', 5)).toBe(4);
    });

    it('handles cost modifier with only multiplicative value', () => {
      const multOnlyRule = {
        id: 'mult-only',
        type: 'cost_modifier' as const,
        enchantments: ['power' as EnchantmentId],
        modifier: {
          book_multiplier_mult: 2,
        },
      };
      const engine = new RulesEngine([multOnlyRule]);
      const modifier = engine.getCostModifier('power');

      expect(modifier.bookMultiplierAdd).toBe(0);
      expect(modifier.bookMultiplierMult).toBe(2);
    });

    it('handles conditional conflict with empty item_types', () => {
      const emptyItemTypesRule = {
        id: 'empty-item-types',
        type: 'conditional_conflict' as const,
        enchantments: ['sharpness', 'smite'] as [EnchantmentId, EnchantmentId],
        condition: {
          item_types: [] as BaseItemType[],
        },
      };
      const engine = new RulesEngine([emptyItemTypesRule]);

      // Should not conflict on any item since item_types is empty
      expect(
        engine.hasConflict('sharpness', 'smite', 'sword', [])
      ).toBe(false);
    });
  });
});
