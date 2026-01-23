"use client";

import { useQuery } from "@tanstack/react-query";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch("/api/auth/me");

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
