import { z } from "zod";

// An empty text becomes null (nothing saved).
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

export const restaurantSettingsSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    phone: optionalText(30),
    address: optionalText(200),
    slotLengthMin: z.number().int().min(30).max(240),
    slotIntervalMin: z.number().int().min(15).max(120),
    maxPartySize: z.number().int().min(1).max(50),
    bookingWindowDays: z.number().int().min(1).max(90),
  })
  .refine((v) => v.slotIntervalMin <= v.slotLengthMin, {
    path: ["slotIntervalMin"],
    message: "Slot interval cannot be longer than slot length.",
  });

export type RestaurantSettingsInput = z.input<typeof restaurantSettingsSchema>;
export type RestaurantSettingsValues = z.output<typeof restaurantSettingsSchema>;

// Simple words for the error message (the first wrong field).
export const SETTINGS_FIELD_HELP: Record<string, string> = {
  name: "Restaurant name is needed (1 to 80 characters).",
  phone: "Phone is too long (30 characters at most).",
  address: "Address is too long (200 characters at most).",
  slotLengthMin: "Slot length must be 30 to 240 minutes.",
  slotIntervalMin:
    "Slot interval must be 15 to 120 minutes, and not longer than the slot length.",
  maxPartySize: "Max party size must be 1 to 50.",
  bookingWindowDays: "Booking window must be 1 to 90 days.",
};