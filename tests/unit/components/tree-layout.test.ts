// tests/unit/components/tree-layout.test.ts
// Unit tests for tree analysis utilities

import { describe, it, expect } from 'vitest';
import {
  analyzeTree,
  getNodeById,
  getLeafNodes,
  getCombineNodes,
  countNodes,
  getTreeDepth,
} from '../../../src/components/solid/tree-layout.js';
import type { CraftingTreeNode } from '../../../src/types/index.js';

// Helper to create a simple leaf node
function createLeaf(id: string, item: string, enchantments: string[] = []): CraftingTreeNode {
  return { id, type: 'leaf', item, enchantments };
}

// Helper to create a combine node
function createCombine(
  id: string,
  left: CraftingTreeNode,
  right: CraftingTreeNode,
  enchantments: string[] = []
): CraftingTreeNode {
  return {
    id,
    type: 'combine',
    left,
    right,
    levelCost: 10,
    resultLabel: `Result ${id}`,
    enchantments,
  };
}

describe('Tree Analysis Utilities', () => {
  describe('analyzeTree', () => {
    it('handles single leaf node', () => {
      const tree = createLeaf('leaf1', 'Test Item');
      const result = analyzeTree(tree);

      expect(result.nodes.length).toBe(1);
      expect(result.maxDepth).toBe(0);
      expect(result.leafCount).toBe(1);
      expect(result.combineCount).toBe(0);

      const node = result.nodes[0];
      expect(node.id).toBe('leaf1');
      expect(node.depth).toBe(0);
      expect(node.isLeaf).toBe(true);
      expect(node.isRoot).toBe(true);
    });

    it('handles simple two-leaf tree with one combine', () => {
      const left = createLeaf('left', 'Left Item');
      const right = createLeaf('right', 'Right Item');
      const root = createCombine('root', left, right);

      const result = analyzeTree(root);

      expect(result.nodes.length).toBe(3);
      expect(result.maxDepth).toBe(1);
      expect(result.leafCount).toBe(2);
      expect(result.combineCount).toBe(1);
    });

    it('calculates depth correctly', () => {
      const left = createLeaf('left', 'Left Item');
      const right = createLeaf('right', 'Right Item');
      const root = createCombine('root', left, right);

      const result = analyzeTree(root);

      // Root is at depth 0
      const rootNode = getNodeById(result, 'root');
      expect(rootNode?.depth).toBe(0);
      expect(rootNode?.isRoot).toBe(true);

      // Leaves are at depth 1
      const leftNode = getNodeById(result, 'left');
      expect(leftNode?.depth).toBe(1);

      const rightNode = getNodeById(result, 'right');
      expect(rightNode?.depth).toBe(1);
    });

    it('handles deeper tree (3 levels)', () => {
      // Build a tree:
      //       root (depth 0)
      //      /    \
      //   mid1    leaf3  (depth 1)
      //   /  \
      // leaf1 leaf2  (depth 2)

      const leaf1 = createLeaf('leaf1', 'Leaf 1');
      const leaf2 = createLeaf('leaf2', 'Leaf 2');
      const leaf3 = createLeaf('leaf3', 'Leaf 3');
      const mid1 = createCombine('mid1', leaf1, leaf2);
      const root = createCombine('root', mid1, leaf3);

      const result = analyzeTree(root);

      expect(result.nodes.length).toBe(5);
      expect(result.maxDepth).toBe(2);
      expect(result.leafCount).toBe(3);
      expect(result.combineCount).toBe(2);

      // Check depths
      expect(getNodeById(result, 'root')?.depth).toBe(0);
      expect(getNodeById(result, 'mid1')?.depth).toBe(1);
      expect(getNodeById(result, 'leaf3')?.depth).toBe(1);
      expect(getNodeById(result, 'leaf1')?.depth).toBe(2);
      expect(getNodeById(result, 'leaf2')?.depth).toBe(2);
    });

    it('handles balanced binary tree (4 leaves)', () => {
      const leaf1 = createLeaf('L1', 'Leaf 1');
      const leaf2 = createLeaf('L2', 'Leaf 2');
      const leaf3 = createLeaf('L3', 'Leaf 3');
      const leaf4 = createLeaf('L4', 'Leaf 4');
      const mid1 = createCombine('mid1', leaf1, leaf2);
      const mid2 = createCombine('mid2', leaf3, leaf4);
      const root = createCombine('root', mid1, mid2);

      const result = analyzeTree(root);

      expect(result.nodes.length).toBe(7);
      expect(result.maxDepth).toBe(2);
      expect(result.leafCount).toBe(4);
      expect(result.combineCount).toBe(3);
    });

    it('handles 7-enchant tree structure (god sword)', () => {
      const leaves = Array.from({ length: 7 }, (_, i) =>
        createLeaf(`leaf${i}`, `Book ${i + 1}`)
      );

      const c1 = createCombine('c1', leaves[0], leaves[1]);
      const c2 = createCombine('c2', leaves[2], leaves[3]);
      const c3 = createCombine('c3', leaves[4], leaves[5]);
      const c4 = createCombine('c4', c1, c2);
      const c5 = createCombine('c5', c3, leaves[6]);
      const root = createCombine('root', c4, c5);

      const result = analyzeTree(root);

      expect(result.nodes.length).toBe(13); // 7 leaves + 6 combines
      expect(result.leafCount).toBe(7);
      expect(result.combineCount).toBe(6);
    });
  });

  describe('getNodeById', () => {
    it('finds existing node', () => {
      const left = createLeaf('left', 'Left Item');
      const right = createLeaf('right', 'Right Item');
      const root = createCombine('root', left, right);
      const result = analyzeTree(root);

      const found = getNodeById(result, 'left');
      expect(found).toBeDefined();
      expect(found?.node.id).toBe('left');
    });

    it('returns undefined for non-existent node', () => {
      const leaf = createLeaf('leaf', 'Item');
      const result = analyzeTree(leaf);

      const found = getNodeById(result, 'nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('getLeafNodes', () => {
    it('returns all leaf nodes', () => {
      const leaf1 = createLeaf('leaf1', 'Item 1');
      const leaf2 = createLeaf('leaf2', 'Item 2');
      const root = createCombine('root', leaf1, leaf2);
      const result = analyzeTree(root);

      const leaves = getLeafNodes(result);
      expect(leaves.length).toBe(2);
      expect(leaves.every((n) => n.isLeaf)).toBe(true);
    });
  });

  describe('getCombineNodes', () => {
    it('returns all combine nodes', () => {
      const leaf1 = createLeaf('leaf1', 'Item 1');
      const leaf2 = createLeaf('leaf2', 'Item 2');
      const leaf3 = createLeaf('leaf3', 'Item 3');
      const mid = createCombine('mid', leaf1, leaf2);
      const root = createCombine('root', mid, leaf3);
      const result = analyzeTree(root);

      const combines = getCombineNodes(result);
      expect(combines.length).toBe(2);
      expect(combines.every((n) => !n.isLeaf)).toBe(true);
    });
  });

  describe('Child ID tracking', () => {
    it('tracks left and right child IDs for combine nodes', () => {
      const left = createLeaf('left', 'Left Item');
      const right = createLeaf('right', 'Right Item');
      const root = createCombine('root', left, right);
      const result = analyzeTree(root);

      const rootNode = getNodeById(result, 'root');
      expect(rootNode?.leftChildId).toBe('left');
      expect(rootNode?.rightChildId).toBe('right');
    });

    it('leaf nodes have no child IDs', () => {
      const leaf = createLeaf('leaf', 'Item');
      const result = analyzeTree(leaf);

      const leafNode = getNodeById(result, 'leaf');
      expect(leafNode?.leftChildId).toBeUndefined();
      expect(leafNode?.rightChildId).toBeUndefined();
    });
  });

  describe('Parent ID tracking', () => {
    it('tracks parent IDs correctly', () => {
      const left = createLeaf('left', 'Left Item');
      const right = createLeaf('right', 'Right Item');
      const root = createCombine('root', left, right);
      const result = analyzeTree(root);

      const leftNode = getNodeById(result, 'left');
      expect(leftNode?.parentId).toBe('root');

      const rightNode = getNodeById(result, 'right');
      expect(rightNode?.parentId).toBe('root');

      const rootNode = getNodeById(result, 'root');
      expect(rootNode?.parentId).toBeUndefined();
    });
  });

  describe('countNodes', () => {
    it('counts single node', () => {
      const leaf = createLeaf('leaf', 'Item');
      expect(countNodes(leaf)).toBe(1);
    });

    it('counts tree with multiple nodes', () => {
      const leaf1 = createLeaf('leaf1', 'Item 1');
      const leaf2 = createLeaf('leaf2', 'Item 2');
      const root = createCombine('root', leaf1, leaf2);
      expect(countNodes(root)).toBe(3);
    });

    it('counts complex tree', () => {
      const leaves = Array.from({ length: 7 }, (_, i) =>
        createLeaf(`leaf${i}`, `Book ${i + 1}`)
      );
      const c1 = createCombine('c1', leaves[0], leaves[1]);
      const c2 = createCombine('c2', leaves[2], leaves[3]);
      const c3 = createCombine('c3', leaves[4], leaves[5]);
      const c4 = createCombine('c4', c1, c2);
      const c5 = createCombine('c5', c3, leaves[6]);
      const root = createCombine('root', c4, c5);

      expect(countNodes(root)).toBe(13);
    });
  });

  describe('getTreeDepth', () => {
    it('returns 0 for single leaf', () => {
      const leaf = createLeaf('leaf', 'Item');
      expect(getTreeDepth(leaf)).toBe(0);
    });

    it('returns 1 for simple combine', () => {
      const left = createLeaf('left', 'Left');
      const right = createLeaf('right', 'Right');
      const root = createCombine('root', left, right);
      expect(getTreeDepth(root)).toBe(1);
    });

    it('returns correct depth for deeper tree', () => {
      const leaf1 = createLeaf('leaf1', 'Leaf 1');
      const leaf2 = createLeaf('leaf2', 'Leaf 2');
      const leaf3 = createLeaf('leaf3', 'Leaf 3');
      const mid1 = createCombine('mid1', leaf1, leaf2);
      const root = createCombine('root', mid1, leaf3);
      expect(getTreeDepth(root)).toBe(2);
    });

    it('handles unbalanced trees', () => {
      // Deep left branch
      const l1 = createLeaf('l1', 'L1');
      const l2 = createLeaf('l2', 'L2');
      const l3 = createLeaf('l3', 'L3');
      const l4 = createLeaf('l4', 'L4');
      const c1 = createCombine('c1', l1, l2);
      const c2 = createCombine('c2', c1, l3);
      const root = createCombine('root', c2, l4);

      expect(getTreeDepth(root)).toBe(3);
    });
  });
});
