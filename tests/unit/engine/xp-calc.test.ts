// tests/unit/engine/xp-calc.test.ts
// Unit tests for XP calculator functions
// Reference values from: https://minecraft.wiki/w/Experience

import { describe, it, expect } from 'vitest';
import {
  levelToXp,
  xpToLevel,
  xpBetweenLevels,
  calculateIncrementalXp,
  calculateBulkXp,
} from '../../../src/engine/xp-calc';

describe('levelToXp', () => {
  describe('required reference values from task 004', () => {
    it('levelToXp(0) === 0', () => {
      expect(levelToXp(0)).toBe(0);
    });

    it('levelToXp(7) === 91', () => {
      // Note: Task 004 incorrectly listed 37; wiki confirms 91
      // 7² + 6*7 = 49 + 42 = 91
      expect(levelToXp(7)).toBe(91);
    });

    it('levelToXp(15) === 315', () => {
      expect(levelToXp(15)).toBe(315);
    });

    it('levelToXp(30) === 1395', () => {
      expect(levelToXp(30)).toBe(1395);
    });

    it('levelToXp(39) === 2727', () => {
      expect(levelToXp(39)).toBe(2727);
    });

    it('levelToXp(50) === 5345', () => {
      expect(levelToXp(50)).toBe(5345);
    });
  });

  describe('formula range 0-16 (level² + 6*level)', () => {
    it('handles level 1', () => {
      // 1² + 6*1 = 1 + 6 = 7
      expect(levelToXp(1)).toBe(7);
    });

    it('handles level 10', () => {
      // 10² + 6*10 = 100 + 60 = 160
      expect(levelToXp(10)).toBe(160);
    });

    it('handles level 16 (boundary)', () => {
      // 16² + 6*16 = 256 + 96 = 352
      expect(levelToXp(16)).toBe(352);
    });
  });

  describe('formula range 17-31 (2.5*level² - 40.5*level + 360)', () => {
    it('handles level 17 (boundary)', () => {
      // 2.5*17² - 40.5*17 + 360 = 722.5 - 688.5 + 360 = 394
      expect(levelToXp(17)).toBe(394);
    });

    it('handles level 20', () => {
      // 2.5*400 - 40.5*20 + 360 = 1000 - 810 + 360 = 550
      expect(levelToXp(20)).toBe(550);
    });

    it('handles level 31 (boundary)', () => {
      // 2.5*31² - 40.5*31 + 360 = 2402.5 - 1255.5 + 360 = 1507
      expect(levelToXp(31)).toBe(1507);
    });
  });

  describe('formula range 32+ (4.5*level² - 162.5*level + 2220)', () => {
    it('handles level 32 (boundary)', () => {
      // 4.5*32² - 162.5*32 + 2220 = 4608 - 5200 + 2220 = 1628
      expect(levelToXp(32)).toBe(1628);
    });

    it('handles level 40', () => {
      // 4.5*1600 - 162.5*40 + 2220 = 7200 - 6500 + 2220 = 2920
      expect(levelToXp(40)).toBe(2920);
    });

    it('handles level 100 (high level)', () => {
      // 4.5*10000 - 162.5*100 + 2220 = 45000 - 16250 + 2220 = 30970
      expect(levelToXp(100)).toBe(30970);
    });
  });

  describe('edge cases', () => {
    it('throws RangeError for negative levels', () => {
      expect(() => levelToXp(-1)).toThrow(RangeError);
      expect(() => levelToXp(-5)).toThrow(RangeError);
    });

    it('handles fractional input by flooring', () => {
      expect(levelToXp(7.5)).toBe(levelToXp(7));
      expect(levelToXp(7.9)).toBe(levelToXp(7));
      expect(levelToXp(16.99)).toBe(levelToXp(16));
    });
  });
});

