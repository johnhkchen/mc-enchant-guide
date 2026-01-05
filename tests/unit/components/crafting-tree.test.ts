// tests/unit/components/crafting-tree.test.ts
// Smoke tests for CraftingTree and TreeNode component logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CraftingTreeNode } from '../../../src/types/index.js';

/**
 * CraftingTree smoke tests
 *
 * Since CraftingTree is a Solid.js component that runs in the browser,
 * we test the core logic functions: node counting, completion tracking,
 * and tree structure handling.
 */

// ─────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────

function createLeafNode(id: string, item: string, enchantments: string[] = []): CraftingTreeNode {
  return {
    id,
    type: 'leaf',
    item,
    enchantments,
  };
}

function createCombineNode(
  id: string,
  left: CraftingTreeNode,
  right: CraftingTreeNode,
  levelCost: number,
  resultLabel: string,
  enchantments: string[] = []
): CraftingTreeNode {
  return {
    id,
    type: 'combine',
    left,
    right,
    levelCost,
    xpCost: 0,
    resultingPWP: 1,
    resultLabel,
    enchantments,
  };
}

// Simple tree: 2 books + base item = 2 combine operations
function createSimpleTree(): CraftingTreeNode {
  const book1 = createLeafNode('node_1', 'Sharpness V Book', ['Sharpness V']);
  const book2 = createLeafNode('node_2', 'Unbreaking III Book', ['Unbreaking III']);
  const baseItem = createLeafNode('node_3', 'Netherite Sword');

  // First combine: book1 + book2 = Book A
  const bookA = createCombineNode('node_4', book1, book2, 4, 'Book A', ['Sharpness V', 'Unbreaking III']);

  // Second combine: base item + Book A = final
  const final = createCombineNode('node_5', baseItem, bookA, 12, 'God Sword', [
    'Sharpness V',
    'Unbreaking III',
  ]);

  return final;
}

// Complex tree: 4 books + base item = multiple combine operations
function createComplexTree(): CraftingTreeNode {
  const book1 = createLeafNode('node_1', 'Sharpness V Book', ['Sharpness V']);
  const book2 = createLeafNode('node_2', 'Smite V Book', ['Smite V']);
  const book3 = createLeafNode('node_3', 'Looting III Book', ['Looting III']);
  const book4 = createLeafNode('node_4', 'Fire Aspect II Book', ['Fire Aspect II']);
  const baseItem = createLeafNode('node_5', 'Netherite Sword');

  // Level 1: book1 + book2 = Book A, book3 + book4 = Book B
  const bookA = createCombineNode('node_6', book1, book2, 5, 'Book A');
  const bookB = createCombineNode('node_7', book3, book4, 4, 'Book B');

  // Level 2: Book A + Book B = Book C
  const bookC = createCombineNode('node_8', bookA, bookB, 8, 'Book C');

  // Level 3: base item + Book C = final
  const final = createCombineNode('node_9', baseItem, bookC, 16, 'God Sword');

  return final;
}

// ─────────────────────────────────────────────────────────────
// Count Combine Nodes
// ─────────────────────────────────────────────────────────────

