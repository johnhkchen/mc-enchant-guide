/**
 * Unit tests for base-items module.
 *
 * Tests cover:
 * - getBaseItem lookup by type and material
 * - getAllBaseItems retrieval
 * - getBaseItemsByType filtering
 * - Display name generation
 * - Material validation helpers
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { BaseItemType, ItemMaterial } from '../../../src/types/index.js';
import {
  getBaseItem,
  getAllBaseItems,
  getBaseItemsByType,
  getBaseItemCount,
  itemTypeRequiresMaterial,
  getValidMaterials,
  _resetCache,
} from '../../../src/data/base-items.js';

// ─────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetCache();
});

// ─────────────────────────────────────────────────────────────
// getBaseItem Tests
// ─────────────────────────────────────────────────────────────

describe('getBaseItem', () => {
  describe('tools and weapons with materials', () => {
    const toolWeaponTypes: BaseItemType[] = ['sword', 'axe', 'pickaxe', 'shovel', 'hoe'];
    const toolMaterials: ItemMaterial[] = ['netherite', 'diamond', 'iron', 'gold', 'stone', 'wood'];

    it.each(toolWeaponTypes)('returns %s with all valid materials', (type) => {
      for (const material of toolMaterials) {
        const item = getBaseItem(type, material);
        expect(item).toBeDefined();
        expect(item!.type).toBe(type);
        expect(item!.material).toBe(material);
      }
    });

    it('returns netherite sword with correct display name', () => {
      const item = getBaseItem('sword', 'netherite');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Netherite Sword');
    });

    it('returns diamond pickaxe with correct display name', () => {
      const item = getBaseItem('pickaxe', 'diamond');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Diamond Pickaxe');
    });

    it('returns golden axe with correct display name', () => {
      const item = getBaseItem('axe', 'gold');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Golden Axe');
    });

    it('returns wooden shovel with correct display name', () => {
      const item = getBaseItem('shovel', 'wood');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Wooden Shovel');
    });

    it('returns stone hoe with correct display name', () => {
      const item = getBaseItem('hoe', 'stone');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Stone Hoe');
    });

    it('returns iron sword with correct display name', () => {
      const item = getBaseItem('sword', 'iron');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Iron Sword');
    });
  });

  describe('armor with materials', () => {
    const armorTypes: BaseItemType[] = ['helmet', 'chestplate', 'leggings', 'boots'];
    const armorMaterials: ItemMaterial[] = ['netherite', 'diamond', 'iron', 'gold', 'chainmail', 'leather'];

    it.each(armorTypes)('returns %s with all valid armor materials', (type) => {
      for (const material of armorMaterials) {
        const item = getBaseItem(type, material);
        expect(item).toBeDefined();
        expect(item!.type).toBe(type);
        expect(item!.material).toBe(material);
      }
    });

    it('returns netherite chestplate with correct display name', () => {
      const item = getBaseItem('chestplate', 'netherite');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Netherite Chestplate');
    });

    it('returns leather boots with correct display name', () => {
      const item = getBaseItem('boots', 'leather');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Leather Boots');
    });

    it('returns chainmail leggings with correct display name', () => {
      const item = getBaseItem('leggings', 'chainmail');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Chainmail Leggings');
    });

    it('returns golden helmet with correct display name', () => {
      const item = getBaseItem('helmet', 'gold');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Golden Helmet');
    });
  });

  describe('turtle shell helmet', () => {
    it('returns turtle shell helmet with correct properties', () => {
      const item = getBaseItem('helmet', 'turtle');
      expect(item).toBeDefined();
      expect(item!.type).toBe('helmet');
      expect(item!.material).toBe('turtle');
      expect(item!.displayName).toBe('Turtle Shell');
    });
  });

  describe('singleton items (no material)', () => {
    const singletonItems: BaseItemType[] = [
      'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
      'shears', 'flint_and_steel', 'shield', 'elytra',
    ];

    it.each(singletonItems)('returns %s without material', (type) => {
      const item = getBaseItem(type);
      expect(item).toBeDefined();
      expect(item!.type).toBe(type);
      expect(item!.material).toBeUndefined();
    });

    it('returns bow with correct display name', () => {
      const item = getBaseItem('bow');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Bow');
    });

    it('returns crossbow with correct display name', () => {
      const item = getBaseItem('crossbow');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Crossbow');
    });

    it('returns trident with correct display name', () => {
      const item = getBaseItem('trident');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Trident');
    });

    it('returns mace with correct display name', () => {
      const item = getBaseItem('mace');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Mace');
    });

    it('returns fishing rod with correct display name', () => {
      const item = getBaseItem('fishing_rod');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Fishing Rod');
    });

    it('returns shears with correct display name', () => {
      const item = getBaseItem('shears');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Shears');
    });

    it('returns flint and steel with correct display name', () => {
      const item = getBaseItem('flint_and_steel');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Flint and Steel');
    });

    it('returns shield with correct display name', () => {
      const item = getBaseItem('shield');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Shield');
    });

    it('returns elytra with correct display name', () => {
      const item = getBaseItem('elytra');
      expect(item).toBeDefined();
      expect(item!.displayName).toBe('Elytra');
    });
  });

  describe('invalid combinations', () => {
    it('returns undefined for sword without material', () => {
      const item = getBaseItem('sword');
      expect(item).toBeUndefined();
    });

    it('returns undefined for armor without material', () => {
      expect(getBaseItem('helmet')).toBeUndefined();
      expect(getBaseItem('chestplate')).toBeUndefined();
      expect(getBaseItem('leggings')).toBeUndefined();
      expect(getBaseItem('boots')).toBeUndefined();
    });

    it('returns undefined for bow with material', () => {
      const item = getBaseItem('bow', 'diamond');
      expect(item).toBeUndefined();
    });

    it('returns undefined for sword with leather material', () => {
      const item = getBaseItem('sword', 'leather');
      expect(item).toBeUndefined();
    });

    it('returns undefined for chestplate with turtle material', () => {
      const item = getBaseItem('chestplate', 'turtle');
      expect(item).toBeUndefined();
    });

    it('returns undefined for pickaxe with chainmail material', () => {
      const item = getBaseItem('pickaxe', 'chainmail');
      expect(item).toBeUndefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────
// getAllBaseItems Tests
// ─────────────────────────────────────────────────────────────

describe('getAllBaseItems', () => {
  it('returns all base items', () => {
    const items = getAllBaseItems();
    expect(items.length).toBeGreaterThan(0);
  });

  it('returns expected total count', () => {
    const items = getAllBaseItems();
    // 5 tool/weapon types * 6 materials = 30
    // 4 armor types * 6 materials = 24
    // 1 turtle helmet = 1
    // 9 singleton items = 9
    // Total = 30 + 24 + 1 + 9 = 64
    expect(items.length).toBe(64);
  });

  it('returns a copy of the array', () => {
    const items1 = getAllBaseItems();
    const items2 = getAllBaseItems();
    expect(items1).not.toBe(items2);
    expect(items1).toEqual(items2);
  });

  it('includes all item types', () => {
    const items = getAllBaseItems();
    const types = new Set(items.map(i => i.type));

    const expectedTypes: BaseItemType[] = [
      'sword', 'axe', 'pickaxe', 'shovel', 'hoe',
      'helmet', 'chestplate', 'leggings', 'boots',
      'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
      'shears', 'flint_and_steel', 'shield', 'elytra',
    ];

    for (const type of expectedTypes) {
      expect(types.has(type)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// getBaseItemsByType Tests
// ─────────────────────────────────────────────────────────────

describe('getBaseItemsByType', () => {
  it('returns all swords (6 materials)', () => {
    const swords = getBaseItemsByType('sword');
    expect(swords.length).toBe(6);
    for (const sword of swords) {
      expect(sword.type).toBe('sword');
    }
  });

  it('returns all helmets (7: 6 armor + 1 turtle)', () => {
    const helmets = getBaseItemsByType('helmet');
    expect(helmets.length).toBe(7);
    for (const helmet of helmets) {
      expect(helmet.type).toBe('helmet');
    }
    // Verify turtle shell is included
    const turtle = helmets.find(h => h.material === 'turtle');
    expect(turtle).toBeDefined();
  });

  it('returns all boots (6 armor materials)', () => {
    const boots = getBaseItemsByType('boots');
    expect(boots.length).toBe(6);
    for (const boot of boots) {
      expect(boot.type).toBe('boots');
    }
  });

  it('returns single bow (no materials)', () => {
    const bows = getBaseItemsByType('bow');
    expect(bows.length).toBe(1);
    expect(bows[0].type).toBe('bow');
    expect(bows[0].material).toBeUndefined();
  });

  it('returns single elytra (no materials)', () => {
    const elytras = getBaseItemsByType('elytra');
    expect(elytras.length).toBe(1);
    expect(elytras[0].type).toBe('elytra');
    expect(elytras[0].material).toBeUndefined();
  });

  it('returns a copy of the array', () => {
    const items1 = getBaseItemsByType('sword');
    const items2 = getBaseItemsByType('sword');
    expect(items1).not.toBe(items2);
    expect(items1).toEqual(items2);
  });

  it('returns empty array for invalid type', () => {
    const items = getBaseItemsByType('invalid' as BaseItemType);
    expect(items).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// getBaseItemCount Tests
// ─────────────────────────────────────────────────────────────

describe('getBaseItemCount', () => {
  it('returns total count of base items', () => {
    const count = getBaseItemCount();
    expect(count).toBe(64);
  });

  it('matches getAllBaseItems length', () => {
    const count = getBaseItemCount();
    const items = getAllBaseItems();
    expect(count).toBe(items.length);
  });
});

// ─────────────────────────────────────────────────────────────
// itemTypeRequiresMaterial Tests
// ─────────────────────────────────────────────────────────────

describe('itemTypeRequiresMaterial', () => {
  it('returns true for sword', () => {
    expect(itemTypeRequiresMaterial('sword')).toBe(true);
  });

  it('returns true for all tools and weapons', () => {
    const types: BaseItemType[] = ['sword', 'axe', 'pickaxe', 'shovel', 'hoe'];
    for (const type of types) {
      expect(itemTypeRequiresMaterial(type)).toBe(true);
    }
  });

  it('returns true for all armor', () => {
    const types: BaseItemType[] = ['helmet', 'chestplate', 'leggings', 'boots'];
    for (const type of types) {
      expect(itemTypeRequiresMaterial(type)).toBe(true);
    }
  });

  it('returns false for singleton items', () => {
    const types: BaseItemType[] = [
      'bow', 'crossbow', 'trident', 'mace', 'fishing_rod',
      'shears', 'flint_and_steel', 'shield', 'elytra',
    ];
    for (const type of types) {
      expect(itemTypeRequiresMaterial(type)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// getValidMaterials Tests
// ─────────────────────────────────────────────────────────────

describe('getValidMaterials', () => {
  it('returns tool materials for sword', () => {
    const materials = getValidMaterials('sword');
    expect(materials).toEqual(['netherite', 'diamond', 'iron', 'gold', 'stone', 'wood']);
  });

  it('returns tool materials for pickaxe', () => {
    const materials = getValidMaterials('pickaxe');
    expect(materials).toEqual(['netherite', 'diamond', 'iron', 'gold', 'stone', 'wood']);
  });

  it('returns armor materials for chestplate', () => {
    const materials = getValidMaterials('chestplate');
    expect(materials).toEqual(['netherite', 'diamond', 'iron', 'gold', 'chainmail', 'leather']);
  });

  it('returns armor materials plus turtle for helmet', () => {
    const materials = getValidMaterials('helmet');
    expect(materials).toEqual(['netherite', 'diamond', 'iron', 'gold', 'chainmail', 'leather', 'turtle']);
  });

  it('returns empty array for singleton items', () => {
    expect(getValidMaterials('bow')).toEqual([]);
    expect(getValidMaterials('shield')).toEqual([]);
    expect(getValidMaterials('elytra')).toEqual([]);
  });

  it('returns a copy of the materials array', () => {
    const materials1 = getValidMaterials('sword');
    const materials2 = getValidMaterials('sword');
    expect(materials1).not.toBe(materials2);
    expect(materials1).toEqual(materials2);
  });
});

// ─────────────────────────────────────────────────────────────
// Cache Behavior Tests
// ─────────────────────────────────────────────────────────────

describe('cache behavior', () => {
  it('initializes data lazily', () => {
    _resetCache();
    // First call triggers initialization
    const item = getBaseItem('sword', 'diamond');
    expect(item).toBeDefined();
  });

  it('reuses cached data on subsequent calls', () => {
    const items1 = getAllBaseItems();
    const items2 = getAllBaseItems();
    // Should have same content (separate arrays, same data)
    expect(items1).toEqual(items2);
  });

  it('reinitializes after cache reset', () => {
    const item1 = getBaseItem('sword', 'diamond');
    _resetCache();
    const item2 = getBaseItem('sword', 'diamond');
    expect(item1).toEqual(item2);
    // Should be different object instances after reset
    expect(item1).not.toBe(item2);
  });
});

// ─────────────────────────────────────────────────────────────
// Display Name Edge Cases
// ─────────────────────────────────────────────────────────────

describe('display name edge cases', () => {
  it('handles all materials correctly for display names', () => {
    const item1 = getBaseItem('sword', 'gold');
    expect(item1!.displayName).toBe('Golden Sword');

    const item2 = getBaseItem('helmet', 'chainmail');
    expect(item2!.displayName).toBe('Chainmail Helmet');

    const item3 = getBaseItem('boots', 'leather');
    expect(item3!.displayName).toBe('Leather Boots');
  });

  it('handles underscore in type names for display', () => {
    const item1 = getBaseItem('fishing_rod');
    expect(item1!.displayName).toBe('Fishing Rod');

    const item2 = getBaseItem('flint_and_steel');
    expect(item2!.displayName).toBe('Flint and Steel');
  });
});
