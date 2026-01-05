// src/components/solid/QuickCraftModal.tsx
// Quick Craft modal with two tabs: Craft Order (tree) and Pick List (BOM)
// Features: draggable header, resizable edges/corners, viewport constraints

import { createSignal, createEffect, onMount, onCleanup, Show } from 'solid-js';
import type { CraftingTreeNode, BillOfMaterials } from '../../types/index.js';
import { CraftingTree } from './CraftingTree.js';
import { PickListTab } from './PickListTab.js';

export interface RecipeModalData {
  id: string;
  name: string;
  tree: CraftingTreeNode;
  bom: BillOfMaterials;
}

export interface QuickCraftModalProps {
  /** Map of recipe ID to recipe data (pre-computed at build time) */
  recipes: Record<string, RecipeModalData>;
}

type TabId = 'craft-order' | 'pick-list';

// Resize handle directions
type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

// Constants for size constraints
const DEFAULT_WIDTH = 900;
const MIN_WIDTH = 500;
const MIN_HEIGHT = 400;
const VIEWPORT_PADDING = 16;

// Calculate default height as 95% of viewport
function getDefaultHeight(): number {
  if (typeof window === 'undefined') return 650;
  return Math.floor(window.innerHeight * 0.95 - VIEWPORT_PADDING * 2);
}

/**
 * QuickCraftModal is a two-tab modal for viewing crafting details.
 * - Craft Order tab: Shows the optimized combination tree
 * - Pick List tab: Shows materials checklist with copy button
 *
 * Opens in response to 'quick-craft' custom events from RecipeCard.
 * Supports dragging by header and resizing by edges/corners.
 */
