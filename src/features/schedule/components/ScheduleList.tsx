"use client";

import { ScheduleEntry } from "./ScheduleEntry";
import type { ScheduleEntryWithRelations } from "../types";

interface ScheduleListProps {
  entries: ScheduleEntryWithRelations[];
  onEdit?: (entry: ScheduleEntryWithRelations) => void;
}

export function ScheduleList({ entries, onEdit }: ScheduleListProps) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <ScheduleEntry
          key={entry.id}
          entry={entry}
          onEdit={onEdit ? () => onEdit(entry) : undefined}
        />
      ))}
    </div>
  );
}
