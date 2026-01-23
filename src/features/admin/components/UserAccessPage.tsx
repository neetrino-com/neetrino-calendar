"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserListPanel } from "./UserListPanel";
import { PermissionsTable } from "./PermissionsTable";
import { ActionBar } from "./ActionBar";
import type {
  UserWithPermissions,
  ModulePermission,
  ModuleType,
  PermissionLevel,
  UpdatePermissionsRequest,
} from "../types";

// Default permissions for all modules
const DEFAULT_PERMISSIONS: ModulePermission[] = [
  { module: "meetings", myLevel: "NONE", allLevel: "NONE" },
  { module: "deadlines", myLevel: "NONE", allLevel: "NONE" },
  { module: "schedule", myLevel: "NONE", allLevel: "NONE" },
];

// Fetch users with permissions
async function fetchUsersWithPermissions(): Promise<UserWithPermissions[]> {
  console.log("[UserAccessPage] Fetching users with permissions...");
  const response = await fetch("/api/admin/permissions");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch users");
  }

  const data = await response.json();
  console.log("[UserAccessPage] Fetched users:", data.users.length);
  return data.users;
}

// Update permissions
async function updatePermissions(data: UpdatePermissionsRequest) {
  console.log("[UserAccessPage] Updating permissions for user:", data.userId);
  const response = await fetch("/api/admin/permissions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update permissions");
  }

  return response.json();
}

export function UserAccessPage() {
  const queryClient = useQueryClient();

  // State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<ModulePermission[]>(DEFAULT_PERMISSIONS);
  const [originalPermissions, setOriginalPermissions] = useState<ModulePermission[]>(DEFAULT_PERMISSIONS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["admin", "permissions", "users"],
    queryFn: fetchUsersWithPermissions,
  });

  // Mutation for saving permissions
  const saveMutation = useMutation({
    mutationFn: updatePermissions,
    onSuccess: () => {
      console.log("[UserAccessPage] Permissions saved successfully");
      // Update original permissions to match local
      setOriginalPermissions([...localPermissions]);
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions", "users"] });
      // Show success state
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      toast.success("Permissions saved", {
        description: `Changes for ${selectedUser?.name} applied`,
      });
    },
    onError: (error: Error) => {
      console.error("[UserAccessPage] Failed to save permissions:", error);
      toast.error("Error saving", {
        description: error.message,
      });
    },
  });

  // Selected user
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  // When user is selected, load their permissions
  useEffect(() => {
    if (selectedUser) {
      console.log("[UserAccessPage] Loading permissions for user:", selectedUser.name);
      const userPermissions = selectedUser.permissions || [];

      // Build permissions state from user's stored permissions
      const perms: ModulePermission[] = DEFAULT_PERMISSIONS.map((defaultPerm) => {
        const userPerm = userPermissions.find((p) => p.module === defaultPerm.module);
        if (userPerm) {
          return {
            module: defaultPerm.module,
            myLevel: userPerm.myLevel as PermissionLevel,
            allLevel: userPerm.allLevel as PermissionLevel,
          };
        }
        return defaultPerm;
      });

      setLocalPermissions(perms);
      setOriginalPermissions(perms);
    }
  }, [selectedUser]);

  // Handle permission change
  const handlePermissionChange = useCallback(
    (module: ModuleType, scope: "my" | "all", level: PermissionLevel) => {
      console.log(`[UserAccessPage] Permission change: ${module} ${scope} -> ${level}`);
      setLocalPermissions((prev) =>
        prev.map((p) =>
          p.module === module
            ? {
                ...p,
                [scope === "my" ? "myLevel" : "allLevel"]: level,
              }
            : p
        )
      );
    },
    []
  );

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return localPermissions.some((local, index) => {
      const original = originalPermissions[index];
      return local.myLevel !== original.myLevel || local.allLevel !== original.allLevel;
    });
  }, [localPermissions, originalPermissions]);

  // Count changes
  const changesCount = useMemo(() => {
    return localPermissions.reduce((count, local, index) => {
      const original = originalPermissions[index];
      let changes = 0;
      if (local.myLevel !== original.myLevel) changes++;
      if (local.allLevel !== original.allLevel) changes++;
      return count + changes;
    }, 0);
  }, [localPermissions, originalPermissions]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!selectedUserId) return;

    saveMutation.mutate({
      userId: selectedUserId,
      permissions: localPermissions,
    });
  }, [selectedUserId, localPermissions, saveMutation]);

  // Handle reset
  const handleReset = useCallback(() => {
    setLocalPermissions([...originalPermissions]);
  }, [originalPermissions]);

  // Handle user selection
  const handleSelectUser = useCallback((userId: string) => {
    // If there are unsaved changes, ask for confirmation
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to switch to another user?"
      );
      if (!confirmed) return;
    }
    setSelectedUserId(userId);
  }, [hasChanges]);

  // Show error toast if users failed to load
  useEffect(() => {
    if (usersError) {
      toast.error("Error loading", {
        description: (usersError as Error).message,
      });
    }
  }, [usersError]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-20">
        {/* Page header */}
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Access Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure access permissions for each user
                </p>
              </div>
            </div>

            {/* Unsaved indicator in header */}
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm text-amber-600 font-medium">
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* User list panel */}
            <UserListPanel
              users={users}
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
              isLoading={isLoadingUsers}
            />

            {/* Permissions table */}
            <PermissionsTable
              user={selectedUser}
              permissions={localPermissions}
              onChange={handlePermissionChange}
              isLoading={isLoadingUsers}
            />
          </div>
        </div>

        {/* Action bar */}
        <ActionBar
          hasChanges={hasChanges}
          changesCount={changesCount}
          isSaving={saveMutation.isPending}
          saveSuccess={saveSuccess}
          onSave={handleSave}
          onReset={handleReset}
        />
      </div>
    </TooltipProvider>
  );
}
