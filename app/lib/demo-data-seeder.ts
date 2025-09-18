/**
 * Demo Data Seeder Utility
 *
 * Provides functions to seed demo data directly into the database
 * without requiring API routes.
 */

import { recordTypes, trackers } from "~/db/schema";
import { drizzle } from "drizzle-orm/d1";

export interface DemoDataOptions {
  householdId: string;
  userId: number;
  visibleToMembers?: number[];
}

export interface DemoDataResult {
  success: boolean;
  recordTypes: any[];
  trackers: any[];
  message: string;
}

/**
 * Comprehensive set of demo record types
 */
const DEMO_RECORD_TYPES = [
  {
    name: "Daily Journal",
    description: "Track daily thoughts, activities, and reflections",
    category: "Personal",
    icon: "📝",
    color: "blue",
    allowPrivate: 1,
    fields: JSON.stringify([
      {
        id: "mood",
        name: "mood",
        type: "select",
        label: "Mood",
        required: false,
        options: [
          "😊 Happy",
          "😐 Neutral",
          "😔 Sad",
          "😠 Angry",
          "😴 Tired",
          "🤗 Excited",
        ],
      },
      {
        id: "activities",
        name: "activities",
        type: "textarea",
        label: "Activities",
        required: false,
        placeholder: "What did you do today?",
      },
      {
        id: "reflection",
        name: "reflection",
        type: "textarea",
        label: "Reflection",
        required: false,
        placeholder: "Any thoughts or reflections on the day?",
      },
    ]),
  },
  {
    name: "Meal Record",
    description: "Track meals, ingredients, and dietary information",
    category: "Health",
    icon: "🍽️",
    color: "green",
    allowPrivate: 0,
    fields: JSON.stringify([
      {
        id: "meal_type",
        name: "meal_type",
        type: "select",
        label: "Meal Type",
        required: true,
        options: ["Breakfast", "Lunch", "Dinner", "Snack"],
      },
      {
        id: "foods",
        name: "foods",
        type: "textarea",
        label: "Foods",
        required: true,
        placeholder: "What did you eat?",
      },
      {
        id: "calories",
        name: "calories",
        type: "number",
        label: "Estimated Calories",
        required: false,
      },
      {
        id: "notes",
        name: "notes",
        type: "textarea",
        label: "Notes",
        required: false,
        placeholder: "Any additional notes about the meal",
      },
    ]),
  },
  {
    name: "Exercise Log",
    description: "Record workouts, activities, and physical exercise",
    category: "Fitness",
    icon: "🏃",
    color: "orange",
    allowPrivate: 0,
    fields: JSON.stringify([
      {
        id: "exercise_type",
        name: "exercise_type",
        type: "select",
        label: "Exercise Type",
        required: true,
        options: [
          "Cardio",
          "Strength Training",
          "Yoga",
          "Sports",
          "Walking",
          "Other",
        ],
      },
      {
        id: "duration",
        name: "duration",
        type: "number",
        label: "Duration (minutes)",
        required: true,
      },
      {
        id: "intensity",
        name: "intensity",
        type: "select",
        label: "Intensity",
        required: false,
        options: ["Low", "Medium", "High"],
      },
      {
        id: "description",
        name: "description",
        type: "textarea",
        label: "Description",
        required: false,
        placeholder: "Describe the exercise or workout",
      },
    ]),
  },
  {
    name: "Sleep Record",
    description: "Track sleep patterns, quality, and duration",
    category: "Health",
    icon: "😴",
    color: "purple",
    allowPrivate: 1,
    fields: JSON.stringify([
      {
        id: "bedtime",
        name: "bedtime",
        type: "time",
        label: "Bedtime",
        required: false,
      },
      {
        id: "wake_time",
        name: "wake_time",
        type: "time",
        label: "Wake Time",
        required: false,
      },
      {
        id: "sleep_quality",
        name: "sleep_quality",
        type: "select",
        label: "Sleep Quality",
        required: false,
        options: ["Poor", "Fair", "Good", "Excellent"],
      },
      {
        id: "notes",
        name: "notes",
        type: "textarea",
        label: "Sleep Notes",
        required: false,
        placeholder: "Any notes about your sleep",
      },
    ]),
  },
  {
    name: "Medication Log",
    description: "Track medication doses, times, and effects",
    category: "Health",
    icon: "💊",
    color: "red",
    allowPrivate: 1,
    fields: JSON.stringify([
      {
        id: "medication_name",
        name: "medication_name",
        type: "text",
        label: "Medication Name",
        required: true,
      },
      {
        id: "dosage",
        name: "dosage",
        type: "text",
        label: "Dosage",
        required: true,
        placeholder: "e.g., 10mg",
      },
      {
        id: "time_taken",
        name: "time_taken",
        type: "time",
        label: "Time Taken",
        required: false,
      },
      {
        id: "notes",
        name: "notes",
        type: "textarea",
        label: "Notes",
        required: false,
        placeholder: "Any side effects or notes",
      },
    ]),
  },
  {
    name: "Mood Check-in",
    description: "Quick daily mood and energy tracking",
    category: "Wellness",
    icon: "😊",
    color: "yellow",
    allowPrivate: 1,
    fields: JSON.stringify([
      {
        id: "overall_mood",
        name: "overall_mood",
        type: "select",
        label: "Overall Mood",
        required: true,
        options: ["Very Low", "Low", "Neutral", "Good", "Very Good"],
      },
      {
        id: "energy_level",
        name: "energy_level",
        type: "select",
        label: "Energy Level",
        required: false,
        options: ["Exhausted", "Low", "Moderate", "High", "Very High"],
      },
      {
        id: "stress_level",
        name: "stress_level",
        type: "select",
        label: "Stress Level",
        required: false,
        options: ["None", "Low", "Moderate", "High", "Very High"],
      },
      {
        id: "notes",
        name: "notes",
        type: "textarea",
        label: "Notes",
        required: false,
        placeholder: "What's affecting your mood today?",
      },
    ]),
  },
];

