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
