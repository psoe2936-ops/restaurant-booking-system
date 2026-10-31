"use client";

import { useRef, useState, useTransition } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { createBookingAction, getSlotsAction } from "./actions";
import { formatDate, formatTime } from "@/lib/time/format";
import type { BookingResult } from "@/lib/db/bookings";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-base";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Step = 1 | 2 | 3 | 4 | 5;

export function BookingWizard({
  minDate,
  maxDate,
}: {
  minDate: string;
  maxDate: string;
}) {
  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isPending, startTransition] = useTransition();
  const turnstileRef = useRef<TurnstileInstance>(null);

  const dateOk = date >= minDate && date <= maxDate;

  function loadSlots() {
    setError("");
    setSlot("");
    startTransition(async () => {
      const result = await getSlotsAction(date, partySize);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSlots(result.slots);
      setStep(2);
    });
  }

  function submitBooking() {
    setError("");
    startTransition(async () => {
      const result = await createBookingAction(
        {
          guestName,
          phone,
          email,
          partySize,
          startsAt: slot,
          notes,
        },
        captchaToken
      );
      if (result.ok) {
        setBooking(result.booking);
        setStep(5);
        return;
      }
      setError(result.message);
      // A token can be used only once. Get a new one.
      setCaptchaToken("");
      turnstileRef.current?.reset();
      if (result.reason === "no_table_available") {
        // The time was taken. Load new free times.
        const fresh = await getSlotsAction(date, partySize);
        if (fresh.ok) setSlots(fresh.slots);
        setSlot("");
        setStep(2);
      }
    });
  }

  if (step === 5 && booking) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">We got your request!</h2>
        <p className="mt-2 text-muted-foreground">
          We will confirm your table soon.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">Your booking code</p>
        <p className="text-3xl font-bold tracking-wider">{booking.code}</p>
        <p className="mt-4">
          {formatDate(booking.starts_at)} at {formatTime(booking.starts_at)}
          <br />
          {partySize} {partySize === 1 ? "guest" : "guests"}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Please save your code.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">Step {step} of 4</p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold">Date and guests</h2>
          <label className="block">
            Date
            <input
              type="date"
              className={inputClass}
              value={date}
              min={minDate}
              max={maxDate}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="mt-1 block text-sm text-muted-foreground">
              You can book until {formatDate(`${maxDate}T12:00:00+06:30`)}.
            </span>
          </label>
          <label className="block">
            Number of guests
            <select
              className={inputClass}
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={loadSlots} disabled={!dateOk || isPending}>
            {isPending ? "Loading..." : "See free times"}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold">Choose a time</h2>
          {slots.length === 0 ? (
            <p className="text-muted-foreground">
              No free times on this day. Please go back and choose another day.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={slot === s ? "default" : "outline"}
                  onClick={() => setSlot(s)}
                >
                  {formatTime(s)}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!slot}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold">Your details</h2>
          <label className="block">
            Name
            <input
              className={inputClass}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="block">
            Phone
            <input
              className={inputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          <label className="block">
            Email (optional)
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block">
            Notes (optional)
            <textarea
              className={inputClass}
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              onClick={() => {
                setError("");
                setStep(4);
              }}
              disabled={!guestName.trim() || !phone.trim()}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold">Check and confirm</h2>
          <dl className="space-y-1">
            <div>
              <dt className="text-sm text-muted-foreground">When</dt>
              <dd>
                {formatDate(slot)} at {formatTime(slot)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Guests</dt>
              <dd>{partySize}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd>{guestName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd>{phone}</dd>
            </div>
            {email && (
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd>{email}</dd>
              </div>
            )}
            {notes && (
              <div>
                <dt className="text-sm text-muted-foreground">Notes</dt>
                <dd>{notes}</dd>
              </div>
            )}
          </dl>

          {TURNSTILE_SITE_KEY ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          ) : (
            <p role="alert" className="text-sm text-destructive">
              Spam check is not set up. Please try again later.
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              onClick={submitBooking}
              disabled={isPending || !captchaToken}
            >
              {isPending ? "Booking..." : "Book my table"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}