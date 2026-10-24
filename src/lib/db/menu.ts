import { supabase } from "./client";

export type MenuItem = {
  id: string;
  name_my: string;
  name_en: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
};

export type MenuCategory = {
  id: string;
  name_my: string;
  name_en: string;
  sort_order: number;
  menu_items: MenuItem[];
};

export async function getMenu(): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select(
      "id, name_my, name_en, sort_order, menu_items(id, name_my, name_en, description, price, image_url, is_available, is_featured)"
    )
    .order("sort_order")
    .order("created_at", { referencedTable: "menu_items" });

  if (error) {
    throw new Error(`Could not load the menu: ${error.message}`);
  }

  return (data ?? []) as MenuCategory[];
}