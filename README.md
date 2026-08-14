# CR-Workout v3

Oppdatering fra v2:
- Mobiltilpasset Styrke Dag1/Dag2 uten behov for scrolling under økten.
- Stor Fullført-knapp og kompakte Skip/Postpone-knapper.
- Neste aktivitet er alltid synlig.
- Kettlebell-programmet har fått tilbake kettlebell-ikonet.

# CR-Workout v1

Ny og separat coach/utøver-site. WorkoutTimer2 berøres ikke.

## Dette er med i v1
- Coach- og utøverinnlogging
- Registreringsside for utøver
- Registrering av navn, telefon, e-post og passord
- Coach-invitasjonslenke
- Godkjenning av nye utøvere
- Programtildeling per utøver
- Utøver ser kun tildelte programmer
- Start og fullfør økt
- Rating + kommentar
- Coach-varsler i appen via Supabase Realtime
- Coach kan filtrere Kalender og Statistikk på utøver
- Utøver ser kun egne data via RLS

## Før du åpner siden
1. Opprett et nytt GitHub repository med navn `CR-Workout`.
2. Kjør `SQL_SETUP.sql` i Supabase SQL Editor.
3. Last opp alle webfilene til roten av repositoryet.
4. GitHub: Settings → Pages → Deploy from a branch → main → /(root)
5. Legg `https://ronesse.github.io/CR-Workout/` inn i Supabase Authentication → URL Configuration.

## Registreringslenke
Når coach er innlogget finnes knappen `Kopier registreringslenke`. Lenken inneholder coachens Supabase user-id og kobler nye utøvere til riktig coach.

## Viktig
Denne første versjonen etablerer coach/utøver-arkitekturen og øktregistrering. De komplette treningsskjermene fra WorkoutTimer2 kan flyttes inn program for program i neste trinn.

## v2 – treningsmotor
- Kettlebell 60/30 kjører nå selve 60/30-programmet: 20 runder / 30 min.
- Tabata 20/10 og Styrke 45/15 har også aktiv intervallmotor.
- Styrke Dag1 og Styrke Dag2 kjører oppgavevisning med Fullført / Skip / Postpone.
- Aktiv økt kan fortsettes etter refresh/lukking på samme enhet.
- Aktiv økt kan forkastes slik at utøveren ikke blir låst.
- Fullført økt åpner rating + kommentar og varsler coach via eksisterende Realtime-oppsett.
- Ingen ny SQL er nødvendig dersom v1 SQL_SETUP.sql allerede er kjørt.


## v4 – Coach Program Editor
Ny coach-fane `Programmer`.
- Velg Styrke Dag1 eller Styrke Dag2.
- Alle aktiviteter listes.
- Coach kan redigere aktivitetstekst, reps, load og description.
- Lagres i Supabase `cr_program_activities`.
- Utøverens styrkeprogram leses fra databasen ved oppstart.
- Første gang et program åpnes i editoren seedes dagens hardkodede program automatisk inn i databasen.

### Ny SQL
Kjør den nye delen i `SQL_SETUP.sql` som oppretter `cr_program_activities` og RLS-policyene.


## v5 – Import/eksport + redigerbare intervallprogrammer
- Coach kan eksportere alle programmer til én JSON-fil.
- Coach kan importere samme JSON-format tilbake.
- Import oppdaterer programmetadata, intervallinnstillinger og aktivitetene.
- Kettlebell 60/30, Tabata og Styrke 45/15 kan nå redigeres:
  - programnavn
  - beskrivelse
  - arbeidstid
  - hviletid
  - antall runder
  - varsel arbeid
  - varsel hvile
- Styrke Dag1/Dag2 kan fortsatt redigeres aktivitet for aktivitet.
- Utøveren henter intervallinnstillingene fra Supabase ved start av økten.

### SQL
Kjør den nye v5-delen i `SQL_SETUP.sql` for å opprette `cr_program_settings` og coach-policy for `cr_programs`.


