"use client";

import { useState, useTransition } from "react";
import { updateOpeningHoursAction } from "@/app/(admin)/admin/settings/hours-actions";
import type { OpeningHoursRow } from "@/lib/db/admin-hours";
import { DAY_NAMES, DISPLAY_ORDER } from "@/lib/validation/admin-hours";

const timeClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-40";

export function OpeningHoursForm({ rows }: { rows: OpeningHoursRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [days, setDays] = useState<OpeningHoursRow[]>(rows);

  function change(weekday: number, patch: Partial<OpeningHoursRow>) {
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday ? { ...day, ...patch } : day,
      ),
    );
  }

  function toggleClosed(day: OpeningHoursRow, closed: boolean) {
    if (closed) {
      change(day.weekday, { isClosed: true });
      return;
    }
    // Opening a day: if there are no times yet, start with 09:00 to 21:00.
    change(day.weekday, {
      isClosed: false,
      openTime: day.openTime || "09:00",
      closeTime: day.closeTime || "21:00",
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await updateOpeningHoursAction(
          days.map((day) => ({
            weekday: day.weekday,
            isClosed: day.isClosed,
            openTime: day.openTime,
            closeTime: day.closeTime,
          })),
        );
        setMessage(
          result.ok
            ? { ok: true, text: "Saved." }
            : { ok: false, text: result.message },
        );
      } catch (err) {
        console.error("[admin] save opening hours failed:", err);
        setMessage({
          ok: false,
          text: "Something went wrong. Please try again.",
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <h2 className="text-lg font-semibold">Opening hours</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Times are in the restaurant time zone. A day closes on the same day.
        Old bookings are not changed.
      </p>

      <ul className="mt-4 divide-y divide-border">
        {DISPLAY_ORDER.map((weekday) => {
          const day = days.find((d) => d.weekday === weekday);
          if (!day) return null;

          return (
            <li
              key={weekday}
              className="grid items-center gap-3 py-3 sm:grid-cols-[8rem_7rem_1fr_1fr]"
            >
              <p className="font-medium">{DAY_NAMES[weekday]}</p>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={day.isClosed}
                  onChange={(e) => toggleClosed(day, e.target.checked)}
                  className="size-4"
                />
                Closed
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">
                  Open
                </span>
                <input
                  type="time"
                  step={900}
                  value={day.openTime}
                  disabled={day.isClosed}
                  onChange={(e) =>
                    change(weekday, { openTime: e.target.value })
                  }
                  className={timeClass}
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">
                  Close
                </span>
                <input
                  type="time"
                  step={900}
                  value={day.closeTime}
                  disabled={day.isClosed}
                  onChange={(e) =>
                    change(weekday, { closeTime: e.target.value })
                  }
                  className={timeClass}
                />
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save opening hours"}
        </button>
        {message ? (
          <p
            className={
              message.ok ? "text-sm text-foreground" : "text-sm text-destructive"
            }
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}