import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Households table
export const households = sqliteTable("households", {
  id: text("id").primaryKey(), // UUID string
  name: text("name").notNull(),
  inviteCode: text("invite_code").unique().notNull(),
  hasAnalyticsAccess: integer("has_analytics_access").default(1), // 0 = no access, 1 = has access (paid feature)
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Users/Household members table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  hashedPassword: text("hashed_password"), // null for children without accounts
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  role: text("role").default("member"), // 'admin', 'member'
  admin: integer("admin").default(0), // 0 = regular user, 1 = system admin (shows debug UI)
  age: integer("age"), // for children
  relationshipToAdmin: text("relationship_to_admin"), // 'self', 'spouse', 'child', etc.
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Record types table (flexible record definitions)
export const recordTypes = sqliteTable("record_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Personal"), // Category this record type belongs to
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  fields: text("fields"), // JSON array of field definitions
  icon: text("icon"), // Icon name or emoji
  color: text("color"), // Color for the record type
  allowPrivate: integer("allow_private").default(0), // 0 = no privacy option, 1 = privacy option available
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Records table (actual data entries)
export const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"), // JSON object with field values
  recordTypeId: integer("record_type_id").references(() => recordTypes.id),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  memberId: integer("member_id").references(() => users.id), // Which household member this record is about
  createdBy: integer("created_by").references(() => users.id), // Who created the record
  tags: text("tags"), // Comma-separated tags
  attachments: text("attachments"), // JSON array of file URLs
  isPrivate: integer("is_private").default(0), // 0 = shared, 1 = private
  datetime: text("datetime"), // When the record occurred (ISO string), defaults to createdAt if not specified
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Quick notes table (for rapid note-taking)
export const quickNotes = sqliteTable("quick_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  createdBy: integer("created_by").references(() => users.id),
  tags: text("tags"), // Comma-separated tags
  attachments: text("attachments"), // JSON array of file URLs
  recordId: integer("record_id").references(() => records.id), // Optional link to a record
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Contact submissions table (for external contact forms)
export const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Trackers table (for time tracking and activity logging)
export const trackers = sqliteTable("trackers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("time"), // 'time' for start/stop, 'cumulative' for sum of logs
  unit: text("unit").notNull().default("minutes"), // 'minutes', 'hours', 'count', etc.
  color: text("color").default("#3b82f6"), // Hex color for UI
  icon: text("icon").default("⏱️"), // Icon or emoji
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  createdBy: integer("created_by").references(() => users.id),
  isActive: integer("is_active").default(1), // 0 = inactive, 1 = active
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Tracker entries table (individual time logs or cumulative entries)
export const trackerEntries = sqliteTable("tracker_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackerId: integer("tracker_id")
    .notNull()
    .references(() => trackers.id),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  memberId: integer("member_id").references(() => users.id), // Which member this entry is for
  createdBy: integer("created_by").references(() => users.id), // Who created the entry
  value: real("value").notNull(), // Duration in minutes or cumulative amount
  startTime: text("start_time"), // ISO string for time tracking start
  endTime: text("end_time"), // ISO string for time tracking end
  notes: text("notes"), // Optional notes about the entry
  tags: text("tags"), // Comma-separated tags
  isActive: integer("is_active").default(0), // For time tracking: 0 = completed, 1 = currently running
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Analytics cache table (for caching insights with TTL)
export const analyticsCache = sqliteTable("analytics_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  cacheKey: text("cache_key").notNull(), // e.g., "basic_insights", "health_trends"
  data: text("data"), // JSON object with analytics results
  expiresAt: text("expires_at").notNull(), // ISO datetime string
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// AI recommendations table (for storing generated recommendations)
export const aiRecommendations = sqliteTable("ai_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id),
  memberId: integer("member_id").references(() => users.id), // Optional: recommendation for specific member
  type: text("type").notNull(), // 'health', 'activity', 'data_entry', 'growth'
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  status: text("status").notNull().default("active"), // 'active', 'dismissed', 'completed'
  metadata: text("metadata"), // JSON object with additional data
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Type exports
export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RecordType = typeof recordTypes.$inferSelect;
export type NewRecordType = typeof recordTypes.$inferInsert;
export type Record = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
export type QuickNote = typeof quickNotes.$inferSelect;
export type NewQuickNote = typeof quickNotes.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
export type Tracker = typeof trackers.$inferSelect;
export type NewTracker = typeof trackers.$inferInsert;
export type TrackerEntry = typeof trackerEntries.$inferSelect;
export type NewTrackerEntry = typeof trackerEntries.$inferInsert;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type NewAnalyticsCache = typeof analyticsCache.$inferInsert;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type NewAiRecommendation = typeof aiRecommendations.$inferInsert;
