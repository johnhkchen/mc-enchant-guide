// src/engine/xp-calc.ts
// XP and level calculation functions for Minecraft enchanting
// Formulas verified against: https://minecraft.wiki/w/Experience

// Boundary values for formula selection
const XP_AT_LEVEL_16 = 352;   // levelToXp(16)
const XP_AT_LEVEL_31 = 1507;  // levelToXp(31)

/**
 * Converts a Minecraft level to total XP required to reach it.
 * Uses the piecewise formula from the Minecraft wiki.
 *
 * @param level - The level to convert (non-negative integer)
 * @returns Total XP points needed to reach this level
 * @throws {RangeError} If level is negative
 */
export function levelToXp(level: number): number {
  if (level < 0) {
    throw new RangeError('Level cannot be negative');
  }

  // Handle non-integer levels by flooring
  const l = Math.floor(level);

  if (l <= 16) {
    // For levels 0-16: Total XP = level² + 6 × level
    return l * l + 6 * l;
  }

  if (l <= 31) {
    // For levels 17-31: Total XP = 2.5 × level² - 40.5 × level + 360
    return Math.floor(2.5 * l * l - 40.5 * l + 360);
  }

  // For levels 32+: Total XP = 4.5 × level² - 162.5 × level + 2220
  return Math.floor(4.5 * l * l - 162.5 * l + 2220);
}

/**
 * Converts total XP points to the corresponding Minecraft level.
 * Uses inverse of the piecewise formula.
 *
 * @param xp - Total XP points (non-negative)
 * @returns The level that can be reached with this XP (floored)
 * @throws {RangeError} If xp is negative
 */
export function xpToLevel(xp: number): number {
  if (xp < 0) {
    throw new RangeError('XP cannot be negative');
  }

  if (xp <= XP_AT_LEVEL_16) {
    // Solve: level² + 6*level - xp = 0
    // Using quadratic formula: (-b + sqrt(b² + 4ac)) / 2a where a=1, b=6, c=-xp
    return Math.floor((-6 + Math.sqrt(36 + 4 * xp)) / 2);
  }

  if (xp <= XP_AT_LEVEL_31) {
    // Solve: 2.5*level² - 40.5*level + 360 - xp = 0
    // Using quadratic formula with a=2.5, b=-40.5, c=360-xp
    const discriminant = 40.5 * 40.5 - 4 * 2.5 * (360 - xp);
    return Math.floor((40.5 + Math.sqrt(discriminant)) / 5);
  }

  // Solve: 4.5*level² - 162.5*level + 2220 - xp = 0
  // Using quadratic formula with a=4.5, b=-162.5, c=2220-xp
  const discriminant = 162.5 * 162.5 - 4 * 4.5 * (2220 - xp);
  return Math.floor((162.5 + Math.sqrt(discriminant)) / 9);
}

/**
 * Calculates the XP needed to go from one level to another.
 *
 * @param from - Starting level
 * @param to - Target level
 * @returns XP points needed (negative if going down)
 * @throws {RangeError} If either level is negative
 */
export function xpBetweenLevels(from: number, to: number): number {
  return levelToXp(to) - levelToXp(from);
}

/**
 * Calculates total XP for incremental crafting (earn XP, spend, repeat).
 * This is the realistic scenario where players earn XP between each anvil use.
 * Each step cost is the level cost for that anvil operation.
 *
 * @param stepCosts - Array of level costs for each crafting step
 * @returns Total XP needed (sum of levelToXp for each step)
 */
export function calculateIncrementalXp(stepCosts: number[]): number {
  return stepCosts.reduce((total, cost) => total + levelToXp(cost), 0);
}

/**
 * Calculates total XP for bulk crafting (save to max level first).
 * This is the scenario where players save up all XP before crafting.
 * Only the maximum step cost matters since you start from level 0 each time.
 *
 * @param stepCosts - Array of level costs for each crafting step
 * @returns XP needed for the highest single cost
 */
export function calculateBulkXp(stepCosts: number[]): number {
  if (stepCosts.length === 0) {
    return 0;
  }
  const maxCost = Math.max(...stepCosts);
  return levelToXp(maxCost);
}
