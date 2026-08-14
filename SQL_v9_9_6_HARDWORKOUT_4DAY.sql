-- CR-Workout v9.9.6 – Hardworkout: Fire økter i uken for viderekomne
-- Kildeprogram: https://hardworkout.no/fire-okter-i-uken-treningsprogram-for-viderekomne/
-- SETT = RUNDE: Runde 1 inneholder sett 1 av alle ordinære øvelser, osv.
-- 5-minutters høy-rep-øvelser ligger som egne avsluttende aktiviteter.

insert into public.cr_programs
(id,name,description,icon,active,sort_order,category)
values
('hardworkout_4day_1','Viderekommen 4-splitt – Økt 1','Rygg og biceps · Hardworkout 4-splitt','🏋️',true,300,'strength'),
('hardworkout_4day_2','Viderekommen 4-splitt – Økt 2','Bryst og triceps · Hardworkout 4-splitt','🏋️',true,310,'strength'),
('hardworkout_4day_3','Viderekommen 4-splitt – Økt 3','Bein og legger · Hardworkout 4-splitt','🏋️',true,320,'strength'),
('hardworkout_4day_4','Viderekommen 4-splitt – Økt 4','Skuldre, øvre rygg og underarmer · Hardworkout 4-splitt','🏋️',true,330,'strength')
on conflict (id) do update set
 name=excluded.name,
 description=excluded.description,
 icon=excluded.icon,
 active=true,
 sort_order=excluded.sort_order,
 category=excluded.category;

delete from public.cr_program_activities
where program_id in ('hardworkout_4day_1','hardworkout_4day_2','hardworkout_4day_3','hardworkout_4day_4');

