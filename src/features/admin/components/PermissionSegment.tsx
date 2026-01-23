"use client";

import { cn } from "@/lib/utils";
import type { PermissionLevel } from "../types";

interface PermissionSegmentProps {
  value: PermissionLevel;
  onChange: (value: PermissionLevel) => void;
  disabled?: boolean;
}

const OPTIONS: { value: PermissionLevel; label: string }[] = [
  { value: "VIEW", label: "View" },
  { value: "EDIT", label: "Edit" },
  { value: "NONE", label: "None" },
];

export function PermissionSegment({ value, onChange, disabled = false }: PermissionSegmentProps) {
  return (
    <div className="inline-flex bg-muted rounded-md p-0.5 gap-0.5">
      {OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 rounded text-[13px] font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && !isSelected && "hover:bg-background/50 hover:text-foreground",
              // Selected states with different visual hierarchy
              isSelected && option.value === "EDIT" && "bg-primary text-primary-foreground shadow-sm",
              isSelected && option.value === "VIEW" && "bg-background text-primary shadow-sm",
              isSelected && option.value === "NONE" && "bg-background text-muted-foreground opacity-70 shadow-sm",
              // Default (not selected)
              !isSelected && "text-muted-foreground bg-transparent"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
