import Link from "next/link";
import { SITE } from "@/lib/site";
import { StatusForm } from "./status-form";

export const metadata = {
  title: "Check your booking",
};

export default function BookingStatusPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold">Check your booking</h1>
      <p className="mt-3 mb-8 text-muted-foreground">
        Enter your booking code and the phone number you used. You can cancel
        online until 2 hours before your time. After that, please call{" "}
        {SITE.phone}.
      </p>
      <StatusForm />
      <p className="mt-6 text-sm text-muted-foreground">
        Need a new table?{" "}
        <Link href="/book" className="underline">
          Book a table
        </Link>
      </p>
    </main>
  );
}