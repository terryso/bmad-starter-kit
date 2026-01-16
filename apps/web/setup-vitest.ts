// Setup file for Vite - must be at project root
// This runs before vitest config to fix webcrypto issues in Node.js v16

import { randomBytes } from 'crypto';

// Polyfill webcrypto for Node.js < 18
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      const bytes = randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
    randomUUID: () => {
      const bytes = randomBytes(16);
      bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10
      return [
        bytes.subarray(0, 4),
        bytes.subarray(4, 6),
        bytes.subarray(6, 8),
        bytes.subarray(8, 10),
        bytes.subarray(10, 16),
      ]
        .map((group) => Array.from(group).map((b) => b.toString(16).padStart(2, '0')).join(''))
        .join('-');
    },
  } as Crypto;
}
