insert into menu_categories (id, name_my, name_en, sort_order) values
  ('11111111-1111-1111-1111-111111111111', 'ထမင်းနှင့်ဟင်း', 'Rice and Curry', 1),
  ('22222222-2222-2222-2222-222222222222', 'ခေါက်ဆွဲ', 'Noodles', 2),
  ('33333333-3333-3333-3333-333333333333', 'အချိုရည်', 'Drinks', 3);

insert into menu_items (category_id, name_my, name_en, description, price, is_featured) values
  ('11111111-1111-1111-1111-111111111111', 'ကြက်သားဟင်း', 'Chicken Curry', 'Slow cooked with onion and spices', 6500, true),
  ('11111111-1111-1111-1111-111111111111', 'ငါးရံ့ဟင်း', 'Fish Curry', 'Fresh fish in a rich sauce', 7500, false),
  ('22222222-2222-2222-2222-222222222222', 'မုန့်ဟင်းခါး', 'Mohinga', 'Traditional fish noodle soup', 3500, true),
  ('22222222-2222-2222-2222-222222222222', 'နန်းကြီးသုပ်', 'Nan Gyi Thoke', 'Thick rice noodle salad', 4000, false),
  ('33333333-3333-3333-3333-333333333333', 'လက်ဖက်ရည်', 'Milk Tea', 'Sweet Myanmar style tea', 1500, false);