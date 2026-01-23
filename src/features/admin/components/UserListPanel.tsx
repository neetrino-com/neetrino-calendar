"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserCard } from "./UserCard";
import type { UserWithPermissions } from "../types";

interface UserListPanelProps {
  users: UserWithPermissions[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  isLoading: boolean;
}

export function UserListPanel({
  users,
  selectedUserId,
  onSelectUser,
  isLoading,
}: UserListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const clearSearch = () => setSearchQuery("");

  return (
    <div className="w-full lg:w-[280px] shrink-0 flex flex-col">
      {/* Section header */}
      <div className="mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Users
        </h3>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] space-y-1 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          // No users found
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No users found" : "No users"}
            </p>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search
              </p>
            )}
          </div>
        ) : (
          // User cards
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUserId === user.id}
              onClick={() => onSelectUser(user.id)}
            />
          ))
        )}
      </div>

      {/* User count */}
      {!isLoading && users.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {filteredUsers.length === users.length
              ? `${users.length} users`
              : `Showing ${filteredUsers.length} of ${users.length}`}
          </p>
        </div>
      )}
    </div>
  );
}
