import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// Explicitly set runtime to nodejs (required for Prisma on Vercel)
export const runtime = "nodejs";

/**
 * GET /api/auth/me - Get current user
 * Security: Rate limited
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, rateLimitConfigs.moderate);
    if (!rateLimitResult) {
      return NextResponse.json(
        { error: "Too Many Requests", message: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      const response = NextResponse.json({ user: null });
      if (rateLimitResult) {
        response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
      }
      return response;
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    if (rateLimitResult) {
      response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
    }

    return response;
  } catch (error) {
    // Log detailed error for debugging
    logger.error("Error getting current user", { 
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error 
    });
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("prisma") || errorMessage.includes("database") || errorMessage.includes("connection")) {
        logger.error("Database connection error in /api/auth/me", { error: error.message });
        return NextResponse.json(
          { 
            user: null,
            error: "DatabaseError",
            message: "Database connection error. If you're on Vercel, the database may need to be initialized. Please call /api/admin/init-db first."
          },
          { status: 500 }
        );
      }
    }
    
    // Return proper error response - always JSON, never HTML
    return NextResponse.json(
      { 
        user: null,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}
