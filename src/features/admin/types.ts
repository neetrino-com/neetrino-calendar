import type { User, UserPermission } from "@prisma/client";

// Permission levels
export type PermissionLevel = "NONE" | "VIEW" | "EDIT";

// Available modules
export type ModuleType = "meetings" | "deadlines" | "schedule";

// Module configuration for UI
export interface ModuleConfig {
  id: ModuleType;
  label: string;
  icon: string; // Lucide icon name
}

export const MODULES: ModuleConfig[] = [
  { id: "meetings", label: "Meetings", icon: "Calendar" },
  { id: "deadlines", label: "Deadlines", icon: "Clock" },
  { id: "schedule", label: "Schedule", icon: "BarChart3" },
];

export const PERMISSION_LEVELS: { value: PermissionLevel; label: string }[] = [
  { value: "VIEW", label: "View" },
  { value: "EDIT", label: "Edit" },
  { value: "NONE", label: "None" },
];

// User with permissions
export interface UserWithPermissions extends Pick<User, "id" | "name" | "email" | "role"> {
  permissions: UserPermission[];
}

// Permission state for a single module
export interface ModulePermission {
  module: ModuleType;
  myLevel: PermissionLevel;
  allLevel: PermissionLevel;
}

// Full permissions state for a user
export interface UserPermissionsState {
  userId: string;
  permissions: ModulePermission[];
}

// API request/response types
export interface UpdatePermissionsRequest {
  userId: string;
  permissions: {
    module: ModuleType;
    myLevel: PermissionLevel;
    allLevel: PermissionLevel;
  }[];
}

export interface PermissionsResponse {
  permissions: UserPermission[];
}
