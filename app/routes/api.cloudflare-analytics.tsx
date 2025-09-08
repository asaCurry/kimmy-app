import type { LoaderFunctionArgs } from "react-router";
import { extractSessionFromCookies } from "~/lib/utils";
import { z } from "zod";

const analyticsQuerySchema = z.object({
  timeRange: z.enum(["1h", "6h", "24h", "7d", "30d"]).default("24h"),
  metric: z
    .enum(["performance", "errors", "cache", "database", "api"])
    .default("performance"),
  householdId: z.string().uuid().optional(),
});

export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    const env = (context as any).cloudflare?.env;
    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    // Extract session from cookies
    const session = extractSessionFromCookies(request.headers.get("cookie"));
    if (!session?.userId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow admin users
    const isAdmin = session.userId === 1; // Assuming admin user has ID 1

    if (!isAdmin) {
      return Response.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const queryParams = analyticsQuerySchema.parse({
      timeRange: url.searchParams.get("timeRange"),
      metric: url.searchParams.get("metric"),
      householdId: url.searchParams.get("householdId"),
    });

    // Calculate time ranges for queries
    const now = new Date();
    const timeRanges = {
      "1h": new Date(now.getTime() - 1 * 60 * 60 * 1000),
      "6h": new Date(now.getTime() - 6 * 60 * 60 * 1000),
      "24h": new Date(now.getTime() - 24 * 60 * 60 * 1000),
      "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };

    const startTime = timeRanges[queryParams.timeRange];

    // Note: In a real implementation, you would query Cloudflare Analytics Engine
    // using GraphQL API or REST API. For now, we'll return mock data structure.

    const mockAnalyticsData = {
      timeRange: queryParams.timeRange,
      metric: queryParams.metric,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      data: generateMockAnalyticsData(
        queryParams.metric,
        queryParams.timeRange
      ),
    };

    return Response.json({
      success: true,
      analytics: mockAnalyticsData,
      note: "This is mock data. In production, this would query Cloudflare Analytics Engine.",
    });
  } catch (error) {
    console.error("Error fetching Cloudflare analytics:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMockAnalyticsData(metric: string, timeRange: string) {
  const dataPoints = getDataPointCount(timeRange);
  const baseData = Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: new Date(
      Date.now() - (dataPoints - i) * getIntervalMs(timeRange)
    ).toISOString(),
  }));

  switch (metric) {
    case "performance":
      return {
        autoCompletionQueries: baseData.map(d => ({
          ...d,
          averageResponseTime: Math.random() * 200 + 50,
          queryCount: Math.floor(Math.random() * 100) + 10,
          cacheHitRate: Math.random() * 0.4 + 0.6,
        })),
        summary: {
          totalQueries: 15420,
          averageResponseTime: 127,
          cacheHitRate: 0.73,
          slowQueries: 23,
        },
      };

    case "errors":
      return {
        errorCounts: baseData.map(d => ({
          ...d,
          totalErrors: Math.floor(Math.random() * 5),
          databaseErrors: Math.floor(Math.random() * 2),
          cacheErrors: Math.floor(Math.random() * 1),
        })),
        summary: {
          totalErrors: 42,
          errorRate: 0.003,
          topErrors: [
            { type: "database_timeout", count: 18 },
            { type: "cache_miss_cascade", count: 12 },
            { type: "validation_error", count: 8 },
          ],
        },
      };

    case "cache":
      return {
        cacheMetrics: baseData.map(d => ({
          ...d,
          memoryHits: Math.floor(Math.random() * 500) + 200,
          memoryMisses: Math.floor(Math.random() * 100) + 50,
          databaseHits: Math.floor(Math.random() * 200) + 100,
          databaseMisses: Math.floor(Math.random() * 50) + 20,
        })),
        summary: {
          overallHitRate: 0.78,
          memoryHitRate: 0.85,
          databaseHitRate: 0.65,
          totalRequests: 8934,
        },
      };

    case "database":
      return {
        queryMetrics: baseData.map(d => ({
          ...d,
          selectQueries: Math.floor(Math.random() * 200) + 100,
          insertQueries: Math.floor(Math.random() * 50) + 10,
          updateQueries: Math.floor(Math.random() * 30) + 5,
          averageQueryTime: Math.random() * 100 + 25,
        })),
        summary: {
          totalQueries: 12456,
          averageQueryTime: 67,
          slowQueries: 34,
          queryDistribution: {
            select: 0.82,
            insert: 0.12,
            update: 0.05,
            delete: 0.01,
          },
        },
      };

    case "api":
      return {
        apiMetrics: baseData.map(d => ({
          ...d,
          totalRequests: Math.floor(Math.random() * 300) + 150,
          successRequests: Math.floor(Math.random() * 280) + 140,
          errorRequests: Math.floor(Math.random() * 20) + 5,
          averageResponseTime: Math.random() * 300 + 100,
        })),
        summary: {
          totalRequests: 23456,
          successRate: 0.97,
          averageResponseTime: 189,
          topEndpoints: [
            { endpoint: "/api/auto-completion", requests: 8932 },
            { endpoint: "/api/tracker-entries", requests: 5421 },
            { endpoint: "/api/family-members", requests: 3456 },
          ],
        },
      };

    default:
      return { message: "Unknown metric type" };
  }
}

function getDataPointCount(timeRange: string): number {
  switch (timeRange) {
    case "1h":
      return 12; // 5-minute intervals
    case "6h":
      return 24; // 15-minute intervals
    case "24h":
      return 24; // 1-hour intervals
    case "7d":
      return 28; // 6-hour intervals
    case "30d":
      return 30; // 1-day intervals
    default:
      return 24;
  }
}

function getIntervalMs(timeRange: string): number {
  switch (timeRange) {
    case "1h":
      return 5 * 60 * 1000; // 5 minutes
    case "6h":
      return 15 * 60 * 1000; // 15 minutes
    case "24h":
      return 60 * 60 * 1000; // 1 hour
    case "7d":
      return 6 * 60 * 60 * 1000; // 6 hours
    case "30d":
      return 24 * 60 * 60 * 1000; // 1 day
    default:
      return 60 * 60 * 1000;
  }
}
