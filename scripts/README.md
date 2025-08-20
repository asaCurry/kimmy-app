# Database Scripts

This directory contains utility scripts for managing your Kimmy App database.

## Database Reset Utility

The `reset-db.js` script provides a quick way to completely wipe and recreate your database during development.

### ⚠️ **WARNING: This will DELETE ALL DATA!**

This utility is designed for development use only. It will completely remove all tables and data from your database.

### Usage

```bash
# Reset local development database
npm run db:reset:local

# Reset remote production database (DANGEROUS!)
npm run db:reset:remote

# Reset both local and remote databases (DANGEROUS!)
npm run db:reset:both
```

### What It Does

1. **Drops all existing tables** from the specified database
2. **Applies all migrations** to recreate tables with the current schema
3. **Results in a fresh database** with the corrected timestamp schema

### When to Use

- ✅ **Development testing** - when you want to start fresh
- ✅ **Schema changes** - after major schema modifications
- ✅ **Data cleanup** - when you want to remove all test data
- ❌ **Production** - never use on production without backup
- ❌ **Partial resets** - this resets everything, not just specific tables

### Safety Features

- **5-second delay** for remote operations (gives you time to cancel with Ctrl+C)
- **Clear warnings** about data deletion
- **Graceful cancellation** handling
- **Colored output** for easy reading

### Example Output

```
🔧 Kimmy App Database Reset Utility
=====================================
📍 Resetting LOCAL database...
🚀 Starting database reset for local environment
🗑️  Dropping all tables from local database...
🔄 Dropping tables from local database...
✅ Dropping tables from local database completed
🏗️  Recreating tables with fresh schema in local database...
🔄 Applying migrations to local database...
✅ Applying migrations to local database completed
🎉 Database reset completed successfully for local!
📊 Your local database now has fresh tables with the corrected timestamp schema.
```

### Manual Reset (Alternative)

If you prefer to reset manually:

```bash
# 1. Drop all tables
npx wrangler d1 execute kimmy-app-db --local --command="DROP TABLE IF EXISTS households; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS record_types; DROP TABLE IF EXISTS records; DROP TABLE IF EXISTS quick_notes; DROP TABLE IF EXISTS contact_submissions; DROP TABLE IF EXISTS d1_migrations;"

# 2. Reapply migrations
npx wrangler d1 migrations apply kimmy-app-db --local
```

### Notes

- The script automatically handles the `d1_migrations` table
- All tables are recreated with the current schema from your migrations
- Timestamp fields will now use proper SQLite `datetime('now')` defaults
- No data migration is performed - this is a complete reset
