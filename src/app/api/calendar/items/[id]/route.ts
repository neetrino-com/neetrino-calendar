import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { UpdateCalendarItemSchema } from "@/lib/validations/calendar";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/calendar/items/:id - Update a calendar item (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log(`[API] PATCH /api/calendar/items/${id}`);

    await requireAdmin();

    // Check if item exists
    const existingItem = await db.calendarItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Calendar item not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const validatedBody = UpdateCalendarItemSchema.safeParse(body);
    if (!validatedBody.success) {
      console.error("[API] Validation error:", validatedBody.error);
      return NextResponse.json(
        { error: "Invalid request body", details: validatedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { participants, ...itemData } = validatedBody.data;

    // Update calendar item
    const item = await db.calendarItem.update({
      where: { id },
      data: {
        ...itemData,
        startAt: itemData.startAt ? new Date(itemData.startAt) : undefined,
        endAt: itemData.endAt !== undefined ? (itemData.endAt ? new Date(itemData.endAt) : null) : undefined,
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

    // Update participants if provided
    if (participants) {
      // Delete existing participants
      await db.calendarItemParticipant.deleteMany({
        where: { itemId: id },
      });

      // Create new participants
      if (participants.length > 0) {
        await db.calendarItemParticipant.createMany({
          data: participants.map((p) => ({
            itemId: id,
            userId: p.userId,
            role: p.role,
            rsvp: p.rsvp,
          })),
        });
      }

      // Refetch item with updated participants
      const updatedItem = await db.calendarItem.findUnique({
        where: { id },
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

      console.log(`[API] Updated calendar item: ${id}`);
      return NextResponse.json({ item: updatedItem });
    }

    console.log(`[API] Updated calendar item: ${id}`);

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[API] Error updating calendar item:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to update calendar item" }, { status: 500 });
  }
}

/**
 * DELETE /api/calendar/items/:id - Delete a calendar item (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log(`[API] DELETE /api/calendar/items/${id}`);

    await requireAdmin();

    // Check if item exists
    const existingItem = await db.calendarItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Calendar item not found" }, { status: 404 });
    }

    // Delete calendar item (participants will be deleted due to onDelete: Cascade)
    await db.calendarItem.delete({
      where: { id },
    });

    console.log(`[API] Deleted calendar item: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting calendar item:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to delete calendar item" }, { status: 500 });
  }
}
