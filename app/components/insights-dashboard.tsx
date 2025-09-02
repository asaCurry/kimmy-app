import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { BasicInsights } from "~/lib/analytics-service";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb,
  Target,
  Activity,
} from "lucide-react";

interface InsightsDashboardProps {
  insights: BasicInsights;
  generatedAt: string;
  cached?: boolean;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  insights,
  generatedAt,
  cached = false,
}) => {
  const {
    summary,
    categoryInsights,
    memberInsights,
    patterns,
    recommendations,
  } = insights;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTrendIcon = (trend: "increasing" | "decreasing" | "stable") => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case "health":
        return <Activity className="w-5 h-5 text-red-400" />;
      case "activity":
        return <Users className="w-5 h-5 text-blue-400" />;
      case "growth":
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case "data_entry":
        return <FileText className="w-5 h-5 text-yellow-400" />;
      default:
        return <Target className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with generation info */}
      <div className="flex justify-between items-center text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Generated {formatDate(generatedAt)}</span>
          {cached && (
            <Badge variant="outline" className="text-xs">
              Cached
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold text-blue-400">
              {summary.totalRecords}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Total Records
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold text-green-400">
              {summary.totalMembers}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Household Members
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold text-purple-400">
              {summary.recordsThisWeek}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Records This Week
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold text-orange-400">
              {summary.activeCategories.length}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Active Categories
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Insights */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Category Insights
            </CardTitle>
            <CardDescription>Record activity by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryInsights.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No category data available
              </p>
            ) : (
              categoryInsights.slice(0, 5).map(category => (
                <div
                  key={category.category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getTrendIcon(category.trend)}
                    <div>
                      <p className="font-medium text-slate-200">
                        {category.category}
                      </p>
                      <p className="text-sm text-slate-400">
                        {category.count} records • {category.averagePerWeek}
                        /week avg
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {category.trend}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Member Insights */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Member Activity
            </CardTitle>
            <CardDescription>
              Record activity by household member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memberInsights.length === 0 ? (
              <p className="text-slate-400 text-sm">No member data available</p>
            ) : (
              memberInsights.map(member => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getTrendIcon(member.trend)}
                    <div>
                      <p className="font-medium text-slate-200">
                        {member.memberName}
                      </p>
                      <p className="text-sm text-slate-400">
                        {member.recordCount} records •{" "}
                        {member.categories.length} categories
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {member.trend}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patterns Detected */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-400" />
              Patterns Detected
            </CardTitle>
            <CardDescription>
              Insights discovered from your household data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patterns.map((pattern, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                {getPatternIcon(pattern.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-slate-200">
                      {pattern.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {pattern.confidence} confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {pattern.description}
                  </p>
                  {pattern.metadata && (
                    <div className="mt-2 text-xs text-slate-500">
                      <pre>{JSON.stringify(pattern.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Suggested actions to improve your household management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-600"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-200">{rec.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={getPriorityColor(rec.priority || "medium")}
                      >
                        {rec.priority || "medium"}
                      </Badge>
                      {rec.status === "active" && (
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">
                    {rec.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-slate-400"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {summary.totalRecords === 0 && (
        <Card className="text-center py-8 border-slate-700">
          <CardContent>
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              No Data to Analyze
            </h3>
            <p className="text-slate-400 mb-4">
              Start by adding some records to your household to see insights and
              patterns.
            </p>
            <Button variant="outline">Add Your First Record</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
