import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Restaurant Booking</h1>
      <Button className="mt-4">Book a Table</Button>
    </main>
  );
}