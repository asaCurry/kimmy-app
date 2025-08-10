# Database Architecture - Cleaned Up

## Overview

This application uses **Cloudflare D1** as the database with **Drizzle ORM** for type-safe database operations. The architecture has been cleaned up to follow the correct pattern for Cloudflare Workers applications.

## Key Principles

✅ **CORRECT PATTERN:**
- Each function creates its own database instance when needed
- Database operations happen in route loaders/actions
- Functions receive `env` parameter and access `env.DB`
- No global database state or context
- Centralized database creation function in `db/index.ts`

❌ **REMOVED (obsolete patterns):**
- ~~Global database context provider~~
- ~~Maintaining database state across the app~~
- ~~Passing database objects through React state~~
- ~~Duplicate database creation functions~~
- ~~Mock data files~~
- ~~Old authentication files~~

## File Structure

```
db/
├── index.ts              # Centralized database creation function
├── schema.ts             # Database schema definitions
└── migrations/           # Database migrations

app/
├── lib/
│   ├── db.ts            # Database utility functions (userDb, familyDb, etc.)
│   └── auth-db.ts       # Authentication API functions
└── routes/               # Route files that use database utilities
```

## Database Usage Pattern

### 1. Centralized Database Creation

All database instances are created using the centralized function:

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDatabase(db: D1Database) {
  return drizzle(db, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
```

### 2. Database Utility Functions

Each utility function creates its own database instance:

```typescript
// app/lib/db.ts
import { createDatabase } from '../../db';

export const userDb = {
  async findByEmail(env: any, email: string): Promise<User | undefined> {
    if (!env?.DB) {
      throw new Error('Database not available');
    }
    
    const db = createDatabase(env.DB); // Creates new instance per call
    
    try {
      const result = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase().trim()))
        .limit(1);
      
      return result[0];
    } catch (error) {
      console.error('Failed to find user by email:', error);
      throw new Error('Failed to find user');
    }
  },
  
  // ... other functions
};
```

### 3. Route Usage

Route loaders and actions use the database utilities:

```typescript
// app/routes/home.tsx
export async function loader({ context }: Route.LoaderArgs) {
  const env = (context.cloudflare as any)?.env;
  
  if (!env?.DB) {
    throw new Error('Database not available');
  }

  // Use database utilities - each creates its own instance
  const users = await userDb.findByFamilyId(env, familyId);
  
  return { users };
}
```

## Available Database Utilities

### User Operations (`userDb`)
- `create(env, userData)` - Create new user
- `findByEmail(env, email)` - Find user by email
- `findById(env, id)` - Find user by ID
- `findByFamilyId(env, familyId)` - Find users in family
- `updateRole(env, userId, role)` - Update user role
- `verifyPassword(password, hashedPassword)` - Verify password

### Family Operations (`familyDb`)
- `generateFamilyId()` - Generate unique family ID
- `getMembers(env, familyId)` - Get family members
- `getAdmins(env, familyId)` - Get family admins
- `addMember(env, memberData)` - Add member to family

### Record Type Operations (`recordTypeDb`)
- `create(env, recordTypeData)` - Create record type
- `findByFamilyId(env, familyId)` - Find record types in family
- `findById(env, id)` - Find record type by ID

### Record Operations (`recordDb`)
- `create(env, recordData)` - Create record
- `findByFamilyId(env, familyId)` - Find records in family
- `findByRecordType(env, recordTypeId, familyId)` - Find records by type
- `findById(env, id)` - Find record by ID

### Authentication Operations (`authDb`)
- `authenticateUser(env, email, password)` - Authenticate user
- `createUserWithFamily(env, userData)` - Create user with family

## Development Setup

### 1. Start Development Server

```bash
# This is the ONLY correct way to run with database access
npx wrangler dev --local
```

**Why this is required:**
- Provides D1 bindings automatically
- Creates local SQLite database file
- Simulates the Cloudflare Workers environment

### 2. Alternative (NOT recommended for development)
```bash
npm run dev  # This will NOT have database access
```

## Common Issues and Solutions

### Error: "Database not available"

**Cause:** Route not receiving proper `env` parameter or D1 bindings not available

**Solution:** 
1. Ensure route loader receives `context.cloudflare.env`
2. Run `npx wrangler dev --local` instead of `npm run dev`
3. Check that `env.DB` exists before using database utilities

### Error: "this.client.prepare is not a function"

**Cause:** Trying to use database functions without proper D1 bindings

**Solution:** 
1. Run `npx wrangler dev --local` instead of `npm run dev`
2. Ensure your route loader receives the `env` parameter correctly

## Migration Notes

The following files were removed during cleanup:
- `app/lib/dev-database.ts` - Obsolete development utilities
- `app/contexts/database-context.tsx` - Obsolete context provider
- `app/lib/auth.ts` - Old authentication system
- `app/lib/mock-data.ts` - Obsolete mock data

All database operations now follow the correct pattern of creating database instances per function call using `env.DB`.