## v5.1 – Login fix
- Defensive initialisering av de nye import/eksport-kontrollene.
- Appen stopper ikke lenger før Supabase Auth initialiseres dersom gammel HTML ligger i cache.
- Cache-busting på `style.css`, `programs.js` og `app.js`.

## v5.2 – Navigasjonsretting
- Utøvere har nå en egen coach-side i stedet for å peke tilbake til dashboardet.
- Programmer åpnes før databaseinnhold lastes, så eventuelle feil blir synlige.
- Navigasjonsfeil fanges og vises i stedet for at knappen ser ut til å ikke reagere.
- Ny cache-versjon og v5.2 cache-busting.

## v5.3 – Programeditor fix
- Rettet `Cannot set properties of null (setting 'value')`.
- Hele Programmer-skjermen er synkronisert med app.js.
- Kettlebell-redigering viser nå navn, beskrivelse, arbeid, hvile, runder og varsler.
- Import/Eksport-knappene er med i samme skjerm.
- Ekstra null-sikring gjør at programeditoren ikke stopper navigasjonen ved gammel cache.

## v6 – Kettlebell Mix 60/30
Nytt sekvensbasert Kettlebell-program.
- Hver arbeid/hvile-del er en egen aktivitet.
- Coach kan redigere tekst, Timer og Warning for hver aktivitet.
- Programmet bruker samme timer-visning, lyd/stemme og varsellogikk som de øvrige intervallprogrammene.
- Programmet kan eksporteres/importeres sammen med de andre programmene.
- SQL utvider `cr_program_activities` med `duration_seconds` og `warning_seconds`.

Merk: Tabellen som ble oppgitt har 15 arbeidsøkter + 15 hvileøkter, altså 22:30 total varighet, ikke 30:00. v6 følger tabellen nøyaktig.

## v6.1 – Kettlebell Mix 20 runder
- 20 arbeidsperioder + 20 hvileperioder = 30:00.
- Runde 16–20 bruker foreløpig Kettlebell Swing / Hvile.
- Kjør den nye v6.1-delen i SQL_SETUP.sql for å legge programmet inn i Supabase.

## v6.2 – Hold skjermen på under aktiv økt
- Bruker Screen Wake Lock API når en utøver starter eller fortsetter en økt.
- Wake Lock forsøkes automatisk aktivert igjen når brukeren går tilbake til appen etter å ha byttet fane/app.
- Wake Lock slippes når økten fullføres, forkastes eller brukeren logger ut.
- Krever HTTPS og en nettleser som støtter Screen Wake Lock API.

## v6.3 – fasefarger og nedtelling
- Arbeid: lys grønn.
- Hold ut-varsel: gul.
- Hvile: rød.
- Gjør klar-varsel: lys blå.
- Kort beep ved 5, 4, 3, 2 og 1 sekund igjen i hver arbeid/hvile-fase.
- Gjelder både vanlige intervallprogrammer og Kettlebell Mix-sekvensen.

## v6.4 – mobil lyd fix
- Én persistent AudioContext brukes gjennom hele økten.
- Audio låses opp når brukeren trykker Start eller Fortsett.
- Beep ved 5, 4, 3, 2 og 1 sekund bruker samme aktive AudioContext.
- Ekstra opplåsing ved berøring under aktiv økt, nyttig etter app-/fanebytte.

## v7 – Løping
- GPS-basert løpeprogram med tid, distanse, snittpace og aktuell pace.
- Pause/Fortsett.
- GPS-status og nøyaktighet.
- Wake Lock under aktiv økt.
- Lagrer tid, distanse, snittpace, rating og kommentar.
- Ruten lagres foreløpig ikke, kun beregnet distanse.
- Kjør v7-delen i SQL_SETUP.sql før testing.

## v7.1 – Løping start-fix
- Rettet programkontrollen som stoppet Løping med meldingen «ikke aktivert i treningsmotoren».
- Løping gjenkjennes både på program-id `running` og programnavnet `Løping`.
- Cache-versjon oppdatert.

