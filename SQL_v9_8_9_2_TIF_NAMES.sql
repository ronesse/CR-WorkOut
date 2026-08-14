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
