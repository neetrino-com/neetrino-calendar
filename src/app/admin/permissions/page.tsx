import { UserAccessPage } from "@/features/admin";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

// Force dynamic rendering - this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default async function AdminPermissionsPage() {
  try {
    // Check if user is admin
    await requireAdmin();
    return <UserAccessPage />;
  } catch (error) {
    // If not admin or error, redirect to meetings
    redirect("/meetings");
  }
}
