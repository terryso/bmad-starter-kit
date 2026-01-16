#!/usr/bin/env node

// Polyfill crypto.getRandomValues for Node.js v16
// This must be loaded before vitest/vite
import { randomBytes } from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (arr) => {
      const bytes = randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
  };
}

// Now run vitest with CLI args
import { exec } from 'child_process';
const args = process.argv.slice(2);
const vitestPath = './node_modules/.bin/vitest';

exec(`${vitestPath} ${args.join(' ')}`, {
  stdio: 'inherit',
  env: { ...process.env },
}, (error) => {
  if (error) {
    process.exit(error.status || 1);
  }
});
