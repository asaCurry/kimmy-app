import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { loader } from "~/routes/insights";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { AnalyticsDB } from "~/lib/analytics-db";
import { AnalyticsService } from "~/lib/analytics-service";
import { canAccessAnalytics, getUserRoleInHousehold } from "~/lib/permissions";
import { analyticsLogger } from "~/lib/logger";
import type { BasicInsights } from "~/lib/analytics-service";

// Mock dependencies
vi.mock("~/lib/db-utils");
vi.mock("~/lib/analytics-db");
vi.mock("~/lib/analytics-service");
vi.mock("~/lib/permissions");
vi.mock("~/lib/logger", () => ({
  analyticsLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock drizzle ORM
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => "mock-eq-condition"),
}));

// Mock react-router
vi.mock("react-router", () => ({
  redirect: vi.fn(
    url => new Response(null, { status: 302, headers: { Location: url } })
  ),
}));

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};

const mockSession = {
  currentHouseholdId: "household-123",
  userId: 1,
  householdIds: ["household-123"],
};

const mockRequest = new Request("http://localhost/insights");
const mockContext = {};

const mockHousehold = {
  id: "household-123",
  name: "Test Household",
  hasAnalyticsAccess: true,
  planType: "premium",
  createdAt: new Date(),
  updatedAt: new Date(),
  inviteCode: "ABC123",
};

const mockInsights: BasicInsights = {
  summary: {
    totalRecords: 100,
    totalMembers: 3,
    activeCategories: ["Health", "Growth", "Education"],
    recordsThisWeek: 15,
    recordsThisMonth: 45,
    mostActiveCategory: "Health",
    mostActiveMember: "Alice",
  },
  categoryInsights: [
    {
      category: "Health",
      count: 40,
      averagePerWeek: 10,
      trend: "increasing",
      recentActivity: 12,
    },
    {
      category: "Growth",
      count: 35,
      averagePerWeek: 8,
      trend: "stable",
      recentActivity: 8,
    },
  ],
  memberInsights: [
    {
      memberId: 1,
      memberName: "Alice",
      recordCount: 50,
      categories: ["Health", "Growth"],
      trend: "increasing",
      lastActivityDays: 1,
    },
    {
      memberId: 2,
      memberName: "Bob",
      recordCount: 30,
      categories: ["Education", "Activities"],
      trend: "stable",
      lastActivityDays: 2,
    },
  ],
  patterns: [
    {
      type: "health",
      title: "Sleep Pattern Improvement",
      description: "Sleep quality has improved consistently",
      confidence: "high",
      metadata: { averageHours: 8.5 },
    },
  ],
  recommendations: [
    {
      id: "rec-1",
      type: "health",
      title: "Continue Sleep Routine",
      description: "Current sleep patterns show positive results",
      priority: "medium",
      status: "active",
      memberId: 1,
      metadata: null,
      createdAt: new Date("2024-01-01"),
    },
  ],
};

const mockDbRecommendations = [
  {
    id: 1,
    type: "health",
    title: "Continue Sleep Routine",
    description: "Current sleep patterns show positive results",
    priority: "medium",
    status: "active",
    memberId: 1,
    metadata: null,
    createdAt: new Date("2024-01-01"),
  },
];

