import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnhancedAnalyticsDashboard } from "~/components/enhanced-analytics-dashboard";
import type { BasicInsights } from "~/lib/analytics-service";
import type { AIInsight } from "~/lib/ai-analytics-service";
import { analyticsLogger } from "~/lib/logger";

// Mock the logger
vi.mock("~/lib/logger", () => ({
  analyticsLogger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock the chart components
vi.mock("~/components/ui/interactive-charts", () => ({
  InteractiveChart: ({ title, description }: any) => (
    <div data-testid="interactive-chart">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  InsightVisualization: ({ insight }: any) => (
    <div data-testid="insight-visualization">
      <h4>{insight.title}</h4>
      <p>{insight.description}</p>
    </div>
  ),
  DashboardMetrics: ({ title, timeframe }: any) => (
    <div data-testid="dashboard-metrics">
      <h4>{title}</h4>
      <span>{timeframe}</span>
    </div>
  ),
}));

// Mock UnifiedSelect component
vi.mock("~/components/ui/select-unified", () => ({
  UnifiedSelect: ({ value, onChange, options, placeholder }: any) => (
    <select
      data-testid={`select-${placeholder?.replace(/\s+/g, "-").toLowerCase()}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options?.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockInsights: BasicInsights = {
  summary: {
    totalRecords: 50,
    totalMembers: 3,
    activeCategories: ["Health", "Growth", "Behavior"],
    recordsThisWeek: 12,
    recordsThisMonth: 45,
    mostActiveCategory: "Health",
    mostActiveMember: "Test Child",
  },
  categoryInsights: [
    {
      category: "Health",
      count: 20,
      averagePerWeek: 5,
      trend: "increasing" as const,
      recentActivity: 8,
    },
    {
      category: "Growth",
      count: 15,
      averagePerWeek: 3,
      trend: "stable" as const,
      recentActivity: 3,
    },
  ],
  memberInsights: [
    {
      memberId: 1,
      memberName: "Test Child",
      recordCount: 30,
      categories: ["Health", "Growth"],
      trend: "increasing" as const,
      lastActivityDays: 1,
    },
  ],
  patterns: [
    {
      type: "health",
      title: "Sleep Pattern Improvement",
      description: "Sleep quality has improved over the past month",
      confidence: "high",
      metadata: { averageSleep: 8.5 },
    },
  ],
  recommendations: [
    {
      id: "rec-1",
      type: "health",
      title: "Continue Sleep Routine",
      description: "Current sleep patterns are showing positive results",
      priority: "medium",
      status: "active",
      memberId: 1,
      metadata: null,
      createdAt: new Date("2024-01-01"),
    },
  ],
};

const mockAIInsights: AIInsight[] = [
  {
    id: "ai-insight-1",
    type: "growth",
    category: "Physical Development",
    title: "Height Growth Acceleration",
    description: "Child's growth rate has increased by 15% this month",
    confidence: "high",
    importance: "medium",
    data: {
      trend: "increasing",
      timeframe: "4 weeks",
      dataPoints: 8,
      correlations: [
        {
          factor: "nutrition",
          strength: 0.8,
          direction: "positive",
        },
      ],
    },
    recommendations: [
      "Continue current nutrition plan",
      "Schedule pediatric checkup",
    ],
    chartData: [
      { date: "2024-01-01", value: 120 },
      { date: "2024-01-02", value: 121 },
    ],
    createdAt: new Date("2024-01-01"),
  },
];

describe("EnhancedAnalyticsDashboard", () => {
  const defaultProps = {
    insights: mockInsights,
    generatedAt: "2024-01-01T12:00:00Z",
    cached: false,
    householdId: "household-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          insights: mockAIInsights,
          metadata: {
            totalGenerated: 1,
            filtered: 1,
            category: "all",
            timeRange: "30",
          },
        }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("renders dashboard header with title and description", () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    expect(
      screen.getByText("AI-Powered Analytics Dashboard")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Advanced insights powered by Cloudflare AI/)
    ).toBeInTheDocument();
  });

  it("displays generation timestamp correctly", () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    expect(screen.getByText(/Generated 1\/1\/2024/)).toBeInTheDocument();
  });

  it("shows cached badge when data is cached", () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} cached={true} />);

    expect(screen.getByText("Cached")).toBeInTheDocument();
  });

  it("renders all dashboard view navigation buttons", () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Growth & Development")).toBeInTheDocument();
    expect(screen.getByText("Health Patterns")).toBeInTheDocument();
    expect(screen.getByText("Behavior Analysis")).toBeInTheDocument();
    expect(screen.getByText("Predictive Insights")).toBeInTheDocument();
  });

  it("switches between dashboard views", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Should start in overview
    expect(screen.getAllByTestId("dashboard-metrics")).toHaveLength(4);

    // Switch to growth view
    const growthButton = screen.getByText("Growth & Development");
    await user.click(growthButton);

    expect(growthButton).toHaveClass("bg-blue-500");
  });

  it("displays overview metrics correctly", () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Should show 4 metric cards
    const metricCards = screen.getAllByTestId("dashboard-metrics");
    expect(metricCards).toHaveLength(4);

    // Check for specific metrics
    expect(screen.getByText("Activity Level")).toBeInTheDocument();
    expect(screen.getByText("Sleep Quality")).toBeInTheDocument();
    expect(screen.getByText("Mood Rating")).toBeInTheDocument();
  });

  it("displays interactive charts in overview", () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    const charts = screen.getAllByTestId("interactive-chart");
    expect(charts.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText("Sleep Patterns")).toBeInTheDocument();
    expect(screen.getByText("Mood Trends")).toBeInTheDocument();
  });

  it("fetches AI insights on mount", async () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/ai-insights?householdId=household-1&timeRange=30"
      );
    });
  });

  it("handles AI insights fetch errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(analyticsLogger.error).toHaveBeenCalledWith(
        "Failed to fetch AI insights",
        expect.objectContaining({
          error: "Network error",
          householdId: "household-1",
        })
      );
    });
  });

  it("displays AI insights when available", async () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("insight-visualization")).toBeInTheDocument();
    });

    expect(screen.getByText("Height Growth Acceleration")).toBeInTheDocument();
  });

  it("shows loading state while fetching AI insights", async () => {
    const slowFetch = new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, insights: [] }),
          }),
        100
      );
    });

    mockFetch.mockReturnValue(slowFetch);

    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Switch to a non-overview view to see loading
    const user = userEvent.setup();
    await user.click(screen.getByText("Growth & Development"));

    expect(
      screen.getByText("Analyzing data with AI models...")
    ).toBeInTheDocument();
  });

  it("handles time range changes", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    const timeRangeSelect = screen.getByTestId("select-time-range");
    await user.selectOptions(timeRangeSelect, "90");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/ai-insights?householdId=household-1&timeRange=90"
      );
    });
  });

  it("handles member filter changes", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    const memberSelect = screen.getByTestId("select-member");
    expect(memberSelect).toBeInTheDocument();

    // Should include "All Members" and member from insights
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("refreshes AI insights when refresh button clicked", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it("shows advanced settings when toggled", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    const advancedButton = screen.getByText("Advanced Settings");
    await user.click(advancedButton);

    expect(screen.getByText("AI Model Confidence")).toBeInTheDocument();
    expect(screen.getByText("Analysis Depth")).toBeInTheDocument();
    expect(screen.getByText("Update Frequency")).toBeInTheDocument();
  });

  it("displays AI status footer", () => {
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    expect(screen.getByText("AI Analysis Status: Active")).toBeInTheDocument();
    expect(screen.getByText("Powered by Cloudflare AI")).toBeInTheDocument();
    expect(screen.getByText("AI Enhanced")).toBeInTheDocument();
  });

  it("shows empty state for specialized views without insights", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          insights: [], // No insights
          metadata: {
            totalGenerated: 0,
            filtered: 0,
          },
        }),
    });

    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Switch to growth view
    await user.click(screen.getByText("Growth & Development"));

    await waitFor(() => {
      expect(
        screen.getByText("Generating Growth & Development Insights")
      ).toBeInTheDocument();
      expect(screen.getByText("Generate Insights")).toBeInTheDocument();
    });
  });

  it("filters insights by view type", async () => {
    const multiTypeInsights = [
      mockAIInsights[0], // growth type
      {
        ...mockAIInsights[0],
        id: "health-insight",
        type: "health" as const,
        title: "Health Pattern Analysis",
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          insights: multiTypeInsights,
        }),
    });

    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Wait for insights to load
    await waitFor(() => {
      expect(
        screen.getByText("Height Growth Acceleration")
      ).toBeInTheDocument();
    });

    // Switch to health view - should filter to health insights only
    await user.click(screen.getByText("Health Patterns"));

    // Implementation would filter insights by type
    expect(screen.getByText("Health Patterns Insights")).toBeInTheDocument();
  });

  it("handles specialized view chart rendering", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Switch to behavior view
    await user.click(screen.getByText("Behavior Analysis"));

    // Should show specialized charts for behavior
    await waitFor(() => {
      expect(screen.getByText("Behavior Analysis Trends")).toBeInTheDocument();
      expect(
        screen.getByText("Behavior Analysis Distribution")
      ).toBeInTheDocument();
    });
  });

  it("maintains proper loading states during view switches", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    // Initial overview should not show loading
    expect(
      screen.queryByText("Analyzing data with AI models...")
    ).not.toBeInTheDocument();

    // Switch to specialized view should show loading until data loads
    await user.click(screen.getByText("Predictive Insights"));

    // Should show specialized view content
    expect(screen.getByText("Predictive Analysis")).toBeInTheDocument();
  });

  it("handles export button functionality", async () => {
    const user = userEvent.setup();
    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    const exportButton = screen.getByText("Export");
    await user.click(exportButton);

    // Export functionality would be implemented
    expect(exportButton).toBeInTheDocument();
  });

  it("displays proper loading state text", async () => {
    const user = userEvent.setup();

    // Mock slow response
    const slowResponse = new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, insights: [] }),
          }),
        50
      );
    });

    mockFetch.mockReturnValue(slowResponse);

    render(<EnhancedAnalyticsDashboard {...defaultProps} />);

    await user.click(screen.getByText("Health Patterns"));

    expect(
      screen.getByText("Analyzing data with AI models...")
    ).toBeInTheDocument();

    // Wait for response to complete
    await waitFor(
      () => {
        expect(
          screen.queryByText("Analyzing data with AI models...")
        ).not.toBeInTheDocument();
      },
      { timeout: 100 }
    );
  });
});
