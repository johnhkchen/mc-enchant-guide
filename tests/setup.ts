import { beforeEach, afterAll, vi } from 'vitest';
import { generatePerfReport, clearPerfResults, perfResults } from './utils/perf';

// Print performance report after all tests (only if we have data)
afterAll(() => {
  if (perfResults.length > 0 && process.env.VITEST_PERF_REPORT === 'true') {
    console.log(generatePerfReport());
    clearPerfResults();
  }
});

// Mock localStorage for store tests
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  localStorageMock.store = {};
  vi.clearAllMocks();
});
