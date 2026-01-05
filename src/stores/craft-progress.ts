// src/stores/craft-progress.ts
// Craft progress store for tracking step completion within crafting trees
// Uses Solid.js signals with localStorage persistence

import { createSignal, type Accessor } from 'solid-js';

const STORAGE_KEY = 'mc-enchant:progress';

// Internal type for storage: Map of recipeId -> completed node IDs
type ProgressMap = Record<string, string[]>;

// ─────────────────────────────────────────────────────────────
// localStorage Helpers (SSR-safe)
// ─────────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function loadFromStorage(): ProgressMap {
  if (!isClient()) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);

    // Validate structure: should be an object with string[] values
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    // Validate each entry
    const validEntries: ProgressMap = {};
    for (const [recipeId, nodeIds] of Object.entries(parsed)) {
      if (typeof recipeId === 'string' && Array.isArray(nodeIds)) {
        // Filter to only valid string node IDs
        const validNodeIds = (nodeIds as unknown[]).filter(
          (id): id is string => typeof id === 'string'
        );
        if (validNodeIds.length > 0) {
          validEntries[recipeId] = validNodeIds;
        }
      }
    }

    return validEntries;
  } catch {
    // Corrupted data or parse error - start fresh
    return {};
  }
}

function saveToStorage(progress: ProgressMap): void {
  if (!isClient()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

// ─────────────────────────────────────────────────────────────
// Craft Progress Store
// ─────────────────────────────────────────────────────────────

export interface CraftProgressStore {
  // State access
  getProgress: (recipeId: string) => string[];

  // Raw progress accessor for reactivity
  progress: Accessor<ProgressMap>;

  // Actions
  toggleNode: (recipeId: string, nodeId: string) => void;
  reset: (recipeId: string) => void;
  resetAll: () => void;

  // Derived
  isCompleted: (recipeId: string, nodeId: string) => boolean;
  getCompletionPercent: (recipeId: string, totalNodes: number) => number;
  isRecipeComplete: (recipeId: string, totalNodes: number) => boolean;
}

function createCraftProgressStore(): CraftProgressStore {
  // Initialize from localStorage
  const [progress, setProgress] = createSignal<ProgressMap>(loadFromStorage());

  // Helper: update progress and persist synchronously
  function setProgressAndPersist(updater: (prev: ProgressMap) => ProgressMap): void {
    setProgress((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }

  // State access
  function getProgress(recipeId: string): string[] {
    return progress()[recipeId] ?? [];
  }

  // Actions
  function toggleNode(recipeId: string, nodeId: string): void {
    setProgressAndPersist((prev) => {
      const current = prev[recipeId] ?? [];
      const isCurrentlyCompleted = current.includes(nodeId);

      if (isCurrentlyCompleted) {
        // Remove node from completed list
        const updated = current.filter((id) => id !== nodeId);
        if (updated.length === 0) {
          // Remove recipe entry if empty
          const { [recipeId]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [recipeId]: updated };
      } else {
        // Add node to completed list
        return { ...prev, [recipeId]: [...current, nodeId] };
      }
    });
  }

  function reset(recipeId: string): void {
    setProgressAndPersist((prev) => {
      if (!(recipeId in prev)) {
        return prev; // Nothing to reset
      }
      const { [recipeId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function resetAll(): void {
    setProgressAndPersist(() => ({}));
  }

  // Derived
  function isCompleted(recipeId: string, nodeId: string): boolean {
    const nodeIds = progress()[recipeId];
    return nodeIds ? nodeIds.includes(nodeId) : false;
  }

  function getCompletionPercent(recipeId: string, totalNodes: number): number {
    if (totalNodes <= 0) return 0;
    const completedCount = getProgress(recipeId).length;
    return Math.round((completedCount / totalNodes) * 100);
  }

  function isRecipeComplete(recipeId: string, totalNodes: number): boolean {
    if (totalNodes <= 0) return false;
    return getProgress(recipeId).length >= totalNodes;
  }

  return {
    progress,
    getProgress,
    toggleNode,
    reset,
    resetAll,
    isCompleted,
    getCompletionPercent,
    isRecipeComplete,
  };
}

// Export factory for testing
export { createCraftProgressStore };

// Create and export singleton store
export const craftProgressStore = createCraftProgressStore();

// Export individual functions for convenience
export const {
  progress,
  getProgress,
  toggleNode,
  reset,
  resetAll,
  isCompleted,
  getCompletionPercent,
  isRecipeComplete,
} = craftProgressStore;
