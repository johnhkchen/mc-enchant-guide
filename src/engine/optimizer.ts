// src/engine/optimizer.ts
// Optimizer engine for computing minimum-cost enchantment combination trees
// Reference: https://minecraft.wiki/w/Anvil_mechanics

import type {
  EnchantmentId,
  CraftingTreeNode,
  ComputedRecipe,
  BaseItemType,
} from '../types/index.js';
import { getEnchantment, type EnchantmentData } from '../data/enchantment-lookup.js';
import { levelToXp, calculateIncrementalXp, calculateBulkXp } from './xp-calc.js';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** Survival mode anvil cost cap */
const SURVIVAL_CAP = 39;

// ─────────────────────────────────────────────────────────────
// Internal Types
// ─────────────────────────────────────────────────────────────

/**
 * Internal representation of an item during optimization.
 * Represents either a book or the base item being enchanted.
 */
export interface WorkItem {
  id: string;
  enchantments: { id: EnchantmentId; level: number }[];
  pwp: number; // Prior work penalty count (not the cost value)
  isBaseItem: boolean;
  displayName: string;
  treeNode: CraftingTreeNode; // The tree node representing this item
}

/**
 * Input enchantment specification.
 * Each entry is a single-key record like { smite: 5 }.
 */
export type EnchantmentSpec = Record<string, number>;

// ─────────────────────────────────────────────────────────────
// PWP Calculation
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the prior work penalty cost from the PWP count.
 * Formula: 2^n - 1 where n = number of prior anvil operations.
 *
 * @param pwpCount The number of prior anvil operations
 * @returns The level cost contribution from PWP
 */
export function pwpCost(pwpCount: number): number {
  return Math.pow(2, pwpCount) - 1;
}

// ─────────────────────────────────────────────────────────────
// Cost Calculation
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the level cost for combining two items on an anvil.
 * Target goes in left slot, sacrifice in right slot.
 *
 * Formula: Target PWP + Sacrifice PWP + Enchantment Costs
 * Enchantment cost = level × multiplier (book or item depending on sacrifice type)
 *
 * @param target The item in the left (target) slot
 * @param sacrifice The item in the right (sacrifice) slot
 * @returns The level cost for this operation
 */
export function calculateCombineCost(target: WorkItem, sacrifice: WorkItem): number {
  let cost = 0;

  // Add PWP costs for both items
  cost += pwpCost(target.pwp);
  cost += pwpCost(sacrifice.pwp);

  // Add enchantment costs from sacrifice
  // When sacrifice is a book, use bookMultiplier
  // When sacrifice is an item, use itemMultiplier
  for (const ench of sacrifice.enchantments) {
    const enchData = getEnchantment(ench.id as EnchantmentId);
    if (enchData) {
      const multiplier = sacrifice.isBaseItem
        ? enchData.itemMultiplier
        : enchData.bookMultiplier;
      cost += ench.level * multiplier;
    }
  }

  return cost;
}

// ─────────────────────────────────────────────────────────────
// Tree Node Generation
// ─────────────────────────────────────────────────────────────

let nodeIdCounter = 0;

/**
 * Generate a unique node ID.
 */
function generateNodeId(): string {
  return `node_${++nodeIdCounter}`;
}

/**
 * Reset the node ID counter. For testing purposes.
 */
export function _resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}

/**
 * Format enchantment level as Roman numeral.
 */
function toRomanNumeral(num: number): string {
  if (num === 1) return 'I';
  if (num === 2) return 'II';
  if (num === 3) return 'III';
  if (num === 4) return 'IV';
  if (num === 5) return 'V';
  return num.toString();
}

/**
 * Format enchantment for display.
 */
function formatEnchantment(id: EnchantmentId, level: number): string {
  const enchData = getEnchantment(id);
  const name = enchData?.name ?? id;
  if (level === 1 && (enchData?.maxLevel ?? 1) === 1) {
    return name; // Don't show "I" for single-level enchants like Mending
  }
  return `${name} ${toRomanNumeral(level)}`;
}