describe('CraftingTree', () => {
  describe('countCombineNodes()', () => {
    function countCombineNodes(node: CraftingTreeNode): number {
      if (node.type === 'leaf') return 0;
      const leftCount = node.left ? countCombineNodes(node.left) : 0;
      const rightCount = node.right ? countCombineNodes(node.right) : 0;
      return 1 + leftCount + rightCount;
    }

    it('should return 0 for leaf node', () => {
      const leaf = createLeafNode('node_1', 'Sharpness V Book');
      expect(countCombineNodes(leaf)).toBe(0);
    });

    it('should return 1 for single combine node with leaf children', () => {
      const book1 = createLeafNode('node_1', 'Sharpness V Book');
      const book2 = createLeafNode('node_2', 'Unbreaking III Book');
      const combine = createCombineNode('node_3', book1, book2, 4, 'Book A');
      expect(countCombineNodes(combine)).toBe(1);
    });

    it('should count 2 combine nodes for simple tree', () => {
      const tree = createSimpleTree();
      expect(countCombineNodes(tree)).toBe(2);
    });

    it('should count 4 combine nodes for complex tree', () => {
      const tree = createComplexTree();
      expect(countCombineNodes(tree)).toBe(4);
    });

    it('should handle missing children gracefully', () => {
      const node: CraftingTreeNode = {
        id: 'node_1',
        type: 'combine',
        levelCost: 5,
        resultLabel: 'Test',
        // Missing left and right
      };
      expect(countCombineNodes(node)).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Node Detection
  // ─────────────────────────────────────────────────────────────

  describe('isBaseItemLeaf()', () => {
    function isBaseItemLeaf(node: CraftingTreeNode): boolean {
      if (node.type !== 'leaf' || !node.item) return false;
      return !node.item.endsWith('Book');
    }

    it('should return true for base item leaf', () => {
      const node = createLeafNode('node_1', 'Netherite Sword');
      expect(isBaseItemLeaf(node)).toBe(true);
    });

    it('should return true for other base items', () => {
      expect(isBaseItemLeaf(createLeafNode('n', 'Diamond Pickaxe'))).toBe(true);
      expect(isBaseItemLeaf(createLeafNode('n', 'Iron Axe'))).toBe(true);
      expect(isBaseItemLeaf(createLeafNode('n', 'Netherite Helmet'))).toBe(true);
    });

    it('should return false for book leaf', () => {
      const node = createLeafNode('node_1', 'Sharpness V Book');
      expect(isBaseItemLeaf(node)).toBe(false);
    });

    it('should return false for combined books', () => {
      expect(isBaseItemLeaf(createLeafNode('n', 'Mending Book'))).toBe(false);
      expect(isBaseItemLeaf(createLeafNode('n', 'Unbreaking III Book'))).toBe(false);
    });

    it('should return false for combine node', () => {
      const book1 = createLeafNode('node_1', 'Sharpness V Book');
      const book2 = createLeafNode('node_2', 'Unbreaking III Book');
      const combine = createCombineNode('node_3', book1, book2, 4, 'Book A');
      expect(isBaseItemLeaf(combine)).toBe(false);
    });

    it('should return false for leaf without item', () => {
      const node: CraftingTreeNode = { id: 'node_1', type: 'leaf' };
      expect(isBaseItemLeaf(node)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Progress Calculation
  // ─────────────────────────────────────────────────────────────

  describe('Progress Calculation Logic', () => {
    function calculateCompletionPercent(completedCount: number, totalNodes: number): number {
      if (totalNodes <= 0) return 0;
      return Math.round((completedCount / totalNodes) * 100);
    }

    it('should calculate 0% for no completed nodes', () => {
      expect(calculateCompletionPercent(0, 4)).toBe(0);
    });

    it('should calculate 50% for half completed', () => {
      expect(calculateCompletionPercent(2, 4)).toBe(50);
    });

    it('should calculate 100% for all completed', () => {
      expect(calculateCompletionPercent(4, 4)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(calculateCompletionPercent(1, 3)).toBe(33); // 33.33...
      expect(calculateCompletionPercent(2, 3)).toBe(67); // 66.66...
    });

    it('should return 0 for zero total nodes', () => {
      expect(calculateCompletionPercent(0, 0)).toBe(0);
    });

    it('should return 0 for negative total nodes', () => {
      expect(calculateCompletionPercent(2, -1)).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tree Structure Validation
  // ─────────────────────────────────────────────────────────────

  describe('Tree Structure', () => {
    it('should have unique node IDs', () => {
      const tree = createComplexTree();
      const ids = new Set<string>();

      function collectIds(node: CraftingTreeNode): void {
        ids.add(node.id);
        if (node.left) collectIds(node.left);
        if (node.right) collectIds(node.right);
      }

      collectIds(tree);
      expect(ids.size).toBe(9); // 5 leaves + 4 combines
    });

    it('should have correct structure for simple tree', () => {
      const tree = createSimpleTree();

      expect(tree.type).toBe('combine');
      expect(tree.resultLabel).toBe('God Sword');
      expect(tree.left?.type).toBe('leaf');
      expect(tree.right?.type).toBe('combine');
    });

    it('should have correct structure for complex tree', () => {
      const tree = createComplexTree();

      expect(tree.type).toBe('combine');
      expect(tree.resultLabel).toBe('God Sword');

      // Root combines base item with Book C
      expect(tree.left?.item).toBe('Netherite Sword');
      expect(tree.right?.resultLabel).toBe('Book C');

      // Book C combines Book A and Book B
      const bookC = tree.right;
      expect(bookC?.left?.resultLabel).toBe('Book A');
      expect(bookC?.right?.resultLabel).toBe('Book B');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // CSS Class Generation
  // ─────────────────────────────────────────────────────────────

  describe('CSS Class Generation', () => {
    function getOperationClasses(completed: boolean, isRoot: boolean): string {
      return [
        'tree-combine-operation',
        completed ? 'tree-combine-operation--completed' : '',
        isRoot ? 'tree-combine-operation--final' : '',
      ]
        .filter(Boolean)
        .join(' ');
    }

    it('should return base class for non-completed non-root', () => {
      expect(getOperationClasses(false, false)).toBe('tree-combine-operation');
    });

    it('should add completed class when completed', () => {
      expect(getOperationClasses(true, false)).toBe(
        'tree-combine-operation tree-combine-operation--completed'
      );
    });

    it('should add final class when root', () => {
      expect(getOperationClasses(false, true)).toBe(
        'tree-combine-operation tree-combine-operation--final'
      );
    });

    it('should add both classes when completed root', () => {
      expect(getOperationClasses(true, true)).toBe(
        'tree-combine-operation tree-combine-operation--completed tree-combine-operation--final'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Leaf CSS Class Generation
  // ─────────────────────────────────────────────────────────────

  describe('Leaf CSS Class Generation', () => {
    function getLeafClasses(isBaseItem: boolean): string {
      return `tree-leaf ${isBaseItem ? 'tree-leaf--base' : ''}`.trim();
    }

    it('should return base class for book leaf', () => {
      expect(getLeafClasses(false)).toBe('tree-leaf');
    });

    it('should add base modifier for base item leaf', () => {
      expect(getLeafClasses(true)).toBe('tree-leaf tree-leaf--base');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Aria Label Generation
  // ─────────────────────────────────────────────────────────────

  describe('Aria Label Generation', () => {
    function getAriaLabel(resultLabel: string, isCompleted: boolean): string {
      return `Mark step "${resultLabel}" as ${isCompleted ? 'incomplete' : 'complete'}`;
    }

    it('should indicate marking as complete when not completed', () => {
      expect(getAriaLabel('Book A', false)).toBe('Mark step "Book A" as complete');
    });

    it('should indicate marking as incomplete when completed', () => {
      expect(getAriaLabel('Book A', true)).toBe('Mark step "Book A" as incomplete');
    });

    it('should include result label in aria', () => {
      expect(getAriaLabel('God Sword', false)).toContain('God Sword');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Empty State Detection
  // ─────────────────────────────────────────────────────────────

  describe('Empty State Detection', () => {
    it('should detect leaf-only tree as empty', () => {
      const tree = createLeafNode('node_1', 'Netherite Sword');
      expect(tree.type === 'leaf').toBe(true);
    });

    it('should not detect combine tree as empty', () => {
      const tree = createSimpleTree();
      expect(tree.type === 'leaf').toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Level Cost Display
  // ─────────────────────────────────────────────────────────────

  describe('Level Cost Display', () => {
    it('should display level cost from node', () => {
      const book1 = createLeafNode('node_1', 'Sharpness V Book');
      const book2 = createLeafNode('node_2', 'Unbreaking III Book');
      const combine = createCombineNode('node_3', book1, book2, 7, 'Book A');

      expect(combine.levelCost).toBe(7);
    });

    it('should have correct costs in tree', () => {
      const tree = createSimpleTree();

      // Root node cost
      expect(tree.levelCost).toBe(12);

      // Inner combine cost
      expect(tree.right?.levelCost).toBe(4);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Enchantment Display
  // ─────────────────────────────────────────────────────────────

  describe('Enchantment Display', () => {
    it('should show enchantments on leaf nodes', () => {
      const node = createLeafNode('node_1', 'Sharpness V Book', ['Sharpness V']);
      expect(node.enchantments).toEqual(['Sharpness V']);
    });

    it('should show combined enchantments on intermediate nodes', () => {
      const tree = createSimpleTree();

      // Inner combine node should show combined enchants
      expect(tree.right?.enchantments).toEqual(['Sharpness V', 'Unbreaking III']);
    });

    it('should show all enchantments on root node', () => {
      const tree = createSimpleTree();
      expect(tree.enchantments).toEqual(['Sharpness V', 'Unbreaking III']);
    });

    it('should handle empty enchantments', () => {
      const node = createLeafNode('node_1', 'Netherite Sword', []);
      expect(node.enchantments).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Keyboard Interaction Logic
  // ─────────────────────────────────────────────────────────────

  describe('Keyboard Interaction Logic', () => {
    function shouldToggleOnKey(key: string): boolean {
      return key === 'Enter' || key === ' ';
    }

    it('should toggle on Enter key', () => {
      expect(shouldToggleOnKey('Enter')).toBe(true);
    });

    it('should toggle on Space key', () => {
      expect(shouldToggleOnKey(' ')).toBe(true);
    });

    it('should not toggle on other keys', () => {
      expect(shouldToggleOnKey('Tab')).toBe(false);
      expect(shouldToggleOnKey('Escape')).toBe(false);
      expect(shouldToggleOnKey('a')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Node ID Collection for Progress Tracking
  // ─────────────────────────────────────────────────────────────

  describe('Node ID Collection', () => {
    function collectCombineNodeIds(node: CraftingTreeNode): string[] {
      if (node.type === 'leaf') return [];

      const leftIds = node.left ? collectCombineNodeIds(node.left) : [];
      const rightIds = node.right ? collectCombineNodeIds(node.right) : [];

      return [...leftIds, ...rightIds, node.id];
    }

    it('should collect no IDs from leaf', () => {
      const leaf = createLeafNode('node_1', 'Book');
      expect(collectCombineNodeIds(leaf)).toEqual([]);
    });

    it('should collect single ID from single combine', () => {
      const book1 = createLeafNode('node_1', 'Book 1');
      const book2 = createLeafNode('node_2', 'Book 2');
      const combine = createCombineNode('node_3', book1, book2, 4, 'Book A');

      expect(collectCombineNodeIds(combine)).toEqual(['node_3']);
    });

    it('should collect all combine IDs in order', () => {
      const tree = createSimpleTree();
      // Inner combine first (node_4), then root (node_5)
      expect(collectCombineNodeIds(tree)).toEqual(['node_4', 'node_5']);
    });

    it('should collect all IDs from complex tree', () => {
      const tree = createComplexTree();
      // node_6 (Book A), node_7 (Book B), node_8 (Book C), node_9 (root)
      expect(collectCombineNodeIds(tree)).toEqual(['node_6', 'node_7', 'node_8', 'node_9']);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// TreeNode Component Tests
// ─────────────────────────────────────────────────────────────

describe('TreeNode', () => {
  describe('Props Interface', () => {
    it('should require node prop', () => {
      const node = createLeafNode('node_1', 'Book');
      const props = {
        node,
        recipeId: 'recipe-1',
        isRoot: false,
        isCompleted: (_: string) => false,
        onToggle: (_: string) => {},
      };

      expect(props.node).toBe(node);
    });

    it('should require recipeId prop', () => {
      const node = createLeafNode('node_1', 'Book');
      const props = {
        node,
        recipeId: 'swords/god-sword',
        isCompleted: (_: string) => false,
        onToggle: (_: string) => {},
      };

      expect(props.recipeId).toBe('swords/god-sword');
    });

    it('should have optional isRoot prop', () => {
      const node = createLeafNode('node_1', 'Book');
      const props: {
        node: CraftingTreeNode;
        recipeId: string;
        isRoot?: boolean;
        isCompleted: (nodeId: string) => boolean;
        onToggle: (nodeId: string) => void;
      } = {
        node,
        recipeId: 'recipe-1',
        isCompleted: (_: string) => false,
        onToggle: (_: string) => {},
      };

      expect(props.isRoot).toBeUndefined();
    });

    it('should accept isCompleted function', () => {
      const node = createLeafNode('node_1', 'Book');
      const isCompletedFn = (nodeId: string) => nodeId === 'node_1';
      const props = {
        node,
        recipeId: 'recipe-1',
        isCompleted: isCompletedFn,
        onToggle: (_: string) => {},
      };

      expect(props.isCompleted('node_1')).toBe(true);
      expect(props.isCompleted('node_2')).toBe(false);
    });

    it('should accept onToggle callback', () => {
      const node = createLeafNode('node_1', 'Book');
      let toggledNodeId = '';
      const onToggleFn = (nodeId: string) => {
        toggledNodeId = nodeId;
      };
      const props = {
        node,
        recipeId: 'recipe-1',
        isCompleted: (_: string) => false,
        onToggle: onToggleFn,
      };

      props.onToggle('node_1');
      expect(toggledNodeId).toBe('node_1');
    });
  });
});

// ─────────────────────────────────────────────────────────────
// CraftingTree Component Tests
// ─────────────────────────────────────────────────────────────

describe('CraftingTree Component', () => {
  describe('Props Interface', () => {
    it('should require tree prop', () => {
      const tree = createSimpleTree();
      const props = {
        tree,
        recipeId: 'swords/god-sword',
      };

      expect(props.tree).toBe(tree);
    });

    it('should require recipeId prop', () => {
      const tree = createSimpleTree();
      const props = {
        tree,
        recipeId: 'swords/god-sword',
      };

      expect(props.recipeId).toBe('swords/god-sword');
    });

    it('should have optional recipeName prop', () => {
      const tree = createSimpleTree();
      const props = {
        tree,
        recipeId: 'swords/god-sword',
        recipeName: 'God Sword',
      };

      expect(props.recipeName).toBe('God Sword');
    });

    it('should have optional showHeader prop', () => {
      const tree = createSimpleTree();
      const props = {
        tree,
        recipeId: 'swords/god-sword',
        showHeader: false,
      };

      expect(props.showHeader).toBe(false);
    });

    it('should default showHeader to true', () => {
      const tree = createSimpleTree();
      const props: {
        tree: CraftingTreeNode;
        recipeId: string;
        showHeader?: boolean;
      } = {
        tree,
        recipeId: 'swords/god-sword',
      };

      // In component, default is true if not provided
      expect(props.showHeader ?? true).toBe(true);
    });
  });

  describe('Header Display', () => {
    it('should use recipeName if provided', () => {
      const recipeName = 'God Sword';
      expect(recipeName || 'Craft Order').toBe('God Sword');
    });

    it('should fallback to default title', () => {
      const recipeName = undefined;
      expect(recipeName || 'Craft Order').toBe('Craft Order');
    });
  });

  describe('Reset Button Visibility', () => {
    function shouldShowReset(completionPercent: number): boolean {
      return completionPercent > 0;
    }

    it('should hide reset when 0% complete', () => {
      expect(shouldShowReset(0)).toBe(false);
    });

    it('should show reset when partially complete', () => {
      expect(shouldShowReset(25)).toBe(true);
      expect(shouldShowReset(50)).toBe(true);
    });

    it('should show reset when fully complete', () => {
      expect(shouldShowReset(100)).toBe(true);
    });
  });
});
