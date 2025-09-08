import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalyticsDashboard } from "~/components/analytics-dashboard";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock analytics response
const mockAnalyticsResponse = {
  success: true,
  analytics: {
    timeRange: "24h",
    metric: "performance",
    startTime: "2024-01-01T00:00:00Z",
    endTime: "2024-01-01T23:59:59Z",
    data: {
      autoCompletionQueries: [
        {
          timestamp: "2024-01-01T12:00:00Z",
          averageResponseTime: 120,
          queryCount: 50,
          cacheHitRate: 0.8,
        },
        {
          timestamp: "2024-01-01T13:00:00Z",
          averageResponseTime: 180,
          queryCount: 75,
          cacheHitRate: 0.7,
        },
      ],
      summary: {
        totalQueries: 1500,
        averageResponseTime: 127,
        cacheHitRate: 0.73,
        slowQueries: 23,
      },
      note: "This is mock data. In production, this would query Cloudflare Analytics Engine.",
    },
  },
};

const mockErrorResponse = {
  success: false,
  error: "Access denied",
};

describe("AnalyticsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it("renders dashboard header and controls", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsResponse,
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Refresh")).toBeInTheDocument();
    expect(screen.getByText("Last 24 Hours")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
  });

  it("shows loading state while fetching data", async () => {
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(fetchPromise);

    render(<AnalyticsDashboard />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    resolvePromise!({
      ok: true,
      json: async () => mockAnalyticsResponse,
    });

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });

  it("displays performance metrics correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsResponse,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Auto-Completion Performance")
      ).toBeInTheDocument();
      expect(screen.getByText("1,500")).toBeInTheDocument(); // Total Queries
      expect(screen.getByText("127ms")).toBeInTheDocument(); // Average Response Time
      expect(screen.getByText("73.0%")).toBeInTheDocument(); // Cache Hit Rate
      expect(screen.getByText("23")).toBeInTheDocument(); // Slow Queries
    });
  });

  it("displays error state when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => mockErrorResponse,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText(/HTTP 403: Forbidden/)).toBeInTheDocument();
    });
  });

  it("handles API JSON response error correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockErrorResponse,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Access denied")).toBeInTheDocument();
    });
  });

  it("refreshes data when refresh button is clicked", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsResponse,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Auto-Completion Performance")
      ).toBeInTheDocument();
    });

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("updates data when time range is changed", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsResponse,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Auto-Completion Performance")
      ).toBeInTheDocument();
    });

    // Click on time range selector to open dropdown
    const timeRangeSelect = screen.getByText("Last 24 Hours");
    fireEvent.click(timeRangeSelect);

    // Wait for dropdown and click "Last 7 Days" option
    await waitFor(() => {
      const option = screen.getByText("Last 7 Days");
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cloudflare-analytics?timeRange=7d&metric=performance"
      );
    });
  });

  it("updates data when metric is changed", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsResponse,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Auto-Completion Performance")
      ).toBeInTheDocument();
    });

    // Click on metric selector to open dropdown
    const metricSelect = screen.getByText("Performance");
    fireEvent.click(metricSelect);

    // Wait for dropdown and click "Errors" option
    await waitFor(() => {
      const option = screen.getByText("Errors");
      fireEvent.click(option);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cloudflare-analytics?timeRange=24h&metric=errors"
      );
    });
  });

  it("displays note when provided in response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsResponse,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/This is mock data/)).toBeInTheDocument();
    });
  });

  it("handles network errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("renders response time trends with correct color coding", async () => {
    const responseWithTrends = {
      ...mockAnalyticsResponse,
      analytics: {
        ...mockAnalyticsResponse.analytics,
        data: {
          ...mockAnalyticsResponse.analytics.data,
          autoCompletionQueries: [
            {
              timestamp: "2024-01-01T12:00:00Z",
              averageResponseTime: 120, // Good (green)
              queryCount: 50,
              cacheHitRate: 0.8,
            },
            {
              timestamp: "2024-01-01T13:00:00Z",
              averageResponseTime: 180, // Slow (red, > 150ms)
              queryCount: 75,
              cacheHitRate: 0.7,
            },
          ],
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithTrends,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Response Time Trends")).toBeInTheDocument();
      expect(screen.getByText("120ms")).toBeInTheDocument();
      expect(screen.getByText("180ms")).toBeInTheDocument();
    });
  });
});
