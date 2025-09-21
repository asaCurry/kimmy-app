/**
 * Comprehensive AI prompt generator
 * Detailed analysis with full data exploration
 */

import type { DataCompilation, PromptGenerator, PromptStyle } from "./types";
import { promptOptimizer } from "./prompt-optimizer";

export class ComprehensivePromptGenerator implements PromptGenerator {
  style: PromptStyle = {
    id: "comprehensive",
    name: "Comprehensive Analysis",
    description:
      "Detailed, thorough analysis with extensive data exploration and technical insights",
    targetAudience: "technical",
    outputStyle: "detailed",
    focusAreas: [
      "patterns",
      "correlations",
      "trends",
      "recommendations",
      "technical-insights",
    ],
  };

  generatePrompt(dataCompilation: DataCompilation): string {
    // Optimize data compilation for token efficiency
    const optimizedData =
      promptOptimizer.optimizeDataCompilation(dataCompilation);

    const recordTypeDetails = optimizedData.recordTypeStructures
      .map(
        rt =>
          `- ${rt.name} (${rt.category}): ${rt.fieldCount} fields - ${rt.description || "Track various data points"}`
      )
      .join("\n");

    const categoryInsights = Object.entries(optimizedData.patterns)
      .map(([category, data]) => {
        let categoryText = `${category} (${data.count} entries over ${data.timeSpan}):\n`;

        // Add field analysis for each category
        if (data.fieldAnalysis && Object.keys(data.fieldAnalysis).length > 0) {
          const fieldInsights = Object.entries(data.fieldAnalysis)
            .slice(0, 3) // Limit to top 3 fields to keep prompt manageable
            .map(([field, analysis]: [string, any]) => {
              if (analysis.statistics) {
                return `  • ${field}: Average ${analysis.statistics.average.toFixed(1)}, ${analysis.statistics.trend} trend`;
              } else if (analysis.frequency) {
                const topValues = Object.entries(analysis.frequency)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 2)
                  .map(([value, count]) => `${value} (${count}x)`)
                  .join(", ");
                return `  • ${field}: Most common: ${topValues}`;
              }
              return `  • ${field}: ${analysis.values.length} entries`;
            })
            .join("\n");

          categoryText += fieldInsights;
        }

        return categoryText;
      })
      .join("\n\n");

    const prompt = `You are a family wellness AI assistant analyzing household record data. Generate 2-3 actionable insights based on the dynamic data patterns below.

HOUSEHOLD OVERVIEW:
- Total Records: ${optimizedData.totalRecords}
- Family Members: ${optimizedData.members}

RECORD TYPE STRUCTURES:
${recordTypeDetails}

DETAILED DATA PATTERNS:
${categoryInsights}

ANALYSIS INSTRUCTIONS:
Analyze the above data to identify meaningful patterns, trends, or correlations across different data types. Consider:
- Trends in numeric fields (sleep duration, mood ratings, etc.)
- Patterns in categorical data (sleep quality, stress levels, etc.)
- Potential correlations between different categories
- Areas where the family is doing well or might need attention
- Opportunities for positive health/wellness improvements

Provide insights in this exact format:

INSIGHT 1: [Category/Cross-category]
[One sentence describing a specific pattern, trend, or correlation you identified from the data]
RECOMMENDATION: [One specific, actionable recommendation based on this insight]

INSIGHT 2: [Category/Cross-category]
[One sentence describing another meaningful pattern or opportunity]
RECOMMENDATION: [One specific, actionable recommendation]

INSIGHT 3: [Category/Cross-category] (optional)
[One sentence about an additional insight if warranted]
RECOMMENDATION: [One specific, actionable recommendation]

Focus on data-driven insights that help the family improve their wellness, habits, or lifestyle. Be specific about what the data shows and provide practical recommendations.`;

    // Apply final optimizations
    const optimizedPrompt = promptOptimizer.compressText(prompt);
    const finalPrompt = promptOptimizer.truncatePrompt(optimizedPrompt);

    // Log optimization stats in development
    try {
      const stats = promptOptimizer.getOptimizationStats(prompt, finalPrompt);
      console.log(
        `🎯 Prompt optimization: ${stats.originalTokens} → ${stats.optimizedTokens} tokens (${Math.round((1 - stats.compressionRatio) * 100)}% reduction)`
      );
    } catch (_error) {
      // Ignore logging errors
    }

    return finalPrompt;
  }

  validatePrompt(prompt: string): boolean {
    if (!prompt || typeof prompt !== "string") {
      console.error("Prompt is not a valid string");
      return false;
    }

    if (prompt.length < 100) {
      console.error("Prompt too short (< 100 characters)");
      return false;
    }

    if (prompt.length > 4000) {
      console.error("Prompt too long (> 4000 characters)");
      return false;
    }

    // Check for required prompt elements
    const requiredElements = [
      "HOUSEHOLD OVERVIEW",
      "RECORD TYPE STRUCTURES",
      "DETAILED DATA PATTERNS",
      "ANALYSIS INSTRUCTIONS",
      "INSIGHT 1:",
      "INSIGHT 2:",
      "RECOMMENDATION:",
    ];

    for (const element of requiredElements) {
      if (!prompt.includes(element)) {
        console.error(`Prompt missing required element: ${element}`);
        return false;
      }
    }

    return true;
  }
}
