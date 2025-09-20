import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "~/lib/env.server";
import { users, records, recordTypes } from "~/db/schema";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { analyticsLogger } from "~/lib/logger";

export interface AIInsight {
  id: string;
  type: "growth" | "health" | "behavior" | "development" | "prediction";
  category: string;
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  importance: "critical" | "high" | "medium" | "low";
  data: {
    trend: "increasing" | "decreasing" | "stable" | "cyclical";
    timeframe: string;
    dataPoints: number;
    correlations?: Array<{
      factor: string;
      strength: number;
      direction: "positive" | "negative";
    }>;
    predictions?: Array<{
      metric: string;
      value: number;
      timeframe: string;
      confidence: number;
    }>;
  };
  recommendations: string[];
  chartData?: Array<{
    date: string;
    value: number;
    category?: string;
    member?: string;
  }>;
  createdAt: Date;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  category?: string;
  member?: string;
  metadata?: Record<string, unknown>;
}

export interface CorrelationAnalysis {
  variable1: string;
  variable2: string;
  correlation: number;
  significance: number;
  sampleSize: number;
  description: string;
}

export class AIAnalyticsService {
  constructor(
    private db: DrizzleD1Database<any>,
    private ai: any,
    private householdId: string
  ) {}

  /**
   * Generate AI-powered insights using Cloudflare AI
   */
  async generateAdvancedInsights(): Promise<AIInsight[]> {
    try {
      analyticsLogger.info("Generating AI-powered insights", {
        householdId: this.householdId,
      });

      // Get raw data for analysis
      const rawData = await this.collectAnalyticsData();

      if (!rawData.records.length) {
        analyticsLogger.info("No data available for AI analysis");
        return [];
      }

      // Process data with AI for pattern detection
      const insights: AIInsight[] = [];

      // 1. Growth pattern analysis
      const growthInsights = await this.analyzeGrowthPatterns(rawData);
      insights.push(...growthInsights);

      // 2. Health pattern analysis
      const healthInsights = await this.analyzeHealthPatterns(rawData);
      insights.push(...healthInsights);

      // 3. Behavioral pattern analysis
      const behaviorInsights = await this.analyzeBehavioralPatterns(rawData);
      insights.push(...behaviorInsights);

      // 4. Correlation analysis
      const correlationInsights = await this.analyzeCorrelations(rawData);
      insights.push(...correlationInsights);

      // 5. Predictive insights
      const predictiveInsights = await this.generatePredictiveInsights(rawData);
      insights.push(...predictiveInsights);

      analyticsLogger.info(`Generated ${insights.length} AI insights`);
      return insights;
    } catch (error) {
      analyticsLogger.error("Error generating AI insights", { error });
      return [];
    }
  }

