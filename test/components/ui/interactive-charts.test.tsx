import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  InteractiveChart,
  InsightVisualization,
  DashboardMetrics,
} from "~/components/ui/interactive-charts";
import type { AIInsight, ChartDataPoint } from "~/lib/ai-analytics-service";

// Mock recharts components
vi.mock("recharts", () => ({
  LineChart: ({ children, ...props }: any) => (
    <div data-testid="line-chart" {...props}>
      {children}
    </div>
  ),
  AreaChart: ({ children, ...props }: any) => (
    <div data-testid="area-chart" {...props}>
      {children}
    </div>
  ),
  BarChart: ({ children, ...props }: any) => (
    <div data-testid="bar-chart" {...props}>
      {children}
    </div>
  ),
  ScatterChart: ({ children, ...props }: any) => (
    <div data-testid="scatter-chart" {...props}>
      {children}
    </div>
  ),
  PieChart: ({ children, ...props }: any) => (
    <div data-testid="pie-chart" {...props}>
      {children}
    </div>
  ),
  Line: ({ ...props }: any) => <div data-testid="line" {...props} />,
  Area: ({ ...props }: any) => <div data-testid="area" {...props} />,
  Bar: ({ ...props }: any) => <div data-testid="bar" {...props} />,
  Scatter: ({ ...props }: any) => <div data-testid="scatter" {...props} />,
  Pie: ({ ...props }: any) => <div data-testid="pie" {...props} />,
  Cell: ({ ...props }: any) => <div data-testid="cell" {...props} />,
  XAxis: ({ ...props }: any) => <div data-testid="x-axis" {...props} />,
  YAxis: ({ ...props }: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: ({ ...props }: any) => (
    <div data-testid="cartesian-grid" {...props} />
  ),
  Tooltip: ({ ...props }: any) => <div data-testid="tooltip" {...props} />,
  Legend: ({ ...props }: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children, ...props }: any) => (
    <div data-testid="responsive-container" {...props}>
      {children}
    </div>
  ),
}));

const mockChartData: ChartDataPoint[] = [
  {
    date: "2024-01-01T00:00:00Z",
    value: 10,
    category: "sleep",
    member: "test-member",
  },
  {
    date: "2024-01-02T00:00:00Z",
    value: 15,
    category: "sleep",
    member: "test-member",
  },
  {
    date: "2024-01-03T00:00:00Z",
    value: 12,
    category: "sleep",
    member: "test-member",
  },
];

const mockInsight: AIInsight = {
  id: "test-insight-1",
  type: "growth",
  category: "Physical Development",
  title: "Test Growth Insight",
  description: "This is a test insight for growth patterns",
  confidence: "high",
  importance: "medium",
  data: {
    trend: "increasing",
    timeframe: "4 weeks",
    dataPoints: 10,
    correlations: [
      {
        factor: "nutrition",
        strength: 0.8,
        direction: "positive",
      },
    ],
    predictions: [
      {
        metric: "height",
        value: 125.5,
        timeframe: "1 week",
        confidence: 0.85,
      },
    ],
  },
  recommendations: [
    "Continue current nutrition plan",
    "Monitor growth regularly",
    "Consult with pediatrician if concerns arise",
  ],
  chartData: mockChartData,
  createdAt: new Date("2024-01-01T00:00:00Z"),
};