## v7.2 – Løpedata i kalender
- Fullførte løpeøkter viser distanse i km og tid i minutter i kalenderen.
- Snittpace vises i detaljlinjen når den finnes.
- Aktive løpeøkter viser tiden som har gått; distansen kommer når økten er lagret.

## v7.7 – Programmer fix
- Gjenopprettet `ensureProgramActivitiesSeeded`, som manglet i v7.6.
- Coach → Programmer åpner igjen programeditoren.
- Eksisterende aktiviteter i Supabase beholdes.
- Styrkeprogrammer seedes bare dersom aktivitetstabellen er tom.
- Ingen ny SQL er nødvendig dersom v7.6 SQL allerede er kjørt.

## v7.8 – programvisning
- Rettet 1/2/3-knappene i utøvermodus.
- Valgt antall kolonner lagres per bruker på enheten.
- Programkortene strekkes til lik høyde i samme rad.
- `Start økt` ligger nederst på samme nivå på alle kort.
- Ingen ny SQL nødvendig.

## v7.9 – Kettlebell Mix aktivitetskort
- Kettlebell Mix har nå fast høyde på aktivitetskortet.
- Aktivitetsnavnet reserverer alltid plass til to linjer.
- Beskjedfeltet og «Neste»-feltet reserverer også fast plass.
- Kortet hopper derfor ikke opp/ned når aktivitetsnavn har ulik lengde.
- Ingen ny SQL nødvendig.

## v8 – 20 minutes Workout
- Nytt program: 20 minutes Workout.
- Teller ned fra 20:00 til 00:00.
- 20:00–12:00: mørk grønn.
- 12:00–07:00: lys grønn.
- 07:00–02:00: gul.
- 02:00–00:00: lys blå.
- 3 sekunder lang beep ved 10:00.
- Pause/Fortsett og fullføring med rating/kommentar.
- Wake Lock under aktiv økt.
- Kjør v8-delen i SQL_SETUP.sql for å legge programmet til i Supabase.

## v8.1 – Fri økt
- Starter timer på 00:00 og teller opp til avslutning.
- Ved avslutning: rating, kommentar og valgfri distanse i km.
- Eksempel: kommentar `Tredemølle`, distanse `5,5`.
- Wake Lock beholdes.
- Kjør v8.1-delen i SQL_SETUP.sql.

## v8.2 – Programinformasjon
- Hvert programkort har en `i`-knapp.
- `i` åpner en ryddig programoversikt uten å starte økten.
- Styrkeprogrammer viser aktivitet, gruppe, runde, reps, load og beskrivelse.
- Kettlebell Mix viser alle arbeid/hvile-intervaller med tid og varsel.
- Vanlige intervallprogrammer viser arbeid/hvile/runder.
- Løping, Fri økt og 20 minutes Workout får egne informative oversikter.
- Ingen ny SQL nødvendig.

## v8.3 – aktivitetskort ved start
- Oppgavebaserte programmer henter nå aktivitetene direkte fra `cr_program_activities` i Supabase når økten starter.
- Hvis Supabase-data mangler, brukes lokal programdefinisjon som fallback.
- Hindrer at økten starter med tomt aktivitetskort.
- Ingen ny SQL nødvendig.

## v8.4 – Sequence runner fix
- Rettet feilen som gjorde at Styrke Dag1/Dag2 startet økten uten å vise aktivitetskort.
- Gjenopprettet den stabile sequence-runneren.
- Aktivitetene hentes fortsatt fra Supabase via `getSequenceItems()`, med lokal fallback.
- Gammel/ødelagt lokal runner-state repareres automatisk.
- Ingen ny SQL nødvendig.

## v8.5 – start/fortsett fix
- Fant rotårsaken til at Start økt / Fortsett økten kunne se ut til å gjøre ingenting.
- Appen ventet på Screen Wake Lock før den byttet til treningsskjermen.
- Wake Lock kjøres nå i bakgrunnen og kan aldri blokkere navigasjonen.
- Sequence-runner tvinger aktivitetsvisningen synlig når Styrke Dag1/Dag2 åpnes.
- Ingen ny SQL nødvendig.

