// tests/unit/engine/optimizer.test.ts
// Unit tests for the optimizer engine
// Reference: https://minecraft.wiki/w/Anvil_mechanics

import { describe, it, expect, beforeEach } from 'vitest';
import {
  pwpCost,
  calculateCombineCost,
  computeOptimalTree,
  computeRecipe,
  isRecipeValid,
  _resetNodeIdCounter,
  _tryLinearOrder,
  type WorkItem,
  type EnchantmentSpec,
} from '../../../src/engine/optimizer';
import type { CraftingTreeNode } from '../../../src/types/index';
import { levelToXp } from '../../../src/engine/xp-calc';

// ─────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────

function createTestWorkItem(
  id: string,
  enchantments: { id: string; level: number }[],
  pwp: number,
  isBaseItem: boolean = false
): WorkItem {
  return {
    id,
    enchantments: enchantments as { id: any; level: number }[],
    pwp,
    isBaseItem,
    displayName: id,
    treeNode: { id: 'test', type: 'leaf' },
  };
}

function countNodes(tree: CraftingTreeNode): number {
  if (tree.type === 'leaf') return 1;
  return 1 + countNodes(tree.left!) + countNodes(tree.right!);
}

function countCombineNodes(tree: CraftingTreeNode): number {
  if (tree.type === 'leaf') return 0;
  return 1 + countCombineNodes(tree.left!) + countCombineNodes(tree.right!);
}

function getAllStepCosts(tree: CraftingTreeNode): number[] {
  const costs: number[] = [];
  function traverse(node: CraftingTreeNode): void {
    if (node.type === 'combine' && node.levelCost !== undefined) {
      costs.push(node.levelCost);
    }
    if (node.left) traverse(node.left);
    if (node.right) traverse(node.right);
  }
  traverse(tree);
  return costs;
}

// ─────────────────────────────────────────────────────────────
// PWP Cost Tests
// ─────────────────────────────────────────────────────────────

