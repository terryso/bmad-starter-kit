// Polyfill crypto for Node.js v16 - MUST be at top of file
const { randomBytes } = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (arr) => {
      const bytes = randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
    randomUUID: () => {
      const bytes = randomBytes(16);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes)
        .map((b) => (b < 16 ? '0' : '') + b.toString(16))
        .join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    },
  };
}

module.exports = {
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
      '@': require('path').resolve(__dirname, './src'),
      '@bmad-starter-kit/shared': require('path').resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
};
