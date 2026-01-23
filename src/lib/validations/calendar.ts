import { z } from "zod";

export const CalendarItemTypeSchema = z.enum(["MEETING", "DEADLINE"]);
export const ItemStatusSchema = z.enum(["DRAFT", "CONFIRMED", "DONE", "CANCELED"]);
export const ParticipantRoleSchema = z.enum(["OWNER", "PARTICIPANT", "RESPONSIBLE"]);
export const RsvpStatusSchema = z.enum(["YES", "NO", "MAYBE"]);

// Query params for GET /api/calendar/items
export const GetCalendarItemsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: CalendarItemTypeSchema.optional(),
  status: ItemStatusSchema.optional(),
  search: z.string().optional(),
});

// Create calendar item
export const CreateCalendarItemSchema = z.object({
  type: CalendarItemTypeSchema,
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  allDay: z.boolean().optional().default(false),
  status: ItemStatusSchema.optional().default("DRAFT"),
  location: z.string().max(255).optional(),
  participants: z
    .array(
      z.object({
        userId: z.string(),
        role: ParticipantRoleSchema.optional().default("PARTICIPANT"),
      })
    )
    .optional(),
});

// Update calendar item
export const UpdateCalendarItemSchema = z.object({
  type: CalendarItemTypeSchema.optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  status: ItemStatusSchema.optional(),
  location: z.string().max(255).nullable().optional(),
  participants: z
    .array(
      z.object({
        userId: z.string(),
        role: ParticipantRoleSchema.optional().default("PARTICIPANT"),
        rsvp: RsvpStatusSchema.optional(),
      })
    )
    .optional(),
});

// Types
export type GetCalendarItemsInput = z.infer<typeof GetCalendarItemsSchema>;
export type CreateCalendarItemInput = z.infer<typeof CreateCalendarItemSchema>;
export type UpdateCalendarItemInput = z.infer<typeof UpdateCalendarItemSchema>;
