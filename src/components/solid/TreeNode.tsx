// src/components/solid/TreeNode.tsx
// Recursive tree node component - nested HTML structure for proper hierarchy

import { Show, For, createMemo } from 'solid-js';
import type { CraftingTreeNode } from '../../types/index.js';
import { progress } from '../../stores/craft-progress.js';

export interface TreeNodeProps {
  node: CraftingTreeNode;
  recipeId: string;
  isRoot?: boolean;
  isConsumed?: () => boolean;
  isCompleted: (nodeId: string) => boolean;
  onToggle: (nodeId: string) => void;
}

/**
 * Convert item display name to icon filename.
 * e.g., "Netherite Sword" -> "minecraft_netherite_sword"
 *       "Enchanted Book" -> "minecraft_enchanted_book"
 */
function getIconFilename(displayName: string): string {
  // Handle "Gold" -> "Golden" for armor/tools
  let normalized = displayName
    .toLowerCase()
    .replace(/\s+/g, '_');

  // Map "gold_" prefix to "golden_" (Minecraft naming convention)
  if (normalized.startsWith('gold_')) {
    normalized = 'golden_' + normalized.slice(5);
  }

  return `minecraft_${normalized}`;
}

/**
 * Get the icon path for an item. Returns null if no icon available.
 */
function getItemIconPath(displayName: string | undefined): string | null {
  if (!displayName) return null;
  const filename = getIconFilename(displayName);
  return `/items/${filename}.png`;
}

/**
 * Determine if a leaf node represents a base item (not a book).
 */
function isBaseItemLeaf(node: CraftingTreeNode): boolean {
  if (node.type !== 'leaf' || !node.item) return false;
  return !node.item.endsWith('Book');
}

/**
 * Get display name for leaf node - books show "Enchanted Book", items show actual name.
 */
function getLeafDisplayName(node: CraftingTreeNode): string {
  if (!node.item) return '';
  // Books display as "Enchanted Book" (enchantments shown separately)
  if (node.item.endsWith('Book')) {
    return 'Enchanted Book';
  }
  return node.item;
}

/**
 * Determine if a combine node result is an Enchanted Book (not the final item).
 */
function isEnchantedBookResult(node: CraftingTreeNode): boolean {
  if (node.type !== 'combine') return false;
  return node.resultLabel === 'Enchanted Book';
}

/**
 * Check if a node is a simple leaf (no complex subtree)
 */
function isSimpleLeaf(node: CraftingTreeNode | undefined): boolean {
  return node?.type === 'leaf';
}

/**
 * Analyze children to determine layout strategy.
 * Returns which child (if any) should be rendered inline with the parent.
 */
function analyzeChildren(left: CraftingTreeNode | undefined, right: CraftingTreeNode | undefined): {
  inlineLeaf: CraftingTreeNode | null;
  subtreeChild: CraftingTreeNode | null;
  layoutClass: string;
} {
  const leftIsLeaf = isSimpleLeaf(left);
  const rightIsLeaf = isSimpleLeaf(right);

  // Both leaves or both complex: standard layout
  if (leftIsLeaf === rightIsLeaf) {
    return {
      inlineLeaf: null,
      subtreeChild: null,
      layoutClass: leftIsLeaf && rightIsLeaf ? 'tree-children--both-leaves' : '',
    };
  }

  // Asymmetric: one leaf, one complex subtree
  // Render the leaf inline with parent, only subtree goes in .tree-children
  if (leftIsLeaf && !rightIsLeaf) {
    return {
      inlineLeaf: left!,
      subtreeChild: right!,
      layoutClass: 'tree-children--single',
    };
  }

  // Right is leaf, left is complex
  return {
    inlineLeaf: right!,
    subtreeChild: left!,
    layoutClass: 'tree-children--single',
  };
}

/**
 * TreeNode renders a node and its children recursively.
 * Structure: children (if combine) rendered ABOVE content for top-down visual flow.
 */