describe('xpToLevel', () => {
  describe('round-trip consistency', () => {
    it('converts exact XP values correctly', () => {
      // For each reference value, xpToLevel(levelToXp(n)) should return n
      expect(xpToLevel(levelToXp(0))).toBe(0);
      expect(xpToLevel(levelToXp(7))).toBe(7);
      expect(xpToLevel(levelToXp(15))).toBe(15);
      expect(xpToLevel(levelToXp(16))).toBe(16);
      expect(xpToLevel(levelToXp(17))).toBe(17);
      expect(xpToLevel(levelToXp(30))).toBe(30);
      expect(xpToLevel(levelToXp(31))).toBe(31);
      expect(xpToLevel(levelToXp(32))).toBe(32);
      expect(xpToLevel(levelToXp(39))).toBe(39);
      expect(xpToLevel(levelToXp(50))).toBe(50);
    });
  });

  describe('formula range 0-16', () => {
    it('handles XP within range', () => {
      expect(xpToLevel(0)).toBe(0);
      expect(xpToLevel(7)).toBe(1);
      expect(xpToLevel(91)).toBe(7);   // Level 7 = 91 XP
      expect(xpToLevel(315)).toBe(15);
      expect(xpToLevel(352)).toBe(16);
    });

    it('floors for XP values between levels', () => {
      // Between level 0 (0 XP) and level 1 (7 XP)
      expect(xpToLevel(3)).toBe(0);
      expect(xpToLevel(6)).toBe(0);
      // Between level 1 (7 XP) and level 2 (16 XP)
      expect(xpToLevel(10)).toBe(1);
    });
  });

  describe('formula range 17-31', () => {
    it('handles XP within range', () => {
      expect(xpToLevel(394)).toBe(17);
      expect(xpToLevel(1395)).toBe(30);
      expect(xpToLevel(1507)).toBe(31);
    });

    it('floors for XP values between levels', () => {
      // Between level 17 (394 XP) and level 18 (441 XP)
      expect(xpToLevel(400)).toBe(17);
      expect(xpToLevel(440)).toBe(17);
    });
  });

  describe('formula range 32+', () => {
    it('handles XP within range', () => {
      expect(xpToLevel(1628)).toBe(32);
      expect(xpToLevel(2727)).toBe(39);
      expect(xpToLevel(2920)).toBe(40);
      expect(xpToLevel(5345)).toBe(50);
    });

    it('handles very high XP values', () => {
      expect(xpToLevel(30970)).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('throws RangeError for negative XP', () => {
      expect(() => xpToLevel(-1)).toThrow(RangeError);
      expect(() => xpToLevel(-100)).toThrow(RangeError);
    });
  });
});

describe('xpBetweenLevels', () => {
  it('calculates XP needed to go from 0 to target', () => {
    expect(xpBetweenLevels(0, 7)).toBe(91);  // Level 7 = 91 XP
    expect(xpBetweenLevels(0, 15)).toBe(315);
    expect(xpBetweenLevels(0, 30)).toBe(1395);
  });

  it('calculates XP needed between two levels', () => {
    // From level 10 to level 15
    expect(xpBetweenLevels(10, 15)).toBe(levelToXp(15) - levelToXp(10));
    // From level 20 to level 30
    expect(xpBetweenLevels(20, 30)).toBe(levelToXp(30) - levelToXp(20));
  });

  it('returns 0 for same level', () => {
    expect(xpBetweenLevels(10, 10)).toBe(0);
    expect(xpBetweenLevels(30, 30)).toBe(0);
  });

  it('returns negative for going down', () => {
    expect(xpBetweenLevels(15, 10)).toBe(levelToXp(10) - levelToXp(15));
    expect(xpBetweenLevels(15, 10)).toBeLessThan(0);
  });

  it('throws for negative levels', () => {
    expect(() => xpBetweenLevels(-1, 10)).toThrow(RangeError);
    expect(() => xpBetweenLevels(10, -1)).toThrow(RangeError);
  });
});

describe('calculateIncrementalXp', () => {
  it('returns 0 for empty array', () => {
    expect(calculateIncrementalXp([])).toBe(0);
  });

  it('returns levelToXp for single step', () => {
    expect(calculateIncrementalXp([7])).toBe(levelToXp(7));
    expect(calculateIncrementalXp([30])).toBe(levelToXp(30));
  });

  it('sums levelToXp for multiple steps', () => {
    // Steps of 5, 7, 10 levels
    const expected = levelToXp(5) + levelToXp(7) + levelToXp(10);
    expect(calculateIncrementalXp([5, 7, 10])).toBe(expected);
  });

  it('handles realistic crafting scenario', () => {
    // Typical God Sword crafting might have steps like: 2, 4, 6, 8, 10, 12
    const steps = [2, 4, 6, 8, 10, 12];
    const expected = steps.reduce((sum, level) => sum + levelToXp(level), 0);
    expect(calculateIncrementalXp(steps)).toBe(expected);
  });
});

describe('calculateBulkXp', () => {
  it('returns 0 for empty array', () => {
    expect(calculateBulkXp([])).toBe(0);
  });

  it('returns levelToXp for single step', () => {
    expect(calculateBulkXp([7])).toBe(levelToXp(7));
    expect(calculateBulkXp([30])).toBe(levelToXp(30));
  });

  it('returns levelToXp of max step for multiple steps', () => {
    // Max of [5, 7, 10] is 10
    expect(calculateBulkXp([5, 7, 10])).toBe(levelToXp(10));
    // Max of [2, 30, 15] is 30
    expect(calculateBulkXp([2, 30, 15])).toBe(levelToXp(30));
  });

  it('is always <= calculateIncrementalXp', () => {
    const steps = [5, 7, 10, 12];
    expect(calculateBulkXp(steps)).toBeLessThanOrEqual(calculateIncrementalXp(steps));
  });
});

describe('cross-function consistency', () => {
  it('bulk XP equals incremental XP when all steps are the same', () => {
    const steps = [10, 10, 10];
    expect(calculateBulkXp(steps)).toBe(levelToXp(10));
    expect(calculateIncrementalXp(steps)).toBe(3 * levelToXp(10));
  });

  it('xpBetweenLevels(0, n) equals levelToXp(n)', () => {
    for (const level of [0, 7, 16, 17, 31, 32, 50]) {
      expect(xpBetweenLevels(0, level)).toBe(levelToXp(level));
    }
  });
});
