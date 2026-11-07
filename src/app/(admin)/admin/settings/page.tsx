import { Suspense } from "react";
import { getAdmin } from "@/lib/auth/staff";
import { AdminOnlyMessage } from "@/components/admin/admin-only-message";

async function SettingsContent() {
  const admin = await getAdmin();
  if (!admin) return <AdminOnlyMessage />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Coming soon.</p>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading...</p>}>
      <SettingsContent />
    </Suspense>
  );
}