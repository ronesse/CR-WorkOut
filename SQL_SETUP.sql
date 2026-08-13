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

-- v8.7: lagring av GPS-spor
alter table public.cr_workout_sessions
  add column if not exists gps_track jsonb;

NOTIFY pgrst, 'reload schema';


-- v8.9: live-status for coach
alter table public.cr_workout_sessions
  add column if not exists progress_percent numeric,
  add column if not exists current_activity text,
  add column if not exists current_pace_seconds_per_km numeric,
  add column if not exists live_distance_meters numeric,
  add column if not exists live_gps_track jsonb,
  add column if not exists last_live_update timestamptz;

NOTIFY pgrst, 'reload schema';


-- v9.0: Golf
alter table public.cr_workout_sessions
  add column if not exists golf_course text,
  add column if not exists golf_holes integer,
  add column if not exists golf_start_hole integer,
  add column if not exists golf_scorecard jsonb;

insert into public.cr_programs (id,name,description,icon,active,sort_order)
values ('golf','Golf','Golfrunde · GPS · distanse · score per hull','⛳',true,90)
on conflict (id) do update
set name=excluded.name,
    description=excluded.description,
    icon=excluded.icon,
    active=true,
    sort_order=excluded.sort_order;

NOTIFY pgrst, 'reload schema';


-- v9.1: kartdata for Golf
alter table public.cr_workout_sessions
  add column if not exists golf_course_data jsonb;

NOTIFY pgrst, 'reload schema';

-- v9.3 Golfbanedatabase
create table if not exists public.cr_golf_courses (
 id text primary key,name text not null,country text default 'NO',location text,
 holes integer not null default 18,source_name text,source_url text,
 center_lat double precision,center_lon double precision,active boolean not null default true,
 updated_at timestamptz not null default now());
create table if not exists public.cr_golf_holes (
 course_id text not null references public.cr_golf_courses(id) on delete cascade,
 hole_no integer not null,par integer,stroke_index integer,
 tee_39_m integer,tee_43_m integer,tee_48_m integer,tee_50_m integer,
 green_lat double precision,green_lon double precision,notes text,
 updated_at timestamptz not null default now(),primary key(course_id,hole_no));
alter table public.cr_golf_courses enable row level security;
alter table public.cr_golf_holes enable row level security;
drop policy if exists "golf_courses_read" on public.cr_golf_courses;
create policy "golf_courses_read" on public.cr_golf_courses for select to authenticated using(true);
drop policy if exists "golf_holes_read" on public.cr_golf_holes;
create policy "golf_holes_read" on public.cr_golf_holes for select to authenticated using(true);
drop policy if exists "golf_courses_coach_all" on public.cr_golf_courses;
create policy "golf_courses_coach_all" on public.cr_golf_courses for all to authenticated
 using(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'))
 with check(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'));
drop policy if exists "golf_holes_coach_all" on public.cr_golf_holes;
create policy "golf_holes_coach_all" on public.cr_golf_holes for all to authenticated
 using(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'))
 with check(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'));
insert into public.cr_golf_courses(id,name,country,location,holes,source_name,source_url,active)
values('norefjell-gk','Norefjell Golfklubb','NO','Noresund, Krødsherad',18,'Norefjell Golfklubb','https://www.norefjell-golf.no/banen/',true)
on conflict(id) do update set name=excluded.name,location=excluded.location,holes=18,source_name=excluded.source_name,source_url=excluded.source_url,active=true,updated_at=now();
insert into public.cr_golf_holes(course_id,hole_no,par,stroke_index,tee_39_m,tee_43_m,tee_48_m,tee_50_m)
values ('norefjell-gk',1,3,17,101,101,101,101),
('norefjell-gk',2,4,5,188,250,264,278),
('norefjell-gk',3,5,9,331,401,446,455),
('norefjell-gk',4,4,7,243,286,325,335),
('norefjell-gk',5,4,1,213,264,315,320),
('norefjell-gk',6,4,13,215,224,257,265),
('norefjell-gk',7,5,15,370,380,418,425),
('norefjell-gk',8,4,3,284,308,331,348),
('norefjell-gk',9,4,11,177,225,288,297),
('norefjell-gk',10,3,4,130,130,130,130),
('norefjell-gk',11,3,12,124,125,130,132),
('norefjell-gk',12,4,6,280,323,365,380),
('norefjell-gk',13,4,18,210,218,223,228),
('norefjell-gk',14,3,2,145,145,160,160),
('norefjell-gk',15,4,8,222,222,264,274),
('norefjell-gk',16,4,16,186,186,221,231),
('norefjell-gk',17,3,14,121,121,121,121),
('norefjell-gk',18,5,10,364,411,443,471)
on conflict(course_id,hole_no) do update set par=excluded.par,stroke_index=excluded.stroke_index,
 tee_39_m=excluded.tee_39_m,tee_43_m=excluded.tee_43_m,tee_48_m=excluded.tee_48_m,tee_50_m=excluded.tee_50_m,updated_at=now();
NOTIFY pgrst,'reload schema';


-- v9.6: valgt utslagssted per golfrunde
alter table public.cr_workout_sessions
  add column if not exists golf_tee text;

NOTIFY pgrst, 'reload schema';
