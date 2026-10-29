const TIME_ZONE = "Asia/Yangon";

// "2026-11-02T05:30:00+00:00" -> "12:00"
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

// "2026-11-02T05:30:00+00:00" -> "Mon, 2 Nov 2026"
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}