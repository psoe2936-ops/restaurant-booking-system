export type BookingErrorReason =
  | "not_configured"
  | "invalid_input"
  | "invalid_party_size"
  | "in_the_past"
  | "too_far_ahead"
  | "blocked_date"
  | "closed"
  | "outside_hours"
  | "too_many_bookings"
  | "no_table_available"
  | "unknown";

export const BOOKING_ERROR_MESSAGES: Record<BookingErrorReason, string> = {
  not_configured: "Online booking is not ready yet. Please call us.",
  invalid_input: "Please check your details and try again.",
  invalid_party_size: "We cannot take this number of guests online. Please call us.",
  in_the_past: "That time has already passed. Please choose another time.",
  too_far_ahead: "That date is too far ahead. Please choose an earlier date.",
  blocked_date: "We are not taking bookings on that day. Please choose another day.",
  closed: "We are closed on that day. Please choose another day.",
  outside_hours: "That time is outside our opening hours.",
  too_many_bookings: "This phone number already has the maximum number of bookings.",
  no_table_available:
    "Sorry, that table was just taken. Please choose another time.",
  unknown: "Something went wrong. Please try again, or call us.",
};