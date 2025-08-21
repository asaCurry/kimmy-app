#!/usr/bin/env node

import { execSync } from "child_process";

const DB_NAME = "kimmy-app-db";

function getTableSchema(environment, tableName) {
  const flag = environment === "remote" ? "--remote" : "--local";
  const command = `wrangler d1 execute ${DB_NAME} ${flag} --command="PRAGMA table_info(${tableName});"`;

  try {
    const output = execSync(command, { encoding: "utf8" });
    return output;
  } catch (error) {
    console.error(
      `❌ Failed to get schema for ${tableName} from ${environment} database:`,
      error.message
    );
    return null;
  }
}

function compareSchemas() {
  console.log("🔍 Database Schema Comparison Tool");
  console.log("==================================");

  const tables = [
    "users",
    "records",
    "record_types",
    "quick_notes",
    "contact_submissions",
  ];

  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`);
    console.log("─".repeat(50));

    const localSchema = getTableSchema("local", table);
    const remoteSchema = getTableSchema("remote", table);

    if (localSchema && remoteSchema) {
      if (localSchema === remoteSchema) {
        console.log("✅ Schemas match");
      } else {
        console.log("❌ Schemas differ");
        console.log("\nLocal schema:");
        console.log(localSchema);
        console.log("\nRemote schema:");
        console.log(remoteSchema);
      }
    } else {
      console.log("⚠️  Could not retrieve one or both schemas");
    }
  }
}

function main() {
  try {
    compareSchemas();
  } catch (error) {
    console.error("Error during schema comparison:", error);
    process.exit(1);
  }
}

main();
