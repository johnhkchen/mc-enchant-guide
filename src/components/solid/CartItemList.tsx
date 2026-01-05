// src/components/solid/CartItemList.tsx
// Shopping cart item list with quantity controls and actions

import { createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import type { CartItem, CraftingTreeNode, BillOfMaterials } from '../../types/index.js';
import { cartStore } from '../../stores/cart.js';

export interface RecipeModalData {
  id: string;
  name: string;
  tree: CraftingTreeNode;
  bom: BillOfMaterials;
}

export interface CartItemListProps {
  /** Map of recipe ID to recipe data for viewing */
  recipes: Record<string, RecipeModalData>;
}

/**
 * CartItemList displays all items in the shopping cart with:
 * - Quantity controls [−] [qty] [+]
 * - View button to open Quick Craft modal
 * - Remove button to remove item
 * - Grand total levels
 * - Clear All button
 */
export function CartItemList(props: CartItemListProps): JSX.Element {
  const [items, setItems] = createSignal<CartItem[]>([]);
  const [totalLevels, setTotalLevels] = createSignal(0);
  const [showConfirmClear, setShowConfirmClear] = createSignal(false);

  // Check if running in browser
  function isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Sync with cart store
  function syncFromStore(): void {
    setItems(cartStore.items());
    setTotalLevels(cartStore.totalLevels());
  }

  // Handle storage changes (from other tabs or same-tab updates)
  function handleStorageChange(e: StorageEvent): void {
    if (e.key === 'mc-enchant:cart') {
      syncFromStore();
    }
  }

  // Handle same-tab cart updates
  function handleCartUpdate(): void {
    syncFromStore();
  }

  onMount(() => {
    if (!isBrowser()) return;

    // Initial sync
    syncFromStore();

    // Listen for changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-updated', handleCartUpdate);
  });

  onCleanup(() => {
    if (!isBrowser()) return;
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('cart-updated', handleCartUpdate);
  });

  // Update quantity
  function updateQuantity(recipeId: string, delta: number): void {
    const item = items().find((i) => i.recipeId === recipeId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      cartStore.remove(recipeId);
    } else {
      cartStore.updateQuantity(recipeId, newQty);
    }

    syncFromStore();
    dispatchCartUpdated();
  }

  // Remove item
  function removeItem(recipeId: string): void {
    cartStore.remove(recipeId);
    syncFromStore();
    dispatchCartUpdated();
  }

  // Open Quick Craft modal for an item
  function viewItem(recipeId: string): void {
    if (!isBrowser()) return;
    const event = new CustomEvent('quick-craft', {
      detail: { recipeId },
    });
    window.dispatchEvent(event);
  }

  // Clear all items with confirmation
  function handleClearAll(): void {
    if (showConfirmClear()) {
      cartStore.clear();
      syncFromStore();
      setShowConfirmClear(false);
      dispatchCartUpdated();
    } else {
      setShowConfirmClear(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirmClear(false), 3000);
    }
  }

  // Dispatch cart-updated event
  function dispatchCartUpdated(): void {
    if (!isBrowser()) return;
    window.dispatchEvent(new Event('cart-updated'));
  }

  // Handle keyboard navigation
  function handleKeyDown(e: KeyboardEvent, action: () => void): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }

  return (
    <div class="cart-item-list">
      <Show
        when={items().length > 0}
        fallback={
          <div class="cart-empty">
            <div class="cart-empty-icon" aria-hidden="true">&#128722;</div>
            <h3 class="cart-empty-title">Your list is empty</h3>
            <p class="cart-empty-description">
              Add recipes from the catalog to start building your shopping list.
            </p>
            <a href="/" class="cart-empty-link">Browse Catalog</a>
          </div>
        }
      >
        {/* Cart Items */}
        <div class="cart-items-list" role="list" aria-label="Cart items">
          <For each={items()}>
            {(item) => {
              const totalCost = item.levelCost * item.quantity;

              return (
                <div class="cart-item" role="listitem">
                  <div class="cart-item-header">
                    <span class="cart-item-name">{item.recipeName}</span>
                    <span class="cart-item-cost" aria-label={`${totalCost} levels total`}>
                      {totalCost} lvl
                    </span>
                  </div>

                  <div class="cart-item-controls">
                    <div class="cart-item-quantity">
                      <button
                        type="button"
                        class="qty-btn"
                        onClick={() => updateQuantity(item.recipeId, -1)}
                        aria-label={`Decrease quantity for ${item.recipeName}`}
                      >
                        −
                      </button>
                      <span class="qty-value" aria-label={`Quantity: ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        class="qty-btn"
                        onClick={() => updateQuantity(item.recipeId, 1)}
                        aria-label={`Increase quantity for ${item.recipeName}`}
                      >
                        +
                      </button>
                    </div>

                    <div class="cart-item-actions">
                      <button
                        type="button"
                        class="cart-action-btn"
                        onClick={() => viewItem(item.recipeId)}
                        aria-label={`View crafting details for ${item.recipeName}`}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        class="cart-action-btn cart-action-btn--danger"
                        onClick={() => removeItem(item.recipeId)}
                        aria-label={`Remove ${item.recipeName} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>

        {/* Grand Total */}
        <div class="cart-total" aria-live="polite">
          <span class="cart-total-label">Grand Total:</span>
          <span class="cart-total-value">{totalLevels()} levels</span>
        </div>

        {/* Actions */}
        <div class="cart-actions">
          <button
            type="button"
            class={`btn ${showConfirmClear() ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleClearAll}
            aria-label={showConfirmClear() ? 'Click again to confirm clearing all items' : 'Clear all items'}
          >
            {showConfirmClear() ? 'Confirm Clear All?' : 'Clear All'}
          </button>
        </div>
      </Show>
    </div>
  );
}

export default CartItemList;
