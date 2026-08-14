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
