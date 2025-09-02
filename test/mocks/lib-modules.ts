import { vi } from "vitest";

/**
 * Centralized mocks for all app/lib modules
 * This prevents duplication and ensures consistent behavior across tests
 */

// Utility function mocks
export const createUtilMocks = () => ({
  isDatabaseAvailable: vi.fn(env => env && env.DB),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(" ")),
  parseCookies: vi.fn((cookieHeader: string | null) => {
    if (!cookieHeader) return {};
    return cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );
  }),
});

// Password utility mocks
export const createPasswordMocks = () => ({
  hashPassword: vi.fn((password: string) =>
    Promise.resolve(`pbkdf2_${password}_hashed`)
  ),
  verifyPassword: vi.fn((password: string, hash: string) => {
    // Simple mock verification - check if password matches the pattern in hash
    return Promise.resolve(hash.includes(password));
  }),
  isPasswordHashed: vi.fn((password: string) => password.startsWith("pbkdf2_")),
});

// Token utility mocks
export const createTokenMocks = () => ({
  generateInviteCode: vi.fn(() => "MOCK1234"),
  generateSecureToken: vi.fn(() => "mock-secure-token"),
  generateSessionToken: vi.fn(() => "sess_mock_token"),
});

// Logger mocks
export const createLoggerMocks = () => {
  const createLogger = () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    securityEvent: vi.fn(),
  });

  return {
    dbLogger: createLogger(),
    authLogger: createLogger(),
    logger: createLogger(),
  };
};

// Session mocks
export const createSessionMocks = () => ({
  createSecureToken: vi.fn(),
  verifySecureToken: vi.fn(),
  createSessionCookie: vi.fn(),
  parseSessionCookie: vi.fn(),
  createClearSessionCookie: vi.fn(),
  extractSecureSession: vi.fn(),
});

/**
 * Apply all lib module mocks at once
 * Use this in test files that need comprehensive mocking
 */
export const applyLibMocks = () => {
  // Database and utilities
  vi.mock("~/lib/utils", () => createUtilMocks());
  vi.mock("~/lib/password-utils", () => createPasswordMocks());
  vi.mock("~/lib/token-utils", () => createTokenMocks());
  vi.mock("~/lib/logger", () => createLoggerMocks());
  vi.mock("~/lib/secure-session", () => createSessionMocks());

  return {
    utils: createUtilMocks(),
    password: createPasswordMocks(),
    token: createTokenMocks(),
    logger: createLoggerMocks(),
    session: createSessionMocks(),
  };
};

/**
 * Selective mock application for specific modules
 */
export const mockLibModule = (module: string, mocks: Record<string, any>) => {
  vi.mock(`~/lib/${module}`, () => mocks);
};
