import { eq, desc } from "drizzle-orm";
import {
  users,
  records,
  recordTypes,
  type NewAiRecommendation,
} from "~/db/schema";

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
    _allRecordTypes: any[]
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

    // Pattern 1: Detect data gaps for important categories (dynamic detection)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find categories that are important (have more than 3 records historically)
    const importantCategories = categoryInsights.filter(c => c.count >= 3);

    for (const category of importantCategories) {
      const recentRecords = allRecords.filter(
        r =>
          r.category === category.category &&
          r.createdAt &&
          new Date(r.createdAt) >= weekAgo
      );

      if (recentRecords.length === 0) {
        // Determine category type for better messaging
        const categoryType = this.categorizeRecordType(category.category);
        patterns.push({
          type: categoryType,
          title: `${category.category} Data Gap Detected`,
          description: `No ${category.category.toLowerCase()} records have been logged in the past week.`,
          confidence: "medium",
          metadata: {
            category: category.category,
            daysSinceLastRecord: this.getDaysSinceLastRecord(
              allRecords,
              category.category
            ),
          },
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

  /**
   * Categorize a record type based on its name/category for better pattern detection
   */
  private categorizeRecordType(
    category: string
  ): "health" | "activity" | "growth" | "data_entry" {
    const categoryLower = category.toLowerCase();

    if (
      categoryLower.includes("health") ||
      categoryLower.includes("medical") ||
      categoryLower.includes("symptom") ||
      categoryLower.includes("sleep") ||
      categoryLower.includes("mood") ||
      categoryLower.includes("wellness")
    ) {
      return "health";
    }

    if (
      categoryLower.includes("activity") ||
      categoryLower.includes("exercise") ||
      categoryLower.includes("sports") ||
      categoryLower.includes("movement")
    ) {
      return "activity";
    }

    if (
      categoryLower.includes("growth") ||
      categoryLower.includes("development") ||
      categoryLower.includes("milestone") ||
      categoryLower.includes("learning") ||
      categoryLower.includes("education")
    ) {
      return "growth";
    }

    return "data_entry";
  }

  /**
   * Get days since last record for a category
   */
  private getDaysSinceLastRecord(allRecords: any[], category: string): number {
    const categoryRecords = allRecords
      .filter(r => r.category === category && r.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    if (categoryRecords.length === 0) return -1;

    const lastRecord = new Date(categoryRecords[0].createdAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - lastRecord.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Suggest categories that aren't currently active
   */
  private getSuggestedCategories(activeCategories: string[]): string[] {
    const commonCategories = [
      "Health",
      "Activities",
      "Development",
      "Education",
      "Social",
      "Nutrition",
      "Wellness",
    ];
    const activeLower = activeCategories.map(c => c.toLowerCase());

    return commonCategories
      .filter(category => !activeLower.includes(category.toLowerCase()))
      .slice(0, 3); // Limit to 3 suggestions
  }

  private generateRecommendations(
    patterns: PatternInsight[],
    summary: InsightSummary,
    _categoryInsights: CategoryInsight[],
    _memberInsights: MemberInsight[]
  ): Omit<NewAiRecommendation, "createdAt" | "updatedAt">[] {
    const recommendations: Omit<
      NewAiRecommendation,
      "createdAt" | "updatedAt"
    >[] = [];

    // Dynamic recommendations based on data gap patterns
    const dataGapPatterns = patterns.filter(p =>
      p.title.includes("Data Gap Detected")
    );
    for (const gapPattern of dataGapPatterns) {
      const category = gapPattern.metadata?.category || "data";
      const daysSince = gapPattern.metadata?.daysSinceLastRecord || 0;

      let priority: "high" | "medium" | "low" = "medium";
      if (daysSince > 14) priority = "high";
      else if (daysSince > 7) priority = "medium";
      else priority = "low";

      recommendations.push({
        householdId: this.householdId,
        type: gapPattern.type,
        title: `Log Recent ${category} Information`,
        description: `Consider adding recent ${category.toLowerCase()} information. It's been ${daysSince} days since the last entry.`,
        priority,
        status: "active",
        metadata: JSON.stringify({
          category,
          daysSinceLastRecord: daysSince,
        }),
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

    // Dynamic recommendation for exploring new data types
    if (summary.activeCategories.length < 3) {
      const suggestedCategories = this.getSuggestedCategories(
        summary.activeCategories
      );
      recommendations.push({
        householdId: this.householdId,
        type: "growth",
        title: "Explore Additional Record Types",
        description: `Consider tracking ${suggestedCategories.join(", ")} to get more comprehensive insights about your household.`,
        priority: "medium",
        status: "active",
        metadata: JSON.stringify({
          currentCategories: summary.activeCategories,
          suggestedCategories,
        }),
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
