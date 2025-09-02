import { describe, it, expect, vi } from "vitest";
import {
  setupApiTest,
  createMockSession,
  createMockUser,
} from "../helpers/test-utils";

// Set up API test environment
const { drizzleMock, mockEnv, mockRequest } = setupApiTest();

// Mock userDb
vi.mock("~/lib/db", () => ({
  userDb: {
    findByHouseholdId: vi.fn(),
  },
}));

// Import after mocking
const { loader } = await import("~/routes/api.family-members");
const { userDb } = await import("~/lib/db");

describe("Family Members API", () => {
  const mockSession = createMockSession();

  const createRequestWithSession = (options: any = {}) => {
    const sessionCookie = `kimmy_auth_session=${encodeURIComponent(JSON.stringify(mockSession))}`;
    return mockRequest({
      ...options,
      headers: {
        cookie: sessionCookie,
        ...options.headers,
      },
    });
  };

  const mockContext = {
    cloudflare: {
      env: mockEnv,
    },
  };

  describe("loader", () => {
    it("should load family members successfully", async () => {
      const mockUsers = [
        createMockUser({
          id: 1,
          name: "Admin User",
          role: "admin",
          age: 35,
          relationshipToAdmin: "self",
        }),
        createMockUser({
          id: 2,
          name: "Child User",
          role: "member",
          age: 8,
          relationshipToAdmin: "child",
        }),
      ];

      (userDb.findByHouseholdId as any).mockResolvedValue(mockUsers);

      const request = createRequestWithSession();

      const result = await loader({ request, context: mockContext });

      expect(userDb.findByHouseholdId).toHaveBeenCalledWith(
        mockEnv,
        mockSession.currentHouseholdId
      );

      // Check that the result has the expected structure
      expect(result).toHaveProperty("members");
      expect(Array.isArray(result.members)).toBe(true);
      expect(result.members).toHaveLength(2);

      // Check member transformation
      expect(result.members[0]).toEqual({
        id: 1,
        name: "Admin User",
        email: "test@example.com",
        role: "admin",
        age: 35,
        relationshipToAdmin: "self",
      });
    });

    it("should throw error when database not available", async () => {
      const contextWithoutDb = {
        cloudflare: {
          env: {}, // No DB
        },
      };

      const request = createRequestWithSession();

      await expect(
        loader({ request, context: contextWithoutDb })
      ).rejects.toMatchObject({
        status: 500,
      });
    });

    it("should throw error when no session found", async () => {
      const request = mockRequest(); // No session cookie

      await expect(
        loader({ request, context: mockContext })
      ).rejects.toMatchObject({
        status: 400,
      });
    });

    it("should handle malformed session cookie", async () => {
      const request = mockRequest({
        headers: {
          cookie: "kimmy_auth_session=invalid-json",
        },
      });

      await expect(
        loader({ request, context: mockContext })
      ).rejects.toMatchObject({
        status: 400,
      });
    });

    it("should throw error when household ID not in session", async () => {
      const sessionWithoutHousehold = { ...mockSession };
      delete sessionWithoutHousehold.currentHouseholdId;

      const sessionCookie = `kimmy_auth_session=${encodeURIComponent(JSON.stringify(sessionWithoutHousehold))}`;

      const request = mockRequest({
        headers: {
          cookie: sessionCookie,
        },
      });

      await expect(
        loader({ request, context: mockContext })
      ).rejects.toMatchObject({
        status: 400,
      });
    });

    it("should handle database errors", async () => {
      (userDb.findByHouseholdId as any).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = createRequestWithSession();

      await expect(
        loader({ request, context: mockContext })
      ).rejects.toMatchObject({
        status: 500,
      });
    });

    it("should handle empty member list", async () => {
      (userDb.findByHouseholdId as any).mockResolvedValue([]);

      const request = createRequestWithSession();

      const result = await loader({ request, context: mockContext });

      expect(result).toEqual({ members: [] });
    });

    it("should properly transform database users to household members", async () => {
      const mockDatabaseUser = createMockUser({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        hashedPassword: "pbkdf2_hash",
        householdId: "household-123",
        role: "member",
        admin: 1, // Database admin flag
        age: 25,
        relationshipToAdmin: "spouse",
        createdAt: "2023-01-01T00:00:00Z",
      });

      (userDb.findByHouseholdId as any).mockResolvedValue([mockDatabaseUser]);

      const request = createRequestWithSession();

      const result = await loader({ request, context: mockContext });

      // Should include relevant fields and exclude sensitive ones
      expect(result.members[0]).toEqual({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "member",
        age: 25,
        relationshipToAdmin: "spouse",
      });

      // Should not include sensitive fields
      expect(result.members[0]).not.toHaveProperty("hashedPassword");
      expect(result.members[0]).not.toHaveProperty("householdId");
      expect(result.members[0]).not.toHaveProperty("createdAt");
    });
  });
});
