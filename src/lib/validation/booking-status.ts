import { z } from "zod";

// Same check for the lookup and the cancel
export const bookingLookupSchema = z.object({
  code: z.string().trim().min(3).max(20),
  phone: z.string().trim().min(8).max(30),
});