## v8.6 – runner definition fix
- Rettet konkret JavaScript-feil: `isRunningProgram is not defined`.
- `launchRunner()` bruker nå tydelig programrouting for Fri økt, 20 min, Løping, Kettlebell Mix, intervall og styrke.
- Aktiv-session timer tåler at session blir null under refresh/auth-event.
- Fortsett-knappen laster aktiv session på nytt hvis nødvendig.
- Ingen ny SQL nødvendig.

## v8.7 – GPS-spor
- Løping lagrer nå selve GPS-sporet i tillegg til distanse og pace.
- Sporet lagres i `cr_workout_sessions.gps_track` som JSON.
- Hvert punkt inneholder latitude, longitude, accuracy og timestamp.
- Punkter med nøyaktighet dårligere enn 50 m eller åpenbare GPS-hopp filtreres bort.
- Sporet lagres lokalt under økten og skrives til Supabase når økten fullføres.
- Kjør v8.7-delen i SQL_SETUP.sql før testing.

## v8.8 – kartvisning av GPS-spor
- Fullførte løpeøkter med `gps_track` får knappen `🗺 Vis rute` i Kalender.
- Ruten vises på interaktivt OpenStreetMap-kart via Leaflet.
- Start- og sluttpunkt markeres.
- Kartet zoomer automatisk til hele ruten.
- Fungerer både for utøverens egen kalender og coachens kalender når coach velger en utøver.
- Hvis kartbiblioteket ikke kan lastes, vises en enkel rute-tegning som fallback.
- Ingen ny SQL nødvendig.

## v8.9 – Coach Live
- Coach-dashboardet viser alle aktive økter for godkjente utøvere.
- Oppgavebaserte/intervallbaserte økter viser progresjonsbar og aktuell aktivitet.
- Løping viser live distanse og current pace.
- Løping får `🗺 Kartplassering`, som viser ruten så langt og siste GPS-posisjon.
- Utøverappen publiserer live-status til `cr_workout_sessions` omtrent hvert 5. sekund.
- Coach-listen oppdateres automatisk omtrent hvert 5. sekund.
- Kjør v8.9-delen i SQL_SETUP.sql før testing.

## v8.10 – Coach Live plassering og automatisk oppdatering
- `Pågående økter` er flyttet over `Varsler` på Coach Dashboard.
- Seksjonen er kun synlig i coach-modus og skjules eksplisitt for utøvere.
- Live-listen oppdateres automatisk hvert 5. sekund mens coach-dashboardet er synlig.
- Polling stopper når coach går til en annen side/fane eller nettleserfanen skjules.
- Når coach kommer tilbake til dashboardet, oppdateres listen umiddelbart og polling starter igjen.
- Ingen ny SQL nødvendig.

## v8.11 – Coach Live fix
- Rettet feil som gjorde at `Pågående økter` ble skjult: coach-mode-koden lå ved en feil inne i audio-funksjonen.
- `Pågående økter` ligger fortsatt over `Varsler` og vises kun for coach.
- Automatisk oppdatering starter nå etter at Coach Dashboard faktisk er synlig.
- Live-listen oppdateres hvert 5. sekund kun mens dashboardet er åpent.
- Varsler dupliseres ikke lenger av live-oppdateringene: UPDATE hvert 5. sekund ignoreres som varsel.
- Varsel vises kun ved faktisk start (INSERT) og faktisk fullføring (UPDATE til completed).
- Viser tidspunkt for siste live-oppdatering.
- Ingen ny SQL nødvendig.

## v8.12 – rullerende tidsprogresjon
- Løping og Fri økt bruker tidsbasert progresjonsbar i Coach Live.
- 0–60 min: bar fra 0 til 60.
- Etter 60 min starter baren på nytt med skala 60–120.
- Etter 120 min fortsetter den 120–180 osv.
- Påløpt tid vises over baren.
- Selve tidsbaren oppdateres lokalt hvert sekund; databasepolling er fortsatt bare hvert 5. sekund.
- Ingen ny SQL nødvendig.

