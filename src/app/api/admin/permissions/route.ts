import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

// Validation schema for updating permissions
const updatePermissionsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  permissions: z.array(
    z.object({
      module: z.enum(["meetings", "deadlines", "schedule"]),
      myLevel: z.enum(["NONE", "VIEW", "EDIT"]),
      allLevel: z.enum(["NONE", "VIEW", "EDIT"]),
    })
  ),
});

/**
 * GET /api/admin/permissions - Get all users with their permissions
 * Only accessible by ADMIN users
 */
export async function GET() {
  try {
    console.log("[API] GET /api/admin/permissions");

    // Verify admin access
    await requireAdmin();

    // Get all users with their permissions
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`[API] Found ${users.length} users with permissions`);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[API] Error fetching permissions:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/permissions - Update permissions for a user
 * Only accessible by ADMIN users
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("[API] PUT /api/admin/permissions");

    // Verify admin access
    await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePermissionsSchema.parse(body);

    console.log(`[API] Updating permissions for user: ${validatedData.userId}`);
    console.log(`[API] Permissions data:`, JSON.stringify(validatedData.permissions, null, 2));

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      console.log(`[API] User not found: ${validatedData.userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update permissions using upsert for each module
    const updatedPermissions = await Promise.all(
      validatedData.permissions.map(async (perm) => {
        return db.userPermission.upsert({
          where: {
            userId_module: {
              userId: validatedData.userId,
              module: perm.module,
            },
          },
          update: {
            myLevel: perm.myLevel,
            allLevel: perm.allLevel,
          },
          create: {
            userId: validatedData.userId,
            module: perm.module,
            myLevel: perm.myLevel,
            allLevel: perm.allLevel,
          },
        });
      })
    );

    console.log(`[API] Successfully updated ${updatedPermissions.length} permissions`);

    return NextResponse.json({
      message: "Permissions updated successfully",
      permissions: updatedPermissions,
    });
  } catch (error) {
    console.error("[API] Error updating permissions:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