export function QuickCraftModal(props: QuickCraftModalProps): JSX.Element {
  const [isOpen, setIsOpen] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<TabId>('craft-order');
  const [currentRecipe, setCurrentRecipe] = createSignal<RecipeModalData | null>(null);

  // Position and size state
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [size, setSize] = createSignal({ width: DEFAULT_WIDTH, height: 650 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const [resizeDirection, setResizeDirection] = createSignal<ResizeDirection | null>(null);

  // Track starting positions for drag/resize
  let dragStartPos = { x: 0, y: 0 };
  let dragStartModalPos = { x: 0, y: 0 };
  let resizeStartPos = { x: 0, y: 0 };
  let resizeStartSize = { width: 0, height: 0 };
  let resizeStartModalPos = { x: 0, y: 0 };

  let modalRef: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;

  // Check if running in browser
  function isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Check if mobile viewport
  function isMobile(): boolean {
    if (!isBrowser()) return false;
    return window.innerWidth <= 640;
  }

  // Center modal in viewport
  function centerModal(): void {
    if (!isBrowser()) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const currentSize = size();

    // Use actual size or defaults
    const modalWidth = Math.min(currentSize.width, viewportWidth - VIEWPORT_PADDING * 2);
    const modalHeight = Math.min(currentSize.height, viewportHeight - VIEWPORT_PADDING * 2);

    setPosition({
      x: Math.max(VIEWPORT_PADDING, (viewportWidth - modalWidth) / 2),
      y: Math.max(VIEWPORT_PADDING, (viewportHeight - modalHeight) / 2),
    });
    setSize({ width: modalWidth, height: modalHeight });
  }

  // Constrain position to viewport
  function constrainToViewport(x: number, y: number): { x: number; y: number } {
    if (!isBrowser()) return { x, y };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const currentSize = size();

    return {
      x: Math.max(VIEWPORT_PADDING, Math.min(x, viewportWidth - currentSize.width - VIEWPORT_PADDING)),
      y: Math.max(VIEWPORT_PADDING, Math.min(y, viewportHeight - currentSize.height - VIEWPORT_PADDING)),
    };
  }

  // Constrain size to min/max and viewport
  function constrainSize(
    width: number,
    height: number,
    newX?: number,
    newY?: number
  ): { width: number; height: number; x: number; y: number } {
    if (!isBrowser()) return { width, height, x: newX ?? position().x, y: newY ?? position().y };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const currentPos = position();
    const x = newX ?? currentPos.x;
    const y = newY ?? currentPos.y;

    // Constrain to min/max
    let constrainedWidth = Math.max(MIN_WIDTH, width);
    let constrainedHeight = Math.max(MIN_HEIGHT, height);

    // Constrain to viewport
    constrainedWidth = Math.min(constrainedWidth, viewportWidth - x - VIEWPORT_PADDING);
    constrainedHeight = Math.min(constrainedHeight, viewportHeight - y - VIEWPORT_PADDING);

    return { width: constrainedWidth, height: constrainedHeight, x, y };
  }

  // Handle quick-craft event
  function handleQuickCraftEvent(e: CustomEvent<{ recipeId: string }>): void {
    const { recipeId } = e.detail;
    const recipe = props.recipes[recipeId];

    if (recipe) {
      previousFocus = document.activeElement as HTMLElement;
      setCurrentRecipe(recipe);
      setActiveTab('craft-order');
      // Reset size and center modal - use 95% of viewport height
      setSize({ width: DEFAULT_WIDTH, height: getDefaultHeight() });
      setIsOpen(true);
      // Center after state update
      requestAnimationFrame(() => centerModal());
    }
  }

  // Close modal
  function closeModal(): void {
    setIsOpen(false);
    setCurrentRecipe(null);
    setIsDragging(false);
    setIsResizing(false);

    // Restore focus
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  }

  // Handle escape key
  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      closeModal();
    }

    // Tab trap
    if (e.key === 'Tab' && isOpen() && modalRef) {
      const focusableElements = modalRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const focusable = Array.from(focusableElements);

      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap to last element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: wrap to first element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  // Handle backdrop click
  function handleBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Drag Handlers
  // ─────────────────────────────────────────────────────────────

  function handleDragStart(e: MouseEvent): void {
    // Ignore if clicking on close button or on mobile
    if ((e.target as HTMLElement).closest('.modal-close') || isMobile()) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartPos = { x: e.clientX, y: e.clientY };
    dragStartModalPos = { ...position() };
  }

  function handleDragMove(e: MouseEvent): void {
    if (!isDragging()) return;

    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;

    const newPos = constrainToViewport(
      dragStartModalPos.x + deltaX,
      dragStartModalPos.y + deltaY
    );
    setPosition(newPos);
  }

  function handleDragEnd(): void {
    setIsDragging(false);
  }

  // ─────────────────────────────────────────────────────────────
  // Resize Handlers
  // ─────────────────────────────────────────────────────────────

  function handleResizeStart(e: MouseEvent, direction: ResizeDirection): void {
    if (isMobile()) return;

    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartPos = { x: e.clientX, y: e.clientY };
    resizeStartSize = { ...size() };
    resizeStartModalPos = { ...position() };
  }

  function handleResizeMove(e: MouseEvent): void {
    if (!isResizing()) return;

    const dir = resizeDirection();
    if (!dir) return;

    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;

    let newWidth = resizeStartSize.width;
    let newHeight = resizeStartSize.height;
    let newX = resizeStartModalPos.x;
    let newY = resizeStartModalPos.y;

    // Handle horizontal resize
    if (dir.includes('e')) {
      newWidth = resizeStartSize.width + deltaX;
    } else if (dir.includes('w')) {
      newWidth = resizeStartSize.width - deltaX;
      newX = resizeStartModalPos.x + deltaX;
      // Ensure we don't go below min width
      if (newWidth < MIN_WIDTH) {
        newX = resizeStartModalPos.x + resizeStartSize.width - MIN_WIDTH;
        newWidth = MIN_WIDTH;
      }
    }

    // Handle vertical resize
    if (dir.includes('s')) {
      newHeight = resizeStartSize.height + deltaY;
    } else if (dir.includes('n')) {
      newHeight = resizeStartSize.height - deltaY;
      newY = resizeStartModalPos.y + deltaY;
      // Ensure we don't go below min height
      if (newHeight < MIN_HEIGHT) {
        newY = resizeStartModalPos.y + resizeStartSize.height - MIN_HEIGHT;
        newHeight = MIN_HEIGHT;
      }
    }

    // Constrain to viewport
    const constrained = constrainSize(newWidth, newHeight, newX, newY);

    // For west/north resizing, adjust position if size was constrained
    if (dir.includes('w') && constrained.width !== newWidth) {
      constrained.x = resizeStartModalPos.x + resizeStartSize.width - constrained.width;
    }
    if (dir.includes('n') && constrained.height !== newHeight) {
      constrained.y = resizeStartModalPos.y + resizeStartSize.height - constrained.height;
    }

    setSize({ width: constrained.width, height: constrained.height });
    setPosition({ x: constrained.x, y: constrained.y });
  }

  function handleResizeEnd(): void {
    setIsResizing(false);
    setResizeDirection(null);
  }

  // Global mouse handlers for drag/resize
  function handleGlobalMouseMove(e: MouseEvent): void {
    if (isDragging()) {
      handleDragMove(e);
    } else if (isResizing()) {
      handleResizeMove(e);
    }
  }

  function handleGlobalMouseUp(): void {
    if (isDragging()) {
      handleDragEnd();
    } else if (isResizing()) {
      handleResizeEnd();
    }
  }

  // Focus first focusable element when modal opens
  createEffect(() => {
    if (isOpen() && modalRef) {
      const closeBtn = modalRef.querySelector<HTMLButtonElement>('.modal-close');
      if (closeBtn) {
        closeBtn.focus();
      }
    }
  });

  // Set up event listeners
  onMount(() => {
    if (!isBrowser()) return;
    window.addEventListener('quick-craft', handleQuickCraftEvent as EventListener);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  });

  onCleanup(() => {
    if (!isBrowser()) return;
    window.removeEventListener('quick-craft', handleQuickCraftEvent as EventListener);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  });

  // Prevent body scroll when modal is open
  createEffect(() => {
    if (!isBrowser()) return;
    if (isOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  // Handle window resize - recenter if needed
  createEffect(() => {
    if (!isBrowser() || !isOpen()) return;

    function handleWindowResize(): void {
      if (isMobile()) return;
      // Constrain to new viewport size
      const currentPos = position();
      const currentSize = size();
      const constrained = constrainToViewport(currentPos.x, currentPos.y);
      if (constrained.x !== currentPos.x || constrained.y !== currentPos.y) {
        setPosition(constrained);
      }
      // Also constrain size
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (currentSize.width > viewportWidth - VIEWPORT_PADDING * 2 ||
          currentSize.height > viewportHeight - VIEWPORT_PADDING * 2) {
        setSize({
          width: Math.min(currentSize.width, viewportWidth - VIEWPORT_PADDING * 2),
          height: Math.min(currentSize.height, viewportHeight - VIEWPORT_PADDING * 2),
        });
      }
    }

    window.addEventListener('resize', handleWindowResize);
    onCleanup(() => window.removeEventListener('resize', handleWindowResize));
  });

  // Compute modal styles
  function getModalStyle(): string {
    if (isMobile()) return '';
    const pos = position();
    const sz = size();
    return `left: ${pos.x}px; top: ${pos.y}px; width: ${sz.width}px; height: ${sz.height}px;`;
  }

  // Compute modal classes
  function getModalClasses(): string {
    const classes = ['modal'];
    if (isDragging()) classes.push('modal--dragging');
    if (isResizing()) classes.push('modal--resizing');
    return classes.join(' ');
  }

  return (
    <Show when={isOpen() && currentRecipe()}>
      <div
        class="modal-backdrop"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-craft-title"
      >
        <div
          class={getModalClasses()}
          style={getModalStyle()}
          ref={modalRef}
        >
          {/* Resize Handles (hidden on mobile via CSS) */}
          <div
            class="modal-resize-handle modal-resize-handle--n"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            class="modal-resize-handle modal-resize-handle--s"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div
            class="modal-resize-handle modal-resize-handle--e"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
          <div
            class="modal-resize-handle modal-resize-handle--w"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            class="modal-resize-handle modal-resize-handle--nw"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            class="modal-resize-handle modal-resize-handle--ne"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            class="modal-resize-handle modal-resize-handle--sw"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            class="modal-resize-handle modal-resize-handle--se"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />

          {/* Header (draggable) */}
          <header class="modal-header" onMouseDown={handleDragStart}>
            <h2 id="quick-craft-title" class="modal-title">
              {currentRecipe()!.name}
            </h2>
            <button
              type="button"
              class="modal-close"
              onClick={closeModal}
              aria-label="Close modal"
            >
              &times;
            </button>
          </header>

          {/* Tabs */}
          <div class="modal-tabs" role="tablist" aria-label="Quick craft tabs">
            <button
              type="button"
              class={`modal-tab ${activeTab() === 'craft-order' ? 'modal-tab--active' : ''}`}
              role="tab"
              id="tab-craft-order"
              aria-controls="panel-craft-order"
              aria-selected={activeTab() === 'craft-order'}
              onClick={() => setActiveTab('craft-order')}
            >
              Craft Order
            </button>
            <button
              type="button"
              class={`modal-tab ${activeTab() === 'pick-list' ? 'modal-tab--active' : ''}`}
              role="tab"
              id="tab-pick-list"
              aria-controls="panel-pick-list"
              aria-selected={activeTab() === 'pick-list'}
              onClick={() => setActiveTab('pick-list')}
            >
              Pick List
            </button>
          </div>

          {/* Tab Panels */}
          <div class="modal-body">
            {/* Craft Order Tab */}
            <div
              id="panel-craft-order"
              class={`modal-tab-panel ${activeTab() === 'craft-order' ? 'modal-tab-panel--active' : ''}`}
              role="tabpanel"
              aria-labelledby="tab-craft-order"
              tabIndex={0}
            >
              <Show when={activeTab() === 'craft-order'}>
                <CraftingTree
                  tree={currentRecipe()!.tree}
                  recipeId={currentRecipe()!.id}
                  showHeader={false}
                />
              </Show>
            </div>

            {/* Pick List Tab */}
            <div
              id="panel-pick-list"
              class={`modal-tab-panel ${activeTab() === 'pick-list' ? 'modal-tab-panel--active' : ''}`}
              role="tabpanel"
              aria-labelledby="tab-pick-list"
              tabIndex={0}
            >
              <Show when={activeTab() === 'pick-list'}>
                <PickListTab
                  bom={currentRecipe()!.bom}
                  recipeId={currentRecipe()!.id}
                />
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

export default QuickCraftModal;
