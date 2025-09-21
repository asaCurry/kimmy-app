import type { DrizzleD1Database } from "drizzle-orm/d1";
import { users, records, recordTypes } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { analyticsLogger } from "~/lib/logger";
import { promptRouter, type PromptStyleId } from "~/lib/prompts";

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
    private householdId: string,
    private promptStyle: PromptStyleId = "comprehensive"
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

      if (!rawData.records || !rawData.records.length) {
        analyticsLogger.info("No data available for AI analysis");
        return [];
      }

      console.log(
        `🤖 Starting AI analysis for household ${this.householdId} with ${rawData.records?.length || 0} records`
      );

      // Generate AI insights using compiled data and basic analytics
      const insights = await this.generateAIInsights(rawData);

      console.log(
        `✅ AI analysis completed: ${insights.length} insights generated`
      );
      return insights;
    } catch (error) {
      console.error(`❌ Error generating AI insights`, {
        householdId: this.householdId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorString: String(error),
      });
      analyticsLogger.error("Error generating AI insights", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
      });
      // Re-throw the error so the insights processor can handle it properly
      throw error;
    }
  }

  /**
   * Generate AI insights using compiled household data and basic analytics
   */
  private async generateAIInsights(rawData: any): Promise<AIInsight[]> {
    if (!this.ai || !this.ai.run) {
      console.log("❌ AI binding not available");
      return [];
    }

    // Compile household data summary
    const dataCompilation = this.compileHouseholdData(rawData);

    // Validate data compilation before creating prompt
    const validationResult = this.validateDataCompilation(dataCompilation);
    if (!validationResult.isValid) {
      console.warn(
        "⚠️ Data compilation validation failed:",
        validationResult.errors
      );
      // Generate fallback insights when data validation fails too
      return this.generateFallbackInsights(
        `Data validation failed: ${validationResult.errors.join(", ")}`
      );
    }

    // Auto-select or use specified prompt style
    const selectedStyle = promptRouter.selectBestStyle(
      dataCompilation,
      this.promptStyle
    );
    console.log(`🎯 Using prompt style: ${selectedStyle}`);

    // Generate prompt using selected style
    const prompt = promptRouter.generatePrompt(selectedStyle, dataCompilation);

    // Validate prompt using style-specific validation
    if (!promptRouter.validatePrompt(selectedStyle, prompt)) {
      console.error("❌ Prompt validation failed");
      return [];
    }

    console.log(`🤖 Making AI call with ${prompt.length} character prompt`);

    try {
      const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });

      console.log(
        `✅ AI response received (${response.response?.length || 0} characters)`
      );

      // Validate and parse response
      return this.validateAndParseAIResponse(response.response || "");
    } catch (error) {
      console.error("❌ AI call failed:", error);

      // Log the error for monitoring
      analyticsLogger.error("Error generating AI insights", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
      });

      return this.generateFallbackInsights(
        `AI service error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Compile household data into a structured summary with dynamic field analysis
   */
  private compileHouseholdData(rawData: any) {
    const compilation: any = {
      totalRecords: rawData.records?.length || 0,
      members: rawData.users?.length || 0,
      recordTypeStructures: [],
      patterns: {},
      fieldAnalysis: {},
    };

    // Analyze record type structures and their fields
    const recordTypes = Array.isArray(rawData.recordTypes)
      ? rawData.recordTypes
      : [];
    recordTypes.forEach((recordType: any) => {
      let fields = [];
      try {
        fields = recordType.fields ? JSON.parse(recordType.fields) : [];
      } catch {
        fields = [];
      }

      compilation.recordTypeStructures.push({
        name: recordType.name,
        category: recordType.category,
        description: recordType.description,
        fieldCount: fields.length,
        fields: fields.map((field: any) => ({
          name: field.name,
          type: field.type,
          required: field.required || false,
        })),
      });
    });

    // Get recent records by category and analyze field values
    const categorizedRecords: Record<string, any[]> = {};
    const records = Array.isArray(rawData.records) ? rawData.records : [];
    records.slice(0, 50).forEach((record: any) => {
      const category = record.recordType?.category || "Other";
      if (!categorizedRecords[category]) categorizedRecords[category] = [];
      categorizedRecords[category].push(record);
    });

    // Enhanced pattern analysis with field value insights
    Object.entries(categorizedRecords).forEach(([category, records]) => {
      const fieldValueAnalysis: Record<string, any> = {};
      const recentEntries = records.slice(0, 10);

      // Analyze field values for insights
      recentEntries.forEach(record => {
        let recordContent = {};
        try {
          recordContent = record.content ? JSON.parse(record.content) : {};
        } catch {
          recordContent = {};
        }

        // Extract and analyze field values
        Object.entries(recordContent).forEach(([fieldKey, value]) => {
          if (!fieldValueAnalysis[fieldKey]) {
            fieldValueAnalysis[fieldKey] = {
              values: [],
              type: typeof value,
              frequency: {},
            };
          }

          fieldValueAnalysis[fieldKey].values.push(value);

          // Track frequency for categorical data
          const stringValue = String(value);
          fieldValueAnalysis[fieldKey].frequency[stringValue] =
            (fieldValueAnalysis[fieldKey].frequency[stringValue] || 0) + 1;
        });
      });

      // Generate summary statistics for numeric fields
      Object.entries(fieldValueAnalysis).forEach(
        ([_fieldKey, analysis]: [string, any]) => {
          if (analysis.type === "number") {
            const numericValues = analysis.values
              .filter((v: any) => !isNaN(Number(v)))
              .map(Number);
            if (numericValues.length > 0) {
              analysis.statistics = {
                average:
                  numericValues.reduce((a: number, b: number) => a + b, 0) /
                  numericValues.length,
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                trend:
                  numericValues.length > 1
                    ? this.calculateTrend(numericValues.slice(-5))
                    : "stable",
              };
            }
          }
        }
      );

      compilation.patterns[category] = {
        count: records.length,
        fieldAnalysis: fieldValueAnalysis,
        timeSpan: this.getTimeSpan(records),
        mostCommonFields: Object.keys(fieldValueAnalysis).slice(0, 5),
      };
    });

    return compilation;
  }

  /**
   * Calculate trend for numeric values (simple trend analysis)
   */
  private calculateTrend(
    values: number[]
  ): "increasing" | "decreasing" | "stable" {
    if (values.length < 2) return "stable";

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return "increasing";
    if (change < -5) return "decreasing";
    return "stable";
  }

  /**
   * Get time span for records
   */
  private getTimeSpan(records: any[]): string {
    if (records.length === 0) return "No data";

    const dates = records
      .map(r => new Date(r.createdAt))
      .sort((a, b) => a.getTime() - b.getTime());
    const daysDiff = Math.ceil(
      (dates[dates.length - 1].getTime() - dates[0].getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) return "1 day";
    if (daysDiff === 1) return "2 days";
    if (daysDiff < 7) return `${daysDiff + 1} days`;
    if (daysDiff < 30) return `${Math.ceil(daysDiff / 7)} weeks`;
    return `${Math.ceil(daysDiff / 30)} months`;
  }

  /**
   * Set the prompt style for this service instance
   */
  setPromptStyle(style: PromptStyleId): void {
    this.promptStyle = style;
  }

  /**
   * Get available prompt styles and recommendations
   */
  getPromptStyleRecommendations(dataCompilation: any) {
    return promptRouter.getStyleRecommendations(dataCompilation);
  }

  /**
   * Generate fallback insights when AI fails
   */
  private generateFallbackInsights(reason: string): AIInsight[] {
    console.log(`🔄 Generating fallback insights due to: ${reason}`);

    const timestamp = Date.now();
    const fallbackInsights: AIInsight[] = [
      {
        id: `fallback-data-${timestamp}`,
        type: "behavior",
        category: "Data Tracking",
        title: "Data Collection Progress",
        description:
          "Your family is building a valuable record of daily activities and wellness patterns.",
        confidence: "medium",
        importance: "medium",
        data: {
          trend: "stable",
          timeframe: "ongoing",
          dataPoints: 1,
        },
        recommendations: [
          "Continue tracking daily activities to build more comprehensive insights",
          "Try adding sleep or mood records for better wellness analysis",
        ],
        createdAt: new Date(),
      },
      {
        id: `fallback-wellness-${timestamp}`,
        type: "health",
        category: "Family Wellness",
        title: "Wellness Tracking Opportunity",
        description:
          "Regular tracking helps identify patterns that can improve your family's wellbeing.",
        confidence: "high",
        importance: "medium",
        data: {
          trend: "stable",
          timeframe: "current",
          dataPoints: 1,
        },
        recommendations: [
          "Consider tracking key wellness metrics like sleep quality and mood",
          "Review your data weekly to identify helpful patterns",
        ],
        createdAt: new Date(),
      },
    ];

    return fallbackInsights;
  }

  /**
   * Validate data compilation before creating prompt
   */
  private validateDataCompilation(compilation: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!compilation) {
      errors.push("Data compilation is null or undefined");
      return { isValid: false, errors };
    }

    if (
      typeof compilation.totalRecords !== "number" ||
      compilation.totalRecords < 0
    ) {
      errors.push("Invalid totalRecords count");
    }

    if (typeof compilation.members !== "number" || compilation.members < 1) {
      errors.push("Invalid members count");
    }

    if (
      !Array.isArray(compilation.recordTypeStructures) ||
      compilation.recordTypeStructures.length === 0
    ) {
      errors.push("No record type structures available");
    }

    if (!compilation.patterns || typeof compilation.patterns !== "object") {
      errors.push("Invalid patterns object");
    } else {
      const patternCount = Object.keys(compilation.patterns).length;
      if (patternCount === 0) {
        errors.push("No patterns found");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate and parse AI response into structured insights
   */
  private validateAndParseAIResponse(response: string): AIInsight[] {
    console.log(`🤖 AI response validation`, {
      householdId: this.householdId,
      response: response,
    });

    if (!response || typeof response !== "string") {
      console.error("❌ Invalid AI response: not a string");
      return this.generateFallbackInsights("Invalid AI response format");
    }

    if (response.length < 20) {
      console.error("❌ AI response too short");
      return this.generateFallbackInsights("AI response too short");
    }

    if (response.length > 5000) {
      console.warn("⚠️ AI response very long, truncating");
      response = response.substring(0, 5000);
    }

    // Parse the response
    const insights = this.parseAIResponse(response);

    // Validate parsed insights
    const validatedInsights = insights.filter(insight =>
      this.validateInsight(insight)
    );

    if (validatedInsights.length === 0) {
      console.warn("⚠️ No valid insights parsed from AI response");

      // Create fallback insight if parsing completely failed
      if (response.length > 50) {
        return this.createFallbackInsight(response);
      }
    }

    console.log(
      `✅ Validated ${validatedInsights.length} insights from AI response`
    );
    return validatedInsights;
  }

  /**
   * Validate individual insight structure
   */
  private validateInsight(insight: any): boolean {
    if (!insight || typeof insight !== "object") {
      return false;
    }

    const requiredFields = [
      "id",
      "type",
      "category",
      "title",
      "description",
      "confidence",
      "importance",
      "recommendations",
    ];

    for (const field of requiredFields) {
      if (!insight[field]) {
        console.warn(`⚠️ Insight missing required field: ${field}`);
        return false;
      }
    }

    if (
      typeof insight.description !== "string" ||
      insight.description.length < 10
    ) {
      console.warn("⚠️ Insight description too short");
      return false;
    }

    if (
      !Array.isArray(insight.recommendations) ||
      insight.recommendations.length === 0
    ) {
      console.warn("⚠️ Insight has no recommendations");
      return false;
    }

    return true;
  }

  /**
   * Create fallback insight when parsing fails
   */
  private createFallbackInsight(response: string): AIInsight[] {
    return [
      {
        id: `ai-fallback-${Date.now()}`,
        type: "behavior",
        category: "General Analysis",
        title: "AI Household Analysis",
        description: this.extractMainContent(response),
        confidence: "low",
        importance: "medium",
        data: {
          trend: "stable",
          timeframe: "recent",
          dataPoints: 0,
        },
        recommendations: this.extractRecommendations(response),
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Extract main content from unstructured response
   */
  private extractMainContent(response: string): string {
    // Remove common AI response prefixes and get first meaningful paragraph
    const cleaned = response
      .replace(/^(Here are?|Based on|Looking at).*?:\s*/i, "")
      .replace(/^(The|This|I can see).*?\.\s*/, "")
      .trim();

    const firstSentences = cleaned.split(".").slice(0, 3).join(".").trim();
    return firstSentences.length > 20
      ? firstSentences + "."
      : cleaned.substring(0, 200);
  }

  /**
   * Extract recommendations from unstructured response
   */
  private extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];

    // Look for recommendation indicators
    const patterns = [
      /recommend[s]?\s+(.+?)(?=\.|$)/gi,
      /suggest[s]?\s+(.+?)(?=\.|$)/gi,
      /consider\s+(.+?)(?=\.|$)/gi,
      /try\s+(.+?)(?=\.|$)/gi,
    ];

    for (const pattern of patterns) {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const rec = match
            .replace(/^(recommend[s]?|suggest[s]?|consider|try)\s+/i, "")
            .trim();
          if (rec.length > 10 && recommendations.length < 3) {
            recommendations.push(rec);
          }
        });
      }
    }

    // Fallback: provide generic recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        "Continue monitoring household patterns and activities"
      );
    }

    return recommendations.slice(0, 3); // Max 3 recommendations
  }

  /**
   * Parse AI response into structured insights (original method)
   */
  private parseAIResponse(response: string): AIInsight[] {
    const insights: AIInsight[] = [];

    // Simple parsing - look for INSIGHT patterns
    const insightMatches = response.match(
      /INSIGHT \d+: (.+?)\n(.+?)\nRECOMMENDATION: (.+?)(?=\n\nINSIGHT|\n*$)/gs
    );

    if (insightMatches) {
      insightMatches.forEach((match, index) => {
        const lines = match.trim().split("\n");
        const category = lines[0].replace(/INSIGHT \d+: /, "").trim();
        const description = lines[1]?.trim() || "";
        const recommendation =
          lines
            .find(line => line.startsWith("RECOMMENDATION:"))
            ?.replace("RECOMMENDATION: ", "")
            .trim() || "";

        if (description && recommendation) {
          // Infer insight type from content
          const inferredType = this.inferInsightType(category, description);

          insights.push({
            id: `ai-insight-${Date.now()}-${index}`,
            type: inferredType,
            category: category || "General",
            title: `AI Insight: ${category}`,
            description: description,
            confidence: "medium",
            importance: "medium",
            data: {
              trend: "stable",
              timeframe: "recent",
              dataPoints: 0,
            },
            recommendations: [recommendation],
            createdAt: new Date(),
          });
        }
      });
    }

    // Fallback: create one insight from the entire response if parsing fails
    if (insights.length === 0 && response.length > 20) {
      // Infer insight type and category from response content
      const inferredType = this.inferInsightType("AI Analysis", response);
      const inferredCategory = this.inferInsightCategory(
        inferredType,
        response
      );

      insights.push({
        id: `ai-insight-fallback-${Date.now()}`,
        type: inferredType,
        category: inferredCategory,
        title: this.inferInsightTitle(inferredType, inferredCategory),
        description:
          response.substring(0, 200) + (response.length > 200 ? "..." : ""),
        confidence: "medium",
        importance: "medium",
        data: {
          trend: "stable",
          timeframe: "recent",
          dataPoints: 0,
        },
        recommendations: [
          "Review the full AI analysis for detailed recommendations",
        ],
        createdAt: new Date(),
      });
    }

    return insights;
  }

  /**
   * Infer insight type from category and description content
   */
  private inferInsightType(
    category: string,
    content: string
  ): AIInsight["type"] {
    const lowerCategory = category.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Health-related keywords
    if (
      lowerCategory.includes("health") ||
      lowerContent.includes("health") ||
      lowerContent.includes("checkup") ||
      lowerContent.includes("symptom") ||
      lowerContent.includes("fever") ||
      lowerContent.includes("medicine") ||
      lowerContent.includes("doctor") ||
      lowerContent.includes("medical")
    ) {
      return "health";
    }

    // Growth-related keywords
    if (
      lowerCategory.includes("growth") ||
      lowerContent.includes("height") ||
      lowerContent.includes("weight") ||
      lowerContent.includes("development") ||
      lowerContent.includes("milestone")
    ) {
      return "growth";
    }

    // Prediction-related keywords
    if (
      lowerCategory.includes("prediction") ||
      lowerCategory.includes("forecast") ||
      lowerContent.includes("predict") ||
      lowerContent.includes("future") ||
      lowerContent.includes("trend")
    ) {
      return "prediction";
    }

    // Development-related keywords
    if (
      lowerCategory.includes("development") ||
      lowerContent.includes("learn") ||
      lowerContent.includes("skill") ||
      lowerContent.includes("progress")
    ) {
      return "development";
    }

    // Default to behavior
    return "behavior";
  }

  /**
   * Infer insight category based on type and content
   */
  private inferInsightCategory(
    type: AIInsight["type"],
    _content: string
  ): string {
    switch (type) {
      case "health":
        return "Health Analysis";
      case "growth":
        return "Growth Patterns";
      case "development":
        return "Development Tracking";
      case "prediction":
        return "Predictive Analysis";
      case "behavior":
      default:
        return "Behavioral Insights";
    }
  }

  /**
   * Infer insight title based on type and category
   */
  private inferInsightTitle(
    type: AIInsight["type"],
    _category: string
  ): string {
    switch (type) {
      case "health":
        return "AI Health Pattern Analysis";
      case "growth":
        return "Growth Trend Analysis";
      case "development":
        return "Development Progress Insights";
      case "prediction":
        return "Predictive Modeling Results";
      case "behavior":
      default:
        return "Behavioral Pattern Analysis";
    }
  }

  /**
   * Legacy methods - now simplified to return empty arrays since we use generateAIInsights
   */
  private async analyzeGrowthPatterns(_data: any): Promise<AIInsight[]> {
    return []; // Now handled by generateAIInsights
  }

  private async analyzeHealthPatterns(_data: any): Promise<AIInsight[]> {
    return []; // Now handled by generateAIInsights
  }

  private async analyzeBehavioralPatterns(_data: any): Promise<AIInsight[]> {
    return []; // Now handled by generateAIInsights
  }

  private async analyzeCorrelations(_data: any): Promise<AIInsight[]> {
    return []; // Now handled by generateAIInsights
  }

  private async generatePredictiveInsights(_data: any): Promise<AIInsight[]> {
    return []; // Now handled by generateAIInsights
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
      if (!record || !record.data) {
        return; // Skip records without data
      }

      let data;
      try {
        data =
          typeof record.data === "string"
            ? JSON.parse(record.data)
            : record.data;
      } catch (error) {
        console.warn("Failed to parse record data:", error);
        return; // Skip records with invalid JSON
      }

      if (!data || typeof data !== "object") {
        return; // Skip if data is null, undefined, or not an object
      }

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

  private calculateDetailedTrend(values: number[]): {
    slope: number;
    r2: number;
  } {
    if (values.length < 2) return { slope: 0, r2: 0 };

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

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
        if (!record || !record.data) return false;

        let data;
        try {
          data =
            typeof record.data === "string"
              ? JSON.parse(record.data)
              : record.data;
        } catch {
          return false;
        }

        if (!data || typeof data !== "object") return false;
        return data.hours || data.sleep_hours || data.sleepHours;
      })
      .map(record => {
        let data;
        try {
          data =
            typeof record.data === "string"
              ? JSON.parse(record.data)
              : record.data;
        } catch {
          data = {};
        }
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
    const trend = this.calculateDetailedTrend(hours);

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
        if (!record || !record.data) return false;

        let data;
        try {
          data =
            typeof record.data === "string"
              ? JSON.parse(record.data)
              : record.data;
        } catch {
          return false;
        }

        if (!data || typeof data !== "object") return false;
        return data.mood || data.mood_rating || data.moodRating;
      })
      .map(record => {
        let data;
        try {
          data =
            typeof record.data === "string"
              ? JSON.parse(record.data)
              : record.data;
        } catch {
          data = {};
        }
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
    const trend = this.calculateDetailedTrend(moods);

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
    _records: any[]
  ): Record<string, Array<{ date: string; value: number }>> {
    // Implementation would extract various metrics over time
    return {};
  }

  private calculateCorrelations(
    _metrics: Record<string, Array<{ date: string; value: number }>>
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
