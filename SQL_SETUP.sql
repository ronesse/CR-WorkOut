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


-- ================================================================
-- v9.7: dynamiske utslagssteder per golfbane
-- ================================================================

create table if not exists public.cr_golf_tees (
  course_id text not null references public.cr_golf_courses(id) on delete cascade,
  tee_code text not null,
  tee_name text not null,
  sort_order integer not null default 100,
  total_length_m integer,
  active boolean not null default true,
  notes text,
  primary key(course_id,tee_code)
);

create table if not exists public.cr_golf_hole_lengths (
  course_id text not null,
  hole_no integer not null,
  tee_code text not null,
  length_m integer,
  primary key(course_id,hole_no,tee_code),
  foreign key(course_id,hole_no)
    references public.cr_golf_holes(course_id,hole_no) on delete cascade,
  foreign key(course_id,tee_code)
    references public.cr_golf_tees(course_id,tee_code) on delete cascade
);

alter table public.cr_golf_tees enable row level security;
alter table public.cr_golf_hole_lengths enable row level security;

drop policy if exists "golf_tees_read" on public.cr_golf_tees;
create policy "golf_tees_read" on public.cr_golf_tees
for select to authenticated using(true);

drop policy if exists "golf_hole_lengths_read" on public.cr_golf_hole_lengths;
create policy "golf_hole_lengths_read" on public.cr_golf_hole_lengths
for select to authenticated using(true);

