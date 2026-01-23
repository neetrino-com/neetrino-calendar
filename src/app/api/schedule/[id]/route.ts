import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { UpdateScheduleEntrySchema } from "@/lib/validations/schedule";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/schedule/:id - Update a schedule entry (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log(`[API] PATCH /api/schedule/${id}`);

    await requireAdmin();

    // Check if entry exists
    const existingEntry = await db.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const validatedBody = UpdateScheduleEntrySchema.safeParse(body);
    if (!validatedBody.success) {
      console.error("[API] Validation error:", validatedBody.error);
      return NextResponse.json(
        { error: "Invalid request body", details: validatedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { date, userId, startTime, endTime, note } = validatedBody.data;

    // If date or userId changed, check for conflicts
    if (date || userId) {
      const newDate = date ? new Date(date) : existingEntry.date;
      newDate.setHours(0, 0, 0, 0);
      const newUserId = userId || existingEntry.userId;

      const startOfDay = new Date(newDate);
      const endOfDay = new Date(newDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const conflictingEntry = await db.scheduleEntry.findFirst({
        where: {
          id: { not: id },
          userId: newUserId,
          date: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      if (conflictingEntry) {
        return NextResponse.json(
          { error: "Schedule entry already exists for this user on this date" },
          { status: 409 }
        );
      }
    }

    // Validate time range if both are provided
    const finalStartTime = startTime !== undefined ? startTime : existingEntry.startTime;
    const finalEndTime = endTime !== undefined ? endTime : existingEntry.endTime;

    if (finalEndTime <= finalStartTime) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Update entry
    const entry = await db.scheduleEntry.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        userId,
        startTime,
        endTime,
        note,
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

    console.log(`[API] Updated schedule entry: ${id}`);

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[API] Error updating schedule entry:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to update schedule entry" }, { status: 500 });
  }
}

/**
 * DELETE /api/schedule/:id - Delete a schedule entry (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log(`[API] DELETE /api/schedule/${id}`);

    await requireAdmin();

    // Check if entry exists
    const existingEntry = await db.scheduleEntry.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 });
    }

    // Delete entry
    await db.scheduleEntry.delete({
      where: { id },
    });

    console.log(`[API] Deleted schedule entry: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting schedule entry:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to delete schedule entry" }, { status: 500 });
  }
}
