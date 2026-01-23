import type { CalendarItem, CalendarItemParticipant, User } from "@prisma/client";

// String literal types (matching Prisma schema)
export type Role = "ADMIN" | "USER";
export type CalendarItemType = "MEETING" | "DEADLINE";
export type ItemStatus = "DRAFT" | "CONFIRMED" | "DONE" | "CANCELED";
export type ParticipantRole = "OWNER" | "PARTICIPANT" | "RESPONSIBLE";
export type RsvpStatus = "YES" | "NO" | "MAYBE";

export interface CalendarItemWithRelations extends CalendarItem {
  createdBy: Pick<User, "id" | "name" | "email">;
  participants: (CalendarItemParticipant & {
    user: Pick<User, "id" | "name" | "email">;
  })[];
}

export interface CalendarViewType {
  type: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
  label: string;
}

export const CALENDAR_VIEWS: CalendarViewType[] = [
  { type: "dayGridMonth", label: "Month" },
  { type: "timeGridWeek", label: "Week" },
  { type: "timeGridDay", label: "Day" },
];

export const ITEM_TYPE_LABELS: Record<CalendarItemType, string> = {
  MEETING: "Meeting",
  DEADLINE: "Deadline",
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  DONE: "Done",
  CANCELED: "Canceled",
};

export const STATUS_COLORS: Record<ItemStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  CANCELED: "bg-red-100 text-red-800",
};
