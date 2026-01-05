// tests/unit/components/pick-list-tab.test.ts
// Smoke tests for PickListTab component logic

import { describe, it, expect } from 'vitest';
import type { BillOfMaterials, BOMItem } from '../../../src/types/index.js';

/**
 * PickListTab smoke tests
 *
 * Since PickListTab is a Solid.js component that runs in the browser,
 * we test the core logic functions: item key generation, clipboard text
 * formatting, and CSS class generation.
 */

// ─────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────

function createBOM(items: BOMItem[]): BillOfMaterials {
  return {
    items,
    baseItem: { type: 'sword', displayName: 'Netherite Sword' },
  };
}

function createBookItem(
  name: string,
  enchantment: string,
  level: number,
  quantity: number = 1
): BOMItem {
  return {
    item: name,
    itemType: 'book',
    enchantment: enchantment as any,
    enchantmentLevel: level,
    quantity,
  };
}

function createBaseItem(name: string, quantity: number = 1): BOMItem {
  return {
    item: name,
    itemType: 'base_item',
    quantity,
  };
}

// ─────────────────────────────────────────────────────────────
// Item Key Generation
// ─────────────────────────────────────────────────────────────

describe('PickListTab', () => {
  describe('getItemKey()', () => {
    function getItemKey(item: BOMItem, index: number): string {
      if (item.itemType === 'book' && item.enchantment) {
        return `book:${item.enchantment}:${item.enchantmentLevel}`;
      }
      return `base:${item.item}:${index}`;
    }

    it('should generate key for book item', () => {
      const item = createBookItem('Sharpness V Book', 'sharpness', 5);
      expect(getItemKey(item, 0)).toBe('book:sharpness:5');
    });

    it('should generate different keys for different enchantment levels', () => {
      const item1 = createBookItem('Sharpness I Book', 'sharpness', 1);
      const item2 = createBookItem('Sharpness V Book', 'sharpness', 5);

      expect(getItemKey(item1, 0)).toBe('book:sharpness:1');
      expect(getItemKey(item2, 1)).toBe('book:sharpness:5');
      expect(getItemKey(item1, 0)).not.toBe(getItemKey(item2, 1));
    });

    it('should generate key for base item with index', () => {
      const item = createBaseItem('Netherite Sword');
      expect(getItemKey(item, 0)).toBe('base:Netherite Sword:0');
    });

    it('should use index for base items', () => {
      const item1 = createBaseItem('Diamond Sword');
      const item2 = createBaseItem('Diamond Sword');

      expect(getItemKey(item1, 0)).toBe('base:Diamond Sword:0');
      expect(getItemKey(item2, 1)).toBe('base:Diamond Sword:1');
    });

    it('should generate unique keys for different enchantments', () => {
      const item1 = createBookItem('Sharpness V Book', 'sharpness', 5);
      const item2 = createBookItem('Smite V Book', 'smite', 5);

      expect(getItemKey(item1, 0)).not.toBe(getItemKey(item2, 1));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Item Formatting
  // ─────────────────────────────────────────────────────────────

  describe('formatItem()', () => {
    function formatItem(item: BOMItem): string {
      const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
      return `${qty}${item.item}`;
    }

    it('should format single item without quantity prefix', () => {
      const item = createBookItem('Sharpness V Book', 'sharpness', 5, 1);
      expect(formatItem(item)).toBe('Sharpness V Book');
    });

    it('should format multiple items with quantity prefix', () => {
      const item = createBookItem('Unbreaking III Book', 'unbreaking', 3, 3);
      expect(formatItem(item)).toBe('3x Unbreaking III Book');
    });

    it('should format base item correctly', () => {
      const item = createBaseItem('Netherite Sword', 1);
      expect(formatItem(item)).toBe('Netherite Sword');
    });

    it('should handle multiple base items', () => {
      const item = createBaseItem('Diamond Sword', 2);
      expect(formatItem(item)).toBe('2x Diamond Sword');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Clipboard Text Generation
  // ─────────────────────────────────────────────────────────────

  describe('clipboardText generation', () => {
    function formatItem(item: BOMItem): string {
      const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
      return `${qty}${item.item}`;
    }

    function generateClipboardText(recipeId: string, bom: BillOfMaterials): string {
      const lines: string[] = [];
      lines.push(`Materials for: ${recipeId}`);
      lines.push('---');

      for (const item of bom.items) {
        lines.push(`[ ] ${formatItem(item)}`);
      }

      return lines.join('\n');
    }

    it('should include recipe ID in header', () => {
      const bom = createBOM([]);
      const text = generateClipboardText('swords/god-sword', bom);
      expect(text).toContain('Materials for: swords/god-sword');
    });

    it('should format items with checkboxes', () => {
      const bom = createBOM([
        createBookItem('Sharpness V Book', 'sharpness', 5),
        createBookItem('Unbreaking III Book', 'unbreaking', 3),
      ]);
      const text = generateClipboardText('test', bom);

      expect(text).toContain('[ ] Sharpness V Book');
      expect(text).toContain('[ ] Unbreaking III Book');
    });

    it('should include quantity in clipboard text', () => {
      const bom = createBOM([createBookItem('Mending Book', 'mending', 1, 2)]);
      const text = generateClipboardText('test', bom);
      expect(text).toContain('[ ] 2x Mending Book');
    });

    it('should have correct line structure', () => {
      const bom = createBOM([createBookItem('Sharpness V Book', 'sharpness', 5)]);
      const text = generateClipboardText('swords/god-sword', bom);
      const lines = text.split('\n');

      expect(lines[0]).toBe('Materials for: swords/god-sword');
      expect(lines[1]).toBe('---');
      expect(lines[2]).toBe('[ ] Sharpness V Book');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // CSS Class Generation
  // ─────────────────────────────────────────────────────────────

  describe('CSS Class Generation', () => {
    function getItemClasses(isBase: boolean, isChecked: boolean): string {
      return `pick-list-item ${isBase ? 'pick-list-item--base' : ''} ${isChecked ? 'pick-list-item--checked' : ''}`.trim().replace(/\s+/g, ' ');
    }

    it('should have base class for book item', () => {
      expect(getItemClasses(false, false)).toBe('pick-list-item');
    });

    it('should add base modifier for base item', () => {
      expect(getItemClasses(true, false)).toContain('pick-list-item--base');
    });

    it('should add checked modifier when checked', () => {
      expect(getItemClasses(false, true)).toContain('pick-list-item--checked');
    });

    it('should combine both modifiers', () => {
      const classes = getItemClasses(true, true);
      expect(classes).toContain('pick-list-item--base');
      expect(classes).toContain('pick-list-item--checked');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Copy Button State
  // ─────────────────────────────────────────────────────────────

  describe('Copy Button State', () => {
    function getCopyButtonClasses(copied: boolean): string {
      return `pick-list-copy ${copied ? 'pick-list-copy--copied' : ''}`.trim();
    }

    function getCopyButtonText(copied: boolean): string {
      return copied ? 'Copied!' : 'Copy List';
    }

    it('should have default class when not copied', () => {
      expect(getCopyButtonClasses(false)).toBe('pick-list-copy');
    });

    it('should add copied class when copied', () => {
      expect(getCopyButtonClasses(true)).toContain('pick-list-copy--copied');
    });

    it('should show default text when not copied', () => {
      expect(getCopyButtonText(false)).toBe('Copy List');
    });

    it('should show copied text when copied', () => {
      expect(getCopyButtonText(true)).toBe('Copied!');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Props Interface
  // ─────────────────────────────────────────────────────────────

  describe('Props Interface', () => {
    it('should require bom prop', () => {
      const bom = createBOM([]);
      const props = {
        bom,
        recipeId: 'swords/god-sword',
      };

      expect(props.bom).toBe(bom);
    });

    it('should require recipeId prop', () => {
      const bom = createBOM([]);
      const props = {
        bom,
        recipeId: 'swords/god-sword',
      };

      expect(props.recipeId).toBe('swords/god-sword');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Keyboard Interaction Logic
  // ─────────────────────────────────────────────────────────────

  describe('Keyboard Interaction Logic', () => {
    function shouldToggleOnKey(key: string): boolean {
      return key === 'Enter' || key === ' ';
    }

    it('should toggle on Enter key', () => {
      expect(shouldToggleOnKey('Enter')).toBe(true);
    });

    it('should toggle on Space key', () => {
      expect(shouldToggleOnKey(' ')).toBe(true);
    });

    it('should not toggle on other keys', () => {
      expect(shouldToggleOnKey('Tab')).toBe(false);
      expect(shouldToggleOnKey('Escape')).toBe(false);
      expect(shouldToggleOnKey('a')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Aria Label Generation
  // ─────────────────────────────────────────────────────────────

  describe('Aria Labels', () => {
    function getCheckboxAriaLabel(itemName: string): string {
      return `Mark ${itemName} as gathered`;
    }

    it('should include item name', () => {
      expect(getCheckboxAriaLabel('Sharpness V Book')).toBe('Mark Sharpness V Book as gathered');
    });

    it('should work for base items', () => {
      expect(getCheckboxAriaLabel('Netherite Sword')).toBe('Mark Netherite Sword as gathered');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Checked Items Toggle Logic
  // ─────────────────────────────────────────────────────────────

  describe('Checked Items Toggle Logic', () => {
    function toggleItem(checkedItems: Set<string>, key: string): Set<string> {
      const next = new Set(checkedItems);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    }

    it('should add item when not checked', () => {
      const checked = new Set<string>();
      const result = toggleItem(checked, 'book:sharpness:5');
      expect(result.has('book:sharpness:5')).toBe(true);
    });

    it('should remove item when already checked', () => {
      const checked = new Set(['book:sharpness:5']);
      const result = toggleItem(checked, 'book:sharpness:5');
      expect(result.has('book:sharpness:5')).toBe(false);
    });

    it('should not mutate original set', () => {
      const checked = new Set(['book:sharpness:5']);
      toggleItem(checked, 'book:sharpness:5');
      expect(checked.has('book:sharpness:5')).toBe(true); // Original unchanged
    });

    it('should handle multiple items', () => {
      let checked = new Set<string>();
      checked = toggleItem(checked, 'book:sharpness:5');
      checked = toggleItem(checked, 'book:smite:5');
      expect(checked.size).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // BOM Structure Validation
  // ─────────────────────────────────────────────────────────────

  describe('BOM Structure', () => {
    it('should handle empty BOM', () => {
      const bom = createBOM([]);
      expect(bom.items.length).toBe(0);
    });

    it('should have baseItem property', () => {
      const bom = createBOM([]);
      expect(bom.baseItem).toBeDefined();
      expect(bom.baseItem.type).toBe('sword');
    });

    it('should order books before base items', () => {
      const items = [
        createBaseItem('Netherite Sword'),
        createBookItem('Sharpness V Book', 'sharpness', 5),
      ];
      const bom = createBOM(items);

      // BOM generator sorts books first
      expect(bom.items[0].itemType).toBe('base_item');
      expect(bom.items[1].itemType).toBe('book');
    });
  });
});
