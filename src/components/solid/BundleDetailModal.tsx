// src/components/solid/BundleDetailModal.tsx
// Simple modal for viewing bundle details on mobile

import { createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js';

export interface BundleRecipe {
  id: string;
  name: string;
  totalLevels: number;
  baseItem: string;
  enchantments: string[];
}

export interface BundleModalData {
  id: string;
  name: string;
  description?: string;
  totalLevelCost: number;
  recipes: BundleRecipe[];
}

export interface BundleDetailModalProps {
  /** Map of bundle ID to bundle data (pre-computed at build time) */
  bundles: Record<string, BundleModalData>;
}

/**
 * Convert baseItem string to icon filename.
 */
function getIconPath(baseItem: string): string {
  let normalized = baseItem;
  if (normalized.startsWith('gold_')) {
    normalized = 'golden_' + normalized.slice(5);
  }
  return `/items/minecraft_${normalized}.png`;
}

/**
 * Get display name from baseItem string.
 */
function getDisplayName(baseItem: string): string {
  return baseItem
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * BundleDetailModal shows bundle contents in a simple popover.
 * Opens in response to 'bundle-detail' custom events from BundleCard.
 */
export function BundleDetailModal(props: BundleDetailModalProps): JSX.Element {
  const [isOpen, setIsOpen] = createSignal(false);
  const [currentBundle, setCurrentBundle] = createSignal<BundleModalData | null>(null);
  const [addedFeedback, setAddedFeedback] = createSignal(false);

  let modalRef: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;

  // Check if running in browser
  function isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Handle bundle-detail event
  function handleBundleDetailEvent(e: CustomEvent<{ bundleId: string }>): void {
    const { bundleId } = e.detail;
    const bundle = props.bundles[bundleId];

    if (bundle) {
      previousFocus = document.activeElement as HTMLElement;
      setCurrentBundle(bundle);
      setIsOpen(true);
    }
  }

  // Close modal
  function closeModal(): void {
    setIsOpen(false);
    setCurrentBundle(null);
    setAddedFeedback(false);

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
  }

  // Handle backdrop click
  function handleBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }

  // Handle Add All to List
  async function handleAddAll(): Promise<void> {
    const bundle = currentBundle();
    if (!bundle) return;

    try {
      const { addBundle } = await import('../../stores/cart.js');

      addBundle(bundle.recipes.map(r => ({
        id: r.id,
        name: r.name,
        totalLevels: r.totalLevels,
      })));

      // Dispatch event to update cart badge
      window.dispatchEvent(new Event('cart-updated'));

      // Show feedback
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1500);
    } catch (err) {
      console.error('Failed to add bundle to cart:', err);
    }
  }

  // Focus management when modal opens
  createEffect(() => {
    if (isOpen() && modalRef) {
      const closeBtn = modalRef.querySelector<HTMLButtonElement>('.bundle-modal-close');
      if (closeBtn) {
        closeBtn.focus();
      }
    }
  });

  // Set up event listeners
  onMount(() => {
    if (!isBrowser()) return;
    window.addEventListener('bundle-detail', handleBundleDetailEvent as EventListener);
    document.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    if (!isBrowser()) return;
    window.removeEventListener('bundle-detail', handleBundleDetailEvent as EventListener);
    document.removeEventListener('keydown', handleKeyDown);
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

  return (
    <Show when={isOpen() && currentBundle()}>
      <div
        class="bundle-modal-backdrop"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bundle-modal-title"
      >
        <div class="bundle-modal" ref={modalRef}>
          {/* Header */}
          <header class="bundle-modal-header">
            <h2 id="bundle-modal-title" class="bundle-modal-title">
              {currentBundle()!.name}
            </h2>
            <span class="bundle-modal-cost">
              {currentBundle()!.totalLevelCost}
              <span class="bundle-modal-cost-suffix">lvl total</span>
            </span>
            <button
              type="button"
              class="bundle-modal-close"
              onClick={closeModal}
              aria-label="Close modal"
            >
              &times;
            </button>
          </header>

          {/* Body */}
          <div class="bundle-modal-body">
            {/* Description */}
            <Show when={currentBundle()!.description}>
              <p class="bundle-modal-description">{currentBundle()!.description}</p>
            </Show>

            {/* Items list */}
            <div class="bundle-modal-items">
              <For each={currentBundle()!.recipes}>
                {(recipe) => (
                  <div class="bundle-modal-item">
                    <div class="bundle-modal-item-tooltip">
                      <span class="bundle-modal-item-cost">
                        {recipe.totalLevels}
                        <span class="bundle-modal-item-cost-suffix">lvl</span>
                      </span>
                      <img src={getIconPath(recipe.baseItem)} alt="" class="bundle-modal-item-icon" />
                      <span class="bundle-modal-item-name">{getDisplayName(recipe.baseItem)}</span>
                      <div class="bundle-modal-item-enchants">
                        <For each={recipe.enchantments}>
                          {(ench) => <span class="bundle-modal-item-enchant">{ench}</span>}
                        </For>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Footer */}
          <footer class="bundle-modal-footer">
            <button
              type="button"
              class={`btn btn-primary bundle-modal-add ${addedFeedback() ? 'bundle-modal-add--added' : ''}`}
              onClick={handleAddAll}
              disabled={addedFeedback()}
            >
              {addedFeedback() ? 'Added!' : 'Add All to List'}
            </button>
          </footer>
        </div>
      </div>
    </Show>
  );
}

export default BundleDetailModal;
