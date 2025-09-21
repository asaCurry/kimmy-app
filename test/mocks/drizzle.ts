import { vi } from "vitest";

/**
 * Enhanced Drizzle ORM mock that supports chaining and realistic query patterns
 */
export class DrizzleMock {
  private mockDb: any;

  constructor() {
    this.mockDb = this.createMockDb();
  }

  // Expose database methods directly for testing
  get select() {
    return this.mockDb.select;
  }
  get insert() {
    return this.mockDb.insert;
  }
  get update() {
    return this.mockDb.update;
  }
  get delete() {
    return this.mockDb.delete;
  }

  private createMockDb() {
    return {
      select: vi.fn(() => this.mockDb),
      from: vi.fn(() => this.mockDb),
      where: vi.fn(() => this.mockDb),
      insert: vi.fn(() => this.mockDb),
      update: vi.fn(() => this.mockDb),
      delete: vi.fn(() => this.mockDb),
      values: vi.fn(() => this.mockDb),
      set: vi.fn(() => this.mockDb),
      returning: vi.fn(() => Promise.resolve([])),
      get: vi.fn(() => Promise.resolve(null)),
      all: vi.fn(() => Promise.resolve([])),
      run: vi.fn(() => Promise.resolve({ success: true })),
      // Query builder methods
      innerJoin: vi.fn(() => this.mockDb),
      leftJoin: vi.fn(() => this.mockDb),
      rightJoin: vi.fn(() => this.mockDb),
      orderBy: vi.fn(() => this.mockDb),
      limit: vi.fn(() => Promise.resolve([])), // Terminal method
      offset: vi.fn(() => this.mockDb),
      groupBy: vi.fn(() => this.mockDb),
      having: vi.fn(() => this.mockDb),
      // Aggregation
      count: vi.fn(() => Promise.resolve([{ count: 0 }])),
    };
  }

  /**
   * Get the mock database instance
   */
  getDb() {
    return this.mockDb;
  }

  /**
   * Set up a query to return specific data
   */
  setupQuery(terminalMethod: string, returnValue: any) {
    if (this.mockDb[terminalMethod]) {
      this.mockDb[terminalMethod].mockResolvedValue(returnValue);
    }
    return this;
  }

  /**
   * Set up a select query that returns data
   */
  setupSelect(data: any[]) {
    this.mockDb.limit.mockResolvedValue(data);
    return this;
  }

  /**
   * Set up an insert/update that returns created/updated records
   */
  setupMutation(data: any[]) {
    this.mockDb.returning.mockResolvedValue(data);
    return this;
  }

  /**
   * Reset all mocks
   */
  reset() {
    Object.values(this.mockDb).forEach((mock: any) => {
      if (vi.isMockFunction(mock)) {
        mock.mockClear();
      }
    });
  }

  /**
   * Get call information for debugging
   */
  getCallInfo(method: string) {
    const mock = this.mockDb[method];
    return vi.isMockFunction(mock) ? mock.mock.calls : [];
  }
}

// Global instance for reuse
export const drizzleMock = new DrizzleMock();

// Mock createDatabase function
export const mockCreateDatabase = vi.fn(() => drizzleMock.getDb());

// Helper function to reset all database mocks
export const resetDatabaseMocks = () => {
  drizzleMock.reset();
  mockCreateDatabase.mockClear();
};

// Convenience function for common database test setup
export const setupDatabaseTest = () => {
  const mockEnv = {
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn(() => Promise.resolve({ results: [] })),
        first: vi.fn(() => Promise.resolve(null)),
        run: vi.fn(() => Promise.resolve({ success: true })),
      })),
    },
  };

  return {
    mockEnv,
    drizzleMock,
    db: drizzleMock.getDb(),
  };
};
