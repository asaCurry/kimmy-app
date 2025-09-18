#!/usr/bin/env node

/**
 * Demo Data Seeding Utility
 *
 * This script adds demo data directly to the database.
 * Usage: node scripts/seed-demo-data.js [household-id]
 */

import { drizzle } from "drizzle-orm/d1";
import Database from "better-sqlite3";
import { recordTypes, records, trackers } from "../db/schema.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection for local development
const sqlite = new Database(
  path.join(
    __dirname,
    "../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/6d9a4a6c-81c4-4338-9c5d-4c688f57091a.sqlite"
  )
);
const db = drizzle(sqlite);

/**
 * Basic record types to seed
 */
const basicRecordTypes = [
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
];

/**
 * Sample trackers to seed
 */
const sampleTrackers = [
  {
    name: "Reading Time",
    description: "Track daily reading sessions",
    type: "time",
    unit: "minutes",
    color: "blue",
    icon: "📚",
  },
  {
    name: "Water Intake",
    description: "Track daily water consumption",
    type: "cumulative",
    unit: "glasses",
    color: "cyan",
    icon: "💧",
  },
  {
    name: "Study Sessions",
    description: "Track study or work sessions",
    type: "time",
    unit: "minutes",
    color: "green",
    icon: "📖",
  },
];

/**
 * Add demo record types to a household
 */
async function seedRecordTypes(householdId, createdBy) {
  console.log(`🌱 Seeding record types for household ${householdId}...`);

  const createdRecordTypes = [];

  for (const recordType of basicRecordTypes) {
    try {
      const [newRecordType] = await db
        .insert(recordTypes)
        .values({
          ...recordType,
          householdId,
          createdBy,
        })
        .returning();

      createdRecordTypes.push(newRecordType);
      console.log(`  ✅ Created record type: ${recordType.name}`);
    } catch (error) {
      console.log(
        `  ⚠️  Skipped ${recordType.name} (may already exist): ${error.message}`
      );
    }
  }

  return createdRecordTypes;
}

/**
 * Add demo trackers to a household
 */
async function seedTrackers(householdId, createdBy, visibleToMembers) {
  console.log(`🎯 Seeding trackers for household ${householdId}...`);

  const createdTrackers = [];

  for (const tracker of sampleTrackers) {
    try {
      const [newTracker] = await db
        .insert(trackers)
        .values({
          ...tracker,
          householdId,
          createdBy,
          visibleToMembers: JSON.stringify(visibleToMembers),
          allowPrivate: 0,
        })
        .returning();

      createdTrackers.push(newTracker);
      console.log(`  ✅ Created tracker: ${tracker.name}`);
    } catch (error) {
      console.log(
        `  ⚠️  Skipped ${tracker.name} (may already exist): ${error.message}`
      );
    }
  }

  return createdTrackers;
}

/**
 * Main seeding function
 */
async function seedDemoData(householdId, userId = 1) {
  console.log(`🚀 Starting demo data seeding...`);
  console.log(`📋 Household ID: ${householdId}`);
  console.log(`👤 User ID: ${userId}\n`);

  try {
    // Seed record types
    const recordTypesCreated = await seedRecordTypes(householdId, userId);

    // Seed trackers (assuming all household members can see them)
    const trackersCreated = await seedTrackers(householdId, userId, [userId]);

    console.log(`\n🎉 Demo data seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`  - Record types created: ${recordTypesCreated.length}`);
    console.log(`  - Trackers created: ${trackersCreated.length}`);

    return {
      success: true,
      recordTypes: recordTypesCreated,
      trackers: trackersCreated,
    };
  } catch (error) {
    console.error(`❌ Error seeding demo data:`, error);
    throw error;
  } finally {
    sqlite.close();
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const householdId = process.argv[2];
  const userId = process.argv[3] ? parseInt(process.argv[3]) : 1;

  if (!householdId) {
    console.error("❌ Please provide a household ID");
    console.log(
      "Usage: node scripts/seed-demo-data.js <household-id> [user-id]"
    );
    process.exit(1);
  }

  seedDemoData(householdId, userId)
    .then(() => {
      console.log("✨ All done!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Failed to seed demo data:", error);
      process.exit(1);
    });
}

export { seedDemoData };
