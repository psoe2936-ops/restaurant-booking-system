"use client";

import { useState, useTransition } from "react";
import { updateSettingsAction } from "@/app/(admin)/admin/settings/actions";
import type { RestaurantSettingsRow } from "@/lib/db/admin-settings";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm";

export function SettingsForm({
  settings,
}: {
  settings: RestaurantSettingsRow;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [address, setAddress] = useState(settings.address ?? "");
  const [slotLengthMin, setSlotLengthMin] = useState(
    String(settings.slotLengthMin),
  );
  const [slotIntervalMin, setSlotIntervalMin] = useState(
    String(settings.slotIntervalMin),
  );
  const [maxPartySize, setMaxPartySize] = useState(
    String(settings.maxPartySize),
  );
  const [bookingWindowDays, setBookingWindowDays] = useState(
    String(settings.bookingWindowDays),
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await updateSettingsAction({
          name,
          phone,
          address,
          slotLengthMin: Number(slotLengthMin),
          slotIntervalMin: Number(slotIntervalMin),
          maxPartySize: Number(maxPartySize),
          bookingWindowDays: Number(bookingWindowDays),
        });
        setMessage(
          result.ok
            ? { ok: true, text: "Saved." }
            : { ok: false, text: result.message },
        );
      } catch (err) {
        console.error("[admin] save settings failed:", err);
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
      className="mt-6 space-y-8 rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <section>
        <h2 className="text-lg font-semibold">Restaurant info</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              className={fieldClass}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Phone</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              className={fieldClass}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={200}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Booking rules</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A change here affects new bookings only. Old bookings keep their
          times.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              Slot length (minutes, 30 to 240)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={30}
              max={240}
              value={slotLengthMin}
              onChange={(e) => setSlotLengthMin(e.target.value)}
              className={fieldClass}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              How long one booking holds a table.
            </span>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              Slot interval (minutes, 15 to 120)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={15}
              max={120}
              value={slotIntervalMin}
              onChange={(e) => setSlotIntervalMin(e.target.value)}
              className={fieldClass}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              A new time starts every this many minutes.
            </span>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              Max party size (1 to 50)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={maxPartySize}
              onChange={(e) => setMaxPartySize(e.target.value)}
              className={fieldClass}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Check that you have a table big enough for this number.
            </span>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">
              Booking window (days, 1 to 90)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              value={bookingWindowDays}
              onChange={(e) => setBookingWindowDays(e.target.value)}
              className={fieldClass}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              How many days ahead a guest can book.
            </span>
          </label>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Time zone: {settings.timezone} (cannot be changed here).
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save settings"}
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