import { eq, and, desc, sql, count } from "drizzle-orm";
import { trackers, trackerEntries, users } from "~/db/schema";
import type {
  NewTracker,
  Tracker,
  NewTrackerEntry,
  TrackerEntry,
  CreateTrackerInput,
  UpdateTrackerInput,
  CreateTrackerEntryInput,
  StartTimeTrackingInput,
  StopTimeTrackingInput,
  QuickLogInput,
} from "~/lib/schemas";

export class TrackerDB {
  constructor(private db: any) {}

  // Tracker CRUD operations
  async createTracker(
    data: CreateTrackerInput,
    householdId: string,
    createdBy: number,
    visibleToMembers?: string
  ): Promise<Tracker> {
    console.log("TrackerDB.createTracker called with:", {
      data,
      householdId,
      createdBy,
    });
    console.log("Database instance:", this.db);

    try {
      // First, let's check if the trackers table exists by trying to query it
      console.log("Checking if trackers table exists...");
      const tableCheck = await this.db.select().from(trackers).limit(1);
      console.log("Table check result:", tableCheck);

      console.log("Inserting tracker with values:", {
        ...data,
        householdId,
        createdBy,
      });

      const [tracker] = await this.db
        .insert(trackers)
        .values({
          ...data,
          householdId,
          createdBy,
          visibleToMembers,
        })
        .returning();

      console.log("Tracker created successfully:", tracker);
      return tracker;
    } catch (error) {
      console.error("Error in TrackerDB.createTracker:", error);
      console.error("Error details:", {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }
  }

  async getTrackers(householdId: string, userId?: number): Promise<Tracker[]> {
    const allTrackers = await this.db
      .select()
      .from(trackers)
      .where(eq(trackers.householdId, householdId))
      .orderBy(desc(trackers.createdAt));

    // If no userId provided, return all trackers (admin view)
    if (!userId) {
      return allTrackers;
    }

    // Filter trackers based on member visibility
    return allTrackers.filter(tracker => {
      // If visibleToMembers is null or empty, tracker is visible to all members
      if (!tracker.visibleToMembers) {
        return true;
      }

      try {
        const visibleMemberIds: number[] = JSON.parse(tracker.visibleToMembers);
        // If array is empty, visible to all members
        if (visibleMemberIds.length === 0) {
          return true;
        }
        // Check if current user is in the visible members list
        return visibleMemberIds.includes(userId);
      } catch {
        // If JSON parsing fails, assume visible to all members
        return true;
      }
    });
  }

  async getTracker(id: number, householdId: string): Promise<Tracker | null> {
    const [tracker] = await this.db
      .select()
      .from(trackers)
      .where(and(eq(trackers.id, id), eq(trackers.householdId, householdId)));

    return tracker || null;
  }

  async updateTracker(
    id: number,
    data: UpdateTrackerInput,
    householdId: string,
    visibleToMembers?: string
  ): Promise<Tracker | null> {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Add visibleToMembers if provided
    if (visibleToMembers !== undefined) {
      updateData.visibleToMembers = visibleToMembers;
    }

    const [tracker] = await this.db
      .update(trackers)
      .set(updateData)
      .where(and(eq(trackers.id, id), eq(trackers.householdId, householdId)))
      .returning();

    return tracker || null;
  }

  async deleteTracker(id: number, householdId: string): Promise<boolean> {
    // First delete all entries for this tracker
    await this.db
      .delete(trackerEntries)
      .where(
        and(
          eq(trackerEntries.trackerId, id),
          eq(trackerEntries.householdId, householdId)
        )
      );

    // Then delete the tracker
    const result = await this.db
      .delete(trackers)
      .where(and(eq(trackers.id, id), eq(trackers.householdId, householdId)));

    return result.changes > 0;
  }

  // Tracker Entry operations
  async createTrackerEntry(
    data: CreateTrackerEntryInput,
    householdId: string,
    createdBy: number
  ): Promise<TrackerEntry> {
    const [entry] = await this.db
      .insert(trackerEntries)
      .values({
        ...data,
        householdId,
        createdBy,
      })
      .returning();

    return entry;
  }

  async getTrackerEntries(
    trackerId: number,
    householdId: string,
    limit = 50
  ): Promise<TrackerEntry[]> {
    return await this.db
      .select()
      .from(trackerEntries)
      .where(
        and(
          eq(trackerEntries.trackerId, trackerId),
          eq(trackerEntries.householdId, householdId)
        )
      )
      .orderBy(desc(trackerEntries.createdAt))
      .limit(limit);
  }

  async getAllTrackerEntries(householdId: string): Promise<TrackerEntry[]> {
    return await this.db
      .select()
      .from(trackerEntries)
      .where(eq(trackerEntries.householdId, householdId))
      .orderBy(desc(trackerEntries.createdAt));
  }

  async getTrackerEntry(
    id: number,
    householdId: string
  ): Promise<TrackerEntry | null> {
    const [entry] = await this.db
      .select()
      .from(trackerEntries)
      .where(
        and(
          eq(trackerEntries.id, id),
          eq(trackerEntries.householdId, householdId)
        )
      );

    return entry || null;
  }

  async updateTrackerEntry(
    id: number,
    data: Partial<TrackerEntry>,
    householdId: string
  ): Promise<TrackerEntry | null> {
    const [entry] = await this.db
      .update(trackerEntries)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(trackerEntries.id, id),
          eq(trackerEntries.householdId, householdId)
        )
      )
      .returning();

    return entry || null;
  }

