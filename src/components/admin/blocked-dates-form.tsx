"use client";

import { useState, useTransition } from "react";
import {
  addBlockedDateAction,
  removeBlockedDateAction,
} from "@/app/(admin)/admin/settings/blocked-dates-actions";
import type { BlockedDate } from "@/lib/db/admin-blocked-dates";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00+06:30`));
}

export function BlockedDatesForm({ dates }: { dates: BlockedDate[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [blockedDates, setBlockedDates] = useState(dates);

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await addBlockedDateAction({ date, reason });
        if (result.ok) {
          setDate("");
          setReason("");
          setMessage({ ok: true, text: "Blocked date saved." });
          window.location.reload();
          return;
        }
        setMessage({ ok: false, text: result.message });
      } catch (err) {
        console.error("[admin] save blocked date failed:", err);
        setMessage({
          ok: false,
          text: "Something went wrong. Please try again.",
        });
      }
    });
  }

  function handleRemove(blockedDate: string) {
    if (!window.confirm(`Remove ${formatDate(blockedDate)} from blocked dates?`)) {
      return;
    }
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await removeBlockedDateAction({ date: blockedDate });
        if (!result.ok) {
          setMessage({ ok: false, text: result.message });
          return;
        }
        setBlockedDates((current) =>
          current.filter((item) => item.date !== blockedDate),
        );
        setMessage({ ok: true, text: "Blocked date removed." });
      } catch (err) {
        console.error("[admin] remove blocked date failed:", err);
        setMessage({
          ok: false,
          text: "Something went wrong. Please try again.",
        });
      }
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Blocked dates</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Guests cannot make new bookings on a blocked date. Existing bookings
        are not cancelled automatically.
      </p>

      <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">
            Reason (optional)
          </span>
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            placeholder="Holiday, private event..."
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="h-11 self-end rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Block date"}
        </button>
      </form>

      {blockedDates.length > 0 ? (
        <ul className="mt-6 divide-y divide-border">
          {blockedDates.map((item) => (
            <li
              key={item.date}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-medium">{formatDate(item.date)}</p>
                {item.reason ? (
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                ) : null}
                {item.openBookingCount > 0 ? (
                  <p className="mt-1 text-sm text-destructive">
                    {item.openBookingCount} open booking
                    {item.openBookingCount === 1 ? "" : "s"} on this date.
                    These bookings are NOT cancelled. Staff must call those
                    guests.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.date)}
                disabled={isPending}
                className="h-10 rounded-full border border-border px-4 text-sm hover:bg-muted disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No blocked dates.
        </p>
      )}

      {message ? (
        <p
          className={
            message.ok ? "mt-4 text-sm text-foreground" : "mt-4 text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
