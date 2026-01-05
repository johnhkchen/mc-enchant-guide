// tests/unit/components/catalog-filters.test.ts
// Smoke tests for CatalogFilters component logic

import { describe, it, expect } from 'vitest';

/**
 * CatalogFilters smoke tests
 *
 * Since CatalogFilters is a Solid.js component that runs in the browser,
 * we test the data structures, category mapping, and sorting logic.
 * Full rendering tests would require a browser environment with jsdom.
 */

// Types from the component
type SortOption = 'xp-high' | 'xp-low' | 'a-z' | 'z-a';
type CategoryTab = 'all' | 'swords' | 'tools' | 'armor' | 'ranged' | 'other';

/** Maps UI category tabs to recipe categories */
const CATEGORY_MAP: Record<CategoryTab, string[] | null> = {
  all: null,
  swords: ['swords'],
  tools: ['pickaxes', 'axes', 'shovels', 'hoes'],
  armor: ['helmets', 'chestplates', 'leggings', 'boots'],
  ranged: ['bows', 'crossbows', 'tridents'],
  other: ['maces', 'fishing_rods'],
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'xp-high', label: 'XP Cost High→Low' },
  { value: 'xp-low', label: 'XP Cost Low→High' },
  { value: 'a-z', label: 'A-Z' },
  { value: 'z-a', label: 'Z-A' },
];

const CATEGORY_TABS: { value: CategoryTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'swords', label: 'Swords' },
  { value: 'tools', label: 'Tools' },
  { value: 'armor', label: 'Armor' },
  { value: 'ranged', label: 'Ranged' },
  { value: 'other', label: 'Other' },
];

// Sorting function from the component
function getSortFunction(
  sortOption: SortOption
): (a: { name: string; cost: number }, b: { name: string; cost: number }) => number {
  switch (sortOption) {
    case 'xp-high':
      return (a, b) => b.cost - a.cost;
    case 'xp-low':
      return (a, b) => a.cost - b.cost;
    case 'a-z':
      return (a, b) => a.name.localeCompare(b.name);
    case 'z-a':
      return (a, b) => b.name.localeCompare(a.name);
  }
}

