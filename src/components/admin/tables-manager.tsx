"use client";

import { useState, useTransition } from "react";
import {
  addTableAction,
  changeTableSeatsAction,
  setTableActiveAction,
} from "@/app/(admin)/admin/tables/actions";
import type { AdminTable, TablesWarningData } from "@/lib/db/admin-tables";

type Message = { ok: boolean; text: string } | null;

export function TablesManager({
  initialTables,
  warningData,
}: {
  initialTables: AdminTable[];
  warningData: TablesWarningData;
}) {
  const [tables, setTables] = useState(initialTables);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState("2");

  function showError(text: string) {
    setMessage({ ok: false, text });
  }

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await addTableAction({ label, capacity: Number(capacity) });
        if (!result.ok) {
          showError(result.message);
          return;
        }
        setLabel("");
        setCapacity("2");
        setMessage({ ok: true, text: "Table added." });
        window.location.reload();
      } catch (err) {
        console.error("[admin] add table failed:", err);
        showError("Something went wrong. Please try again.");
      }
    });
  }

  function handleCapacityChange(table: AdminTable, value: string) {
    const nextCapacity = Number(value);
    if (!Number.isInteger(nextCapacity) || nextCapacity < 1 || nextCapacity > 50) {
      showError("Seats must be a whole number from 1 to 50.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await changeTableSeatsAction({
          tableId: table.id,
          capacity: nextCapacity,
        });
        if (!result.ok) {
          showError(result.message);
          return;
        }
        setTables((current) =>
          current.map((item) =>
            item.id === table.id ? { ...item, capacity: nextCapacity } : item,
          ),
        );
        if (result.biggestPartySize && nextCapacity < result.biggestPartySize) {
          setMessage({
            ok: false,
            text: `This table has an open future booking for ${result.biggestPartySize} guests. Its new seat count is lower than that party size.`,
          });
        } else {
          setMessage({ ok: true, text: "Table seats updated." });
        }
      } catch (err) {
        console.error("[admin] change table seats failed:", err);
        showError("Something went wrong. Please try again.");
      }
    });
  }

  function handleToggle(table: AdminTable) {
    const nextActive = !table.isActive;
    if (
      !nextActive &&
      !window.confirm(
        `Turn off ${table.label}? Its bookings are NOT cancelled or moved. Staff must call those guests.`,
      )
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setTableActiveAction({
          tableId: table.id,
          isActive: nextActive,
        });
        if (!result.ok) {
          showError(result.message);
          return;
        }
        setTables((current) =>
          current.map((item) =>
            item.id === table.id ? { ...item, isActive: nextActive } : item,
          ),
        );
        if (!nextActive && (result.warningCount ?? 0) > 0) {
          setMessage({
            ok: false,
            text: `${result.warningCount} open future booking(s) remain on this table. They are NOT cancelled or moved. Staff must call those guests.`,
          });
        } else {
          setMessage({ ok: true, text: `Table turned ${nextActive ? "on" : "off"}.` });
        }
      } catch (err) {
        console.error("[admin] change table status failed:", err);
        showError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Dining tables</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Labels cannot be changed after a table is created.
      </p>

      {warningData.biggestActiveTableCapacity < warningData.maxPartySize ? (
        <div className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          The biggest active table has {warningData.biggestActiveTableCapacity}{" "}
          seats, but the restaurant allows bookings for up to{" "}
          {warningData.maxPartySize} guests. Some party sizes may not fit.
        </div>
      ) : null}

      <form
        onSubmit={handleAdd}
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_9rem_auto]"
      >
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">
            Table label
          </span>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={20}
            required
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            placeholder="T1"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Seats</span>
          <input
            type="number"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            min={1}
            max={50}
            step={1}
            required
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="h-11 self-end rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Add table"}
        </button>
      </form>

      {tables.length > 0 ? (
        <ul className="mt-6 divide-y divide-border">
          {tables.map((table) => (
            <li
              key={table.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium">{table.label}</p>
                <p className="text-sm text-muted-foreground">
                  {table.capacity} {table.capacity === 1 ? "seat" : "seats"} ·{" "}
                  {table.isActive ? "On" : "Off"} ·{" "}
                  {table.openFutureBookingCount} open future{" "}
                  {table.openFutureBookingCount === 1 ? "booking" : "bookings"}
                </p>
                {table.biggestOpenFuturePartySize > table.capacity ? (
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    This table has an open future booking for{" "}
                    {table.biggestOpenFuturePartySize} guests, more than its{" "}
                    {table.capacity} seats.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">
                  Seats
                  <input
                    type="number"
                    defaultValue={table.capacity}
                    min={1}
                    max={50}
                    step={1}
                    disabled={isPending}
                    onBlur={(event) =>
                      event.currentTarget.value !== String(table.capacity) &&
                      handleCapacityChange(table, event.currentTarget.value)
                    }
                    className="ml-2 h-10 w-20 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
                    aria-label={`Seats for ${table.label}`}
                  />
                </label>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(table)}
                  className="h-10 rounded-full border border-border px-4 text-sm hover:bg-muted disabled:opacity-50"
                >
                  Turn {table.isActive ? "off" : "on"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">No tables yet.</p>
      )}

      {message ? (
        <p
          role="status"
          className={
            message.ok
              ? "mt-4 text-sm text-foreground"
              : "mt-4 text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
