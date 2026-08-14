-- CR-Workout v9.9.1 – Annen aktivitet
-- Intern category-verdi beholdes som 'running' for kompatibilitet.

update public.cr_programs
set category='running'
where id in ('running','free_workout','kettlebell','kettlebell_mix')
   or lower(name) like '%kettlebell%'
   or lower(name) like '%fri økt%'
   or lower(name) like '%løping%';

notify pgrst, 'reload schema';

select id,name,category,active
from public.cr_programs
where category='running'
order by sort_order,name;
