import { eq, desc } from "drizzle-orm";
import { users, records, recordTypes } from "~/db/schema";
import type { NewAiRecommendation } from "~/db/schema";

export interface InsightSummary {
  totalRecords: number;
  totalMembers: number;
  activeCategories: string[];
  recordsThisWeek: number;
  recordsThisMonth: number;
  mostActiveCategory: string | null;
  mostActiveMember: string | null;
}

export interface CategoryInsight {
  category: string;
  count: number;
  trend: "increasing" | "decreasing" | "stable";
  lastRecordDate: string | null;
  averagePerWeek: number;
}

export interface MemberInsight {
  memberId: number;
  memberName: string;
  recordCount: number;
  categories: string[];
  lastActivity: string | null;
  trend: "increasing" | "decreasing" | "stable";
}

export interface PatternInsight {
  type: "health" | "activity" | "growth" | "data_entry";
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  metadata?: any;
}

export interface BasicInsights {
  summary: InsightSummary;
  categoryInsights: CategoryInsight[];
  memberInsights: MemberInsight[];
  patterns: PatternInsight[];
  recommendations: Omit<NewAiRecommendation, "createdAt" | "updatedAt">[];
}

export class AnalyticsService {
  constructor(
    private db: any,
    private householdId: string
  ) {}

  async generateBasicInsights(): Promise<BasicInsights> {
    console.log(
      "AnalyticsService.generateBasicInsights called for household:",
      this.householdId
    );

    try {
      // Get all household data
      const [members, allRecords, allRecordTypes] = await Promise.all([
        this.getHouseholdMembers(),
        this.getHouseholdRecords(),
        this.getHouseholdRecordTypes(),
      ]);

      // Generate summary statistics
      const summary = await this.generateSummary(members, allRecords);

      // Generate category insights
      const categoryInsights = await this.generateCategoryInsights(
        allRecords,
        allRecordTypes
      );

      // Generate member insights
      const memberInsights = await this.generateMemberInsights(
        members,
        allRecords
      );

      // Detect patterns
      const patterns = this.detectPatterns(
        allRecords,
        members,
        categoryInsights,
        memberInsights
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        patterns,
        summary,
        categoryInsights,
        memberInsights
      );

      const insights: BasicInsights = {
        summary,
        categoryInsights,
        memberInsights,
        patterns,
        recommendations,
      };

      console.log("Generated basic insights:", {
        patterns: insights.patterns.length,
        recommendations: insights.recommendations.length,
        categories: insights.categoryInsights.length,
        members: insights.memberInsights.length,
      });

      return insights;
    } catch (error) {
      console.error("Error in AnalyticsService.generateBasicInsights:", error);
      throw error;
    }
  }

  private async getHouseholdMembers() {
    return await this.db
      .select()
      .from(users)
      .where(eq(users.householdId, this.householdId));
  }

  private async getHouseholdRecords() {
    return await this.db
      .select()
      .from(records)
      .where(eq(records.householdId, this.householdId))
      .orderBy(desc(records.createdAt));
  }

  private async getHouseholdRecordTypes() {
    return await this.db
      .select()
      .from(recordTypes)
      .where(eq(recordTypes.householdId, this.householdId));
  }

  private async generateSummary(
    members: any[],
    allRecords: any[]
  ): Promise<InsightSummary> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recordsThisWeek = allRecords.filter(
      r => r.createdAt && new Date(r.createdAt) >= oneWeekAgo
    ).length;

    const recordsThisMonth = allRecords.filter(
      r => r.createdAt && new Date(r.createdAt) >= oneMonthAgo
    ).length;

    // Get unique categories
    const categories = [
      ...new Set(allRecords.map(r => r.category).filter(Boolean)),
    ];

    // Find most active category
    const categoryCounts = allRecords.reduce((acc: any, record) => {
      if (record.category) {
        acc[record.category] = (acc[record.category] || 0) + 1;
      }
      return acc;
    }, {});

    const mostActiveCategory =
      Object.keys(categoryCounts).length > 0
        ? Object.keys(categoryCounts).reduce((a, b) =>
            categoryCounts[a] > categoryCounts[b] ? a : b
          )
        : null;

    // Find most active member
    const memberCounts = allRecords.reduce((acc: any, record) => {
      if (record.memberId) {
        acc[record.memberId] = (acc[record.memberId] || 0) + 1;
      }
      return acc;
    }, {});