## v9.0 – Golf
- Nytt program `Golf`.
- Før start velger utøveren bane, 9/18 hull og starthull.
- Hullene bygges i riktig rekkefølge og wrap-er etter hull 18.
- Timer og GPS-tracking starter når `Start runde` trykkes.
- Aktivitetskortet viser aktuelt hull og neste hull.
- For hvert hull registreres antall slag før `Fullført hull`.
- `Skip` hopper over hullet; `Postpone` flytter hullet til slutten.
- Total slag, progresjon, tid og gangdistanse vises under runden.
- GPS-sporet lagres i `gps_track`; scorekort lagres i `golf_scorecard`.
- Pågående Golf publiserer progresjon og live GPS til Coach Live.
- Golf-ruter kan vises på kart både under runden og fra Kalender.
- Kjør v9.0-delen i SQL_SETUP.sql før testing.

## v9.1 – Golf banedata + Previous/Next + Kalenderfix
- Rettet kalenderfeilen fra v9.0: `isGolf` manglet og stoppet visning av utførte økter.
- Golfkortet har Previous/Next for å bla tilbake til tidligere spilte hull.
- Tidligere fullførte hull kan åpnes og antall slag kan redigeres og lagres.
- Golf-oppsettet kan søke etter bane ved navn via Nominatim eller finne golfbaner nær GPS-posisjonen via Overpass/OpenStreetMap.
- Etter valg av bane forsøker appen å hente `golf=hole`, `par` og `golf=pin`.
- Dersom eksplisitt pin ikke finnes, brukes endepunktet på den kartlagte `golf=hole`-linjen som mulig flagg/greenposisjon.
- Under aktivt hull vises Par og automatisk luftlinjeavstand fra spillerens GPS-posisjon til kartlagt flagg/green.
- Golfkartet viser GPS-spor, hullets kartlagte linje og flaggposisjon når data finnes.
- Kartdekning varierer mellom golfbaner; runden fungerer også uten eksterne banedata.
- Kjør v9.1-delen i SQL_SETUP.sql før testing.

## v9.2 – Golf tracking
- Golf GPS-spor lagres nå fortløpende i `cr_workout_sessions.gps_track`, ikke bare når runden avsluttes.
- `distance_meters` og `golf_scorecard` lagres også fortløpende.
- `live_gps_track` brukes fortsatt for Coach Live.
- Golf-skjermen viser antall lagrede GPS-punkter og tydelig `GPS Aktiv`.
- Ingen ny SQL nødvendig dersom v9.1-SQL er kjørt.

## v9.3 – Golfbanedatabase
- Norefjell Golfklubb ferdig registrert med 18 hull, Par, Index og Tee 39/43/48/50 fra klubbens offisielle scorekort.
- Ny Coach → Golfbaner-side for redigering av hull og green-koordinater.
- Lagrede baner kan velges direkte før golfrunden.
- Green-koordinater kan legges inn senere; da beregnes GPS-avstand automatisk.
- Kjør v9.3-delen i SQL_SETUP.sql.

## v9.3.1 – kritisk login-fix
- Rettet JavaScript parse-feil rundt `openGolfSetup()` i v9.3.
- Hele app.js valideres nå med Node syntax check.
- Ingen ny SQL nødvendig utover v9.3.

## v9.3.2 – login/bootstrap fix
- Fant den faktiske runtime-feilen: `coachGolfCoursesBtn` var registrert i JavaScript, men manglet i HTML.
- Dette ga `Cannot set properties of null (setting 'onclick')` før auth-init, og innloggingen startet derfor aldri.
- Knappen er nå lagt inn i Coach-visningen.
- Nye Golf-admin bindings er gjort defensive slik at manglende UI-element aldri kan stoppe innlogging igjen.
- Ingen ny SQL nødvendig.

