"use client";

import { useRef, useState, useTransition } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { cancelBookingAction, lookupBookingAction } from "./actions";
import { formatDate, formatTime } from "@/lib/time/format";
import type { BookingStatusInfo } from "@/lib/db/bookings";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-base";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const STATUS_TEXT: Record<string, string> = {
  pending: "Waiting for confirmation",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export function StatusForm() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<BookingStatusInfo | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isPending, startTransition] = useTransition();
  const turnstileRef = useRef<TurnstileInstance>(null);

  // A token works only once, so we get a new one after every action
  function resetCaptcha() {
    setCaptchaToken("");
    turnstileRef.current?.reset();
  }

  function findBooking() {
    setError("");
    setNotice("");
    setConfirmCancel(false);
    startTransition(async () => {
      const result = await lookupBookingAction(code, phone, captchaToken);
      resetCaptcha();
      if (!result.ok) {
        setBooking(null);
        setError(result.message);
        return;
      }
      setBooking(result.booking);
    });
  }

  function cancelNow() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await cancelBookingAction(code, phone, captchaToken);
      resetCaptcha();
      setConfirmCancel(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice(result.message);
      setBooking((old) =>
        old ? { ...old, status: "cancelled", can_cancel: false } : old
      );
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-muted px-3 py-2 text-sm"
        >
          {notice}
        </p>
      )}

      {!booking && (
        <div className="space-y-4">
          <label className="block">
            Booking code
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="RB-XXXXX"
              autoCapitalize="characters"
              autoComplete="off"
            />
          </label>
          <label className="block">
            Phone number you used
            <input
              className={inputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
        </div>
      )}

      {booking && (
        <div className="space-y-4">
          <dl className="space-y-1">
            <div>
              <dt className="text-sm text-muted-foreground">Booking code</dt>
              <dd className="text-xl font-bold tracking-wider">
                {booking.code}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>{STATUS_TEXT[booking.status] ?? booking.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">When</dt>
              <dd>
                {formatDate(booking.starts_at)} at{" "}
                {formatTime(booking.starts_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Guests</dt>
              <dd>{booking.party_size}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd>{booking.guest_name}</dd>
            </div>
          </dl>

          {booking.can_cancel && !confirmCancel && (
            <Button variant="outline" onClick={() => setConfirmCancel(true)}>
              Cancel this booking
            </Button>
          )}

          {booking.can_cancel && confirmCancel && (
            <div className="space-y-2">
              <p className="text-sm">
                Are you sure? You cannot undo this.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmCancel(false)}
                  disabled={isPending}
                >
                  No, keep it
                </Button>
                <Button
                  onClick={cancelNow}
                  disabled={isPending || !captchaToken}
                >
                  {isPending ? "Cancelling..." : "Yes, cancel"}
                </Button>
              </div>
            </div>
          )}

          {!booking.can_cancel &&
            (booking.status === "pending" ||
              booking.status === "confirmed") && (
              <p className="text-sm text-muted-foreground">
                It is too late to cancel online. Please call the restaurant.
              </p>
            )}

          <Button
            variant="outline"
            onClick={() => {
              setBooking(null);
              setNotice("");
              setError("");
              setConfirmCancel(false);
            }}
          >
            Check another booking
          </Button>
        </div>
      )}

      {/* One widget for the whole page. It resets after every action. */}
      <div className="mt-4">
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
      </div>

      {!booking && (
        <Button
          className="mt-4"
          onClick={findBooking}
          disabled={
            isPending || !code.trim() || phone.trim().length < 8 || !captchaToken
          }
        >
          {isPending ? "Searching..." : "Find my booking"}
        </Button>
      )}
    </div>
  );
}