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
