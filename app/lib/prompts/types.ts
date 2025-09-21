/**
 * Types and interfaces for AI prompt system
 */

export interface DataCompilation {
  totalRecords: number;
  members: number;
  recordTypeStructures: Array<{
    name: string;
    category: string;
    description: string;
    fieldCount: number;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  }>;
  patterns: Record<
    string,
    {
      count: number;
      fieldAnalysis: Record<string, any>;
      timeSpan: string;
      mostCommonFields: string[];
    }
  >;
}

export interface PromptStyle {
  id: string;
  name: string;
  description: string;
  targetAudience: "general" | "technical" | "casual" | "professional";
  outputStyle: "concise" | "detailed" | "conversational" | "clinical";
  focusAreas: string[];
}

export interface PromptGenerator {
  style: PromptStyle;
  generatePrompt(dataCompilation: DataCompilation): string;
  validatePrompt(prompt: string): boolean;
}

export type PromptStyleId = "comprehensive" | "focused" | "conversational";

export interface PromptRouter {
  getPromptGenerator(styleId: PromptStyleId): PromptGenerator;
  listAvailableStyles(): PromptStyle[];
  selectBestStyle(
    dataCompilation: DataCompilation,
    userPreference?: PromptStyleId
  ): PromptStyleId;
}
