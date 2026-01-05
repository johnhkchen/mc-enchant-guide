import { describe, it, expect } from 'vitest';
import { expectSlow, trackPerf } from '../utils/perf';

describe('Test Setup Verification', () => {
  describe('basic assertions', () => {
    it('performs basic math operations', () => {
      expect(1 + 1).toBe(2);
      expect(5 * 5).toBe(25);
    });

    it('handles string operations', () => {
      expect('minecraft'.toUpperCase()).toBe('MINECRAFT');
      expect('enchant'.length).toBe(7);
    });
  });

  describe('localStorage mock', () => {
    it('stores and retrieves values', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('returns null for non-existent keys', () => {
      expect(localStorage.getItem('non-existent')).toBeNull();
    });

    it('clears between tests (isolation check)', () => {
      // This should pass because beforeEach clears localStorage
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('globals configuration', () => {
    it('has describe, it, and expect available globally', () => {
      // If this test runs, globals are working correctly
      expect(typeof describe).toBe('function');
      expect(typeof it).toBe('function');
      expect(typeof expect).toBe('function');
    });
  });
});

describe('Performance Tracking Demo', () => {
  // Example: Track a fast test
  it(
    'fast operation',
    trackPerf('fast operation', () => {
      const result = [1, 2, 3].map((x) => x * 2);
      expect(result).toEqual([2, 4, 6]);
    })
  );

  // Example: Declare a test as intentionally slow with expected duration
  it(
    ...expectSlow('intentionally slow operation', 200, async () => {
      // This test is expected to take up to 200ms
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(true).toBe(true);
    })
  );

  // Example: A test that would be flagged as unexpectedly slow
  // (commented out to not slow down normal test runs)
  // it('unexpectedly slow', trackPerf('unexpectedly slow', async () => {
  //   await new Promise(resolve => setTimeout(resolve, 150));
  //   expect(true).toBe(true);
  // }));
});
