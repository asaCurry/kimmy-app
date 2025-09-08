interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(): () => number {
    const startTime = performance.now();
    return () => performance.now() - startTime;
  }

  /**
   * Record a performance metric
   */
  record(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to avoid memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log slow operations (>500ms)
    if (duration > 500) {
      console.warn(
        `Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`,
        metadata
      );
    }

    // Log very slow operations (>1000ms)
    if (duration > 1000) {
      console.error(
        `Very slow operation: ${operation} took ${duration.toFixed(2)}ms`,
        metadata
      );
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    recentMetrics: PerformanceMetric[];
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: 0,
        recentMetrics: [],
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const slowOperations = this.metrics.filter(m => m.duration > 500).length;

    return {
      totalOperations: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      slowOperations,
      recentMetrics: this.metrics.slice(-10),
    };
  }

  /**
   * Get statistics for a specific operation
   */
  getOperationStats(operation: string): {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    recentMetrics: PerformanceMetric[];
  } {
    const operationMetrics = this.metrics.filter(
      m => m.operation === operation
    );

    if (operationMetrics.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        recentMetrics: [],
      };
    }

    const durations = operationMetrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: operationMetrics.length,
      averageDuration: totalDuration / operationMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      recentMetrics: operationMetrics.slice(-5),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

/**
 * Decorator function to automatically monitor async function performance
 */
export function monitorPerformance<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T,
  getMetadata?: (...args: Parameters<T>) => Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    const monitor = PerformanceMonitor.getInstance();
    const endTimer = monitor.startTimer();

    try {
      const result = await fn(...args);
      const duration = endTimer();
      const metadata = getMetadata ? getMetadata(...args) : undefined;
      monitor.record(operation, duration, metadata);
      return result;
    } catch (error) {
      const duration = endTimer();
      const metadata = {
        ...(getMetadata ? getMetadata(...args) : {}),
        error: error instanceof Error ? error.message : "Unknown error",
      };
      monitor.record(`${operation}_error`, duration, metadata);
      throw error;
    }
  }) as T;
}

/**
 * Async function to monitor a block of code
 */
export async function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const endTimer = monitor.startTimer();

  try {
    const result = await fn();
    const duration = endTimer();
    monitor.record(operation, duration, metadata);
    return result;
  } catch (error) {
    const duration = endTimer();
    monitor.record(`${operation}_error`, duration, {
      ...metadata,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// Export the singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
