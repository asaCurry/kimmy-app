#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const MIGRATIONS_DIR = join(__dirname, '..', 'db', 'migrations');
const DB_NAME = 'kimmy-app-db';

function getMigrationFiles() {
  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure migrations are applied in order
    
    console.log('Found migration files:', files);
    return files;
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    process.exit(1);
  }
}

function applyMigrations(environment) {
  const flag = environment === 'remote' ? '--remote' : '--local';
  const migrationFiles = getMigrationFiles();
  
  console.log(`\n🚀 Applying migrations to ${environment} database...`);
  
  for (const file of migrationFiles) {
    const filePath = join(MIGRATIONS_DIR, file);
    console.log(`\n📝 Applying migration: ${file}`);
    
    try {
      const command = `wrangler d1 execute ${DB_NAME} ${flag} --file=${filePath}`;
      console.log(`Executing: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ Migration applied successfully');
      console.log(output);
    } catch (error) {
      console.error(`❌ Failed to apply migration ${file}:`, error.message);
      if (error.stdout) console.log('STDOUT:', error.stdout);
      if (error.stderr) console.log('STDERR:', error.stderr);
      process.exit(1);
    }
  }
  
  console.log(`\n🎉 All migrations applied successfully to ${environment} database!`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || !['local', 'remote', 'both'].includes(command)) {
    console.log('Usage: node scripts/migrate.js <local|remote|both>');
    console.log('');
    console.log('Commands:');
    console.log('  local   - Apply migrations to local development database');
    console.log('  remote  - Apply migrations to remote D1 database');
    console.log('  both    - Apply migrations to both databases');
    process.exit(1);
  }
  
  console.log('🔄 Database Migration Tool');
  console.log('==========================');
  
  if (command === 'local' || command === 'both') {
    applyMigrations('local');
  }
  
  if (command === 'remote' || command === 'both') {
    applyMigrations('remote');
  }
}

main();
