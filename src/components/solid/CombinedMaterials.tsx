// src/components/solid/CombinedMaterials.tsx
// Combined materials list from aggregated cart BOMs

import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import type { CartItem, BOMItem, BillOfMaterials, BaseItemType } from '../../types/index.js';
import { cartStore } from '../../stores/cart.js';

export interface CombinedMaterialsProps {
  /** Map of recipe ID to pre-computed BOM (computed at build time) */
  recipeBOMs: Record<string, BillOfMaterials>;
}

/**
 * Create a BOM key for grouping identical items.
 */
function createBomKey(item: BOMItem): string {
  if (item.itemType === 'book' && item.enchantment) {
    return `book:${item.enchantment}:${item.enchantmentLevel}`;
  }
  return `base:${item.item}`;
}

/**
 * Aggregate multiple Bills of Materials into a combined BOM.
 * Client-side version that doesn't rely on Node.js modules.
 */
function aggregateBOMsClient(boms: BillOfMaterials[]): BillOfMaterials {
  if (boms.length === 0) {
    return {
      items: [],
      baseItem: { type: 'sword' as BaseItemType, displayName: 'None' },
    };
  }

  if (boms.length === 1) {
    return boms[0];
  }

  // Merge all items with quantity aggregation
  const itemMap = new Map<string, BOMItem>();

  for (const bom of boms) {
    for (const item of bom.items) {
      const key = createBomKey(item);
      const existing = itemMap.get(key);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        // Clone the item to avoid mutating the original
        itemMap.set(key, { ...item });
      }
    }
  }

  // Convert map to sorted array
  const items = Array.from(itemMap.values()).sort((a, b) => {
    // Books first
    if (a.itemType === 'book' && b.itemType !== 'book') return -1;
    if (a.itemType !== 'book' && b.itemType === 'book') return 1;

    // Alphabetically within type
    return a.item.localeCompare(b.item);
  });

  // Use first BOM's base item as representative
  const baseItem = boms[0].baseItem;

  return {
    items,
    baseItem,
  };
}

/**
 * CombinedMaterials displays the aggregated Bill of Materials
 * across all cart items, multiplied by their quantities.
 *
 * Features:
 * - Groups materials by type (Base Items, Enchanted Books)
 * - Shows quantity needed for each material
 * - Copy List and Export as Text buttons
 */
export function CombinedMaterials(props: CombinedMaterialsProps): JSX.Element {
  const [items, setItems] = createSignal<CartItem[]>([]);
  const [copied, setCopied] = createSignal(false);

  // Check if running in browser
  function isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Sync with cart store
  function syncFromStore(): void {
    setItems(cartStore.items());
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

  // Compute aggregated BOM from cart items using pre-computed BOMs
  const combinedBOM = createMemo((): BillOfMaterials => {
    const cartItems = items();

    if (cartItems.length === 0) {
      return {
        items: [],
        baseItem: { type: 'sword' as BaseItemType, displayName: 'None' },
      };
    }

    // Collect BOMs for each cart item, accounting for quantity
    const allBOMs: BillOfMaterials[] = [];

    for (const cartItem of cartItems) {
      const bom = props.recipeBOMs[cartItem.recipeId];
      if (!bom) continue;

      // Add BOM multiple times based on quantity
      for (let i = 0; i < cartItem.quantity; i++) {
        allBOMs.push(bom);
      }
    }

    return aggregateBOMsClient(allBOMs);
  });

  // Separate base items and books
  const baseItems = createMemo(() =>
    combinedBOM().items.filter((item) => item.itemType === 'base_item')
  );

  const bookItems = createMemo(() =>
    combinedBOM().items.filter((item) => item.itemType === 'book')
  );

  // Generate text for clipboard/export
  function generateTextList(): string {
    const lines: string[] = [];
    lines.push('Shopping List - Materials Needed');
    lines.push('================================');
    lines.push('');

    const bases = baseItems();
    if (bases.length > 0) {
      lines.push('BASE ITEMS:');
      for (const item of bases) {
        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
        lines.push(`  ${qty}${item.item}`);
      }
      lines.push('');
    }

    const books = bookItems();
    if (books.length > 0) {
      lines.push('ENCHANTED BOOKS:');
      for (const item of books) {
        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
        lines.push(`  ${qty}${item.item}`);
      }
      lines.push('');
    }

    // Summary
    lines.push('--------------------------------');
    const totalItems = bases.length + books.length;
    const totalQuantity = [...bases, ...books].reduce((sum, item) => sum + item.quantity, 0);
    lines.push(`Total: ${totalQuantity} items (${totalItems} unique)`);

    return lines.join('\n');
  }

  // Copy to clipboard
  async function handleCopy(): Promise<void> {
    if (!isBrowser()) return;

    try {
      await navigator.clipboard.writeText(generateTextList());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  // Export as text file
  function handleExport(): void {
    if (!isBrowser()) return;

    const text = generateTextList();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'minecraft-shopping-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div class="combined-materials">
      <Show
        when={combinedBOM().items.length > 0}
        fallback={
          <div class="materials-empty">
            Add items to your cart to see the combined materials list.
          </div>
        }
      >
        {/* Base Items Group */}
        <Show when={baseItems().length > 0}>
          <div class="materials-group" role="list" aria-label="Base items">
            <h3 class="materials-group-title">Base Items</h3>
            <For each={baseItems()}>
              {(item) => (
                <div class="material-item material-item--base" role="listitem">
                  <span class="material-qty">{item.quantity}x</span>
                  <span class="material-name">{item.item}</span>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Enchanted Books Group */}
        <Show when={bookItems().length > 0}>
          <div class="materials-group" role="list" aria-label="Enchanted books">
            <h3 class="materials-group-title">Enchanted Books</h3>
            <For each={bookItems()}>
              {(item) => (
                <div class="material-item" role="listitem">
                  <span class="material-qty">{item.quantity}x</span>
                  <span class="material-name">{item.item}</span>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Actions */}
        <div class="materials-actions">
          <button
            type="button"
            class={`btn btn-secondary ${copied() ? 'btn-copy--copied' : ''}`}
            onClick={handleCopy}
            aria-label="Copy materials list to clipboard"
          >
            {copied() ? 'Copied!' : 'Copy List'}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            onClick={handleExport}
            aria-label="Export materials list as text file"
          >
            Export as Text
          </button>
        </div>
      </Show>
    </div>
  );
}

export default CombinedMaterials;
