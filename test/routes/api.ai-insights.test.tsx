import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { loader, action } from "~/routes/api.ai-insights";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { AIAnalyticsService } from "~/lib/ai-analytics-service";
import { AnalyticsDB } from "~/lib/analytics-db";
import { getValidatedEnv } from "~/lib/env.server";
import { analyticsLogger } from "~/lib/logger";
import type { AIInsight } from "~/lib/ai-analytics-service";

// Mock dependencies
vi.mock("~/lib/db-utils");
vi.mock("~/lib/ai-analytics-service");
vi.mock("~/lib/analytics-db");
vi.mock("~/lib/env.server");
vi.mock("~/lib/logger", () => ({
  analyticsLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
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

const mockAIInsights: AIInsight[] = [
  {
    id: "insight-1",
    type: "growth",
    category: "Physical Development",
    title: "Growth Acceleration",
    description: "Child's growth rate has increased",
    confidence: "high",
    importance: "medium",
    data: {
      trend: "increasing",
      timeframe: "4 weeks",
      dataPoints: 8,
      correlations: [],
    },
    recommendations: ["Continue nutrition plan"],
    chartData: [
      { date: "2024-01-01", value: 120 },
      { date: "2024-01-02", value: 121 },
    ],
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "insight-2",
    type: "health",
    category: "Sleep Health",
    title: "Sleep Quality Improvement",
    description: "Sleep patterns have improved",
    confidence: "medium",
    importance: "high",
    data: {
      trend: "stable",
      timeframe: "2 weeks",
      dataPoints: 14,
      correlations: [],
    },
    recommendations: ["Maintain schedule"],
    chartData: [],
    createdAt: new Date("2024-01-02"),
  },
];

const mockEnv = {
  AI: {
    run: vi.fn(),
  },
};

describe("AI Insights API Route", () => {
  let mockAnalyticsDB: any;
  let mockAIAnalyticsService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AnalyticsDB
    mockAnalyticsDB = {
      getCachedInsights: vi.fn(),
      cacheInsights: vi.fn(),
    };
    (AnalyticsDB as any).mockImplementation(() => mockAnalyticsDB);

    // Mock AIAnalyticsService
    mockAIAnalyticsService = {
      generateAdvancedInsights: vi.fn().mockResolvedValue(mockAIInsights),
    };
    (AIAnalyticsService as any).mockImplementation(
      () => mockAIAnalyticsService
    );

    // Mock withDatabaseAndSession
    (withDatabaseAndSession as any).mockImplementation(
      async (request: any, context: any, callback: any) => {
        return callback(mockDb, mockSession);
      }
    );

    // Mock getValidatedEnv
    (getValidatedEnv as any).mockReturnValue(mockEnv);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Loader Function", () => {
    describe("Successful Operations", () => {
      it("should return cached insights when available", async () => {
        const cachedData = {
          insights: mockAIInsights,
          metadata: {
            totalGenerated: 2,
            filtered: 2,
            category: "all",
            timeRange: "30",
            generatedAt: new Date().toISOString(),
          },
        };

        mockAnalyticsDB.getCachedInsights.mockResolvedValue(cachedData);

        const request = new Request(
          "http://localhost/api/ai-insights?timeRange=30&category=all"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(mockAnalyticsDB.getCachedInsights).toHaveBeenCalledWith(
          "household-123",
          "ai_insights_all_30"
        );
        expect(
          mockAIAnalyticsService.generateAdvancedInsights
        ).not.toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.cached).toBe(true);
        expect(result.insights).toEqual(mockAIInsights);
      });

      it("should generate fresh insights when cache is empty", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        const request = new Request(
          "http://localhost/api/ai-insights?timeRange=30&category=all"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(mockAnalyticsDB.getCachedInsights).toHaveBeenCalled();
        expect(
          mockAIAnalyticsService.generateAdvancedInsights
        ).toHaveBeenCalled();
        expect(mockAnalyticsDB.cacheInsights).toHaveBeenCalledWith(
          "household-123",
          "ai_insights_all_30",
          expect.objectContaining({
            insights: mockAIInsights,
            metadata: expect.any(Object),
          }),
          120
        );
        expect(result.success).toBe(true);
        expect(result.cached).toBe(false);
        expect(result.insights).toEqual(mockAIInsights);
      });

      it("should filter insights by category when specified", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        const request = new Request(
          "http://localhost/api/ai-insights?timeRange=30&category=health"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(result.insights).toHaveLength(1);
        expect(result.insights[0].type).toBe("health");
        expect(result.metadata.totalGenerated).toBe(2);
        expect(result.metadata.filtered).toBe(1);
      });

      it("should use default parameters when not provided", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        const request = new Request("http://localhost/api/ai-insights");
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(mockAnalyticsDB.getCachedInsights).toHaveBeenCalledWith(
          "household-123",
          "ai_insights_all_30"
        );
        expect(result.metadata.timeRange).toBe("30");
        expect(result.metadata.category).toBe("all");
      });

      it("should log analytics operations correctly", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        const request = new Request(
          "http://localhost/api/ai-insights?timeRange=7&category=growth"
        );
        await loader({ request, context: {} } as any);

        expect(analyticsLogger.info).toHaveBeenCalledWith(
          "Generating AI insights",
          {
            householdId: "household-123",
            timeRange: "7",
            category: "growth",
          }
        );
        expect(analyticsLogger.info).toHaveBeenCalledWith(
          "No cached AI insights found, generating new ones"
        );
        expect(analyticsLogger.info).toHaveBeenCalledWith(
          "Generated 1 AI insights"
        );
      });

      it("should log when using cached insights", async () => {
        const cachedData = {
          insights: mockAIInsights,
          metadata: {
            totalGenerated: 2,
            filtered: 2,
            category: "all",
            timeRange: "30",
            generatedAt: new Date().toISOString(),
          },
        };

        mockAnalyticsDB.getCachedInsights.mockResolvedValue(cachedData);

        const request = new Request("http://localhost/api/ai-insights");
        await loader({ request, context: {} } as any);

        expect(analyticsLogger.info).toHaveBeenCalledWith(
          "Using cached AI insights"
        );
      });
    });

    describe("AI Binding Handling", () => {
      it("should return mock response when AI binding is not available", async () => {
        (getValidatedEnv as any).mockReturnValue({ AI: null });

        const request = new Request(
          "http://localhost/api/ai-insights?timeRange=7&category=health"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(analyticsLogger.warn).toHaveBeenCalledWith(
          "AI binding not available, returning mock insights"
        );
        expect(result.success).toBe(true);
        expect(result.insights).toEqual([]);
        expect(result.metadata.note).toContain(
          "AI insights require Cloudflare AI binding"
        );
        expect(result.cached).toBe(false);
      });

      it("should include proper metadata when AI binding is unavailable", async () => {
        (getValidatedEnv as any).mockReturnValue({ AI: undefined });

        const request = new Request(
          "http://localhost/api/ai-insights?timeRange=90&category=behavior"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(result.metadata).toEqual({
          totalGenerated: 0,
          filtered: 0,
          category: "behavior",
          timeRange: "90",
          generatedAt: expect.any(String),
          note: "AI insights require Cloudflare AI binding configuration",
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle AIAnalyticsService errors gracefully", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);
        mockAIAnalyticsService.generateAdvancedInsights.mockRejectedValue(
          new Error("AI service error")
        );

        const request = new Request("http://localhost/api/ai-insights");
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(analyticsLogger.error).toHaveBeenCalledWith(
          "Error generating AI insights",
          { error: "AI service error" }
        );
        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to generate AI insights");
        expect(result.insights).toEqual([]);
      });

      it("should handle database errors during caching", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);
        mockAnalyticsDB.cacheInsights.mockRejectedValue(
          new Error("Database error")
        );

        const request = new Request("http://localhost/api/ai-insights");
        const response = await loader({ request, context: {} } as any);

        expect(response.status).toBe(500);
        expect(analyticsLogger.error).toHaveBeenCalledWith(
          "Error generating AI insights",
          { error: "Database error" }
        );
      });

      it("should handle unknown errors appropriately", async () => {
        mockAnalyticsDB.getCachedInsights.mockRejectedValue("String error");

        const request = new Request("http://localhost/api/ai-insights");
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(analyticsLogger.error).toHaveBeenCalledWith(
          "Error generating AI insights",
          { error: "Unknown error" }
        );
        expect(result.success).toBe(false);
      });
    });

    describe("Category Filtering", () => {
      it("should filter insights by exact type match", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        const request = new Request(
          "http://localhost/api/ai-insights?category=growth"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(result.insights).toHaveLength(1);
        expect(result.insights[0].type).toBe("growth");
      });

      it("should filter insights by category name containing search term", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        const request = new Request(
          "http://localhost/api/ai-insights?category=sleep"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(result.insights).toHaveLength(1);
        expect(result.insights[0].category).toBe("Sleep Health");
      });

      it("should return empty array when no insights match category filter", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        const request = new Request(
          "http://localhost/api/ai-insights?category=nonexistent"
        );
        const response = await loader({ request, context: {} } as any);
        const result = await response.json();

        expect(result.insights).toHaveLength(0);
        expect(result.metadata.totalGenerated).toBe(2);
        expect(result.metadata.filtered).toBe(0);
      });
    });

    describe("Cache Key Generation", () => {
      it("should generate correct cache keys for different parameters", async () => {
        mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

        // Test different parameter combinations
        const testCases = [
          {
            timeRange: "7",
            category: "health",
            expectedKey: "ai_insights_health_7",
          },
          {
            timeRange: "90",
            category: "all",
            expectedKey: "ai_insights_all_90",
          },
          {
            timeRange: "30",
            category: "behavior",
            expectedKey: "ai_insights_behavior_30",
          },
        ];

        for (const testCase of testCases) {
          const request = new Request(
            `http://localhost/api/ai-insights?timeRange=${testCase.timeRange}&category=${testCase.category}`
          );
          await loader({ request, context: {} } as any);

          expect(mockAnalyticsDB.getCachedInsights).toHaveBeenCalledWith(
            "household-123",
            testCase.expectedKey
          );
        }
      });
    });
  });

  describe("Action Function", () => {
    beforeEach(() => {
      // Reset AnalyticsDB mock for action tests
      mockAnalyticsDB = {
        getCachedInsights: vi.fn(),
        cacheInsights: vi.fn(),
      };
      (AnalyticsDB as any).mockImplementation(() => mockAnalyticsDB);
    });

    describe("Dismiss Action", () => {
      it("should handle dismiss action successfully", async () => {
        const formData = new FormData();
        formData.append("action", "dismiss");
        formData.append("insightId", "insight-123");

        const request = new Request("http://localhost/api/ai-insights", {
          method: "POST",
          body: formData,
        });

        const response = await action({ request, context: {} } as any);
        const result = await response.json();

        expect(analyticsLogger.info).toHaveBeenCalledWith("Insight dismissed", {
          insightId: "insight-123",
        });
        expect(result.success).toBe(true);
        expect(result.message).toBe("Insight dismissed");
      });
    });

    describe("Mark Complete Action", () => {
      it("should handle mark complete action successfully", async () => {
        const formData = new FormData();
        formData.append("action", "mark_complete");
        formData.append("insightId", "insight-456");

        const request = new Request("http://localhost/api/ai-insights", {
          method: "POST",
          body: formData,
        });

        const response = await action({ request, context: {} } as any);
        const result = await response.json();

        expect(analyticsLogger.info).toHaveBeenCalledWith(
          "Insight marked complete",
          {
            insightId: "insight-456",
          }
        );
        expect(result.success).toBe(true);
        expect(result.message).toBe("Insight marked as complete");
      });
    });

    describe("Regenerate Action", () => {
      it("should handle regenerate action successfully", async () => {
        const formData = new FormData();
        formData.append("action", "regenerate");
        formData.append("insightId", "any-id");

        const request = new Request("http://localhost/api/ai-insights", {
          method: "POST",
          body: formData,
        });

        const response = await action({ request, context: {} } as any);
        const result = await response.json();

        expect(analyticsLogger.info).toHaveBeenCalledWith(
          "Regenerating AI insights",
          {
            householdId: "household-123",
          }
        );
        expect(result.success).toBe(true);
        expect(result.message).toBe(
          "Insights will be regenerated on next request"
        );
      });
    });

    describe("Unknown Action", () => {
      it("should return error for unknown action", async () => {
        const formData = new FormData();
        formData.append("action", "unknown_action");
        formData.append("insightId", "any-id");

        const request = new Request("http://localhost/api/ai-insights", {
          method: "POST",
          body: formData,
        });

        const response = await action({ request, context: {} } as any);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Unknown action");
      });
    });

    describe("Action Error Handling", () => {
      it("should handle form data parsing errors", async () => {
        // Mock formData to throw an error
        const request = {
          formData: vi.fn().mockRejectedValue(new Error("Form data error")),
        };

        (withDatabaseAndSession as any).mockImplementation(
          async (req: any, context: any, callback: any) => {
            return callback(mockDb, mockSession);
          }
        );

        const response = await action({ request, context: {} } as any);
        const result = await response.json();

        expect(analyticsLogger.error).toHaveBeenCalledWith(
          "Error processing AI insight action",
          expect.objectContaining({
            error: "Form data error",
          })
        );
        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to process action");
      });

      it("should handle unknown errors in action processing", async () => {
        (withDatabaseAndSession as any).mockRejectedValue("String error");

        const formData = new FormData();
        formData.append("action", "dismiss");
        formData.append("insightId", "test-id");

        const request = new Request("http://localhost/api/ai-insights", {
          method: "POST",
          body: formData,
        });

        const response = await action({ request, context: {} } as any);

        expect(response.status).toBe(500);
      });
    });

    describe("Action Logging", () => {
      it("should log all action parameters correctly", async () => {
        const formData = new FormData();
        formData.append("action", "dismiss");
        formData.append("insightId", "test-insight-id");

        const request = new Request("http://localhost/api/ai-insights", {
          method: "POST",
          body: formData,
        });

        await action({ request, context: {} } as any);

        expect(analyticsLogger.info).toHaveBeenCalledWith("Insight dismissed", {
          insightId: "test-insight-id",
        });
      });
    });
  });

  describe("Response Format", () => {
    it("should return properly formatted success response", async () => {
      mockAnalyticsDB.getCachedInsights.mockResolvedValue(null);

      const request = new Request("http://localhost/api/ai-insights");
      const response = await loader({ request, context: {} } as any);
      const result = await response.json();

      expect(result).toMatchObject({
        success: true,
        insights: expect.any(Array),
        metadata: {
          totalGenerated: expect.any(Number),
          filtered: expect.any(Number),
          category: expect.any(String),
          timeRange: expect.any(String),
          generatedAt: expect.any(String),
        },
        cached: expect.any(Boolean),
      });
    });

    it("should return properly formatted error response", async () => {
      mockAnalyticsDB.getCachedInsights.mockRejectedValue(
        new Error("Test error")
      );

      const request = new Request("http://localhost/api/ai-insights");
      const response = await loader({ request, context: {} } as any);
      const result = await response.json();

      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        insights: [],
        metadata: {
          totalGenerated: 0,
          filtered: 0,
          category: expect.any(String),
          timeRange: expect.any(String),
          generatedAt: expect.any(String),
        },
        cached: false,
      });
    });
  });
});
