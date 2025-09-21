/**
 * AI Prompts System - Centralized prompt management and routing
 */

export * from "./types";
export * from "./comprehensive-prompt";
export * from "./focused-prompt";
export * from "./conversational-prompt";
export * from "./prompt-router";

// Re-export the singleton router for easy access
export { promptRouter as default } from "./prompt-router";
