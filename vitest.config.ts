import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    slowTestThreshold: 125,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/engine/**', 'src/data/**', 'src/stores/**'],
      exclude: ['src/components/**'],
      thresholds: {
        'src/engine/**': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        'src/data/rules/**': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        'src/data/enchantment-lookup.ts': {
          statements: 90,
          branches: 84,
          functions: 90,
          lines: 90,
        },
        'src/stores/**': {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
