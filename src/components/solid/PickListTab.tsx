// src/components/solid/PickListTab.tsx
// Pick List tab for Quick Craft modal - displays BOM checklist

import { createSignal, For, createMemo } from 'solid-js';
import type { BillOfMaterials, BOMItem } from '../../types/index.js';

export interface PickListTabProps {
  bom: BillOfMaterials;
  recipeId: string;
}

/**
 * PickListTab displays a materials checklist with gathering progress tracking.
 * - Shows all materials from the Bill of Materials
 * - Checkboxes for marking items as gathered
 * - Copy to clipboard button for the full list
 */
export function PickListTab(props: PickListTabProps): JSX.Element {
  const { bom, recipeId } = props;

  // Track checked items (local state, separate from craft-progress store)
  const [checkedItems, setCheckedItems] = createSignal<Set<string>>(new Set());
  const [copied, setCopied] = createSignal(false);

  // Generate a unique key for each BOM item
  function getItemKey(item: BOMItem, index: number): string {
    if (item.itemType === 'book' && item.enchantment) {
      return `book:${item.enchantment}:${item.enchantmentLevel}`;
    }
    return `base:${item.item}:${index}`;
  }

  // Toggle an item's checked state
  function toggleItem(key: string): void {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Check if an item is checked
  function isChecked(key: string): boolean {
    return checkedItems().has(key);
  }

  // Format item for clipboard
  function formatItem(item: BOMItem): string {
    const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
    return `${qty}${item.item}`;
  }

  // Generate clipboard text
  const clipboardText = createMemo(() => {
    const lines: string[] = [];
    lines.push(`Materials for: ${recipeId}`);
    lines.push('---');

    for (const item of bom.items) {
      lines.push(`[ ] ${formatItem(item)}`);
    }

    return lines.join('\n');
  });

  // Copy to clipboard
  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(clipboardText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  // Handle keyboard navigation
  function handleKeyDown(e: KeyboardEvent, key: string): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleItem(key);
    }
  }

  return (
    <div class="pick-list">
      <div class="pick-list-header">
        <span class="pick-list-title">Materials Needed</span>
        <button
          type="button"
          class={`pick-list-copy ${copied() ? 'pick-list-copy--copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy materials list to clipboard"
        >
          {copied() ? 'Copied!' : 'Copy List'}
        </button>
      </div>

      <div class="pick-list-items" role="list" aria-label="Materials list">
        <For each={bom.items}>
          {(item, index) => {
            const key = getItemKey(item, index());
            const isBase = item.itemType === 'base_item';
            const checked = isChecked(key);

            return (
              <div
                class={`pick-list-item ${isBase ? 'pick-list-item--base' : ''} ${checked ? 'pick-list-item--checked' : ''}`}
                role="listitem"
              >
                <input
                  type="checkbox"
                  class="pick-list-checkbox"
                  checked={checked}
                  onChange={() => toggleItem(key)}
                  onKeyDown={(e) => handleKeyDown(e, key)}
                  aria-label={`Mark ${item.item} as gathered`}
                />
                <span class="pick-list-item-name">{item.item}</span>
                {item.quantity > 1 && (
                  <span class="pick-list-item-qty">x{item.quantity}</span>
                )}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

export default PickListTab;
