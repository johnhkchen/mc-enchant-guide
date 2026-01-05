// src/stores/cart.ts
// Shopping cart store using Solid.js signals with localStorage persistence

import { createSignal, createMemo, type Accessor } from 'solid-js';
import type { CartItem } from '../types/index.js';

const STORAGE_KEY = 'mc-enchant:cart';

// ─────────────────────────────────────────────────────────────
// localStorage Helpers (SSR-safe)
// ─────────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function loadFromStorage(): CartItem[] {
  if (!isClient()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Validate structure
    if (!parsed || !Array.isArray(parsed.items)) {
      return [];
    }

    // Validate each item
    const validItems = parsed.items.filter((item: unknown): item is CartItem => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Record<string, unknown>;
      return (
        typeof obj.recipeId === 'string' &&
        typeof obj.recipeName === 'string' &&
        typeof obj.quantity === 'number' &&
        typeof obj.levelCost === 'number' &&
        obj.quantity > 0 &&
        obj.levelCost >= 0
      );
    });

    return validItems;
  } catch {
    // Corrupted data or parse error - start fresh
    return [];
  }
}

function saveToStorage(items: CartItem[]): void {
  if (!isClient()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

// ─────────────────────────────────────────────────────────────
// Cart Store
// ─────────────────────────────────────────────────────────────

export interface RecipeInput {
  id: string;
  name: string;
  totalLevels: number;
}

export interface CartStore {
  // State
  items: Accessor<CartItem[]>;

  // Actions
  add: (recipe: RecipeInput) => void;
  addBundle: (recipes: RecipeInput[]) => void;
  remove: (recipeId: string) => void;
  updateQuantity: (recipeId: string, quantity: number) => void;
  clear: () => void;

  // Derived
  totalLevels: Accessor<number>;
  totalItems: Accessor<number>;
  isEmpty: Accessor<boolean>;
}

function createCartStore(): CartStore {
  // Initialize from localStorage
  const [items, setItems] = createSignal<CartItem[]>(loadFromStorage());

  // Derived signals
  const totalLevels = createMemo(() =>
    items().reduce((sum, item) => sum + item.levelCost * item.quantity, 0)
  );

  const totalItems = createMemo(() =>
    items().reduce((sum, item) => sum + item.quantity, 0)
  );

  const isEmpty = createMemo(() => items().length === 0);

  // Helper: update items and persist synchronously
  function setItemsAndPersist(updater: (prev: CartItem[]) => CartItem[]): void {
    setItems((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }

  // Actions
  function add(recipe: RecipeInput): void {
    setItemsAndPersist((prev) => {
      const existing = prev.find((item) => item.recipeId === recipe.id);
      if (existing) {
        return prev.map((item) =>
          item.recipeId === recipe.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          recipeId: recipe.id,
          recipeName: recipe.name,
          quantity: 1,
          levelCost: recipe.totalLevels,
        },
      ];
    });
  }

  function addBundle(recipes: RecipeInput[]): void {
    recipes.forEach((recipe) => add(recipe));
  }

  function remove(recipeId: string): void {
    setItemsAndPersist((prev) => prev.filter((item) => item.recipeId !== recipeId));
  }

  function updateQuantity(recipeId: string, quantity: number): void {
    if (quantity <= 0) {
      remove(recipeId);
      return;
    }

    setItemsAndPersist((prev) =>
      prev.map((item) =>
        item.recipeId === recipeId ? { ...item, quantity } : item
      )
    );
  }

  function clear(): void {
    setItemsAndPersist(() => []);
  }

  return {
    items,
    add,
    addBundle,
    remove,
    updateQuantity,
    clear,
    totalLevels,
    totalItems,
    isEmpty,
  };
}

// Export factory for testing
export { createCartStore };

// Create and export singleton store
export const cartStore = createCartStore();

// Export individual functions for convenience
export const { items, add, addBundle, remove, updateQuantity, clear, totalLevels, totalItems, isEmpty } = cartStore;