/**
 * Create a leaf node for a book.
 */
function createBookLeaf(enchantment: EnchantmentId, level: number): CraftingTreeNode {
  return {
    id: generateNodeId(),
    type: 'leaf',
    item: `${formatEnchantment(enchantment, level)} Book`,
    enchantments: [formatEnchantment(enchantment, level)],
  };
}

/**
 * Create a leaf node for the base item.
 */
function createBaseItemLeaf(displayName: string): CraftingTreeNode {
  return {
    id: generateNodeId(),
    type: 'leaf',
    item: displayName,
    enchantments: [],
  };
}

/**
 * Create a combine node from two child nodes.
 */
function createCombineNode(
  left: CraftingTreeNode,
  right: CraftingTreeNode,
  levelCost: number,
  xpCost: number,
  resultingPWP: number,
  resultLabel: string,
  enchantments: string[]
): CraftingTreeNode {
  return {
    id: generateNodeId(),
    type: 'combine',
    left,
    right,
    levelCost,
    xpCost,
    resultingPWP,
    resultLabel,
    enchantments,
  };
}

// ─────────────────────────────────────────────────────────────
// Work Item Creation
// ─────────────────────────────────────────────────────────────

/**
 * Create a WorkItem for a book with a single enchantment.
 */
function createBookWorkItem(enchantment: EnchantmentId, level: number): WorkItem {
  return {
    id: `book_${enchantment}_${level}`,
    enchantments: [{ id: enchantment, level }],
    pwp: 0,
    isBaseItem: false,
    displayName: `${formatEnchantment(enchantment, level)} Book`,
    treeNode: createBookLeaf(enchantment, level),
  };
}

/**
 * Create a WorkItem for the base item.
 */
function createBaseItemWorkItem(displayName: string): WorkItem {
  return {
    id: 'base_item',
    enchantments: [],
    pwp: 0,
    isBaseItem: true,
    displayName,
    treeNode: createBaseItemLeaf(displayName),
  };
}

/**
 * Combine two work items, returning the resulting work item.
 * The target's enchantments are preserved and sacrifice's are added.
 */
function combineWorkItems(
  target: WorkItem,
  sacrifice: WorkItem,
  labelIndex: number
): { result: WorkItem; cost: number } {
  const cost = calculateCombineCost(target, sacrifice);
  const newPWP = Math.max(target.pwp, sacrifice.pwp) + 1;

  // Merge enchantments
  const allEnchantments = [...target.enchantments, ...sacrifice.enchantments];
  const enchantmentStrings = allEnchantments.map((e) =>
    formatEnchantment(e.id, e.level)
  );

  // Determine result label
  const isLastStep = target.isBaseItem;
  const resultLabel = isLastStep ? target.displayName : 'Enchanted Book';

  const combineNode = createCombineNode(
    target.treeNode,
    sacrifice.treeNode,
    cost,
    levelToXp(cost),
    newPWP,
    resultLabel,
    enchantmentStrings
  );

  return {
    result: {
      id: `combined_${labelIndex}`,
      enchantments: allEnchantments,
      pwp: newPWP,
      isBaseItem: target.isBaseItem,
      displayName: resultLabel,
      treeNode: combineNode,
    },
    cost,
  };
}

// ─────────────────────────────────────────────────────────────
// Optimization Algorithm
// ─────────────────────────────────────────────────────────────

/**
 * Parse enchantment specifications into a list of (id, level) pairs.
 */
function parseEnchantmentSpecs(
  specs: EnchantmentSpec[]
): { id: EnchantmentId; level: number }[] {
  const result: { id: EnchantmentId; level: number }[] = [];

  for (const spec of specs) {
    for (const [id, level] of Object.entries(spec)) {
      result.push({ id: id as EnchantmentId, level });
    }
  }

  return result;
}

/**
 * Generate all permutations of an array.
 */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(remaining)) {
      result.push([current, ...perm]);
    }
  }
  return result;
}

interface TreeResult {
  tree: CraftingTreeNode;
  totalCost: number;
  stepCosts: number[];
  valid: boolean;
}

