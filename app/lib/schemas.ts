import { z } from "zod";

// Tracker schemas
export const createTrackerSchema = z.object({
  name: z.string().min(1, "Tracker name is required").max(100, "Name too long"),
  description: z.string().optional(),
  type: z.enum(["time", "cumulative"]).default("time"),
  unit: z.string().min(1, "Unit is required").max(20, "Unit too long"),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .default("#3b82f6"),
  icon: z.string().max(10, "Icon too long").default("⏱️"),
});

export const updateTrackerSchema = createTrackerSchema.partial();

export const createTrackerEntrySchema = z.object({
  trackerId: z.number().int().positive("Invalid tracker ID"),
  memberId: z.number().int().positive("Invalid member ID").optional(),
  value: z.number().positive("Value must be positive"),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  notes: z.string().max(500, "Notes too long").optional(),
  tags: z.string().max(200, "Tags too long").optional(),
});

export const updateTrackerEntrySchema = createTrackerEntrySchema.partial();

export const startTimeTrackingSchema = z.object({
  trackerId: z.number().int().positive("Invalid tracker ID"),
  memberId: z.number().int().positive("Invalid member ID").optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const stopTimeTrackingSchema = z.object({
  entryId: z.number().int().positive("Invalid entry ID"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const quickLogSchema = z.object({
  trackerId: z.number().int().positive("Invalid tracker ID"),
  memberId: z.number().int().positive("Invalid member ID").optional(),
  value: z.number().positive("Value must be positive"),
  notes: z.string().max(500, "Notes too long").optional(),
  tags: z.string().max(200, "Tags too long").optional(),
});

// Re-export database types for convenience
export type { 
  Tracker, 
  NewTracker, 
  TrackerEntry, 
  NewTrackerEntry 
} from "~/db/schema";

export type CreateTrackerInput = z.infer<typeof createTrackerSchema>;
export type UpdateTrackerInput = z.infer<typeof updateTrackerSchema>;
export type CreateTrackerEntryInput = z.infer<typeof createTrackerEntrySchema>;
export type UpdateTrackerEntryInput = z.infer<typeof updateTrackerEntrySchema>;
export type StartTimeTrackingInput = z.infer<typeof startTimeTrackingSchema>;
export type StopTimeTrackingInput = z.infer<typeof stopTimeTrackingSchema>;
export type QuickLogInput = z.infer<typeof quickLogSchema>;
