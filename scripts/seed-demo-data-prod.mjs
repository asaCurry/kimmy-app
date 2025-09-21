#!/usr/bin/env node
/**
 * Demo Data Seeding Utility for PRODUCTION
 * 
 * This script adds demo data directly to the production database.
 * Usage: node scripts/seed-demo-data-prod.mjs [household-id] [user-id]
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const DEMO_HOUSEHOLD_ID = "bcdc702e-ca8f-4656-a723-9dd533c6d812";
const DEMO_USER_ID = 1; // Assuming the demo user has ID 1

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

async function executeSQL(command, description) {
  console.log(`📝 ${description}...`);
  try {
    // Use --remote flag for production database
    const { stdout } = await execAsync(
      `npx wrangler d1 execute kimmy-app-db --remote --command="${command}"`
    );
    console.log(`✅ ${description} completed`);
    return stdout;
  } catch (error) {
    console.error(`❌ Failed to ${description.toLowerCase()}: ${error.message}`);
    // Don't throw on "already exists" errors
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('already exists')) {
      console.log(`  ⚠️  Item may already exist, continuing...`);
      return null;
    }
    throw error;
  }
}

/**
 * Add demo record types to a household
 */
async function seedRecordTypes(householdId, createdBy) {
  console.log(`🌱 Seeding record types for household ${householdId}...`);

  let createdCount = 0;

  for (const recordType of basicRecordTypes) {
    try {
      // Escape single quotes in JSON fields
      const escapedFields = recordType.fields.replace(/'/g, "''");
      
      const command = `INSERT INTO record_types (name, description, category, icon, color, allow_private, fields, household_id, created_by, created_at, updated_at) VALUES ('${recordType.name}', '${recordType.description}', '${recordType.category}', '${recordType.icon}', '${recordType.color}', ${recordType.allowPrivate}, '${escapedFields}', '${householdId}', ${createdBy}, datetime('now'), datetime('now'));`;
      
      await executeSQL(command, `Creating record type: ${recordType.name}`);
      createdCount++;
      console.log(`  ✅ Created record type: ${recordType.name}`);
    } catch (error) {
      console.log(`  ⚠️  Skipped ${recordType.name} (may already exist): ${error.message}`);
    }
  }

  return createdCount;
}

/**
 * Add demo trackers to a household 
 */
async function seedTrackers(householdId, createdBy, visibleToMembers) {
  console.log(`🎯 Seeding trackers for household ${householdId}...`);

  let createdCount = 0;

  for (const tracker of sampleTrackers) {
    try {
      const visibleToMembersJson = JSON.stringify(visibleToMembers).replace(/'/g, "''");
      
      const command = `INSERT INTO trackers (name, description, type, unit, color, icon, household_id, created_by, visible_to_members, allow_private, created_at, updated_at) VALUES ('${tracker.name}', '${tracker.description}', '${tracker.type}', '${tracker.unit}', '${tracker.color}', '${tracker.icon}', '${householdId}', ${createdBy}, '${visibleToMembersJson}', 0, datetime('now'), datetime('now'));`;
      
      await executeSQL(command, `Creating tracker: ${tracker.name}`);
      createdCount++;
      console.log(`  ✅ Created tracker: ${tracker.name}`);
    } catch (error) {
      console.log(`  ⚠️  Skipped ${tracker.name} (may already exist): ${error.message}`);
    }
  }

  return createdCount;
}

/**
 * Main seeding function
 */
async function seedDemoData(householdId = DEMO_HOUSEHOLD_ID, userId = DEMO_USER_ID) {
  console.log(`🚀 Starting demo data seeding for PRODUCTION...`);
  console.log(`📋 Household ID: ${householdId}`);
  console.log(`👤 User ID: ${userId}\n`);
  console.log(`⚠️  WARNING: This will modify the production database!\n`);

  try {
    // Seed record types
    const recordTypesCreated = await seedRecordTypes(householdId, userId);

    // Seed trackers (assuming all household members can see them) 
    const trackersCreated = await seedTrackers(householdId, userId, [userId]);

    console.log(`\n🎉 Demo data seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`  - Record types created: ${recordTypesCreated}`);
    console.log(`  - Trackers created: ${trackersCreated}`);

    return {
      success: true,
      recordTypesCreated,
      trackersCreated,
    };
  } catch (error) {
    console.error(`❌ Error seeding demo data:`, error);
    throw error;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const householdId = process.argv[2] || DEMO_HOUSEHOLD_ID;
  const userId = process.argv[3] ? parseInt(process.argv[3]) : DEMO_USER_ID;

  console.log(`Using household ID: ${householdId}`);
  console.log(`Using user ID: ${userId}\n`);

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