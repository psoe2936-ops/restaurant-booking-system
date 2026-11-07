import Link from "next/link";
import type { BookingFilters } from "@/lib/validation/admin-bookings";

function buildHref(filters: BookingFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

const linkClass =
  "inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted";
const disabledClass =
  "inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium opacity-40";

export function BookingPagination({
  filters,
  page,
  pageSize,
  total,
}: {
  filters: BookingFilters;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pages"
      className="mt-4 flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link href={buildHref(filters, page - 1)} className={linkClass}>
          Previous
        </Link>
      ) : (
        <span className={disabledClass}>Previous</span>
      )}

      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>

      {page < totalPages ? (
        <Link href={buildHref(filters, page + 1)} className={linkClass}>
          Next
        </Link>
      ) : (
        <span className={disabledClass}>Next</span>
      )}
    </nav>
  );
}