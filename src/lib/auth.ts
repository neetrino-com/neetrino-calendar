import { cookies } from "next/headers";
import { db } from "./db";
import type { User } from "@prisma/client";

const AUTH_COOKIE_NAME = "calendar_auth_user_id";

/**
 * Get current user from cookie (simplified auth for demo)
 * In production, use proper authentication (NextAuth, Clerk, etc.)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!userId) {
      // No cookie = not logged in
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    return user;
  } catch (error) {
    console.error("[AUTH] Error getting current user:", error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === "ADMIN";
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: No user found");
  }

  if (!isAdmin(user)) {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}

/**
 * Require any authenticated user
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: No user found");
  }

  return user;
}
