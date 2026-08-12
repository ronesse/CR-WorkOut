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

## v7.3 – programkort
- Utøveren kan velge 1, 2 eller 3 programkort i bredden.
- Kortene kan dras og slippes i ønsket rekkefølge, også på touchskjerm.
- Valgt visning og rekkefølge huskes lokalt per innlogget bruker på enheten.
- Ingen ny SQL nødvendig.

## v7.4 – forbedret dra/slipp på mobil
- Programkort har nå et tydelig ☰-håndtak øverst til høyre.
- På telefon: trykk/hold på ☰ og dra kortet til ønsket plass.
- Selve kortet er fortsatt klikkbart uten at scrolling eller Start økt påvirkes.
- Rekkefølgen lagres som før per innlogget bruker på enheten.
