-- Quote events (open tracking)
create table quote_events (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references quotes on delete cascade not null,
  event_type text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

alter table quote_events enable row level security;
create policy "Users view own quote events" on quote_events for select
  using (exists (select 1 from quotes where quotes.id = quote_events.quote_id and quotes.user_id = auth.uid()));
create policy "Public insert quote events" on quote_events for insert with check (true);

-- declined_reason on quotes
alter table quotes add column if not exists declined_reason text;
