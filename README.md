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
