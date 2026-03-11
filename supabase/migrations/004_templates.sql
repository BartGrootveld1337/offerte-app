-- Quote templates
create table quote_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  title text,
  intro text,
  footer text,
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table quote_templates enable row level security;
create policy "Users manage own templates" on quote_templates for all using (auth.uid() = user_id);