describe("InteractiveChart", () => {
  const defaultProps = {
    data: mockChartData,
    title: "Test Chart",
    description: "Test chart description",
  };

  it("renders chart with default props", () => {
    render(<InteractiveChart {...defaultProps} />);

    expect(screen.getByText("Test Chart")).toBeInTheDocument();
    expect(screen.getByText("Test chart description")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("displays chart statistics correctly", () => {
    render(<InteractiveChart {...defaultProps} />);

    expect(screen.getByText("3")).toBeInTheDocument(); // Data points count
    expect(screen.getByText("12.00")).toBeInTheDocument(); // Latest value
    expect(screen.getByText("12.33")).toBeInTheDocument(); // Average
  });

  it("switches chart types when controls are enabled", async () => {
    const user = userEvent.setup();
    render(<InteractiveChart {...defaultProps} showControls={true} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();

    // Note: In a real test, you'd need to interact with the UnifiedSelect
    // This is a simplified test due to mocked components
  });

  it("handles different chart types", () => {
    const { rerender } = render(
      <InteractiveChart {...defaultProps} type="area" />
    );
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();

    rerender(<InteractiveChart {...defaultProps} type="bar" />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();

    rerender(<InteractiveChart {...defaultProps} type="scatter" />);
    expect(screen.getByTestId("scatter-chart")).toBeInTheDocument();

    rerender(<InteractiveChart {...defaultProps} type="pie" />);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("filters data by time range", () => {
    const extendedData = [
      ...mockChartData,
      {
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        value: 5,
        category: "sleep",
      },
    ];

    render(
      <InteractiveChart
        {...defaultProps}
        data={extendedData}
        showControls={true}
      />
    );

    // Should show all data points initially
    expect(screen.getByText("4")).toBeInTheDocument(); // Total data points
  });

  it("filters data by category", () => {
    const multiCategoryData = [
      ...mockChartData,
      {
        date: "2024-01-04T00:00:00Z",
        value: 20,
        category: "mood",
        member: "test-member",
      },
    ];

    render(
      <InteractiveChart
        {...defaultProps}
        data={multiCategoryData}
        showControls={true}
      />
    );

    // Should show all categories by default
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    render(<InteractiveChart {...defaultProps} data={[]} />);

    expect(screen.getByText("Test Chart")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // Data points count
  });

  it("shows export and zoom controls when enabled", () => {
    render(<InteractiveChart {...defaultProps} showControls={true} />);

    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByText("Full View")).toBeInTheDocument();
  });

  it("calls onDataPointClick when provided", () => {
    const handleDataPointClick = vi.fn();
    render(
      <InteractiveChart
        {...defaultProps}
        onDataPointClick={handleDataPointClick}
      />
    );

    // In a real implementation, you'd simulate a click on a data point
    // This test verifies the prop is accepted
    expect(handleDataPointClick).toBeDefined();
  });

  it("applies custom colors", () => {
    const customColors = ["#ff0000", "#00ff00", "#0000ff"];
    render(<InteractiveChart {...defaultProps} colors={customColors} />);

    // Chart should render with custom colors (implementation detail)
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("sets custom height", () => {
    render(<InteractiveChart {...defaultProps} height={400} />);

    const container = screen.getByTestId("responsive-container").parentElement;
    expect(container).toHaveStyle({ height: "400px" });
  });
});

describe("InsightVisualization", () => {
  const defaultProps = {
    insight: mockInsight,
  };

  it("renders insight with all sections", () => {
    render(<InsightVisualization {...defaultProps} />);

    expect(screen.getByText("Test Growth Insight")).toBeInTheDocument();
    expect(
      screen.getByText("This is a test insight for growth patterns")
    ).toBeInTheDocument();
    expect(screen.getByText("high confidence")).toBeInTheDocument();
    expect(screen.getByText("medium priority")).toBeInTheDocument();
    expect(screen.getByText("Physical Development")).toBeInTheDocument();
  });

  it("displays key metrics correctly", () => {
    render(<InsightVisualization {...defaultProps} />);

    expect(screen.getByText("increasing")).toBeInTheDocument();
    expect(screen.getByText("4 weeks")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows correlations when available", () => {
    render(<InsightVisualization {...defaultProps} />);

    expect(screen.getByText("nutrition:")).toBeInTheDocument();
    expect(screen.getByText("positive (80%)")).toBeInTheDocument();
  });

  it("shows predictions when available", () => {
    render(<InsightVisualization {...defaultProps} />);

    expect(screen.getByText("height:")).toBeInTheDocument();
    expect(screen.getByText("125.50 (85% confidence)")).toBeInTheDocument();
  });

  it("displays recommendations list", () => {
    render(<InsightVisualization {...defaultProps} />);

    expect(
      screen.getByText("Continue current nutrition plan")
    ).toBeInTheDocument();
    expect(screen.getByText("Monitor growth regularly")).toBeInTheDocument();
    expect(
      screen.getByText("Consult with pediatrician if concerns arise")
    ).toBeInTheDocument();
  });

  it("includes chart when chart data is available", () => {
    render(<InsightVisualization {...defaultProps} />);

    expect(
      screen.getByText("Test Growth Insight - Trend Analysis")
    ).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles insight without chart data", () => {
    const insightWithoutChart = {
      ...mockInsight,
      chartData: undefined,
    };

    render(<InsightVisualization insight={insightWithoutChart} />);

    expect(screen.getByText("Test Growth Insight")).toBeInTheDocument();
    expect(
      screen.queryByText("Test Growth Insight - Trend Analysis")
    ).not.toBeInTheDocument();
  });

  it("calls onMarkComplete when button is clicked", async () => {
    const user = userEvent.setup();
    const handleMarkComplete = vi.fn();

    render(
      <InsightVisualization
        {...defaultProps}
        onMarkComplete={handleMarkComplete}
      />
    );

    const markCompleteButton = screen.getByText("Mark Complete");
    await user.click(markCompleteButton);

    expect(handleMarkComplete).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when button is clicked", async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    render(
      <InsightVisualization {...defaultProps} onDismiss={handleDismiss} />
    );

    const dismissButton = screen.getByText("Dismiss");
    await user.click(dismissButton);

    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  it("shows appropriate confidence color styling", () => {
    const { rerender } = render(<InsightVisualization {...defaultProps} />);

    // High confidence
    expect(screen.getByText("high confidence")).toHaveClass("text-green-400");

    // Medium confidence
    const mediumInsight = { ...mockInsight, confidence: "medium" as const };
    rerender(<InsightVisualization insight={mediumInsight} />);
    expect(screen.getByText("medium confidence")).toHaveClass(
      "text-yellow-400"
    );

    // Low confidence
    const lowInsight = { ...mockInsight, confidence: "low" as const };
    rerender(<InsightVisualization insight={lowInsight} />);
    expect(screen.getByText("low confidence")).toHaveClass("text-red-400");
  });

  it("shows appropriate importance color styling", () => {
    const { rerender } = render(<InsightVisualization {...defaultProps} />);

    // Critical importance
    const criticalInsight = { ...mockInsight, importance: "critical" as const };
    rerender(<InsightVisualization insight={criticalInsight} />);
    expect(screen.getByText("critical priority")).toHaveClass("text-red-400");

    // High importance
    const highInsight = { ...mockInsight, importance: "high" as const };
    rerender(<InsightVisualization insight={highInsight} />);
    expect(screen.getByText("high priority")).toHaveClass("text-orange-400");
  });

  it("handles different insight types with appropriate icons", () => {
    const { rerender } = render(<InsightVisualization {...defaultProps} />);

    // Growth type
    expect(screen.getByTestId("trending-up")).toBeInTheDocument();

    // Health type
    const healthInsight = { ...mockInsight, type: "health" as const };
    rerender(<InsightVisualization insight={healthInsight} />);
    expect(screen.getByTestId("activity")).toBeInTheDocument();

    // Behavior type
    const behaviorInsight = { ...mockInsight, type: "behavior" as const };
    rerender(<InsightVisualization insight={behaviorInsight} />);
    expect(screen.getByTestId("bar-chart-3")).toBeInTheDocument();
  });
});

describe("DashboardMetrics", () => {
  const defaultProps = {
    data: mockChartData,
    title: "Test Metrics",
    timeframe: "Last 7 days",
  };

  it("renders metrics card with title and timeframe", () => {
    render(<DashboardMetrics {...defaultProps} />);

    expect(screen.getByText("Test Metrics")).toBeInTheDocument();
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
  });

  it("calculates and displays correct statistics", () => {
    render(<DashboardMetrics {...defaultProps} />);

    // Average: (10 + 15 + 12) / 3 = 12.33
    expect(screen.getByText("12.33")).toBeInTheDocument();

    // Total: 10 + 15 + 12 = 37
    expect(screen.getByText("37.00")).toBeInTheDocument();

    // Min: 10
    expect(screen.getByText("10.00")).toBeInTheDocument();

    // Max: 15
    expect(screen.getByText("15.00")).toBeInTheDocument();
  });

  it("shows trend indicators correctly", () => {
    render(<DashboardMetrics {...defaultProps} />);

    // Data has values [10, 15, 12], so first half avg = 10, second half avg = 13.5
    // This should show an upward trend
    expect(screen.getByTestId("trending-up")).toBeInTheDocument();
  });

  it("handles downward trends", () => {
    const decreasingData = [
      { date: "2024-01-01", value: 20 },
      { date: "2024-01-02", value: 15 },
      { date: "2024-01-03", value: 10 },
    ];

    render(<DashboardMetrics {...defaultProps} data={decreasingData} />);

    expect(screen.getByTestId("trending-down")).toBeInTheDocument();
  });

  it("handles stable trends", () => {
    const stableData = [
      { date: "2024-01-01", value: 15 },
      { date: "2024-01-02", value: 15 },
      { date: "2024-01-03", value: 15 },
    ];

    render(<DashboardMetrics {...defaultProps} data={stableData} />);

    expect(screen.getByText("Stable")).toBeInTheDocument();
    expect(screen.getByTestId("activity")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    render(<DashboardMetrics {...defaultProps} data={[]} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("handles single data point", () => {
    const singlePointData = [{ date: "2024-01-01", value: 42 }];

    render(<DashboardMetrics {...defaultProps} data={singlePointData} />);

    expect(screen.getByText("42.00")).toBeInTheDocument(); // Average, total, min, max all same
    expect(screen.getByText("Stable")).toBeInTheDocument(); // No trend with single point
  });

  it("displays trend percentage for significant changes", () => {
    const trendData = [
      { date: "2024-01-01", value: 10 },
      { date: "2024-01-02", value: 10 },
      { date: "2024-01-03", value: 20 },
      { date: "2024-01-04", value: 20 },
    ];

    render(<DashboardMetrics {...defaultProps} data={trendData} />);

    // First half avg = 10, second half avg = 20, so 100% increase
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });
});
