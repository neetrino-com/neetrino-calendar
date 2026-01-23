"use client";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDeleteScheduleEntry } from "../hooks/useSchedule";
import type { ScheduleEntryWithRelations } from "../types";
import { formatTimeRange, getInitials, stringToColor } from "@/lib/utils";

interface ScheduleEntryProps {
  entry: ScheduleEntryWithRelations;
  onEdit?: () => void;
}

export function ScheduleEntry({ entry, onEdit }: ScheduleEntryProps) {
  const deleteEntry = useDeleteScheduleEntry();

  const handleDelete = async () => {
    if (!confirm(`Delete entry for ${entry.user.name}?`)) return;

    try {
      await deleteEntry.mutateAsync(entry.id);
      toast.success("Entry deleted");
    } catch (error) {
      console.error("[ScheduleEntry] Delete error:", error);
      toast.error("Error deleting");
    }
  };

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarFallback className={stringToColor(entry.user.name)}>
            {getInitials(entry.user.name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{entry.user.name}</p>
          <p className="text-sm font-mono text-gray-600">
            {formatTimeRange(entry.startTime, entry.endTime)}
          </p>
          {entry.note && (
            <p className="text-xs text-gray-500 mt-1 truncate">{entry.note}</p>
          )}
        </div>

        {/* Actions - only for admin */}
        {onEdit && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
            >
              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
