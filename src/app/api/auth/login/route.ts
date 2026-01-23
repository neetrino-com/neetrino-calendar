import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * POST /api/auth/login - Login user by email
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/auth/login");

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Set cookie with user ID
    const cookieStore = await cookies();
    cookieStore.set("calendar_auth_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log(`[API] User logged in: ${user.email} (${user.role})`);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[API] Error logging in:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