  /**
   * Analyze growth patterns using AI
   */
  private async analyzeGrowthPatterns(data: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Find growth-related records (height, weight, development milestones)
    const growthRecords = data.records.filter((record: any) => {
      const category = record.recordType?.category?.toLowerCase() || "";
      return (
        category.includes("growth") ||
        category.includes("health") ||
        category.includes("development")
      );
    });

    if (growthRecords.length < 5) return insights;

    // Group by member and analyze trends
    const memberGroups = this.groupRecordsByMember(growthRecords);

    for (const [memberId, records] of Object.entries(memberGroups)) {
      const memberRecords = records as any[];
      const memberName = memberRecords[0]?.createdBy?.firstName || "Member";

      // Analyze numerical data for trends
      const numericalFields = this.extractNumericalFields(memberRecords);

      for (const [fieldName, values] of Object.entries(numericalFields)) {
        const trend = this.calculateTrend(values as number[]);

        if (Math.abs(trend.slope) > 0.1) {
          // Significant trend
          const chartData = this.createChartData(values as any[], fieldName);

          insights.push({
            id: `growth-${memberId}-${fieldName}`,
            type: "growth",
            category: "Physical Development",
            title: `${memberName}'s ${fieldName} Trend`,
            description: `${fieldName} is ${trend.slope > 0 ? "increasing" : "decreasing"} at a rate of ${Math.abs(trend.slope).toFixed(2)} units per week`,
            confidence:
              trend.r2 > 0.7 ? "high" : trend.r2 > 0.4 ? "medium" : "low",
            importance: Math.abs(trend.slope) > 0.5 ? "high" : "medium",
            data: {
              trend: trend.slope > 0 ? "increasing" : "decreasing",
              timeframe: "4 weeks",
              dataPoints: values.length,
            },
            recommendations: this.generateGrowthRecommendations(
              fieldName,
              trend
            ),
            chartData,
            createdAt: new Date(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Analyze health patterns using AI text analysis
   */
  private async analyzeHealthPatterns(data: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Get health-related records
    const healthRecords = data.records.filter((record: any) => {
      const category = record.recordType?.category?.toLowerCase() || "";
      return (
        category.includes("health") ||
        category.includes("medical") ||
        category.includes("symptom")
      );
    });

    if (healthRecords.length < 3) return insights;

    try {
      // Use AI to analyze health patterns
      const healthText = healthRecords
        .map((record: any) => {
          const data =
            typeof record.data === "string"
              ? JSON.parse(record.data)
              : record.data;
          return Object.values(data).join(" ");
        })
        .join("\n");

      const prompt = `Analyze the following health records for patterns, concerns, and recommendations:

${healthText}

Identify:
1. Recurring symptoms or conditions
2. Potential correlations between symptoms and activities
3. Early warning signs that need attention
4. Positive health trends

Provide insights in a structured format focusing on actionable recommendations.`;

      if (this.ai && this.ai.run) {
        console.log(`🤖 Making AI call for health analysis`, {
          householdId: this.householdId,
          recordCount: healthRecords.length,
          promptLength: prompt.length,
        });

        const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
        });

        console.log(`✅ AI call completed for health analysis`, {
          householdId: this.householdId,
          responseLength: response.response?.length || 0,
          hasResponse: !!response.response,
        });

        const aiAnalysis = response.response || "";

        insights.push({
          id: `health-pattern-${Date.now()}`,
          type: "health",
          category: "Health Analysis",
          title: "AI Health Pattern Analysis",
          description: aiAnalysis,
          confidence: "medium",
          importance: "high",
          data: {
            trend: "stable",
            timeframe: "recent",
            dataPoints: healthRecords.length,
          },
          recommendations: this.extractRecommendationsFromText(aiAnalysis),
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`❌ Error in AI health pattern analysis`, {
        householdId: this.householdId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        hasAI: !!this.ai,
        aiRunMethod: !!this.ai?.run,
      });
      analyticsLogger.error("Error in AI health pattern analysis", { error });
    }

    return insights;
  }

  /**
   * Analyze behavioral patterns
   */
  private async analyzeBehavioralPatterns(data: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Look for sleep, mood, activity patterns
    const behaviorRecords = data.records.filter((record: any) => {
      const category = record.recordType?.category?.toLowerCase() || "";
      return (
        category.includes("behavior") ||
        category.includes("mood") ||
        category.includes("sleep") ||
        category.includes("activity")
      );
    });

    if (behaviorRecords.length < 10) return insights;

    // Analyze sleep patterns
    const sleepData = this.extractSleepData(behaviorRecords);
    if (sleepData.length > 5) {
      const sleepInsight = this.analyzeSleepPatterns(sleepData);
      if (sleepInsight) insights.push(sleepInsight);
    }

    // Analyze mood patterns
    const moodData = this.extractMoodData(behaviorRecords);
    if (moodData.length > 5) {
      const moodInsight = this.analyzeMoodPatterns(moodData);
      if (moodInsight) insights.push(moodInsight);
    }

    return insights;
  }

  /**
   * Perform correlation analysis between different metrics
   */
  private async analyzeCorrelations(data: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Extract time-series data for different metrics
    const metrics = this.extractTimeSeriesMetrics(data.records);
    const correlations = this.calculateCorrelations(metrics);

    // Find significant correlations
    const significantCorrelations = correlations.filter(
      corr => Math.abs(corr.correlation) > 0.6 && corr.significance < 0.05
    );

    for (const correlation of significantCorrelations) {
      insights.push({
        id: `correlation-${correlation.variable1}-${correlation.variable2}`,
        type: "behavior",
        category: "Pattern Analysis",
        title: `${correlation.variable1} and ${correlation.variable2} Correlation`,
        description: correlation.description,
        confidence: Math.abs(correlation.correlation) > 0.8 ? "high" : "medium",
        importance: "medium",
        data: {
          trend: "stable",
          timeframe: "recent weeks",
          dataPoints: correlation.sampleSize,
          correlations: [
            {
              factor: correlation.variable2,
              strength: Math.abs(correlation.correlation),
              direction: correlation.correlation > 0 ? "positive" : "negative",
            },
          ],
        },
        recommendations: this.generateCorrelationRecommendations(correlation),
        createdAt: new Date(),
      });
    }

    return insights;
  }

  /**
   * Generate predictive insights
   */
  private async generatePredictiveInsights(data: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Simple trend-based predictions
    const memberGroups = this.groupRecordsByMember(data.records);

    for (const [memberId, records] of Object.entries(memberGroups)) {
      const memberRecords = records as any[];
      const memberName = memberRecords[0]?.createdBy?.firstName || "Member";

      const numericalFields = this.extractNumericalFields(memberRecords);

      for (const [fieldName, values] of Object.entries(numericalFields)) {
        const trend = this.calculateTrend(values as number[]);

        if (trend.r2 > 0.6 && values.length > 5) {
          // Strong predictive power
          const prediction = this.predictNextValue(values as number[], trend);

          insights.push({
            id: `prediction-${memberId}-${fieldName}`,
            type: "prediction",
            category: "Predictive Analysis",
            title: `${memberName}'s ${fieldName} Prediction`,
            description: `Based on current trends, ${fieldName} is predicted to be ${prediction.value.toFixed(2)} in the next week`,
            confidence: trend.r2 > 0.8 ? "high" : "medium",
            importance: "medium",
            data: {
              trend: trend.slope > 0 ? "increasing" : "decreasing",
              timeframe: "next week",
              dataPoints: values.length,
              predictions: [
                {
                  metric: fieldName,
                  value: prediction.value,
                  timeframe: "1 week",
                  confidence: trend.r2,
                },
              ],
            },
            recommendations: [
              `Monitor ${fieldName} closely to validate prediction`,
            ],
            createdAt: new Date(),
          });
        }
      }
    }

    return insights;
  }

  // Helper methods
  private async collectAnalyticsData() {
    const [recordsData, usersData, recordTypesData] = await Promise.all([
      this.db
        .select()
        .from(records)
        .leftJoin(users, eq(records.memberId, users.id))
        .leftJoin(recordTypes, eq(records.recordTypeId, recordTypes.id))
        .where(eq(users.householdId, this.householdId))
        .orderBy(desc(records.createdAt))
        .limit(1000),

      this.db
        .select()
        .from(users)
        .where(eq(users.householdId, this.householdId)),

      this.db
        .select()
        .from(recordTypes)
        .where(eq(recordTypes.householdId, this.householdId)),
    ]);

    return {
      records: recordsData,
      users: usersData,
      recordTypes: recordTypesData,
    };
  }

  private groupRecordsByMember(records: any[]): Record<string, any[]> {
    return records.reduce(
      (groups, record) => {
        const memberId = record.records?.memberId;
        if (!groups[memberId]) groups[memberId] = [];
        groups[memberId].push(record);
        return groups;
      },
      {} as Record<string, any[]>
    );
  }

  private extractNumericalFields(records: any[]): Record<string, number[]> {
    const fields: Record<string, number[]> = {};

    records.forEach(record => {
      const data =
        typeof record.data === "string" ? JSON.parse(record.data) : record.data;

      Object.entries(data).forEach(([key, value]) => {
        if (
          typeof value === "number" ||
          (typeof value === "string" && !isNaN(Number(value)))
        ) {
          if (!fields[key]) fields[key] = [];
          fields[key].push(Number(value));
        }
      });
    });

    return fields;
  }

  private calculateTrend(values: number[]): { slope: number; r2: number } {
    if (values.length < 2) return { slope: 0, r2: 0 };

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const prediction = slope * x[i] + (yMean - slope * (sumX / n));
      return sum + Math.pow(yi - prediction, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, r2 };
  }

  private createChartData(
    values: Array<{ date: string; value: number }>,
    fieldName: string
  ): ChartDataPoint[] {
    return values.map(item => ({
      date: item.date,
      value: item.value,
      category: fieldName,
    }));
  }

  private generateGrowthRecommendations(
    fieldName: string,
    trend: any
  ): string[] {
    const recommendations = [];

    if (trend.slope > 0) {
      recommendations.push(
        `Continue current activities that support ${fieldName} growth`
      );
      recommendations.push(`Monitor ${fieldName} progress regularly`);
    } else {
      recommendations.push(
        `Consider consulting with healthcare provider about ${fieldName} trends`
      );
      recommendations.push(
        `Review diet and activity patterns that might affect ${fieldName}`
      );
    }

    return recommendations;
  }

  private extractRecommendationsFromText(text: string): string[] {
    // Simple extraction - in production, you'd use more sophisticated NLP
    const sentences = text.split(". ");
    return sentences
      .filter(
        sentence =>
          sentence.toLowerCase().includes("recommend") ||
          sentence.toLowerCase().includes("should") ||
          sentence.toLowerCase().includes("consider")
      )
      .slice(0, 3);
  }

  private extractSleepData(
    records: any[]
  ): Array<{ date: string; hours: number }> {
    return records
      .filter(record => {
        const data =
          typeof record.data === "string"
            ? JSON.parse(record.data)
            : record.data;
        return data.hours || data.sleep_hours || data.sleepHours;
      })
      .map(record => {
        const data =
          typeof record.data === "string"
            ? JSON.parse(record.data)
            : record.data;
        return {
          date: record.createdAt,
          hours: data.hours || data.sleep_hours || data.sleepHours,
        };
      });
  }

  private analyzeSleepPatterns(
    sleepData: Array<{ date: string; hours: number }>
  ): AIInsight | null {
    const hours = sleepData.map(d => d.hours);
    const avgHours = hours.reduce((a, b) => a + b, 0) / hours.length;
    const trend = this.calculateTrend(hours);

    return {
      id: `sleep-pattern-${Date.now()}`,
      type: "behavior",
      category: "Sleep Analysis",
      title: "Sleep Pattern Analysis",
      description: `Average sleep: ${avgHours.toFixed(1)} hours. Sleep duration is ${trend.slope > 0 ? "increasing" : "decreasing"} over time.`,
      confidence: trend.r2 > 0.5 ? "high" : "medium",
      importance: avgHours < 7 || avgHours > 9 ? "high" : "medium",
      data: {
        trend: trend.slope > 0 ? "increasing" : "decreasing",
        timeframe: "recent weeks",
        dataPoints: sleepData.length,
      },
      recommendations: this.generateSleepRecommendations(avgHours, trend),
      chartData: sleepData.map(d => ({
        date: d.date,
        value: d.hours,
        category: "Sleep Hours",
      })),
      createdAt: new Date(),
    };
  }

  private extractMoodData(
    records: any[]
  ): Array<{ date: string; mood: number }> {
    return records
      .filter(record => {
        const data =
          typeof record.data === "string"
            ? JSON.parse(record.data)
            : record.data;
        return data.mood || data.mood_rating || data.moodRating;
      })
      .map(record => {
        const data =
          typeof record.data === "string"
            ? JSON.parse(record.data)
            : record.data;
        return {
          date: record.createdAt,
          mood: data.mood || data.mood_rating || data.moodRating,
        };
      });
  }

  private analyzeMoodPatterns(
    moodData: Array<{ date: string; mood: number }>
  ): AIInsight | null {
    const moods = moodData.map(d => d.mood);
    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    const trend = this.calculateTrend(moods);

    return {
      id: `mood-pattern-${Date.now()}`,
      type: "behavior",
      category: "Mood Analysis",
      title: "Mood Pattern Analysis",
      description: `Average mood rating: ${avgMood.toFixed(1)}/10. Mood trends are ${trend.slope > 0 ? "improving" : "declining"} over time.`,
      confidence: trend.r2 > 0.4 ? "high" : "medium",
      importance: avgMood < 6 ? "high" : "medium",
      data: {
        trend: trend.slope > 0 ? "increasing" : "decreasing",
        timeframe: "recent weeks",
        dataPoints: moodData.length,
      },
      recommendations: this.generateMoodRecommendations(avgMood, trend),
      chartData: moodData.map(d => ({
        date: d.date,
        value: d.mood,
        category: "Mood Rating",
      })),
      createdAt: new Date(),
    };
  }

  private extractTimeSeriesMetrics(
    records: any[]
  ): Record<string, Array<{ date: string; value: number }>> {
    // Implementation would extract various metrics over time
    return {};
  }

  private calculateCorrelations(
    metrics: Record<string, Array<{ date: string; value: number }>>
  ): CorrelationAnalysis[] {
    // Implementation would calculate correlations between different metrics
    return [];
  }

  private generateCorrelationRecommendations(
    correlation: CorrelationAnalysis
  ): string[] {
    return [
      `Monitor the relationship between ${correlation.variable1} and ${correlation.variable2}`,
    ];
  }

  private predictNextValue(
    values: number[],
    trend: any
  ): { value: number; confidence: number } {
    const nextIndex = values.length;
    const lastValue = values[values.length - 1];
    const predictedValue = lastValue + trend.slope;

    return {
      value: predictedValue,
      confidence: trend.r2,
    };
  }

  private generateSleepRecommendations(avgHours: number, trend: any): string[] {
    const recommendations = [];

    if (avgHours < 7) {
      recommendations.push("Consider establishing an earlier bedtime routine");
      recommendations.push("Limit screen time before bed");
    } else if (avgHours > 9) {
      recommendations.push(
        "Evaluate sleep quality - long sleep might indicate disrupted sleep"
      );
    }

    if (trend.slope < 0) {
      recommendations.push(
        "Address factors that might be reducing sleep duration"
      );
    }

    return recommendations;
  }

  private generateMoodRecommendations(avgMood: number, trend: any): string[] {
    const recommendations = [];

    if (avgMood < 6) {
      recommendations.push("Consider activities that boost mood");
      recommendations.push("Monitor for patterns that affect mood");
    }

    if (trend.slope < 0) {
      recommendations.push("Address factors contributing to declining mood");
    } else {
      recommendations.push("Continue activities that support positive mood");
    }

    return recommendations;
  }
}
