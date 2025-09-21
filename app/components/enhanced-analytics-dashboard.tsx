import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { UnifiedSelect } from "~/components/ui/select-unified";
import {
  InteractiveChart,
  InsightVisualization,
  DashboardMetrics,
} from "~/components/ui/interactive-charts";
import type { BasicInsights } from "~/lib/analytics-service";
import type { AIInsight, ChartDataPoint } from "~/lib/ai-analytics-service";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Activity,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EnhancedAnalyticsDashboardProps {
  insights: BasicInsights;
  aiInsights: AIInsight[];
  generatedAt: string;
  cached?: boolean;
  _householdId: string;
}

interface DashboardView {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

const dashboardViews: DashboardView[] = [
  {
    id: "overview",
    name: "Overview",
    icon: Activity,
    description: "High-level insights and trends",
  },
  {
    id: "growth",
    name: "Growth & Development",
    icon: TrendingUp,
    description: "Physical and developmental progress",
  },
  {
    id: "health",
    name: "Health Patterns",
    icon: Activity,
    description: "Health trends and medical insights",
  },
  {
    id: "behavior",
    name: "Behavior Analysis",
    icon: Brain,
    description: "Sleep, mood, and behavior patterns",
  },
  {
    id: "predictions",
    name: "Predictive Insights",
    icon: Sparkles,
    description: "AI-powered predictions and forecasts",
  },
];

export const EnhancedAnalyticsDashboard: React.FC<
  EnhancedAnalyticsDashboardProps
> = ({ insights, aiInsights, generatedAt, cached = false, _householdId }) => {
  const [currentView, setCurrentView] = useState("overview");
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMember, setSelectedMember] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // AI insights are now passed as props from the route loader

  // Generate chart data from real insights data
  const generateChartData = useMemo(() => {
    return (category: string): ChartDataPoint[] => {
      // Try to find AI insights with chart data for this category
      const relevantAIInsights = aiInsights.filter(
        insight =>
          insight.chartData &&
          (insight.type === category ||
            insight.category.toLowerCase().includes(category.toLowerCase()))
      );

      if (relevantAIInsights.length > 0 && relevantAIInsights[0].chartData) {
        return relevantAIInsights[0].chartData;
      }

      // Fallback to category insights data
      const categoryData = insights.categoryInsights
        .filter(cat =>
          cat.category.toLowerCase().includes(category.toLowerCase())
        )
        .map((cat, index) => ({
          date: new Date(
            Date.now() - index * 24 * 60 * 60 * 1000
          ).toISOString(),
          value: cat.count,
          category: cat.category,
          metadata: {
            trend: cat.trend,
            averagePerWeek: cat.averagePerWeek,
            lastRecordDate: cat.lastRecordDate,
          },
        }));

      if (categoryData.length > 0) {
        return categoryData;
      }

      // Final fallback: create data points from member insights if no category data
      return insights.memberInsights.map((member, index) => ({
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        value: member.recordCount,
        category: category,
        member: member.memberName,
        metadata: {
          memberId: member.memberId,
          trend: member.trend,
          categories: member.categories,
        },
      }));
    };
  }, [aiInsights, insights]);

  const timeRangeOptions = [
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last 3 Months" },
    { value: "180", label: "Last 6 Months" },
  ];

  const memberOptions = [
    { value: "all", label: "All Members" },
    ...insights.memberInsights.map(member => ({
      value: member.memberId.toString(),
      label: member.memberName,
    })),
  ];

  const currentViewData = dashboardViews.find(view => view.id === currentView)!;
  const viewInsights = aiInsights.filter(insight => {
    if (currentView === "overview") return true;
    return (
      insight.type === currentView ||
      insight.category.toLowerCase().includes(currentView)
    );
  });

