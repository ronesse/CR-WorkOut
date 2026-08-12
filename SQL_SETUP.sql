-- CR-Workout database setup
-- Kjør hele filen i Supabase SQL Editor.

create table if not exists public.cr_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'athlete' check (role in ('coach','athlete')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cr_coach_athletes (
  coach_id uuid not null references public.cr_profiles(id) on delete cascade,
  athlete_id uuid not null references public.cr_profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  primary key (coach_id, athlete_id)
);

create table if not exists public.cr_programs (
  id text primary key,
  name text not null,
  description text,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 100
);

create table if not exists public.cr_athlete_programs (
  athlete_id uuid not null references public.cr_profiles(id) on delete cascade,
  program_id text not null references public.cr_programs(id) on delete cascade,
  enabled boolean not null default true,
  assigned_at timestamptz not null default now(),
  primary key (athlete_id, program_id)
);

create table if not exists public.cr_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.cr_profiles(id) on delete cascade,
  program_id text references public.cr_programs(id),
  program_name text not null,
  status text not null default 'started' check (status in ('started','completed','cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

insert into public.cr_programs (id,name,description,icon,sort_order) values
('kettlebell','Kettlebell 60/30','20 runder · 30 min','🏋️',10),
('tabata','Tabata 20/10','8 runder · 4 min','🔥',20),
('strength_day1','Styrke Dag1','43 aktiviteter · oppgavebasert','🏋️',30),
('strength_day2','Styrke Dag2','46 aktiviteter · oppgavebasert','🏋️',40),
('strength_4515','Styrke 45/15','12 runder · 12 min','💪',50)
on conflict (id) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order;

create or replace function public.cr_is_coach(uid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.cr_profiles where id=uid and role='coach'); $$;

create or replace function public.cr_is_linked(coach uuid, athlete uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.cr_coach_athletes where coach_id=coach and athlete_id=athlete and status in ('pending','approved')); $$;

create or replace function public.cr_handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare coach_uuid uuid;
begin
  insert into public.cr_profiles(id,email,full_name,phone,role,approved)
  values(new.id,new.email,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'phone','athlete',false)
  on conflict (id) do update set email=excluded.email,
    full_name=coalesce(excluded.full_name,public.cr_profiles.full_name),
    phone=coalesce(excluded.phone,public.cr_profiles.phone);

  begin
    coach_uuid := nullif(new.raw_user_meta_data->>'coach_id','')::uuid;
  exception when others then
    coach_uuid := null;
  end;

  if coach_uuid is not null then
    insert into public.cr_coach_athletes(coach_id,athlete_id,status)
    values(coach_uuid,new.id,'pending')
    on conflict (coach_id,athlete_id) do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists cr_on_auth_user_created on auth.users;
create trigger cr_on_auth_user_created after insert or update of raw_user_meta_data on auth.users
for each row execute procedure public.cr_handle_new_user();

-- Backfill existing auth users so existing coach login can be used.
insert into public.cr_profiles(id,email,full_name,phone,role,approved)
select id,email,coalesce(raw_user_meta_data->>'full_name',email),raw_user_meta_data->>'phone','athlete',false
from auth.users
on conflict (id) do nothing;

-- Promote the existing coach account.
update public.cr_profiles
set role='coach', approved=true
where email='eirik.roness@cgi.com';

alter table public.cr_profiles enable row level security;
alter table public.cr_coach_athletes enable row level security;
alter table public.cr_programs enable row level security;
alter table public.cr_athlete_programs enable row level security;
alter table public.cr_workout_sessions enable row level security;

drop policy if exists cr_profiles_self_select on public.cr_profiles;
create policy cr_profiles_self_select on public.cr_profiles for select to authenticated
using (id=auth.uid());

drop policy if exists cr_profiles_coach_select on public.cr_profiles;
create policy cr_profiles_coach_select on public.cr_profiles for select to authenticated
using (public.cr_is_coach(auth.uid()) and public.cr_is_linked(auth.uid(),id));

drop policy if exists cr_profiles_coach_update on public.cr_profiles;
create policy cr_profiles_coach_update on public.cr_profiles for update to authenticated
using (public.cr_is_coach(auth.uid()) and public.cr_is_linked(auth.uid(),id))
with check (public.cr_is_coach(auth.uid()) and public.cr_is_linked(auth.uid(),id));

drop policy if exists cr_profiles_self_update on public.cr_profiles;
create policy cr_profiles_self_update on public.cr_profiles for update to authenticated
using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists cr_links_coach_all on public.cr_coach_athletes;
create policy cr_links_coach_all on public.cr_coach_athletes for all to authenticated
using (coach_id=auth.uid()) with check (coach_id=auth.uid());

drop policy if exists cr_links_athlete_select on public.cr_coach_athletes;
create policy cr_links_athlete_select on public.cr_coach_athletes for select to authenticated
using (athlete_id=auth.uid());

drop policy if exists cr_programs_read on public.cr_programs;
create policy cr_programs_read on public.cr_programs for select to authenticated using (true);

drop policy if exists cr_assign_athlete_read on public.cr_athlete_programs;
create policy cr_assign_athlete_read on public.cr_athlete_programs for select to authenticated
using (athlete_id=auth.uid());

drop policy if exists cr_assign_coach_all on public.cr_athlete_programs;
create policy cr_assign_coach_all on public.cr_athlete_programs for all to authenticated
using (public.cr_is_coach(auth.uid()) and public.cr_is_linked(auth.uid(),athlete_id))
with check (public.cr_is_coach(auth.uid()) and public.cr_is_linked(auth.uid(),athlete_id));

drop policy if exists cr_sessions_athlete_all on public.cr_workout_sessions;
create policy cr_sessions_athlete_all on public.cr_workout_sessions for all to authenticated
using (athlete_id=auth.uid()) with check (athlete_id=auth.uid());

drop policy if exists cr_sessions_coach_read on public.cr_workout_sessions;
create policy cr_sessions_coach_read on public.cr_workout_sessions for select to authenticated
using (public.cr_is_coach(auth.uid()) and public.cr_is_linked(auth.uid(),athlete_id));

do $$ begin
  alter publication supabase_realtime add table public.cr_workout_sessions;
exception when duplicate_object then null;
end $$;


-- v6.1 corrected Kettlebell Mix

insert into public.cr_programs (id,name,description,icon,active,sort_order)
values ('kettlebell_mix','Kettlebell Mix 60/30','20 runder · 30 min · aktivitetstekst per intervall','kettlebell.png',true,15)
on conflict (id) do update
set name=excluded.name,
    description=excluded.description,
    icon=excluded.icon,
    active=true,
    sort_order=excluded.sort_order;

insert into public.cr_program_settings
(program_id,program_type,work_seconds,rest_seconds,rounds,work_warning,rest_warning)
values ('kettlebell_mix','interval_sequence',60,30,20,10,5)
on conflict (program_id) do update
set program_type='interval_sequence',
    work_seconds=60,
    rest_seconds=30,
    rounds=20,
    work_warning=10,
    rest_warning=5,
    updated_at=now();

delete from public.cr_program_activities where program_id='kettlebell_mix';

insert into public.cr_program_activities
(program_id,group_name,order_no,round_no,activity,reps,load,description,duration_seconds,warning_seconds)
values
('kettlebell_mix','Work',1,1,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',2,1,'Hvile','','','',30,5),
('kettlebell_mix','Work',3,2,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',4,2,'Hvile','','','',30,5),
('kettlebell_mix','Work',5,3,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',6,3,'Hvile','','','',30,5),
('kettlebell_mix','Work',7,4,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',8,4,'Hvile','','','',30,5),
('kettlebell_mix','Work',9,5,'Goblet Squat','','','',60,10),
('kettlebell_mix','Rest',10,5,'Hvile','','','',30,5),
('kettlebell_mix','Work',11,6,'Goblet Squat','','','',60,10),
('kettlebell_mix','Rest',12,6,'Hvile','','','',30,5),
('kettlebell_mix','Work',13,7,'Windmill','','','',60,10),
('kettlebell_mix','Rest',14,7,'Hvile','','','',30,5),
('kettlebell_mix','Work',15,8,'Windmill','','','',60,10),
('kettlebell_mix','Rest',16,8,'Hvile','','','',30,5),
('kettlebell_mix','Work',17,9,'Lunges','','','',60,10),
('kettlebell_mix','Rest',18,9,'Hvile','','','',30,5),
('kettlebell_mix','Work',19,10,'Lunges','','','',60,10),
('kettlebell_mix','Rest',20,10,'Hvile','','','',30,5),
('kettlebell_mix','Work',21,11,'Goblet Squat','','','',60,10),
('kettlebell_mix','Rest',22,11,'Hvile','','','',30,5),
('kettlebell_mix','Work',23,12,'Goblet Squat','','','',60,10),
('kettlebell_mix','Rest',24,12,'Hvile','','','',30,5),
('kettlebell_mix','Work',25,13,'Kettlebell Thruster','','','',60,10),
('kettlebell_mix','Rest',26,13,'Hvile','','','',30,5),
('kettlebell_mix','Work',27,14,'Kettlebell Thruster','','','',60,10),
('kettlebell_mix','Rest',28,14,'Hvile','','','',30,5),
('kettlebell_mix','Work',29,15,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',30,15,'Hvile','','','',30,5),
('kettlebell_mix','Work',31,16,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',32,16,'Hvile','','','',30,5),
('kettlebell_mix','Work',33,17,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',34,17,'Hvile','','','',30,5),
('kettlebell_mix','Work',35,18,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',36,18,'Hvile','','','',30,5),
('kettlebell_mix','Work',37,19,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',38,19,'Hvile','','','',30,5),
('kettlebell_mix','Work',39,20,'Kettlebell Swing','','','',60,10),
('kettlebell_mix','Rest',40,20,'Hvile','','','',30,5);

NOTIFY pgrst, 'reload schema';

-- v7: Løping
alter table public.cr_workout_sessions
  add column if not exists distance_meters numeric,
  add column if not exists avg_pace_seconds_per_km numeric;

insert into public.cr_programs (id,name,description,icon,active,sort_order)
values ('running','Løping','GPS · tid · distanse · pace','🏃',true,60)
on conflict (id) do update
set name=excluded.name,description=excluded.description,icon=excluded.icon,active=true,sort_order=excluded.sort_order;

NOTIFY pgrst, 'reload schema';

-- v7.6
alter table public.cr_athlete_programs add column if not exists sort_order integer;
update public.cr_athlete_programs ap set sort_order=p.sort_order from public.cr_programs p where ap.program_id=p.id and ap.sort_order is null;
NOTIFY pgrst, 'reload schema';


-- v8: 20 minutes Workout
insert into public.cr_programs (id,name,description,icon,active,sort_order)
values ('twenty_minutes','20 minutes Workout','20:00 nedtelling · fargefaser · 3 sek beep ved 10:00','⏳',true,70)
on conflict (id) do update
set name=excluded.name,
    description=excluded.description,
    icon=excluded.icon,
    active=true,
    sort_order=excluded.sort_order;

NOTIFY pgrst, 'reload schema';

-- v8.1: Fri økt
alter table public.cr_workout_sessions add column if not exists distance_meters numeric;
insert into public.cr_programs (id,name,description,icon,active,sort_order)
values ('free_workout','Fri økt','Fri timer · rating · kommentar · valgfri distanse','⏱️',true,80)
on conflict (id) do update
set name=excluded.name,description=excluded.description,icon=excluded.icon,active=true,sort_order=excluded.sort_order;
NOTIFY pgrst, 'reload schema';
