import { SITE } from "@/lib/site";

export default function BookPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-semibold">Book a table</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Online booking opens soon. Until then, please call {SITE.phone}.
      </p>
    </main>
  );
}