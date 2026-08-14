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

-- Kontroll:
select id,name,description,active,sort_order
from public.cr_programs
where id in ('bodyweight_day1','bodyweight_day2','bodyweight_day3')
order by sort_order;
