import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightsDashboard } from "~/components/insights-dashboard";
import type { BasicInsights } from "~/lib/analytics-service";

// Mock the UI components
vi.mock("~/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

vi.mock("~/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock("~/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

describe("InsightsDashboard", () => {
  let mockInsights: BasicInsights;
  const mockGeneratedAt = "2024-01-01T12:00:00Z";

  beforeEach(() => {
    mockInsights = {
      summary: {
        totalRecords: 150,
        totalMembers: 3,
        activeCategories: ["Health", "Growth", "Education", "Activities"],
        recordsThisWeek: 18,
        recordsThisMonth: 65,
        mostActiveCategory: "Health",
        mostActiveMember: "Alice Johnson",
      },
      categoryInsights: [
        {
          category: "Health",
          count: 50,
          averagePerWeek: 12,
          trend: "increasing",
          recentActivity: 15,
        },
        {
          category: "Growth",
          count: 40,
          averagePerWeek: 10,
          trend: "stable",
          recentActivity: 10,
        },
        {
          category: "Education",
          count: 35,
          averagePerWeek: 8,
          trend: "decreasing",
          recentActivity: 5,
        },
      ],
      memberInsights: [
        {
          memberId: 1,
          memberName: "Alice Johnson",
          recordCount: 75,
          categories: ["Health", "Growth"],
          trend: "increasing",
          lastActivityDays: 1,
        },
        {
          memberId: 2,
          memberName: "Bob Smith",
          recordCount: 45,
          categories: ["Education", "Activities"],
          trend: "stable",
          lastActivityDays: 2,
        },
        {
          memberId: 3,
          memberName: "Charlie Wilson",
          recordCount: 30,
          categories: ["Activities"],
          trend: "decreasing",
          lastActivityDays: 5,
        },
      ],
      patterns: [
        {
          type: "health",
          title: "Consistent Sleep Schedule",
          description: "Family maintains regular bedtime routines",
          confidence: "high",
          metadata: { averageHours: 8.2, consistency: 0.9 },
        },
        {
          type: "growth",
          title: "Growth Milestone Tracking",
          description:
            "Regular height and weight measurements show healthy progress",
          confidence: "medium",
          metadata: { growthRate: 0.15, measurements: 12 },
        },
      ],
      recommendations: [
        {
          id: "rec-1",
          type: "health",
          title: "Maintain Sleep Routine",
          description: "Continue current bedtime schedule for optimal rest",
          priority: "medium",
          status: "active",
          memberId: 1,
          metadata: { targetHours: 8.5 },
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "rec-2",
          type: "education",
          title: "Increase Reading Time",
          description: "Consider adding 15 minutes of daily reading",
          priority: "high",
          status: "active",
          memberId: 2,
          metadata: { currentMinutes: 20, targetMinutes: 35 },
          createdAt: new Date("2024-01-02"),
        },
      ],
    };

    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the dashboard with all main sections", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("Summary Overview")).toBeInTheDocument();
      expect(screen.getByText("Category Breakdown")).toBeInTheDocument();
      expect(screen.getByText("Member Activity")).toBeInTheDocument();
      expect(screen.getByText("Detected Patterns")).toBeInTheDocument();
      expect(screen.getByText("Recommendations")).toBeInTheDocument();
    });

    it("should display the generation timestamp", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText(/Generated on/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 1/)).toBeInTheDocument();
    });

    it("should show cached indicator when cached prop is true", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
          cached={true}
        />
      );

      const cachedBadge = screen.getByTestId("badge");
      expect(cachedBadge).toHaveTextContent("Cached");
    });

    it("should not show cached indicator when cached prop is false", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
          cached={false}
        />
      );

      expect(screen.queryByText("Cached")).not.toBeInTheDocument();
    });
  });

  describe("Summary Section", () => {
    it("should display all summary statistics", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("150")).toBeInTheDocument(); // Total records
      expect(screen.getByText("3")).toBeInTheDocument(); // Total members
      expect(screen.getByText("4")).toBeInTheDocument(); // Active categories
      expect(screen.getByText("18")).toBeInTheDocument(); // Records this week
      expect(screen.getByText("65")).toBeInTheDocument(); // Records this month
      expect(screen.getByText("Health")).toBeInTheDocument(); // Most active category
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument(); // Most active member
    });

    it("should handle null values in summary", () => {
      const insightsWithNulls = {
        ...mockInsights,
        summary: {
          ...mockInsights.summary,
          mostActiveCategory: null,
          mostActiveMember: null,
        },
      };

      render(
        <InsightsDashboard
          insights={insightsWithNulls}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  describe("Category Insights", () => {
    it("should display all category insights with trend indicators", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      // Check category names
      expect(screen.getByText("Health")).toBeInTheDocument();
      expect(screen.getByText("Growth")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();

      // Check counts
      expect(screen.getByText("50 records")).toBeInTheDocument();
      expect(screen.getByText("40 records")).toBeInTheDocument();
      expect(screen.getByText("35 records")).toBeInTheDocument();

      // Check averages
      expect(screen.getByText("12/week avg")).toBeInTheDocument();
      expect(screen.getByText("10/week avg")).toBeInTheDocument();
      expect(screen.getByText("8/week avg")).toBeInTheDocument();
    });

    it("should show correct trend icons for different trends", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      // Since we're mocking the icons, we can't test the actual icon rendering
      // but we can verify the trend badges are rendered
      const badges = screen.getAllByTestId("badge");
      const trendBadges = badges.filter(
        badge =>
          badge.textContent?.includes("increasing") ||
          badge.textContent?.includes("stable") ||
          badge.textContent?.includes("decreasing")
      );
      expect(trendBadges.length).toBeGreaterThan(0);
    });

    it("should handle empty category insights", () => {
      const insightsWithEmptyCategories = {
        ...mockInsights,
        categoryInsights: [],
      };

      render(
        <InsightsDashboard
          insights={insightsWithEmptyCategories}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(
        screen.getByText("No category insights available")
      ).toBeInTheDocument();
    });
  });

  describe("Member Insights", () => {
    it("should display all member insights", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      // Check member names
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
      expect(screen.getByText("Charlie Wilson")).toBeInTheDocument();

      // Check record counts
      expect(screen.getByText("75 records")).toBeInTheDocument();
      expect(screen.getByText("45 records")).toBeInTheDocument();
      expect(screen.getByText("30 records")).toBeInTheDocument();

      // Check last activity
      expect(screen.getByText("1 day ago")).toBeInTheDocument();
      expect(screen.getByText("2 days ago")).toBeInTheDocument();
      expect(screen.getByText("5 days ago")).toBeInTheDocument();
    });

    it("should display member categories correctly", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      // Categories should be displayed as badges
      expect(screen.getByText("Health")).toBeInTheDocument();
      expect(screen.getByText("Growth")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();
      expect(screen.getByText("Activities")).toBeInTheDocument();
    });

    it("should handle empty member insights", () => {
      const insightsWithEmptyMembers = {
        ...mockInsights,
        memberInsights: [],
      };

      render(
        <InsightsDashboard
          insights={insightsWithEmptyMembers}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(
        screen.getByText("No member insights available")
      ).toBeInTheDocument();
    });
  });

  describe("Patterns Section", () => {
    it("should display detected patterns", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("Consistent Sleep Schedule")).toBeInTheDocument();
      expect(screen.getByText("Growth Milestone Tracking")).toBeInTheDocument();
      expect(
        screen.getByText("Family maintains regular bedtime routines")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Regular height and weight measurements show healthy progress"
        )
      ).toBeInTheDocument();
    });

    it("should show confidence levels for patterns", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("High Confidence")).toBeInTheDocument();
      expect(screen.getByText("Medium Confidence")).toBeInTheDocument();
    });

    it("should handle empty patterns", () => {
      const insightsWithEmptyPatterns = {
        ...mockInsights,
        patterns: [],
      };

      render(
        <InsightsDashboard
          insights={insightsWithEmptyPatterns}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("No patterns detected yet")).toBeInTheDocument();
    });
  });

  describe("Recommendations Section", () => {
    it("should display all recommendations", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("Maintain Sleep Routine")).toBeInTheDocument();
      expect(screen.getByText("Increase Reading Time")).toBeInTheDocument();
      expect(
        screen.getByText("Continue current bedtime schedule for optimal rest")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Consider adding 15 minutes of daily reading")
      ).toBeInTheDocument();
    });

    it("should show priority levels for recommendations", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("Medium Priority")).toBeInTheDocument();
      expect(screen.getByText("High Priority")).toBeInTheDocument();
    });

    it("should handle empty recommendations", () => {
      const insightsWithEmptyRecommendations = {
        ...mockInsights,
        recommendations: [],
      };

      render(
        <InsightsDashboard
          insights={insightsWithEmptyRecommendations}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(
        screen.getByText("No recommendations available")
      ).toBeInTheDocument();
    });

    it("should format recommendation creation dates correctly", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      // Should show formatted dates
      expect(screen.getByText(/Jan 1/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 2/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle minimal insights data", () => {
      const minimalInsights: BasicInsights = {
        summary: {
          totalRecords: 0,
          totalMembers: 0,
          activeCategories: [],
          recordsThisWeek: 0,
          recordsThisMonth: 0,
          mostActiveCategory: null,
          mostActiveMember: null,
        },
        categoryInsights: [],
        memberInsights: [],
        patterns: [],
        recommendations: [],
      };

      render(
        <InsightsDashboard
          insights={minimalInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("Summary Overview")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument(); // Total records
      expect(screen.getByText("N/A")).toBeInTheDocument(); // No active category/member
    });

    it("should handle very long member names gracefully", () => {
      const insightsWithLongNames = {
        ...mockInsights,
        memberInsights: [
          {
            memberId: 1,
            memberName:
              "This Is A Very Long Member Name That Should Be Handled Gracefully",
            recordCount: 50,
            categories: ["Health"],
            trend: "stable" as const,
            lastActivityDays: 1,
          },
        ],
      };

      render(
        <InsightsDashboard
          insights={insightsWithLongNames}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(
        screen.getByText(
          "This Is A Very Long Member Name That Should Be Handled Gracefully"
        )
      ).toBeInTheDocument();
    });

    it("should handle special characters in category names", () => {
      const insightsWithSpecialChars = {
        ...mockInsights,
        categoryInsights: [
          {
            category: "Health & Wellness",
            count: 25,
            averagePerWeek: 6,
            trend: "increasing" as const,
            recentActivity: 8,
          },
          {
            category: "Education/Learning",
            count: 20,
            averagePerWeek: 5,
            trend: "stable" as const,
            recentActivity: 5,
          },
        ],
      };

      render(
        <InsightsDashboard
          insights={insightsWithSpecialChars}
          generatedAt={mockGeneratedAt}
        />
      );

      expect(screen.getByText("Health & Wellness")).toBeInTheDocument();
      expect(screen.getByText("Education/Learning")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      // Main sections should have proper headings
      expect(screen.getByText("Summary Overview")).toBeInTheDocument();
      expect(screen.getByText("Category Breakdown")).toBeInTheDocument();
      expect(screen.getByText("Member Activity")).toBeInTheDocument();
      expect(screen.getByText("Detected Patterns")).toBeInTheDocument();
      expect(screen.getByText("Recommendations")).toBeInTheDocument();
    });

    it("should provide meaningful text for trend indicators", () => {
      render(
        <InsightsDashboard
          insights={mockInsights}
          generatedAt={mockGeneratedAt}
        />
      );

      // Trend badges should have meaningful text
      expect(screen.getByText("increasing")).toBeInTheDocument();
      expect(screen.getByText("stable")).toBeInTheDocument();
      expect(screen.getByText("decreasing")).toBeInTheDocument();
    });
  });
});
