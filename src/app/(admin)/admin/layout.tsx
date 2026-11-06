import { Suspense } from "react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { getStaff } from "@/lib/auth/staff";
import { AdminShell } from "@/components/admin/admin-shell";

// Checks the role. Reads the logged-in user, so it must be inside <Suspense>.
async function AdminGate({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();

  if (!staff) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">No access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is not on the staff list. Please ask an admin to add
          you.
        </p>
        <div className="mt-6 flex items-center gap-4 text-sm">
          <Link href="/" className="underline">
            Back to the website
          </Link>
          <SignOutButton redirectUrl="/">
            <button type="button" className="underline">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </main>
    );
  }

  return <AdminShell role={staff.role}>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading...</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}