export function TreeNode(props: TreeNodeProps): JSX.Element {
  // Don't destructure isConsumed - access via props for reactivity
  const { node, recipeId, isRoot = false, isCompleted, onToggle } = props;

  // Leaf node - just content, no children
  if (node.type === 'leaf') {
    const isBase = isBaseItemLeaf(node);
    const displayName = getLeafDisplayName(node);
    const iconPath = getItemIconPath(displayName);
    return (
      <div
        class={`tree-node tree-node--leaf ${isBase ? 'tree-node--base' : ''} ${props.isConsumed?.() ? 'tree-node--consumed' : ''}`}
        data-node-id={node.id}
        data-node-type="leaf"
      >
        <div class="tree-node-content">
          <Show when={iconPath}>
            <img src={iconPath!} alt="" class="tree-node-icon" />
          </Show>
          <span class="tree-node-item tree-node-item--subtitle">{displayName}</span>
          <Show when={node.enchantments && node.enchantments.length > 0}>
            <div class="tree-node-enchants">
              <For each={node.enchantments}>
                {(ench) => <span class="tree-node-enchant">{ench}</span>}
              </For>
            </div>
          </Show>
        </div>
      </div>
    );
  }

  // Combine node - children first, then content
  // Use createMemo for reactive updates when progress changes
  const completed = createMemo(() => {
    progress(); // Subscribe to progress changes
    return isCompleted(node.id);
  });
  // Children are consumed if this node is completed
  const childrenConsumed = createMemo(() => completed());

  function handleClick(e: MouseEvent): void {
    e.stopPropagation();
    onToggle(node.id);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(node.id);
    }
  }

  // Analyze children for layout strategy
  const { inlineLeaf, subtreeChild, layoutClass } = analyzeChildren(node.left, node.right);
  const isBook = isEnchantedBookResult(node);

  return (
    <div
      class={`tree-node tree-node--combine ${isRoot ? 'tree-node--root' : ''} ${completed() ? 'tree-node--completed' : ''} ${props.isConsumed?.() ? 'tree-node--consumed' : ''} ${isBook ? 'tree-node--book' : ''}`}
      data-node-id={node.id}
      data-node-type="combine"
    >
      {/* Children rendered ABOVE parent content for top-down flow */}
      <div class={`tree-children ${layoutClass}`}>
        <Show when={inlineLeaf === null}>
          {/* Standard layout: both children in tree-children */}
          <Show when={node.left}>
            <TreeNode
              node={node.left!}
              recipeId={recipeId}
              isConsumed={childrenConsumed}
              isCompleted={isCompleted}
              onToggle={onToggle}
            />
          </Show>
          <Show when={node.right}>
            <TreeNode
              node={node.right!}
              recipeId={recipeId}
              isConsumed={childrenConsumed}
              isCompleted={isCompleted}
              onToggle={onToggle}
            />
          </Show>
        </Show>
        <Show when={inlineLeaf !== null && subtreeChild !== null}>
          {/* Asymmetric layout: only subtree in tree-children */}
          <TreeNode
            node={subtreeChild!}
            recipeId={recipeId}
            isConsumed={childrenConsumed}
            isCompleted={isCompleted}
            onToggle={onToggle}
          />
        </Show>
      </div>

      {/* Parent content with optional inline leaf */}
      <div class={`tree-node-content-row ${inlineLeaf ? 'tree-node-content-row--with-leaf' : ''}`}>
        {/* Inline leaf rendered adjacent to parent content */}
        <Show when={inlineLeaf}>
          {(() => {
            const leafDisplayName = getLeafDisplayName(inlineLeaf!);
            const leafIconPath = getItemIconPath(leafDisplayName);
            return (
              <div class="tree-inline-leaf">
                <div
                  class={`tree-node tree-node--leaf ${isBaseItemLeaf(inlineLeaf!) ? 'tree-node--base' : ''} ${childrenConsumed() ? 'tree-node--consumed' : ''}`}
                  data-node-id={inlineLeaf!.id}
                  data-node-type="leaf"
                >
                  <div class="tree-node-content">
                    <Show when={leafIconPath}>
                      <img src={leafIconPath!} alt="" class="tree-node-icon" />
                    </Show>
                    <span class="tree-node-item tree-node-item--subtitle">{leafDisplayName}</span>
                    <Show when={inlineLeaf!.enchantments && inlineLeaf!.enchantments.length > 0}>
                      <div class="tree-node-enchants">
                        <For each={inlineLeaf!.enchantments}>
                          {(ench) => <span class="tree-node-enchant">{ench}</span>}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            );
          })()}
        </Show>

        {/* Parent content - entire box is clickable */}
        <div
          class="tree-node-content tree-node-content--clickable"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="checkbox"
          aria-checked={completed()}
          aria-label={`Mark step "${node.resultLabel}" as ${completed() ? 'incomplete' : 'complete'}`}
        >
          <input
            type="checkbox"
            class="tree-node-checkbox"
            checked={completed()}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
          />
          <span class="tree-node-cost">
            {node.levelCost}
            <span class="tree-node-cost-suffix">lvl</span>
          </span>

          {(() => {
            const resultIconPath = getItemIconPath(node.resultLabel);
            return (
              <>
                <Show when={resultIconPath}>
                  <img src={resultIconPath!} alt="" class="tree-node-icon" />
                </Show>
                <span class="tree-node-result tree-node-result--subtitle">{node.resultLabel}</span>
              </>
            );
          })()}

          <Show when={node.enchantments && node.enchantments.length > 0}>
            <div class="tree-node-enchants">
              <For each={node.enchantments}>
                {(ench) => <span class="tree-node-enchant">{ench}</span>}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

export default TreeNode;
