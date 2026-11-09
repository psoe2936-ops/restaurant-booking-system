import { z } from "zod";

const labelSchema = z
  .string()
  .trim()
  .min(1, "Enter a table label.")
  .max(20, "Table labels must be 20 characters or fewer.")
  .refine((value) => !/[\u0000-\u001F\u007F-\u009F]/.test(value), {
    message: "Table labels cannot contain control characters.",
  });

const capacitySchema = z
  .number()
  .int("Seats must be a whole number.")
  .min(1, "A table must have at least 1 seat.")
  .max(50, "A table can have no more than 50 seats.");

export const addTableSchema = z.object({
  label: labelSchema,
  capacity: capacitySchema,
});

export const changeTableSeatsSchema = z.object({
  tableId: z.string().uuid("Please choose a valid table."),
  capacity: capacitySchema,
});

export const setTableActiveSchema = z.object({
  tableId: z.string().uuid("Please choose a valid table."),
  isActive: z.boolean(),
});

export type AddTableInput = z.infer<typeof addTableSchema>;
export type ChangeTableSeatsInput = z.infer<typeof changeTableSeatsSchema>;
export type SetTableActiveInput = z.infer<typeof setTableActiveSchema>;
