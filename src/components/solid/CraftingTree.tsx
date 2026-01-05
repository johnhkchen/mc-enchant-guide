// src/components/solid/CraftingTree.tsx
// Interactive crafting tree visualization with nested HTML structure

import { createSignal, createMemo, createEffect, onMount, onCleanup, Show } from 'solid-js';
import type { CraftingTreeNode } from '../../types/index.js';
import {
  toggleNode,
  reset,
  isCompleted,
  getCompletionPercent,
  progress,
} from '../../stores/craft-progress.js';
import { TreeNode } from './TreeNode.js';

export interface CraftingTreeProps {
  tree: CraftingTreeNode;
  recipeId: string;
  recipeName?: string;
  showHeader?: boolean;
}

/**
 * Count combine nodes for progress tracking
 */
function countCombineNodes(node: CraftingTreeNode): number {
  if (node.type === 'leaf') return 0;
  const leftCount = node.left ? countCombineNodes(node.left) : 0;
  const rightCount = node.right ? countCombineNodes(node.right) : 0;
  return 1 + leftCount + rightCount;
}

/**
 * Count leaf nodes to estimate tree width
 */
function countLeafNodes(node: CraftingTreeNode): number {
  if (node.type === 'leaf') return 1;
  const leftCount = node.left ? countLeafNodes(node.left) : 0;
  const rightCount = node.right ? countLeafNodes(node.right) : 0;
  return leftCount + rightCount;
}

/**
 * CraftingTree renders an interactive tree using nested HTML structure.
 * - DOM hierarchy mirrors tree hierarchy (children nested inside parents)
 * - CSS handles all layout and connectors via flexbox and pseudo-elements
 * - Dynamic fit-to-width scaling on mobile
 */
export function CraftingTree(props: CraftingTreeProps): JSX.Element {
  const { tree, recipeId, recipeName, showHeader = true } = props;

  // Count steps for progress
  const totalSteps = createMemo(() => countCombineNodes(tree));
  const leafCount = createMemo(() => countLeafNodes(tree));

  // Progress tracking
  const completionPercent = createMemo(() => {
    progress();
    return getCompletionPercent(recipeId, totalSteps());
  });

  // Dynamic scaling for fit-to-width
  const [scale, setScale] = createSignal(1);
  let containerRef: HTMLDivElement | undefined;
  let treeRef: HTMLDivElement | undefined;

  function calculateScale(): void {
    if (!containerRef || !treeRef) return;

    // Only apply dynamic scaling on mobile
    if (typeof window !== 'undefined' && window.innerWidth > 640) {
      setScale(1);
      return;
    }

    const containerWidth = containerRef.clientWidth;
    const treeWidth = treeRef.scrollWidth;

    if (treeWidth <= 0 || containerWidth <= 0) return;

    // Calculate scale to fit, with min/max bounds
    const newScale = Math.min(1, Math.max(0.3, (containerWidth - 16) / treeWidth));
    setScale(newScale);
  }

  onMount(() => {
    if (typeof window === 'undefined') return;

    // Calculate after initial render
    requestAnimationFrame(() => {
      calculateScale();
    });

    // Recalculate on resize
    window.addEventListener('resize', calculateScale);
  });

  onCleanup(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('resize', calculateScale);
  });

  // Recalculate when tree changes
  createEffect(() => {
    // Track dependencies
    leafCount();
    requestAnimationFrame(() => {
      calculateScale();
    });
  });

  function checkIsCompleted(nodeId: string): boolean {
    progress();
    return isCompleted(recipeId, nodeId);
  }

  function handleToggle(nodeId: string): void {
    toggleNode(recipeId, nodeId);
  }

  function handleReset(): void {
    reset(recipeId);
  }

  // Style for dynamic scaling
  function getTreeStyle(): string {
    const s = scale();
    if (s >= 1) return '';
    return `transform: scale(${s}); transform-origin: top center;`;
  }

  // Empty tree case (single leaf node)
  if (tree.type === 'leaf') {
    return (
      <div class="crafting-tree">
        <Show when={showHeader}>
          <div class="crafting-tree-header">
            <span class="crafting-tree-title">{recipeName || 'Craft Order'}</span>
          </div>
        </Show>
        <div class="crafting-tree-empty">
          <span class="crafting-tree-empty-icon">&#x2692;</span>
          <span class="crafting-tree-empty-text">
            No enchantments to combine.<br />
            Just use the base item as-is!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div class="crafting-tree">
      <Show when={showHeader}>
        <div class="crafting-tree-header">
          <span class="crafting-tree-title">{recipeName || 'Craft Order'}</span>
          <div class="crafting-tree-header-right">
            <span class="crafting-tree-progress">
              {completionPercent()}% complete
            </span>
            <Show when={completionPercent() > 0}>
              <button
                type="button"
                class="crafting-tree-reset"
                onClick={handleReset}
                aria-label="Reset progress"
              >
                Reset
              </button>
            </Show>
          </div>
        </div>
      </Show>

      <div class="crafting-tree-container" ref={containerRef}>
        {/* Wrapper for measuring and scaling */}
        <div class="crafting-tree-scaler" ref={treeRef} style={getTreeStyle()}>
          <TreeNode
            node={tree}
            recipeId={recipeId}
            isRoot={true}
            isCompleted={checkIsCompleted}
            onToggle={handleToggle}
          />
        </div>
      </div>

      {/* Bottom-left reset button */}
      <Show when={completionPercent() > 0}>
        <button
          type="button"
          class="btn crafting-tree-reset-float"
          onClick={handleReset}
          aria-label="Reset progress"
        >
          Reset
        </button>
      </Show>
    </div>
  );
}

export default CraftingTree;