/**
 * Try building a tree with a specific order of books (greedy pairing).
 * This uses a left-to-right linear combining strategy.
 */
function tryLinearOrder(
  books: WorkItem[],
  baseItem: WorkItem
): TreeResult {
  if (books.length === 0) {
    // No enchantments - just return the base item
    return {
      tree: baseItem.treeNode,
      totalCost: 0,
      stepCosts: [],
      valid: true,
    };
  }

  let labelIndex = 0;
  const stepCosts: number[] = [];

  // First, combine all books pairwise, then combine with base item
  // Strategy: combine books in the given order, then add to base item at the end

  // For optimal ordering, we want to minimize total cost
  // Lower-cost enchantments should be added first to avoid high PWP multipliers

  // Build book combination tree (if multiple books)
  let currentBooks = [...books];

  // Combine books pairwise using balanced approach
  while (currentBooks.length > 1) {
    const newBooks: WorkItem[] = [];

    for (let i = 0; i < currentBooks.length; i += 2) {
      if (i + 1 < currentBooks.length) {
        // Combine pair
        const { result, cost } = combineWorkItems(
          currentBooks[i],
          currentBooks[i + 1],
          labelIndex++
        );
        if (cost > SURVIVAL_CAP) {
          return { tree: baseItem.treeNode, totalCost: Infinity, stepCosts, valid: false };
        }
        stepCosts.push(cost);
        newBooks.push(result);
      } else {
        // Odd one out, carry forward
        newBooks.push(currentBooks[i]);
      }
    }

    currentBooks = newBooks;
  }

  // Final step: combine base item with the merged book
  const finalBook = currentBooks[0];
  const { result: finalResult, cost: finalCost } = combineWorkItems(
    baseItem,
    finalBook,
    labelIndex
  );

  if (finalCost > SURVIVAL_CAP) {
    return { tree: baseItem.treeNode, totalCost: Infinity, stepCosts, valid: false };
  }
  stepCosts.push(finalCost);

  return {
    tree: finalResult.treeNode,
    totalCost: stepCosts.reduce((a, b) => a + b, 0),
    stepCosts,
    valid: true,
  };
}

/**
 * Create fresh work items from enchantment data.
 * Used to ensure each permutation attempt gets fresh tree nodes.
 */
function createFreshBookWorkItems(
  enchantments: { id: EnchantmentId; level: number }[]
): WorkItem[] {
  return enchantments.map((e) => createBookWorkItem(e.id, e.level));
}

/**
 * Try all book orderings and find the optimal one.
 * For small numbers of books, this is tractable.
 */
function findOptimalTree(
  enchantments: { id: EnchantmentId; level: number }[],
  baseItemName: string
): TreeResult {
  // Single enchantment - direct combine
  if (enchantments.length === 1) {
    _resetNodeIdCounter();
    const books = createFreshBookWorkItems(enchantments);
    const baseItem = createBaseItemWorkItem(baseItemName);
    return tryLinearOrder(books, baseItem);
  }

  // For <= 7 books, try all permutations (7! = 5040 is tractable)
  const allPerms = permutations(enchantments);
  let bestResult: TreeResult | null = null;
  let bestPerm: { id: EnchantmentId; level: number }[] | null = null;

  for (const perm of allPerms) {
    // Reset node IDs for each attempt
    _resetNodeIdCounter();
    const books = createFreshBookWorkItems(perm);
    const baseItem = createBaseItemWorkItem(baseItemName);
    const result = tryLinearOrder(books, baseItem);

    if (result.valid && (bestResult === null || result.totalCost < bestResult.totalCost)) {
      bestResult = result;
      bestPerm = perm;
    }
  }

  if (bestResult === null || bestPerm === null) {
    // All orderings exceeded the cap - return invalid result
    _resetNodeIdCounter();
    return {
      tree: createBaseItemLeaf(baseItemName),
      totalCost: Infinity,
      stepCosts: [],
      valid: false,
    };
  }

  // Rebuild the best result with fresh node IDs to ensure uniqueness
  _resetNodeIdCounter();
  const finalBooks = createFreshBookWorkItems(bestPerm);
  const finalBaseItem = createBaseItemWorkItem(baseItemName);
  return tryLinearOrder(finalBooks, finalBaseItem);
}

