import React, { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { UnifiedSelect } from "./select-unified";
import type { ChartDataPoint, AIInsight } from "~/lib/ai-analytics-service";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  ZoomIn,
  Download,
  Filter,
} from "lucide-react";

interface InteractiveChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  type?: "line" | "area" | "bar" | "scatter" | "pie" | "radar";
  height?: number;
  showControls?: boolean;
  colors?: string[];
  onDataPointClick?: (data: ChartDataPoint) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  title,
  description,
  type = "line",
  height = 300,
  showControls = true,
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  onDataPointClick,
}) => {
  const [chartType, setChartType] = useState(type);
  const [timeRange, setTimeRange] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter data based on selections
  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    if (timeRange !== "all") {
      const days = parseInt(timeRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(item => new Date(item.date) >= cutoff);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    return filtered;
  }, [data, timeRange, selectedCategory]);

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const cats = Array.from(
      new Set(data.map(item => item.category).filter(Boolean))
    );
    return [
      { value: "all", label: "All Categories" },
      ...cats.map(cat => ({ value: cat!, label: cat! })),
    ];
  }, [data]);

  const timeRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last 3 Months" },
  ];

  const chartTypeOptions = [
    { value: "line", label: "Line Chart", icon: LineChartIcon },
    { value: "area", label: "Area Chart", icon: Activity },
    { value: "bar", label: "Bar Chart", icon: BarChart3 },
    { value: "scatter", label: "Scatter Plot", icon: Activity },
    { value: "pie", label: "Pie Chart", icon: PieChartIcon },
  ];

  const formatTooltipLabel = (label: string) => {
    return new Date(label).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tickFormatter={value =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#f9fafb",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: colors[0] }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tickFormatter={value =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#f9fafb",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fill={`${colors[0]}20`}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tickFormatter={value =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#f9fafb",
              }}
            />
            <Bar dataKey="value" fill={colors[0]} />
          </BarChart>
        );

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              type="category"
              tickFormatter={value =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#f9fafb",
              }}
            />
            <Scatter dataKey="value" fill={colors[0]} />
          </ScatterChart>
        );

      case "pie":
        const pieData = React.useMemo(() => {
          const categoryTotals = filteredData.reduce(
            (acc, item) => {
              const cat = item.category || "Other";
              acc[cat] = (acc[cat] || 0) + item.value;
              return acc;
            },
            {} as Record<string, number>
          );

          return Object.entries(categoryTotals).map(([name, value]) => ({
            name,
            value,
          }));
        }, [filteredData]);

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent as number) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#f9fafb",
              }}
            />
          </PieChart>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-200">
              {React.createElement(
                chartTypeOptions.find(opt => opt.value === chartType)?.icon ||
                  LineChartIcon,
                { className: "w-5 h-5 text-blue-400" }
              )}
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-slate-400">
                {description}
              </CardDescription>
            )}
          </div>
          {showControls && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <ZoomIn className="w-3 h-3 mr-1" />
                Full View
              </Button>
            </div>
          )}
        </div>

        {showControls && (
          <div className="flex flex-wrap gap-2 mt-4">
            <UnifiedSelect
              value={chartType}
              onChange={value => setChartType(value as typeof chartType)}
              options={chartTypeOptions}
              placeholder="Chart Type"
            />
            <UnifiedSelect
              value={timeRange}
              onChange={setTimeRange}
              options={timeRangeOptions}
              placeholder="Time Range"
            />
            <UnifiedSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories}
              placeholder="Category"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="h-full" style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Chart Statistics */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <span>Data Points:</span>
            <Badge variant="outline" className="text-xs">
              {filteredData.length}
            </Badge>
          </div>
          {filteredData.length > 0 && (
            <>
              <div className="flex items-center gap-1">
                <span>Latest:</span>
                <Badge variant="outline" className="text-xs">
                  {filteredData[filteredData.length - 1]?.value.toFixed(2)}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span>Average:</span>
                <Badge variant="outline" className="text-xs">
                  {(
                    filteredData.reduce((sum, item) => sum + item.value, 0) /
                    filteredData.length
                  ).toFixed(2)}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface InsightVisualizationProps {
  insight: AIInsight;
  onDismiss?: () => void;
  onMarkComplete?: () => void;
}

export const InsightVisualization: React.FC<InsightVisualizationProps> = ({
  insight,
  onDismiss,
  onMarkComplete,
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "growth":
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case "health":
        return <Activity className="w-5 h-5 text-red-400" />;
      case "behavior":
        return <BarChart3 className="w-5 h-5 text-blue-400" />;
      case "prediction":
        return <LineChartIcon className="w-5 h-5 text-purple-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getInsightIcon(insight.type)}
            <div>
              <CardTitle className="text-slate-200 mb-2">
                {insight.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={getConfidenceColor(insight.confidence)}>
                  {insight.confidence} confidence
                </Badge>
                <Badge className={getImportanceColor(insight.importance)}>
                  {insight.importance} priority
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {insight.category}
                </Badge>
              </div>
              <CardDescription className="text-slate-400">
                {insight.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {onMarkComplete && (
              <Button size="sm" variant="outline" onClick={onMarkComplete}>
                Mark Complete
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart Visualization */}
        {insight.chartData && insight.chartData.length > 0 && (
          <InteractiveChart
            data={insight.chartData}
            title={`${insight.title} - Trend Analysis`}
            type="line"
            height={250}
            showControls={false}
          />
        )}

        {/* Data Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Key Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Trend:</span>
                <span className="text-slate-200 capitalize">
                  {insight.data.trend}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Timeframe:</span>
                <span className="text-slate-200">{insight.data.timeframe}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Data Points:</span>
                <span className="text-slate-200">
                  {insight.data.dataPoints}
                </span>
              </div>
            </div>
          </div>

          {/* Correlations */}
          {insight.data.correlations &&
            insight.data.correlations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-300">
                  Correlations
                </h4>
                <div className="space-y-2">
                  {insight.data.correlations.map((corr, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-400">{corr.factor}:</span>
                      <span
                        className={`${corr.direction === "positive" ? "text-green-400" : "text-red-400"}`}
                      >
                        {corr.direction} ({(corr.strength * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Predictions */}
          {insight.data.predictions && insight.data.predictions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">
                Predictions
              </h4>
              <div className="space-y-2">
                {insight.data.predictions.map((pred, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-400">{pred.metric}:</span>
                    <span className="text-slate-200">
                      {pred.value.toFixed(2)} (
                      {(pred.confidence * 100).toFixed(0)}% confidence)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {insight.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">
              Recommendations
            </h4>
            <ul className="space-y-2">
              {insight.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-400"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardMetricsProps {
  data: ChartDataPoint[];
  title: string;
  timeframe: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  data,
  title,
  timeframe,
}) => {
  const metrics = React.useMemo(() => {
    if (!data.length) return null;

    const values = data.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    const trendDirection =
      secondAvg > firstAvg ? "up" : secondAvg < firstAvg ? "down" : "stable";
    const trendPercentage =
      firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return {
      total,
      average,
      min,
      max,
      trendDirection,
      trendPercentage,
      dataPoints: data.length,
    };
  }, [data]);

  if (!metrics) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <p className="text-slate-400">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200">{title}</CardTitle>
        <CardDescription className="text-slate-400">
          {timeframe}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Average:</span>
              <span className="text-slate-200 font-medium">
                {metrics.average.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Total:</span>
              <span className="text-slate-200 font-medium">
                {metrics.total.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Min:</span>
              <span className="text-slate-200 font-medium">
                {metrics.min.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Max:</span>
              <span className="text-slate-200 font-medium">
                {metrics.max.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Trend:</span>
            <div className="flex items-center gap-2">
              {metrics.trendDirection === "up" ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : metrics.trendDirection === "down" ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Activity className="w-4 h-4 text-slate-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  metrics.trendDirection === "up"
                    ? "text-green-400"
                    : metrics.trendDirection === "down"
                      ? "text-red-400"
                      : "text-slate-400"
                }`}
              >
                {metrics.trendPercentage !== 0
                  ? `${Math.abs(metrics.trendPercentage).toFixed(1)}%`
                  : "Stable"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
