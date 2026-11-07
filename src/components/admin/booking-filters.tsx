import Link from "next/link";
import type { BookingFilters } from "@/lib/validation/admin-bookings";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm";

export function BookingFiltersForm({ filters }: { filters: BookingFilters }) {
  const hasFilters = Boolean(filters.date || filters.status || filters.q);

  return (
    <form
      method="get"
      action="/admin/bookings"
      key={`${filters.date}|${filters.status}|${filters.q}`}
      className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Date</span>
        <input
          type="date"
          name="date"
          defaultValue={filters.date ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-muted-foreground">Status</span>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className={fieldClass}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm sm:col-span-2 lg:col-span-1">
        <span className="mb-1 block text-muted-foreground">
          Name, phone or code
        </span>
        <input
          type="search"
          name="q"
          maxLength={50}
          defaultValue={filters.q}
          placeholder="Search..."
          className={fieldClass}
        />
      </label>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
        {hasFilters ? (
          <Link
            href="/admin/bookings"
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}