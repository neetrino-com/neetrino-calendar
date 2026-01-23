import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { CreateCalendarItemSchema, GetCalendarItemsSchema } from "@/lib/validations/calendar";

/**
 * GET /api/calendar/items - Get calendar items with filters
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API] GET /api/calendar/items");

    await requireAuth();

    const { searchParams } = new URL(request.url);
    const query = {
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    // Validate query params
    const validatedQuery = GetCalendarItemsSchema.safeParse(query);
    if (!validatedQuery.success) {
      console.error("[API] Validation error:", validatedQuery.error);
      return NextResponse.json(
        { error: "Invalid query parameters", details: validatedQuery.error.flatten() },
        { status: 400 }
      );
    }

    const { from, to, type, status, search } = validatedQuery.data;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) where.startAt.lte = new Date(to);
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      // For SQLite, use contains (case-sensitive)
      // Note: SQLite doesn't support mode: "insensitive", so search is case-sensitive
      where.title = {
        contains: search,
      };
    }

    const items = await db.calendarItem.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startAt: "asc",
      },
    });

    console.log(`[API] Found ${items.length} calendar items`);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[API] Error fetching calendar items:", error);
    console.error("[API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch calendar items",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/items - Create a new calendar item (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/calendar/items");

    const user = await requireAdmin();

    const body = await request.json();

    // Validate request body
    const validatedBody = CreateCalendarItemSchema.safeParse(body);
    if (!validatedBody.success) {
      console.error("[API] Validation error:", validatedBody.error);
      return NextResponse.json(
        { error: "Invalid request body", details: validatedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { participants, ...itemData } = validatedBody.data;

    // Create calendar item
    const item = await db.calendarItem.create({
      data: {
        ...itemData,
        startAt: new Date(itemData.startAt),
        endAt: itemData.endAt ? new Date(itemData.endAt) : null,
        createdById: user.id,
        participants: participants
          ? {
              create: participants.map((p) => ({
                userId: p.userId,
                role: p.role,
              })),
            }
          : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`[API] Created calendar item: ${item.id}`);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating calendar item:", error);
    console.error("[API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create calendar item",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
