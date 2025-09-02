# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development
npm run dev                 # Start local development server
npm run dev:local          # Start with Wrangler local development

# Building and Type Checking
npm run build              # Build the application
npm run typecheck          # Run TypeScript type checking
npm run cf-typegen         # Generate Cloudflare types

# Formatting
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting
npm run format:fix         # Fix formatting issues

# Code Quality
npm run lint               # Run ESLint to check code quality
npm run lint:fix           # Auto-fix ESLint issues where possible
npm run lint:check         # Same as lint (alias for consistency)
npm run quality            # Format, lint fix, and test (comprehensive cleanup)
npm run validate           # Full validation: typecheck + lint + tests
npm run pre-commit         # Run pre-commit checks manually

# Testing
npm run test               # Run tests in watch mode
npm run test:run           # Run tests once
npm run test:ui            # Run tests with Vitest UI
npm run test:coverage      # Run tests with coverage report

# Database Management
npm run db:generate        # Generate Drizzle migrations
npm run db:migrate         # Apply migrations to local DB
npm run db:migrate:remote  # Apply migrations to remote DB
npm run db:migrate:both    # Apply migrations to both local and remote
npm run db:reset:local     # Reset local database (destroys all data)
npm run db:reset:remote    # Reset remote database (destroys all data)
npm run db:reset:both      # Reset both databases (destroys all data)
npm run db:verify          # Verify database sync status
npm run db:studio          # Open Drizzle Studio for database inspection

# Deployment
npm run deploy             # Build and deploy to Cloudflare Workers
npm run preview            # Build and preview locally
```

## Code Architecture

### Tech Stack

- **Frontend**: React 19 + React Router 7 + TypeScript
- **Backend**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **UI**: shadcn/ui components + Tailwind CSS v4
- **Deployment**: Cloudflare Workers

### Project Structure

```
app/                          # React Router application
├── components/               # React components
│   ├── ui/                  # shadcn/ui components
│   └── manage/              # Household management components
├── contexts/                # React contexts (auth, household, etc.)
├── hooks/                   # Custom React hooks
├── lib/                     # Core utilities and database logic
│   ├── db.ts                # Database connection and client
│   ├── types.ts             # TypeScript type definitions
│   ├── schemas.ts           # Zod validation schemas
│   ├── utils/               # Utility functions
│   │   └── dynamic-fields/  # Dynamic form field system
│   ├── auth-db.ts           # Authentication database operations
│   └── tracker-db.ts        # Tracker database operations
├── routes/                  # React Router route handlers
│   ├── index.tsx            # Main dashboard
│   ├── login.tsx            # Authentication
│   ├── member.$memberId.*   # Member-specific record routes
│   └── api.*                # API endpoints
└── root.tsx                 # Application root

db/                          # Database schema and configuration
├── schema.ts               # Drizzle schema definitions
└── index.ts                # Database exports

workers/                    # Cloudflare Workers entry point
└── app.ts                  # Hono application setup

scripts/                    # Database utility scripts
├── migrate.js              # Migration runner
├── reset-db.js             # Database reset utility
└── verify-sync.js          # Database sync verification
```

### Database Schema

The application uses a SQLite-based schema with these core entities:

- **households**: Family/group units with invite codes
- **users**: Authenticated users (adults with accounts)
- **recordTypes**: Dynamic form templates for different record categories
- **records**: Actual data entries for household members
- **trackers**: Time tracking and activity logging
- **quickNotes**: Rapid note-taking functionality

### Dynamic Fields System

The application features a sophisticated dynamic form system located in `app/lib/utils/dynamic-fields/`:

- **field-creation.ts**: Field creation and defaults
- **field-validation.ts**: Validation logic
- **field-manipulation.ts**: Field ordering and manipulation
- **field-serialization.ts**: Data conversion
- **schema-generation.ts**: Dynamic Zod schema generation

### Authentication & Context

- Authentication handled via `app/contexts/auth-context.tsx`
- Household management via `app/contexts/household-context.tsx`
- Record management via `app/contexts/record-management-context.tsx`

### Route Patterns

- `/member/:memberId` - Member-specific views
- `/member/:memberId/category/:category` - Category-specific records
- `/member/:memberId/tracker/:trackerId` - Time tracking
- `/manage` - Household administration
- `/api/*` - Backend API endpoints

### UI Components

Built with shadcn/ui and custom components:

- Form components with dynamic field support
- Interactive cards and navigation
- Loading states and error boundaries
- Responsive layout system

### Environment Configuration

- **wrangler.toml**: Cloudflare Workers configuration
- **vite.config.ts**: Vite + React Router + Tailwind setup
- **drizzle.config.ts**: Database migration configuration
- Path aliases: `~` maps to `./app`, `~/db` maps to `./db`

### Development Notes

- **Git hooks automatically ensure code quality:**
  - Pre-commit: Runs lint-staged (format + lint staged files) + tests
  - Pre-push: Full validation on main/master, lighter checks on feature branches
- **Manual quality commands:**
  - `npm run quality` - Comprehensive cleanup (format + lint fix + tests)
  - `npm run validate` - Full validation (typecheck + lint + tests)
  - `npm run pre-commit` - Test pre-commit checks manually
- **ESLint configuration:**
  - Modern, non-aggressive rules focused on correctness
  - React Hooks correctness (critical for app stability)
  - TypeScript best practices without being overly restrictive
- Database changes require running `npm run db:generate` then migration commands
- Local development uses D1 local mode, production uses Cloudflare D1
- The dynamic fields system is modular - import specific utilities rather than the main barrel export for better performance
