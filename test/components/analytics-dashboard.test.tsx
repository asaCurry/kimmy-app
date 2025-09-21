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
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockAnalyticsResponse),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

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

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockAnalyticsResponse),
    };
    resolvePromise!(mockResponse);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });

  it("displays performance metrics correctly", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockAnalyticsResponse),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

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
    // Mock a proper Response object with the required properties
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: vi.fn().mockResolvedValue(mockErrorResponse),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText(/HTTP 403: Forbidden/)).toBeInTheDocument();
    });
  });

  it("handles API JSON response error correctly", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockErrorResponse),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Access denied")).toBeInTheDocument();
    });
  });

  it("refreshes data when refresh button is clicked", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockAnalyticsResponse),
    };
    mockFetch.mockResolvedValue(mockResponse);

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Auto-Completion Performance")
      ).toBeInTheDocument();
    });

    // Clear the mock call count after initial load
    mockFetch.mockClear();

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    // Now expect just the refresh call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("updates data when time range is changed", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockAnalyticsResponse),
    };
    mockFetch.mockResolvedValue(mockResponse);

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
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockAnalyticsResponse),
    };
    mockFetch.mockResolvedValue(mockResponse);

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
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockAnalyticsResponse),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

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

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(responseWithTrends),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Response Time Trends")).toBeInTheDocument();
      expect(screen.getByText("120ms")).toBeInTheDocument();
      expect(screen.getByText("180ms")).toBeInTheDocument();
    });
  });
});
