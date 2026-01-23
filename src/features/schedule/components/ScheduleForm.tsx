"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateScheduleEntry, useUpdateScheduleEntry } from "../hooks/useSchedule";
import { useUsers } from "@/features/calendar/hooks/useUsers";
import type { ScheduleEntryWithRelations } from "../types";
import { minutesToTime, timeToMinutes } from "@/lib/utils";

interface ScheduleFormProps {
  entry: ScheduleEntryWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

export function ScheduleForm({ entry, isOpen, onClose, date }: ScheduleFormProps) {
  const isEditing = !!entry;

  // Form state
  const [userId, setUserId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Queries
  const { data: users = [] } = useUsers();
  const createEntry = useCreateScheduleEntry();
  const updateEntry = useUpdateScheduleEntry();

  // Initialize form
  useEffect(() => {
    if (entry) {
      setUserId(entry.userId);
      setStartTime(minutesToTime(entry.startTime));
      setEndTime(minutesToTime(entry.endTime));
      setNote(entry.note || "");
    } else {
      setUserId("");
      setStartTime("09:00");
      setEndTime("18:00");
      setNote("");
    }
    setError("");
  }, [entry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("Select an employee");
      return;
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      setError("End time must be later than start time");
      return;
    }

    try {
      if (isEditing) {
        await updateEntry.mutateAsync({
          id: entry.id,
          userId,
          startTime: startMinutes,
          endTime: endMinutes,
          note: note.trim() || null,
        });
        toast.success("Entry updated");
      } else {
        await createEntry.mutateAsync({
          date,
          userId,
          startTime: startMinutes,
          endTime: endMinutes,
          note: note.trim() || undefined,
        });
        toast.success("Entry added");
      }
      onClose();
    } catch (err) {
      console.error("[ScheduleForm] Submit error:", err);
      if (err instanceof Error) {
        if (err.message.includes("already exists")) {
          setError("This employee already has an entry for this day");
        } else {
          setError(err.message);
        }
      } else {
        setError("Error saving");
      }
    }
  };

  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit entry" : "Add schedule entry"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* User select */}
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
