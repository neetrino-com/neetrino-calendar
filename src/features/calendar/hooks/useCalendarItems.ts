"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CalendarItemWithRelations, CalendarItemType, ItemStatus } from "../types";
import type {
  CreateCalendarItemInput,
  UpdateCalendarItemInput,
} from "@/lib/validations/calendar";

interface GetCalendarItemsParams {
  from?: string;
  to?: string;
  type?: CalendarItemType;
  status?: ItemStatus;
  search?: string;
}

async function fetchCalendarItems(
  params: GetCalendarItemsParams
): Promise<CalendarItemWithRelations[]> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.type) searchParams.set("type", params.type);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/calendar/items?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch calendar items");
  }

  const data = await response.json();
  return data.items;
}

async function createCalendarItem(
  input: CreateCalendarItemInput
): Promise<CalendarItemWithRelations> {
  const response = await fetch("/api/calendar/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create calendar item");
  }

  const data = await response.json();
  return data.item;
}

async function updateCalendarItem({
  id,
  ...input
}: UpdateCalendarItemInput & { id: string }): Promise<CalendarItemWithRelations> {
  const response = await fetch(`/api/calendar/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update calendar item");
  }

  const data = await response.json();
  return data.item;
}

async function deleteCalendarItem(id: string): Promise<void> {
  const response = await fetch(`/api/calendar/items/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete calendar item");
  }
}

export function useCalendarItems(params: GetCalendarItemsParams = {}) {
  return useQuery({
    queryKey: ["calendarItems", params],
    queryFn: () => fetchCalendarItems(params),
  });
}

export function useCreateCalendarItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCalendarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarItems"] });
    },
  });
}

export function useUpdateCalendarItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCalendarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarItems"] });
    },
  });
}

export function useDeleteCalendarItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCalendarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarItems"] });
    },
  });
}