/**
 * Demo trackers to seed
 */
const DEMO_TRACKERS = [
  {
    name: "Reading Time",
    description: "Track daily reading sessions",
    type: "time",
    unit: "minutes",
    color: "blue",
    icon: "📚",
    allowPrivate: 0,
  },
  {
    name: "Water Intake",
    description: "Track daily water consumption",
    type: "cumulative",
    unit: "glasses",
    color: "cyan",
    icon: "💧",
    allowPrivate: 0,
  },
  {
    name: "Study Sessions",
    description: "Track study or work sessions",
    type: "time",
    unit: "minutes",
    color: "green",
    icon: "📖",
    allowPrivate: 0,
  },
  {
    name: "Steps",
    description: "Daily step count tracking",
    type: "cumulative",
    unit: "steps",
    color: "orange",
    icon: "👟",
    allowPrivate: 0,
  },
  {
    name: "Screen Time",
    description: "Track daily screen time usage",
    type: "time",
    unit: "minutes",
    color: "red",
    icon: "📱",
    allowPrivate: 1,
  },
];

/**
 * Seeds demo record types for a household
 */
export async function seedDemoRecordTypes(
  db: ReturnType<typeof drizzle>,
  options: DemoDataOptions
): Promise<any[]> {
  const { householdId, userId } = options;
  const createdRecordTypes = [];

  for (const recordType of DEMO_RECORD_TYPES) {
    try {
      const [newRecordType] = await db
        .insert(recordTypes)
        .values({
          ...recordType,
          householdId,
          createdBy: userId,
        })
        .returning();

      createdRecordTypes.push(newRecordType);
    } catch (error) {
      // Skip if already exists (likely duplicate key error)
      console.warn(`Skipped record type ${recordType.name}:`, error);
    }
  }

  return createdRecordTypes;
}

/**
 * Seeds demo trackers for a household
 */
export async function seedDemoTrackers(
  db: ReturnType<typeof drizzle>,
  options: DemoDataOptions
): Promise<any[]> {
  const { householdId, userId, visibleToMembers = [userId] } = options;
  const createdTrackers = [];

  for (const tracker of DEMO_TRACKERS) {
    try {
      const [newTracker] = await db
        .insert(trackers)
        .values({
          ...tracker,
          householdId,
          createdBy: userId,
          visibleToMembers: JSON.stringify(visibleToMembers),
        })
        .returning();

      createdTrackers.push(newTracker);
    } catch (error) {
      // Skip if already exists (likely duplicate key error)
      console.warn(`Skipped tracker ${tracker.name}:`, error);
    }
  }

  return createdTrackers;
}

/**
 * Seeds all demo data (record types and trackers) for a household
 */
export async function seedAllDemoData(
  db: ReturnType<typeof drizzle>,
  options: DemoDataOptions
): Promise<DemoDataResult> {
  try {
    const [recordTypesCreated, trackersCreated] = await Promise.all([
      seedDemoRecordTypes(db, options),
      seedDemoTrackers(db, options),
    ]);

    return {
      success: true,
      recordTypes: recordTypesCreated,
      trackers: trackersCreated,
      message: `Successfully created ${recordTypesCreated.length} record types and ${trackersCreated.length} trackers`,
    };
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return {
      success: false,
      recordTypes: [],
      trackers: [],
      message: `Failed to seed demo data: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
