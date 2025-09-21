#!/usr/bin/env node
/**
 * Script to set up demo account and household for local development
 * Usage: node scripts/setup-demo-account.mjs
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
    const { stdout } = await execAsync(
      `npx wrangler d1 execute kimmy-app-db --local --command="${command}"`
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
  console.log("🚀 Setting up demo account for local development...\n");

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
      "Creating demo household"
    );

    // Create user
    await executeSQL(
      `INSERT OR REPLACE INTO users (name, email, hashed_password, household_id, role, admin, relationship_to_admin, created_at) VALUES ('${DEMO_CONFIG.user.name}', '${DEMO_CONFIG.user.email}', '${hashedPassword}', '${householdId}', '${DEMO_CONFIG.user.role}', ${DEMO_CONFIG.user.admin}, '${DEMO_CONFIG.user.relationship}', datetime('now'));`,
      "Creating demo admin user"
    );

    // Verify setup
    const verification = await executeSQL(
      `SELECT h.name as household_name, u.name, u.email, u.role, u.admin FROM users u JOIN households h ON u.household_id = h.id WHERE u.email = '${DEMO_CONFIG.user.email}';`,
      "Verifying demo setup"
    );

    console.log("\n🎉 Demo account setup completed successfully!");
    console.log("\n📋 Login Credentials:");
    console.log(`   Email:    ${DEMO_CONFIG.user.email}`);
    console.log(`   Password: ${DEMO_CONFIG.user.password}`);
    console.log(
      `   Role:     ${DEMO_CONFIG.user.role} (admin=${DEMO_CONFIG.user.admin})`
    );
    console.log(
      "\n💡 You can now start the dev server and log in with these credentials."
    );
  } catch (error) {
    console.error("\n💥 Failed to set up demo account:", error.message);
    process.exit(1);
  }
}

// Run the setup
setupDemoAccount();
