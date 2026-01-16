#!/usr/bin/env node

// Polyfill crypto before loading vitest
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

// Now run vitest
import { run } from 'vitest/run';
run();
