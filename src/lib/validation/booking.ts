import { z } from "zod";

const partySize = z.coerce.number().int().min(1).max(50);

export const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize,
});

export const createBookingSchema = z.object({
  guestName: z.string().trim().min(1).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Please enter a valid phone number"),
  email: z.string().trim().max(200).email().optional().or(z.literal("")),
  partySize,
  startsAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date and time"),
  notes: z.string().trim().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;