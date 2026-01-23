import { z } from "zod";

// Query params for GET /api/schedule
export const GetScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Create schedule entry
export const CreateScheduleEntrySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    userId: z.string().min(1, "User is required"),
    startTime: z
      .number()
      .int()
      .min(0, "Start time must be at least 00:00")
      .max(1439, "Start time must be before 24:00"),
    endTime: z
      .number()
      .int()
      .min(0, "End time must be at least 00:00")
      .max(1439, "End time must be before 24:00"),
    note: z.string().max(500).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// Update schedule entry
export const UpdateScheduleEntrySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    userId: z.string().optional(),
    startTime: z.number().int().min(0).max(1439).optional(),
    endTime: z.number().int().min(0).max(1439).optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime !== undefined && data.endTime !== undefined) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

// Types
export type GetScheduleInput = z.infer<typeof GetScheduleSchema>;
export type CreateScheduleEntryInput = z.infer<typeof CreateScheduleEntrySchema>;
export type UpdateScheduleEntryInput = z.infer<typeof UpdateScheduleEntrySchema>;
