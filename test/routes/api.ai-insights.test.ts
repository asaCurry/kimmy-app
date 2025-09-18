import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from "vitest";
import { loader, action } from "~/routes/api.ai-insights";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { AIAnalyticsService } from "~/lib/ai-analytics-service";
import { AnalyticsDB } from "~/lib/analytics-db";
import { analyticsLogger } from "~/lib/logger";
import { getValidatedEnv } from "~/lib/env.server";

// Mock dependencies
vi.mock("~/lib/db-utils");
vi.mock("~/lib/ai-analytics-service");
vi.mock("~/lib/analytics-db");
vi.mock("~/lib/logger", () => ({
  analyticsLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));
vi.mock("~/lib/env.server");

const mockWithDatabaseAndSession = withDatabaseAndSession as MockedFunction<
  typeof withDatabaseAndSession
>;
const mockGetValidatedEnv = getValidatedEnv as MockedFunction<
  typeof getValidatedEnv
>;

const mockAIInsights = [
  {
    id: "insight-1",
    type: "growth",
    category: "Physical Development",
    title: "Growth Pattern Analysis",
    description: "Child shows steady growth progression",
    confidence: "high",
    importance: "medium",
    data: {
      trend: "increasing",
      timeframe: "4 weeks",
      dataPoints: 10,
    },
    recommendations: ["Continue current nutrition plan"],
    createdAt: new Date("2024-01-01"),
  },
];

const mockSession = {
  userId: "user-1",
  currentHouseholdId: "household-1",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
};

const mockDb = {};
const mockContext = {
  cloudflare: {
    env: {
      AI: { run: vi.fn() },
      DB: mockDb,
    },
  },
};

describe("/api/ai-insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetValidatedEnv.mockReturnValue({
      AI: { run: vi.fn() },
      DB: mockDb,
    } as any);
  });

  describe("loader", () => {
    it("should generate and return AI insights successfully", async () => {
      const mockAIService = {
        generateAdvancedInsights: vi.fn().mockResolvedValue(mockAIInsights),
      };
      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(null),
        cacheInsights: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(AIAnalyticsService).mockImplementation(
        () => mockAIService as any
      );
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request(
        "http://localhost/api/ai-insights?timeRange=30&category=all"
      );

      const response = await loader({ request, context: mockContext });

      expect(response).toBeInstanceOf(Response);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.insights).toEqual(mockAIInsights);
      expect(responseData.cached).toBe(false);

      expect(analyticsLogger.info).toHaveBeenCalledWith("Loading insights", {
        householdId: "household-1",
        timeRange: "30",
        category: "all",
      });
    });

    it("should return cached insights when available", async () => {
      const cachedInsights = {
        insights: mockAIInsights,
        metadata: {
          totalGenerated: 1,
          filtered: 1,
          category: "all",
          timeRange: "30",
          generatedAt: new Date().toISOString(),
        },
      };

      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(cachedInsights),
      };

      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request(
        "http://localhost/api/ai-insights?timeRange=30"
      );

      const response = await loader({ request, context: mockContext });
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.insights).toEqual(mockAIInsights);
      expect(responseData.cached).toBe(true);

      expect(analyticsLogger.info).toHaveBeenCalledWith(
        "Using cached AI insights"
      );
    });

    it("should filter insights by category", async () => {
      const allInsights = [
        mockAIInsights[0],
        {
          ...mockAIInsights[0],
          id: "insight-2",
          type: "health",
          category: "Health Analysis",
        },
      ];

      const mockAIService = {
        generateAdvancedInsights: vi.fn().mockResolvedValue(allInsights),
      };
      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(null),
        cacheInsights: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(AIAnalyticsService).mockImplementation(
        () => mockAIService as any
      );
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request(
        "http://localhost/api/ai-insights?category=growth"
      );

      const response = await loader({ request, context: mockContext });
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.insights).toHaveLength(1);
      expect(responseData.insights[0].type).toBe("growth");
      expect(responseData.metadata.totalGenerated).toBe(2);
      expect(responseData.metadata.filtered).toBe(1);
    });

    it("should handle AI service errors gracefully", async () => {
      const mockAIService = {
        generateAdvancedInsights: vi
          .fn()
          .mockRejectedValue(new Error("AI service error")),
      };
      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(AIAnalyticsService).mockImplementation(
        () => mockAIService as any
      );
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request("http://localhost/api/ai-insights");

      const response = await loader({ request, context: mockContext });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Failed to generate AI insights");
      expect(responseData.insights).toEqual([]);

      expect(analyticsLogger.error).toHaveBeenCalledWith(
        "Error generating AI insights",
        { error: "AI service error" }
      );
    });

    it("should use default parameters when not provided", async () => {
      const mockAIService = {
        generateAdvancedInsights: vi.fn().mockResolvedValue([]),
      };
      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(null),
        cacheInsights: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(AIAnalyticsService).mockImplementation(
        () => mockAIService as any
      );
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request("http://localhost/api/ai-insights");

      await loader({ request, context: mockContext });

      expect(analyticsLogger.info).toHaveBeenCalledWith("Loading insights", {
        householdId: "household-1",
        timeRange: "30", // default
        category: "all", // default
      });
    });

    it("should cache newly generated insights", async () => {
      const mockAIService = {
        generateAdvancedInsights: vi.fn().mockResolvedValue(mockAIInsights),
      };
      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(null),
        cacheInsights: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(AIAnalyticsService).mockImplementation(
        () => mockAIService as any
      );
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request(
        "http://localhost/api/ai-insights?timeRange=90&category=health"
      );

      await loader({ request, context: mockContext });

      expect(mockAnalyticsDB.cacheInsights).toHaveBeenCalledWith(
        "household-1",
        "ai_insights_health_90",
        expect.objectContaining({
          insights: mockAIInsights,
          metadata: expect.objectContaining({
            category: "health",
            timeRange: "90",
          }),
        }),
        120 // 2 hours TTL
      );
    });
  });

  describe("action", () => {
    it("should handle dismiss action", async () => {
      const mockAnalyticsDB = {};
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const formData = new FormData();
      formData.append("action", "dismiss");
      formData.append("insightId", "insight-123");

      const request = new Request("http://localhost/api/ai-insights", {
        method: "POST",
        body: formData,
      });

      const response = await action({ request, context: mockContext });
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Insight dismissed");

      expect(analyticsLogger.info).toHaveBeenCalledWith("Insight dismissed", {
        insightId: "insight-123",
      });
    });

    it("should handle mark_complete action", async () => {
      const mockAnalyticsDB = {};
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const formData = new FormData();
      formData.append("action", "mark_complete");
      formData.append("insightId", "insight-456");

      const request = new Request("http://localhost/api/ai-insights", {
        method: "POST",
        body: formData,
      });

      const response = await action({ request, context: mockContext });
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe("Insight marked as complete");

      expect(analyticsLogger.info).toHaveBeenCalledWith(
        "Insight marked complete",
        { insightId: "insight-456" }
      );
    });

    it("should handle regenerate action", async () => {
      const mockAnalyticsDB = {};
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const formData = new FormData();
      formData.append("action", "regenerate");

      const request = new Request("http://localhost/api/ai-insights", {
        method: "POST",
        body: formData,
      });

      const response = await action({ request, context: mockContext });
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe(
        "Insights will be regenerated on next request"
      );

      expect(analyticsLogger.info).toHaveBeenCalledWith(
        "Regenerating AI insights",
        { householdId: "household-1" }
      );
    });

    it("should handle unknown actions", async () => {
      const mockAnalyticsDB = {};
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const formData = new FormData();
      formData.append("action", "unknown_action");

      const request = new Request("http://localhost/api/ai-insights", {
        method: "POST",
        body: formData,
      });

      const response = await action({ request, context: mockContext });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Unknown action");
    });

    it("should handle action processing errors", async () => {
      const mockAnalyticsDB = {};
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          throw new Error("Database connection failed");
        }
      );

      const formData = new FormData();
      formData.append("action", "dismiss");
      formData.append("insightId", "test-insight");

      const request = new Request("http://localhost/api/ai-insights", {
        method: "POST",
        body: formData,
      });

      const response = await action({ request, context: mockContext });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Failed to process action");

      expect(analyticsLogger.error).toHaveBeenCalledWith(
        "Error processing AI insight action",
        expect.objectContaining({
          action: "dismiss",
          insightId: "test-insight",
          error: "Database connection failed",
        })
      );
    });

    it("should handle missing form data gracefully", async () => {
      const mockAnalyticsDB = {};
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const formData = new FormData();
      // No action or insightId provided

      const request = new Request("http://localhost/api/ai-insights", {
        method: "POST",
        body: formData,
      });

      const response = await action({ request, context: mockContext });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Unknown action");
    });
  });

  describe("error handling", () => {
    it("should handle session validation failures", async () => {
      mockWithDatabaseAndSession.mockRejectedValue(
        new Error("Invalid session")
      );

      const request = new Request("http://localhost/api/ai-insights");

      expect(async () => {
        await loader({ request, context: mockContext });
      }).rejects.toThrow("Invalid session");
    });

    it("should handle environment validation failures", async () => {
      mockGetValidatedEnv.mockImplementation(() => {
        throw new Error("Environment validation failed");
      });

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request("http://localhost/api/ai-insights");

      expect(async () => {
        await loader({ request, context: mockContext });
      }).rejects.toThrow("Environment validation failed");
    });

    it("should handle caching failures gracefully", async () => {
      const mockAIService = {
        generateAdvancedInsights: vi.fn().mockResolvedValue(mockAIInsights),
      };
      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(null),
        cacheInsights: vi
          .fn()
          .mockRejectedValue(new Error("Cache write failed")),
      };

      vi.mocked(AIAnalyticsService).mockImplementation(
        () => mockAIService as any
      );
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request("http://localhost/api/ai-insights");

      const response = await loader({ request, context: mockContext });
      const responseData = await response.json();

      // Should still return insights even if caching fails
      expect(responseData.success).toBe(true);
      expect(responseData.insights).toEqual(mockAIInsights);
    });
  });

  describe("query parameter handling", () => {
    it("should handle special characters in query parameters", async () => {
      const mockAIService = {
        generateAdvancedInsights: vi.fn().mockResolvedValue([]),
      };
      const mockAnalyticsDB = {
        getCachedInsights: vi.fn().mockResolvedValue(null),
        cacheInsights: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(AIAnalyticsService).mockImplementation(
        () => mockAIService as any
      );
      vi.mocked(AnalyticsDB).mockImplementation(() => mockAnalyticsDB as any);

      mockWithDatabaseAndSession.mockImplementation(
        async (request, context, callback) => {
          return await callback(mockDb, mockSession);
        }
      );

      const request = new Request(
        "http://localhost/api/ai-insights?category=health%20&%20wellness&timeRange=30"
      );

      await loader({ request, context: mockContext });

      expect(analyticsLogger.info).toHaveBeenCalledWith("Loading insights", {
        householdId: "household-1",
        timeRange: "30",
        category: "health & wellness",
      });
    });
  });
});
