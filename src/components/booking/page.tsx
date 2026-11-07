import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { searchBookings } from "@/lib/db/admin-bookings";
import { parseBookingFilters } from "@/lib/validation/admin-bookings";
import { formatDate, formatTime } from "@/lib/time/format";
import { BookingActions } from "@/components/admin/booking-actions";
import { BookingFiltersForm } from "@/components/admin/booking-filters";
import { BookingPagination } from "@/components/admin/booking-pagination";
import { BookingStatusBadge } from "@/components/admin/booking-status-badge";

type RawSearchParams = Record<string, string | string[] | undefined>;

async function BookingsContent({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await connection(); // "today" changes with time, so this page is not cached

  const filters = parseBookingFilters(await searchParams);
  const result = await searchBookings(filters);

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="mt-2 text-sm text-destructive">
          We could not load the bookings. Please refresh the page.
        </p>
      </div>
    );
  }

  const { bookings, total, page, pageSize, scope } = result;

  let scopeText = "Showing bookings from today onward, oldest first.";
  if (scope === "day" && filters.date) {
    scopeText = `Showing bookings on ${formatDate(`${filters.date}T12:00:00+06:30`)}.`;
  } else if (scope === "all") {
    scopeText = "Showing bookings from all dates, newest first.";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">{scopeText}</p>

      <BookingFiltersForm filters={filters} />

      <p className="mt-4 text-sm text-muted-foreground">
        {total} {total === 1 ? "booking" : "bookings"} found
      </p>

      {bookings.length === 0 ? (
        <div className="mt-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm">No bookings found.</p>
          {page > 1 ? (
            <Link
              href="/admin/bookings"
              className="mt-2 inline-block text-sm underline"
            >
              Go back to the first page
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">
                  {formatDate(b.starts_at)}, {formatTime(b.starts_at)} ·{" "}
                  {b.guest_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {b.party_size} {b.party_size === 1 ? "guest" : "guests"} ·
                  Table {b.table_label ?? "?"} · {b.phone} · {b.code}
                </p>
                {b.notes ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Note: {b.notes}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <BookingStatusBadge status={b.status} />
                <BookingActions bookingId={b.id} status={b.status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <BookingPagination
        filters={filters}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}

export default function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading...</p>}>
      <BookingsContent searchParams={searchParams} />
    </Suspense>
  );
}