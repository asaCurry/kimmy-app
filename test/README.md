# Testing Infrastructure Documentation

This document explains the comprehensive testing setup for the Kimmy app, including architecture, mocking strategies, and usage patterns.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Mocking Strategy](#database-mocking-strategy)
- [Test Types](#test-types)
- [Setup Utilities](#setup-utilities)
- [Writing Tests](#writing-tests)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The testing infrastructure provides comprehensive coverage across all application layers:

- **Authentication & Security** - Password hashing, JWT tokens, session management
- **Database Operations** - CRUD operations, query building, error handling
- **API Integration** - Route handlers, middleware, response formatting
- **Component Testing** - UI behavior, accessibility, user interactions
- **User Flows** - End-to-end scenarios, form submissions, navigation

**Test Statistics**: 76+ passing tests covering utilities, database, API, components, and user flows.

## 🏗️ Architecture

### Directory Structure

```
test/
├── README.md                    # This documentation
├── setup.ts                     # Global test configuration
├── vitest.config.ts             # Vitest configuration
├── helpers/
│   └── test-utils.ts            # Reusable test utilities
├── mocks/
│   ├── cloudflare.ts           # Cloudflare Workers environment
│   ├── crypto.ts               # Web Crypto API mock
│   ├── database.ts             # Legacy exports (compatibility)
│   ├── drizzle.ts              # Enhanced Drizzle ORM mock
│   ├── lib-modules.ts          # App library mocks
│   └── utils.ts                # Utility function mocks
├── auth/                       # Authentication utility tests
├── database/                   # Database operation tests
├── api/                        # API route integration tests
├── components/                 # UI component tests
└── flows/                      # User flow tests
```

### Core Principles

1. **Isolation** - Each test runs independently with fresh mocks
2. **Reusability** - Shared utilities and factory functions
3. **Determinism** - Consistent, predictable test results
4. **Performance** - Fast execution through efficient mocking
5. **Maintainability** - Centralized configuration and helpers

## 🗄️ Database Mocking Strategy

### Enhanced Drizzle Mock (`test/mocks/drizzle.ts`)

The database mock provides a realistic simulation of Drizzle ORM query building:

```typescript
// Mock supports full query chaining
const result = await db
  .select()
  .from(users)
  .where(eq(users.email, "test@example.com"))
  .limit(1);
```

#### Key Features

**Query Builder Chaining**:

```typescript
export class DrizzleMock {
  // Supports method chaining like real Drizzle
  select() → from() → where() → limit() → Promise<results>
  insert() → values() → returning() → Promise<results>
  update() → set() → where() → run() → Promise<results>
}
```

**Setup Methods**:

```typescript
// Configure mock responses
drizzleMock.setupSelect([mockUser1, mockUser2]); // For SELECT queries
drizzleMock.setupMutation([createdUser]); // For INSERT/UPDATE
drizzleMock.setupQuery("limit", specificResults); // For specific methods
```

**Reset & Debug**:

```typescript
drizzleMock.reset(); // Clear all mocks
drizzleMock.getCallInfo("select"); // Debug method calls
```

### Database Test Flow

```typescript
// 1. Setup database test environment
const { mockEnv, drizzleMock, db } = setupDbTest();

// 2. Configure expected results
const mockUser = createMockUser({ name: "Test User" });
drizzleMock.setupSelect([mockUser]);

// 3. Execute database operation
const result = await userDb.findByEmail(mockEnv, "test@example.com");

// 4. Verify results and calls
expect(result).toEqual(mockUser);
expect(db.select).toHaveBeenCalled();
expect(db.where).toHaveBeenCalled();
```

### Mock Environment

The `mockEnv` simulates Cloudflare Workers environment:

```typescript
const mockEnv = {
  DB: {
    // D1 Database mock
    prepare: vi.fn(),
    exec: vi.fn(),
  },
  SESSION_SECRET: "test-secret",
  RATE_LIMIT_KV: {
    // KV namespace mock
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
};
```

## 🧪 Test Types

### 1. Authentication Tests (`test/auth/`)

Test security utilities and session management:

```typescript
// Password hashing
const hash = await hashPassword("password123");
expect(hash).toMatch(/^pbkdf2_/);

// Session tokens
const token = await createSecureToken(sessionData, config);
const decoded = await verifySecureToken(token, secret);
expect(decoded).toEqual(sessionData);
```

### 2. Database Tests (`test/database/`)

Test database operations with realistic query mocking:

```typescript
describe("userDb.create", () => {
  it("should create user successfully", async () => {
    const userData = { name: "Test", email: "test@example.com" };
    const mockUser = createMockUser(userData);

    drizzleMock.setupMutation([mockUser]);

    const result = await userDb.create(mockEnv, userData);

    expect(result).toEqual(mockUser);
    expect(db.insert).toHaveBeenCalled();
  });
});
```

### 3. API Integration Tests (`test/api/`)

Test React Router API routes:

```typescript
describe("Quick Notes API", () => {
  it("should create note via POST", async () => {
    const formData = new FormData();
    formData.append("_action", "create");
    formData.append("content", "Test note");

    const request = createRequestWithSession({
      method: "POST",
      body: formData,
    });

    const result = await action({ request, context: mockContext });
    expect(result.success).toBe(true);
  });
});
```

### 4. Component Tests (`test/components/`)

Test React components with React Testing Library:

```typescript
describe('Button Component', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 5. User Flow Tests (`test/flows/`)

Test complete user interactions:

```typescript
describe('Authentication Flow', () => {
  it('should complete login process', async () => {
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

## 🛠️ Setup Utilities

### `setupDbTest()`

Configures database testing environment:

```typescript
const { mockEnv, drizzleMock, db } = setupDbTest();
// Returns: mock environment, database mock, and db instance
```

### `setupApiTest()`

Configures API route testing:

```typescript
const { mockRequest, mockPlatform, mockEnv } = setupApiTest();
// Returns: request factory, platform mock, and environment
```

### `setupComponentTest()`

Configures React component testing:

```typescript
setupComponentTest();
// Mocks React Router, navigation hooks, etc.
```

## ✏️ Writing Tests

### 1. Choose the Right Setup

```typescript
// For database operations
import { setupDbTest, createMockUser } from "../helpers/test-utils";
const { mockEnv, drizzleMock } = setupDbTest();

// For API routes
import { setupApiTest, createMockSession } from "../helpers/test-utils";
const { mockRequest, mockContext } = setupApiTest();

// For components
import { setupComponentTest } from "../helpers/test-utils";
setupComponentTest();
```

### 2. Use Factory Functions

```typescript
// Create realistic test data
const user = createMockUser({ name: "Custom Name" });
const session = createMockSession({ role: "admin" });
const household = createMockHousehold({ name: "Test Family" });
```

### 3. Configure Mock Responses

```typescript
// For database queries
drizzleMock.setupSelect([user1, user2]); // SELECT results
drizzleMock.setupMutation([createdUser]); // INSERT/UPDATE results
drizzleMock.setupQuery("count", [{ count: 5 }]); // Specific method results

// For API requests
const request = createRequestWithSession({
  method: "POST",
  body: formData,
});
```

### 4. Test Error Scenarios

```typescript
// Database errors
drizzleMock.getDb().select.mockRejectedValue(new Error("DB Error"));

// API errors
mockRequest.mockRejectedValue(new Error("Network Error"));

// Validation errors
expect(() => validateInput("")).toThrow("Required field");
```

## 🔄 Common Patterns

### Testing Database Operations

```typescript
describe("Database Operation", () => {
  it("should handle success case", async () => {
    // Arrange
    const inputData = {
      /* test data */
    };
    const expectedResult = createMockUser(inputData);
    drizzleMock.setupMutation([expectedResult]);

    // Act
    const result = await dbOperation(mockEnv, inputData);

    // Assert
    expect(result).toEqual(expectedResult);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should handle error case", async () => {
    // Arrange
    drizzleMock.getDb().insert.mockRejectedValue(new Error("DB Error"));

    // Act & Assert
    await expect(dbOperation(mockEnv, {})).rejects.toThrow("DB Error");
  });
});
```

### Testing API Routes

```typescript
describe("API Route", () => {
  it("should handle valid request", async () => {
    // Arrange
    const mockData = {
      /* response data */
    };
    drizzleMock.setupSelect([mockData]);

    const request = createRequestWithSession({
      url: "http://localhost/api/test?param=value",
    });

    // Act
    const result = await loader({ request, context: mockContext });

    // Assert
    expect(result).toEqual(mockData);
  });
});
```

### Testing Components

```typescript
describe('Component', () => {
  it('should render and interact correctly', async () => {
    // Arrange
    const mockProps = { onClick: vi.fn() };

    // Act
    render(<Component {...mockProps} />);
    await user.click(screen.getByRole('button'));

    // Assert
    expect(mockProps.onClick).toHaveBeenCalled();
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 🐛 Troubleshooting

### Common Issues

**1. Mock Not Working**

```typescript
// ❌ Wrong - mock applied after import
import { userDb } from '~/lib/db';
vi.mock('~/lib/db', () => ({ ... }));

// ✅ Correct - mock before import
vi.mock('~/lib/db', () => ({ ... }));
const { userDb } = await import('~/lib/db');
```

**2. Database Chain Not Resolving**

```typescript
// ❌ Wrong - no setup for terminal method
drizzleMock.setupSelect([data]); // Sets up limit()
// But query uses .all() or .get()

// ✅ Correct - setup the actual terminal method
drizzleMock.setupQuery("all", [data]); // For .all()
drizzleMock.setupQuery("get", data[0]); // For .get()
```

**3. Request/Response Issues**

```typescript
// ❌ Wrong - FormData not properly formatted
const request = new Request(url, { body: formData }); // Missing headers

// ✅ Correct - use helper function
const request = createRequestWithSession({
  method: "POST",
  body: formData,
});
```

### Debug Helpers

```typescript
// Check mock calls
console.log(drizzleMock.getCallInfo("select"));

// Reset specific mocks
drizzleMock.reset();
vi.clearAllMocks();

// Debug render output
screen.debug(); // Shows current DOM state
```

### Performance Tips

1. **Use `beforeEach`** to reset mocks between tests
2. **Mock only what you need** - avoid over-mocking
3. **Use factory functions** for consistent test data
4. **Group related tests** in describe blocks for setup sharing

## 🚀 Running Tests

```bash
# All tests
npm run test:run

# Specific test files
npm run test:run test/auth/
npm run test:run test/database/
npm run test:run test/api/

# With UI
npm run test:ui

# With coverage
npm run test:coverage

# Watch mode
npm run test
```

## 📊 Coverage Goals

- **Authentication**: 100% - Critical security code
- **Database**: 90%+ - Core business logic
- **API Routes**: 85%+ - User-facing endpoints
- **Components**: 80%+ - UI behavior and accessibility
- **User Flows**: Key scenarios covered

This testing infrastructure ensures reliable, maintainable code while supporting rapid development cycles.
