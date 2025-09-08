import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutoCompletionService } from "~/lib/auto-completion-service";
import type {
  AutoCompletionSuggestion,
  FieldSuggestions,
} from "~/lib/auto-completion-service";

// Mock database
const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  leftJoin: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
};

// Create a chainable mock query builder
const createMockQuery = (returnValue: any) => {
  const query = {
    select: vi.fn(() => query),
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    leftJoin: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve(returnValue)),
  };
  return query;
};

describe("AutoCompletionService", () => {
  let service: AutoCompletionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AutoCompletionService(mockDb as any);
  });

  describe("getFieldSuggestions", () => {
    it("should return empty suggestions when no records exist", async () => {
      const query = createMockQuery([]);
      mockDb.select.mockReturnValue(query);

      const result = await service.getFieldSuggestions(
        "test-field",
        1,
        "household-123",
        undefined,
        "test"
      );

      expect(result).toEqual({
        recent: [],
        frequent: [],
        contextual: [],
      });
    });

    it("should process field suggestions correctly", async () => {
      const mockRecords = [
        {
          content: JSON.stringify({
            fields: { "field_test-field": "apple" },
          }),
          datetime: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(), // 2 days ago
          memberName: "John",
          memberId: 1,
          recordTypeName: "Food",
        },
        {
          content: JSON.stringify({
            fields: { "field_test-field": "banana" },
          }),
          datetime: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(), // 10 days ago
          memberName: "Jane",
          memberId: 2,
          recordTypeName: "Food",
        },
        {
          content: JSON.stringify({
            fields: { "field_test-field": "apple" },
          }),
          datetime: new Date(
            Date.now() - 15 * 24 * 60 * 60 * 1000
          ).toISOString(), // 15 days ago
          memberName: "John",
          memberId: 1,
          recordTypeName: "Food",
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      const result = await service.getFieldSuggestions(
        "test-field",
        1,
        "household-123"
      );

      expect(result.recent).toHaveLength(1);
      expect(result.recent[0].value).toBe("apple");
      expect(result.recent[0].frequency).toBe(2);

      expect(result.frequent).toHaveLength(1);
      expect(result.frequent[0].value).toBe("apple");
      expect(result.frequent[0].frequency).toBe(2);
    });

    it("should filter out current value from suggestions", async () => {
      const mockRecords = [
        {
          content: JSON.stringify({
            fields: { "field_test-field": "apple" },
          }),
          datetime: new Date().toISOString(),
          memberName: "John",
          memberId: 1,
          recordTypeName: "Food",
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      const result = await service.getFieldSuggestions(
        "test-field",
        1,
        "household-123",
        undefined,
        "apple"
      );

      expect(result.recent).toHaveLength(0);
      expect(result.frequent).toHaveLength(0);
    });

    it("should categorize suggestions by time of day", async () => {
      const morningTime = new Date();
      morningTime.setHours(9, 0, 0, 0);

      // Create records with different suggestions for different categories
      const mockRecords = [
        // Recent coffee from John (should go in recent)
        {
          content: JSON.stringify({
            fields: { "field_test-field": "coffee" },
          }),
          datetime: morningTime.toISOString(),
          memberName: "John",
          memberId: 1,
          recordTypeName: "Drink",
        },
        // Tea from John but older (should go in contextual for member match)
        {
          content: JSON.stringify({
            fields: { "field_test-field": "tea" },
          }),
          datetime: new Date(
            morningTime.getTime() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(), // 10 days ago
          memberName: "John",
          memberId: 1,
          recordTypeName: "Drink",
        },
        // Morning juice from different member (should go in contextual for time match)
        {
          content: JSON.stringify({
            fields: { "field_test-field": "juice" },
          }),
          datetime: new Date(
            morningTime.getTime() - 8 * 24 * 60 * 60 * 1000
          ).toISOString(), // 8 days ago
          memberName: "Jane",
          memberId: 2,
          recordTypeName: "Drink",
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      // Mock current time as morning
      vi.spyOn(Date, "now").mockReturnValue(morningTime.getTime());

      const result = await service.getFieldSuggestions(
        "test-field",
        1,
        "household-123",
        1 // Same member ID for contextual match
      );

      // Should appear in contextual suggestions due to matching member and time
      expect(result.contextual.length).toBeGreaterThan(0);
    });

    it("should handle invalid JSON content gracefully", async () => {
      const mockRecords = [
        {
          content: "invalid json",
          datetime: new Date().toISOString(),
          memberName: "John",
          memberId: 1,
          recordTypeName: "Food",
        },
        {
          content: JSON.stringify({
            fields: { "field_test-field": "valid value" },
          }),
          datetime: new Date().toISOString(),
          memberName: "John",
          memberId: 1,
          recordTypeName: "Food",
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      const result = await service.getFieldSuggestions(
        "test-field",
        1,
        "household-123"
      );

      expect(result.recent).toHaveLength(1);
      expect(result.recent[0].value).toBe("valid value");
    });
  });

  describe("getTitleSuggestions", () => {
    it("should return title suggestions ordered by frequency", async () => {
      const mockRecords = [
        {
          title: "Breakfast",
          datetime: new Date().toISOString(),
          memberName: "John",
          memberId: 1,
        },
        {
          title: "Lunch",
          datetime: new Date().toISOString(),
          memberName: "Jane",
          memberId: 2,
        },
        {
          title: "Breakfast",
          datetime: new Date().toISOString(),
          memberName: "John",
          memberId: 1,
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      const result = await service.getTitleSuggestions(1, "household-123");

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("Breakfast");
      expect(result[0].frequency).toBe(2);
      expect(result[1].value).toBe("Lunch");
      expect(result[1].frequency).toBe(1);
    });

    it("should handle empty or null titles", async () => {
      const mockRecords = [
        {
          title: null,
          datetime: new Date().toISOString(),
          memberName: "John",
          memberId: 1,
        },
        {
          title: "",
          datetime: new Date().toISOString(),
          memberName: "Jane",
          memberId: 2,
        },
        {
          title: "Valid Title",
          datetime: new Date().toISOString(),
          memberName: "Bob",
          memberId: 3,
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      const result = await service.getTitleSuggestions(1, "household-123");

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("Valid Title");
    });
  });

  describe("getTagSuggestions", () => {
    it("should parse and rank tags correctly", async () => {
      const mockRecords = [
        {
          tags: "food, healthy, breakfast",
        },
        {
          tags: "food, quick",
        },
        {
          tags: "healthy, organic",
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      const result = await service.getTagSuggestions(1, "household-123");

      expect(result).toContain("food");
      expect(result).toContain("healthy");
      expect(result.indexOf("food")).toBeLessThan(result.indexOf("quick")); // food should be ranked higher
    });

    it("should handle malformed tag strings", async () => {
      const mockRecords = [
        {
          tags: "  , , valid-tag ,  ",
        },
        {
          tags: null,
        },
        {
          tags: "",
        },
      ];

      const query = createMockQuery(mockRecords);
      mockDb.select.mockReturnValue(query);

      const result = await service.getTagSuggestions(1, "household-123");

      expect(result).toEqual(["valid-tag"]);
    });
  });

  describe("getSmartDefaults", () => {
    it("should suggest most common hour", async () => {
      // Create dates that will be consistently 9 AM and 2 PM in local time
      const morning1 = new Date("2023-01-01T09:00:00");
      const morning2 = new Date("2023-01-02T09:30:00");
      const afternoon = new Date("2023-01-03T14:00:00");

      const records = [
        {
          datetime: morning1.toISOString(),
          tags: "morning, breakfast",
          content: "{}",
        },
        {
          datetime: morning2.toISOString(),
          tags: "morning, coffee",
          content: "{}",
        },
        {
          datetime: afternoon.toISOString(),
          tags: "afternoon, lunch",
          content: "{}",
        },
      ];

      const query = createMockQuery(records);
      mockDb.select.mockReturnValue(query);

      const result = await service.getSmartDefaults(1, "household-123");

      expect(result.commonPatterns?.mostCommonHour).toBe(9);
      expect(result.suggestedTags).toContain("morning");
      expect(result.commonPatterns?.totalRecords).toBe(3);
    });

    it("should handle records without tags", async () => {
      const tenAM = new Date("2023-01-01T10:00:00");
      const records = [
        {
          datetime: tenAM.toISOString(),
          tags: null,
          content: "{}",
        },
      ];

      const query = createMockQuery(records);
      mockDb.select.mockReturnValue(query);

      const result = await service.getSmartDefaults(1, "household-123");

      expect(result.suggestedTags).toEqual([]);
      expect(result.commonPatterns?.mostCommonHour).toBe(10);
    });

    it("should use current hour when no patterns exist", async () => {
      const mockCurrentHour = 15;
      const mockDate = new Date();
      mockDate.setHours(mockCurrentHour, 0, 0, 0);
      vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

      const query = createMockQuery([]);
      mockDb.select.mockReturnValue(query);

      const result = await service.getSmartDefaults(1, "household-123");

      expect(result.commonPatterns?.mostCommonHour).toBe(mockCurrentHour);
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      const query = createMockQuery(Promise.reject(new Error("DB Error")));
      mockDb.select.mockReturnValue(query);

      const result = await service.getFieldSuggestions(
        "test-field",
        1,
        "household-123"
      );

      expect(result).toEqual({
        recent: [],
        frequent: [],
        contextual: [],
      });
    });

    it("should log errors without throwing", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const query = createMockQuery(Promise.reject(new Error("DB Error")));
      mockDb.select.mockReturnValue(query);

      await service.getFieldSuggestions("test-field", 1, "household-123");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching field suggestions:",
        expect.any(Error)
      );
    });
  });
});
