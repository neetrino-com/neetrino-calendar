import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/users - Get all users (for select dropdowns)
 */
export async function GET() {
  try {
    console.log("[API] GET /api/users");

    await requireAuth();

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`[API] Found ${users.length} users`);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[API] Error fetching users:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
