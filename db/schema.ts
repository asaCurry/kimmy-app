import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Households table
export const households = sqliteTable("households", {
  id: text("id").primaryKey(), // UUID string
  name: text("name").notNull(),
  inviteCode: text("invite_code").unique().notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
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
  age: integer("age"), // for children
  relationshipToAdmin: text("relationship_to_admin"), // 'self', 'spouse', 'child', etc.
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
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
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
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
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
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
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Contact submissions table (for external contact forms)
export const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
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
