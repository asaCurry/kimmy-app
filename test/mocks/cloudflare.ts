import { vi } from "vitest";

// Mock Cloudflare Workers runtime
export const mockCloudflareEnv = {
  DB: {
    prepare: vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn(() => Promise.resolve({ results: [] })),
      first: vi.fn(() => Promise.resolve(null)),
      run: vi.fn(() => Promise.resolve({ success: true })),
    })),
    exec: vi.fn(() => Promise.resolve({ results: [] })),
  },
  SESSION_SECRET: "test-secret-key-for-testing-only",
  RATE_LIMIT_KV: {
    get: vi.fn(() => Promise.resolve(null)),
    put: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  },
};

// Mock platform object for Cloudflare Workers
export const mockPlatform = {
  env: mockCloudflareEnv,
  ctx: {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  },
  caches: {
    default: {
      match: vi.fn(() => Promise.resolve(undefined)),
      put: vi.fn(() => Promise.resolve()),
    },
  },
};