describe('pwpCost', () => {
  it('returns 0 for PWP count of 0', () => {
    expect(pwpCost(0)).toBe(0);
  });

  it('returns 1 for PWP count of 1', () => {
    expect(pwpCost(1)).toBe(1);
  });

  it('returns 3 for PWP count of 2', () => {
    expect(pwpCost(2)).toBe(3);
  });

  it('returns 7 for PWP count of 3', () => {
    expect(pwpCost(3)).toBe(7);
  });

  it('returns 15 for PWP count of 4', () => {
    expect(pwpCost(4)).toBe(15);
  });

  it('returns 31 for PWP count of 5', () => {
    expect(pwpCost(5)).toBe(31);
  });

  it('returns 63 for PWP count of 6 (Too Expensive)', () => {
    expect(pwpCost(6)).toBe(63);
  });

  it('follows formula 2^n - 1', () => {
    for (let n = 0; n <= 10; n++) {
      expect(pwpCost(n)).toBe(Math.pow(2, n) - 1);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Calculate Combine Cost Tests
// ─────────────────────────────────────────────────────────────

describe('calculateCombineCost', () => {
  describe('PWP contributions', () => {
    it('calculates cost with both items at PWP 0', () => {
      const target = createTestWorkItem('target', [], 0);
      const sacrifice = createTestWorkItem('sacrifice', [], 0);
      // PWP cost: 0 + 0 = 0, no enchantments = 0
      expect(calculateCombineCost(target, sacrifice)).toBe(0);
    });

    it('calculates cost with target PWP 1, sacrifice PWP 0', () => {
      const target = createTestWorkItem('target', [], 1);
      const sacrifice = createTestWorkItem('sacrifice', [], 0);
      // PWP cost: 1 + 0 = 1
      expect(calculateCombineCost(target, sacrifice)).toBe(1);
    });

    it('calculates cost with both items at PWP 2', () => {
      const target = createTestWorkItem('target', [], 2);
      const sacrifice = createTestWorkItem('sacrifice', [], 2);
      // PWP cost: 3 + 3 = 6
      expect(calculateCombineCost(target, sacrifice)).toBe(6);
    });

    it('calculates cost with high PWP values', () => {
      const target = createTestWorkItem('target', [], 4);
      const sacrifice = createTestWorkItem('sacrifice', [], 3);
      // PWP cost: 15 + 7 = 22
      expect(calculateCombineCost(target, sacrifice)).toBe(22);
    });
  });

  describe('enchantment costs from book sacrifice', () => {
    it('adds sharpness cost correctly (multiplier 1)', () => {
      const target = createTestWorkItem('target', [], 0);
      const sacrifice = createTestWorkItem(
        'book',
        [{ id: 'sharpness', level: 5 }],
        0,
        false
      );
      // Sharpness V: 5 × 1 (book mult) = 5
      expect(calculateCombineCost(target, sacrifice)).toBe(5);
    });

    it('adds mending cost correctly (multiplier 2)', () => {
      const target = createTestWorkItem('target', [], 0);
      const sacrifice = createTestWorkItem(
        'book',
        [{ id: 'mending', level: 1 }],
        0,
        false
      );
      // Mending I: 1 × 2 (book mult) = 2
      expect(calculateCombineCost(target, sacrifice)).toBe(2);
    });

    it('adds looting cost correctly (multiplier 2)', () => {
      const target = createTestWorkItem('target', [], 0);
      const sacrifice = createTestWorkItem(
        'book',
        [{ id: 'looting', level: 3 }],
        0,
        false
      );
      // Looting III: 3 × 2 (book mult) = 6
      expect(calculateCombineCost(target, sacrifice)).toBe(6);
    });

    it('adds silk touch cost correctly (multiplier 4)', () => {
      const target = createTestWorkItem('target', [], 0);
      const sacrifice = createTestWorkItem(
        'book',
        [{ id: 'silk_touch', level: 1 }],
        0,
        false
      );
      // Silk Touch I: 1 × 4 (book mult) = 4
      expect(calculateCombineCost(target, sacrifice)).toBe(4);
    });

    it('sums multiple enchantments', () => {
      const target = createTestWorkItem('target', [], 0);
      const sacrifice = createTestWorkItem(
        'book',
        [
          { id: 'sharpness', level: 5 },
          { id: 'mending', level: 1 },
        ],
        0,
        false
      );
      // Sharpness V: 5 × 1 = 5, Mending I: 1 × 2 = 2, total = 7
      expect(calculateCombineCost(target, sacrifice)).toBe(7);
    });
  });

  describe('enchantment costs from item sacrifice', () => {
    it('uses item multiplier when sacrifice is base item', () => {
      const target = createTestWorkItem('target', [], 0, true);
      const sacrifice = createTestWorkItem(
        'item',
        [{ id: 'mending', level: 1 }],
        0,
        true
      );
      // Mending I from item: 1 × 4 (item mult) = 4
      expect(calculateCombineCost(target, sacrifice)).toBe(4);
    });

    it('uses item multiplier for unbreaking', () => {
      const target = createTestWorkItem('target', [], 0, true);
      const sacrifice = createTestWorkItem(
        'item',
        [{ id: 'unbreaking', level: 3 }],
        0,
        true
      );
      // Unbreaking III from item: 3 × 2 (item mult) = 6
      expect(calculateCombineCost(target, sacrifice)).toBe(6);
    });
  });

  describe('combined PWP and enchantment costs', () => {
    it('calculates total cost correctly', () => {
      const target = createTestWorkItem('target', [], 2); // PWP = 3
      const sacrifice = createTestWorkItem(
        'book',
        [{ id: 'sharpness', level: 5 }],
        1, // PWP = 1
        false
      );
      // PWP: 3 + 1 = 4, Sharpness V: 5 × 1 = 5, total = 9
      expect(calculateCombineCost(target, sacrifice)).toBe(9);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Compute Optimal Tree Tests
// ─────────────────────────────────────────────────────────────

describe('computeOptimalTree', () => {
  beforeEach(() => {
    _resetNodeIdCounter();
  });

  describe('empty enchantments', () => {
    it('returns base item leaf for empty enchantment list', () => {
      const tree = computeOptimalTree([], 'Netherite Sword');
      expect(tree.type).toBe('leaf');
      expect(tree.item).toBe('Netherite Sword');
    });
  });

  describe('single enchantment', () => {
    it('produces a single combine step', () => {
      const tree = computeOptimalTree([{ smite: 5 }], 'Netherite Sword');
      expect(tree.type).toBe('combine');
      expect(countCombineNodes(tree)).toBe(1);
    });

    it('has base item as left child (target)', () => {
      const tree = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
      expect(tree.type).toBe('combine');
      expect(tree.left?.type).toBe('leaf');
      expect(tree.left?.item).toBe('Netherite Sword');
    });

    it('has book as right child (sacrifice)', () => {
      const tree = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
      expect(tree.type).toBe('combine');
      expect(tree.right?.type).toBe('leaf');
      expect(tree.right?.item).toContain('Mending');
    });

    it('calculates correct level cost for sharpness V', () => {
      const tree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
      // PWP: 0 + 0 = 0, Sharpness V: 5 × 1 = 5
      expect(tree.levelCost).toBe(5);
    });

    it('calculates correct level cost for mending', () => {
      const tree = computeOptimalTree([{ mending: 1 }], 'Diamond Sword');
      // PWP: 0 + 0 = 0, Mending I: 1 × 2 = 2
      expect(tree.levelCost).toBe(2);
    });
  });

  describe('multiple enchantments', () => {
    it('produces binary tree structure for 2 enchantments', () => {
      const tree = computeOptimalTree(
        [{ smite: 5 }, { mending: 1 }],
        'Netherite Sword'
      );
      // Should have 2 combine nodes: books combined, then result + base item
      expect(countCombineNodes(tree)).toBe(2);
    });

    it('produces binary tree structure for 3 enchantments', () => {
      const tree = computeOptimalTree(
        [{ smite: 5 }, { looting: 3 }, { mending: 1 }],
        'Netherite Sword'
      );
      // Should have 3 combine nodes
      expect(countCombineNodes(tree)).toBe(3);
    });

    it('produces binary tree structure for 4 enchantments', () => {
      const tree = computeOptimalTree(
        [{ smite: 5 }, { looting: 3 }, { fire_aspect: 2 }, { mending: 1 }],
        'Netherite Sword'
      );
      // Should have 4 combine nodes
      expect(countCombineNodes(tree)).toBe(4);
    });

    it('includes all enchantments in final result', () => {
      const tree = computeOptimalTree(
        [{ smite: 5 }, { looting: 3 }],
        'Netherite Sword'
      );
      expect(tree.enchantments).toBeDefined();
      expect(tree.enchantments).toContain('Smite V');
      expect(tree.enchantments).toContain('Looting III');
    });
  });

  describe('survival cap (39 levels)', () => {
    it('keeps all steps under 39 levels for simple recipes', () => {
      const tree = computeOptimalTree(
        [{ sharpness: 5 }, { unbreaking: 3 }, { mending: 1 }],
        'Netherite Sword'
      );
      const costs = getAllStepCosts(tree);
      for (const cost of costs) {
        expect(cost).toBeLessThanOrEqual(39);
      }
    });

    it('keeps all steps under 39 levels for mob farm sword', () => {
      const tree = computeOptimalTree(
        [
          { smite: 5 },
          { looting: 3 },
          { fire_aspect: 2 },
          { unbreaking: 3 },
          { mending: 1 },
        ],
        'Netherite Sword'
      );
      const costs = getAllStepCosts(tree);
      for (const cost of costs) {
        expect(cost).toBeLessThanOrEqual(39);
      }
    });
  });

  describe('determinism', () => {
    it('produces identical results for same input', () => {
      const enchants: EnchantmentSpec[] = [
        { smite: 5 },
        { looting: 3 },
        { mending: 1 },
      ];

      _resetNodeIdCounter();
      const tree1 = computeOptimalTree(enchants, 'Netherite Sword');
      _resetNodeIdCounter();
      const tree2 = computeOptimalTree(enchants, 'Netherite Sword');

      expect(JSON.stringify(tree1)).toBe(JSON.stringify(tree2));
    });

    it('produces identical costs for same input', () => {
      const enchants: EnchantmentSpec[] = [
        { sharpness: 5 },
        { unbreaking: 3 },
        { looting: 3 },
        { mending: 1 },
      ];

      const recipe1 = computeRecipe(enchants, 'Netherite Sword');
      const recipe2 = computeRecipe(enchants, 'Netherite Sword');

      expect(recipe1.totalLevelCost).toBe(recipe2.totalLevelCost);
      expect(recipe1.stepCount).toBe(recipe2.stepCount);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Compute Recipe Tests
// ─────────────────────────────────────────────────────────────

describe('computeRecipe', () => {
  beforeEach(() => {
    _resetNodeIdCounter();
  });

  describe('empty recipe', () => {
    it('returns zero costs for empty enchantments', () => {
      const recipe = computeRecipe([], 'Netherite Sword');
      expect(recipe.totalLevelCost).toBe(0);
      expect(recipe.totalXpCost).toBe(0);
      expect(recipe.totalXpCostBulk).toBe(0);
      expect(recipe.stepCount).toBe(0);
    });
  });

  describe('single enchantment', () => {
    it('calculates correct costs for sharpness V', () => {
      const recipe = computeRecipe([{ sharpness: 5 }], 'Netherite Sword');
      expect(recipe.totalLevelCost).toBe(5);
      expect(recipe.totalXpCost).toBe(levelToXp(5));
      expect(recipe.stepCount).toBe(1);
    });

    it('calculates correct costs for mending', () => {
      const recipe = computeRecipe([{ mending: 1 }], 'Diamond Sword');
      expect(recipe.totalLevelCost).toBe(2);
      expect(recipe.totalXpCost).toBe(levelToXp(2));
      expect(recipe.stepCount).toBe(1);
    });
  });

  describe('multiple enchantments', () => {
    it('calculates step count correctly', () => {
      const recipe = computeRecipe(
        [{ smite: 5 }, { looting: 3 }, { mending: 1 }],
        'Netherite Sword'
      );
      expect(recipe.stepCount).toBe(3);
    });

    it('total level cost is sum of step costs', () => {
      const recipe = computeRecipe(
        [{ sharpness: 5 }, { mending: 1 }],
        'Netherite Sword'
      );
      const stepCosts = getAllStepCosts(recipe.tree);
      expect(recipe.totalLevelCost).toBe(stepCosts.reduce((a, b) => a + b, 0));
    });

    it('bulk XP is less than or equal to incremental XP', () => {
      const recipe = computeRecipe(
        [{ smite: 5 }, { looting: 3 }, { fire_aspect: 2 }, { mending: 1 }],
        'Netherite Sword'
      );
      expect(recipe.totalXpCostBulk).toBeLessThanOrEqual(recipe.totalXpCost);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Recipe Validity Tests
// ─────────────────────────────────────────────────────────────

describe('isRecipeValid', () => {
  it('returns true for simple recipes', () => {
    expect(isRecipeValid([{ sharpness: 5 }], 'Netherite Sword')).toBe(true);
    expect(
      isRecipeValid([{ sharpness: 5 }, { mending: 1 }], 'Netherite Sword')
    ).toBe(true);
  });

  it('returns true for mob farm sword', () => {
    expect(
      isRecipeValid(
        [
          { smite: 5 },
          { looting: 3 },
          { fire_aspect: 2 },
          { unbreaking: 3 },
          { mending: 1 },
        ],
        'Netherite Sword'
      )
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Tree Structure Tests
// ─────────────────────────────────────────────────────────────

describe('tree structure', () => {
  beforeEach(() => {
    _resetNodeIdCounter();
  });

  it('leaf nodes have correct structure', () => {
    const tree = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
    expect(tree.left?.id).toBeDefined();
    expect(tree.left?.type).toBe('leaf');
    expect(tree.left?.item).toBe('Netherite Sword');
  });

  it('combine nodes have level and XP costs', () => {
    const tree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
    expect(tree.levelCost).toBeDefined();
    expect(tree.xpCost).toBeDefined();
    expect(tree.xpCost).toBe(levelToXp(tree.levelCost!));
  });

  it('combine nodes have resulting PWP', () => {
    const tree = computeOptimalTree([{ sharpness: 5 }], 'Netherite Sword');
    expect(tree.resultingPWP).toBeDefined();
    expect(tree.resultingPWP).toBe(1); // First combine = PWP 1
  });

  it('combine nodes have result label', () => {
    const tree = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
    expect(tree.resultLabel).toBeDefined();
    expect(tree.resultLabel).toBe('Netherite Sword');
  });

  it('all nodes have unique IDs', () => {
    const tree = computeOptimalTree(
      [{ smite: 5 }, { looting: 3 }, { mending: 1 }],
      'Netherite Sword'
    );
    const ids = new Set<string>();
    function collectIds(node: CraftingTreeNode): void {
      expect(ids.has(node.id)).toBe(false);
      ids.add(node.id);
      if (node.left) collectIds(node.left);
      if (node.right) collectIds(node.right);
    }
    collectIds(tree);
  });
});

// ─────────────────────────────────────────────────────────────
// God Sword Performance Test
// ─────────────────────────────────────────────────────────────

describe('performance', () => {
  it('computes god sword (7 enchants) in under 100ms', () => {
    const godSwordEnchants: EnchantmentSpec[] = [
      { sharpness: 5 },
      { looting: 3 },
      { fire_aspect: 2 },
      { unbreaking: 3 },
      { mending: 1 },
      { smite: 5 },      // Note: conflicts with sharpness, but optimizer doesn't validate
      { efficiency: 5 }, // Note: not applicable to swords, but optimizer doesn't validate
    ];

    const start = performance.now();
    const recipe = computeRecipe(godSwordEnchants, 'Netherite Sword');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(recipe.stepCount).toBe(7);
    expect(recipe.totalLevelCost).toBeGreaterThan(0);
  });

  it('computes complex recipe deterministically under load', () => {
    const enchants: EnchantmentSpec[] = [
      { sharpness: 5 },
      { looting: 3 },
      { fire_aspect: 2 },
      { unbreaking: 3 },
      { mending: 1 },
    ];

    // Run multiple times to ensure consistency
    const costs: number[] = [];
    for (let i = 0; i < 10; i++) {
      const recipe = computeRecipe(enchants, 'Netherite Sword');
      costs.push(recipe.totalLevelCost);
    }

    // All should be the same
    const firstCost = costs[0];
    for (const cost of costs) {
      expect(cost).toBe(firstCost);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Edge Cases
// ─────────────────────────────────────────────────────────────

describe('edge cases', () => {
  beforeEach(() => {
    _resetNodeIdCounter();
  });

  it('handles enchantment at level 1', () => {
    const tree = computeOptimalTree([{ mending: 1 }], 'Diamond Pickaxe');
    expect(tree.type).toBe('combine');
    expect(tree.right?.item).toBe('Mending Book'); // No "I" for single-level
  });

  it('handles high-level enchantments', () => {
    const tree = computeOptimalTree([{ efficiency: 5 }], 'Diamond Pickaxe');
    expect(tree.type).toBe('combine');
    expect(tree.right?.item).toBe('Efficiency V Book');
  });

  it('handles different base items', () => {
    const tree1 = computeOptimalTree([{ mending: 1 }], 'Netherite Sword');
    const tree2 = computeOptimalTree([{ mending: 1 }], 'Diamond Pickaxe');

    expect(tree1.left?.item).toBe('Netherite Sword');
    expect(tree2.left?.item).toBe('Diamond Pickaxe');
  });

  it('handles unknown enchantments gracefully', () => {
    // Unknown enchantments should still work (no crash)
    const tree = computeOptimalTree(
      [{ unknown_enchant: 3 } as EnchantmentSpec],
      'Netherite Sword'
    );
    expect(tree.type).toBe('combine');
  });

  it('handles odd number of enchantments', () => {
    // 3 enchantments should work (odd number)
    const tree = computeOptimalTree(
      [{ sharpness: 5 }, { looting: 3 }, { mending: 1 }],
      'Netherite Sword'
    );
    expect(tree.type).toBe('combine');
    expect(countCombineNodes(tree)).toBe(3);
  });

  it('handles 5 enchantments', () => {
    const tree = computeOptimalTree(
      [
        { sharpness: 5 },
        { looting: 3 },
        { fire_aspect: 2 },
        { unbreaking: 3 },
        { mending: 1 },
      ],
      'Netherite Sword'
    );
    expect(tree.type).toBe('combine');
    expect(countCombineNodes(tree)).toBe(5);
  });

  it('handles 6 enchantments', () => {
    const tree = computeOptimalTree(
      [
        { sharpness: 5 },
        { looting: 3 },
        { fire_aspect: 2 },
        { unbreaking: 3 },
        { mending: 1 },
        { efficiency: 5 },
      ],
      'Netherite Sword'
    );
    expect(tree.type).toBe('combine');
    expect(countCombineNodes(tree)).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────
// Survival Cap Limit Tests
// ─────────────────────────────────────────────────────────────

describe('survival cap limits', () => {
  beforeEach(() => {
    _resetNodeIdCounter();
  });

  it('stays under 39 levels for expensive enchantments', () => {
    // Silk Touch has high multiplier (4x book)
    const tree = computeOptimalTree(
      [{ silk_touch: 1 }, { fortune: 3 }, { unbreaking: 3 }],
      'Diamond Pickaxe'
    );
    const costs = getAllStepCosts(tree);
    for (const cost of costs) {
      expect(cost).toBeLessThanOrEqual(39);
    }
  });

  it('optimizes order to minimize total cost', () => {
    // Running multiple times should give same result
    const recipe1 = computeRecipe(
      [{ sharpness: 5 }, { mending: 1 }, { looting: 3 }],
      'Netherite Sword'
    );
    const recipe2 = computeRecipe(
      [{ mending: 1 }, { sharpness: 5 }, { looting: 3 }],
      'Netherite Sword'
    );

    // Same enchantments should produce same optimal cost regardless of input order
    expect(recipe1.totalLevelCost).toBe(recipe2.totalLevelCost);
  });

  it('produces valid result for many enchantments', () => {
    const enchants: EnchantmentSpec[] = [
      { sharpness: 5 },
      { looting: 3 },
      { fire_aspect: 2 },
      { unbreaking: 3 },
      { mending: 1 },
    ];

    expect(isRecipeValid(enchants, 'Netherite Sword')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Internal Function Tests (Edge Cases)
// ─────────────────────────────────────────────────────────────

describe('_tryLinearOrder (internal edge cases)', () => {
  beforeEach(() => {
    _resetNodeIdCounter();
  });

  it('returns valid for normal enchantments', () => {
    const result = _tryLinearOrder(
      [
        { id: 'sharpness' as any, level: 5 },
        { id: 'mending' as any, level: 1 },
      ],
      'Netherite Sword'
    );
    expect(result.valid).toBe(true);
    expect(result.stepCosts.length).toBe(2);
  });

  it('returns invalid when step cost exceeds survival cap', () => {
    // Use extremely high levels to trigger the survival cap
    // With silk_touch (4x multiplier) at level 20, cost = 80 which exceeds 39
    const result = _tryLinearOrder(
      [
        { id: 'silk_touch' as any, level: 20 }, // 20 * 4 = 80 > 39
      ],
      'Diamond Pickaxe'
    );
    expect(result.valid).toBe(false);
    expect(result.totalCost).toBe(Infinity);
  });

  it('returns invalid when combining books exceeds cap (sacrifice has high cost)', () => {
    // The second book is the sacrifice in the first combine step
    // Sacrifice book cost must exceed 39 to fail the book combining step
    const result = _tryLinearOrder(
      [
        { id: 'sharpness' as any, level: 1 },   // This is target
        { id: 'silk_touch' as any, level: 10 }, // This is sacrifice: 10 * 4 = 40 > 39
      ],
      'Diamond Pickaxe'
    );
    // First combine: 0 + 0 + 10*4 = 40 > 39, so book combine fails
    expect(result.valid).toBe(false);
    expect(result.totalCost).toBe(Infinity);
  });

  it('returns invalid when final combine with base item exceeds cap', () => {
    // The final step combines the merged book with the base item
    // We need the accumulated enchantments to exceed 39 when combined with base item
    const result = _tryLinearOrder(
      [
        { id: 'silk_touch' as any, level: 10 }, // First book is target in book combine
        { id: 'fortune' as any, level: 10 },    // Second book is sacrifice: 10 * 2 = 20 < 39
      ],
      'Diamond Pickaxe'
    );
    // Book combine: 0 + 0 + 20 = 20 (valid)
    // Final combine: 0 + 1 + (10*4 + 10*2) = 0 + 1 + 60 = 61 > 39 (invalid)
    expect(result.valid).toBe(false);
    expect(result.totalCost).toBe(Infinity);
  });

  it('handles empty enchantment list', () => {
    const result = _tryLinearOrder([], 'Netherite Sword');
    expect(result.valid).toBe(true);
    expect(result.totalCost).toBe(0);
    expect(result.stepCosts.length).toBe(0);
  });

  it('returns invalid when all orderings exceed cap', () => {
    // Both books have cost > 39 when used as sacrifice
    // This means all permutations will fail
    // Silk touch at level 10: 10 * 4 = 40 > 39
    const recipe = computeRecipe(
      [
        { silk_touch: 10 }, // 10 * 4 = 40 > 39 as sacrifice
        { silk_touch: 10 }, // 10 * 4 = 40 > 39 as sacrifice
      ],
      'Diamond Pickaxe'
    );
    // All orderings fail because whichever book is sacrifice has cost > 39
    expect(recipe.totalLevelCost).toBe(Infinity);
    expect(isRecipeValid([{ silk_touch: 10 }, { silk_touch: 10 }], 'Diamond Pickaxe')).toBe(false);
  });

  it('handles single enchantment correctly', () => {
    const result = _tryLinearOrder(
      [{ id: 'sharpness' as any, level: 5 }],
      'Netherite Sword'
    );
    expect(result.valid).toBe(true);
    expect(result.stepCosts.length).toBe(1);
    // Cost: 0 + 0 + 5*1 = 5
    expect(result.stepCosts[0]).toBe(5);
  });

  it('handles odd number of enchantments', () => {
    const result = _tryLinearOrder(
      [
        { id: 'sharpness' as any, level: 5 },
        { id: 'mending' as any, level: 1 },
        { id: 'looting' as any, level: 3 },
      ],
      'Netherite Sword'
    );
    expect(result.valid).toBe(true);
    expect(result.stepCosts.length).toBe(3);
  });

  it('calculates correct step costs', () => {
    const result = _tryLinearOrder(
      [{ id: 'mending' as any, level: 1 }], // multiplier 2
      'Netherite Sword'
    );
    expect(result.valid).toBe(true);
    // Cost: 0 (item PWP) + 0 (book PWP) + 1*2 (mending) = 2
    expect(result.stepCosts[0]).toBe(2);
    expect(result.totalCost).toBe(2);
  });
});
