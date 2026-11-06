"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Left sidebar links (desktop)
export function AdminSidebarLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Bottom tab bar (phone)
export function AdminTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background md:hidden">
      {ADMIN_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex h-14 items-center justify-center text-xs font-semibold text-primary"
                : "flex h-14 items-center justify-center text-xs font-medium text-muted-foreground"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}