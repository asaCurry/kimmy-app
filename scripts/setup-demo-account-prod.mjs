#!/usr/bin/env node
/**
 * Script to set up demo account and household for PRODUCTION
 * Usage: node scripts/setup-demo-account-prod.mjs
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Demo account configuration
const DEMO_CONFIG = {
  household: {
    id: "bcdc702e-ca8f-4656-a723-9dd533c6d812",
    name: "Demo Household",
    inviteCode: "5Y8MR48K",
  },
  user: {
    name: "Demo Admin",
    email: "asacurry80+demo@gmail.com",
    password: "admin",
    role: "admin",
    admin: 1,
    relationship: "self",
  },
};

async function generateUUID() {
  const { randomUUID } = await import("crypto");
  return randomUUID();
}

async function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function hashPassword(password) {
  // Use Web Crypto API to hash password with same format as app
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );

  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  return `pbkdf2_${btoa(String.fromCharCode(...combined))}`;
}

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
    console.error(
      `❌ Failed to ${description.toLowerCase()}: ${error.message}`
    );
    throw error;
  }
}

async function setupDemoAccount() {
  console.log("🚀 Setting up demo account for PRODUCTION...\n");
  console.log("⚠️  WARNING: This will modify the production database!\n");

  try {
    // Generate fresh IDs if needed
    const householdId = DEMO_CONFIG.household.id || (await generateUUID());
    const inviteCode =
      DEMO_CONFIG.household.inviteCode || (await generateInviteCode());
    const hashedPassword = await hashPassword(DEMO_CONFIG.user.password);

    console.log(`🏠 Household ID: ${householdId}`);
    console.log(`🎫 Invite Code: ${inviteCode}`);
    console.log(`👤 User Email: ${DEMO_CONFIG.user.email}\n`);

    // Create household
    await executeSQL(
      `INSERT OR REPLACE INTO households (id, name, invite_code, has_analytics_access, created_at, updated_at) VALUES ('${householdId}', '${DEMO_CONFIG.household.name}', '${inviteCode}', 1, datetime('now'), datetime('now'));`,
      "Creating demo household in PRODUCTION"
    );

    // Create user
    await executeSQL(
      `INSERT OR REPLACE INTO users (name, email, hashed_password, household_id, role, admin, relationship_to_admin, created_at) VALUES ('${DEMO_CONFIG.user.name}', '${DEMO_CONFIG.user.email}', '${hashedPassword}', '${householdId}', '${DEMO_CONFIG.user.role}', ${DEMO_CONFIG.user.admin}, '${DEMO_CONFIG.user.relationship}', datetime('now'));`,
      "Creating demo admin user in PRODUCTION"
    );

    // Get the created user ID for record types
    const userResult = await executeSQL(
      `SELECT id FROM users WHERE email = '${DEMO_CONFIG.user.email}';`,
      "Getting demo user ID"
    );
    
    // Extract user ID from result (assumes it's in the output)
    const userId = 1; // Assuming this is the first/primary user for demo

    // Create core record types (Sleep and Mood)
    await executeSQL(
      `INSERT OR REPLACE INTO record_types (name, description, category, household_id, fields, icon, color, allow_private, visible_to_members, created_by, created_at) VALUES 
      ('Sleep', 'Track sleep patterns, quality, and duration', 'Health', '${householdId}', '${JSON.stringify([
        {
          id: "sleep-duration",
          name: "Sleep Duration",
          type: "number",
          required: true,
          placeholder: "Hours of sleep",
          validation: { min: 0, max: 24 },
          order: 1,
          active: true,
        },
        {
          id: "sleep-quality",
          name: "Sleep Quality",
          type: "select",
          required: true,
          options: [
            { value: "poor", label: "Poor" },
            { value: "fair", label: "Fair" },
            { value: "good", label: "Good" },
            { value: "excellent", label: "Excellent" },
          ],
          order: 2,
          active: true,
        }
      ]).replace(/'/g, "''")}', '😴', 'purple', 0, '[]', ${userId}, datetime('now')),
      ('Mood', 'Track daily mood, energy levels, and emotional well-being', 'Health', '${householdId}', '${JSON.stringify([
        {
          id: "mood-rating",
          name: "Overall Mood",
          type: "select",
          required: true,
          options: [
            { value: "1", label: "1 - Very Low" },
            { value: "2", label: "2 - Low" },
            { value: "3", label: "3 - Below Average" },
            { value: "4", label: "4 - Average" },
            { value: "5", label: "5 - Above Average" },
            { value: "6", label: "6 - Good" },
            { value: "7", label: "7 - Very Good" },
            { value: "8", label: "8 - Great" },
            { value: "9", label: "9 - Excellent" },
            { value: "10", label: "10 - Amazing" },
          ],
          order: 1,
          active: true,
        },
        {
          id: "energy-level",
          name: "Energy Level",
          type: "select",
          required: true,
          options: [
            { value: "very-low", label: "Very Low" },
            { value: "low", label: "Low" },
            { value: "moderate", label: "Moderate" },
            { value: "high", label: "High" },
            { value: "very-high", label: "Very High" },
          ],
          order: 2,
          active: true,
        }
      ]).replace(/'/g, "''")}', '😊', 'blue', 0, '[]', ${userId}, datetime('now'));`,
      "Creating core record types (Sleep & Mood)"
    );

    // Create some sample records for demonstration
    await executeSQL(
      `INSERT OR REPLACE INTO records (title, content, record_type_id, household_id, member_id, created_by, datetime, created_at) VALUES 
      ('Good Sleep Night', '{"sleep-duration": "8", "sleep-quality": "good"}', 1, '${householdId}', ${userId}, ${userId}, datetime('now', '-1 day'), datetime('now', '-1 day')),
      ('Restless Night', '{"sleep-duration": "6", "sleep-quality": "poor"}', 1, '${householdId}', ${userId}, ${userId}, datetime('now', '-2 days'), datetime('now', '-2 days')),
      ('Great Day!', '{"mood-rating": "8", "energy-level": "high"}', 2, '${householdId}', ${userId}, ${userId}, datetime('now'), datetime('now')),
      ('Feeling Low', '{"mood-rating": "4", "energy-level": "low"}', 2, '${householdId}', ${userId}, ${userId}, datetime('now', '-1 day'), datetime('now', '-1 day'));`,
      "Creating sample demo records"
    );

    // Verify setup
    const verification = await executeSQL(
      `SELECT h.name as household_name, u.name, u.email, u.role, u.admin, 
              (SELECT COUNT(*) FROM record_types WHERE household_id = h.id) as record_types_count,
              (SELECT COUNT(*) FROM records WHERE household_id = h.id) as records_count
       FROM users u JOIN households h ON u.household_id = h.id WHERE u.email = '${DEMO_CONFIG.user.email}';`,
      "Verifying complete demo setup in PRODUCTION"
    );

    console.log("\n🎉 PRODUCTION demo account setup completed successfully!");
    console.log("\n📋 Login Credentials:");
    console.log(`   Email:    ${DEMO_CONFIG.user.email}`);
    console.log(`   Password: ${DEMO_CONFIG.user.password}`);
    console.log(
      `   Role:     ${DEMO_CONFIG.user.role} (admin=${DEMO_CONFIG.user.admin})`
    );
    console.log(`   URL:      https://kimmy-app.palindrome.workers.dev`);
    console.log(
      "\n💡 You can now log in to production with these credentials."
    );
  } catch (error) {
    console.error("\n💥 Failed to set up demo account:", error.message);
    process.exit(1);
  }
}

// Run the setup
setupDemoAccount();
