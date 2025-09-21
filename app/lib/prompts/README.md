# AI Prompts System

A flexible prompt management system for generating different styles of AI insights.

## Architecture

```
prompts/
├── types.ts                 # TypeScript interfaces and types
├── comprehensive-prompt.ts  # Detailed technical analysis
├── focused-prompt.ts        # Targeted, actionable insights
├── conversational-prompt.ts # Friendly, encouraging tone
├── prompt-router.ts         # Smart routing and selection logic
└── index.ts                 # Clean exports
```

## Prompt Styles

### 1. Comprehensive Analysis (`comprehensive`)

- **Audience:** Technical users, detailed analysis lovers
- **Style:** Detailed, thorough, technical
- **Focus:** Patterns, correlations, trends, comprehensive recommendations
- **Best for:** Users with rich data (50+ records), multiple categories

### 2. Focused Analysis (`focused`)

- **Audience:** General users wanting clear direction
- **Style:** Concise, actionable, priority-focused
- **Focus:** Key metrics, immediate actions, priority areas
- **Best for:** Users with moderate data (10-50 records), 1-3 categories

### 3. Conversational Analysis (`conversational`)

- **Audience:** Casual users, families, encouragement seekers
- **Style:** Friendly, supportive, encouraging
- **Focus:** Positive reinforcement, gentle suggestions, family dynamics
- **Best for:** New users (<10 records), those needing motivation

## Usage

```typescript
import { promptRouter, type PromptStyleId } from "~/lib/prompts";

// Auto-select best style based on data
const dataCompilation = await compileHouseholdData(rawData);
const bestStyle = promptRouter.selectBestStyle(dataCompilation);

// Generate prompt with selected style
const prompt = promptRouter.generatePrompt(bestStyle, dataCompilation);

// Or specify a particular style
const conversationalPrompt = promptRouter.generatePrompt(
  "conversational",
  dataCompilation
);

// Get style recommendations
const recommendations = promptRouter.getStyleRecommendations(dataCompilation);
console.log(`Recommended: ${recommendations.recommended}`);
console.log(`Alternatives:`, recommendations.alternatives);
```

## Auto-Selection Logic

The router automatically selects the best prompt style based on:

- **Total Records:** <10 = conversational, 10-50 = focused, 50+ = comprehensive
- **Categories Count:** Few categories favor focused approach
- **Data Richness:** Rich field analysis enables comprehensive insights
- **User Preference:** Always honored when specified

## Adding New Styles

1. Create new prompt generator implementing `PromptGenerator` interface
2. Add the style to `PromptStyleId` union type
3. Register in `AIPromptRouter` constructor
4. Update auto-selection logic if needed

## Validation

Each style has its own validation rules:

- **Comprehensive:** 100-4000 chars, technical elements required
- **Focused:** 50-2000 chars, action-oriented elements required
- **Conversational:** 100-3000 chars, encouraging elements required
