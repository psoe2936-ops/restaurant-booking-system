import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { SITE } from "@/lib/site";
import type { StaffRole } from "@/lib/auth/staff";
import { AdminSidebarLinks, AdminTabBar } from "./admin-nav";

export function AdminShell({
  role,
  children,
}: {
  role: StaffRole;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
        <div>
          <p className="font-heading text-lg font-semibold">{SITE.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
        </div>

        <div className="mt-6 flex-1">
          <AdminSidebarLinks />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View website
          </Link>
          <UserButton />
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
        <p className="font-heading text-lg font-semibold">{SITE.name}</p>
        <UserButton />
      </header>

      <main className="p-4 pb-24 md:p-8">{children}</main>

      {/* Phone bottom tabs */}
      <AdminTabBar />
    </div>
  );
}