drop policy if exists "golf_tees_coach_all" on public.cr_golf_tees;
create policy "golf_tees_coach_all" on public.cr_golf_tees
for all to authenticated
using(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'))
with check(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'));

drop policy if exists "golf_hole_lengths_coach_all" on public.cr_golf_hole_lengths;
create policy "golf_hole_lengths_coach_all" on public.cr_golf_hole_lengths
for all to authenticated
using(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'))
with check(exists(select 1 from public.cr_profiles p where p.id=auth.uid() and p.role='coach'));

-- Migrer Norefjell fra tidligere tee-kolonner
insert into public.cr_golf_tees(course_id,tee_code,tee_name,sort_order,total_length_m)
values
('norefjell-gk','39','39',10,null),
('norefjell-gk','43','43',20,null),
('norefjell-gk','48','48',30,null),
('norefjell-gk','50','50',40,null)
on conflict(course_id,tee_code) do update set
 tee_name=excluded.tee_name,sort_order=excluded.sort_order,active=true;

insert into public.cr_golf_hole_lengths(course_id,hole_no,tee_code,length_m)
select course_id,hole_no,'39',tee_39_m from public.cr_golf_holes
where course_id='norefjell-gk' and tee_39_m is not null
on conflict(course_id,hole_no,tee_code) do update set length_m=excluded.length_m;

insert into public.cr_golf_hole_lengths(course_id,hole_no,tee_code,length_m)
select course_id,hole_no,'43',tee_43_m from public.cr_golf_holes
where course_id='norefjell-gk' and tee_43_m is not null
on conflict(course_id,hole_no,tee_code) do update set length_m=excluded.length_m;

insert into public.cr_golf_hole_lengths(course_id,hole_no,tee_code,length_m)
select course_id,hole_no,'48',tee_48_m from public.cr_golf_holes
where course_id='norefjell-gk' and tee_48_m is not null
on conflict(course_id,hole_no,tee_code) do update set length_m=excluded.length_m;

insert into public.cr_golf_hole_lengths(course_id,hole_no,tee_code,length_m)
select course_id,hole_no,'50',tee_50_m from public.cr_golf_holes
where course_id='norefjell-gk' and tee_50_m is not null
on conflict(course_id,hole_no,tee_code) do update set length_m=excluded.length_m;

-- Grenland & Omegn Golfklubb – gjeldende Par 71
insert into public.cr_golf_courses
(id,name,country,location,holes,source_name,source_url,active)
values
('grenland-og-omegn-gk','Grenland & Omegn Golfklubb','NO','Skien, Telemark',18,
 'Grenland & Omegn Golfklubb','https://grenlandgolf.no/nyheter/baneguide/',true)
on conflict(id) do update set
 name=excluded.name,location=excluded.location,holes=18,
 source_name=excluded.source_name,source_url=excluded.source_url,
 active=true,updated_at=now();

insert into public.cr_golf_holes(course_id,hole_no,par,stroke_index)
values
('grenland-og-omegn-gk',1,4,11),
('grenland-og-omegn-gk',2,4,5),
('grenland-og-omegn-gk',3,3,17),
('grenland-og-omegn-gk',4,5,13),
('grenland-og-omegn-gk',5,4,9),
('grenland-og-omegn-gk',6,3,7),
('grenland-og-omegn-gk',7,4,1),
('grenland-og-omegn-gk',8,4,3),
('grenland-og-omegn-gk',9,4,15),
('grenland-og-omegn-gk',10,3,2),
('grenland-og-omegn-gk',11,5,14),
('grenland-og-omegn-gk',12,4,6),
('grenland-og-omegn-gk',13,4,10),
('grenland-og-omegn-gk',14,4,8),
('grenland-og-omegn-gk',15,3,16),
('grenland-og-omegn-gk',16,5,18),
('grenland-og-omegn-gk',17,4,4),
('grenland-og-omegn-gk',18,4,12)
on conflict(course_id,hole_no) do update set
 par=excluded.par,stroke_index=excluded.stroke_index,updated_at=now();

-- Gjeldende utslagssteder i 2026.
-- Tee 31 finnes i den offisielle slope-tabellen, men klubbens baneguide
-- publiserer ikke hull-for-hull-lengder for Tee 31. Derfor lagres tee-en,
-- men uten oppdiktede lengder.
insert into public.cr_golf_tees
(course_id,tee_code,tee_name,sort_order,total_length_m,notes)
values
('grenland-og-omegn-gk','31','31',10,null,'Offisiell slope-tee; hullengder ikke publisert i baneguiden'),
('grenland-og-omegn-gk','48','48',20,4799,'Rød / fysisk teekloss kan være merket 50'),
('grenland-og-omegn-gk','53','53',30,5325,'Blå / fysisk teekloss kan være merket 55'),
('grenland-og-omegn-gk','57','57',40,5650,'Gul / Gimmie kan vise 58'),
('grenland-og-omegn-gk','59','59',50,5888,'Hvit / Gimmie kan vise 60')
on conflict(course_id,tee_code) do update set
 tee_name=excluded.tee_name,sort_order=excluded.sort_order,
 total_length_m=excluded.total_length_m,notes=excluded.notes,active=true;

insert into public.cr_golf_hole_lengths(course_id,hole_no,tee_code,length_m)
values
('grenland-og-omegn-gk',1,'48',283),
('grenland-og-omegn-gk',2,'48',285),
('grenland-og-omegn-gk',3,'48',100),
('grenland-og-omegn-gk',4,'48',367),
('grenland-og-omegn-gk',5,'48',272),
('grenland-og-omegn-gk',6,'48',124),
('grenland-og-omegn-gk',7,'48',281),
('grenland-og-omegn-gk',8,'48',299),
('grenland-og-omegn-gk',9,'48',257),
('grenland-og-omegn-gk',10,'48',123),
('grenland-og-omegn-gk',11,'48',359),
('grenland-og-omegn-gk',12,'48',322),
('grenland-og-omegn-gk',13,'48',271),
('grenland-og-omegn-gk',14,'48',333),
('grenland-og-omegn-gk',15,'48',106),
('grenland-og-omegn-gk',16,'48',384),
('grenland-og-omegn-gk',17,'48',305),
('grenland-og-omegn-gk',18,'48',328),
('grenland-og-omegn-gk',1,'53',327),
('grenland-og-omegn-gk',2,'53',321),
('grenland-og-omegn-gk',3,'53',100),
('grenland-og-omegn-gk',4,'53',450),
('grenland-og-omegn-gk',5,'53',317),
('grenland-og-omegn-gk',6,'53',144),
('grenland-og-omegn-gk',7,'53',325),
('grenland-og-omegn-gk',8,'53',305),
('grenland-og-omegn-gk',9,'53',305),
('grenland-og-omegn-gk',10,'53',133),
('grenland-og-omegn-gk',11,'53',393),
('grenland-og-omegn-gk',12,'53',338),
('grenland-og-omegn-gk',13,'53',276),
('grenland-og-omegn-gk',14,'53',333),
('grenland-og-omegn-gk',15,'53',133),
('grenland-og-omegn-gk',16,'53',445),
('grenland-og-omegn-gk',17,'53',342),
('grenland-og-omegn-gk',18,'53',338),
('grenland-og-omegn-gk',1,'57',330),
('grenland-og-omegn-gk',2,'57',335),
('grenland-og-omegn-gk',3,'57',120),
('grenland-og-omegn-gk',4,'57',455),
('grenland-og-omegn-gk',5,'57',326),
('grenland-og-omegn-gk',6,'57',144),
('grenland-og-omegn-gk',7,'57',339),
('grenland-og-omegn-gk',8,'57',356),
('grenland-og-omegn-gk',9,'57',317),
('grenland-og-omegn-gk',10,'57',144),
('grenland-og-omegn-gk',11,'57',429),
('grenland-og-omegn-gk',12,'57',352),
('grenland-og-omegn-gk',13,'57',320),
('grenland-og-omegn-gk',14,'57',384),
('grenland-og-omegn-gk',15,'57',133),
('grenland-og-omegn-gk',16,'57',458),
('grenland-og-omegn-gk',17,'57',350),
('grenland-og-omegn-gk',18,'57',358),
('grenland-og-omegn-gk',1,'59',338),
('grenland-og-omegn-gk',2,'59',358),
('grenland-og-omegn-gk',3,'59',120),
('grenland-og-omegn-gk',4,'59',455),
('grenland-og-omegn-gk',5,'59',336),
('grenland-og-omegn-gk',6,'59',170),
('grenland-og-omegn-gk',7,'59',379),
('grenland-og-omegn-gk',8,'59',366),
('grenland-og-omegn-gk',9,'59',322),
('grenland-og-omegn-gk',10,'59',152),
('grenland-og-omegn-gk',11,'59',429),
('grenland-og-omegn-gk',12,'59',379),
('grenland-og-omegn-gk',13,'59',351),
('grenland-og-omegn-gk',14,'59',384),
('grenland-og-omegn-gk',15,'59',147),
('grenland-og-omegn-gk',16,'59',487),
('grenland-og-omegn-gk',17,'59',357),
('grenland-og-omegn-gk',18,'59',358)
on conflict(course_id,hole_no,tee_code) do update set length_m=excluded.length_m;

NOTIFY pgrst,'reload schema';


-- v9.8.4: Kroppsvekt Dag 1/2/3
-- CR-Workout v9.8.4
-- Registrerer de tre nye kroppsvektprogrammene i Supabase.
-- Kjør hele denne filen én gang i Supabase SQL Editor.

insert into public.cr_programs
  (id,name,description,icon,active,sort_order)
values
  ('bodyweight_day1','Kroppsvekt Dag 1','9 øvelser · 3 runder · egen kroppsvekt','🏋️',true,100),
  ('bodyweight_day2','Kroppsvekt Dag 2','9 øvelser · 3 runder · egen kroppsvekt','🏋️',true,110),
  ('bodyweight_day3','Kroppsvekt Dag 3','9 øvelser · 3 runder · egen kroppsvekt','🏋️',true,120)
on conflict (id) do update set
  name=excluded.name,
  description=excluded.description,
  icon=excluded.icon,
  active=true,
  sort_order=excluded.sort_order;

notify pgrst, 'reload schema';



-- CR-Workout v9.8.5
-- Sikrer at Kroppsvekt Dag 1/2/3 finnes i programtabellen og har 27 aktiviteter hver.
-- Kjør hele scriptet én gang i Supabase SQL Editor.

insert into public.cr_programs
  (id,name,description,icon,active,sort_order)
values
  ('bodyweight_day1','Kroppsvekt Dag 1','9 øvelser · 3 runder · egen kroppsvekt','🏋️',true,100),
  ('bodyweight_day2','Kroppsvekt Dag 2','9 øvelser · 3 runder · egen kroppsvekt','🏋️',true,110),
  ('bodyweight_day3','Kroppsvekt Dag 3','9 øvelser · 3 runder · egen kroppsvekt','🏋️',true,120)
on conflict (id) do update set
  name=excluded.name, description=excluded.description, icon=excluded.icon,
  active=true, sort_order=excluded.sort_order;

delete from public.cr_program_activities
where program_id in ('bodyweight_day1','bodyweight_day2','bodyweight_day3');

insert into public.cr_program_activities
(program_id,group_name,order_no,round_no,activity,reps,load,description)
values
('bodyweight_day1','Main',1,1,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day1','Main',2,1,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day1','Main',3,1,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day1','Main',4,1,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day1','Main',5,1,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day1','Main',6,1,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day1','Main',7,1,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day1','Main',8,1,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day1','Main',9,1,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day1','Main',10,2,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day1','Main',11,2,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day1','Main',12,2,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day1','Main',13,2,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day1','Main',14,2,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day1','Main',15,2,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day1','Main',16,2,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day1','Main',17,2,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day1','Main',18,2,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day1','Main',19,3,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day1','Main',20,3,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day1','Main',21,3,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day1','Main',22,3,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day1','Main',23,3,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day1','Main',24,3,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day1','Main',25,3,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day1','Main',26,3,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day1','Main',27,3,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day2','Main',1,1,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day2','Main',2,1,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day2','Main',3,1,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day2','Main',4,1,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day2','Main',5,1,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day2','Main',6,1,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day2','Main',7,1,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day2','Main',8,1,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day2','Main',9,1,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day2','Main',10,2,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day2','Main',11,2,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day2','Main',12,2,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day2','Main',13,2,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day2','Main',14,2,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day2','Main',15,2,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day2','Main',16,2,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day2','Main',17,2,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day2','Main',18,2,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day2','Main',19,3,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day2','Main',20,3,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day2','Main',21,3,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day2','Main',22,3,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day2','Main',23,3,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day2','Main',24,3,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day2','Main',25,3,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day2','Main',26,3,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day2','Main',27,3,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day3','Main',1,1,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day3','Main',2,1,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day3','Main',3,1,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day3','Main',4,1,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day3','Main',5,1,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day3','Main',6,1,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day3','Main',7,1,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day3','Main',8,1,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day3','Main',9,1,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day3','Main',10,2,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day3','Main',11,2,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day3','Main',12,2,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day3','Main',13,2,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day3','Main',14,2,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day3','Main',15,2,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day3','Main',16,2,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day3','Main',17,2,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day3','Main',18,2,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.'),
('bodyweight_day3','Main',19,3,'Jump squat','10–15','','Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn.'),
('bodyweight_day3','Main',20,3,'Push-ups','10–20','','Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups.'),
('bodyweight_day3','Main',21,3,'Pull-ups / assisterte pull-ups','6–12','','Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt.'),
('bodyweight_day3','Main',22,3,'Gående utfall','10–15 per bein','','Langt steg og kontrollert knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall.'),
('bodyweight_day3','Main',23,3,'Pike push-ups','8–12','','Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg.'),
('bodyweight_day3','Main',24,3,'Omvendt roing','10–15','','Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant.'),
('bodyweight_day3','Main',25,3,'Ett-beins glute bridge','10–15 per bein','','Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen.'),
('bodyweight_day3','Main',26,3,'Planke','30–60 sek','','Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft.'),
('bodyweight_day3','Main',27,3,'Sideplanke','20–40 sek per side','','Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev.');

notify pgrst, 'reload schema';

-- Kontroll: forventet 27 aktiviteter per program.
select program_id, count(*) as activities
from public.cr_program_activities
where program_id in ('bodyweight_day1','bodyweight_day2','bodyweight_day3')
group by program_id
order by program_id;


-- CR-Workout v9.8.6 – Muskelvekst Dag 1–5
-- Kjør hele scriptet én gang i Supabase SQL Editor.

insert into public.cr_programs
(id,name,description,icon,active,sort_order)
values
('muscle_growth_day1','Muskelvekst Dag 1','Bryst, skuldre og triceps · 25 sett · ca. 45 sek pause','🏋️',true,130),
('muscle_growth_day2','Muskelvekst Dag 2','Bein og mage · 25 sett · ca. 45 sek pause','🏋️',true,140),
('muscle_growth_day3','Muskelvekst Dag 3','Rygg og biceps · 21 sett · ca. 45 sek pause','🏋️',true,150),
('muscle_growth_day4','Muskelvekst Dag 4','Bein og mage · 25 sett · ca. 45 sek pause','🏋️',true,160),
('muscle_growth_day5','Muskelvekst Dag 5','Helkropp · 26 sett · ca. 45 sek pause','🏋️',true,170)
on conflict (id) do update set
 name=excluded.name,description=excluded.description,icon=excluded.icon,active=true,sort_order=excluded.sort_order;

delete from public.cr_program_activities where program_id in ('muscle_growth_day1','muscle_growth_day2','muscle_growth_day3','muscle_growth_day4','muscle_growth_day5');

insert into public.cr_program_activities
(program_id,group_name,order_no,round_no,activity,reps,load,description)
values
('muscle_growth_day1','Main',1,1,'Brystpress flatbenk','8–10','','Sett 1 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',2,2,'Brystpress flatbenk','8–10','','Sett 2 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',3,3,'Brystpress flatbenk','8–10','','Sett 3 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',4,4,'Brystpress flatbenk','8–10','','Sett 4 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',5,5,'Brystpress flatbenk','8–10','','Sett 5 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',6,1,'Skrå brystpress','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',7,2,'Skrå brystpress','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',8,3,'Skrå brystpress','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',9,4,'Skrå brystpress','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',10,1,'Brystpress fra gulv','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',11,2,'Brystpress fra gulv','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',12,3,'Brystpress fra gulv','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',13,1,'Stående skulderpress','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',14,2,'Stående skulderpress','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',15,3,'Stående skulderpress','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',16,4,'Stående skulderpress','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',17,1,'Sidehev','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',18,2,'Sidehev','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',19,3,'Sidehev','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',20,1,'Enarms triceps press','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',21,2,'Enarms triceps press','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',22,3,'Enarms triceps press','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',23,1,'Dips på benk (eller stol)','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',24,2,'Dips på benk (eller stol)','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',25,3,'Dips på benk (eller stol)','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',1,1,'Goblet squat','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',2,2,'Goblet squat','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',3,3,'Goblet squat','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',4,4,'Goblet squat','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',5,1,'Strake markløft','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',6,2,'Strake markløft','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',7,3,'Strake markløft','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',8,4,'Strake markløft','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',9,1,'Utfall bakover','8–10 per bein','','Sett 1 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',10,2,'Utfall bakover','8–10 per bein','','Sett 2 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',11,3,'Utfall bakover','8–10 per bein','','Sett 3 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',12,4,'Utfall bakover','8–10 per bein','','Sett 4 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',13,1,'Markløft','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',14,2,'Markløft','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',15,3,'Markløft','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',16,1,'Tåhev','20','','Sett 1 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',17,2,'Tåhev','20','','Sett 2 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',18,3,'Tåhev','20','','Sett 3 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',19,4,'Tåhev','20','','Sett 4 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',20,1,'Russian twist','20','','Sett 1 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',21,2,'Russian twist','20','','Sett 2 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',22,3,'Russian twist','20','','Sett 3 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',23,1,'Liggende beinhev','20','','Sett 1 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',24,2,'Liggende beinhev','20','','Sett 2 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',25,3,'Liggende beinhev','20','','Sett 3 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',1,1,'Fremoverlent roing','8–12','','Sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',2,2,'Fremoverlent roing','8–12','','Sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',3,3,'Fremoverlent roing','8–12','','Sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',4,4,'Fremoverlent roing','8–12','','Sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',5,1,'En-arms roing','8–12 per side','','Sett 1 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',6,2,'En-arms roing','8–12 per side','','Sett 2 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',7,3,'En-arms roing','8–12 per side','','Sett 3 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',8,4,'En-arms roing','8–12 per side','','Sett 4 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',9,1,'Pullover','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',10,2,'Pullover','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',11,3,'Pullover','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',12,1,'Renegade row','8–12','','Sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',13,2,'Renegade row','8–12','','Sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',14,3,'Renegade row','8–12','','Sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',15,4,'Renegade row','8–12','','Sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',16,1,'Bicepscurl','10–15','','Sett 1 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',17,2,'Bicepscurl','10–15','','Sett 2 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',18,3,'Bicepscurl','10–15','','Sett 3 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',19,1,'Hammercurl','10–15','','Sett 1 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',20,2,'Hammercurl','10–15','','Sett 2 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',21,3,'Hammercurl','10–15','','Sett 3 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',1,1,'Knebøy','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',2,2,'Knebøy','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',3,3,'Knebøy','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',4,4,'Knebøy','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',5,1,'Markløft','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',6,2,'Markløft','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',7,3,'Markløft','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',8,4,'Markløft','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',9,1,'Splitt-knebøy','8–12 per side','','Sett 1 av 3 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',10,2,'Splitt-knebøy','8–12 per side','','Sett 2 av 3 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',11,3,'Splitt-knebøy','8–12 per side','','Sett 3 av 3 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',12,1,'Hip Thrust','10–15','','Sett 1 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',13,2,'Hip Thrust','10–15','','Sett 2 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',14,3,'Hip Thrust','10–15','','Sett 3 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',15,4,'Hip Thrust','10–15','','Sett 4 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',16,1,'Tåhev','20','','Sett 1 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',17,2,'Tåhev','20','','Sett 2 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',18,3,'Tåhev','20','','Sett 3 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',19,4,'Tåhev','20','','Sett 4 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',20,1,'Sidebøy','15 per side','','Sett 1 av 3 · mål 15 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',21,2,'Sidebøy','15 per side','','Sett 2 av 3 · mål 15 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',22,3,'Sidebøy','15 per side','','Sett 3 av 3 · mål 15 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',23,1,'Planken','30 sek','','Sett 1 av 3 · mål 30 sek reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',24,2,'Planken','30 sek','','Sett 2 av 3 · mål 30 sek reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',25,3,'Planken','30 sek','','Sett 3 av 3 · mål 30 sek reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',1,1,'Goblet squat','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',2,2,'Goblet squat','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',3,3,'Goblet squat','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',4,4,'Goblet squat','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',5,1,'Hip Thrust','10–15','','Sett 1 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',6,2,'Hip Thrust','10–15','','Sett 2 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',7,3,'Hip Thrust','10–15','','Sett 3 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',8,4,'Hip Thrust','10–15','','Sett 4 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',9,1,'Renegade row','8–12','','Sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',10,2,'Renegade row','8–12','','Sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',11,3,'Renegade row','8–12','','Sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',12,4,'Renegade row','8–12','','Sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',13,1,'Arnold Press','8–10','','Sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',14,2,'Arnold Press','8–10','','Sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',15,3,'Arnold Press','8–10','','Sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',16,4,'Arnold Press','8–10','','Sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',17,1,'Skrå brystpress','8–12','','Sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',18,2,'Skrå brystpress','8–12','','Sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',19,3,'Skrå brystpress','8–12','','Sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',20,4,'Skrå brystpress','8–12','','Sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',21,1,'Roing over benk','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',22,2,'Roing over benk','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',23,3,'Roing over benk','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',24,1,'Dips på benk (eller stol)','8–12','','Sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',25,2,'Dips på benk (eller stol)','8–12','','Sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',26,3,'Dips på benk (eller stol)','8–12','','Sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR');

notify pgrst, 'reload schema';

select p.id,p.name,count(a.*) as activities
from public.cr_programs p
left join public.cr_program_activities a on a.program_id=p.id
where p.id in ('muscle_growth_day1','muscle_growth_day2','muscle_growth_day3','muscle_growth_day4','muscle_growth_day5')
group by p.id,p.name
order by p.id;


-- CR-Workout v9.8.7 – rettet rekkefølge for Muskelvekst Dag 1–5
-- Sett behandles som runder:
-- Runde 1 = sett 1 av alle øvelser, deretter runde 2 = sett 2 av alle øvelser osv.
-- Kjør hele scriptet én gang i Supabase SQL Editor.

delete from public.cr_program_activities
where program_id in ('muscle_growth_day1','muscle_growth_day2','muscle_growth_day3','muscle_growth_day4','muscle_growth_day5');

insert into public.cr_program_activities
(program_id,group_name,order_no,round_no,activity,reps,load,description)
values
('muscle_growth_day1','Main',1,1,'Brystpress flatbenk','8–10','','Runde 1 · sett 1 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',2,1,'Skrå brystpress','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',3,1,'Brystpress fra gulv','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',4,1,'Stående skulderpress','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',5,1,'Sidehev','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',6,1,'Enarms triceps press','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',7,1,'Dips på benk (eller stol)','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',8,2,'Brystpress flatbenk','8–10','','Runde 2 · sett 2 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',9,2,'Skrå brystpress','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',10,2,'Brystpress fra gulv','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',11,2,'Stående skulderpress','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',12,2,'Sidehev','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',13,2,'Enarms triceps press','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',14,2,'Dips på benk (eller stol)','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',15,3,'Brystpress flatbenk','8–10','','Runde 3 · sett 3 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',16,3,'Skrå brystpress','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',17,3,'Brystpress fra gulv','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',18,3,'Stående skulderpress','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',19,3,'Sidehev','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',20,3,'Enarms triceps press','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',21,3,'Dips på benk (eller stol)','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',22,4,'Brystpress flatbenk','8–10','','Runde 4 · sett 4 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',23,4,'Skrå brystpress','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',24,4,'Stående skulderpress','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day1','Main',25,5,'Brystpress flatbenk','8–10','','Runde 5 · sett 5 av 5 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',1,1,'Goblet squat','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',2,1,'Strake markløft','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',3,1,'Utfall bakover','8–10 per bein','','Runde 1 · sett 1 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',4,1,'Markløft','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',5,1,'Tåhev','20','','Runde 1 · sett 1 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',6,1,'Russian twist','20','','Runde 1 · sett 1 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',7,1,'Liggende beinhev','20','','Runde 1 · sett 1 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',8,2,'Goblet squat','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',9,2,'Strake markløft','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',10,2,'Utfall bakover','8–10 per bein','','Runde 2 · sett 2 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',11,2,'Markløft','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',12,2,'Tåhev','20','','Runde 2 · sett 2 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',13,2,'Russian twist','20','','Runde 2 · sett 2 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',14,2,'Liggende beinhev','20','','Runde 2 · sett 2 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',15,3,'Goblet squat','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',16,3,'Strake markløft','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',17,3,'Utfall bakover','8–10 per bein','','Runde 3 · sett 3 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',18,3,'Markløft','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',19,3,'Tåhev','20','','Runde 3 · sett 3 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',20,3,'Russian twist','20','','Runde 3 · sett 3 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',21,3,'Liggende beinhev','20','','Runde 3 · sett 3 av 3 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',22,4,'Goblet squat','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',23,4,'Strake markløft','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',24,4,'Utfall bakover','8–10 per bein','','Runde 4 · sett 4 av 4 · mål 8–10 per bein reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day2','Main',25,4,'Tåhev','20','','Runde 4 · sett 4 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',1,1,'Fremoverlent roing','8–12','','Runde 1 · sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',2,1,'En-arms roing','8–12 per side','','Runde 1 · sett 1 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',3,1,'Pullover','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',4,1,'Renegade row','8–12','','Runde 1 · sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',5,1,'Bicepscurl','10–15','','Runde 1 · sett 1 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',6,1,'Hammercurl','10–15','','Runde 1 · sett 1 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',7,2,'Fremoverlent roing','8–12','','Runde 2 · sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',8,2,'En-arms roing','8–12 per side','','Runde 2 · sett 2 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',9,2,'Pullover','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',10,2,'Renegade row','8–12','','Runde 2 · sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',11,2,'Bicepscurl','10–15','','Runde 2 · sett 2 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',12,2,'Hammercurl','10–15','','Runde 2 · sett 2 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',13,3,'Fremoverlent roing','8–12','','Runde 3 · sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',14,3,'En-arms roing','8–12 per side','','Runde 3 · sett 3 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',15,3,'Pullover','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',16,3,'Renegade row','8–12','','Runde 3 · sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',17,3,'Bicepscurl','10–15','','Runde 3 · sett 3 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',18,3,'Hammercurl','10–15','','Runde 3 · sett 3 av 3 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',19,4,'Fremoverlent roing','8–12','','Runde 4 · sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',20,4,'En-arms roing','8–12 per side','','Runde 4 · sett 4 av 4 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day3','Main',21,4,'Renegade row','8–12','','Runde 4 · sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',1,1,'Knebøy','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',2,1,'Markløft','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',3,1,'Splitt-knebøy','8–12 per side','','Runde 1 · sett 1 av 3 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',4,1,'Hip Thrust','10–15','','Runde 1 · sett 1 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',5,1,'Tåhev','20','','Runde 1 · sett 1 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',6,1,'Sidebøy','15 per side','','Runde 1 · sett 1 av 3 · mål 15 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',7,1,'Planken','30 sek','','Runde 1 · sett 1 av 3 · mål 30 sek reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',8,2,'Knebøy','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',9,2,'Markløft','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',10,2,'Splitt-knebøy','8–12 per side','','Runde 2 · sett 2 av 3 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',11,2,'Hip Thrust','10–15','','Runde 2 · sett 2 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',12,2,'Tåhev','20','','Runde 2 · sett 2 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',13,2,'Sidebøy','15 per side','','Runde 2 · sett 2 av 3 · mål 15 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',14,2,'Planken','30 sek','','Runde 2 · sett 2 av 3 · mål 30 sek reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',15,3,'Knebøy','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',16,3,'Markløft','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',17,3,'Splitt-knebøy','8–12 per side','','Runde 3 · sett 3 av 3 · mål 8–12 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',18,3,'Hip Thrust','10–15','','Runde 3 · sett 3 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',19,3,'Tåhev','20','','Runde 3 · sett 3 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',20,3,'Sidebøy','15 per side','','Runde 3 · sett 3 av 3 · mål 15 per side reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',21,3,'Planken','30 sek','','Runde 3 · sett 3 av 3 · mål 30 sek reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',22,4,'Knebøy','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',23,4,'Markløft','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',24,4,'Hip Thrust','10–15','','Runde 4 · sett 4 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day4','Main',25,4,'Tåhev','20','','Runde 4 · sett 4 av 4 · mål 20 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',1,1,'Goblet squat','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',2,1,'Hip Thrust','10–15','','Runde 1 · sett 1 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',3,1,'Renegade row','8–12','','Runde 1 · sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',4,1,'Arnold Press','8–10','','Runde 1 · sett 1 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',5,1,'Skrå brystpress','8–12','','Runde 1 · sett 1 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',6,1,'Roing over benk','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',7,1,'Dips på benk (eller stol)','8–12','','Runde 1 · sett 1 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',8,2,'Goblet squat','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',9,2,'Hip Thrust','10–15','','Runde 2 · sett 2 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',10,2,'Renegade row','8–12','','Runde 2 · sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',11,2,'Arnold Press','8–10','','Runde 2 · sett 2 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',12,2,'Skrå brystpress','8–12','','Runde 2 · sett 2 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',13,2,'Roing over benk','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',14,2,'Dips på benk (eller stol)','8–12','','Runde 2 · sett 2 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',15,3,'Goblet squat','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',16,3,'Hip Thrust','10–15','','Runde 3 · sett 3 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',17,3,'Renegade row','8–12','','Runde 3 · sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',18,3,'Arnold Press','8–10','','Runde 3 · sett 3 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',19,3,'Skrå brystpress','8–12','','Runde 3 · sett 3 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',20,3,'Roing over benk','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',21,3,'Dips på benk (eller stol)','8–12','','Runde 3 · sett 3 av 3 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',22,4,'Goblet squat','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',23,4,'Hip Thrust','10–15','','Runde 4 · sett 4 av 4 · mål 10–15 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',24,4,'Renegade row','8–12','','Runde 4 · sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',25,4,'Arnold Press','8–10','','Runde 4 · sett 4 av 4 · mål 8–10 reps · ca. 45 sek pause · ca. 1–2 RIR'),
('muscle_growth_day5','Main',26,4,'Skrå brystpress','8–12','','Runde 4 · sett 4 av 4 · mål 8–12 reps · ca. 45 sek pause · ca. 1–2 RIR');

notify pgrst, 'reload schema';

select program_id,round_no,order_no,activity,reps
from public.cr_program_activities
where program_id in ('muscle_growth_day1','muscle_growth_day2','muscle_growth_day3','muscle_growth_day4','muscle_growth_day5')
order by program_id,order_no;


-- CR-Workout v9.8.9 – TIF Viking Off Season
-- Seks programmer. Sett = runde.
-- Kjør hele scriptet én gang i Supabase SQL Editor.

insert into public.cr_programs
(id,name,description,icon,active,sort_order)
values
('tif_offseason_1_v1','TIF Viking – Økt 1 Underkropp variant 1','TIF Viking – Off Season','🏐',true,200),
('tif_offseason_1_v2','TIF Viking – Økt 1 Underkropp variant 2','TIF Viking – Off Season','🏐',true,210),
('tif_offseason_2_v1','TIF Viking – Økt 2 Overkropp variant 1','TIF Viking – Off Season','🏐',true,220),
('tif_offseason_2_v2','TIF Viking – Økt 2 Overkropp variant 2','TIF Viking – Off Season','🏐',true,230),
('tif_offseason_3_v1','TIF Viking – Økt 3 Split Over/underkropp variant 1','TIF Viking – Off Season','🏐',true,240),
('tif_offseason_3_v2','TIF Viking – Økt 3 Split Over/underkropp variant 2','TIF Viking – Off Season','🏐',true,250)
on conflict (id) do update set
 name=excluded.name,description=excluded.description,icon=excluded.icon,active=true,sort_order=excluded.sort_order;

delete from public.cr_program_activities where program_id in ('tif_offseason_1_v1','tif_offseason_1_v2','tif_offseason_2_v1','tif_offseason_2_v2','tif_offseason_3_v1','tif_offseason_3_v2');

insert into public.cr_program_activities
(program_id,group_name,order_no,round_no,activity,reps,load,description)
values
('tif_offseason_1_v1','Main',1,1,'CMJ','2 hopp','','Runde 1 · Maks høyde, kort kontakttid'),
('tif_offseason_1_v1','Main',2,1,'Knebøy','4 reps 80–85 % @ 1-2 RIR','','Runde 1 · Rolig ned, tempo opp'),
('tif_offseason_1_v1','Main',3,1,'Bulgarsk splittbøy','6 reps per fot (2 RIR)','','Runde 1 · Bryst opp, lavt kne'),
('tif_offseason_1_v1','Main',4,1,'Rumensk markløft / leg curl','5 reps (2 RIR)','','Runde 1 · Kontrollert'),
('tif_offseason_1_v1','Main',5,1,'KB goblet squat','5 reps (2 RIR)','','Runde 1 · Kontrollert'),
('tif_offseason_1_v1','Main',6,1,'Et fots tåhev','8 reps per fot (2 RIR)','','Runde 1 · Kontrollert (ROM)'),
('tif_offseason_1_v1','Main',7,1,'Depth Landing','3 reps','','Runde 1 · Stabil landing'),
('tif_offseason_1_v1','Main',8,2,'CMJ','2 hopp','','Runde 2 · Maks høyde, kort kontakttid'),
('tif_offseason_1_v1','Main',9,2,'Knebøy','4 reps 80–85 % @ 1-2 RIR','','Runde 2 · Rolig ned, tempo opp'),
('tif_offseason_1_v1','Main',10,2,'Bulgarsk splittbøy','6 reps per fot (2 RIR)','','Runde 2 · Bryst opp, lavt kne'),
('tif_offseason_1_v1','Main',11,2,'Rumensk markløft / leg curl','5 reps (2 RIR)','','Runde 2 · Kontrollert'),
('tif_offseason_1_v1','Main',12,2,'KB goblet squat','5 reps (2 RIR)','','Runde 2 · Kontrollert'),
('tif_offseason_1_v1','Main',13,2,'Et fots tåhev','8 reps per fot (2 RIR)','','Runde 2 · Kontrollert (ROM)'),
('tif_offseason_1_v1','Main',14,2,'Depth Landing','3 reps','','Runde 2 · Stabil landing'),
('tif_offseason_1_v1','Main',15,3,'CMJ','2 hopp','','Runde 3 · Maks høyde, kort kontakttid'),
('tif_offseason_1_v1','Main',16,3,'Knebøy','4 reps 80–85 % @ 1-2 RIR','','Runde 3 · Rolig ned, tempo opp'),
('tif_offseason_1_v1','Main',17,3,'Bulgarsk splittbøy','6 reps per fot (2 RIR)','','Runde 3 · Bryst opp, lavt kne'),
('tif_offseason_1_v1','Main',18,3,'Rumensk markløft / leg curl','5 reps (2 RIR)','','Runde 3 · Kontrollert'),
('tif_offseason_1_v1','Main',19,3,'KB goblet squat','5 reps (2 RIR)','','Runde 3 · Kontrollert'),
('tif_offseason_1_v1','Main',20,3,'Et fots tåhev','8 reps per fot (2 RIR)','','Runde 3 · Kontrollert (ROM)'),
('tif_offseason_1_v1','Main',21,3,'Depth Landing','3 reps','','Runde 3 · Stabil landing'),
('tif_offseason_1_v1','Main',22,4,'Knebøy','4 reps 80–85 % @ 1-2 RIR','','Runde 4 · Rolig ned, tempo opp'),
('tif_offseason_1_v1','Main',23,4,'Bulgarsk splittbøy','6 reps per fot (2 RIR)','','Runde 4 · Bryst opp, lavt kne'),
('tif_offseason_1_v1','Main',24,4,'Rumensk markløft / leg curl','5 reps (2 RIR)','','Runde 4 · Kontrollert'),
('tif_offseason_1_v1','Main',25,4,'KB goblet squat','5 reps (2 RIR)','','Runde 4 · Kontrollert'),
('tif_offseason_1_v2','Main',1,1,'Box jump','2 hopp','','Runde 1 · Maks høyde, kort kontakttid på boks'),
('tif_offseason_1_v2','Main',2,1,'Pogo jumps','15 hopp','','Runde 1 · Kort landing, små hopp'),
('tif_offseason_1_v2','Main',3,1,'Plyo bar squat','6 reps','','Runde 1 · 50–60 % av 1RM knebøy, maksimal hastighet'),
('tif_offseason_1_v2','Main',4,1,'Leg extension','6 reps per fot (2 RIR)','','Runde 1 · Hvis du har tilgang til maskin, utfall om ikke'),
('tif_offseason_1_v2','Main',5,1,'Hip Thrust','4 reps (1-2 RIR)','','Runde 1 · Høyt skyv, maksimal hastighet'),
('tif_offseason_1_v2','Main',6,1,'Nordic / leg curl','10-12 reps per fot','','Runde 1 · Kontrollert bevegelse'),
('tif_offseason_1_v2','Main',7,1,'Depth Landing','3 reps','','Runde 1 · Stabil landing'),
('tif_offseason_1_v2','Main',8,2,'Box jump','2 hopp','','Runde 2 · Maks høyde, kort kontakttid på boks'),
('tif_offseason_1_v2','Main',9,2,'Pogo jumps','15 hopp','','Runde 2 · Kort landing, små hopp'),
('tif_offseason_1_v2','Main',10,2,'Plyo bar squat','6 reps','','Runde 2 · 50–60 % av 1RM knebøy, maksimal hastighet'),
('tif_offseason_1_v2','Main',11,2,'Leg extension','6 reps per fot (2 RIR)','','Runde 2 · Hvis du har tilgang til maskin, utfall om ikke'),
('tif_offseason_1_v2','Main',12,2,'Hip Thrust','4 reps (1-2 RIR)','','Runde 2 · Høyt skyv, maksimal hastighet'),
('tif_offseason_1_v2','Main',13,2,'Nordic / leg curl','10-12 reps per fot','','Runde 2 · Kontrollert bevegelse'),
('tif_offseason_1_v2','Main',14,2,'Depth Landing','3 reps','','Runde 2 · Stabil landing'),
('tif_offseason_1_v2','Main',15,3,'Box jump','2 hopp','','Runde 3 · Maks høyde, kort kontakttid på boks'),
('tif_offseason_1_v2','Main',16,3,'Pogo jumps','15 hopp','','Runde 3 · Kort landing, små hopp'),
('tif_offseason_1_v2','Main',17,3,'Plyo bar squat','6 reps','','Runde 3 · 50–60 % av 1RM knebøy, maksimal hastighet'),
('tif_offseason_1_v2','Main',18,3,'Leg extension','6 reps per fot (2 RIR)','','Runde 3 · Hvis du har tilgang til maskin, utfall om ikke'),
('tif_offseason_1_v2','Main',19,3,'Hip Thrust','4 reps (1-2 RIR)','','Runde 3 · Høyt skyv, maksimal hastighet'),
('tif_offseason_1_v2','Main',20,3,'Nordic / leg curl','10-12 reps per fot','','Runde 3 · Kontrollert bevegelse'),
('tif_offseason_1_v2','Main',21,3,'Depth Landing','3 reps','','Runde 3 · Stabil landing'),
('tif_offseason_1_v2','Main',22,4,'Plyo bar squat','6 reps','','Runde 4 · 50–60 % av 1RM knebøy, maksimal hastighet'),
('tif_offseason_1_v2','Main',23,4,'Leg extension','6 reps per fot (2 RIR)','','Runde 4 · Hvis du har tilgang til maskin, utfall om ikke'),
('tif_offseason_1_v2','Main',24,4,'Hip Thrust','4 reps (1-2 RIR)','','Runde 4 · Høyt skyv, maksimal hastighet'),
('tif_offseason_2_v1','Main',1,1,'Medball Chest Throw','4-6 reps','','Runde 1 · Plyo arbeid, maks kraft ball til vegg'),
('tif_offseason_2_v1','Main',2,1,'BB/DB Benkpress','4 reps 80–85 % · mål 1-2 RIR','','Runde 1 · Rolig ned, tempo opp'),
('tif_offseason_2_v1','Main',3,1,'Pull ups / nedtrekk','6 reps (2 RIR)','','Runde 1 · Full bevegelse'),
('tif_offseason_2_v1','Main',4,1,'En arms roing på benk','8 reps per arm (2 RIR)','','Runde 1 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_2_v1','Main',5,1,'Push press','6 reps (2 RIR)','','Runde 1 · Stabil overkropp, press over hodet'),
('tif_offseason_2_v1','Main',6,1,'Sideløft m/db på benk','10-12 reps per arm','','Runde 1 · Lett vekt, kontrollert bevegelse'),
('tif_offseason_2_v1','Main',7,1,'One arm DB carry','20-30 m per arm','','Runde 1 · Tung belastning'),
('tif_offseason_2_v1','Main',8,2,'Medball Chest Throw','4-6 reps','','Runde 2 · Plyo arbeid, maks kraft ball til vegg'),
('tif_offseason_2_v1','Main',9,2,'BB/DB Benkpress','4 reps 80–85 % · mål 1-2 RIR','','Runde 2 · Rolig ned, tempo opp'),
('tif_offseason_2_v1','Main',10,2,'Pull ups / nedtrekk','6 reps (2 RIR)','','Runde 2 · Full bevegelse'),
('tif_offseason_2_v1','Main',11,2,'En arms roing på benk','8 reps per arm (2 RIR)','','Runde 2 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_2_v1','Main',12,2,'Push press','6 reps (2 RIR)','','Runde 2 · Stabil overkropp, press over hodet'),
('tif_offseason_2_v1','Main',13,2,'Sideløft m/db på benk','10-12 reps per arm','','Runde 2 · Lett vekt, kontrollert bevegelse'),
('tif_offseason_2_v1','Main',14,2,'One arm DB carry','20-30 m per arm','','Runde 2 · Tung belastning'),
('tif_offseason_2_v1','Main',15,3,'Medball Chest Throw','4-6 reps','','Runde 3 · Plyo arbeid, maks kraft ball til vegg'),
('tif_offseason_2_v1','Main',16,3,'BB/DB Benkpress','4 reps 80–85 % · mål 1-2 RIR','','Runde 3 · Rolig ned, tempo opp'),
('tif_offseason_2_v1','Main',17,3,'Pull ups / nedtrekk','6 reps (2 RIR)','','Runde 3 · Full bevegelse'),
('tif_offseason_2_v1','Main',18,3,'En arms roing på benk','8 reps per arm (2 RIR)','','Runde 3 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_2_v1','Main',19,3,'Push press','6 reps (2 RIR)','','Runde 3 · Stabil overkropp, press over hodet'),
('tif_offseason_2_v1','Main',20,3,'Sideløft m/db på benk','10-12 reps per arm','','Runde 3 · Lett vekt, kontrollert bevegelse'),
('tif_offseason_2_v1','Main',21,3,'One arm DB carry','20-30 m per arm','','Runde 3 · Tung belastning'),
('tif_offseason_2_v1','Main',22,4,'BB/DB Benkpress','4 reps 80–85 % · mål 1-2 RIR','','Runde 4 · Rolig ned, tempo opp'),
('tif_offseason_2_v1','Main',23,4,'Pull ups / nedtrekk','6 reps (2 RIR)','','Runde 4 · Full bevegelse'),
('tif_offseason_2_v1','Main',24,4,'En arms roing på benk','8 reps per arm (2 RIR)','','Runde 4 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_2_v2','Main',1,1,'Medball Chest Throw','4-6 reps','','Runde 1 · Plyo arbeid, maks kraft ball til vegg'),
('tif_offseason_2_v2','Main',2,1,'BB/DB Skråbenk','4 reps 2-3 RIR','','Runde 1 · Rolig ned, tempo opp, 2 sek hold i bunn'),
('tif_offseason_2_v2','Main',3,1,'Pull ups / nedtrekk','6 reps (2 RIR)','','Runde 1 · Full bevegelse'),
('tif_offseason_2_v2','Main',4,1,'DB Roing på skråbenk','8 reps (2 RIR)','','Runde 1 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_2_v2','Main',5,1,'Sideløft m/db','10-12 reps per arm','','Runde 1 · Lett vekt, kontrollert bevegelse'),
('tif_offseason_2_v2','Main',6,1,'Half Kneeling DB Press','8 reps per arm (2 RIR)','','Runde 1 · Stabil overkropp, kontrollert press over hodet'),
('tif_offseason_2_v2','Main',7,1,'Pallof press','10 reps per side','','Runde 1 · Stabil kjerne, unngå rotasjon med overkropp'),
('tif_offseason_2_v2','Main',8,2,'Medball Chest Throw','4-6 reps','','Runde 2 · Plyo arbeid, maks kraft ball til vegg'),
('tif_offseason_2_v2','Main',9,2,'BB/DB Skråbenk','4 reps 2-3 RIR','','Runde 2 · Rolig ned, tempo opp, 2 sek hold i bunn'),
('tif_offseason_2_v2','Main',10,2,'Pull ups / nedtrekk','6 reps (2 RIR)','','Runde 2 · Full bevegelse'),
('tif_offseason_2_v2','Main',11,2,'DB Roing på skråbenk','8 reps (2 RIR)','','Runde 2 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_2_v2','Main',12,2,'Sideløft m/db','10-12 reps per arm','','Runde 2 · Lett vekt, kontrollert bevegelse'),
('tif_offseason_2_v2','Main',13,2,'Half Kneeling DB Press','8 reps per arm (2 RIR)','','Runde 2 · Stabil overkropp, kontrollert press over hodet'),
('tif_offseason_2_v2','Main',14,2,'Pallof press','10 reps per side','','Runde 2 · Stabil kjerne, unngå rotasjon med overkropp'),
('tif_offseason_2_v2','Main',15,3,'Medball Chest Throw','4-6 reps','','Runde 3 · Plyo arbeid, maks kraft ball til vegg'),
('tif_offseason_2_v2','Main',16,3,'BB/DB Skråbenk','4 reps 2-3 RIR','','Runde 3 · Rolig ned, tempo opp, 2 sek hold i bunn'),
('tif_offseason_2_v2','Main',17,3,'Pull ups / nedtrekk','6 reps (2 RIR)','','Runde 3 · Full bevegelse'),
('tif_offseason_2_v2','Main',18,3,'DB Roing på skråbenk','8 reps (2 RIR)','','Runde 3 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_2_v2','Main',19,3,'Sideløft m/db','10-12 reps per arm','','Runde 3 · Lett vekt, kontrollert bevegelse'),
('tif_offseason_2_v2','Main',20,3,'Half Kneeling DB Press','8 reps per arm (2 RIR)','','Runde 3 · Stabil overkropp, kontrollert press over hodet'),
('tif_offseason_2_v2','Main',21,3,'Pallof press','10 reps per side','','Runde 3 · Stabil kjerne, unngå rotasjon med overkropp'),
('tif_offseason_2_v2','Main',22,4,'BB/DB Skråbenk','4 reps 2-3 RIR','','Runde 4 · Rolig ned, tempo opp, 2 sek hold i bunn'),
('tif_offseason_2_v2','Main',23,4,'DB Roing på skråbenk','8 reps (2 RIR)','','Runde 4 · Kontrollert trekk, skulderblad tilbake'),
('tif_offseason_3_v1','Main',1,1,'Lateral Bound','4 per side','','Runde 1 · Sideveis eksplosivitet'),
('tif_offseason_3_v1','Main',2,1,'Frivending / drag til bryst','4 reps (2 RIR)','','Runde 1 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v1','Main',3,1,'Valgfri bøy variant','4 reps @ 75–80 % (2 RIR)','','Runde 1 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',4,1,'Step Up m/ manualer','6 reps per fot (2 RIR)','','Runde 1 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',5,1,'Benkpress','4 reps 80–85 % benk','','Runde 1 · Prøv å være så eksplosiv som mulig opp'),
('tif_offseason_3_v1','Main',6,1,'Pull Ups / Nedtrekk','6 reps (2 RIR)','','Runde 1 · Full bevegelse, trekk albuer ned mot hofte'),
('tif_offseason_3_v1','Main',7,1,'Medball side kast','4 per side','','Runde 1 · Eksplosive kast med medisinball'),
('tif_offseason_3_v1','Main',8,1,'Copenhagen Plank','30s per side','','Runde 1 · Stabilisering kjerne'),
('tif_offseason_3_v1','Main',9,2,'Lateral Bound','4 per side','','Runde 2 · Sideveis eksplosivitet'),
('tif_offseason_3_v1','Main',10,2,'Frivending / drag til bryst','4 reps (2 RIR)','','Runde 2 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v1','Main',11,2,'Valgfri bøy variant','4 reps @ 75–80 % (2 RIR)','','Runde 2 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',12,2,'Step Up m/ manualer','6 reps per fot (2 RIR)','','Runde 2 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',13,2,'Benkpress','4 reps 80–85 % benk','','Runde 2 · Prøv å være så eksplosiv som mulig opp'),
('tif_offseason_3_v1','Main',14,2,'Pull Ups / Nedtrekk','6 reps (2 RIR)','','Runde 2 · Full bevegelse, trekk albuer ned mot hofte'),
('tif_offseason_3_v1','Main',15,2,'Medball side kast','4 per side','','Runde 2 · Eksplosive kast med medisinball'),
('tif_offseason_3_v1','Main',16,2,'Copenhagen Plank','30s per side','','Runde 2 · Stabilisering kjerne'),
('tif_offseason_3_v1','Main',17,3,'Lateral Bound','4 per side','','Runde 3 · Sideveis eksplosivitet'),
('tif_offseason_3_v1','Main',18,3,'Frivending / drag til bryst','4 reps (2 RIR)','','Runde 3 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v1','Main',19,3,'Valgfri bøy variant','4 reps @ 75–80 % (2 RIR)','','Runde 3 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',20,3,'Step Up m/ manualer','6 reps per fot (2 RIR)','','Runde 3 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',21,3,'Benkpress','4 reps 80–85 % benk','','Runde 3 · Prøv å være så eksplosiv som mulig opp'),
('tif_offseason_3_v1','Main',22,3,'Pull Ups / Nedtrekk','6 reps (2 RIR)','','Runde 3 · Full bevegelse, trekk albuer ned mot hofte'),
('tif_offseason_3_v1','Main',23,3,'Medball side kast','4 per side','','Runde 3 · Eksplosive kast med medisinball'),
('tif_offseason_3_v1','Main',24,3,'Copenhagen Plank','30s per side','','Runde 3 · Stabilisering kjerne'),
('tif_offseason_3_v1','Main',25,4,'Frivending / drag til bryst','4 reps (2 RIR)','','Runde 4 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v1','Main',26,4,'Valgfri bøy variant','4 reps @ 75–80 % (2 RIR)','','Runde 4 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',27,4,'Step Up m/ manualer','6 reps per fot (2 RIR)','','Runde 4 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v1','Main',28,4,'Benkpress','4 reps 80–85 % benk','','Runde 4 · Prøv å være så eksplosiv som mulig opp'),
('tif_offseason_3_v1','Main',29,4,'Pull Ups / Nedtrekk','6 reps (2 RIR)','','Runde 4 · Full bevegelse, trekk albuer ned mot hofte'),
('tif_offseason_3_v2','Main',1,1,'Lateral Bound','4 per side','','Runde 1 · Sideveis eksplosivitet'),
('tif_offseason_3_v2','Main',2,1,'Frivending / drag til bryst','3 reps (2 RIR)','','Runde 1 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v2','Main',3,1,'Valgfri bøy variant','4 reps @ 75–80 % (2 RIR)','','Runde 1 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v2','Main',4,1,'Step Up m/ manualer','6 reps per fot (2 RIR)','','Runde 1 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v2','Main',5,1,'Explosive Bench Press','4 reps 40–50 % benk','','Runde 1 · Maks stanghastighet'),
('tif_offseason_3_v2','Main',6,1,'Pull Ups / Nedtrekk','6 reps (2 RIR)','','Runde 1 · Full bevegelse, trekk albuer ned mot hofte'),
('tif_offseason_3_v2','Main',7,1,'Sideplanke med rotasjon','8 reps per side','','Runde 1 · Stabilisering kjerne, kontrollert rotasjon'),
('tif_offseason_3_v2','Main',8,1,'Copenhagen Plank','30s per side','','Runde 1 · Stabilisering kjerne'),
('tif_offseason_3_v2','Main',9,2,'Lateral Bound','4 per side','','Runde 2 · Sideveis eksplosivitet'),
('tif_offseason_3_v2','Main',10,2,'Frivending / drag til bryst','3 reps (2 RIR)','','Runde 2 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v2','Main',11,2,'Valgfri bøy variant','4 reps @ 75–80 % (2 RIR)','','Runde 2 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v2','Main',12,2,'Step Up m/ manualer','6 reps per fot (2 RIR)','','Runde 2 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v2','Main',13,2,'Explosive Bench Press','4 reps 40–50 % benk','','Runde 2 · Maks stanghastighet'),
('tif_offseason_3_v2','Main',14,2,'Pull Ups / Nedtrekk','6 reps (2 RIR)','','Runde 2 · Full bevegelse, trekk albuer ned mot hofte'),
('tif_offseason_3_v2','Main',15,2,'Sideplanke med rotasjon','8 reps per side','','Runde 2 · Stabilisering kjerne, kontrollert rotasjon'),
('tif_offseason_3_v2','Main',16,2,'Copenhagen Plank','30s per side','','Runde 2 · Stabilisering kjerne'),
('tif_offseason_3_v2','Main',17,3,'Lateral Bound','4 per side','','Runde 3 · Sideveis eksplosivitet'),
('tif_offseason_3_v2','Main',18,3,'Frivending / drag til bryst','3 reps (2 RIR)','','Runde 3 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v2','Main',19,3,'Valgfri bøy variant','4 reps @ 75–80 % (2 RIR)','','Runde 3 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v2','Main',20,3,'Step Up m/ manualer','6 reps per fot (2 RIR)','','Runde 3 · Eksplosivt opp, kontrollert ned'),
('tif_offseason_3_v2','Main',21,3,'Explosive Bench Press','4 reps 40–50 % benk','','Runde 3 · Maks stanghastighet'),
('tif_offseason_3_v2','Main',22,3,'Pull Ups / Nedtrekk','6 reps (2 RIR)','','Runde 3 · Full bevegelse, trekk albuer ned mot hofte'),
('tif_offseason_3_v2','Main',23,3,'Sideplanke med rotasjon','8 reps per side','','Runde 3 · Stabilisering kjerne, kontrollert rotasjon'),
('tif_offseason_3_v2','Main',24,3,'Copenhagen Plank','30s per side','','Runde 3 · Stabilisering kjerne'),
('tif_offseason_3_v2','Main',25,4,'Frivending / drag til bryst','3 reps (2 RIR)','','Runde 4 · Start fra hofte, eksplosiv avslutning'),
('tif_offseason_3_v2','Main',26,4,'Explosive Bench Press','4 reps 40–50 % benk','','Runde 4 · Maks stanghastighet');

notify pgrst, 'reload schema';

select p.id,p.name,count(a.*) as activities
from public.cr_programs p
left join public.cr_program_activities a on a.program_id=p.id
where p.id in ('tif_offseason_1_v1','tif_offseason_1_v2','tif_offseason_2_v1','tif_offseason_2_v2','tif_offseason_3_v1','tif_offseason_3_v2')
group by p.id,p.name
order by p.sort_order;


-- CR-Workout v9.8.9.1 – TIF Viking: flytt belastning fra reps til load
-- Kjør hele scriptet én gang i Supabase SQL Editor.
-- Berører KUN de seks TIF Viking Off Season-programmene.

update public.cr_program_activities
set
  load = trim(both '() ' from substring(reps from
    '(?i)^.+?reps(?:[[:space:]]+per[[:space:]]+(?:fot|arm|side))?[[:space:]]+(.+)$'
  )),
  reps = substring(reps from
    '(?i)^(.+?reps(?:[[:space:]]+per[[:space:]]+(?:fot|arm|side))?)'
  )
where program_id in ('tif_offseason_1_v1','tif_offseason_1_v2','tif_offseason_2_v1','tif_offseason_2_v2','tif_offseason_3_v1','tif_offseason_3_v2')
  and reps ~* 'reps(?:[[:space:]]+per[[:space:]]+(fot|arm|side))?[[:space:]]+.+$';

notify pgrst, 'reload schema';

-- Kontroll
select program_id, round_no, activity, reps, load
from public.cr_program_activities
where program_id in ('tif_offseason_1_v1','tif_offseason_1_v2','tif_offseason_2_v1','tif_offseason_2_v2','tif_offseason_3_v1','tif_offseason_3_v2')
order by program_id, order_no;


-- CR-Workout v9.8.9.2 – nye TIF Viking programnavn
-- Kjør én gang i Supabase SQL Editor.

update public.cr_programs
set name = case id
  when 'tif_offseason_1_v1' then 'TIF Viking-Økt 1 (under) vr.1' when 'tif_offseason_1_v2' then 'TIF Viking-Økt 1 (under) vr.2' when 'tif_offseason_2_v1' then 'TIF Viking-Økt 2 (over) vr.1' when 'tif_offseason_2_v2' then 'TIF Viking-Økt 2 (over) vr.2' when 'tif_offseason_3_v1' then 'TIF Viking-Økt 3 (split) vr.1' when 'tif_offseason_3_v2' then 'TIF Viking-Økt 3 (split) vr.2'
  else name
end
where id in ('tif_offseason_1_v1','tif_offseason_1_v2','tif_offseason_2_v1','tif_offseason_2_v2','tif_offseason_3_v1','tif_offseason_3_v2');

notify pgrst, 'reload schema';

select id,name from public.cr_programs
where id in ('tif_offseason_1_v1','tif_offseason_1_v2','tif_offseason_2_v1','tif_offseason_2_v2','tif_offseason_3_v1','tif_offseason_3_v2')
order by sort_order;


-- CR-Workout v9.8.9.3 – Balløkt
-- Kopi av Fri økt uten distanse.
insert into public.cr_programs (id,name,description,icon,active,sort_order)
values ('ball_session','Balløkt','Fri balløkt · timer · rating · kommentar','🏐',true,85)
on conflict (id) do update
set name=excluded.name,description=excluded.description,icon=excluded.icon,active=true,sort_order=excluded.sort_order;

notify pgrst, 'reload schema';

select id,name,description,active,sort_order
from public.cr_programs
where id='ball_session';