  async deleteTrackerEntry(id: number, householdId: string): Promise<boolean> {
    const result = await this.db
      .delete(trackerEntries)
      .where(
        and(
          eq(trackerEntries.id, id),
          eq(trackerEntries.householdId, householdId)
        )
      );

    return result.changes > 0;
  }

  // Time tracking operations
  async startTimeTracking(
    data: StartTimeTrackingInput,
    householdId: string,
    createdBy: number
  ): Promise<TrackerEntry> {
    // Check if there's already an active entry for this tracker and member
    const activeEntry = await this.db
      .select()
      .from(trackerEntries)
      .where(
        and(
          eq(trackerEntries.trackerId, data.trackerId),
          eq(trackerEntries.memberId, data.memberId || createdBy),
          eq(trackerEntries.isActive, 1),
          eq(trackerEntries.householdId, householdId)
        )
      );

    if (activeEntry.length > 0) {
      throw new Error(
        "Time tracking is already active for this tracker and member"
      );
    }

    const [entry] = await this.db
      .insert(trackerEntries)
      .values({
        trackerId: data.trackerId,
        memberId: data.memberId || createdBy,
        householdId,
        createdBy,
        value: 0, // Will be calculated when stopped
        startTime: new Date().toISOString(),
        isActive: 1,
        notes: data.notes,
      })
      .returning();

    return entry;
  }

  async stopTimeTracking(
    data: StopTimeTrackingInput,
    householdId: string
  ): Promise<TrackerEntry> {
    const entry = await this.getTrackerEntry(data.entryId, householdId);
    if (!entry) {
      throw new Error("Tracker entry not found");
    }

    if (!entry.isActive) {
      throw new Error("Time tracking is not active for this entry");
    }

    const endTime = new Date();
    const startTime = new Date(entry.startTime!);
    const durationMinutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    );

    const [updatedEntry] = await this.db
      .update(trackerEntries)
      .set({
        endTime: endTime.toISOString(),
        value: durationMinutes,
        isActive: 0,
        notes: data.notes || entry.notes,
        updatedAt: endTime.toISOString(),
      })
      .where(eq(trackerEntries.id, data.entryId))
      .returning();

    return updatedEntry;
  }

  // Quick log for cumulative trackers
  async quickLog(
    data: QuickLogInput,
    householdId: string,
    createdBy: number
  ): Promise<TrackerEntry> {
    const [entry] = await this.db
      .insert(trackerEntries)
      .values({
        ...data,
        householdId,
        createdBy,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        isActive: 0,
      })
      .returning();

    return entry;
  }

  // Get active time tracking entries
  async getActiveTimeTracking(householdId: string): Promise<TrackerEntry[]> {
    return await this.db
      .select()
      .from(trackerEntries)
      .where(
        and(
          eq(trackerEntries.isActive, 1),
          eq(trackerEntries.householdId, householdId)
        )
      );
  }

  // Get tracker statistics
  async getTrackerStats(
    trackerId: number,
    householdId: string,
    days = 30
  ): Promise<{
    totalValue: number;
    entryCount: number;
    averageValue: number;
    recentEntries: TrackerEntry[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const entries = await this.db
      .select()
      .from(trackerEntries)
      .where(
        and(
          eq(trackerEntries.trackerId, trackerId),
          eq(trackerEntries.householdId, householdId),
          sql`${trackerEntries.createdAt} >= ${cutoffDate.toISOString()}`
        )
      )
      .orderBy(desc(trackerEntries.createdAt));

    const totalValue = entries.reduce((sum: number, entry: any) => sum + entry.value, 0);
    const entryCount = entries.length;
    const averageValue = entryCount > 0 ? totalValue / entryCount : 0;

    return {
      totalValue,
      entryCount,
      averageValue,
      recentEntries: entries.slice(0, 10),
    };
  }

  // Get household member info for trackers
  async getHouseholdMembers(
    householdId: string
  ): Promise<{ id: number; name: string }[]> {
    return await this.db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(eq(users.householdId, householdId))
      .orderBy(users.name);
  }
}
