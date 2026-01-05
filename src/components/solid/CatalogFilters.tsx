// src/components/solid/CatalogFilters.tsx
// Filter controls for the catalog page - search, sort, and category tabs

import { createSignal, createEffect, onMount, For } from 'solid-js';

export type SortOption = 'xp-high' | 'xp-low' | 'a-z' | 'z-a';
export type CategoryTab = 'all' | 'swords' | 'tools' | 'armor' | 'ranged' | 'other';

interface CatalogFiltersProps {
  /** Initial category from URL or default */
  initialCategory?: CategoryTab;
}

/** Maps UI category tabs to recipe categories */
const CATEGORY_MAP: Record<CategoryTab, string[] | null> = {
  all: null, // No filter
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

/**
 * CatalogFilters provides interactive filtering and sorting for the catalog.
 * It manipulates the DOM to show/hide and reorder pre-rendered cards.
 */
export function CatalogFilters(props: CatalogFiltersProps): JSX.Element {
  const [search, setSearch] = createSignal('');
  const [sort, setSort] = createSignal<SortOption>('xp-high');
  const [category, setCategory] = createSignal<CategoryTab>(props.initialCategory ?? 'all');

  // Apply filters and sorting when state changes
  createEffect(() => {
    const searchTerm = search().toLowerCase().trim();
    const sortOption = sort();
    const activeCategory = category();
    const categoryFilter = CATEGORY_MAP[activeCategory];

    // Get all cards from the DOM
    const recipeCards = document.querySelectorAll<HTMLElement>('.recipe-card');
    const bundleCards = document.querySelectorAll<HTMLElement>('.bundle-card');
    const recipesGrid = document.getElementById('recipes-grid');
    const bundlesGrid = document.getElementById('bundles-grid');

    let visibleRecipes = 0;
    let visibleBundles = 0;

    // Filter and collect recipe cards for sorting
    const recipeItems: { el: HTMLElement; name: string; cost: number }[] = [];
    recipeCards.forEach((card) => {
      const name = (card.dataset.name ?? '').toLowerCase();
      const tags = (card.dataset.tags ?? '').toLowerCase();
      const cardCategory = card.dataset.category ?? '';
      const cost = parseInt(card.dataset.cost ?? '0', 10);

      // Check search match
      const matchesSearch = !searchTerm || name.includes(searchTerm) || tags.includes(searchTerm);

      // Check category match
      const matchesCategory = !categoryFilter || categoryFilter.includes(cardCategory);

      if (matchesSearch && matchesCategory) {
        card.style.display = '';
        visibleRecipes++;
        recipeItems.push({ el: card, name, cost });
      } else {
        card.style.display = 'none';
      }
    });

    // Filter and collect bundle cards for sorting
    const bundleItems: { el: HTMLElement; name: string; cost: number }[] = [];
    bundleCards.forEach((card) => {
      const name = (card.dataset.name ?? '').toLowerCase();
      const tags = (card.dataset.tags ?? '').toLowerCase();
      const cost = parseInt(card.dataset.cost ?? '0', 10);

      // Check search match
      const matchesSearch = !searchTerm || name.includes(searchTerm) || tags.includes(searchTerm);

      // Bundles don't filter by category (they contain mixed items)
      // But we could filter by tags if needed
      const matchesCategory = activeCategory === 'all' || tags.includes(activeCategory);

      if (matchesSearch && matchesCategory) {
        card.style.display = '';
        visibleBundles++;
        bundleItems.push({ el: card, name, cost });
      } else {
        card.style.display = 'none';
      }
    });

    // Sort items
    const sortFn = getSortFunction(sortOption);
    recipeItems.sort(sortFn);
    bundleItems.sort(sortFn);

    // Reorder DOM elements
    if (recipesGrid) {
      recipeItems.forEach((item) => recipesGrid.appendChild(item.el));
    }
    if (bundlesGrid) {
      bundleItems.forEach((item) => bundlesGrid.appendChild(item.el));
    }

    // Update section visibility
    const bundlesSection = document.getElementById('bundles-section');
    const recipesSection = document.getElementById('recipes-section');
    const emptyState = document.getElementById('catalog-empty');

    if (bundlesSection) {
      bundlesSection.style.display = visibleBundles > 0 ? '' : 'none';
    }
    if (recipesSection) {
      recipesSection.style.display = visibleRecipes > 0 ? '' : 'none';
    }
    if (emptyState) {
      emptyState.style.display = visibleRecipes === 0 && visibleBundles === 0 ? '' : 'none';
    }
  });

  // Run filter on mount to apply any initial state
  onMount(() => {
    // Trigger initial filter
    setSearch(search());
  });

  return (
    <div class="catalog-filters">
      {/* Search and Sort Row */}
      <div class="filter-row">
        <div class="input-search filter-search">
          <span class="search-icon" aria-hidden="true">&#128269;</span>
          <input
            type="text"
            class="input"
            placeholder="Search recipes..."
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            aria-label="Search recipes by name or tags"
          />
        </div>

        <div class="filter-sort">
          <label class="sr-only" for="sort-select">Sort by</label>
          <select
            id="sort-select"
            class="select"
            value={sort()}
            onChange={(e) => setSort(e.currentTarget.value as SortOption)}
          >
            <For each={SORT_OPTIONS}>
              {(option) => <option value={option.value}>{option.label}</option>}
            </For>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div class="tabs category-tabs" role="tablist" aria-label="Filter by category">
        <For each={CATEGORY_TABS}>
          {(tab) => (
            <button
              type="button"
              role="tab"
              class="tab"
              classList={{ 'tab-active': category() === tab.value }}
              aria-selected={category() === tab.value}
              onClick={() => setCategory(tab.value)}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

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

export default CatalogFilters;
