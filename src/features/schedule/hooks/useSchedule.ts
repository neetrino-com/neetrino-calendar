"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleEntryWithRelations } from "../types";
import type {
  CreateScheduleEntryInput,
  UpdateScheduleEntryInput,
} from "@/lib/validations/schedule";

async function fetchSchedule(date: string): Promise<ScheduleEntryWithRelations[]> {
  const response = await fetch(`/api/schedule?date=${date}`);

  if (!response.ok) {
    throw new Error("Failed to fetch schedule");
  }

  const data = await response.json();
  return data.entries;
}

async function createScheduleEntry(
  input: CreateScheduleEntryInput
): Promise<ScheduleEntryWithRelations> {
  const response = await fetch("/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create schedule entry");
  }

  const data = await response.json();
  return data.entry;
}

async function updateScheduleEntry({
  id,
  ...input
}: UpdateScheduleEntryInput & { id: string }): Promise<ScheduleEntryWithRelations> {
  const response = await fetch(`/api/schedule/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update schedule entry");
  }

  const data = await response.json();
  return data.entry;
}

async function deleteScheduleEntry(id: string): Promise<void> {
  const response = await fetch(`/api/schedule/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete schedule entry");
  }
}

export function useSchedule(date: string) {
  return useQuery({
    queryKey: ["schedule", date],
    queryFn: () => fetchSchedule(date),
    enabled: !!date,
  });
}

export function useCreateScheduleEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createScheduleEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useUpdateScheduleEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateScheduleEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useDeleteScheduleEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteScheduleEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}
