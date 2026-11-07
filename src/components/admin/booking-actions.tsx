"use client";

import { useState, useTransition } from "react";
import { updateBookingStatusAction } from "@/app/(admin)/admin/actions";

type NewStatus =
  | "confirmed"
  | "cancelled"
  | "seated"
  | "completed"
  | "no_show";

type ActionButton = {
  label: string;
  newStatus: NewStatus;
  style: "main" | "plain" | "danger";
  confirmText?: string; // if set, ask "Are you sure?" first
};

const BUTTONS_BY_STATUS: Record<string, ActionButton[]> = {
  pending: [
    { label: "Confirm", newStatus: "confirmed", style: "main" },
    {
      label: "Cancel",
      newStatus: "cancelled",
      style: "danger",
      confirmText: "Cancel this booking?",
    },
  ],
  confirmed: [
    { label: "Seat", newStatus: "seated", style: "main" },
    {
      label: "No-show",
      newStatus: "no_show",
      style: "plain",
      confirmText: "Mark this booking as no-show?",
    },
    {
      label: "Cancel",
      newStatus: "cancelled",
      style: "danger",
      confirmText: "Cancel this booking?",
    },
  ],
  seated: [{ label: "Complete", newStatus: "completed", style: "main" }],
};

function buttonClass(style: ActionButton["style"]) {
  const base =
    "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium disabled:opacity-50";
  if (style === "main") {
    return `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
  }
  if (style === "danger") {
    return `${base} border border-destructive text-destructive hover:bg-destructive/10`;
  }
  return `${base} border border-border text-foreground hover:bg-muted`;
}

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const buttons = BUTTONS_BY_STATUS[status];
  if (!buttons) return null; // completed, cancelled, no_show: no buttons

  function handleClick(button: ActionButton) {
    if (button.confirmText && !window.confirm(button.confirmText)) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await updateBookingStatusAction({
          bookingId,
          newStatus: button.newStatus,
        });
        if (!result.ok) setError(result.message);
      } catch (err) {
        console.error("[admin] booking action failed:", err);
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {buttons.map((button) => (
          <button
            key={button.newStatus}
            type="button"
            disabled={isPending}
            onClick={() => handleClick(button)}
            className={buttonClass(button.style)}
          >
            {button.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}