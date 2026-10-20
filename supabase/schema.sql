-- =====================================================================
-- VOLTA — Supabase šema. Pokreni jednom: Supabase → SQL Editor → New query → Run
-- =====================================================================
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  name text not null, phone text, car text default 'Tesla Model Y', plate text,
  commission numeric default 0.25, active boolean default true, rating numeric default 5.0);

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade, name text,
  role text not null default 'driver' check (role in ('admin','dispatcher','driver')),
  driver_id uuid references public.drivers on delete set null);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  ref text unique not null, "from" text, "to" text, date date not null, time text not null,
  addr text, flight text, pax int default 1, bags int default 1, class text default 'm3',
  extras jsonb default '[]', return_trip boolean default false, price numeric,
  name text not null, phone text not null, email text, note text, channel text, lang text,
  pay_method text default 'cash' check (pay_method in ('cash','online','ips','invoice')),
  pay_status text default 'unpaid' check (pay_status in ('unpaid','pending','paid','refunded')),
  paid_at timestamptz, pay_txn text,
  status text default 'new' check (status in ('new','confirmed','assigned','accepted','enroute','arrived','onboard','done','cancelled')),
  driver_id uuid references public.drivers on delete set null,
  collected_by_driver boolean default false, settled boolean default false, settled_at timestamptz,
  history jsonb default '[]', tg_chat_id bigint, msg_log jsonb default '{}');
create index if not exists bookings_date_idx on public.bookings(date);
create index if not exists bookings_driver_idx on public.bookings(driver_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  name text not null, route text, rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 3 and 1500),
  status text default 'pending' check (status in ('pending','approved','hidden')), source text default 'site');

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from profiles where id = auth.uid() and role in ('admin','dispatcher')); $$;
create or replace function public.my_driver() returns uuid language sql stable security definer set search_path=public as $$
  select driver_id from profiles where id = auth.uid(); $$;

alter table public.drivers enable row level security; alter table public.profiles enable row level security;
alter table public.bookings enable row level security; alter table public.reviews enable row level security;
drop policy if exists p1 on public.profiles; create policy p1 on public.profiles for select using (id = auth.uid() or is_staff());
drop policy if exists p2 on public.profiles; create policy p2 on public.profiles for all using (is_staff()) with check (is_staff());
drop policy if exists d1 on public.drivers;  create policy d1 on public.drivers for all using (is_staff()) with check (is_staff());
drop policy if exists d2 on public.drivers;  create policy d2 on public.drivers for select using (id = my_driver());
drop policy if exists d3 on public.drivers;  create policy d3 on public.drivers for update using (id = my_driver()) with check (id = my_driver());
drop policy if exists b1 on public.bookings; create policy b1 on public.bookings for all using (is_staff()) with check (is_staff());
drop policy if exists b2 on public.bookings; create policy b2 on public.bookings for select using (driver_id = my_driver());
drop policy if exists b3 on public.bookings; create policy b3 on public.bookings for update using (driver_id = my_driver()) with check (driver_id = my_driver());
drop policy if exists r1 on public.reviews;  create policy r1 on public.reviews for select using (status = 'approved' or is_staff());
drop policy if exists r2 on public.reviews;  create policy r2 on public.reviews for insert with check (status = 'pending');
drop policy if exists r3 on public.reviews;  create policy r3 on public.reviews for update using (is_staff());
drop policy if exists r4 on public.reviews;  create policy r4 on public.reviews for delete using (is_staff());

-- gost pravi rezervaciju bez naloga; ne može da postavi status, vozača, plaćeno, telegram
create or replace function public.create_booking(b jsonb) returns public.bookings language plpgsql security definer set search_path=public as $$
declare r bookings;
begin
  if coalesce(b->>'name','') = '' or length(regexp_replace(coalesce(b->>'phone',''),'\D','','g')) < 8 then raise exception 'Ime i telefon su obavezni'; end if;
  if (b->>'date')::date < current_date then raise exception 'Datum je u prošlosti'; end if;
  r := jsonb_populate_record(null::bookings, b);
  r.id := gen_random_uuid(); r.created_at := now(); r.status := 'new'; r.driver_id := null; r.settled := false; r.collected_by_driver := false;
  r.tg_chat_id := null; r.msg_log := '{}'; r.pay_status := case when r.pay_method = 'online' then 'pending' else 'unpaid' end;
  r.history := jsonb_build_array(jsonb_build_object('s','new','t',now()));
  insert into bookings select r.*; return r;
end $$;
create or replace function public.find_booking(p_ref text, p_phone text) returns jsonb language sql security definer set search_path=public as $$
  select to_jsonb(b) - 'email' - 'settled' - 'collected_by_driver' - 'tg_chat_id'
    || jsonb_build_object('driver', case when d.id is null then null else jsonb_build_object('name',d.name,'phone',d.phone,'car',d.car,'plate',d.plate,'rating',d.rating) end)
  from bookings b left join drivers d on d.id = b.driver_id
  where b.ref = upper(trim(p_ref)) and right(regexp_replace(b.phone,'\D','','g'),6) = right(regexp_replace(p_phone,'\D','','g'),6) limit 1; $$;
create or replace function public.cancel_booking(p_ref text, p_phone text) returns boolean language plpgsql security definer set search_path=public as $$
declare b bookings;
begin
  select * into b from bookings where ref = upper(trim(p_ref)) and right(regexp_replace(phone,'\D','','g'),6) = right(regexp_replace(p_phone,'\D','','g'),6);
  if b.id is null or b.status in ('done','cancelled','onboard') then return false; end if;
  if (b.date + b.time::time) - now() < interval '24 hours' then return false; end if;
  update bookings set status='cancelled', pay_status = case when pay_status='paid' then 'refunded' else pay_status end,
    history = history || jsonb_build_object('s','cancelled','t',now(),'by','client') where id = b.id;
  return true;
end $$;
grant execute on function public.create_booking(jsonb) to anon, authenticated;
grant execute on function public.find_booking(text,text) to anon, authenticated;
grant execute on function public.cancel_booking(text,text) to anon, authenticated;
do $$ begin
  begin alter publication supabase_realtime add table public.bookings; exception when others then null; end;
  begin alter publication supabase_realtime add table public.reviews; exception when others then null; end;
end $$;

-- PRVI ADMIN: Authentication → Users → Add user, pa (zameni email):
-- insert into profiles(id,name,role) select id,'Admin','admin' from auth.users where email='vlasnik@domen.rs';
-- VOZAČ: dodaj ga u portalu (Vozači), napravi mu user nalog, pa:
-- insert into profiles(id,name,role,driver_id) select u.id,'Marko','driver',d.id from auth.users u, drivers d where u.email='marko@domen.rs' and d.name='Marko Petrović';
