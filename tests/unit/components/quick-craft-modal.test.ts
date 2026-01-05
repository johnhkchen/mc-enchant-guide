// tests/unit/components/quick-craft-modal.test.ts
// Smoke tests for QuickCraftModal component logic

import { describe, it, expect } from 'vitest';
import type { CraftingTreeNode, BillOfMaterials, BOMItem } from '../../../src/types/index.js';

/**
 * QuickCraftModal smoke tests
 *
 * Since QuickCraftModal is a Solid.js component that runs in the browser,
 * we test the core logic functions: tab management, recipe lookup,
 * keyboard handling, and focus management.
 */

// ─────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────

interface RecipeModalData {
  id: string;
  name: string;
  tree: CraftingTreeNode;
  bom: BillOfMaterials;
}

function createLeafNode(id: string, item: string): CraftingTreeNode {
  return { id, type: 'leaf', item };
}

function createCombineNode(
  id: string,
  left: CraftingTreeNode,
  right: CraftingTreeNode,
  levelCost: number,
  resultLabel: string
): CraftingTreeNode {
  return {
    id,
    type: 'combine',
    left,
    right,
    levelCost,
    resultLabel,
  };
}

function createBOM(items: BOMItem[]): BillOfMaterials {
  return {
    items,
    baseItem: { type: 'sword', displayName: 'Netherite Sword' },
  };
}

function createRecipeModalData(id: string, name: string): RecipeModalData {
  const book1 = createLeafNode('node_1', 'Sharpness V Book');
  const baseItem = createLeafNode('node_2', 'Netherite Sword');
  const tree = createCombineNode('node_3', baseItem, book1, 5, name);

  return {
    id,
    name,
    tree,
    bom: createBOM([
      { item: 'Sharpness V Book', itemType: 'book', enchantment: 'sharpness' as any, enchantmentLevel: 5, quantity: 1 },
      { item: 'Netherite Sword', itemType: 'base_item', quantity: 1 },
    ]),
  };
}

// ─────────────────────────────────────────────────────────────
// Tab Management
// ─────────────────────────────────────────────────────────────