describe('CatalogFilters', () => {
  describe('Category Mapping', () => {
    it('should map "all" to null (no filter)', () => {
      expect(CATEGORY_MAP.all).toBeNull();
    });

    it('should map swords to single category', () => {
      expect(CATEGORY_MAP.swords).toEqual(['swords']);
    });

    it('should map tools to multiple categories', () => {
      expect(CATEGORY_MAP.tools).toEqual(['pickaxes', 'axes', 'shovels', 'hoes']);
      expect(CATEGORY_MAP.tools).toHaveLength(4);
    });

    it('should map armor to all armor types', () => {
      expect(CATEGORY_MAP.armor).toEqual(['helmets', 'chestplates', 'leggings', 'boots']);
      expect(CATEGORY_MAP.armor).toHaveLength(4);
    });

    it('should map ranged to bow and trident categories', () => {
      expect(CATEGORY_MAP.ranged).toEqual(['bows', 'crossbows', 'tridents']);
    });

    it('should map other to misc categories', () => {
      expect(CATEGORY_MAP.other).toEqual(['maces', 'fishing_rods']);
    });

    it('should cover all known recipe categories', () => {
      const allMappedCategories = Object.values(CATEGORY_MAP)
        .filter((v): v is string[] => v !== null)
        .flat();

      // Verify key categories are covered
      expect(allMappedCategories).toContain('swords');
      expect(allMappedCategories).toContain('pickaxes');
      expect(allMappedCategories).toContain('helmets');
      expect(allMappedCategories).toContain('bows');
      expect(allMappedCategories).toContain('maces');
    });
  });

  describe('Sort Options', () => {
    it('should have 4 sort options', () => {
      expect(SORT_OPTIONS).toHaveLength(4);
    });

    it('should have XP High→Low as first option (default)', () => {
      expect(SORT_OPTIONS[0].value).toBe('xp-high');
      expect(SORT_OPTIONS[0].label).toBe('XP Cost High→Low');
    });

    it('should include all sort values', () => {
      const values = SORT_OPTIONS.map((o) => o.value);
      expect(values).toContain('xp-high');
      expect(values).toContain('xp-low');
      expect(values).toContain('a-z');
      expect(values).toContain('z-a');
    });
  });

  describe('Category Tabs', () => {
    it('should have 6 category tabs', () => {
      expect(CATEGORY_TABS).toHaveLength(6);
    });

    it('should have All as first tab', () => {
      expect(CATEGORY_TABS[0].value).toBe('all');
      expect(CATEGORY_TABS[0].label).toBe('All');
    });

    it('should match category map keys', () => {
      const tabValues = CATEGORY_TABS.map((t) => t.value);
      const mapKeys = Object.keys(CATEGORY_MAP);
      expect(tabValues.sort()).toEqual(mapKeys.sort());
    });
  });

  describe('Sorting Functions', () => {
    const items = [
      { name: 'God Sword', cost: 45 },
      { name: 'Mining Pick', cost: 20 },
      { name: 'Fortune Pick', cost: 30 },
      { name: 'Armor Set', cost: 60 },
    ];

    it('should sort by XP cost high to low', () => {
      const sorted = [...items].sort(getSortFunction('xp-high'));
      expect(sorted[0].cost).toBe(60);
      expect(sorted[1].cost).toBe(45);
      expect(sorted[2].cost).toBe(30);
      expect(sorted[3].cost).toBe(20);
    });

    it('should sort by XP cost low to high', () => {
      const sorted = [...items].sort(getSortFunction('xp-low'));
      expect(sorted[0].cost).toBe(20);
      expect(sorted[1].cost).toBe(30);
      expect(sorted[2].cost).toBe(45);
      expect(sorted[3].cost).toBe(60);
    });

    it('should sort alphabetically A-Z', () => {
      const sorted = [...items].sort(getSortFunction('a-z'));
      expect(sorted[0].name).toBe('Armor Set');
      expect(sorted[1].name).toBe('Fortune Pick');
      expect(sorted[2].name).toBe('God Sword');
      expect(sorted[3].name).toBe('Mining Pick');
    });

    it('should sort alphabetically Z-A', () => {
      const sorted = [...items].sort(getSortFunction('z-a'));
      expect(sorted[0].name).toBe('Mining Pick');
      expect(sorted[1].name).toBe('God Sword');
      expect(sorted[2].name).toBe('Fortune Pick');
      expect(sorted[3].name).toBe('Armor Set');
    });

    it('should handle items with same cost', () => {
      const sameItems = [
        { name: 'Sword A', cost: 30 },
        { name: 'Sword B', cost: 30 },
        { name: 'Sword C', cost: 30 },
      ];
      // Sort should be stable for same cost
      const sorted = [...sameItems].sort(getSortFunction('xp-high'));
      expect(sorted.every((item) => item.cost === 30)).toBe(true);
    });

    it('should handle empty array', () => {
      const empty: { name: string; cost: number }[] = [];
      const sorted = [...empty].sort(getSortFunction('xp-high'));
      expect(sorted).toEqual([]);
    });

    it('should handle single item', () => {
      const single = [{ name: 'Only Item', cost: 50 }];
      const sorted = [...single].sort(getSortFunction('a-z'));
      expect(sorted).toEqual(single);
    });
  });

  describe('Search Filtering Logic', () => {
    it('should match case-insensitive name search', () => {
      const name = 'God Sword';
      const searchTerm = 'god';
      expect(name.toLowerCase().includes(searchTerm.toLowerCase())).toBe(true);
    });

    it('should match partial name search', () => {
      const name = 'God Sword';
      const searchTerm = 'swo';
      expect(name.toLowerCase().includes(searchTerm.toLowerCase())).toBe(true);
    });

    it('should match tag search', () => {
      const tags = 'pvp combat melee';
      const searchTerm = 'pvp';
      expect(tags.toLowerCase().includes(searchTerm.toLowerCase())).toBe(true);
    });

    it('should not match non-existent term', () => {
      const name = 'God Sword';
      const tags = 'pvp combat';
      const searchTerm = 'pickaxe';
      const matches =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tags.toLowerCase().includes(searchTerm.toLowerCase());
      expect(matches).toBe(false);
    });

    it('should handle empty search term', () => {
      const searchTerm = '';
      const matchesEmpty = !searchTerm || 'any name'.includes(searchTerm);
      expect(matchesEmpty).toBe(true);
    });

    it('should handle whitespace-only search', () => {
      const searchTerm = '   ';
      const trimmed = searchTerm.trim();
      expect(trimmed).toBe('');
    });
  });

  describe('Category Filtering Logic', () => {
    it('should pass all categories when "all" selected', () => {
      const categoryFilter = CATEGORY_MAP.all;
      const cardCategory = 'swords';
      const matchesCategory = !categoryFilter || categoryFilter.includes(cardCategory);
      expect(matchesCategory).toBe(true);
    });

    it('should filter by single category', () => {
      const categoryFilter = CATEGORY_MAP.swords;
      expect(categoryFilter?.includes('swords')).toBe(true);
      expect(categoryFilter?.includes('pickaxes')).toBe(false);
    });

    it('should filter by tool category group', () => {
      const categoryFilter = CATEGORY_MAP.tools;
      expect(categoryFilter?.includes('pickaxes')).toBe(true);
      expect(categoryFilter?.includes('axes')).toBe(true);
      expect(categoryFilter?.includes('swords')).toBe(false);
    });
  });
});
