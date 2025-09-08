import type { Database } from "../../db";
import { CloudflarePerformanceMonitor } from "./cloudflare-analytics";

interface QueryMetadata {
  operation: string;
  table?: string;
  householdId?: string;
  userId?: string;
}

/**
 * Database wrapper that automatically tracks performance metrics for D1 queries
 */
export class MonitoredDatabase {
  private monitor?: CloudflarePerformanceMonitor;

  constructor(
    private db: Database,
    env?: { ANALYTICS?: AnalyticsEngineDataset }
  ) {
    if (env) {
      this.monitor = new CloudflarePerformanceMonitor(env);
    }
  }

  /**
   * Execute a monitored select query
   */
  async monitoredSelect<T>(
    queryBuilder: any,
    metadata: QueryMetadata
  ): Promise<T[]> {
    const startTime = performance.now();

    try {
      const result = await queryBuilder;
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "select",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: Array.isArray(result) ? result.length : 1,
        success: true,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "select",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: 0,
        success: false,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      this.monitor?.trackError({
        type: "database_error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
        stack: error instanceof Error ? error.stack : undefined,
        userId: metadata.userId,
        householdId: metadata.householdId,
        context: `${metadata.operation} on ${metadata.table}`,
      });

      throw error;
    }
  }

  /**
   * Execute a monitored insert query
   */
  async monitoredInsert<T>(
    queryBuilder: any,
    metadata: QueryMetadata
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryBuilder;
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "insert",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: 1,
        success: true,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "insert",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: 0,
        success: false,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      this.monitor?.trackError({
        type: "database_error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
        stack: error instanceof Error ? error.stack : undefined,
        userId: metadata.userId,
        householdId: metadata.householdId,
        context: `${metadata.operation} on ${metadata.table}`,
      });

      throw error;
    }
  }

  /**
   * Execute a monitored update query
   */
  async monitoredUpdate<T>(
    queryBuilder: any,
    metadata: QueryMetadata & { expectedRows?: number }
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryBuilder;
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "update",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: metadata.expectedRows || 1,
        success: true,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "update",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: 0,
        success: false,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      this.monitor?.trackError({
        type: "database_error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
        stack: error instanceof Error ? error.stack : undefined,
        userId: metadata.userId,
        householdId: metadata.householdId,
        context: `${metadata.operation} on ${metadata.table}`,
      });

      throw error;
    }
  }

  /**
   * Execute a monitored delete query
   */
  async monitoredDelete<T>(
    queryBuilder: any,
    metadata: QueryMetadata & { expectedRows?: number }
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryBuilder;
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "delete",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: metadata.expectedRows || 1,
        success: true,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.monitor?.trackDatabaseQuery({
        queryType: "delete",
        table: metadata.table || "unknown",
        duration,
        rowsAffected: 0,
        success: false,
        householdId: metadata.householdId,
        operation: metadata.operation,
      });

      this.monitor?.trackError({
        type: "database_error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
        stack: error instanceof Error ? error.stack : undefined,
        userId: metadata.userId,
        householdId: metadata.householdId,
        context: `${metadata.operation} on ${metadata.table}`,
      });

      throw error;
    }
  }

  /**
   * Get the underlying database instance for direct access when needed
   */
  getRawDb(): Database {
    return this.db;
  }

  /**
   * Pass through to the original database for non-monitored queries
   */
  get select() {
    return this.db.select.bind(this.db);
  }
  get insert() {
    return this.db.insert.bind(this.db);
  }
  get update() {
    return this.db.update.bind(this.db);
  }
  get delete() {
    return this.db.delete.bind(this.db);
  }
  get $with() {
    return this.db.$with.bind(this.db);
  }
}
