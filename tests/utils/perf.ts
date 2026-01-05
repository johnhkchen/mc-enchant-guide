import { expect, type TestAPI } from 'vitest';

const SLOW_THRESHOLD_MS = 125;

/**
 * Performance expectations for tests.
 * Maps test name patterns to expected maximum duration in ms.
 */
export const expectedDurations: Map<string, number> = new Map();

/**
 * Collected test results for reporting.
 */
export interface PerfResult {
  name: string;
  duration: number;
  expected?: number;
  status: 'fast' | 'slow' | 'expected-slow' | 'exceeded-expected';
}

export const perfResults: PerfResult[] = [];

/**
 * Mark a test as expected to be slow with a maximum duration.
 * Use this to document intentionally slow tests.
 *
 * @example
 * ```ts
 * // In your test file, import and use:
 * import { slowTest } from '../utils/perf';
 *
 * describe('Complex calculations', () => {
 *   slowTest('computes large dataset', 500, async () => {
 *     // This test is expected to take up to 500ms
 *     await complexOperation();
 *   });
 * });
 * ```
 */
export function slowTest(
  name: string,
  expectedMs: number,
  fn: () => void | Promise<void>,
  it: TestAPI
): void {
  expectedDurations.set(name, expectedMs);

  it(name, async () => {
    const start = performance.now();
    try {
      await fn();
    } finally {
      const duration = performance.now() - start;
      const expected = expectedDurations.get(name);

      let status: PerfResult['status'];
      if (expected) {
        status = duration <= expected ? 'expected-slow' : 'exceeded-expected';
      } else {
        status = duration <= SLOW_THRESHOLD_MS ? 'fast' : 'slow';
      }

      perfResults.push({ name, duration, expected, status });

      // Fail if exceeds expected duration
      if (expected && duration > expected) {
        expect(duration).toBeLessThanOrEqual(expected);
      }
    }
  });
}

/**
 * Decorator-style helper to create a slow test wrapper.
 *
 * @example
 * ```ts
 * import { it } from 'vitest';
 * import { expectSlow } from '../utils/perf';
 *
 * describe('Slow operations', () => {
 *   it(...expectSlow('processes large file', 300, async () => {
 *     await processFile();
 *   }));
 * });
 * ```
 */
export function expectSlow(
  name: string,
  expectedMs: number,
  fn: () => void | Promise<void>
): [string, () => Promise<void>] {
  expectedDurations.set(name, expectedMs);

  return [
    name,
    async () => {
      const start = performance.now();
      try {
        await fn();
      } finally {
        const duration = performance.now() - start;

        perfResults.push({
          name,
          duration,
          expected: expectedMs,
          status: duration <= expectedMs ? 'expected-slow' : 'exceeded-expected',
        });

        if (duration > expectedMs) {
          throw new Error(
            `Test "${name}" exceeded expected duration: ${duration.toFixed(2)}ms > ${expectedMs}ms`
          );
        }
      }
    },
  ];
}

/**
 * Track any test's performance without marking it as slow.
 *
 * @example
 * ```ts
 * import { trackPerf } from '../utils/perf';
 *
 * it('normal test', trackPerf('normal test', async () => {
 *   await doSomething();
 * }));
 * ```
 */
export function trackPerf(
  name: string,
  fn: () => void | Promise<void>
): () => Promise<void> {
  return async () => {
    const start = performance.now();
    try {
      await fn();
    } finally {
      const duration = performance.now() - start;
      const expected = expectedDurations.get(name);

      let status: PerfResult['status'];
      if (expected) {
        status = duration <= expected ? 'expected-slow' : 'exceeded-expected';
      } else {
        status = duration <= SLOW_THRESHOLD_MS ? 'fast' : 'slow';
      }

      perfResults.push({ name, duration, expected, status });
    }
  };
}

/**
 * Generate performance report from collected results.
 */
export function generatePerfReport(): string {
  if (perfResults.length === 0) {
    return 'No performance data collected.';
  }

  const lines: string[] = [];
  lines.push('=' .repeat(70));
  lines.push('TEST PERFORMANCE REPORT');
  lines.push('='.repeat(70));

  // Statistics
  const durations = perfResults.map((r) => r.duration).sort((a, b) => a - b);
  const total = durations.reduce((a, b) => a + b, 0);
  const mean = total / durations.length;

  const percentile = (p: number): number => {
    if (durations.length === 1) return durations[0];
    const idx = (p / 100) * (durations.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return durations[lower] * (1 - weight) + durations[upper] * weight;
  };

  lines.push('\nSTATISTICS:');
  lines.push(`  Total tests:    ${perfResults.length}`);
  lines.push(`  Total time:     ${total.toFixed(2)}ms`);
  lines.push(`  Mean:           ${mean.toFixed(2)}ms`);
  lines.push(`  Median (p50):   ${percentile(50).toFixed(2)}ms`);
  lines.push(`  p90:            ${percentile(90).toFixed(2)}ms`);
  lines.push(`  p95:            ${percentile(95).toFixed(2)}ms`);
  lines.push(`  p99:            ${percentile(99).toFixed(2)}ms`);

  // Categorize results
  const slow = perfResults.filter((r) => r.status === 'slow');
  const exceeded = perfResults.filter((r) => r.status === 'exceeded-expected');
  const expectedSlow = perfResults.filter((r) => r.status === 'expected-slow');

  if (exceeded.length > 0) {
    lines.push(`\n❌ EXCEEDED EXPECTED DURATION: ${exceeded.length}`);
    lines.push('-'.repeat(70));
    for (const r of exceeded.sort((a, b) => b.duration - a.duration)) {
      lines.push(`  ${r.duration.toFixed(2)}ms (expected: ${r.expected}ms)  ${r.name}`);
    }
  }

  if (slow.length > 0) {
    lines.push(`\n⚠️  UNEXPECTEDLY SLOW (>${SLOW_THRESHOLD_MS}ms): ${slow.length}`);
    lines.push('-'.repeat(70));
    for (const r of slow.sort((a, b) => b.duration - a.duration)) {
      lines.push(`  ${r.duration.toFixed(2)}ms  ${r.name}`);
    }
  }

  if (expectedSlow.length > 0) {
    lines.push(`\n📋 EXPECTED SLOW (within budget): ${expectedSlow.length}`);
    lines.push('-'.repeat(70));
    for (const r of expectedSlow.sort((a, b) => b.duration - a.duration)) {
      lines.push(`  ${r.duration.toFixed(2)}ms / ${r.expected}ms  ${r.name}`);
    }
  }

  // Top slowest
  const sorted = [...perfResults].sort((a, b) => b.duration - a.duration);
  const topCount = Math.min(10, sorted.length);
  lines.push(`\nTOP ${topCount} SLOWEST:`);
  lines.push('-'.repeat(70));
  for (let i = 0; i < topCount; i++) {
    const r = sorted[i];
    const flag =
      r.status === 'exceeded-expected' ? ' ❌' :
      r.status === 'slow' ? ' ⚠️' :
      r.status === 'expected-slow' ? ' 📋' : '';
    lines.push(`  ${i + 1}. ${r.duration.toFixed(2)}ms${flag}  ${r.name}`);
  }

  lines.push('\n' + '='.repeat(70));

  return lines.join('\n');
}

/**
 * Clear collected performance results.
 */
export function clearPerfResults(): void {
  perfResults.length = 0;
}

/**
 * Get the slow threshold in milliseconds.
 */
export function getSlowThreshold(): number {
  return SLOW_THRESHOLD_MS;
}