insert into public.cr_program_activities
(program_id,group_name,order_no,round_no,activity,reps,load,description)
values
('hardworkout_4day_1','Main',1,1,'Markløft','5 reps','','Runde 1 · Stabil rygg og buktrykk. Press gulvet fra deg og hold stangen tett på kroppen.'),
('hardworkout_4day_1','Main',2,1,'En-arms roing med manual','8–12 reps per arm','1–2 RIR','Runde 1 · Støtt deg stabilt. Trekk albuen bakover mot hoften uten å rotere overkroppen.'),
('hardworkout_4day_1','Main',3,1,'Pull-ups bredt grep / nedtrekk','10–12 reps','1–2 RIR','Runde 1 · Start med skuldrene kontrollert. Trekk albuene ned og før brystet mot stangen/håndtaket.'),
('hardworkout_4day_1','Main',4,1,'Roing med stang','8–12 reps','1–2 RIR','Runde 1 · Hold ryggen stabil og trekk stangen kontrollert mot nedre del av magen.'),
('hardworkout_4day_1','Main',5,1,'Preacher curl med EZ-stang','10–12 reps','1–2 RIR','Runde 1 · Hold overarmene i puten og bøy albuene uten å løfte skuldrene.'),
('hardworkout_4day_1','Main',6,1,'Konsentrasjonscurl med manual','10–12 reps per arm','1–2 RIR','Runde 1 · Hold overarmen rolig og løft manualen kontrollert gjennom hele bevegelsen.'),
('hardworkout_4day_1','Main',7,2,'Markløft','5 reps','','Runde 2 · Stabil rygg og buktrykk. Press gulvet fra deg og hold stangen tett på kroppen.'),
('hardworkout_4day_1','Main',8,2,'En-arms roing med manual','8–12 reps per arm','1–2 RIR','Runde 2 · Støtt deg stabilt. Trekk albuen bakover mot hoften uten å rotere overkroppen.'),
('hardworkout_4day_1','Main',9,2,'Pull-ups bredt grep / nedtrekk','10–12 reps','1–2 RIR','Runde 2 · Start med skuldrene kontrollert. Trekk albuene ned og før brystet mot stangen/håndtaket.'),
('hardworkout_4day_1','Main',10,2,'Roing med stang','8–12 reps','1–2 RIR','Runde 2 · Hold ryggen stabil og trekk stangen kontrollert mot nedre del av magen.'),
('hardworkout_4day_1','Main',11,2,'Preacher curl med EZ-stang','10–12 reps','1–2 RIR','Runde 2 · Hold overarmene i puten og bøy albuene uten å løfte skuldrene.'),
('hardworkout_4day_1','Main',12,2,'Konsentrasjonscurl med manual','10–12 reps per arm','1–2 RIR','Runde 2 · Hold overarmen rolig og løft manualen kontrollert gjennom hele bevegelsen.'),
('hardworkout_4day_1','Main',13,3,'En-arms roing med manual','8–12 reps per arm','1–2 RIR','Runde 3 · Støtt deg stabilt. Trekk albuen bakover mot hoften uten å rotere overkroppen.'),
('hardworkout_4day_1','Main',14,3,'Pull-ups bredt grep / nedtrekk','10–12 reps','1–2 RIR','Runde 3 · Start med skuldrene kontrollert. Trekk albuene ned og før brystet mot stangen/håndtaket.'),
('hardworkout_4day_1','Main',15,3,'Roing med stang','8–12 reps','1–2 RIR','Runde 3 · Hold ryggen stabil og trekk stangen kontrollert mot nedre del av magen.'),
('hardworkout_4day_1','Main',16,3,'Preacher curl med EZ-stang','10–12 reps','1–2 RIR','Runde 3 · Hold overarmene i puten og bøy albuene uten å løfte skuldrene.'),
('hardworkout_4day_1','Main',17,3,'Konsentrasjonscurl med manual','10–12 reps per arm','1–2 RIR','Runde 3 · Hold overarmen rolig og løft manualen kontrollert gjennom hele bevegelsen.'),
('hardworkout_4day_1','5 min høy-rep',18,4,'Sittende roing kabel / maskin','5 min høy-rep','ca. 12–15RM','Jobb i korte serier nær utmattelse, hvil kort og fortsett gjennom fem minutter.'),
('hardworkout_4day_1','5 min høy-rep',19,4,'Sittende bicepscurl med manualer','5 min høy-rep','ca. 12–15RM','Bruk en belastning du normalt klarer 12–15 reps med. Korte pauser og nye serier gjennom fem minutter.'),
('hardworkout_4day_2','Main',1,1,'Benkpress','6–10 reps','1–2 RIR','Runde 1 · Trekk skulderbladene sammen, hold føttene stabile og senk stangen kontrollert mot brystet.'),
('hardworkout_4day_2','Main',2,1,'Skrå benkpress med manualer','8–12 reps','1–2 RIR','Runde 1 · Hold brystet oppe og senk manualene kontrollert før du presser opp.'),
('hardworkout_4day_2','Main',3,1,'Dips','Maks reps','1–2 RIR','Runde 1 · Hold skuldrene stabile. Senk kontrollert og press opp uten å miste kroppskontrollen.'),
('hardworkout_4day_2','Main',4,1,'Cable crossover / pec deck','12–15 reps','1–2 RIR','Runde 1 · Hold lett bøy i albuene og før armene sammen med kontrollert bevegelse.'),
('hardworkout_4day_2','Main',5,1,'Franskpress med EZ-stang','8–12 reps','1–2 RIR','Runde 1 · Hold overarmene mest mulig i ro mens albuene bøyes og strekkes.'),
('hardworkout_4day_2','Main',6,1,'Sittende tricepspress over hodet med manual','8–12 reps','1–2 RIR','Runde 1 · Hold albuene pekende frem og strekk ut over hodet uten å svaie i ryggen.'),
('hardworkout_4day_2','Main',7,2,'Benkpress','6–10 reps','1–2 RIR','Runde 2 · Trekk skulderbladene sammen, hold føttene stabile og senk stangen kontrollert mot brystet.'),
('hardworkout_4day_2','Main',8,2,'Skrå benkpress med manualer','8–12 reps','1–2 RIR','Runde 2 · Hold brystet oppe og senk manualene kontrollert før du presser opp.'),
('hardworkout_4day_2','Main',9,2,'Dips','Maks reps','1–2 RIR','Runde 2 · Hold skuldrene stabile. Senk kontrollert og press opp uten å miste kroppskontrollen.'),
('hardworkout_4day_2','Main',10,2,'Cable crossover / pec deck','12–15 reps','1–2 RIR','Runde 2 · Hold lett bøy i albuene og før armene sammen med kontrollert bevegelse.'),
('hardworkout_4day_2','Main',11,2,'Franskpress med EZ-stang','8–12 reps','1–2 RIR','Runde 2 · Hold overarmene mest mulig i ro mens albuene bøyes og strekkes.'),
('hardworkout_4day_2','Main',12,2,'Sittende tricepspress over hodet med manual','8–12 reps','1–2 RIR','Runde 2 · Hold albuene pekende frem og strekk ut over hodet uten å svaie i ryggen.'),
('hardworkout_4day_2','Main',13,3,'Benkpress','6–10 reps','1–2 RIR','Runde 3 · Trekk skulderbladene sammen, hold føttene stabile og senk stangen kontrollert mot brystet.'),
('hardworkout_4day_2','Main',14,3,'Skrå benkpress med manualer','8–12 reps','1–2 RIR','Runde 3 · Hold brystet oppe og senk manualene kontrollert før du presser opp.'),
('hardworkout_4day_2','Main',15,3,'Dips','Maks reps','1–2 RIR','Runde 3 · Hold skuldrene stabile. Senk kontrollert og press opp uten å miste kroppskontrollen.'),
('hardworkout_4day_2','Main',16,3,'Cable crossover / pec deck','12–15 reps','1–2 RIR','Runde 3 · Hold lett bøy i albuene og før armene sammen med kontrollert bevegelse.'),
('hardworkout_4day_2','Main',17,3,'Franskpress med EZ-stang','8–12 reps','1–2 RIR','Runde 3 · Hold overarmene mest mulig i ro mens albuene bøyes og strekkes.'),
('hardworkout_4day_2','Main',18,3,'Sittende tricepspress over hodet med manual','8–12 reps','1–2 RIR','Runde 3 · Hold albuene pekende frem og strekk ut over hodet uten å svaie i ryggen.'),
('hardworkout_4day_2','5 min høy-rep',19,4,'Brystpress maskin / benkpress manualer','5 min høy-rep','ca. 12–15RM','Kjør korte serier nær utmattelse med korte pauser gjennom fem minutter.'),
('hardworkout_4day_2','5 min høy-rep',20,4,'Triceps pushdown i kabel','5 min høy-rep','ca. 12–15RM','Hold albuene inntil kroppen. Korte serier og korte pauser gjennom fem minutter.'),
('hardworkout_4day_3','Main',1,1,'Knebøy','6–10 reps','1–2 RIR','Runde 1 · Hold buktrykk og stabil overkropp. Senk kontrollert og press gjennom hele foten.'),
('hardworkout_4day_3','Main',2,1,'Beinpress','15–20 reps','1–2 RIR','Runde 1 · Hold korsryggen mot puten og senk kontrollert så langt god bevegelighet tillater.'),
('hardworkout_4day_3','Main',3,1,'Hack squat / utfall med manualer','8–12 reps','1–2 RIR','Runde 1 · Hold kneet i linje med foten og arbeid kontrollert gjennom god bevegelsesbane.'),
('hardworkout_4day_3','Main',4,1,'Strake markløft','8–12 reps','1–2 RIR','Runde 1 · Skyv hoften bakover med lett knekk i knærne og hold ryggen stabil.'),
('hardworkout_4day_3','Main',5,1,'Stående tåhev','10–15 reps','1–2 RIR','Runde 1 · Bruk full bevegelsesbane: kontrollert ned og høyt opp på tå.'),
('hardworkout_4day_3','Main',6,2,'Knebøy','6–10 reps','1–2 RIR','Runde 2 · Hold buktrykk og stabil overkropp. Senk kontrollert og press gjennom hele foten.'),
('hardworkout_4day_3','Main',7,2,'Beinpress','15–20 reps','1–2 RIR','Runde 2 · Hold korsryggen mot puten og senk kontrollert så langt god bevegelighet tillater.'),
('hardworkout_4day_3','Main',8,2,'Hack squat / utfall med manualer','8–12 reps','1–2 RIR','Runde 2 · Hold kneet i linje med foten og arbeid kontrollert gjennom god bevegelsesbane.'),
('hardworkout_4day_3','Main',9,2,'Strake markløft','8–12 reps','1–2 RIR','Runde 2 · Skyv hoften bakover med lett knekk i knærne og hold ryggen stabil.'),
('hardworkout_4day_3','Main',10,2,'Stående tåhev','10–15 reps','1–2 RIR','Runde 2 · Bruk full bevegelsesbane: kontrollert ned og høyt opp på tå.'),
('hardworkout_4day_3','Main',11,3,'Knebøy','6–10 reps','1–2 RIR','Runde 3 · Hold buktrykk og stabil overkropp. Senk kontrollert og press gjennom hele foten.'),
('hardworkout_4day_3','Main',12,3,'Beinpress','15–20 reps','1–2 RIR','Runde 3 · Hold korsryggen mot puten og senk kontrollert så langt god bevegelighet tillater.'),
('hardworkout_4day_3','Main',13,3,'Hack squat / utfall med manualer','8–12 reps','1–2 RIR','Runde 3 · Hold kneet i linje med foten og arbeid kontrollert gjennom god bevegelsesbane.'),
('hardworkout_4day_3','Main',14,3,'Strake markløft','8–12 reps','1–2 RIR','Runde 3 · Skyv hoften bakover med lett knekk i knærne og hold ryggen stabil.'),
('hardworkout_4day_3','Main',15,3,'Stående tåhev','10–15 reps','1–2 RIR','Runde 3 · Bruk full bevegelsesbane: kontrollert ned og høyt opp på tå.'),
('hardworkout_4day_3','5 min høy-rep',16,4,'Leg extension','5 min høy-rep','ca. 12–15RM','Korte serier med korte pauser gjennom fem minutter. Hold bevegelsen kontrollert.'),
('hardworkout_4day_3','5 min høy-rep',17,4,'Legcurl','5 min høy-rep','ca. 12–15RM','Korte serier nær utmattelse med korte pauser gjennom fem minutter.'),
('hardworkout_4day_3','5 min høy-rep',18,4,'Sittende tåhev','5 min høy-rep','ca. 12–15RM','Arbeid med full bevegelsesbane i korte serier gjennom fem minutter.'),
('hardworkout_4day_4','Main',1,1,'Sittende skulderpress med stang','6–10 reps','1–2 RIR','Runde 1 · Hold kjernen stabil og press stangen kontrollert over hodet.'),
('hardworkout_4day_4','Main',2,1,'Sittende Arnoldpress med manualer','8–12 reps','1–2 RIR','Runde 1 · Roter manualene kontrollert mens du presser opp. Unngå overdreven svai.'),
('hardworkout_4day_4','Main',3,1,'Sidehev med manualer','10–15 reps','1–2 RIR','Runde 1 · Bruk moderat belastning og løft armene kontrollert ut til siden.'),
('hardworkout_4day_4','Main',4,1,'Stående roing med stang','8–12 reps','1–2 RIR','Runde 1 · Trekk stangen opp kontrollert med albuene ut, uten å rykke med kroppen.'),
('hardworkout_4day_4','Main',5,1,'Sittende håndleddscurl med stang','12–15 reps','1–2 RIR','Runde 1 · Støtt underarmene og beveg håndleddene kontrollert gjennom tilgjengelig bevegelsesbane.'),
('hardworkout_4day_4','Main',6,2,'Sittende skulderpress med stang','6–10 reps','1–2 RIR','Runde 2 · Hold kjernen stabil og press stangen kontrollert over hodet.'),
('hardworkout_4day_4','Main',7,2,'Sittende Arnoldpress med manualer','8–12 reps','1–2 RIR','Runde 2 · Roter manualene kontrollert mens du presser opp. Unngå overdreven svai.'),
('hardworkout_4day_4','Main',8,2,'Sidehev med manualer','10–15 reps','1–2 RIR','Runde 2 · Bruk moderat belastning og løft armene kontrollert ut til siden.'),
('hardworkout_4day_4','Main',9,2,'Stående roing med stang','8–12 reps','1–2 RIR','Runde 2 · Trekk stangen opp kontrollert med albuene ut, uten å rykke med kroppen.'),
('hardworkout_4day_4','Main',10,2,'Sittende håndleddscurl med stang','12–15 reps','1–2 RIR','Runde 2 · Støtt underarmene og beveg håndleddene kontrollert gjennom tilgjengelig bevegelsesbane.'),
('hardworkout_4day_4','Main',11,3,'Sittende skulderpress med stang','6–10 reps','1–2 RIR','Runde 3 · Hold kjernen stabil og press stangen kontrollert over hodet.'),
('hardworkout_4day_4','Main',12,3,'Sittende Arnoldpress med manualer','8–12 reps','1–2 RIR','Runde 3 · Roter manualene kontrollert mens du presser opp. Unngå overdreven svai.'),
('hardworkout_4day_4','Main',13,3,'Sidehev med manualer','10–15 reps','1–2 RIR','Runde 3 · Bruk moderat belastning og løft armene kontrollert ut til siden.'),
('hardworkout_4day_4','Main',14,3,'Stående roing med stang','8–12 reps','1–2 RIR','Runde 3 · Trekk stangen opp kontrollert med albuene ut, uten å rykke med kroppen.'),
('hardworkout_4day_4','Main',15,3,'Sittende håndleddscurl med stang','12–15 reps','1–2 RIR','Runde 3 · Støtt underarmene og beveg håndleddene kontrollert gjennom tilgjengelig bevegelsesbane.'),
('hardworkout_4day_4','5 min høy-rep',16,4,'Skulderpress maskin / Smith-maskin','5 min høy-rep','ca. 12–15RM','Korte serier nær utmattelse og korte pauser gjennom fem minutter.'),
('hardworkout_4day_4','5 min høy-rep',17,4,'Shrugs med stang / manualer','5 min høy-rep','ca. 12–15RM','Løft skuldrene rett opp, senk kontrollert og jobb i korte serier gjennom fem minutter.'),
('hardworkout_4day_4','5 min høy-rep',18,4,'Statisk hold med stang','5 min','Tung, kontrollert belastning','Hold stangen med strake armer så lenge grepet holder. Sett ned, hvil kort og gjenta gjennom fem minutter.');

notify pgrst, 'reload schema';

select id,name,description,category,active,sort_order
from public.cr_programs
where id in ('hardworkout_4day_1','hardworkout_4day_2','hardworkout_4day_3','hardworkout_4day_4')
order by sort_order;