## v9.3.3 – Golf banedata fix
- Lagrede banedata lastes nå automatisk fra `cr_golf_courses`/`cr_golf_holes` ved start.
- Hvis utøveren bare skriver «Norefjell Golfklubb», forsøker appen å matche navnet mot banedatabasen.
- På en allerede aktiv Golf-runde uten `courseData` hentes banedata automatisk og lagres tilbake på økten.
- Hvis databasen bare inneholder én bane, velges den automatisk i Golf-oppsettet.
- Ingen ny SQL nødvendig.

## v9.4 – Golf swipe
- Golf delt i tre horisontale swipe-sider: oversikt, hullkort og live kart.
- Kartet viser spillerposisjon, GPS-spor, green og løpende avstand når green-koordinater finnes.
- Ingen ny SQL nødvendig.

## v9.5 – mobil/PWA
- Golfkortet utnytter mobilskjermen bedre og skjuler app-headeren under aktiv golfrunde.
- Neste hull er gjort betydelig mer kompakt.
- Tre swipe-sider beholdes, men høyden tilpasses tilgjengelig skjerm.
- PWA-metadata er forbedret for Android/iPhone og portrait-visning.
- Når nettleseren støtter installasjon, vises `Installer CR-Workout` i kontomenyen.
- Når appen installeres på hjemskjermen, åpnes den i standalone-modus uten vanlig URL-linje.
- Ingen ny SQL nødvendig.

## v9.6 – Golf utslagssted og hullengde
- Ved start av Golf velges Tee 39, 43, 48 eller 50.
- Valgt tee lagres på golfrunden i `cr_workout_sessions.golf_tee`.
- Hullkortet viser nå både Par og hullets lengde i meter fra valgt tee.
- Neste hull viser Par, meter og valgt tee i den kompakte infolinjen.
- Rundeoversikten viser valgt tee og lengde for aktuelt hull.
- Scorekortet lagrer tee og hullengde per fullført hull.
- Kjør v9.6-delen i SQL_SETUP.sql før testing.

## v9.7 – dynamiske utslagssteder
- Tee-valg er ikke lenger hardkodet til 39/43/48/50.
- Nye tabeller: `cr_golf_tees` og `cr_golf_hole_lengths`.
- Hver bane kan ha egne tee-koder/navn og egne hullengder.
- Norefjell migreres automatisk til den nye modellen.
- Grenland & Omegn Golfklubb legges inn med gjeldende Par 71 og 2026-baneguide.
- Grenland: Tee 48, 53, 57 og 59 har komplette hullengder. Tee 31 registreres fordi den finnes i gjeldende slope, men hull-for-hull-lengder er ikke publisert i klubbens baneguide og er derfor ikke gjettet.
- Klubben opplyser at fysiske/Gimmie-merkinger kan avvike: 50→48, 55→53, 57→58 og 59→60.
- Kjør v9.7-delen i SQL_SETUP.sql før testing.

## v9.7.1 – Grenland hullengde fix
- Golf-runden verifiserer nå at valgt tee faktisk har hullengder i `courseData`.
- Hvis en aktiv eller ny runde har gammel/ufullstendig `golf_course_data`, lastes banedata på nytt fra `cr_golf_tees` og `cr_golf_hole_lengths`.
- Golf-oppsettet viser nå også hvor mange hull-lengder som er lastet fra databasen.
- Ingen ny SQL nødvendig dersom v9.7-SQL er kjørt.

## v9.8 – Golf CSV-import
- Coach → Golfbaner har nå `Importer CSV`.
- Importen oppretter/oppdaterer `cr_golf_courses`, `cr_golf_holes`, `cr_golf_tees` og `cr_golf_hole_lengths`.
- CSV valideres før import: én bane, gyldige hull/par/tee/lengder og tilstrekkelig teedekning.
- `CSV-mal` kan lastes ned direkte fra appen.
- `GOLF_CSV_PROMPT.txt` følger med og kan brukes ved å bytte kun banenavnet.
- Ingen ny SQL nødvendig når v9.7-tabellene allerede finnes.