  const renderOverviewView = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetrics
          data={generateChartData("activity")}
          title="Activity Level"
          timeframe="Daily Average"
        />
        <DashboardMetrics
          data={generateChartData("sleep")}
          title="Sleep Quality"
          timeframe="Hours per Night"
        />
        <DashboardMetrics
          data={generateChartData("mood")}
          title="Mood Rating"
          timeframe="1-10 Scale"
        />
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold text-purple-400">
              {aiInsights.length}
            </CardTitle>
            <CardDescription className="text-slate-300">
              AI Insights Generated
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChart
          data={generateChartData("sleep")}
          title="Sleep Patterns"
          description="Daily sleep hours over time"
          type="line"
          height={300}
        />
        <InteractiveChart
          data={generateChartData("mood")}
          title="Mood Trends"
          description="Daily mood ratings"
          type="area"
          height={300}
        />
      </div>

      {/* Recent Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Latest AI Insights
        </h3>
        {viewInsights.slice(0, 3).map(insight => (
          <InsightVisualization key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );

  const renderSpecializedView = () => (
    <div className="space-y-6">
      {/* Category-specific charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChart
          data={generateChartData(currentView)}
          title={`${currentViewData.name} Trends`}
          description={`${currentViewData.description} over time`}
          type="line"
          height={300}
        />
        <InteractiveChart
          data={generateChartData(currentView)}
          title={`${currentViewData.name} Distribution`}
          description="Category breakdown"
          type="bar"
          height={300}
        />
      </div>

      {/* Specialized insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <currentViewData.icon className="w-5 h-5 text-blue-400" />
          {currentViewData.name} Insights
        </h3>
        {viewInsights.length > 0 ? (
          viewInsights.map(insight => (
            <InsightVisualization key={insight.id} insight={insight} />
          ))
        ) : (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <currentViewData.icon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-200 mb-2">
                No {currentViewData.name} Insights Available
              </h4>
              <p className="text-slate-400 mb-4">
                Add more data to generate AI insights for{" "}
                {currentViewData.description.toLowerCase()}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" />
              AI-Powered Analytics Dashboard
            </h2>
            <p className="text-slate-400">
              Advanced insights powered by Cloudflare AI • Generated{" "}
              {new Date(generatedAt).toLocaleDateString()}
              {cached && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Cached
                </Badge>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <UnifiedSelect
              value={timeRange}
              onChange={setTimeRange}
              options={timeRangeOptions}
              placeholder="Time Range"
            />
            <UnifiedSelect
              value={selectedMember}
              onChange={setSelectedMember}
              options={memberOptions}
              placeholder="Member"
            />
            {/* TODO: Implement export functionality
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            */}
          </div>
        </div>

        {/* Advanced Controls Toggle */}
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-slate-400 hover:text-slate-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    AI Model Confidence
                  </label>
                  <UnifiedSelect
                    value="medium"
                    onChange={() => {}}
                    options={[
                      { value: "high", label: "High Confidence Only" },
                      { value: "medium", label: "Medium & High" },
                      { value: "all", label: "All Insights" },
                    ]}
                    placeholder="Confidence Level"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Analysis Depth
                  </label>
                  <UnifiedSelect
                    value="standard"
                    onChange={() => {}}
                    options={[
                      { value: "basic", label: "Basic Patterns" },
                      { value: "standard", label: "Standard Analysis" },
                      { value: "deep", label: "Deep Learning" },
                    ]}
                    placeholder="Analysis Type"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Update Frequency
                  </label>
                  <UnifiedSelect
                    value="daily"
                    onChange={() => {}}
                    options={[
                      { value: "realtime", label: "Real-time" },
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                    ]}
                    placeholder="Update Schedule"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Navigation */}
      <div className="flex flex-wrap gap-2">
        {dashboardViews.map(view => (
          <Button
            key={view.id}
            variant={currentView === view.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentView(view.id)}
            className={`flex items-center gap-2 ${
              currentView === view.id
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-slate-800/50 hover:bg-slate-700/50"
            }`}
          >
            <view.icon className="w-4 h-4" />
            {view.name}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="min-h-[600px]">
        {currentView === "overview"
          ? renderOverviewView()
          : renderSpecializedView()}
      </div>

      {/* AI Status Footer */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  AI Analysis Status: Active
                </p>
                <p className="text-xs text-slate-400">
                  Powered by Cloudflare AI • {aiInsights.length} insights
                  generated • Last updated {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/30"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI Enhanced
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
