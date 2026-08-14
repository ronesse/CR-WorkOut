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
