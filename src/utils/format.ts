// src/utils/format.ts
// Formatting utilities for display strings

import { getEnchantment } from '../data/enchantment-lookup.js';
import type { EnchantmentId } from '../types/index.js';

/**
 * Convert level number to Roman numeral (I-V).
 * Returns the number as string for values > 5.
 */
export function toRomanNumeral(num: number): string {
  const numerals = ['', 'I', 'II', 'III', 'IV', 'V'];
  return numerals[num] ?? String(num);
}

/**
 * Format an enchantment for display.
 * Returns "Sharpness V" or "Mending" (no numeral for max level 1).
 *
 * @param id - Enchantment ID (e.g., "sharpness")
 * @param level - Enchantment level (e.g., 5)
 * @returns Formatted display string (e.g., "Sharpness V")
 */
export function formatEnchantment(id: string, level: number): string {
  const enchData = getEnchantment(id as EnchantmentId);
  const name = enchData?.name ?? id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Don't show "I" for single-level enchants like Mending
  if (level === 1 && (enchData?.maxLevel ?? 1) === 1) {
    return name;
  }
  return `${name} ${toRomanNumeral(level)}`;
}

/**
 * Extract enchantment entries from the spec array.
 * Each spec is like { sharpness: 5 }, returns [["sharpness", 5], ...]
 *
 * @param specs - Array of single-key enchantment records
 * @returns Array of [id, level] tuples
 */
export function getEnchantmentEntries(specs: Record<string, number>[]): [string, number][] {
  return specs.flatMap((spec) => Object.entries(spec));
}

/**
 * Format multiple enchantments from specs array.
 *
 * @param specs - Array of single-key enchantment records
 * @returns Array of formatted display strings
 */
export function formatEnchantments(specs: Record<string, number>[]): string[] {
  return getEnchantmentEntries(specs).map(([id, level]) => formatEnchantment(id, level));
}
