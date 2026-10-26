import { SITE } from "@/lib/site";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-semibold">Contact</h1>

      <div className="mt-8 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Find us</h2>
          <address className="mt-3 space-y-1 not-italic">
            <p>{SITE.address}</p>
            <p>{SITE.phone}</p>
          </address>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Opening hours</h2>
          <dl className="mt-3 space-y-2">
            {SITE.hours.map((row) => (
              <div key={row.days}>
                <dt className="text-muted-foreground">{row.days}</dt>
                <dd>{row.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </main>
  );
}