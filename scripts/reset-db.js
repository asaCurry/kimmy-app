#!/usr/bin/env node

/**
 * Database Reset Utility
 * 
 * This script completely wipes the database and recreates all tables
 * with the current schema. Use during development when you want a fresh start.
 * 
 * Usage:
 *   npm run db:reset:local    # Reset local database
 *   npm run db:reset:remote   # Reset remote database
 *   npm run db:reset:both     # Reset both local and remote databases
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_NAME = 'kimmy-app-db';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'info');
    execSync(command, { stdio: 'inherit', cwd: join(__dirname, '..') });
    log(`✅ ${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'error');
    return false;
  }
}

function resetDatabase(environment) {
  log(`🚀 Starting database reset for ${environment} environment`, 'info');
  
  try {
    // Step 1: Drop all tables (this will clear the database)
    log(`🗑️  Dropping all tables from ${environment} database...`, 'warning');
    const dropCommand = `npx wrangler d1 execute ${DB_NAME} --${environment} --command="DROP TABLE IF EXISTS households; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS record_types; DROP TABLE IF EXISTS records; DROP TABLE IF EXISTS quick_notes; DROP TABLE IF EXISTS contact_submissions; DROP TABLE IF EXISTS d1_migrations;"`;
    
    if (!runCommand(dropCommand, `Dropping tables from ${environment} database`)) {
      throw new Error(`Failed to drop tables from ${environment} database`);
    }
    
    // Step 2: Apply migrations to recreate tables with fresh schema
    log(`🏗️  Recreating tables with fresh schema in ${environment} database...`, 'info');
    const migrateCommand = `npx wrangler d1 migrations apply ${DB_NAME} --${environment}`;
    
    if (!runCommand(migrateCommand, `Applying migrations to ${environment} database`)) {
      throw new Error(`Failed to apply migrations to ${environment} database`);
    }
    
    log(`🎉 Database reset completed successfully for ${environment}!`, 'success');
    log(`📊 Your ${environment} database now has fresh tables with the corrected timestamp schema.`, 'success');
    
  } catch (error) {
    log(`💥 Database reset failed for ${environment}: ${error.message}`, 'error');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  log('🔧 Kimmy App Database Reset Utility', 'info');
  log('=====================================', 'info');
  
  switch (command) {
    case 'local':
      log('📍 Resetting LOCAL database...', 'info');
      resetDatabase('local');
      break;
      
    case 'remote':
      log('☁️  Resetting REMOTE database...', 'warning');
      log('⚠️  This will delete ALL data from your production database!', 'warning');
      log('⚠️  Are you sure you want to continue? (Ctrl+C to cancel)', 'warning');
      
      // Give user 5 seconds to cancel
      setTimeout(() => {
        resetDatabase('remote');
      }, 5000);
      break;
      
    case 'both':
      log('🔄 Resetting BOTH local and remote databases...', 'warning');
      log('⚠️  This will delete ALL data from BOTH databases!', 'warning');
      log('⚠️  Are you sure you want to continue? (Ctrl+C to cancel)', 'warning');
      
      // Give user 5 seconds to cancel
      setTimeout(() => {
        resetDatabase('local');
        resetDatabase('remote');
      }, 5000);
      break;
      
    default:
      log('❌ Invalid command. Available options:', 'error');
      log('   npm run db:reset:local    # Reset local database', 'info');
      log('   npm run db:reset:remote   # Reset remote database', 'info');
      log('   npm run db:reset:both     # Reset both databases', 'info');
      log('', 'info');
      log('💡 Example: node scripts/reset-db.js local', 'info');
      process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n🛑 Database reset cancelled by user', 'warning');
  process.exit(0);
});

// Run the script
main();
