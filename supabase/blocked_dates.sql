create table if not exists public.blocked_slots (
  date date not null,
  time text not null,
  primary key (date, time)
);

do $$
begin
  if to_regclass('public.blocked_dates') is not null then
    insert into public.blocked_slots (date, time)
    select blocked_date.date, slot.time
    from public.blocked_dates as blocked_date
    cross join (
      values
        ('09:00'), ('09:30'), ('10:00'), ('10:30'), ('11:00'),
        ('11:30'), ('12:00'), ('12:30'), ('13:00'), ('13:30'),
        ('14:00'), ('14:30'), ('15:00'), ('15:30'), ('16:00')
    ) as slot(time)
    on conflict (date, time) do nothing;
  end if;
end $$;

alter table public.blocked_slots enable row level security;

create policy "Anyone can view blocked slots"
  on public.blocked_slots
  for select
  using (true);

create policy "Authenticated admins can block slots"
  on public.blocked_slots
  for insert
  to authenticated
  with check (true);

create policy "Authenticated admins can unblock slots"
  on public.blocked_slots
  for delete
  to authenticated
  using (true);
