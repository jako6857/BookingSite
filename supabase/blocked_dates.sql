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

drop policy if exists "Anyone can view blocked slots"
  on public.blocked_slots;
create policy "Anyone can view blocked slots"
  on public.blocked_slots
  for select
  using (true);

drop policy if exists "Authenticated admins can block slots"
  on public.blocked_slots;
create policy "Authenticated admins can block slots"
  on public.blocked_slots
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated admins can unblock slots"
  on public.blocked_slots;
create policy "Authenticated admins can unblock slots"
  on public.blocked_slots
  for delete
  to authenticated
  using (true);

create or replace function public.set_blocked_slots(
  target_date date,
  target_times text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_times text[] := array[
    '09:00', '09:30', '10:00', '10:30', '11:00',
    '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00'
  ];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_date is null or target_times is null then
    raise exception 'Date and times are required';
  end if;

  if exists (
    select 1
    from unnest(target_times) as requested_time
    where requested_time <> all(allowed_times)
  ) then
    raise exception 'Invalid booking time';
  end if;

  delete from public.blocked_slots
  where date = target_date;

  insert into public.blocked_slots (date, time)
  select target_date, requested_time
  from unnest(target_times) as requested_time
  on conflict (date, time) do nothing;
end;
$$;

revoke all on function public.set_blocked_slots(date, text[]) from public;
grant execute on function public.set_blocked_slots(date, text[]) to authenticated;

create or replace function public.prevent_blocked_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.blocked_slots
    where date = new.date
      and time = new.time
  ) then
    raise exception 'This booking time is unavailable';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_blocked_booking on public.bookings;
create trigger prevent_blocked_booking
  before insert on public.bookings
  for each row
  execute function public.prevent_blocked_booking();
