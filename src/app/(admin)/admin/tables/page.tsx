import { Suspense } from "react";
import { connection } from "next/server";
import { getAdmin } from "@/lib/auth/staff";
import { getAdminTables } from "@/lib/db/admin-tables";
import { AdminOnlyMessage } from "@/components/admin/admin-only-message";
import { TablesManager } from "@/components/admin/tables-manager";

async function TablesContent() {
  await connection();

  const admin = await getAdmin();
  if (!admin) return <AdminOnlyMessage />;

  const result = await getAdminTables();
  if (!result.ok) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Tables</h1>
        <p className="mt-2 text-sm text-destructive">
          We could not load the tables. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Tables</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Only admins can see and change tables.
      </p>
      <TablesManager
        initialTables={result.tables}
        warningData={result.warningData}
      />
    </div>
  );
}

export default function AdminTablesPage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading...</p>}>
      <TablesContent />
    </Suspense>
  );
}
