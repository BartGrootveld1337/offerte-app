-- API keys for CRM integration
create table api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamptz default now(),
  last_used_at timestamptz
);

alter table api_keys enable row level security;
create policy "Users manage own api keys" on api_keys for all using (auth.uid() = user_id);