/**
 * Test helper: Try a specific order of books.
 * Exposed for testing edge cases like survival cap violations.
 */
export function _tryLinearOrder(
  enchantments: { id: EnchantmentId; level: number }[],
  baseItemName: string
): { valid: boolean; totalCost: number; stepCosts: number[] } {
  _resetNodeIdCounter();
  const books = createFreshBookWorkItems(enchantments);
  const baseItem = createBaseItemWorkItem(baseItemName);
  const result = tryLinearOrder(books, baseItem);
  return {
    valid: result.valid,
    totalCost: result.totalCost,
    stepCosts: result.stepCosts,
  };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Compute the optimal crafting tree for combining enchantments with a base item.
 *
 * @param enchantmentList Array of enchantment specifications, e.g., [{ smite: 5 }, { looting: 3 }]
 * @param baseItemName Display name of the base item (e.g., "Netherite Sword")
 * @returns The optimal crafting tree node
 */
export function computeOptimalTree(
  enchantmentList: EnchantmentSpec[],
  baseItemName: string
): CraftingTreeNode {
  _resetNodeIdCounter();

  // Parse enchantments
  const enchantments = parseEnchantmentSpecs(enchantmentList);

  // Handle edge cases
  if (enchantments.length === 0) {
    // No enchantments - just return base item
    return createBaseItemLeaf(baseItemName);
  }

  // Sort enchantments by cost (lower cost first is generally better)
  // This gives us a good starting point for optimization
  enchantments.sort((a, b) => {
    const aData = getEnchantment(a.id);
    const bData = getEnchantment(b.id);
    const aCost = (aData?.bookMultiplier ?? 1) * a.level;
    const bCost = (bData?.bookMultiplier ?? 1) * b.level;
    return aCost - bCost;
  });

  // Find optimal tree
  const result = findOptimalTree(enchantments, baseItemName);

  return result.tree;
}

/**
 * Compute a complete recipe from enchantments and base item.
 * Returns the tree along with cost calculations.
 *
 * @param enchantmentList Array of enchantment specifications
 * @param baseItemName Display name of the base item
 * @returns Complete computed recipe with tree and costs
 */
export function computeRecipe(
  enchantmentList: EnchantmentSpec[],
  baseItemName: string
): ComputedRecipe {
  _resetNodeIdCounter();

  const enchantments = parseEnchantmentSpecs(enchantmentList);

  if (enchantments.length === 0) {
    return {
      tree: createBaseItemLeaf(baseItemName),
      totalLevelCost: 0,
      totalXpCost: 0,
      totalXpCostBulk: 0,
      stepCount: 0,
    };
  }

  // Sort enchantments by cost
  enchantments.sort((a, b) => {
    const aData = getEnchantment(a.id);
    const bData = getEnchantment(b.id);
    const aCost = (aData?.bookMultiplier ?? 1) * a.level;
    const bCost = (bData?.bookMultiplier ?? 1) * b.level;
    return aCost - bCost;
  });

  const result = findOptimalTree(enchantments, baseItemName);

  return {
    tree: result.tree,
    totalLevelCost: result.totalCost,
    totalXpCost: calculateIncrementalXp(result.stepCosts),
    totalXpCostBulk: calculateBulkXp(result.stepCosts),
    stepCount: result.stepCosts.length,
  };
}

/**
 * Check if a recipe is valid (all steps under survival cap).
 *
 * @param enchantmentList Array of enchantment specifications
 * @param baseItemName Display name of the base item
 * @returns true if all steps are under 39 levels
 */
export function isRecipeValid(
  enchantmentList: EnchantmentSpec[],
  baseItemName: string
): boolean {
  const recipe = computeRecipe(enchantmentList, baseItemName);
  return recipe.totalLevelCost < Infinity;
}
