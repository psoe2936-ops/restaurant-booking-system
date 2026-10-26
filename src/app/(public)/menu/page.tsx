import { Suspense } from "react";
import { getMenu } from "@/lib/db/menu";
import { DishRow } from "@/components/menu/dish-row";

async function MenuContent() {
  const all = await getMenu();
  const categories = all.filter((c) => c.menu_items.length > 0);

  if (categories.length === 0) {
    return (
      <p className="mt-8 text-muted-foreground">
        The menu is empty. Please check back soon.
      </p>
    );
  }

  return (
    <>
      <nav
        aria-label="Menu categories"
        className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
      >
        <ul className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <a
                href={`#${category.id}`}
                className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-medium hover:bg-secondary"
              >
                {category.name_en}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-14">
        {categories.map((category) => (
          <section key={category.id} id={category.id} className="scroll-mt-32">
            <h2 className="text-2xl font-semibold">
              {category.name_en}
              <span className="ml-3 font-sans text-base font-normal text-muted-foreground">
                {category.name_my}
              </span>
            </h2>
            <ul className="mt-2">
              {category.menu_items.map((item) => (
                <DishRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold">Our menu</h1>
      <p className="mt-3 text-muted-foreground">
        All prices are in Myanmar kyats (Ks).
      </p>
      <Suspense
        fallback={<p className="mt-8 text-muted-foreground">Loading menu...</p>}
      >
        <MenuContent />
      </Suspense>
    </main>
  );
}