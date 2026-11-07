import type { NeedsAttentionBooking } from "@/lib/db/admin-bookings";
import { formatDate, formatTime } from "@/lib/time/format";
import { BookingActions } from "@/app/(admin)/admin/booking-actions";
import { BookingStatusBadge } from "./booking-status-badge";

function reasonText(booking: NeedsAttentionBooking) {
  if (booking.reason === "upcoming_pending") {
    return "Waiting for your answer. Please confirm or cancel.";
  }
  if (booking.status === "pending") {
    return "This day is over and nobody answered. Please cancel it.";
  }
  if (booking.status === "confirmed") {
    return "This day is over. Did the guest come? Mark it as no-show, or seat and complete it.";
  }
  return "This day is over. Please mark it as completed.";
}

export function NeedsAttention({
  bookings,
}: {
  bookings: NeedsAttentionBooking[];
}) {
  if (bookings.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-gold bg-gold/10 p-4">
      <h2 className="text-lg font-semibold">
        Needs attention ({bookings.length})
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        These bookings are not finished. Old open bookings can block a table.
      </p>

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
              <p className="mt-1 text-sm">{reasonText(b)}</p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <BookingStatusBadge status={b.status} />
              <BookingActions bookingId={b.id} status={b.status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}