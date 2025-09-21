import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { UnifiedSelect } from "./ui/select-unified";
import { LoadingSpinner } from "./ui/loading-spinner";

interface AnalyticsData {
  timeRange: string;
  metric: string;
  startTime: string;
  endTime: string;
  data: any;
}

interface AnalyticsResponse {
  success: boolean;
  analytics?: AnalyticsData;
  error?: string;
  note?: string;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("24h");
  const [metric, setMetric] = useState("performance");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/cloudflare-analytics?timeRange=${timeRange}&metric=${metric}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AnalyticsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch analytics");
      }

      setAnalytics(data.analytics || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange, metric]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, metric, fetchAnalytics]);

  const timeRangeOptions = [
    { value: "1h", label: "Last Hour" },
    { value: "6h", label: "Last 6 Hours" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
  ];

  const metricOptions = [
    { value: "performance", label: "Performance" },
    { value: "errors", label: "Errors" },
    { value: "cache", label: "Cache" },
    { value: "database", label: "Database" },
    { value: "api", label: "API" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Button onClick={fetchAnalytics} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="flex gap-4">
        <UnifiedSelect
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
          placeholder="Select time range"
        />
        <UnifiedSelect
          value={metric}
          onChange={setMetric}
          options={metricOptions}
          placeholder="Select metric"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" data-testid="loading-spinner" />
        </div>
      )}

      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {analytics && !loading && (
        <>
          {analytics.data?.note && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-blue-800 text-sm">{analytics.data.note}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metric === "performance" && (
              <PerformanceMetrics data={analytics.data} />
            )}
            {metric === "errors" && <ErrorMetrics data={analytics.data} />}
            {metric === "cache" && <CacheMetrics data={analytics.data} />}
            {metric === "database" && <DatabaseMetrics data={analytics.data} />}
            {metric === "api" && <ApiMetrics data={analytics.data} />}
          </div>
        </>
      )}
    </div>
  );
}

function PerformanceMetrics({ data }: { data: any }) {
  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Auto-Completion Performance
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Queries:</span>
            <span className="font-semibold">
              {data.summary?.totalQueries?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Average Response Time:</span>
            <span className="font-semibold">
              {data.summary?.averageResponseTime}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cache Hit Rate:</span>
            <span className="font-semibold">
              {(data.summary?.cacheHitRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Slow Queries:</span>
            <span className="font-semibold">{data.summary?.slowQueries}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Response Time Trends</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.autoCompletionQueries
            ?.slice(-10)
            .map((query: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {new Date(query.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`font-medium ${query.averageResponseTime > 150 ? "text-red-600" : "text-green-600"}`}
                >
                  {query.averageResponseTime.toFixed(0)}ms
                </span>
              </div>
            ))}
        </div>
      </Card>
    </>
  );
}

function ErrorMetrics({ data }: { data: any }) {
  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Error Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Errors:</span>
            <span className="font-semibold text-red-600">
              {data.summary?.totalErrors}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Error Rate:</span>
            <span className="font-semibold">
              {(data.summary?.errorRate * 100).toFixed(3)}%
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Error Types</h3>
        <div className="space-y-2">
          {data.summary?.topErrors?.map((error: any, index: number) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-600">
                {error.type.replace(/_/g, " ")}:
              </span>
              <span className="font-semibold">{error.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function CacheMetrics({ data }: { data: any }) {
  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Overall Hit Rate:</span>
            <span className="font-semibold">
              {(data.summary?.overallHitRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Memory Hit Rate:</span>
            <span className="font-semibold">
              {(data.summary?.memoryHitRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Database Hit Rate:</span>
            <span className="font-semibold">
              {(data.summary?.databaseHitRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Requests:</span>
            <span className="font-semibold">
              {data.summary?.totalRequests?.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cache Efficiency Trends</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.cacheMetrics?.slice(-10).map((metric: any, index: number) => {
            const hitRate =
              metric.memoryHits / (metric.memoryHits + metric.memoryMisses);
            return (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`font-medium ${hitRate > 0.8 ? "text-green-600" : "text-yellow-600"}`}
                >
                  {(hitRate * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function DatabaseMetrics({ data }: { data: any }) {
  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Database Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Queries:</span>
            <span className="font-semibold">
              {data.summary?.totalQueries?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Average Query Time:</span>
            <span className="font-semibold">
              {data.summary?.averageQueryTime}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Slow Queries:</span>
            <span className="font-semibold text-red-600">
              {data.summary?.slowQueries}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Query Distribution</h3>
        <div className="space-y-2">
          {Object.entries(data.summary?.queryDistribution || {}).map(
            ([type, percentage]) => (
              <div key={type} className="flex justify-between">
                <span className="text-gray-600 capitalize">{type}:</span>
                <span className="font-semibold">
                  {((percentage as number) * 100).toFixed(1)}%
                </span>
              </div>
            )
          )}
        </div>
      </Card>
    </>
  );
}

function ApiMetrics({ data }: { data: any }) {
  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">API Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Requests:</span>
            <span className="font-semibold">
              {data.summary?.totalRequests?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Success Rate:</span>
            <span className="font-semibold text-green-600">
              {(data.summary?.successRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Average Response Time:</span>
            <span className="font-semibold">
              {data.summary?.averageResponseTime}ms
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Endpoints</h3>
        <div className="space-y-2">
          {data.summary?.topEndpoints?.map((endpoint: any, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600 font-mono">
                {endpoint.endpoint}
              </span>
              <span className="font-semibold">
                {endpoint.requests.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
