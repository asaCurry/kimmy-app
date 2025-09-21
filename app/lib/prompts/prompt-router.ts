/**
 * Prompt Router - Manages different AI prompt styles and selection logic
 */

import type {
  DataCompilation,
  PromptRouter,
  PromptGenerator,
  PromptStyle,
  PromptStyleId,
} from "./types";
import { ComprehensivePromptGenerator } from "./comprehensive-prompt";
import { FocusedPromptGenerator } from "./focused-prompt";
import { ConversationalPromptGenerator } from "./conversational-prompt";

export class AIPromptRouter implements PromptRouter {
  private generators: Map<PromptStyleId, PromptGenerator>;

  constructor() {
    this.generators = new Map([
      ["comprehensive", new ComprehensivePromptGenerator()],
      ["focused", new FocusedPromptGenerator()],
      ["conversational", new ConversationalPromptGenerator()],
    ]);
  }

  getPromptGenerator(styleId: PromptStyleId): PromptGenerator {
    const generator = this.generators.get(styleId);
    if (!generator) {
      console.warn(
        `Unknown prompt style: ${styleId}, falling back to comprehensive`
      );
      return this.generators.get("comprehensive")!;
    }
    return generator;
  }

  listAvailableStyles(): PromptStyle[] {
    return Array.from(this.generators.values()).map(
      generator => generator.style
    );
  }

  selectBestStyle(
    dataCompilation: DataCompilation,
    userPreference?: PromptStyleId
  ): PromptStyleId {
    // If user has a preference, use it (if valid)
    if (userPreference && this.generators.has(userPreference)) {
      return userPreference;
    }

    // Auto-select based on data characteristics
    const totalRecords = dataCompilation.totalRecords;
    const categoriesCount = Object.keys(dataCompilation.patterns).length;
    const hasRichData = Object.values(dataCompilation.patterns).some(
      pattern =>
        pattern.fieldAnalysis && Object.keys(pattern.fieldAnalysis).length > 2
    );

    // Decision logic for auto-selection
    if (totalRecords < 10) {
      // New users or limited data - use encouraging conversational style
      return "conversational";
    } else if (totalRecords < 50 || categoriesCount <= 2) {
      // Growing users - use focused style to highlight key areas
      return "focused";
    } else if (hasRichData && totalRecords >= 50) {
      // Experienced users with rich data - use comprehensive analysis
      return "comprehensive";
    }

    // Default fallback
    return "focused";
  }

  /**
   * Generate a prompt using the specified style
   */
  generatePrompt(
    styleId: PromptStyleId,
    dataCompilation: DataCompilation
  ): string {
    const generator = this.getPromptGenerator(styleId);
    return generator.generatePrompt(dataCompilation);
  }

  /**
   * Validate a prompt using the specified style's validation rules
   */
  validatePrompt(styleId: PromptStyleId, prompt: string): boolean {
    const generator = this.getPromptGenerator(styleId);
    return generator.validatePrompt(prompt);
  }

  /**
   * Get style recommendations based on data characteristics
   */
  getStyleRecommendations(dataCompilation: DataCompilation): {
    recommended: PromptStyleId;
    alternatives: Array<{
      styleId: PromptStyleId;
      reason: string;
    }>;
  } {
    const recommended = this.selectBestStyle(dataCompilation);
    const alternatives: Array<{ styleId: PromptStyleId; reason: string }> = [];

    // Add alternative suggestions with reasons
    if (recommended !== "conversational") {
      alternatives.push({
        styleId: "conversational",
        reason: "For a more encouraging and supportive tone",
      });
    }

    if (recommended !== "focused") {
      alternatives.push({
        styleId: "focused",
        reason: "For quick, actionable insights focused on key areas",
      });
    }

    if (recommended !== "comprehensive") {
      alternatives.push({
        styleId: "comprehensive",
        reason:
          "For detailed analysis with technical insights and correlations",
      });
    }

    return { recommended, alternatives };
  }
}

// Export a singleton instance
export const promptRouter = new AIPromptRouter();
