// src/components/solid/tree-layout.ts
// Tree utilities - the nested DOM structure IS the layout now
// These utilities are primarily for testing and tree analysis

import type { CraftingTreeNode } from '../../types/index.js';

/**
 * Node metadata for analysis (not layout positioning)
 */
export interface TreeNodeInfo {
  node: CraftingTreeNode;
  id: string;
  depth: number;
  isRoot: boolean;
  isLeaf: boolean;
  parentId?: string;
  leftChildId?: string;
  rightChildId?: string;
}

/**
 * Tree analysis result
 */
export interface TreeAnalysis {
  nodes: TreeNodeInfo[];
  nodeMap: Map<string, TreeNodeInfo>;
  maxDepth: number;
  leafCount: number;
  combineCount: number;
}

/**
 * Recursively collect all nodes with their metadata
 */
function collectNodes(
  node: CraftingTreeNode,
  depth: number,
  parentId: string | undefined,
  result: TreeNodeInfo[]
): void {
  const nodeInfo: TreeNodeInfo = {
    node,
    id: node.id,
    depth,
    parentId,
    isRoot: depth === 0,
    isLeaf: node.type === 'leaf',
  };

  if (node.type === 'combine') {
    if (node.left) {
      nodeInfo.leftChildId = node.left.id;
      collectNodes(node.left, depth + 1, node.id, result);
    }
    if (node.right) {
      nodeInfo.rightChildId = node.right.id;
      collectNodes(node.right, depth + 1, node.id, result);
    }
  }

  result.push(nodeInfo);
}

/**
 * Analyze a tree structure - useful for testing and validation
 */
export function analyzeTree(root: CraftingTreeNode): TreeAnalysis {
  const nodes: TreeNodeInfo[] = [];
  collectNodes(root, 0, undefined, nodes);

  const nodeMap = new Map<string, TreeNodeInfo>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  const leafCount = nodes.filter((n) => n.isLeaf).length;
  const combineCount = nodes.filter((n) => !n.isLeaf).length;

  return {
    nodes,
    nodeMap,
    maxDepth,
    leafCount,
    combineCount,
  };
}

/**
 * Get a node by ID from analysis result
 */
export function getNodeById(analysis: TreeAnalysis, id: string): TreeNodeInfo | undefined {
  return analysis.nodeMap.get(id);
}

/**
 * Get all leaf nodes from analysis result
 */
export function getLeafNodes(analysis: TreeAnalysis): TreeNodeInfo[] {
  return analysis.nodes.filter((n) => n.isLeaf);
}

/**
 * Get all combine nodes from analysis result
 */
export function getCombineNodes(analysis: TreeAnalysis): TreeNodeInfo[] {
  return analysis.nodes.filter((n) => !n.isLeaf);
}

/**
 * Count total nodes in tree
 */
export function countNodes(root: CraftingTreeNode): number {
  if (root.type === 'leaf') return 1;
  const leftCount = root.left ? countNodes(root.left) : 0;
  const rightCount = root.right ? countNodes(root.right) : 0;
  return 1 + leftCount + rightCount;
}

/**
 * Get tree depth (0 for single node)
 */
export function getTreeDepth(root: CraftingTreeNode): number {
  if (root.type === 'leaf') return 0;
  const leftDepth = root.left ? getTreeDepth(root.left) : 0;
  const rightDepth = root.right ? getTreeDepth(root.right) : 0;
  return 1 + Math.max(leftDepth, rightDepth);
}
