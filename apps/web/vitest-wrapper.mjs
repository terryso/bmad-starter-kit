#!/usr/bin/env node

/**
 * Vitest wrapper for Node.js v16
 * Polyfills crypto.getRandomValues before running vitest
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, unlinkSync, existsSync, readdirSync } from 'fs';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a temporary preload file with the polyfill
const preloadContent = `
const { randomBytes } = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (arr) => {
      const bytes = randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    }
  };
}
`;

const preloadFile = join(tmpdir(), `vitest-preload-${Date.now()}.cjs`);
writeFileSync(preloadFile, preloadContent);

// Cleanup function
const cleanup = () => {
  try {
    unlinkSync(preloadFile);
  } catch (e) {
    // ignore
  }
};

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(1);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(1);
});

// Get CLI args
const args = process.argv.slice(2);

// Find vitest package - check both local and root node_modules
const searchPaths = [
  join(__dirname, 'node_modules', '.pnpm'),
  join(__dirname, '..', '..', 'node_modules', '.pnpm'),
];
let vitestCli = null;

for (const searchPath of searchPaths) {
  if (existsSync(searchPath)) {
    const dirs = readdirSync(searchPath);
    for (const dir of dirs) {
      if (dir.startsWith('vitest@')) {
        const cliPath = join(searchPath, dir, 'node_modules', 'vitest', 'vitest.mjs');
        if (existsSync(cliPath)) {
          vitestCli = cliPath;
          break;
        }
      }
    }
    if (vitestCli) break;
  }
}

if (!vitestCli) {
  console.error('Could not find vitest.mjs');
  cleanup();
  process.exit(1);
}

// Run vitest with node directly
const child = spawn('node', [
  `--require=${preloadFile}`,
  vitestCli,
  ...args,
], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_NO_WARNINGS: '1',
  },
});

child.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 1);
});
