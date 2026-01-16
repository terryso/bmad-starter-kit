/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';
import path from 'path';

// Polyfill crypto for Node.js v16 - must be before vitest config loads
import { randomBytes } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      const bytes = randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
  } as Crypto;
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@bmad-starter-kit/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