describe("Insights Route Loader", () => {
  let mockAnalyticsDB: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database chain methods
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockResolvedValue([mockHousehold]);

    // Mock AnalyticsDB
    mockAnalyticsDB = {
      getCachedInsights: vi.fn(),
      cacheInsights: vi.fn(),
      saveRecommendations: vi.fn(),
      getRecommendations: vi.fn().mockResolvedValue(mockDbRecommendations),
    };
    (AnalyticsDB as any).mockImplementation(() => mockAnalyticsDB);

    // Mock AnalyticsService
    mockAnalyticsService = {
      generateBasicInsights: vi.fn().mockResolvedValue(mockInsights),
    };
    (AnalyticsService as any).mockImplementation(() => mockAnalyticsService);

    // Mock withDatabaseAndSession
    (withDatabaseAndSession as any).mockImplementation(
      async (request: any, context: any, callback: any) => {
        return callback(mockDb, mockSession);
      }
    );

    // Mock permissions
    (getUserRoleInHousehold as any).mockReturnValue("ADMIN");
    (canAccessAnalytics as any).mockReturnValue({
      canAccess: true,
      reason: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Successful Analytics Loading", () => {
    it("should load cached insights when available", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockAnalyticsDB.getCachedInsights).toHaveBeenCalledWith(
        "household-123",
        "basic_insights"
      );
      expect(mockAnalyticsService.generateBasicInsights).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.hasAccess).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.insights).toEqual({
        ...mockInsights,
        recommendations: mockDbRecommendations,
      });
    });

    it("should generate fresh insights when cache is empty", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockAnalyticsDB.getCachedInsights).toHaveBeenCalledWith(
        "household-123",
        "basic_insights"
      );
      expect(mockAnalyticsService.generateBasicInsights).toHaveBeenCalled();
      expect(mockAnalyticsDB.cacheInsights).toHaveBeenCalledWith(
        "household-123",
        "basic_insights",
        {
          summary: mockInsights.summary,
          categoryInsights: mockInsights.categoryInsights,
          memberInsights: mockInsights.memberInsights,
          patterns: mockInsights.patterns,
        },
        60
      );
      expect(result.success).toBe(true);
      expect(result.cached).toBe(false);
    });

    it("should save recommendations when generating fresh insights", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockAnalyticsDB.saveRecommendations).toHaveBeenCalledWith(
        mockInsights.recommendations
      );
    });

    it("should always fetch fresh recommendations from database", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockAnalyticsDB.getRecommendations).toHaveBeenCalledWith(
        "household-123"
      );
      expect(result.insights.recommendations).toEqual(mockDbRecommendations);
    });

    it("should log analytics loading", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(analyticsLogger.info).toHaveBeenCalledWith("Loading insights", {
        householdId: "household-123",
      });
    });

    it("should transform database recommendations correctly", async () => {
      const mockDbRec = {
        id: 2,
        type: "growth",
        title: "Height Tracking",
        description: "Continue monitoring growth",
        priority: "high",
        status: "active",
        memberId: 1,
        metadata: '{"target": 120}',
        createdAt: new Date("2024-01-02"),
      };

      mockAnalyticsDB.getRecommendations.mockResolvedValue([mockDbRec]);
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(result.insights.recommendations[0]).toEqual({
        id: 2,
        type: "growth",
        title: "Height Tracking",
        description: "Continue monitoring growth",
        priority: "high",
        status: "active",
        memberId: 1,
        metadata: { target: 120 },
        createdAt: mockDbRec.createdAt,
      });
    });
  });

  describe("Access Control", () => {
    it("should return access denied when user lacks analytics permission", async () => {
      (canAccessAnalytics as any).mockReturnValue({
        canAccess: false,
        reason: "Premium feature required",
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(result.success).toBe(false);
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe("Premium feature required");
      expect(result.insights.summary.totalRecords).toBe(0);
      expect(mockAnalyticsService.generateBasicInsights).not.toHaveBeenCalled();
    });

    it("should include household data in access denied response", async () => {
      (canAccessAnalytics as any).mockReturnValue({
        canAccess: false,
        reason: "Premium feature required",
      });

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(result.household).toEqual({
        id: "household-123",
        name: "Test Household",
        hasAnalyticsAccess: true,
      });
    });

    it("should check user role correctly", async () => {
      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(getUserRoleInHousehold).toHaveBeenCalledWith(
        mockSession,
        "household-123"
      );
      expect(canAccessAnalytics).toHaveBeenCalledWith(mockHousehold, "ADMIN");
    });

    it("should handle missing user role gracefully", async () => {
      (getUserRoleInHousehold as any).mockReturnValue(null);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(canAccessAnalytics).toHaveBeenCalledWith(mockHousehold, "MEMBER");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 when household not found", async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(
        loader({
          request: mockRequest,
          context: mockContext,
        } as any)
      ).rejects.toThrow("Household not found");
    });

    it("should handle analytics generation errors gracefully", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);
      mockAnalyticsService.generateBasicInsights.mockRejectedValue(
        new Error("Analytics service error")
      );

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(result.success).toBe(false);
      expect(result.hasAccess).toBe(true);
      expect(result.error).toBe(
        "check back later for your first round of insights"
      );
      expect(analyticsLogger.error).toHaveBeenCalledWith(
        "Error loading insights",
        { error: "Analytics service error" }
      );
    });

    it("should return fallback data structure on error", async () => {
      mockAnalyticsDB.getCachedInsights.mockRejectedValue(
        new Error("Database error")
      );

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(result.success).toBe(false);
      expect(result.hasAccess).toBe(true);
      expect(result.insights).toEqual({
        summary: {
          totalRecords: 0,
          totalMembers: 0,
          activeCategories: [],
          recordsThisWeek: 0,
          recordsThisMonth: 0,
          mostActiveCategory: null,
          mostActiveMember: null,
        },
        categoryInsights: [],
        memberInsights: [],
        patterns: [],
        recommendations: [],
      });
      expect(result.cached).toBe(false);
    });

    it("should handle unknown errors gracefully", async () => {
      mockAnalyticsDB.getCachedInsights.mockRejectedValue("String error");

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(analyticsLogger.error).toHaveBeenCalledWith(
        "Error loading insights",
        { error: "Unknown error" }
      );
    });
  });

  describe("Caching Behavior", () => {
    it("should use correct cache key and TTL", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockAnalyticsDB.getCachedInsights).toHaveBeenCalledWith(
        "household-123",
        "basic_insights"
      );
      expect(mockAnalyticsDB.cacheInsights).toHaveBeenCalledWith(
        "household-123",
        "basic_insights",
        expect.any(Object),
        60
      );
    });

    it("should cache only core insights, not recommendations", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      const cachedData = mockAnalyticsDB.cacheInsights.mock.calls[0][2];
      expect(cachedData).toEqual({
        summary: mockInsights.summary,
        categoryInsights: mockInsights.categoryInsights,
        memberInsights: mockInsights.memberInsights,
        patterns: mockInsights.patterns,
      });
      expect(cachedData).not.toHaveProperty("recommendations");
    });

    it("should log cache usage correctly", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(analyticsLogger.debug).toHaveBeenCalledWith(
        "No cached insights found, generating new ones"
      );
      expect(analyticsLogger.info).toHaveBeenCalledWith(
        "Generated and cached new insights"
      );
    });

    it("should log when using cached data", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(analyticsLogger.debug).toHaveBeenCalledWith(
        "Using cached insights"
      );
    });
  });

  describe("Recommendations Handling", () => {
    it("should skip saving recommendations when none exist", async () => {
      const insightsWithoutRecs = { ...mockInsights, recommendations: [] };
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);
      mockAnalyticsService.generateBasicInsights.mockResolvedValue(
        insightsWithoutRecs
      );

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockAnalyticsDB.saveRecommendations).not.toHaveBeenCalled();
    });

    it("should handle null recommendations", async () => {
      const insightsWithoutRecs = { ...mockInsights, recommendations: null };
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);
      mockAnalyticsService.generateBasicInsights.mockResolvedValue(
        insightsWithoutRecs as any
      );

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockAnalyticsDB.saveRecommendations).not.toHaveBeenCalled();
    });

    it("should handle recommendations with null metadata", async () => {
      const recWithNullMetadata = {
        ...mockDbRecommendations[0],
        metadata: null,
      };
      mockAnalyticsDB.getRecommendations.mockResolvedValue([
        recWithNullMetadata,
      ]);
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(result.insights.recommendations[0].metadata).toBe(null);
    });
  });

  describe("Response Structure", () => {
    it("should return complete success response structure", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("hasAccess", true);
      expect(result).toHaveProperty("household");
      expect(result).toHaveProperty("insights");
      expect(result).toHaveProperty("generatedAt");
      expect(result).toHaveProperty("cached");

      expect(result.household).toEqual({
        id: "household-123",
        name: "Test Household",
        hasAnalyticsAccess: true,
      });
    });

    it("should include current timestamp in generatedAt", async () => {
      const beforeTime = new Date();
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      const result = await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      const afterTime = new Date();
      const generatedTime = new Date(result.generatedAt);

      expect(generatedTime.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(generatedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe("Database Queries", () => {
    it("should query household with correct parameters", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(mockInsights);

      await loader({
        request: mockRequest,
        context: mockContext,
      } as any);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
  });
});
