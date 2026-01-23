import type { ScheduleEntry, User } from "@prisma/client";

export interface ScheduleEntryWithRelations extends ScheduleEntry {
  user: Pick<User, "id" | "name" | "email">;
  createdBy: Pick<User, "id" | "name">;
}

export interface ScheduleFormData {
  userId: string;
  startTime: number; // minutes from midnight
  endTime: number; // minutes from midnight
  note?: string;
}
