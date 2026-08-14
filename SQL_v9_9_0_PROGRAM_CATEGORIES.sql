-- CR-Workout v9.9.0 – Programkategorier
-- Additiv og rollback-vennlig endring.

alter table public.cr_programs
  add column if not exists category text;

update public.cr_programs
set category = case
  when id='golf' then 'golf'
  when id='running' then 'running'
  when id='ball_session' then 'ball'
  else 'strength'
end
where category is null;

alter table public.cr_programs
  drop constraint if exists cr_programs_category_check;

alter table public.cr_programs
  add constraint cr_programs_category_check
  check (category in ('strength','ball','running','golf'));

update public.cr_programs set category='ball' where id='ball_session';
update public.cr_programs set category='running' where id='running';
update public.cr_programs set category='golf' where id='golf';

notify pgrst, 'reload schema';

select id,name,category,active
from public.cr_programs
order by category,sort_order,name;
