import { vi, beforeEach } from "vitest";
import {
  drizzleMock,
  mockCreateDatabase,
  resetDatabaseMocks,
  setupDatabaseTest,
} from "../mocks/drizzle";
import { applyLibMocks } from "../mocks/lib-modules";
import { mockCloudflareEnv } from "../mocks/cloudflare";

/**
 * Test utilities and setup helpers
 */

/**
 * Setup for database-related tests
 */
export const setupDbTest = () => {
  // Apply database mocks
  vi.mock("~/db", () => ({
    createDatabase: mockCreateDatabase,
  }));

  // Apply lib mocks
  applyLibMocks();

  const setup = setupDatabaseTest();

  beforeEach(() => {
    resetDatabaseMocks();
    vi.clearAllMocks();
  });

  return setup;
};

/**
 * Setup for API route tests
 */
export const setupApiTest = () => {
  const dbSetup = setupDbTest();

  // Additional API-specific setup
  const mockRequest = (
    options: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: any;
    } = {}
  ) => {
    return new Request(options.url || "http://localhost:3000/test", {
      method: options.method || "GET",
      headers: options.headers || {},
      body:
        options.body instanceof FormData
          ? options.body
          : options.body
            ? JSON.stringify(options.body)
            : undefined,
    });
  };

  const mockPlatform = {
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

  return {
    ...dbSetup,
    mockRequest,
    mockPlatform,
    mockEnv: mockCloudflareEnv,
  };
};

/**
 * Setup for component tests
 */
export const setupComponentTest = () => {
  // Mock React Router if needed
  vi.mock("react-router", () => ({
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    useLoaderData: vi.fn(() => ({})),
    Link: vi.fn(({ children, ...props }) =>
      React.createElement("a", props, children)
    ),
    NavLink: vi.fn(({ children, ...props }) =>
      React.createElement("a", props, children)
    ),
  }));

  return {};
};

/**
 * Create mock user data for tests
 */
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: "Test User",
  email: "test@example.com",
  hashedPassword: "pbkdf2_test_hashed",
  householdId: "household-123",
  role: "member",
  admin: 0,
  createdAt: "2023-01-01T00:00:00Z",
  age: null,
  relationshipToAdmin: null,
  ...overrides,
});

/**
 * Create mock household data for tests
 */
export const createMockHousehold = (overrides: Partial<any> = {}) => ({
  id: "household-123",
  name: "Test Family",
  inviteCode: "TEST1234",
  hasAnalyticsAccess: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  ...overrides,
});

/**
 * Create mock session data for tests
 */
export const createMockSession = (overrides: Partial<any> = {}) => ({
  userId: 1,
  email: "test@example.com",
  name: "Test User",
  currentHouseholdId: "household-123",
  role: "member",
  admin: 0,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

/**
 * Utility to wait for async operations in tests
 */
export const waitFor = (ms: number = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock fetch responses
 */
export const mockFetchResponse = (
  data: any,
  options: { status?: number; ok?: boolean } = {}
) => {
  const response = {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn(() => Promise.resolve(data)),
    text: vi.fn(() =>
      Promise.resolve(typeof data === "string" ? data : JSON.stringify(data))
    ),
    headers: new Headers(),
  };

  (global.fetch as any).mockResolvedValue(response);
  return response;
};
