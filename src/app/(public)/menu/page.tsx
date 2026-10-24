import { Suspense } from "react";
import { getMenu } from "@/lib/db/menu";

async function MenuList() {
  const categories = await getMenu();

  if (categories.length === 0) {
    return <p>The menu is empty.</p>;
  }

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="text-xl font-semibold">
            {category.name_en}
            <span className="ml-2 text-base font-normal text-neutral-500">
              {category.name_my}
            </span>
          </h2>

          <ul className="mt-4 space-y-3">
            {category.menu_items.map((item) => (
              <li
                key={item.id}
                className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
                  item.is_available ? "" : "opacity-50"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {item.name_en}
                    <span className="ml-2 text-sm text-neutral-500">
                      {item.name_my}
                    </span>
                  </p>
                  {item.description && (
                    <p className="mt-1 text-sm text-neutral-600">
                      {item.description}
                    </p>
                  )}
                  {!item.is_available && (
                    <p className="mt-1 text-sm font-medium">Sold out</p>
                  )}
                </div>
                <p className="shrink-0 font-semibold">
                  {item.price.toLocaleString("en-US")} Ks
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function MenuPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Menu</h1>
      <Suspense fallback={<p>Loading menu...</p>}>
        <MenuList />
      </Suspense>
    </main>
  );
}