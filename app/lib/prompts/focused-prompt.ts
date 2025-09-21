/**
 * Focused AI prompt generator
 * Targeted analysis focusing on key metrics and actionable insights
 */

import type { DataCompilation, PromptGenerator, PromptStyle } from "./types";

export class FocusedPromptGenerator implements PromptGenerator {
  style: PromptStyle = {
    id: "focused",
    name: "Focused Analysis",
    description:
      "Targeted analysis focusing on key metrics and immediate actionable insights",
    targetAudience: "general",
    outputStyle: "concise",
    focusAreas: ["key-metrics", "immediate-actions", "priority-areas"],
  };

  generatePrompt(dataCompilation: DataCompilation): string {
    // Focus on the most active categories and key metrics
    const topCategories = Object.entries(dataCompilation.patterns)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3);

    const keyMetrics = topCategories
      .map(([category, data]) => {
        const keyFields = data.mostCommonFields.slice(0, 2);
        return `- ${category}: ${data.count} entries (${data.timeSpan}) - tracking: ${keyFields.join(", ")}`;
      })
      .join("\n");

    // Identify categories with concerning patterns
    const concerningPatterns = Object.entries(dataCompilation.patterns)
      .filter(([, data]) => data.count < 3 && data.timeSpan.includes("week"))
      .map(([category]) => category);

    return `You are a wellness assistant. Analyze this family's data and provide 2 focused, actionable insights.

FAMILY DATA SUMMARY:
- ${dataCompilation.members} family members
- ${dataCompilation.totalRecords} total records tracked
- ${dataCompilation.recordTypeStructures.length} different tracking categories

TOP ACTIVITY AREAS:
${keyMetrics}

${
  concerningPatterns.length > 0
    ? `AREAS NEEDING ATTENTION:
${concerningPatterns.map(cat => `- ${cat}: Low recent activity`).join("\n")}

`
    : ""
}FOCUS AREAS:
Identify the most important patterns and provide immediate, practical recommendations that this family can implement this week.

Provide exactly 2 insights in this format:

INSIGHT 1: [Primary Focus Area]
[One clear sentence about the most important pattern you see]
ACTION: [One specific thing they can do this week]

INSIGHT 2: [Secondary Focus Area]
[One clear sentence about another key opportunity]
ACTION: [One specific thing they can do this week]

Keep recommendations simple, specific, and immediately actionable. Focus on what matters most for this family's wellbeing.`;
  }

  validatePrompt(prompt: string): boolean {
    if (!prompt || typeof prompt !== "string") {
      console.error("Focused prompt is not a valid string");
      return false;
    }

    if (prompt.length < 50) {
      console.error("Focused prompt too short (< 50 characters)");
      return false;
    }

    if (prompt.length > 2000) {
      console.error("Focused prompt too long (> 2000 characters)");
      return false;
    }

    // Check for required elements
    const requiredElements = [
      "FAMILY DATA SUMMARY",
      "TOP ACTIVITY AREAS",
      "INSIGHT 1:",
      "INSIGHT 2:",
      "ACTION:",
    ];

    for (const element of requiredElements) {
      if (!prompt.includes(element)) {
        console.error(`Focused prompt missing required element: ${element}`);
        return false;
      }
    }

    return true;
  }
}
