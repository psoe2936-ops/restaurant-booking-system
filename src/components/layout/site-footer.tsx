import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-heading text-xl font-semibold">{SITE.name}</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Book your table online in under a minute. No account needed.
          </p>
        </div>

        <div>
          <p className="font-heading text-lg font-semibold">Opening hours</p>
          <dl className="mt-3 space-y-2 text-sm">
            {SITE.hours.map((row) => (
              <div key={row.days}>
                <dt className="text-muted-foreground">{row.days}</dt>
                <dd>{row.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p className="font-heading text-lg font-semibold">Find us</p>
          <address className="mt-3 space-y-2 text-sm not-italic">
            <p>{SITE.address}</p>
            <p>{SITE.phone}</p>
          </address>
          <Link
            href="/contact"
            className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            Contact and map
          </Link>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE.name}
      </div>
    </footer>
  );
}