## v9.8.1 – Golfbaner/mobile fix
- Rettet skjermnavigasjonen slik at Coach → Golfbaner faktisk viser golfadministrasjonen.
- Golfbanesiden viser CSV-importen på mobil.
- Bunnmenyen bruker fem like kolonner og kan ikke skyve Statistikk utenfor skjermen.
- Bedre mobilbredde/padding og safe-area-støtte.
- Ny service-worker-cache for å tvinge inn oppdatert kode.

## v9.8.2 – navigasjon/login-visning fix
- Rettet regresjon fra v9.8.1 der `landingScreen` ikke ble skjult etter innlogging.
- Gjeninnført den stabile `showOnly()`-logikken fra v9.7.1, med støtte for `golfCourses`.
- Rettet bunnmenyen: gammel `translateX(-50%)` fjernes eksplisitt.
- Menyknapper fordeles automatisk over hele skjermbredden, og skjulte coach-knapper tar ikke plass.
- `Statistikk` skal nå være fullt synlig på mobil.
- Ingen SQL-endring.

## v9.8.3 – Wake Lock / GPS-sikkerhet
- Wake Lock AV for Løping, Golf og Fri økt, slik at skjermen kan slukkes/låses.
- Wake Lock PÅ for øvrige aktive programmer med timer/definert økt.
- Når appen kommer tilbake i forgrunnen, brukes programtypen til å avgjøre om Wake Lock skal gjenopprettes.
- Løping, Golf og Fri økt krever to trykk innen 5 sekunder for å avslutte økten.
- Første trykk endrer knappen til «Trykk igjen for å avslutte».
- Ingen SQL-endring.
- Merk: PWA/nettleser kan ikke garantere kontinuerlig GPS når skjermen er låst; dette styres også av mobilens operativsystem/nettleser.

## v9.8.4 – Kroppsvekt Dag 1/2/3
- Bygget videre på stabil v9.8.3-baseline, ikke v9.9.
- Lagt til Kroppsvekt Dag 1, Dag 2 og Dag 3 i programs.js.
- Hver økt består av 9 øvelser gjennomført som 3 runder.
- Øvelseskortene inneholder reps/tid og korte teknikk-/nivåvarianter.
- Programinnholdet følger helkroppsprogrammet fra Hardworkout.no (kontrollert 2026-08-14).
- Ingen database- eller SQL-endring i denne pakken.

## v9.8.5 – Kroppsvekt treningsmotor fix
- Kroppsvekt Dag 1/2/3 gjenkjennes nå eksplisitt som oppgavebaserte sequence-programmer.
- Start av programmet er ikke lenger avhengig av at nettleseren har nyeste programs.js i minnet.
- Sequence runner kan hente programnavn fra cr_programs hvis lokal definisjon mangler.
- SQL_v9_8_5_BODYWEIGHT_ACTIVITIES.sql legger eksplisitt inn 27 aktiviteter per program i Supabase.
- Kjør SQL-filen én gang før testing.

## v9.8.6 – Muskelvekst Dag 1–5
Fem oppgavebaserte styrkeprogrammer basert på Hardworkout sitt 12-ukersprogram med manualer/egenvekt.
Hvert sett er en egen aktivitet. Målreps, sett X/Y, ca. 45 sek pause og 1–2 RIR vises i aktivitetsdata.
SQL_v9_8_6_MUSCLE_GROWTH.sql registrerer både programmer og alle aktivitetene i Supabase.

## v9.8.7 – Muskelvekst: sett = runde
Rettet rekkefølgen i Muskelvekst Dag 1–5. Ett sett av hver øvelse gjennomføres før neste runde.
Eksempel: Runde 1: Brystpress → Skrå brystpress → ... → Dips. Runde 2 starter deretter på Brystpress igjen.
Øvelser med færre sett hoppes over i senere runder.

## v9.8.8 – How To på Muskelvekst-øvelser
- Info-knapp (i) på NÅ- og NESTE-kort når øvelsen har en How To.
- Åpner mobilvennlig modal med kort, egenformulert teknikkbeskrivelse og tips.
- Beskrivelsene er korte parafraser/teknikk-cues, ikke kopiert tekst fra Hardworkout.
- Programrekkefølgen fra v9.8.7 (sett = runde) er uendret.
- Ingen SQL-endring nødvendig fra v9.8.7.

