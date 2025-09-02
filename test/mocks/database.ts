// Re-export the enhanced Drizzle mock for backward compatibility
export {
  drizzleMock as mockDb,
  mockCreateDatabase,
  resetDatabaseMocks,
} from "./drizzle";
