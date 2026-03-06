-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (company settings per user)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  company_name text not null default '',
  company_address text,
  company_city text,
  company_postal text,
  company_country text default 'Nederland',
  company_kvk text,
  company_btw text,
  company_iban text,
  company_email text,
  company_phone text,
  company_website text,
  logo_url text,
  default_payment_days int default 30,
  default_vat_rate numeric(5,2) default 21,
  default_intro text default 'Geachte heer/mevrouw,

Hierbij ontvangt u onze offerte voor de gevraagde werkzaamheden.',
  default_footer text default 'Deze offerte is 30 dagen geldig. Bij akkoord ontvangt u een bevestiging en starten wij zo spoedig mogelijk met de werkzaamheden.',
  updated_at timestamptz default now()
);

-- Clients
create table clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  company text,
  email text not null,
  phone text,
  address text,
  city text,
  postal text,
  country text default 'Nederland',
  notes text,
  created_at timestamptz default now()
);

-- Quotes
create table quotes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients on delete set null,
  quote_number text not null,
  status text not null default 'draft' check (status in ('draft','sent','signed','expired','declined')),
  title text not null default 'Offerte',
  intro text,
  footer text,
  valid_until date,
  subtotal numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  sign_token uuid default uuid_generate_v4() unique,
  signed_at timestamptz,
  signed_name text,
  signed_ip text,
  signature_url text,
  sent_at timestamptz,
  pdf_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Quote items
create table quote_items (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references quotes on delete cascade not null,
  sort_order int default 0,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit text default 'stuks',
  unit_price numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 21,
  line_total numeric(12,2) not null default 0
);

-- RLS policies
alter table profiles enable row level security;
alter table clients enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;

create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own clients" on clients for all using (auth.uid() = user_id);
create policy "Users manage own quotes" on quotes for all using (auth.uid() = user_id);
create policy "Users manage own quote_items" on quote_items for all
  using (exists (select 1 from quotes where quotes.id = quote_items.quote_id and quotes.user_id = auth.uid()));

-- Public read for signing (via token)
create policy "Public read quote by token" on quotes for select using (sign_token is not null);
create policy "Public read quote items for signing" on quote_items for select
  using (exists (select 1 from quotes where quotes.id = quote_items.quote_id and quotes.sign_token is not null));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
