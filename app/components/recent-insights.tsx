import React from "react";
import { Link } from "react-router";
import type { AIInsight } from "~/lib/ai-analytics-service";

interface RecentInsightsProps {
  insights: AIInsight[];
  canViewAnalytics: boolean;
}

export function RecentInsights({
  insights,
  canViewAnalytics,
}: RecentInsightsProps) {
  if (!canViewAnalytics) {
    return null;
  }

  // Show only the most recent 2-3 insights
  const recentInsights = insights.slice(0, 3);

  if (recentInsights.length === 0) {
    return (
      <div className="mt-8 mb-8">
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-400">
              🧠 Recent Insights
            </h3>
            <Link
              to="/insights"
              className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
            >
              View All →
            </Link>
          </div>
          <p className="text-slate-400 text-sm">
            No insights available yet. Generate your first AI insights to see
            household patterns and recommendations.
          </p>
          <Link
            to="/insights"
            className="inline-block mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            Generate Insights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-8">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-400">
            🧠 Recent Insights
          </h3>
          <Link
            to="/insights"
            className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="space-y-3">
          {recentInsights.map(insight => (
            <div
              key={insight.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
                      {insight.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        insight.importance === "high"
                          ? "bg-red-600/20 text-red-300"
                          : insight.importance === "medium"
                            ? "bg-yellow-600/20 text-yellow-300"
                            : "bg-green-600/20 text-green-300"
                      }`}
                    >
                      {insight.importance}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-200 mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {insight.description}
                  </p>
                  {insight.recommendations &&
                    insight.recommendations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-purple-300 font-medium">
                          💡 {insight.recommendations[0]}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/insights"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            View All Insights
          </Link>
        </div>
      </div>
    </div>
  );
}
