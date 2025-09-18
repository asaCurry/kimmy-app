import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalyticsDB } from "~/lib/analytics-db";
import { DrizzleMock } from "../mocks/drizzle";
import { analyticsCache, aiRecommendations } from "~/db/schema";

// Mock console.log to avoid noise in tests
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("AnalyticsDB", () => {
  let mockDb: DrizzleMock;
  let analyticsDB: AnalyticsDB;
  let householdId: string;

  beforeEach(() => {
    mockDb = new DrizzleMock();
    analyticsDB = new AnalyticsDB(mockDb);
    householdId = "test-household-123";
    consoleSpy.mockClear();
  });

  describe("cacheInsights", () => {
    const cacheKey = "test-cache-key";
    const testData = { insights: ["insight1", "insight2"] };
    const ttlMinutes = 120;

    it("should cache insights successfully", async () => {
      const mockCacheResult = {
        id: 1,
        householdId,
        cacheKey,
        data: JSON.stringify(testData),
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Mock delete operation
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      // Mock insert operation
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCacheResult]),
        }),
      });

      const result = await analyticsDB.cacheInsights(
        householdId,
        cacheKey,
        testData,
        ttlMinutes
      );

      expect(result).toEqual(mockCacheResult);
      expect(mockDb.delete).toHaveBeenCalledWith(analyticsCache);
      expect(mockDb.insert).toHaveBeenCalledWith(analyticsCache);
    });

    it("should delete existing cache before inserting new one", async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({
        where: mockDelete,
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{}]),
        }),
      });

      await analyticsDB.cacheInsights(householdId, cacheKey, testData);

      expect(mockDb.delete).toHaveBeenCalledWith(analyticsCache);
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should use default TTL when not provided", async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const mockInsert = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{}]),
      });
      mockDb.insert.mockReturnValue({
        values: mockInsert,
      });

      await analyticsDB.cacheInsights(householdId, cacheKey, testData);

      const insertCall = mockInsert.mock.calls[0][0];
      const expiresAt = new Date(insertCall.expiresAt);
      const now = new Date();
      const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

      expect(diffMinutes).toBeCloseTo(60, 0); // Default 60 minutes
    });

    it("should calculate expiration time correctly", async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const mockInsert = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{}]),
      });
      mockDb.insert.mockReturnValue({
        values: mockInsert,
      });

      await analyticsDB.cacheInsights(householdId, cacheKey, testData, 30);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall).toHaveProperty("expiresAt");
      expect(typeof insertCall.expiresAt).toBe("string");

      const expiresAt = new Date(insertCall.expiresAt);
      const now = new Date();
      const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

      expect(diffMinutes).toBeCloseTo(30, 0);
    });

    it("should serialize data as JSON", async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const mockInsert = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{}]),
      });
      mockDb.insert.mockReturnValue({
        values: mockInsert,
      });

      const complexData = {
        insights: [
          { type: "growth", data: { metric: "height", value: 120 } },
          { type: "health", data: { status: "good" } },
        ],
        metadata: { total: 2, generated: "2023-01-01" },
      };

      await analyticsDB.cacheInsights(householdId, cacheKey, complexData);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.data).toBe(JSON.stringify(complexData));
      expect(() => JSON.parse(insertCall.data)).not.toThrow();
    });

    it("should log cache operation details", async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{}]),
        }),
      });

      await analyticsDB.cacheInsights(
        householdId,
        cacheKey,
        testData,
        ttlMinutes
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "AnalyticsDB.cacheInsights called with:",
        {
          householdId,
          cacheKey,
          ttlMinutes,
        }
      );
    });
  });

  describe("getCachedInsights", () => {
    const cacheKey = "test-cache-key";

    it("should retrieve cached insights successfully", async () => {
      const cachedData = { insights: ["cached insight"] };
      const mockCacheResult = {
        id: 1,
        householdId,
        cacheKey,
        data: JSON.stringify(cachedData),
        expiresAt: new Date(Date.now() + 60000).toISOString(), // 1 minute in future
        createdAt: new Date().toISOString(),
      };

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockCacheResult]),
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      const result = await analyticsDB.getCachedInsights(householdId, cacheKey);

      expect(result).toEqual(cachedData);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should return null for expired cache", async () => {
      const expiredCacheResult = {
        id: 1,
        householdId,
        cacheKey,
        data: JSON.stringify({ insights: ["expired"] }),
        expiresAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        createdAt: new Date().toISOString(),
      };

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([expiredCacheResult]),
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      const result = await analyticsDB.getCachedInsights(householdId, cacheKey);

      expect(result).toBeNull();
    });

    it("should return null when no cache entry exists", async () => {
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]), // No results
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      const result = await analyticsDB.getCachedInsights(householdId, cacheKey);

      expect(result).toBeNull();
    });

    it("should handle JSON parsing errors gracefully", async () => {
      const invalidCacheResult = {
        id: 1,
        householdId,
        cacheKey,
        data: "invalid json {", // Invalid JSON
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([invalidCacheResult]),
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      const result = await analyticsDB.getCachedInsights(householdId, cacheKey);

      expect(result).toBeNull();
    });

    it("should delete expired cache entries", async () => {
      const expiredCacheResult = {
        id: 1,
        householdId,
        cacheKey,
        data: JSON.stringify({ insights: ["expired"] }),
        expiresAt: new Date(Date.now() - 60000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([expiredCacheResult]),
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({
        where: mockDeleteWhere,
      });

      await analyticsDB.getCachedInsights(householdId, cacheKey);

      expect(mockDb.delete).toHaveBeenCalledWith(analyticsCache);
      expect(mockDeleteWhere).toHaveBeenCalled();
    });
  });

  describe("storeAIRecommendation", () => {
    const recommendation = {
      type: "health",
      title: "Increase Water Intake",
      description: "Based on your activity, consider drinking more water",
      priority: "medium" as const,
      data: { currentIntake: 4, recommendedIntake: 8 },
    };

    it("should store AI recommendation successfully", async () => {
      const mockResult = {
        id: 1,
        householdId,
        ...recommendation,
        data: JSON.stringify(recommendation.data),
        createdAt: new Date().toISOString(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockResult]),
        }),
      });

      const result = await analyticsDB.storeAIRecommendation(
        householdId,
        recommendation
      );

      expect(result).toEqual(mockResult);
      expect(mockDb.insert).toHaveBeenCalledWith(aiRecommendations);
    });

    it("should serialize recommendation data as JSON", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{}]),
      });
      mockDb.insert.mockReturnValue({
        values: mockInsert,
      });

      await analyticsDB.storeAIRecommendation(householdId, recommendation);

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.data).toBe(JSON.stringify(recommendation.data));
      expect(insertCall.householdId).toBe(householdId);
      expect(insertCall.type).toBe(recommendation.type);
    });
  });

  describe("getAIRecommendations", () => {
    it("should retrieve AI recommendations for household", async () => {
      const mockRecommendations = [
        {
          id: 1,
          householdId,
          type: "health",
          title: "Rec 1",
          description: "Description 1",
          priority: "high",
          data: JSON.stringify({ value: 1 }),
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          householdId,
          type: "growth",
          title: "Rec 2",
          description: "Description 2",
          priority: "medium",
          data: JSON.stringify({ value: 2 }),
          createdAt: new Date().toISOString(),
        },
      ];

      const mockWhere = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(mockRecommendations),
        }),
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      const result = await analyticsDB.getAIRecommendations(householdId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockRecommendations[0]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should limit results when limit parameter is provided", async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockOrderBy = vi.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockWhere = vi.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      await analyticsDB.getAIRecommendations(householdId, 5);

      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it("should use default limit when not provided", async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockOrderBy = vi.fn().mockReturnValue({
        limit: mockLimit,
      });
      const mockWhere = vi.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      });

      await analyticsDB.getAIRecommendations(householdId);

      expect(mockLimit).toHaveBeenCalledWith(10); // Default limit
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors in cacheInsights", async () => {
      mockDb.delete.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await expect(
        analyticsDB.cacheInsights(householdId, "test-key", {})
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle database errors in getCachedInsights", async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error("Query failed");
      });

      await expect(
        analyticsDB.getCachedInsights(householdId, "test-key")
      ).rejects.toThrow("Query failed");
    });

    it("should handle database errors in storeAIRecommendation", async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error("Insert failed");
      });

      const recommendation = {
        type: "health" as const,
        title: "Test",
        description: "Test",
        priority: "low" as const,
        data: {},
      };

      await expect(
        analyticsDB.storeAIRecommendation(householdId, recommendation)
      ).rejects.toThrow("Insert failed");
    });
  });
});
