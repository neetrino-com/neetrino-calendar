import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth/logout - Logout user
 */
export async function POST() {
  try {
    console.log("[API] POST /api/auth/logout");

    const cookieStore = await cookies();
    cookieStore.delete("calendar_auth_user_id");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error logging out:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
