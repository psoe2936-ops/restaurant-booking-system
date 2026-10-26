import { Suspense } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getFeaturedItems } from "@/lib/db/menu";
import { DishRow } from "@/components/menu/dish-row";

async function FeaturedDishes() {
  const items = await getFeaturedItems();

  if (items.length === 0) {
    return (
      <p className="mt-8 text-muted-foreground">
        Our featured dishes will appear here soon.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid gap-x-12 sm:grid-cols-2">
      {items.map((item) => (
        <DishRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:py-24">
        <div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Book a table in under a minute.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Pick a date, choose a time, and we keep your table ready. No
            account needed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Book a table
            </Link>
            <Link
              href="/menu"
              className="inline-flex h-12 items-center rounded-full border border-border bg-card px-7 text-base font-medium hover:bg-secondary"
            >
              See the menu
            </Link>
          </div>
        </div>

        {/* Replace this card with a real photo when the restaurant gives you one */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Opening hours</h2>
          <dl className="mt-4 space-y-3">
            {SITE.hours.map((row) => (
              <div key={row.days} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{row.days}</dt>
                <dd className="font-medium">{row.time}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            <p>Questions? Call {SITE.phone}</p>
            <p className="mt-1">We send your booking code by email.</p>
          </div>
        </div>
      </section>

      {/* Featured dishes */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold">From our kitchen</h2>
          <Link
            href="/menu"
            className="text-sm font-medium text-primary underline underline-offset-4"
          >
            See full menu
          </Link>
        </div>
        <Suspense
          fallback={<p className="mt-8 text-muted-foreground">Loading...</p>}
        >
          <FeaturedDishes />
        </Suspense>
      </section>

      {/* Story */}
      <section className="mt-24 bg-secondary py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-[1fr_2fr]">
          <h2 className="text-3xl font-semibold">Our story</h2>
          <p className="max-w-prose text-lg leading-relaxed">
            Write two or three sentences here about the restaurant: who cooks,
            where the recipes come from, and what guests can expect. Replace
            this text with the owner&apos;s own words.
          </p>
        </div>
      </section>

      {/* Final call to action */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <h2 className="text-3xl font-semibold">
            Your table is a minute away.
          </h2>
          <Link
            href="/book"
            className="inline-flex h-12 items-center rounded-full bg-background px-7 text-base font-medium text-foreground hover:bg-secondary"
          >
            Book a table
          </Link>
        </div>
      </section>
    </main>
  );
}