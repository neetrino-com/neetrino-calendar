"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { UserWithPermissions } from "../types";
import { getInitials, stringToColor } from "@/lib/utils";

interface UserCardProps {
  user: UserWithPermissions;
  isSelected: boolean;
  onClick: () => void;
}

export function UserCard({ user, isSelected, onClick }: UserCardProps) {
  const initials = getInitials(user.name);
  const avatarColor = stringToColor(user.email);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150",
        "text-left border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Default state
        !isSelected && "border-transparent hover:bg-muted hover:border-border",
        // Selected state
        isSelected && "bg-primary/8 border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]"
      )}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {user.name}
          </span>
          {isSelected && (
            <Check className="w-4 h-4 text-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
          {user.role === "ADMIN" ? "Admin" : "User"}
        </Badge>
      </div>
    </button>
  );
}
