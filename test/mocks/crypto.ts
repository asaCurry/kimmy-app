import { vi } from "vitest";

/**
 * Mock Web Crypto API for testing
 * Provides deterministic but realistic crypto operations
 */
export const createCryptoMock = () => ({
  randomUUID: vi.fn(
    () => "test-uuid-" + Math.random().toString(36).substr(2, 9)
  ),
  getRandomValues: vi.fn(arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    sign: vi.fn((algorithm, key, data) => {
      // Create deterministic signature based on input
      const input =
        typeof data === "string" ? data : new TextDecoder().decode(data);
      const hash = Array.from(input).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
      );
      const signature = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        signature[i] = (hash + i) % 256;
      }
      return Promise.resolve(signature.buffer);
    }),
    verify: vi.fn((algorithm, key, signature, data) => {
      // Simple verification - check if signature matches expected pattern
      if (!signature || !data) return Promise.resolve(false);

      const input =
        typeof data === "string" ? data : new TextDecoder().decode(data);
      const hash = Array.from(input).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
      );
      const sigArray = new Uint8Array(signature);

      // Check if signature matches our signing algorithm
      for (let i = 0; i < Math.min(4, sigArray.length); i++) {
        if (sigArray[i] !== (hash + i) % 256) {
          return Promise.resolve(false);
        }
      }
      return Promise.resolve(true);
    }),
    importKey: vi.fn(() => Promise.resolve({})),
    deriveBits: vi.fn((algorithm, key, length) => {
      // Create pseudo-random but deterministic derived bits that include salt and password info
      const saltHash = algorithm.salt
        ? Array.from(algorithm.salt).reduce((acc, val) => acc + val, 0)
        : 0;
      const bits = new Uint8Array(length / 8);
      for (let i = 0; i < bits.length; i++) {
        bits[i] = (saltHash + i * 13 + 42) % 256;
      }
      return Promise.resolve(bits.buffer);
    }),
  },
});

export const installCryptoMock = () => {
  Object.defineProperty(global, "crypto", {
    value: createCryptoMock(),
    writable: true,
    configurable: true,
  });
};
