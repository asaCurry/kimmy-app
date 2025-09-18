import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  seedDemoRecordTypes,
  seedDemoTrackers,
  seedAllDemoData,
  type DemoDataOptions,
} from "~/lib/demo-data-seeder";
import { DrizzleMock } from "../mocks/drizzle";

describe("Demo Data Seeder", () => {
  let mockDb: DrizzleMock;
  let demoOptions: DemoDataOptions;

  beforeEach(() => {
    mockDb = new DrizzleMock();
    demoOptions = {
      householdId: "test-household-id",
      userId: 1,
      visibleToMembers: [1, 2],
    };
  });

  describe("seedDemoRecordTypes", () => {
    it("should create all demo record types successfully", async () => {
      // Mock successful insertions
      const mockRecordTypes = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        name: `Record Type ${i + 1}`,
        householdId: demoOptions.householdId,
        createdBy: demoOptions.userId,
      }));

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRecordTypes[0]]),
        }),
      });

      const result = await seedDemoRecordTypes(mockDb, demoOptions);

      expect(result).toHaveLength(6);
      expect(mockDb.insert).toHaveBeenCalledTimes(6);
      expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should handle database errors gracefully", async () => {
      // Mock first insertion to succeed, second to fail
      let callCount = 0;
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([{ id: 1, name: "Success" }]);
            }
            throw new Error("Duplicate key error");
          }),
        }),
      });

      const result = await seedDemoRecordTypes(mockDb, demoOptions);

      // Should return only successful insertions
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 1, name: "Success" });
    });

    it("should use correct household and user IDs", async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      await seedDemoRecordTypes(mockDb, demoOptions);

      const insertValues = mockDb.insert().values;
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId: demoOptions.householdId,
          createdBy: demoOptions.userId,
        })
      );
    });

    it("should create record types with proper field structures", async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      await seedDemoRecordTypes(mockDb, demoOptions);

      const insertValues = mockDb.insert().values;
      const firstCall = insertValues.mock.calls[0][0];

      expect(firstCall).toHaveProperty("name");
      expect(firstCall).toHaveProperty("description");
      expect(firstCall).toHaveProperty("category");
      expect(firstCall).toHaveProperty("icon");
      expect(firstCall).toHaveProperty("color");
      expect(firstCall).toHaveProperty("fields");
      expect(typeof firstCall.fields).toBe("string");

      // Validate that fields is valid JSON
      expect(() => JSON.parse(firstCall.fields)).not.toThrow();
    });
  });

  describe("seedDemoTrackers", () => {
    it("should create all demo trackers successfully", async () => {
      const mockTrackers = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Tracker ${i + 1}`,
        householdId: demoOptions.householdId,
        createdBy: demoOptions.userId,
      }));

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockTrackers[0]]),
        }),
      });

      const result = await seedDemoTrackers(mockDb, demoOptions);

      expect(result).toHaveLength(5);
      expect(mockDb.insert).toHaveBeenCalledTimes(5);
    });

    it("should handle missing visibleToMembers option", async () => {
      const optionsWithoutVisible = {
        householdId: "test-household-id",
        userId: 1,
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      await seedDemoTrackers(mockDb, optionsWithoutVisible);

      const insertValues = mockDb.insert().values;
      const firstCall = insertValues.mock.calls[0][0];

      expect(firstCall.visibleToMembers).toBe(JSON.stringify([1]));
    });

    it("should create trackers with correct properties", async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      await seedDemoTrackers(mockDb, demoOptions);

      const insertValues = mockDb.insert().values;
      const firstCall = insertValues.mock.calls[0][0];

      expect(firstCall).toHaveProperty("name");
      expect(firstCall).toHaveProperty("description");
      expect(firstCall).toHaveProperty("type");
      expect(firstCall).toHaveProperty("unit");
      expect(firstCall).toHaveProperty("color");
      expect(firstCall).toHaveProperty("icon");
      expect(firstCall).toHaveProperty("allowPrivate");
      expect(firstCall.householdId).toBe(demoOptions.householdId);
      expect(firstCall.createdBy).toBe(demoOptions.userId);
      expect(firstCall.visibleToMembers).toBe(
        JSON.stringify(demoOptions.visibleToMembers)
      );
    });

    it("should handle partial failures gracefully", async () => {
      let callCount = 0;
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount <= 3) {
              return Promise.resolve([{ id: callCount }]);
            }
            throw new Error("Database error");
          }),
        }),
      });

      const result = await seedDemoTrackers(mockDb, demoOptions);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1 });
      expect(result[1]).toEqual({ id: 2 });
      expect(result[2]).toEqual({ id: 3 });
    });
  });

  describe("seedAllDemoData", () => {
    it("should seed both record types and trackers", async () => {
      const mockRecordType = { id: 1, name: "Test Record Type" };
      const mockTracker = { id: 1, name: "Test Tracker" };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValueOnce([mockRecordType])
            .mockResolvedValue([mockTracker]),
        }),
      });

      const result = await seedAllDemoData(mockDb, demoOptions);

      expect(result.success).toBe(true);
      expect(result.recordTypes).toHaveLength(6); // 6 demo record types
      expect(result.trackers).toHaveLength(5); // 5 demo trackers
      expect(result.message).toContain(
        "Successfully created 6 record types and 5 trackers"
      );
    });

    it("should return success false if seeding fails", async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const result = await seedAllDemoData(mockDb, demoOptions);

      expect(result.success).toBe(false);
      expect(result.recordTypes).toHaveLength(0);
      expect(result.trackers).toHaveLength(0);
      expect(result.message).toContain("Failed to seed demo data");
    });

    it("should handle partial success scenarios", async () => {
      // Mock record types to succeed but trackers to fail
      let isRecordTypeCall = true;
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            if (isRecordTypeCall) {
              isRecordTypeCall = false;
              return Promise.resolve([{ id: 1 }]);
            }
            throw new Error("Tracker creation failed");
          }),
        }),
      });

      const result = await seedAllDemoData(mockDb, demoOptions);

      expect(result.success).toBe(true);
      expect(result.recordTypes).toHaveLength(6);
      expect(result.trackers).toHaveLength(0);
    });

    it("should use provided options correctly", async () => {
      const customOptions: DemoDataOptions = {
        householdId: "custom-household",
        userId: 99,
        visibleToMembers: [99, 100],
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      await seedAllDemoData(mockDb, customOptions);

      const insertCalls = mockDb.insert().values.mock.calls;

      // Check that household and user IDs are used correctly
      insertCalls.forEach(call => {
        expect(call[0].householdId).toBe(customOptions.householdId);
        expect(call[0].createdBy).toBe(customOptions.userId);
      });
    });
  });

  describe("Data Quality", () => {
    it("should create valid record types with required fields", async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      await seedDemoRecordTypes(mockDb, demoOptions);

      const insertCalls = mockDb.insert().values.mock.calls;

      insertCalls.forEach(call => {
        const recordType = call[0];
        expect(recordType.name).toBeTruthy();
        expect(recordType.description).toBeTruthy();
        expect(recordType.category).toBeTruthy();
        expect(recordType.icon).toBeTruthy();
        expect(recordType.color).toBeTruthy();
        expect(typeof recordType.allowPrivate).toBe("number");

        // Validate fields JSON structure
        const fields = JSON.parse(recordType.fields);
        expect(Array.isArray(fields)).toBe(true);

        if (fields.length > 0) {
          fields.forEach((field: any) => {
            expect(field).toHaveProperty("id");
            expect(field).toHaveProperty("name");
            expect(field).toHaveProperty("type");
            expect(field).toHaveProperty("label");
            expect(typeof field.required).toBe("boolean");
          });
        }
      });
    });

    it("should create valid trackers with required properties", async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      await seedDemoTrackers(mockDb, demoOptions);

      const insertCalls = mockDb.insert().values.mock.calls;

      insertCalls.forEach(call => {
        const tracker = call[0];
        expect(tracker.name).toBeTruthy();
        expect(tracker.description).toBeTruthy();
        expect(["time", "cumulative"].includes(tracker.type)).toBe(true);
        expect(tracker.unit).toBeTruthy();
        expect(tracker.color).toBeTruthy();
        expect(tracker.icon).toBeTruthy();
        expect(typeof tracker.allowPrivate).toBe("number");

        // Validate visibleToMembers JSON
        const visibleToMembers = JSON.parse(tracker.visibleToMembers);
        expect(Array.isArray(visibleToMembers)).toBe(true);
        expect(visibleToMembers).toContain(demoOptions.userId);
      });
    });
  });
});
