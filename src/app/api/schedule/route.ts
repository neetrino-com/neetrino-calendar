import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { CreateScheduleEntrySchema, GetScheduleSchema } from "@/lib/validations/schedule";

/**
 * GET /api/schedule - Get schedule entries for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API] GET /api/schedule");

    await requireAuth();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    // Validate query params
    const validatedQuery = GetScheduleSchema.safeParse({ date });
    if (!validatedQuery.success) {
      console.error("[API] Validation error:", validatedQuery.error);
      return NextResponse.json(
        { error: "Invalid date format", details: validatedQuery.error.flatten() },
        { status: 400 }
      );
    }

    // Parse date (set to start of day)
    const queryDate = new Date(validatedQuery.data.date);
    queryDate.setHours(0, 0, 0, 0);

    // Query for entries on that date
    const startOfDay = new Date(queryDate);
    const endOfDay = new Date(queryDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const entries = await db.scheduleEntry.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ startTime: "asc" }, { user: { name: "asc" } }],
    });

    console.log(`[API] Found ${entries.length} schedule entries for ${date}`);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[API] Error fetching schedule:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

/**
 * POST /api/schedule - Create a new schedule entry (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/schedule");

    const user = await requireAdmin();

    const body = await request.json();

    // Validate request body
    const validatedBody = CreateScheduleEntrySchema.safeParse(body);
    if (!validatedBody.success) {
      console.error("[API] Validation error:", validatedBody.error);
      return NextResponse.json(
        { error: "Invalid request body", details: validatedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { date, userId, startTime, endTime, note } = validatedBody.data;

    // Parse date
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    // Check for existing entry (unique constraint: date + userId)
    const startOfDay = new Date(entryDate);
    const endOfDay = new Date(entryDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existingEntry = await db.scheduleEntry.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Schedule entry already exists for this user on this date" },
        { status: 409 }
      );
    }

    // Create schedule entry
    const entry = await db.scheduleEntry.create({
      data: {
        date: entryDate,
        userId,
        startTime,
        endTime,
        note,
        createdById: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`[API] Created schedule entry: ${entry.id}`);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating schedule entry:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to create schedule entry" }, { status: 500 });
  }
}
