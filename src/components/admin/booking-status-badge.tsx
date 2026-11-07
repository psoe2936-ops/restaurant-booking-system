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

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${statusClass(status)}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}