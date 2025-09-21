/**
 * Conversational AI prompt generator
 * Friendly, approachable analysis with encouraging tone
 */

import type { DataCompilation, PromptGenerator, PromptStyle } from "./types";

export class ConversationalPromptGenerator implements PromptGenerator {
  style: PromptStyle = {
    id: "conversational",
    name: "Conversational Analysis",
    description:
      "Friendly, encouraging analysis with a supportive and approachable tone",
    targetAudience: "casual",
    outputStyle: "conversational",
    focusAreas: [
      "encouragement",
      "family-dynamics",
      "positive-reinforcement",
      "gentle-suggestions",
    ],
  };

  generatePrompt(dataCompilation: DataCompilation): string {
    // Create encouraging observations
    const totalEntries = dataCompilation.totalRecords;
    const activeCategories = Object.keys(dataCompilation.patterns).length;

    // Find positive patterns
    const consistentCategories = Object.entries(dataCompilation.patterns)
      .filter(([, data]) => data.count >= 5)
      .map(([category]) => category);

    // Find areas for gentle encouragement
    const emergingCategories = Object.entries(dataCompilation.patterns)
      .filter(([, data]) => data.count >= 1 && data.count < 5)
      .map(([category]) => category);

    const encouragingStats = `You've been tracking ${totalEntries} records across ${activeCategories} different areas`;
    const consistentTracking =
      consistentCategories.length > 0
        ? `You're doing great with consistent tracking in: ${consistentCategories.join(", ")}`
        : "You're just getting started with your tracking journey";

    return `Hi there! I'm here to help you understand your family's wellness patterns. Let me take a look at what you've been tracking and share some friendly insights.

WHAT I'M SEEING:
${encouragingStats} - that's wonderful progress! ${consistentTracking}.

${
  emergingCategories.length > 0
    ? `I also notice you're exploring: ${emergingCategories.join(", ")} - it's great that you're trying different ways to understand your family's patterns.

`
    : ""
}FAMILY TRACKING AREAS:
${dataCompilation.recordTypeStructures
  .map(
    rt =>
      `• ${rt.name}: ${rt.description || "Keeping track of important moments"}`
  )
  .join("\n")}

RECENT ACTIVITY PATTERNS:
${Object.entries(dataCompilation.patterns)
  .map(([category, data]) => {
    if (data.fieldAnalysis && Object.keys(data.fieldAnalysis).length > 0) {
      const insights = Object.entries(data.fieldAnalysis)
        .slice(0, 1)
        .map(([field, analysis]: [string, any]) => {
          if (analysis.statistics) {
            const trend = analysis.statistics.trend;
            const trendMessage =
              trend === "increasing"
                ? "improving"
                : trend === "decreasing"
                  ? "changing"
                  : "staying steady";
            return `${field} has been ${trendMessage}`;
          }
          return `tracking ${field} regularly`;
        })[0];
      return `• ${category}: ${data.count} entries over ${data.timeSpan} - ${insights}`;
    }
    return `• ${category}: ${data.count} entries over ${data.timeSpan}`;
  })
  .join("\n")}

Now, let me share some thoughts and gentle suggestions:

MY OBSERVATIONS:
Please share 2-3 caring, supportive insights in this warm, encouraging format:

OBSERVATION 1: [What's Going Well]
[One encouraging sentence about something positive you notice in their data]
GENTLE SUGGESTION: [A kind, supportive recommendation that feels achievable]

OBSERVATION 2: [An Opportunity]
[One friendly sentence about a pattern or opportunity for growth]
GENTLE SUGGESTION: [A warm, encouraging suggestion they might try]

OBSERVATION 3: [Family Wellbeing] (if helpful)
[One caring observation about their overall family wellness journey]
GENTLE SUGGESTION: [A supportive idea for continuing their wellness journey]

Please be encouraging and supportive. Celebrate their efforts and frame suggestions as friendly opportunities rather than things they "should" do. Remember, every family's wellness journey is unique and worthy of celebration!`;
  }

  validatePrompt(prompt: string): boolean {
    if (!prompt || typeof prompt !== "string") {
      console.error("Conversational prompt is not a valid string");
      return false;
    }

    if (prompt.length < 100) {
      console.error("Conversational prompt too short (< 100 characters)");
      return false;
    }

    if (prompt.length > 3000) {
      console.error("Conversational prompt too long (> 3000 characters)");
      return false;
    }

    // Check for required elements
    const requiredElements = [
      "WHAT I'M SEEING",
      "FAMILY TRACKING AREAS",
      "RECENT ACTIVITY PATTERNS",
      "MY OBSERVATIONS",
      "OBSERVATION 1:",
      "GENTLE SUGGESTION:",
    ];

    for (const element of requiredElements) {
      if (!prompt.includes(element)) {
        console.error(
          `Conversational prompt missing required element: ${element}`
        );
        return false;
      }
    }

    return true;
  }
}
