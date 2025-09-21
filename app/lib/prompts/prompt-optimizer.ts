/**
 * Prompt optimization utilities for reducing token usage and improving AI performance
 */

import type { DataCompilation } from "./types";

export interface PromptOptimizationConfig {
  maxPromptLength: number;
  maxFieldsPerCategory: number;
  maxCategories: number;
  abbreviateFieldNames: boolean;
  removeRedundantData: boolean;
}

export const DEFAULT_OPTIMIZATION_CONFIG: PromptOptimizationConfig = {
  maxPromptLength: 3000,
  maxFieldsPerCategory: 3,
  maxCategories: 5,
  abbreviateFieldNames: true,
  removeRedundantData: true,
};

export class PromptOptimizer {
  constructor(
    private config: PromptOptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG
  ) {}

  /**
   * Optimize data compilation to reduce token usage while preserving key insights
   */
  optimizeDataCompilation(dataCompilation: DataCompilation): DataCompilation {
    const optimized = { ...dataCompilation };

    // Limit number of categories processed
    const sortedPatterns = Object.entries(optimized.patterns)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, this.config.maxCategories);

    optimized.patterns = Object.fromEntries(sortedPatterns);

    // Optimize each pattern's field analysis
    for (const [_category, pattern] of Object.entries(optimized.patterns)) {
      if (pattern.fieldAnalysis) {
        // Keep only the most relevant fields
        const topFields = Object.entries(pattern.fieldAnalysis)
          .sort(([, a], [, b]) => {
            // Prioritize fields with statistics or high frequency
            const aScore = (a.statistics ? 10 : 0) + (a.values?.length || 0);
            const bScore = (b.statistics ? 10 : 0) + (b.values?.length || 0);
            return bScore - aScore;
          })
          .slice(0, this.config.maxFieldsPerCategory);

        pattern.fieldAnalysis = Object.fromEntries(topFields);
      }

      // Limit mostCommonFields
      pattern.mostCommonFields = pattern.mostCommonFields?.slice(0, 3) || [];
    }

    return optimized;
  }

  /**
   * Compress text content to reduce tokens while preserving meaning
   */
  compressText(text: string): string {
    if (!this.config.removeRedundantData) return text;

    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove redundant phrases
        .replace(/\b(very|really|quite|rather|extremely)\s+/gi, "")
        // Compress common phrases
        .replace(/\brecords? entries?\b/gi, "entries")
        .replace(/\bdata points?\b/gi, "data")
        .replace(/\bfamily members?\b/gi, "members")
        .replace(/\bhousehold data\b/gi, "data")
        // Trim
        .trim()
    );
  }

  /**
   * Abbreviate field names to save tokens
   */
  abbreviateFieldName(fieldName: string): string {
    if (!this.config.abbreviateFieldNames) return fieldName;

    const abbreviations: Record<string, string> = {
      "Sleep Duration": "Sleep Hrs",
      "Sleep Quality": "Sleep Qual",
      "Overall Mood": "Mood",
      "Energy Level": "Energy",
      "Stress Level": "Stress",
      "Most common": "Common",
      Average: "Avg",
      trend: "trend",
    };

    return abbreviations[fieldName] || fieldName;
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate prompt if it exceeds maximum length
   */
  truncatePrompt(prompt: string): string {
    const estimatedTokens = this.estimateTokenCount(prompt);

    if (estimatedTokens <= this.config.maxPromptLength) {
      return prompt;
    }

    console.warn(
      `⚠️ Prompt truncated: ${estimatedTokens} → ${this.config.maxPromptLength} tokens`
    );

    // Truncate to approximately the right number of characters
    const maxChars = this.config.maxPromptLength * 4;
    const truncated = prompt.substring(0, maxChars);

    // Try to end at a complete sentence or section
    const lastSentence = truncated.lastIndexOf(".");
    const lastSection = truncated.lastIndexOf("\n\n");

    const cutPoint = Math.max(lastSentence, lastSection);

    if (cutPoint > maxChars * 0.8) {
      return (
        truncated.substring(0, cutPoint + 1) +
        "\n\n[Analysis truncated to fit token limit]"
      );
    }

    return truncated + "...\n\n[Analysis truncated to fit token limit]";
  }

  /**
   * Get optimization stats for monitoring
   */
  getOptimizationStats(
    original: string,
    optimized: string
  ): {
    originalTokens: number;
    optimizedTokens: number;
    tokenSaved: number;
    compressionRatio: number;
  } {
    const originalTokens = this.estimateTokenCount(original);
    const optimizedTokens = this.estimateTokenCount(optimized);
    const tokenSaved = originalTokens - optimizedTokens;
    const compressionRatio = optimizedTokens / originalTokens;

    return {
      originalTokens,
      optimizedTokens,
      tokenSaved,
      compressionRatio,
    };
  }
}

// Export singleton optimizer with default config
export const promptOptimizer = new PromptOptimizer();