## v9.8.8.1 – How To knapp-fix
- Rettet X-knappen i How To-vinduet.
- Rettet «Tilbake til økten».
- Feilen var at event-handlerne i v9.8.8 lå utenfor appens JavaScript-scope.
- Trykk på bakgrunnen utenfor How To-kortet lukker også vinduet.
- Større touch-flate på X og tilbakeknappen.
- Ingen SQL-endring nødvendig.

## v9.8.8.2 – How To på Kroppsvekt-programmene
- Kroppsvekt Dag 1/2/3 får nå samme `i`-knapp som Muskelvekst-programmene.
- How To er lagt inn for alle 9 øvelsene:
  Jump squat, Push-ups, Pull-ups / assisterte pull-ups, Gående utfall,
  Pike push-ups, Omvendt roing, Ett-beins glute bridge, Planke og Sideplanke.
- X, «Tilbake til økten» og trykk på bakgrunnen fungerer som i v9.8.8.1.
- Ingen SQL-endring nødvendig.

## v9.8.9 – TIF Viking Off Season
Seks nye programmer:
- Økt 1 Underkropp variant 1 og 2
- Økt 2 Overkropp variant 1 og 2
- Økt 3 Split Over/underkropp variant 1 og 2

Sett behandles som runder. Runde 1 går gjennom sett 1 av alle øvelser, deretter runde 2 osv.
Øvelser med tre sett hoppes over i runde 4. Fokus-teksten fra programmet vises i aktivitetsbeskrivelsen.

## v9.8.9.1 – TIF Viking reps/load
For TIF Viking Off Season flyttes belastningsinformasjon som står etter `reps`,
`reps per fot`, `reps per arm` eller `reps per side` til `load`.
Eksempel: `4 reps 80–85 % @ 1-2 RIR` blir reps=`4 reps`, load=`80–85 % @ 1-2 RIR`.
`6 reps per fot (2 RIR)` blir reps=`6 reps per fot`, load=`2 RIR`.
Hopp, meter og sekunder uten `reps` beholdes i reps-feltet.

## v9.8.9.2 – TIF Viking navn, logo og How To
- `i` fjernet fra NESTE-kortet; beholdes kun på NÅ/current.
- Kortere navn på de seks TIF Viking-programmene.
- TIF Viking-logo lagt inn som `tif-viking-logo.png` og brukes på TIF-programkortene.
- Ingen endring i øvelser, runder, reps eller load.

## v9.8.9.3 – Balløkt
- Nytt program `Balløkt`, basert på Fri økt.
- Fri timer uten definert slutt.
- Rating og kommentar ved avslutning.
- Distanse er fjernet.
- Programkortet bruker TIF Viking-logo med volleyballmarkør.
- Balløkt behandles som åpen økt i coachens Pågående økter.
- Wake Lock er av, som for Fri økt/Løping/Golf.

## v9.9.0 – Programkategorier
- Utøverens Hjem viser kategori-kort: Styrke, Ball, Løpe og Golf.
- Bare kategorier som inneholder programmer tildelt akkurat den utøveren vises.
- Trykk på kategori åpner utøverens tildelte programmer i kategorien.
- 1/2/3-kolonnevisning beholdes inne i kategorien.
- Coach → Utøver → Programmer grupperer tildelingslisten etter kategori.
- Coach → Programmer har et nytt Kategori-felt som kan endres.
- Ny additiv kolonne `cr_programs.category`.
- Treningsmotor, GPS, historikk og programinnhold er uendret.
- Rollback til v9.8.3 er fortsatt mulig; den ekstra category-kolonnen er ufarlig.

## v9.9.1 – Annen aktivitet
- Kategorien «Løpe» heter nå «Annen aktivitet».
- Løping, Kettlebell, Kettlebell Mix og Fri økt legges i denne kategorien.
- Intern category-verdi `running` beholdes for kompatibilitet.
