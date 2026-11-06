import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getServerClient } from "@/lib/db/server";

export type StaffRole = "admin" | "staff";

export type StaffInfo = {
  userId: string;
  role: StaffRole;
};

// Returns the logged-in user's staff info, or null if the user
// is not logged in or is not in the staff_profiles table.
export async function getStaff(): Promise<StaffInfo | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("role")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[staff] could not read staff_profiles:", error.message);
    return null;
  }

  if (!data) return null;
  if (data.role !== "admin" && data.role !== "staff") return null;

  return { userId, role: data.role };
}