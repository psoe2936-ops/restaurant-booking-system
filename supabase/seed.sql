-- Menu
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

-- Restaurant setup
insert into restaurant_settings (id, name, phone, address) values
  (1, 'Thazin Kitchen', '+95 9 000 000 000', 'Street address, Township, City')
on conflict (id) do nothing;

insert into opening_hours (weekday, open_time, close_time, is_closed) values
  (0, '09:00', '22:00', false),
  (1, '10:00', '21:00', false),
  (2, '10:00', '21:00', false),
  (3, '10:00', '21:00', false),
  (4, '10:00', '21:00', false),
  (5, '10:00', '21:00', false),
  (6, '09:00', '22:00', false)
on conflict (weekday) do nothing;

insert into dining_tables (label, capacity) values
  ('T1', 2), ('T2', 2), ('T3', 2),
  ('T4', 4), ('T5', 4), ('T6', 4),
  ('T7', 6), ('T8', 8)
on conflict (label) do nothing;