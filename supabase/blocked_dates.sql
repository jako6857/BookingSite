create table if not exists public.blocked_dates (
  date date primary key
);

alter table public.blocked_dates enable row level security;

create policy "Anyone can view blocked dates"
  on public.blocked_dates
  for select
  using (true);

create policy "Authenticated admins can block dates"
  on public.blocked_dates
  for insert
  to authenticated
  with check (true);

create policy "Authenticated admins can unblock dates"
  on public.blocked_dates
  for delete
  to authenticated
  using (true);