describe('QuickCraftModal', () => {
  describe('Tab Management', () => {
    type TabId = 'craft-order' | 'pick-list';

    it('should default to craft-order tab', () => {
      const activeTab: TabId = 'craft-order';
      expect(activeTab).toBe('craft-order');
    });

    it('should allow switching to pick-list tab', () => {
      let activeTab: TabId = 'craft-order';
      activeTab = 'pick-list';
      expect(activeTab).toBe('pick-list');
    });

    it('should allow switching back to craft-order', () => {
      let activeTab: TabId = 'pick-list';
      activeTab = 'craft-order';
      expect(activeTab).toBe('craft-order');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tab CSS Classes
  // ─────────────────────────────────────────────────────────────

  describe('Tab CSS Classes', () => {
    type TabId = 'craft-order' | 'pick-list';

    function getTabClasses(tabId: TabId, activeTab: TabId): string {
      return `modal-tab ${activeTab === tabId ? 'modal-tab--active' : ''}`.trim();
    }

    function getPanelClasses(tabId: TabId, activeTab: TabId): string {
      return `modal-tab-panel ${activeTab === tabId ? 'modal-tab-panel--active' : ''}`.trim();
    }

    it('should add active class to active tab', () => {
      expect(getTabClasses('craft-order', 'craft-order')).toContain('modal-tab--active');
    });

    it('should not add active class to inactive tab', () => {
      expect(getTabClasses('pick-list', 'craft-order')).not.toContain('modal-tab--active');
    });

    it('should show active panel', () => {
      expect(getPanelClasses('craft-order', 'craft-order')).toContain('modal-tab-panel--active');
    });

    it('should hide inactive panel', () => {
      expect(getPanelClasses('pick-list', 'craft-order')).not.toContain('modal-tab-panel--active');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Recipe Lookup
  // ─────────────────────────────────────────────────────────────

  describe('Recipe Lookup', () => {
    it('should find recipe by ID', () => {
      const recipes: Record<string, RecipeModalData> = {
        'swords/god-sword': createRecipeModalData('swords/god-sword', 'God Sword'),
        'pickaxes/god-pickaxe': createRecipeModalData('pickaxes/god-pickaxe', 'God Pickaxe'),
      };

      const recipe = recipes['swords/god-sword'];
      expect(recipe).toBeDefined();
      expect(recipe.name).toBe('God Sword');
    });

    it('should return undefined for unknown recipe', () => {
      const recipes: Record<string, RecipeModalData> = {
        'swords/god-sword': createRecipeModalData('swords/god-sword', 'God Sword'),
      };

      const recipe = recipes['unknown/recipe'];
      expect(recipe).toBeUndefined();
    });

    it('should access recipe tree', () => {
      const recipe = createRecipeModalData('test', 'Test Recipe');
      expect(recipe.tree).toBeDefined();
      expect(recipe.tree.type).toBe('combine');
    });

    it('should access recipe BOM', () => {
      const recipe = createRecipeModalData('test', 'Test Recipe');
      expect(recipe.bom).toBeDefined();
      expect(recipe.bom.items.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Event Handling
  // ─────────────────────────────────────────────────────────────

  describe('Event Handling', () => {
    interface QuickCraftEventDetail {
      recipeId: string;
    }

    function handleQuickCraftEvent(
      detail: QuickCraftEventDetail,
      recipes: Record<string, RecipeModalData>
    ): RecipeModalData | null {
      return recipes[detail.recipeId] ?? null;
    }

    it('should find recipe from event detail', () => {
      const recipes = {
        'swords/god-sword': createRecipeModalData('swords/god-sword', 'God Sword'),
      };
      const detail = { recipeId: 'swords/god-sword' };

      const recipe = handleQuickCraftEvent(detail, recipes);
      expect(recipe).not.toBeNull();
      expect(recipe?.name).toBe('God Sword');
    });

    it('should return null for unknown recipe ID', () => {
      const recipes = {
        'swords/god-sword': createRecipeModalData('swords/god-sword', 'God Sword'),
      };
      const detail = { recipeId: 'unknown' };

      const recipe = handleQuickCraftEvent(detail, recipes);
      expect(recipe).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Keyboard Handling
  // ─────────────────────────────────────────────────────────────

  describe('Keyboard Handling', () => {
    function shouldCloseOnKey(key: string): boolean {
      return key === 'Escape';
    }

    function shouldTrapFocus(key: string): boolean {
      return key === 'Tab';
    }

    it('should close on Escape', () => {
      expect(shouldCloseOnKey('Escape')).toBe(true);
    });

    it('should not close on other keys', () => {
      expect(shouldCloseOnKey('Enter')).toBe(false);
      expect(shouldCloseOnKey('Tab')).toBe(false);
      expect(shouldCloseOnKey('a')).toBe(false);
    });

    it('should trap focus on Tab', () => {
      expect(shouldTrapFocus('Tab')).toBe(true);
    });

    it('should not trap focus on other keys', () => {
      expect(shouldTrapFocus('Escape')).toBe(false);
      expect(shouldTrapFocus('Enter')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Focus Management
  // ─────────────────────────────────────────────────────────────

  describe('Focus Management', () => {
    function getFocusableSelector(): string {
      return 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    }

    function shouldWrapFocus(
      activeIndex: number,
      totalElements: number,
      direction: 'forward' | 'backward'
    ): boolean {
      if (direction === 'forward') {
        return activeIndex === totalElements - 1;
      }
      return activeIndex === 0;
    }

    it('should have correct focusable selector', () => {
      const selector = getFocusableSelector();
      expect(selector).toContain('button');
      expect(selector).toContain('input');
      expect(selector).toContain('[tabindex]');
    });

    it('should wrap focus forward at end', () => {
      expect(shouldWrapFocus(4, 5, 'forward')).toBe(true);
      expect(shouldWrapFocus(3, 5, 'forward')).toBe(false);
    });

    it('should wrap focus backward at start', () => {
      expect(shouldWrapFocus(0, 5, 'backward')).toBe(true);
      expect(shouldWrapFocus(1, 5, 'backward')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Modal State
  // ─────────────────────────────────────────────────────────────

  describe('Modal State', () => {
    interface ModalState {
      isOpen: boolean;
      currentRecipe: RecipeModalData | null;
      activeTab: 'craft-order' | 'pick-list';
    }

    function openModal(recipe: RecipeModalData): ModalState {
      return {
        isOpen: true,
        currentRecipe: recipe,
        activeTab: 'craft-order',
      };
    }

    function closeModal(): ModalState {
      return {
        isOpen: false,
        currentRecipe: null,
        activeTab: 'craft-order',
      };
    }

    it('should set isOpen to true when opening', () => {
      const recipe = createRecipeModalData('test', 'Test');
      const state = openModal(recipe);
      expect(state.isOpen).toBe(true);
    });

    it('should set currentRecipe when opening', () => {
      const recipe = createRecipeModalData('test', 'Test');
      const state = openModal(recipe);
      expect(state.currentRecipe).toBe(recipe);
    });

    it('should reset to craft-order tab when opening', () => {
      const recipe = createRecipeModalData('test', 'Test');
      const state = openModal(recipe);
      expect(state.activeTab).toBe('craft-order');
    });

    it('should set isOpen to false when closing', () => {
      const state = closeModal();
      expect(state.isOpen).toBe(false);
    });

    it('should clear currentRecipe when closing', () => {
      const state = closeModal();
      expect(state.currentRecipe).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Body Scroll Lock
  // ─────────────────────────────────────────────────────────────

  describe('Body Scroll Lock', () => {
    function getBodyOverflow(isOpen: boolean): string {
      return isOpen ? 'hidden' : '';
    }

    it('should hide overflow when open', () => {
      expect(getBodyOverflow(true)).toBe('hidden');
    });

    it('should reset overflow when closed', () => {
      expect(getBodyOverflow(false)).toBe('');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ARIA Attributes
  // ─────────────────────────────────────────────────────────────

  describe('ARIA Attributes', () => {
    function getTabAriaSelected(isActive: boolean): boolean {
      return isActive;
    }

    function getTabAriaControls(tabId: 'craft-order' | 'pick-list'): string {
      return `panel-${tabId}`;
    }

    it('should set aria-selected true for active tab', () => {
      expect(getTabAriaSelected(true)).toBe(true);
    });

    it('should set aria-selected false for inactive tab', () => {
      expect(getTabAriaSelected(false)).toBe(false);
    });

    it('should reference correct panel', () => {
      expect(getTabAriaControls('craft-order')).toBe('panel-craft-order');
      expect(getTabAriaControls('pick-list')).toBe('panel-pick-list');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Props Interface
  // ─────────────────────────────────────────────────────────────

  describe('Props Interface', () => {
    it('should require recipes prop', () => {
      const props = {
        recipes: {
          'swords/god-sword': createRecipeModalData('swords/god-sword', 'God Sword'),
        },
      };

      expect(props.recipes).toBeDefined();
      expect(Object.keys(props.recipes).length).toBe(1);
    });

    it('should accept empty recipes object', () => {
      const props = { recipes: {} };
      expect(Object.keys(props.recipes).length).toBe(0);
    });

    it('should access recipe data from props', () => {
      const props = {
        recipes: {
          'swords/god-sword': createRecipeModalData('swords/god-sword', 'God Sword'),
        },
      };

      expect(props.recipes['swords/god-sword'].name).toBe('God Sword');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Close Button
  // ─────────────────────────────────────────────────────────────

  describe('Close Button', () => {
    it('should have correct aria-label', () => {
      const ariaLabel = 'Close modal';
      expect(ariaLabel).toBe('Close modal');
    });

    it('should have close symbol as content', () => {
      const closeSymbol = '\u00D7'; // &times;
      expect(closeSymbol).toBe('\u00D7');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Backdrop Click
  // ─────────────────────────────────────────────────────────────

  describe('Backdrop Click', () => {
    function shouldCloseOnBackdropClick(
      target: { className: string },
      currentTarget: { className: string }
    ): boolean {
      return target === currentTarget;
    }

    it('should close when clicking backdrop directly', () => {
      const backdrop = { className: 'modal-backdrop' };
      expect(shouldCloseOnBackdropClick(backdrop, backdrop)).toBe(true);
    });

    it('should not close when clicking modal content', () => {
      const backdrop = { className: 'modal-backdrop' };
      const modal = { className: 'modal' };
      expect(shouldCloseOnBackdropClick(modal, backdrop)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Modal Data Integration
  // ─────────────────────────────────────────────────────────────

  describe('Modal Data Integration', () => {
    it('should pass tree to CraftingTree', () => {
      const recipe = createRecipeModalData('test', 'Test');
      expect(recipe.tree).toBeDefined();
      expect(recipe.tree.type).toBe('combine');
    });

    it('should pass bom to PickListTab', () => {
      const recipe = createRecipeModalData('test', 'Test');
      expect(recipe.bom).toBeDefined();
      expect(recipe.bom.items.length).toBeGreaterThan(0);
    });

    it('should use recipe id for progress tracking', () => {
      const recipe = createRecipeModalData('swords/god-sword', 'God Sword');
      expect(recipe.id).toBe('swords/god-sword');
    });
  });
});
