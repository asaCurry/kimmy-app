import { describe, it, expect, vi } from "vitest";
import { setupApiTest, createMockSession } from "../helpers/test-utils";

// Set up API test environment
const { drizzleMock, mockEnv, mockRequest, mockPlatform } = setupApiTest();

// Mock the db-utils module
vi.mock("~/lib/db-utils", () => ({
  getDatabase: vi.fn(() => drizzleMock.getDb()),
}));

// Import after mocking
const { action, loader } = await import("~/routes/api.quick-notes");

describe("Quick Notes API", () => {
  const mockSession = createMockSession();

  const createRequestWithSession = (options: any = {}) => {
    const sessionCookie = `kimmy_auth_session=${encodeURIComponent(JSON.stringify(mockSession))}`;
    return mockRequest({
      ...options,
      headers: {
        cookie: sessionCookie,
        ...options.headers,
      },
    });
  };

  const mockContext = {
    cloudflare: {
      env: mockEnv,
      ctx: mockPlatform.ctx,
      caches: mockPlatform.caches,
    },
  };

  describe("action", () => {
    it("should create a quick note successfully", async () => {
      const mockNote = {
        id: 1,
        content: "Test note content",
        tags: "tag1,tag2",
        householdId: mockSession.currentHouseholdId,
        createdBy: mockSession.userId,
        recordId: null,
        attachments: null,
        createdAt: "2023-01-01T00:00:00Z",
      };

      drizzleMock.setupMutation([mockNote]);

      const formData = new FormData();
      formData.append("_action", "create");
      formData.append("content", "Test note content");
      formData.append("tags", "tag1,tag2");
      formData.append("householdId", mockSession.currentHouseholdId!);
      formData.append("memberId", "123");

      const request = createRequestWithSession({
        method: "POST",
        body: formData,
      });

      const result = await action({ request, context: mockContext });

      expect(result).toEqual({
        success: true,
        note: mockNote,
        message: "Quick note created successfully",
      });

      expect(drizzleMock.getDb().insert).toHaveBeenCalled();
      expect(drizzleMock.getDb().values).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Test note content",
          tags: "tag1,tag2",
          householdId: mockSession.currentHouseholdId,
          createdBy: mockSession.userId,
        })
      );
    });

    it("should handle missing content when creating note", async () => {
      const formData = new FormData();
      formData.append("_action", "create");
      formData.append("householdId", mockSession.currentHouseholdId!);
      formData.append("memberId", "123");
      // Missing content

      const request = createRequestWithSession({
        method: "POST",
        body: formData,
      });

      const result = await action({ request, context: mockContext });

      expect(result).toEqual({
        error: "Missing required fields",
      });
    });

    it("should delete a quick note successfully", async () => {
      const mockExistingNote = {
        id: 1,
        content: "Test note",
        householdId: mockSession.currentHouseholdId,
        createdBy: mockSession.userId,
      };

      // Mock the select query to find the note
      drizzleMock.setupSelect([mockExistingNote]);

      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("noteId", "1");

      const request = createRequestWithSession({
        method: "POST",
        body: formData,
      });

      const result = await action({ request, context: mockContext });

      expect(result).toEqual({
        success: true,
        deletedNoteId: 1,
        message: "Quick note deleted successfully",
      });

      expect(drizzleMock.getDb().select).toHaveBeenCalled();
      expect(drizzleMock.getDb().delete).toHaveBeenCalled();
    });

    it("should return error when deleting non-existent note", async () => {
      // Mock empty result (note not found)
      drizzleMock.setupSelect([]);

      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("noteId", "999");

      const request = createRequestWithSession({
        method: "POST",
        body: formData,
      });

      const result = await action({ request, context: mockContext });

      expect(result).toEqual({
        error: "Note not found or access denied",
      });
    });

    it("should return error for invalid action", async () => {
      const formData = new FormData();
      formData.append("_action", "invalid");

      const request = createRequestWithSession({
        method: "POST",
        body: formData,
      });

      const result = await action({ request, context: mockContext });

      expect(result).toEqual({
        error: "Invalid action",
      });
    });

    it("should return error when no session found", async () => {
      const request = mockRequest({
        method: "POST",
        body: new FormData(),
      });

      const result = await action({ request, context: mockContext });

      expect(result).toEqual({
        error: "No session found",
      });
    });
  });

  describe("loader", () => {
    it("should load quick notes for household", async () => {
      const mockNotes = [
        {
          id: 1,
          content: "First note",
          householdId: mockSession.currentHouseholdId,
          createdAt: "2023-01-01T00:00:00Z",
        },
        {
          id: 2,
          content: "Second note",
          householdId: mockSession.currentHouseholdId,
          createdAt: "2023-01-02T00:00:00Z",
        },
      ];

      drizzleMock.setupQuery("limit", mockNotes);

      const request = createRequestWithSession({
        url: "http://localhost:3000/api/quick-notes?memberId=123",
      });

      const result = await loader({ request, context: mockContext });

      expect(result).toEqual({ notes: mockNotes });
      expect(drizzleMock.getDb().select).toHaveBeenCalled();
      expect(drizzleMock.getDb().orderBy).toHaveBeenCalled();
      expect(drizzleMock.getDb().limit).toHaveBeenCalledWith(20);
    });

    it("should return empty array when no session", async () => {
      const request = mockRequest({
        url: "http://localhost:3000/api/quick-notes?memberId=123",
      });

      const result = await loader({ request, context: mockContext });

      expect(result).toEqual({ notes: [] });
    });

    it("should return error when memberId is missing", async () => {
      const request = createRequestWithSession({
        url: "http://localhost:3000/api/quick-notes", // No memberId
      });

      const result = await loader({ request, context: mockContext });

      expect(result).toEqual({ error: "Member ID is required" });
    });

    it("should handle database errors gracefully", async () => {
      // Mock database error
      drizzleMock.getDb().select.mockRejectedValue(new Error("Database error"));

      const request = createRequestWithSession({
        url: "http://localhost:3000/api/quick-notes?memberId=123",
      });

      const result = await loader({ request, context: mockContext });

      expect(result).toEqual({ notes: [] });
    });
  });
});
