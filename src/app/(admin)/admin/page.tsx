import { Suspense } from "react";
import { connection } from "next/server";
import { getTodaysBookings } from "@/lib/db/admin-bookings";
import { formatTime } from "@/lib/time/format";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

function statusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-gold/30 text-foreground";
    case "confirmed":
      return "bg-primary/15 text-primary";
    case "seated":
      return "bg-foreground text-background";
    case "cancelled":
    case "no_show":
      return "bg-muted text-muted-foreground line-through";
    default:
      return "bg-muted text-foreground";
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

async function TodayDashboard() {
  await connection(); // "today" changes with time, so this page is not cached

  const result = await getTodaysBookings();

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-destructive">
          We could not load today&apos;s bookings. Please refresh the page.
        </p>
      </div>
    );
  }

  const { bookings, dateLabel } = result;
  const active = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "no_show",
  );
  const guestCount = active.reduce((sum, b) => sum + b.party_size, 0);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Bookings today" value={active.length} />
        <StatCard label="Guests today" value={guestCount} />
        <StatCard label="Pending" value={pendingCount} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Today&apos;s bookings</h2>

      {bookings.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No bookings today.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 p-4"
            >
              <div>
                <p className="font-medium">
                  {formatTime(b.starts_at)} · {b.guest_name}
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
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(b.status)}`}
              >
                {STATUS_LABELS[b.status] ?? b.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<p className="text-sm">Loading...</p>}>
      <TodayDashboard />
    </Suspense>
  );
}