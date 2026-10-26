import type { MenuItem } from "@/lib/db/menu";

export function DishRow({ item }: { item: MenuItem }) {
  return (
    <li
      className={`flex items-start justify-between gap-6 border-b border-border py-5 ${
        item.is_available ? "" : "opacity-60"
      }`}
    >
      <div>
        <p className="font-heading text-lg font-semibold">{item.name_en}</p>
        <p className="text-sm text-muted-foreground">{item.name_my}</p>
        {item.description && (
          <p className="mt-2 max-w-sm text-sm">{item.description}</p>
        )}
        {!item.is_available && (
          <p className="mt-2 text-sm font-medium text-primary">Sold out</p>
        )}
      </div>
      <p className="shrink-0 font-medium">
        {item.price.toLocaleString("en-US")} Ks
      </p>
    </li>
  );
}