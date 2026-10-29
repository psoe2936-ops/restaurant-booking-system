import { NextResponse } from "next/server";
import { slotsQuerySchema } from "@/lib/validation/booking";
import { getAvailableSlots } from "@/lib/db/bookings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = slotsQuerySchema.safeParse({
    date: searchParams.get("date"),
    partySize: searchParams.get("partySize"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(
      parsed.data.date,
      parsed.data.partySize
    );
    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}