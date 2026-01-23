"use client";

import { Calendar, Clock, BarChart3, Info, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PermissionSegment } from "./PermissionSegment";
import type { ModulePermission, ModuleType, PermissionLevel, UserWithPermissions, MODULES } from "../types";

// Module icons mapping
const MODULE_ICONS: Record<ModuleType, React.ReactNode> = {
  meetings: <Calendar className="w-4 h-4" />,
  deadlines: <Clock className="w-4 h-4" />,
  schedule: <BarChart3 className="w-4 h-4" />,
};

// Module labels
const MODULE_LABELS: Record<ModuleType, string> = {
  meetings: "Meetings",
  deadlines: "Deadlines",
  schedule: "Schedule",
};

interface PermissionsTableProps {
  user: UserWithPermissions | null;
  permissions: ModulePermission[];
  onChange: (module: ModuleType, scope: "my" | "all", level: PermissionLevel) => void;
  isLoading: boolean;
}

export function PermissionsTable({
  user,
  permissions,
  onChange,
  isLoading,
}: PermissionsTableProps) {
  // Empty state - no user selected
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Select a user
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            from the list on the left to configure permissions
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-5 bg-muted rounded w-48 animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-32 h-5 bg-muted rounded" />
              <div className="flex-1 h-8 bg-muted rounded" />
              <div className="flex-1 h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const modules: ModuleType[] = ["meetings", "deadlines", "schedule"];

  return (
    <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
      {/* Header with user name */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">
          Access permissions: <span className="text-primary">{user.name}</span>
        </h3>
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-1/4">
                Module
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="flex items-center justify-center gap-1">
                  <span>My</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="p-0.5 hover:bg-muted rounded">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-medium mb-1">My records</p>
                      <p className="text-xs opacity-90">
                        Permissions for data created by this user
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-[10px] font-normal normal-case tracking-normal opacity-70">
                  (My records)
                </span>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="flex items-center justify-center gap-1">
                  <span>Everyone</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="p-0.5 hover:bg-muted rounded">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-medium mb-1">All records</p>
                      <p className="text-xs opacity-90">
                        Permissions for data created by other users
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-[10px] font-normal normal-case tracking-normal opacity-70">
                  (All records)
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module, index) => {
              const perm = permissions.find((p) => p.module === module) || {
                module,
                myLevel: "NONE" as PermissionLevel,
                allLevel: "NONE" as PermissionLevel,
              };

              // Check for warning condition: Everyone = Edit & My = None
              const hasWarning = perm.allLevel === "EDIT" && perm.myLevel === "NONE";

              return (
                <tr
                  key={module}
                  className={`border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
                    index % 2 === 0 ? "" : "bg-muted/10"
                  }`}
                >
                  {/* Module name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{MODULE_ICONS[module]}</span>
                      <span className="text-sm font-medium text-foreground">
                        {MODULE_LABELS[module]}
                      </span>
                    </div>
                  </td>

                  {/* My permissions */}
                  <td className={`px-4 py-4 bg-primary/[0.02] ${hasWarning ? "ring-1 ring-inset ring-amber-400/50" : ""}`}>
                    <div className="flex justify-center">
                      <PermissionSegment
                        value={perm.myLevel}
                        onChange={(level) => onChange(module, "my", level)}
                      />
                    </div>
                  </td>

                  {/* Everyone permissions */}
                  <td className="px-4 py-4 bg-purple-500/[0.02]">
                    <div className="flex justify-center">
                      <PermissionSegment
                        value={perm.allLevel}
                        onChange={(level) => onChange(module, "all", level)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden p-4 space-y-4">
        {modules.map((module) => {
          const perm = permissions.find((p) => p.module === module) || {
            module,
            myLevel: "NONE" as PermissionLevel,
            allLevel: "NONE" as PermissionLevel,
          };

          return (
            <div
              key={module}
              className="bg-muted/30 rounded-lg p-4 space-y-4"
            >
              {/* Module header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-muted-foreground">{MODULE_ICONS[module]}</span>
                <span className="text-sm font-medium text-foreground uppercase">
                  {MODULE_LABELS[module]}
                </span>
              </div>

              {/* My permissions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">My records:</p>
                <PermissionSegment
                  value={perm.myLevel}
                  onChange={(level) => onChange(module, "my", level)}
                />
              </div>

              {/* Everyone permissions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">All records:</p>
                <PermissionSegment
                  value={perm.allLevel}
                  onChange={(level) => onChange(module, "all", level)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