    const mostActiveMemberId =
      Object.keys(memberCounts).length > 0
        ? Object.keys(memberCounts).reduce((a, b) =>
            memberCounts[a] > memberCounts[b] ? a : b
          )
        : null;

    const mostActiveMember = mostActiveMemberId
      ? members.find(m => m.id === parseInt(mostActiveMemberId))?.name || null
      : null;

    return {
      totalRecords: allRecords.length,
      totalMembers: members.length,
      activeCategories: categories,
      recordsThisWeek,
      recordsThisMonth,
      mostActiveCategory,
      mostActiveMember,
    };
  }

  private async generateCategoryInsights(
    allRecords: any[],
    allRecordTypes: any[]
  ): Promise<CategoryInsight[]> {
    const categoryGroups = allRecords.reduce((acc: any, record) => {
      const category = record.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(record);
      return acc;
    }, {});

    const insights: CategoryInsight[] = [];

    for (const [category, categoryRecords] of Object.entries<any>(
      categoryGroups
    )) {
      const records = categoryRecords as any[];
      const lastRecordDate = records[0]?.createdAt || null; // Already ordered by desc

      // Calculate trend (simple: compare last 2 weeks vs previous 2 weeks)
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

      const recentCount = records.filter(
        r => r.createdAt && new Date(r.createdAt) >= twoWeeksAgo
      ).length;

      const previousCount = records.filter(
        r =>
          r.createdAt &&
          new Date(r.createdAt) >= fourWeeksAgo &&
          new Date(r.createdAt) < twoWeeksAgo
      ).length;

      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (recentCount > previousCount * 1.2) trend = "increasing";
      else if (recentCount < previousCount * 0.8) trend = "decreasing";

      // Average per week (based on all data)
      const oldestRecord = records[records.length - 1];
      const timeSpanWeeks = oldestRecord?.createdAt
        ? Math.max(
            1,
            (now.getTime() - new Date(oldestRecord.createdAt).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        : 1;
      const averagePerWeek =
        Math.round((records.length / timeSpanWeeks) * 10) / 10;

      insights.push({
        category,
        count: records.length,
        trend,
        lastRecordDate,
        averagePerWeek,
      });
    }

    return insights.sort((a, b) => b.count - a.count);
  }

  private async generateMemberInsights(
    members: any[],
    allRecords: any[]
  ): Promise<MemberInsight[]> {
    const insights: MemberInsight[] = [];

    for (const member of members) {
      const memberRecords = allRecords.filter(r => r.memberId === member.id);
      const categories = [
        ...new Set(memberRecords.map(r => r.category).filter(Boolean)),
      ];
      const lastActivity = memberRecords[0]?.createdAt || null; // Already ordered by desc

      // Calculate trend
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

      const recentCount = memberRecords.filter(
        r => r.createdAt && new Date(r.createdAt) >= twoWeeksAgo
      ).length;

      const previousCount = memberRecords.filter(
        r =>
          r.createdAt &&
          new Date(r.createdAt) >= fourWeeksAgo &&
          new Date(r.createdAt) < twoWeeksAgo
      ).length;

      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (recentCount > previousCount * 1.2) trend = "increasing";
      else if (recentCount < previousCount * 0.8) trend = "decreasing";

      insights.push({
        memberId: member.id,
        memberName: member.name,
        recordCount: memberRecords.length,
        categories,
        lastActivity,
        trend,
      });
    }

    return insights.sort((a, b) => b.recordCount - a.recordCount);
  }

  private detectPatterns(
    allRecords: any[],
    members: any[],
    categoryInsights: CategoryInsight[],
    memberInsights: MemberInsight[]
  ): PatternInsight[] {
    const patterns: PatternInsight[] = [];

    // Pattern 1: Detect health-related data gaps
    const healthCategories = categoryInsights.filter(
      c =>
        c.category.toLowerCase().includes("health") ||
        c.category.toLowerCase().includes("medical") ||
        c.category.toLowerCase().includes("symptom")
    );

    if (healthCategories.length > 0) {
      const recentHealthRecords = allRecords.filter(
        r =>
          healthCategories.some(hc => hc.category === r.category) &&
          r.createdAt &&
          new Date(r.createdAt) >=
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      if (recentHealthRecords.length === 0) {
        patterns.push({
          type: "health",
          title: "Health Data Gap Detected",
          description:
            "No health-related records have been logged in the past week.",
          confidence: "medium",
        });
      }
    }

    // Pattern 2: Detect inactive members
    const inactiveMembers = memberInsights.filter(m => {
      const lastActivity = m.lastActivity ? new Date(m.lastActivity) : null;
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      return !lastActivity || lastActivity < twoWeeksAgo;
    });

    if (inactiveMembers.length > 0) {
      patterns.push({
        type: "activity",
        title: "Inactive Members Detected",
        description: `${inactiveMembers.length} member(s) haven't had records logged in 2+ weeks.`,
        confidence: "high",
        metadata: { inactiveMembers: inactiveMembers.map(m => m.memberName) },
      });
    }

    // Pattern 3: Detect growing trends
    const growingCategories = categoryInsights.filter(
      c => c.trend === "increasing"
    );
    if (growingCategories.length > 0) {
      patterns.push({
        type: "growth",
        title: "Growing Data Categories",
        description: `${growingCategories.length} categories showing increased activity.`,
        confidence: "high",
        metadata: { categories: growingCategories.map(c => c.category) },
      });
    }

    // Pattern 4: Data entry consistency
    const now = new Date();
    const dailyRecords = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayRecords = allRecords.filter(r => {
        if (!r.createdAt) return false;
        const recordDate = new Date(r.createdAt);
        return recordDate.toDateString() === date.toDateString();
      });
      return dayRecords.length;
    });

    const averageDaily =
      dailyRecords.reduce((a, b) => a + b, 0) / dailyRecords.length;
    const variance =
      dailyRecords.reduce(
        (acc, val) => acc + Math.pow(val - averageDaily, 2),
        0
      ) / dailyRecords.length;

    if (variance > averageDaily * 2) {
      // High variance
      patterns.push({
        type: "data_entry",
        title: "Inconsistent Data Entry",
        description: "Record entry patterns vary significantly day-to-day.",
        confidence: "medium",
        metadata: { averageDaily: Math.round(averageDaily * 10) / 10 },
      });
    }

    return patterns;
  }

  private generateRecommendations(
    patterns: PatternInsight[],
    summary: InsightSummary,
    categoryInsights: CategoryInsight[],
    memberInsights: MemberInsight[]
  ): Omit<NewAiRecommendation, "createdAt" | "updatedAt">[] {
    const recommendations: Omit<
      NewAiRecommendation,
      "createdAt" | "updatedAt"
    >[] = [];

    // Recommendation based on health gap pattern
    const healthGapPattern = patterns.find(
      p => p.type === "health" && p.title.includes("Health Data Gap")
    );
    if (healthGapPattern) {
      recommendations.push({
        householdId: this.householdId,
        type: "health",
        title: "Log Health Information",
        description:
          "Consider logging recent health information to maintain comprehensive records.",
        priority: "medium",
        status: "active",
      });
    }

    // Recommendation for inactive members
    const inactivePattern = patterns.find(
      p => p.type === "activity" && p.title.includes("Inactive Members")
    );
    if (inactivePattern && inactivePattern.metadata?.inactiveMembers) {
      recommendations.push({
        householdId: this.householdId,
        type: "data_entry",
        title: "Update Inactive Member Records",
        description: `Consider adding recent information for: ${inactivePattern.metadata.inactiveMembers.join(", ")}.`,
        priority: "low",
        status: "active",
        metadata: JSON.stringify({
          memberNames: inactivePattern.metadata.inactiveMembers,
        }),
      });
    }

    // Recommendation for data consistency
    const consistencyPattern = patterns.find(
      p => p.type === "data_entry" && p.title.includes("Inconsistent")
    );
    if (consistencyPattern) {
      recommendations.push({
        householdId: this.householdId,
        type: "data_entry",
        title: "Establish Regular Data Entry",
        description:
          "Try to maintain a consistent schedule for logging household records.",
        priority: "low",
        status: "active",
      });
    }

    // Recommendation for new categories
    if (summary.activeCategories.length < 3) {
      recommendations.push({
        householdId: this.householdId,
        type: "growth",
        title: "Explore New Categories",
        description:
          "Consider adding records in new categories like Health, Activities, or Development milestones.",
        priority: "medium",
        status: "active",
      });
    }

    // High priority recommendation for very low activity
    if (summary.recordsThisWeek < 2) {
      recommendations.push({
        householdId: this.householdId,
        type: "data_entry",
        title: "Increase Record Activity",
        description:
          "Your household has had minimal record activity this week. Regular logging helps track important information.",
        priority: "high",
        status: "active",
      });
    }

    return recommendations;
  }
}
