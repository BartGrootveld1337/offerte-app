-- Catalog items (product/service library)
create table catalog_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  unit text default 'stuks',
  unit_price numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 21,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table catalog_items enable row level security;
create policy "Users manage own catalog" on catalog_items for all using (auth.uid() = user_id);
