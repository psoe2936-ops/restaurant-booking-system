import { Suspense } from "react";
import { connection } from "next/server";
import { SITE } from "@/lib/site";
import { getBookingWindow } from "@/lib/db/settings";
import { BookingWizard } from "./booking-wizard";

async function BookingSection() {
  // Today's date changes every day, so render at request time
  await connection();

  try {
    const { minDate, maxDate } = await getBookingWindow();
    return <BookingWizard minDate={minDate} maxDate={maxDate} />;
  } catch (error) {
    console.error(
      "[book] getBookingWindow failed:",
      error instanceof Error ? error.message : error
    );
    return (
      <p className="text-muted-foreground">
        Online booking is not ready. Please call {SITE.phone}.
      </p>
    );
  }
}

export default function BookPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold">Book a table</h1>
      <p className="mt-3 mb-8 text-muted-foreground">
        It takes less than one minute. For big groups, please call{" "}
        {SITE.phone}.
      </p>
      <Suspense
        fallback={<p className="text-muted-foreground">Loading...</p>}
      >
        <BookingSection />
      </Suspense>
    </main>
  );
}