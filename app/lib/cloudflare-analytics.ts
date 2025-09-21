interface CloudflareEnv {
  ANALYTICS?: AnalyticsEngineDataset;
  DB?: D1Database;
}

interface DatabaseQueryMetrics {
  queryType: "select" | "insert" | "update" | "delete";
  table: string;
  duration: number;
  rowsAffected?: number;
  success: boolean;
}

interface AutoCompletionMetrics {
  suggestionType: "field" | "title" | "tag" | "smart_defaults";
  cacheHit: boolean;
  resultCount: number;
  queryDuration: number;
  processingDuration: number;
}

export class CloudflareAnalytics {
  constructor(private env: CloudflareEnv) {}

  /**
   * Track auto-completion performance metrics
   */
  trackAutoCompletion(
    metrics: AutoCompletionMetrics & {
      householdId?: string;
      userId?: string;
    }
  ): void {
    if (!this.env.ANALYTICS) {
      console.warn("Analytics Engine not available");
      return;
    }

    try {
      this.env.ANALYTICS.writeDataPoint({
        blobs: [
          metrics.suggestionType,
          metrics.householdId || "unknown",
          metrics.userId || "unknown",
        ],
        doubles: [
          metrics.queryDuration,
          metrics.processingDuration,
          metrics.resultCount,
        ],
        indexes: [
          metrics.cacheHit ? "cache_hit" : "cache_miss",
          metrics.suggestionType,
        ],
      });
    } catch (error) {
      console.error("Failed to track auto-completion metrics:", error);
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(
    metrics: DatabaseQueryMetrics & {
      householdId?: string;
      operation?: string;
    }
  ): void {
    if (!this.env.ANALYTICS) {
      console.warn("Analytics Engine not available");
      return;
    }

    try {
      this.env.ANALYTICS.writeDataPoint({
        blobs: [
          `db_${metrics.queryType}`,
          metrics.table,
          metrics.operation || "unknown",
          metrics.householdId || "unknown",
        ],
        doubles: [metrics.duration, metrics.rowsAffected || 0],
        indexes: [
          metrics.success ? "success" : "error",
          `table_${metrics.table}`,
          `query_${metrics.queryType}`,
        ],
      });
    } catch (error) {
      console.error("Failed to track database query metrics:", error);
    }
  }

  /**
   * Track API endpoint performance
   */
  trackApiPerformance(metrics: {
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    userId?: string;
    householdId?: string;
    userAgent?: string;
    country?: string;
  }): void {
    if (!this.env.ANALYTICS) {
      console.warn("Analytics Engine not available");
      return;
    }

    try {
      this.env.ANALYTICS.writeDataPoint({
        blobs: [
          `api_${metrics.endpoint.replace(/[^\w]/g, "_")}`,
          metrics.method,
          metrics.userId || "anonymous",
          metrics.householdId || "unknown",
          metrics.country || "unknown",
        ],
        doubles: [metrics.duration, metrics.statusCode],
        indexes: [
          metrics.statusCode < 400 ? "success" : "error",
          `method_${metrics.method}`,
          `status_${Math.floor(metrics.statusCode / 100)}xx`,
        ],
      });
    } catch (error) {
      console.error("Failed to track API performance metrics:", error);
    }
  }

  /**
   * Track user engagement metrics
   */
  trackUserEngagement(metrics: {
    action: string;
    userId?: string;
    householdId?: string;
    sessionId?: string;
    feature?: string;
    value?: number;
  }): void {
    if (!this.env.ANALYTICS) {
      console.warn("Analytics Engine not available");
      return;
    }

    try {
      this.env.ANALYTICS.writeDataPoint({
        blobs: [
          `engagement_${metrics.action}`,
          metrics.userId || "anonymous",
          metrics.householdId || "unknown",
          metrics.feature || "unknown",
          metrics.sessionId || "unknown",
        ],
        doubles: [metrics.value || 1, Date.now()],
        indexes: [metrics.action, metrics.feature || "unknown"],
      });
    } catch (error) {
      console.error("Failed to track user engagement metrics:", error);
    }
  }

  /**
   * Track error events
   */
  trackError(error: {
    type: string;
    message: string;
    stack?: string;
    userId?: string;
    householdId?: string;
    context?: string;
  }): void {
    if (!this.env.ANALYTICS) {
      console.warn("Analytics Engine not available");
      return;
    }

    try {
      this.env.ANALYTICS.writeDataPoint({
        blobs: [
          `error_${error.type}`,
          error.message.substring(0, 100), // Limit message length
          error.userId || "anonymous",
          error.householdId || "unknown",
          error.context || "unknown",
        ],
        doubles: [Date.now(), error.stack ? error.stack.length : 0],
        indexes: ["error", error.type, error.context || "unknown"],
      });
    } catch (analyticsError) {
      console.error("Failed to track error metrics:", analyticsError);
    }
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(metrics: {
    operation: "hit" | "miss" | "set" | "invalidate";
    cacheType: "memory" | "database";
    key: string;
    duration?: number;
    householdId?: string;
  }): void {
    if (!this.env.ANALYTICS) {
      console.warn("Analytics Engine not available");
      return;
    }

    try {
      this.env.ANALYTICS.writeDataPoint({
        blobs: [
          `cache_${metrics.operation}`,
          metrics.cacheType,
          metrics.key.substring(0, 50), // Limit key length
          metrics.householdId || "unknown",
        ],
        doubles: [metrics.duration || 0, Date.now()],
        indexes: [`cache_${metrics.operation}`, metrics.cacheType],
      });
    } catch (error) {
      console.error("Failed to track cache performance metrics:", error);
    }
  }
}

/**
 * Enhanced performance monitor that integrates with Cloudflare Analytics
 */
export class CloudflarePerformanceMonitor {
  private analytics: CloudflareAnalytics;
  private startTimes: Map<string, number> = new Map();

  constructor(env: CloudflareEnv) {
    this.analytics = new CloudflareAnalytics(env);
  }

  /**
   * Start timing an operation
   */
  startTiming(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }

  /**
   * End timing and track the operation
   */
  endTiming(
    operationId: string,
    metadata: {
      operation: string;
      success?: boolean;
      userId?: string;
      householdId?: string;
      additionalData?: Record<string, any>;
    }
  ): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operationId);

    // Track based on operation type
    if (metadata.operation.startsWith("auto_completion")) {
      // This would be enhanced based on the specific metrics structure
      console.log(
        `Auto-completion operation ${metadata.operation} took ${duration}ms`
      );
    } else if (metadata.operation.startsWith("db_")) {
      console.log(
        `Database operation ${metadata.operation} took ${duration}ms`
      );
    }

    return duration;
  }

  /**
   * Track auto-completion metrics
   */
  trackAutoCompletion(
    metrics: AutoCompletionMetrics & {
      householdId?: string;
      userId?: string;
    }
  ): void {
    this.analytics.trackAutoCompletion(metrics);
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(
    metrics: DatabaseQueryMetrics & {
      householdId?: string;
      operation?: string;
    }
  ): void {
    this.analytics.trackDatabaseQuery(metrics);
  }

  /**
   * Track API performance
   */
  trackApiPerformance(metrics: {
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    userId?: string;
    householdId?: string;
    userAgent?: string;
    country?: string;
  }): void {
    this.analytics.trackApiPerformance(metrics);
  }

  /**
   * Track errors
   */
  trackError(error: {
    type: string;
    message: string;
    stack?: string;
    userId?: string;
    householdId?: string;
    context?: string;
  }): void {
    this.analytics.trackError(error);
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(metrics: {
    operation: "hit" | "miss" | "set" | "invalidate";
    cacheType: "memory" | "database";
    key: string;
    duration?: number;
    householdId?: string;
  }): void {
    this.analytics.trackCachePerformance(metrics);
  }
}

/**
 * Middleware to automatically track request performance
 */
export function createPerformanceMiddleware(env: CloudflareEnv) {
  const monitor = new CloudflarePerformanceMonitor(env);

  return async function performanceMiddleware(
    c: any,
    next: () => Promise<void>
  ) {
    const startTime = Date.now();
    try {
      await next();
      const request = c.req;
      const response = c.res;
      const duration = Date.now() - startTime;

      monitor.trackApiPerformance({
        endpoint: request.url.pathname,
        method: request.method,
        duration,
        statusCode: response.status || 200,
        userId: c.get("userId"),
        householdId: c.get("householdId"),
        userAgent: request.headers.get("user-agent") || undefined,
        country: c.req.cf?.country || undefined,
      });
    } catch (error) {
      const _duration = Date.now() - startTime;

      monitor.trackError({
        type: "request_error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        userId: c.get("userId"),
        householdId: c.get("householdId"),
        context: `${c.req.method} ${c.req.url.pathname}`,
      });

      throw error;
    }
  };
}
