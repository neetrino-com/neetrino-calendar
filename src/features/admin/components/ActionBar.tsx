"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  hasChanges: boolean;
  changesCount: number;
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function ActionBar({
  hasChanges,
  changesCount,
  isSaving,
  saveSuccess,
  onSave,
  onReset,
}: ActionBarProps) {
  return (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Unsaved changes indicator */}
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {changesCount} unsaved {changesCount === 1 ? "change" : "changes"}
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>

          <Button
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "min-w-[140px] transition-all duration-300",
              saveSuccess && "bg-green-600 hover:bg-green-600",
              !hasChanges && "opacity-50"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
