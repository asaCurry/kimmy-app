import { describe, it, expect, vi } from "vitest";
import {
  setupDbTest,
  createMockUser,
  createMockHousehold,
} from "../helpers/test-utils";

// Set up database test environment
const { mockEnv, drizzleMock, db } = setupDbTest();

// Import after mocking
const { userDb, householdDb, authDb } = await import("~/lib/db");

describe("Database Utils", () => {
  describe("userDb", () => {
    describe("create", () => {
      it("should create a new user successfully", async () => {
        const userData = {
          name: "Test User",
          email: "test@example.com",
          password: "securepassword",
          householdId: "household-123",
          role: "member",
          age: 25,
          relationshipToAdmin: "spouse",
        };

        const mockUser = createMockUser({
          ...userData,
          hashedPassword: "pbkdf2_hashedpassword",
        });

        drizzleMock.setupMutation([mockUser]);

        const result = await userDb.create(mockEnv, userData);

        expect(db.insert).toHaveBeenCalled();
        expect(db.values).toHaveBeenCalled();
        expect(db.returning).toHaveBeenCalled();
        expect(result).toEqual(mockUser);
      });

      it("should handle user creation without password", async () => {
        const userData = {
          name: "Child User",
          email: "child@example.com",
          householdId: "household-123",
          age: 8,
          relationshipToAdmin: "child",
        };

        const mockUser = {
          id: 2,
          ...userData,
          hashedPassword: null,
          role: "member",
          admin: 0,
          createdAt: "2023-01-01T00:00:00Z",
        };

        drizzleMock.setupMutation([mockUser]);

        const result = await userDb.create(mockEnv, userData);

        expect(result.hashedPassword).toBeNull();
        expect(db.insert).toHaveBeenCalled();
      });

      it("should throw error when database is not available", async () => {
        const userData = {
          name: "Test User",
          email: "test@example.com",
          householdId: "household-123",
        };

        await expect(
          userDb.create({}, userData) // Empty env without DB
        ).rejects.toThrow("Database not available");
      });
    });

    describe("findByEmail", () => {
      it("should find user by email", async () => {
        const email = "test@example.com";
        const mockUser = {
          id: 1,
          name: "Test User",
          email,
          hashedPassword: "pbkdf2_hash",
          householdId: "household-123",
          role: "member",
          admin: 0,
          createdAt: "2023-01-01T00:00:00Z",
        };

        // Mock the chain to return the user in an array (like real Drizzle ORM)
        drizzleMock.setupSelect([mockUser]);

        const result = await userDb.findByEmail(mockEnv, email);

        expect(db.select).toHaveBeenCalled();
        expect(db.from).toHaveBeenCalled();
        expect(db.where).toHaveBeenCalled();
        expect(db.limit).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockUser);
      });

      it("should return undefined for non-existent user", async () => {
        drizzleMock.setupSelect([]);

        const result = await userDb.findByEmail(
          mockEnv,
          "nonexistent@example.com"
        );

        expect(result).toBeUndefined();
      });
    });

    describe("findById", () => {
      it("should find user by id", async () => {
        const userId = 1;
        const mockUser = {
          id: userId,
          name: "Test User",
          email: "test@example.com",
          householdId: "household-123",
          role: "member",
          admin: 0,
          createdAt: "2023-01-01T00:00:00Z",
        };

        drizzleMock.setupSelect([mockUser]);

        const result = await userDb.findById(mockEnv, userId);

        expect(result).toEqual(mockUser);
      });
    });

    describe("findByHouseholdId", () => {
      it("should find all users in a household", async () => {
        const householdId = "household-123";
        const mockUsers = [
          {
            id: 1,
            name: "User 1",
            email: "user1@example.com",
            householdId,
            role: "admin",
            admin: 0,
            createdAt: "2023-01-01T00:00:00Z",
          },
          {
            id: 2,
            name: "User 2",
            email: "user2@example.com",
            householdId,
            role: "member",
            admin: 0,
            createdAt: "2023-01-01T00:00:00Z",
          },
        ];

        drizzleMock.setupQuery("where", mockUsers);

        const result = await userDb.findByHouseholdId(mockEnv, householdId);

        expect(db.select).toHaveBeenCalled();
        expect(db.from).toHaveBeenCalled();
        expect(db.where).toHaveBeenCalled();
        expect(result).toEqual(mockUsers);
      });
    });
  });

  describe("householdDb", () => {
    describe("generateHouseholdId", () => {
      it("should generate a unique household ID", async () => {
        const id = await householdDb.generateHouseholdId();

        expect(id).toMatch(/^household_[a-z0-9]+_/);
        expect(id.length).toBeGreaterThan(20);
      });
    });

    describe("getMembers", () => {
      it("should get all members of a household", async () => {
        const householdId = "household-123";
        const mockUsers = [
          {
            id: 1,
            name: "User 1",
            email: "user1@example.com",
            householdId,
            role: "admin",
          },
          {
            id: 2,
            name: "User 2",
            email: "user2@example.com",
            householdId,
            role: "member",
          },
        ];

        drizzleMock.setupQuery("where", mockUsers);

        const result = await householdDb.getMembers(mockEnv, householdId);

        expect(result).toEqual(mockUsers);
      });
    });

    describe("getAdmins", () => {
      it("should get admin members of a household", async () => {
        const householdId = "household-123";
        const mockAdmins = [
          {
            id: 1,
            name: "Admin User",
            email: "admin@example.com",
            householdId,
            role: "admin",
          },
        ];

        drizzleMock.setupQuery("where", mockAdmins);

        const result = await householdDb.getAdmins(mockEnv, householdId);

        expect(result).toEqual(mockAdmins);
      });
    });
  });

  describe("authDb", () => {
    describe("authenticateUser", () => {
      // TODO: Fix complex query chaining in database mocks
      it.skip("should authenticate user with correct credentials", async () => {
        const email = "test@example.com";
        const password = "correctpassword";

        const mockUser = {
          id: 1,
          name: "Test User",
          email,
          hashedPassword: "pbkdf2_correctpassword_hashed", // Includes password in hash for mock
          householdId: "household-123",
          role: "member",
          admin: 0,
          createdAt: "2023-01-01T00:00:00Z",
        };

        // Mock the limit method to return the user (userDb.findByEmail uses limit)
        db.limit.mockResolvedValue([mockUser]);

        const result = await authDb.authenticateUser(mockEnv, email, password);

        expect(result).toEqual(mockUser);
      });

      // TODO: Fix complex query chaining in database mocks
      it.skip("should return null for invalid credentials", async () => {
        const email = "test@example.com";
        const password = "wrongpassword";

        const mockUser = {
          id: 1,
          email,
          hashedPassword: "pbkdf2_correctpassword_hashed", // Different password in hash
        };

        drizzleMock.setupSelect([mockUser]);

        const result = await authDb.authenticateUser(mockEnv, email, password);

        expect(result).toBeNull();
      });

      // TODO: Fix complex query chaining in database mocks
      it.skip("should return null for non-existent user", async () => {
        drizzleMock.setupSelect([]);

        const result = await authDb.authenticateUser(
          mockEnv,
          "nonexistent@example.com",
          "password"
        );

        expect(result).toBeNull();
      });
    });
  });
});
