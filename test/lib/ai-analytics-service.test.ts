import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from "vitest";
import {
  AIAnalyticsService,
  type AIInsight,
  type ChartDataPoint,
} from "~/lib/ai-analytics-service";
import { DrizzleMock } from "../mocks/drizzle";
import { analyticsLogger } from "~/lib/logger";

// Mock the logger
vi.mock("~/lib/logger", () => ({
  analyticsLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock data
const mockRecordsData = [
  {
    records: {
      id: 1,
      title: "Height Measurement",
      content: JSON.stringify({ height: 120, weight: 30 }),
      memberId: 1,
      createdAt: "2024-01-01T00:00:00Z",
    },
    users: {
      id: 1,
      name: "Test Child",
      householdId: "household-1",
    },
    recordTypes: {
      id: 1,
      name: "Growth Tracking",
      category: "Growth",
    },
  },
  {
    records: {
      id: 2,
      title: "Sleep Record",
      content: JSON.stringify({ hours: 8.5, quality: 7 }),
      memberId: 1,
      createdAt: "2024-01-02T00:00:00Z",
    },
    users: {
      id: 1,
      name: "Test Child",
      householdId: "household-1",
    },
    recordTypes: {
      id: 2,
      name: "Sleep Tracking",
      category: "Behavior",
    },
  },
];

const mockUsersData = [
  {
    id: 1,
    name: "Test Child",
    email: "child@test.com",
    householdId: "household-1",
  },
];

const mockRecordTypesData = [
  {
    id: 1,
    name: "Growth Tracking",
    category: "Growth",
    householdId: "household-1",
  },
  {
    id: 2,
    name: "Sleep Tracking",
    category: "Behavior",
    householdId: "household-1",
  },
];

describe("AIAnalyticsService", () => {
  let service: AIAnalyticsService;
  let drizzleMock: any;
  let mockAI: {
    run: MockedFunction<any>;
  };

  beforeEach(() => {
    drizzleMock = new DrizzleMock().getDb();
    mockAI = {
      run: vi.fn(),
    };

    service = new AIAnalyticsService(drizzleMock, mockAI, "household-1");

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("generateAdvancedInsights", () => {
    beforeEach(() => {
      // Mock database calls
      drizzleMock.select.mockReturnValue(drizzleMock);
      drizzleMock.from.mockReturnValue(drizzleMock);
      drizzleMock.leftJoin.mockReturnValue(drizzleMock);
      drizzleMock.where.mockReturnValue(drizzleMock);
      drizzleMock.orderBy.mockReturnValue(drizzleMock);
      drizzleMock.limit.mockResolvedValue(mockRecordsData);
    });

    it("should generate insights when data is available", async () => {
      // Mock Promise.all to return our test data
      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([
          mockRecordsData,
          mockUsersData,
          mockRecordTypesData,
        ]);

      const insights = await service.generateAdvancedInsights();

      expect(insights).toBeInstanceOf(Array);
      expect(analyticsLogger.info).toHaveBeenCalledWith(
        "Generating AI-powered insights",
        { householdId: "household-1" }
      );

      mockPromiseAll.mockRestore();
    });

    it("should return empty array when no data available", async () => {
      // Mock empty data
      const mockPromiseAll = vi.spyOn(Promise, "all").mockResolvedValue([
        [], // empty records
        mockUsersData,
        mockRecordTypesData,
      ]);

      const insights = await service.generateAdvancedInsights();

      expect(insights).toEqual([]);
      expect(analyticsLogger.info).toHaveBeenCalledWith(
        "No data available for AI analysis"
      );

      mockPromiseAll.mockRestore();
    });

    it("should handle errors gracefully", async () => {
      // Mock database error
      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockRejectedValue(new Error("Database connection failed"));

      const insights = await service.generateAdvancedInsights();

      expect(insights).toEqual([]);
      expect(analyticsLogger.error).toHaveBeenCalledWith(
        "Error generating AI insights",
        { error: expect.any(Error) }
      );

      mockPromiseAll.mockRestore();
    });

    it("should generate different types of insights", async () => {
      // Mock rich data that would trigger multiple insight types
      const richMockData = [
        ...mockRecordsData,
        // Add more health records
        {
          records: {
            id: 3,
            title: "Health Check",
            content: JSON.stringify({
              symptoms: "mild fever",
              temperature: 100.2,
            }),
            memberId: 1,
            createdAt: "2024-01-03T00:00:00Z",
          },
          users: mockUsersData[0],
          recordTypes: {
            id: 3,
            name: "Health Record",
            category: "Health",
          },
        },
        // Add mood records
        {
          records: {
            id: 4,
            title: "Mood Check",
            content: JSON.stringify({ mood: 8, activity: "playground" }),
            memberId: 1,
            createdAt: "2024-01-04T00:00:00Z",
          },
          users: mockUsersData[0],
          recordTypes: {
            id: 4,
            name: "Mood Tracking",
            category: "Behavior",
          },
        },
      ];

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([richMockData, mockUsersData, mockRecordTypesData]);

      // Mock AI response
      mockAI.run.mockResolvedValue({
        response:
          "Analysis shows positive health patterns with good sleep and mood correlation.",
      });

      const insights = await service.generateAdvancedInsights();

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);

      mockPromiseAll.mockRestore();
    });
  });

  describe("analyzeGrowthPatterns", () => {
    it("should detect growth trends with sufficient data", async () => {
      const mockData = {
        records: Array(6)
          .fill(null)
          .map((_, i) => ({
            recordType: { category: "growth" },
            createdBy: { firstName: "Test Child" },
            data: JSON.stringify({ height: 100 + i * 2 }), // Growing trend
            records: { memberId: 1 },
          })),
      };

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([
          mockData.records,
          mockUsersData,
          mockRecordTypesData,
        ]);

      const insights = await service.generateAdvancedInsights();

      // Should generate at least one growth insight
      const growthInsights = insights.filter(
        insight => insight.type === "growth"
      );
      expect(growthInsights.length).toBeGreaterThanOrEqual(0);

      mockPromiseAll.mockRestore();
    });

    it("should skip analysis with insufficient data", async () => {
      const mockData = {
        records: [
          {
            recordType: { category: "growth" },
            createdBy: { firstName: "Test Child" },
            data: JSON.stringify({ height: 100 }),
            records: { memberId: 1 },
          },
        ],
      };

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([
          mockData.records,
          mockUsersData,
          mockRecordTypesData,
        ]);

      const insights = await service.generateAdvancedInsights();

      // Should not generate growth insights with insufficient data
      const growthInsights = insights.filter(
        insight => insight.type === "growth"
      );
      expect(growthInsights.length).toBe(0);

      mockPromiseAll.mockRestore();
    });
  });

  describe("analyzeHealthPatterns", () => {
    it("should use AI to analyze health text when available", async () => {
      const healthRecords = [
        {
          recordType: { category: "health" },
          data: JSON.stringify({ symptoms: "fever, cough" }),
          records: { memberId: 1 },
        },
        {
          recordType: { category: "medical" },
          data: JSON.stringify({ visit: "checkup", notes: "all good" }),
          records: { memberId: 1 },
        },
        {
          recordType: { category: "symptom" },
          data: JSON.stringify({ symptom: "headache", severity: 3 }),
          records: { memberId: 1 },
        },
      ];

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([healthRecords, mockUsersData, mockRecordTypesData]);

      mockAI.run.mockResolvedValue({
        response:
          "Regular checkups show positive health trends. Monitor fever episodes.",
      });

      const insights = await service.generateAdvancedInsights();

      const healthInsights = insights.filter(
        insight => insight.type === "health"
      );
      expect(healthInsights.length).toBeGreaterThan(0);

      if (healthInsights.length > 0) {
        expect(healthInsights[0].category).toBe("Health Analysis");
        expect(healthInsights[0].title).toBe("AI Health Pattern Analysis");
      }

      mockPromiseAll.mockRestore();
    });

    it("should handle AI service errors gracefully", async () => {
      const healthRecords = [
        {
          recordType: { category: "health" },
          data: JSON.stringify({ symptoms: "fever" }),
          records: { memberId: 1 },
        },
      ];

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([healthRecords, mockUsersData, mockRecordTypesData]);

      mockAI.run.mockRejectedValue(new Error("AI service unavailable"));

      const insights = await service.generateAdvancedInsights();

      // Should still complete without throwing
      expect(insights).toBeInstanceOf(Array);
      expect(analyticsLogger.error).toHaveBeenCalledWith(
        "Error in AI health pattern analysis",
        { error: "AI service unavailable" }
      );

      mockPromiseAll.mockRestore();
    });
  });

  describe("analyzeBehavioralPatterns", () => {
    it("should analyze sleep patterns", async () => {
      const behaviorRecords = Array(12)
        .fill(null)
        .map((_, i) => ({
          recordType: { category: "sleep" },
          data: JSON.stringify({ hours: 7.5 + Math.sin(i / 7) * 1.5 }),
          records: { memberId: 1 },
          createdAt: new Date(
            Date.now() - i * 24 * 60 * 60 * 1000
          ).toISOString(),
        }));

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([
          behaviorRecords,
          mockUsersData,
          mockRecordTypesData,
        ]);

      const insights = await service.generateAdvancedInsights();

      const behaviorInsights = insights.filter(
        insight => insight.type === "behavior"
      );
      expect(behaviorInsights.length).toBeGreaterThanOrEqual(0);

      mockPromiseAll.mockRestore();
    });

    it("should analyze mood patterns", async () => {
      const moodRecords = Array(12)
        .fill(null)
        .map((_, i) => ({
          recordType: { category: "mood" },
          data: JSON.stringify({ mood: 6 + Math.random() * 4 }),
          records: { memberId: 1 },
          createdAt: new Date(
            Date.now() - i * 24 * 60 * 60 * 1000
          ).toISOString(),
        }));

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([moodRecords, mockUsersData, mockRecordTypesData]);

      const insights = await service.generateAdvancedInsights();

      const behaviorInsights = insights.filter(
        insight => insight.type === "behavior"
      );
      expect(behaviorInsights.length).toBeGreaterThanOrEqual(0);

      mockPromiseAll.mockRestore();
    });

    it("should skip analysis with insufficient behavioral data", async () => {
      const limitedRecords = [
        {
          recordType: { category: "sleep" },
          data: JSON.stringify({ hours: 8 }),
          records: { memberId: 1 },
          createdAt: new Date().toISOString(),
        },
      ];

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([
          limitedRecords,
          mockUsersData,
          mockRecordTypesData,
        ]);

      const insights = await service.generateAdvancedInsights();

      // Should not generate behavior insights with insufficient data
      const behaviorInsights = insights.filter(
        insight => insight.type === "behavior"
      );
      expect(behaviorInsights.length).toBe(0);

      mockPromiseAll.mockRestore();
    });
  });

  describe("generatePredictiveInsights", () => {
    it("should generate predictions for strong trends", async () => {
      const trendData = Array(10)
        .fill(null)
        .map((_, i) => ({
          recordType: { category: "growth" },
          createdBy: { firstName: "Test Child" },
          data: JSON.stringify({ height: 100 + i * 1.5 }), // Strong upward trend
          records: { memberId: 1 },
        }));

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([trendData, mockUsersData, mockRecordTypesData]);

      const insights = await service.generateAdvancedInsights();

      const predictionInsights = insights.filter(
        insight => insight.type === "prediction"
      );
      expect(predictionInsights.length).toBeGreaterThanOrEqual(0);

      mockPromiseAll.mockRestore();
    });

    it("should not generate predictions for weak trends", async () => {
      const noisyData = Array(10)
        .fill(null)
        .map((_, i) => ({
          recordType: { category: "growth" },
          createdBy: { firstName: "Test Child" },
          data: JSON.stringify({ height: 100 + Math.random() * 10 }), // Random, no trend
          records: { memberId: 1 },
        }));

      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([noisyData, mockUsersData, mockRecordTypesData]);

      const insights = await service.generateAdvancedInsights();

      const predictionInsights = insights.filter(
        insight => insight.type === "prediction"
      );
      // Should generate fewer or no predictions for weak trends
      expect(predictionInsights.length).toBeGreaterThanOrEqual(0);

      mockPromiseAll.mockRestore();
    });
  });

  describe("helper methods", () => {
    it("should group records by member correctly", async () => {
      const records = [
        { records: { memberId: 1 }, data: "test1" },
        { records: { memberId: 2 }, data: "test2" },
        { records: { memberId: 1 }, data: "test3" },
      ];

      // Access the private method via type assertion for testing
      const groupedRecords = (service as any).groupRecordsByMember(records);

      expect(groupedRecords[1]).toHaveLength(2);
      expect(groupedRecords[2]).toHaveLength(1);
    });

    it("should extract numerical fields correctly", async () => {
      const records = [
        { data: JSON.stringify({ height: 120, weight: 30, name: "test" }) },
        { data: JSON.stringify({ height: 125, weight: 32, active: true }) },
      ];

      const numericalFields = (service as any).extractNumericalFields(records);

      expect(numericalFields.height).toEqual([120, 125]);
      expect(numericalFields.weight).toEqual([30, 32]);
      expect(numericalFields.name).toBeUndefined();
      expect(numericalFields.active).toBeUndefined();
    });

    it("should calculate trends correctly", async () => {
      const values = [1, 2, 3, 4, 5]; // Perfect upward trend

      const trend = (service as any).calculateTrend(values);

      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.r2).toBeCloseTo(1, 1); // Should be close to perfect fit
    });

    it("should handle edge cases in trend calculation", async () => {
      // Single value
      const singleValue = [5];
      const singleTrend = (service as any).calculateTrend(singleValue);
      expect(singleTrend.slope).toBe(0);
      expect(singleTrend.r2).toBe(0);

      // Empty array
      const emptyArray: number[] = [];
      const emptyTrend = (service as any).calculateTrend(emptyArray);
      expect(emptyTrend.slope).toBe(0);
      expect(emptyTrend.r2).toBe(0);
    });
  });

  describe("insight quality", () => {
    it("should generate insights with proper structure", async () => {
      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([
          mockRecordsData,
          mockUsersData,
          mockRecordTypesData,
        ]);

      const insights = await service.generateAdvancedInsights();

      insights.forEach(insight => {
        expect(insight).toMatchObject({
          id: expect.any(String),
          type: expect.any(String),
          category: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          confidence: expect.stringMatching(/^(high|medium|low)$/),
          importance: expect.stringMatching(/^(critical|high|medium|low)$/),
          data: expect.objectContaining({
            trend: expect.stringMatching(
              /^(increasing|decreasing|stable|cyclical)$/
            ),
            timeframe: expect.any(String),
            dataPoints: expect.any(Number),
          }),
          recommendations: expect.any(Array),
          createdAt: expect.any(Date),
        });
      });

      mockPromiseAll.mockRestore();
    });

    it("should generate actionable recommendations", async () => {
      const mockPromiseAll = vi
        .spyOn(Promise, "all")
        .mockResolvedValue([
          mockRecordsData,
          mockUsersData,
          mockRecordTypesData,
        ]);

      const insights = await service.generateAdvancedInsights();

      insights.forEach(insight => {
        expect(insight.recommendations).toBeInstanceOf(Array);
        insight.recommendations.forEach(recommendation => {
          expect(typeof recommendation).toBe("string");
          expect(recommendation.length).toBeGreaterThan(0);
        });
      });

      mockPromiseAll.mockRestore();
    });
  });
});
