import { Suspense } from "react";
import { connection } from "next/server";
import { getAdmin } from "@/lib/auth/staff";
import { getRestaurantSettings } from "@/lib/db/admin-settings";
import { AdminOnlyMessage } from "@/components/admin/admin-only-message";
import { SettingsForm } from "@/components/admin/settings-form";

async function SettingsContent() {
  await connection();

  const admin = await getAdmin();
  if (!admin) return <AdminOnlyMessage />;

  const result = await getRestaurantSettings();

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-destructive">
          We could not load the settings. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Only admins can see and change this page.
      </p>
      <SettingsForm settings={result.settings} />
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