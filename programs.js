/*
  CR-Workout – PROGRAMINNHOLD
  ----------------------------------------
  Dette er filen du normalt redigerer når et treningsprogram skal endres.
  Du trenger ikke endre app.js.

  For styrkeprogrammene er hver øvelse skrevet slik:
  ["Øvelse", "reps", "belastning", "beskrivelse"]

  WARM brukes av både Styrke Dag1 og Styrke Dag2.
*/
(() => {
  const interval = {
    kettlebell: {name:"Arbeid/Hvile 60/30", work:60, rest:30, rounds:20, workWarning:10, restWarning:5},
    tabata: {name:"Tabata 20/10", work:20, rest:10, rounds:8, workWarning:5, restWarning:3},
    strength_4515: {name:"Styrke 45/15", work:45, rest:15, rounds:12, workWarning:10, restWarning:5}
  };

  const WARM = [
    ["Ryggliggende kryss","8","","2 x 8 hver side"],
    ["Sideveis utfall","12","","2 x 12 annenhver side"],
    ["Planke rotasjon","8","","2 x 8 hver side"],
    ["Knebøy","15","","2 x 15"],
    ["Skorpion","12","","2 x 12 annenhver side"],
    ["Push ups","10","","2 x 10"]
  ];

  function warmup(){
    let out=[],order=1;
    for(let r=1;r<=2;r++) for(const x of WARM)
      out.push({group:"WarmUp",order:order++,activity:x[0],round:r,reps:x[1],load:x[2],desc:x[3]});
    return out;
  }
  function rows(main,rounds=3,finalSquat=true){
    let out=warmup(),order=out.length+1;
    for(let r=1;r<=rounds;r++) for(const x of main)
      out.push({group:"Main",order:order++,activity:x[0],round:r,reps:x[1],load:x[2],desc:x[3]});
    if(finalSquat) out.push({group:"Main",order:order++,activity:"Knebøy",round:4,reps:"10",load:"50 %",desc:"4 x 10 (50%)"});
    return out;
  }

  const DAY1_MAIN = [
    ["Knebøy","10","50 %","4 x 10 (50%)"],
    ["Utfall front left","10","20 %","3 x 8 hvert ben (20%)"],
    ["Nedtrekk","10","80 %","3 x 10 (80%)"],
    ["Legghev","20","","3 x 10 hvert ben (50%)"],
    ["Skulderhev","20","","3 x 10 hver side"],
    ["Jon spesial","25","","3 x 25"],
    ["Hoftehev","10","","3 x 10 annenhver side"],
    ["Valgfri","","","3 x ??"],
    ["Lårcurl","10","50 %","3 x 10 (50%)"],
    ["Lårstrekk","10","50 %","3 x 10 (50%)"]
  ];

  const DAY2_MAIN = [
    ["Knebøy","10","50 %","4 x 10 (50%)"],
    ["Bulgarsk","8","30 %","3 x 8 hvert ben (30%)"],
    ["Step up","10","20 %","3 x 10 hvert ben (20%)"],
    ["Opptrekk stang","10","","3 x 10"],
    ["Legghev","10","50 %","3 x 10 hvert ben (50%)"],
    ["Skulderpress","10","70 %","3 x 10 (70%)"],
    ["Sideplanke","10","","3 x 10 hver side"],
    ["Hoftehev ball","10","","3 x 10"],
    ["Pull over","10","60 %","3 x 10 (60%)"],
    ["Lårcurl","10","50 %","3 x 10 (50%)"],
    ["Lårstrekk","10","50 %","3 x 10 (50%)"]
  ];


  // Kroppsvekt-program basert på Hardworkout.no sitt 3-dagers helkroppsprogram.
  // Samme sirkel gjennomføres tre ganger. Dag 1/2/3 er separate programmer
  // slik at coach kan tildele og planlegge dem uavhengig.
  const BODYWEIGHT_MAIN = [
    ["Jump squat","10–15","","Land mykt. Enklere: vanlig knebøy. Mer krevende: tuck jump eller kort pause i bunn."],
    ["Push-ups","10–20","","Hold kroppen strak. Enklere: knær i gulvet eller hender på benk. Mer krevende: diamond/archer push-ups."],
    ["Pull-ups / assisterte pull-ups","6–12","","Trekk skulderbladene ned og bak. Enklere: strikk eller negative. Mer krevende: ekstra vekt."],
    ["Gående utfall","10–15 per bein","","Langt steg og kontrollert 90° knevinkel. Enklere: utfall på stedet. Mer krevende: bulgarske utfall."],
    ["Pike push-ups","8–12","","Hold hoftene høyt i omvendt V. Enklere: hender på benk. Mer krevende: handstand push-ups mot vegg."],
    ["Omvendt roing","10–15","","Hold kroppen strak og trekk brystet mot stangen/ringene. Enklere: høyere stang. Mer krevende: ettbeins variant."],
    ["Ett-beins glute bridge","10–15 per bein","","Press hoften opp uten rotasjon. Enklere: begge bein i gulvet. Mer krevende: hold 2–3 sek i toppen."],
    ["Planke","30–60 sek","","Stram mage og sete og hold kroppen rett. Enklere: knær i gulvet. Mer krevende: beinløft."],
    ["Sideplanke","20–40 sek per side","","Hold kroppen i rett linje. Enklere: kne i gulvet. Mer krevende: løftet bein eller hoftehev."]
  ];

  function bodyweightRows(){
    let out=[],order=1;
    for(let r=1;r<=3;r++){
      for(const x of BODYWEIGHT_MAIN){
        out.push({
          group:"Main",
          order:order++,
          activity:x[0],
          round:r,
          reps:x[1],
          load:x[2],
          desc:x[3]
        });
      }
    }
    return out;
  }

  const MUSCLE_GROWTH = {
    muscle_growth_day1: {name:'Muskelvekst Dag 1', focus:'Bryst, skuldre og triceps', exercises:[['Brystpress flatbenk',5,'8–10'],['Skrå brystpress',4,'8–10'],['Brystpress fra gulv',3,'8–12'],['Stående skulderpress',4,'8–10'],['Sidehev',3,'8–12'],['Enarms triceps press',3,'8–12'],['Dips på benk (eller stol)',3,'8–12']]},
    muscle_growth_day2: {name:'Muskelvekst Dag 2', focus:'Bein og mage', exercises:[['Goblet squat',4,'8–10'],['Strake markløft',4,'8–10'],['Utfall bakover',4,'8–10 per bein'],['Markløft',3,'8–12'],['Tåhev',4,'20'],['Russian twist',3,'20'],['Liggende beinhev',3,'20']]},
    muscle_growth_day3: {name:'Muskelvekst Dag 3', focus:'Rygg og biceps', exercises:[['Fremoverlent roing',4,'8–12'],['En-arms roing',4,'8–12 per side'],['Pullover',3,'8–12'],['Renegade row',4,'8–12'],['Bicepscurl',3,'10–15'],['Hammercurl',3,'10–15']]},
    muscle_growth_day4: {name:'Muskelvekst Dag 4', focus:'Bein og mage', exercises:[['Knebøy',4,'8–10'],['Markløft',4,'8–10'],['Splitt-knebøy',3,'8–12 per side'],['Hip Thrust',4,'10–15'],['Tåhev',4,'20'],['Sidebøy',3,'15 per side'],['Planken',3,'30 sek']]},
    muscle_growth_day5: {name:'Muskelvekst Dag 5', focus:'Helkropp', exercises:[['Goblet squat',4,'8–10'],['Hip Thrust',4,'10–15'],['Renegade row',4,'8–12'],['Arnold Press',4,'8–10'],['Skrå brystpress',4,'8–12'],['Roing over benk',3,'8–12'],['Dips på benk (eller stol)',3,'8–12']]},
  };

  function muscleGrowthRows(programId){
    const cfg=MUSCLE_GROWTH[programId];
    if(!cfg)return [];
    let out=[],order=1;
    const maxSets=Math.max(...cfg.exercises.map(ex=>Number(ex[1]||0)));
    // Ett sett av hver øvelse per runde:
    // Runde 1 = sett 1 av alle øvelser, Runde 2 = sett 2 osv.
    for(let setNo=1;setNo<=maxSets;setNo++){
      for(const ex of cfg.exercises){
        const [activity,sets,reps]=ex;
        if(setNo>sets)continue;
        out.push({
          group:"Main",order:order++,activity,
          round:setNo,reps,load:"",
          desc:`Runde ${setNo} · sett ${setNo} av ${sets} · mål ${reps} reps · ca. 45 sek pause · velg belastning med ca. 1–2 RIR`
        });
      }
    }
    return out;
  }

  const TIF_OFFSEASON = {
    tif_offseason_1_v1: {name:'TIF Viking-Økt 1 (under) vr.1', exercises:[['CMJ', 'Maks høyde, kort kontakttid', ['2 hopp', '2 hopp', '2 hopp']],['Knebøy', 'Rolig ned, tempo opp', ['4 reps 80–85 % @ 1-2 RIR', '4 reps 80–85 % @ 1-2 RIR', '4 reps 80–85 % @ 1-2 RIR', '4 reps 80–85 % @ 1-2 RIR']],['Bulgarsk splittbøy', 'Bryst opp, lavt kne', ['6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)']],['Rumensk markløft / leg curl', 'Kontrollert', ['5 reps (2 RIR)', '5 reps (2 RIR)', '5 reps (2 RIR)', '5 reps (2 RIR)']],['KB goblet squat', 'Kontrollert', ['5 reps (2 RIR)', '5 reps (2 RIR)', '5 reps (2 RIR)', '5 reps (2 RIR)']],['Et fots tåhev', 'Kontrollert (ROM)', ['8 reps per fot (2 RIR)', '8 reps per fot (2 RIR)', '8 reps per fot (2 RIR)']],['Depth Landing', 'Stabil landing', ['3 reps', '3 reps', '3 reps']]]},
    tif_offseason_1_v2: {name:'TIF Viking-Økt 1 (under) vr.2', exercises:[['Box jump', 'Maks høyde, kort kontakttid på boks', ['2 hopp', '2 hopp', '2 hopp']],['Pogo jumps', 'Kort landing, små hopp', ['15 hopp', '15 hopp', '15 hopp']],['Plyo bar squat', '50–60 % av 1RM knebøy, maksimal hastighet', ['6 reps', '6 reps', '6 reps', '6 reps']],['Leg extension', 'Hvis du har tilgang til maskin, utfall om ikke', ['6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)']],['Hip Thrust', 'Høyt skyv, maksimal hastighet', ['4 reps (1-2 RIR)', '4 reps (1-2 RIR)', '4 reps (1-2 RIR)', '4 reps (1-2 RIR)']],['Nordic / leg curl', 'Kontrollert bevegelse', ['10-12 reps per fot', '10-12 reps per fot', '10-12 reps per fot']],['Depth Landing', 'Stabil landing', ['3 reps', '3 reps', '3 reps']]]},
    tif_offseason_2_v1: {name:'TIF Viking-Økt 2 (over) vr.1', exercises:[['Medball Chest Throw', 'Plyo arbeid, maks kraft ball til vegg', ['4-6 reps', '4-6 reps', '4-6 reps']],['BB/DB Benkpress', 'Rolig ned, tempo opp', ['4 reps 80–85 % · mål 1-2 RIR', '4 reps 80–85 % · mål 1-2 RIR', '4 reps 80–85 % · mål 1-2 RIR', '4 reps 80–85 % · mål 1-2 RIR']],['Pull ups / nedtrekk', 'Full bevegelse', ['6 reps (2 RIR)', '6 reps (2 RIR)', '6 reps (2 RIR)', '6 reps (2 RIR)']],['En arms roing på benk', 'Kontrollert trekk, skulderblad tilbake', ['8 reps per arm (2 RIR)', '8 reps per arm (2 RIR)', '8 reps per arm (2 RIR)', '8 reps per arm (2 RIR)']],['Push press', 'Stabil overkropp, press over hodet', ['6 reps (2 RIR)', '6 reps (2 RIR)', '6 reps (2 RIR)']],['Sideløft m/db på benk', 'Lett vekt, kontrollert bevegelse', ['10-12 reps per arm', '10-12 reps per arm', '10-12 reps per arm']],['One arm DB carry', 'Tung belastning', ['20-30 m per arm', '20-30 m per arm', '20-30 m per arm']]]},
    tif_offseason_2_v2: {name:'TIF Viking-Økt 2 (over) vr.2', exercises:[['Medball Chest Throw', 'Plyo arbeid, maks kraft ball til vegg', ['4-6 reps', '4-6 reps', '4-6 reps']],['BB/DB Skråbenk', 'Rolig ned, tempo opp, 2 sek hold i bunn', ['4 reps 2-3 RIR', '4 reps 2-3 RIR', '4 reps 2-3 RIR', '4 reps 2-3 RIR']],['Pull ups / nedtrekk', 'Full bevegelse', ['6 reps (2 RIR)', '6 reps (2 RIR)', '6 reps (2 RIR)']],['DB Roing på skråbenk', 'Kontrollert trekk, skulderblad tilbake', ['8 reps (2 RIR)', '8 reps (2 RIR)', '8 reps (2 RIR)', '8 reps (2 RIR)']],['Sideløft m/db', 'Lett vekt, kontrollert bevegelse', ['10-12 reps per arm', '10-12 reps per arm', '10-12 reps per arm']],['Half Kneeling DB Press', 'Stabil overkropp, kontrollert press over hodet', ['8 reps per arm (2 RIR)', '8 reps per arm (2 RIR)', '8 reps per arm (2 RIR)']],['Pallof press', 'Stabil kjerne, unngå rotasjon med overkropp', ['10 reps per side', '10 reps per side', '10 reps per side']]]},
    tif_offseason_3_v1: {name:'TIF Viking-Økt 3 (split) vr.1', exercises:[['Lateral Bound', 'Sideveis eksplosivitet', ['4 per side', '4 per side', '4 per side']],['Frivending / drag til bryst', 'Start fra hofte, eksplosiv avslutning', ['4 reps (2 RIR)', '4 reps (2 RIR)', '4 reps (2 RIR)', '4 reps (2 RIR)']],['Valgfri bøy variant', 'Eksplosivt opp, kontrollert ned', ['4 reps @ 75–80 % (2 RIR)', '4 reps @ 75–80 % (2 RIR)', '4 reps @ 75–80 % (2 RIR)', '4 reps @ 75–80 % (2 RIR)']],['Step Up m/ manualer', 'Eksplosivt opp, kontrollert ned', ['6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)']],['Benkpress', 'Prøv å være så eksplosiv som mulig opp', ['4 reps 80–85 % benk', '4 reps 80–85 % benk', '4 reps 80–85 % benk', '4 reps 80–85 % benk']],['Pull Ups / Nedtrekk', 'Full bevegelse, trekk albuer ned mot hofte', ['6 reps (2 RIR)', '6 reps (2 RIR)', '6 reps (2 RIR)', '6 reps (2 RIR)']],['Medball side kast', 'Eksplosive kast med medisinball', ['4 per side', '4 per side', '4 per side']],['Copenhagen Plank', 'Stabilisering kjerne', ['30s per side', '30s per side', '30s per side']]]},
    tif_offseason_3_v2: {name:'TIF Viking-Økt 3 (split) vr.2', exercises:[['Lateral Bound', 'Sideveis eksplosivitet', ['4 per side', '4 per side', '4 per side']],['Frivending / drag til bryst', 'Start fra hofte, eksplosiv avslutning', ['3 reps (2 RIR)', '3 reps (2 RIR)', '3 reps (2 RIR)', '3 reps (2 RIR)']],['Valgfri bøy variant', 'Eksplosivt opp, kontrollert ned', ['4 reps @ 75–80 % (2 RIR)', '4 reps @ 75–80 % (2 RIR)', '4 reps @ 75–80 % (2 RIR)']],['Step Up m/ manualer', 'Eksplosivt opp, kontrollert ned', ['6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)', '6 reps per fot (2 RIR)']],['Explosive Bench Press', 'Maks stanghastighet', ['4 reps 40–50 % benk', '4 reps 40–50 % benk', '4 reps 40–50 % benk', '4 reps 40–50 % benk']],['Pull Ups / Nedtrekk', 'Full bevegelse, trekk albuer ned mot hofte', ['6 reps (2 RIR)', '6 reps (2 RIR)', '6 reps (2 RIR)']],['Sideplanke med rotasjon', 'Stabilisering kjerne, kontrollert rotasjon', ['8 reps per side', '8 reps per side', '8 reps per side']],['Copenhagen Plank', 'Stabilisering kjerne', ['30s per side', '30s per side', '30s per side']]]},
  };

  function splitTifRepsLoad(value){
    const s=String(value||"").trim();

    // Keep the movement quantity in reps; move intensity/RIR/% prescriptions to load.
    // Examples:
    // "4 reps 80–85 % @ 1-2 RIR" -> reps "4 reps", load "80–85 % @ 1-2 RIR"
    // "6 reps per fot (2 RIR)" -> reps "6 reps per fot", load "2 RIR"
    // "8 reps per arm (2 RIR)" -> reps "8 reps per arm", load "2 RIR"
    const m=s.match(/^(.+?\breps(?:\s+per\s+(?:fot|arm|side))?)(?:\s+(.+))?$/i);
    if(m){
      let load=String(m[2]||"").trim();
      if(load.startsWith("(")&&load.endsWith(")"))load=load.slice(1,-1).trim();
      return {reps:m[1].trim(),load};
    }
    return {reps:s,load:""};
  }

  function tifOffseasonRows(programId){
    const cfg=TIF_OFFSEASON[programId];
    if(!cfg)return [];
    let out=[],order=1;
    const maxSets=Math.max(...cfg.exercises.map(ex=>ex[2].length));
    for(let roundNo=1;roundNo<=maxSets;roundNo++){
      for(const ex of cfg.exercises){
        const [activity,focus,sets]=ex;
        if(roundNo>sets.length)continue;
        const prescription=splitTifRepsLoad(sets[roundNo-1]);
        out.push({
          group:"Main", order:order++, activity,
          round:roundNo, reps:prescription.reps, load:prescription.load,
          desc:`Runde ${roundNo} · ${focus}`
        });
      }
    }
    return out;
  }

  window.CR_PROGRAMS = {
    interval,
    sequence: {
      strength_day1:{name:"Styrke Dag1",items:rows(DAY1_MAIN)},
      strength_day2:{name:"Styrke Dag2",items:rows(DAY2_MAIN)},
      bodyweight_day1:{name:"Kroppsvekt Dag 1",items:bodyweightRows()},
      bodyweight_day2:{name:"Kroppsvekt Dag 2",items:bodyweightRows()},
      bodyweight_day3:{name:"Kroppsvekt Dag 3",items:bodyweightRows()},
      muscle_growth_day1:{name:"Muskelvekst Dag 1",items:muscleGrowthRows("muscle_growth_day1")},
      muscle_growth_day2:{name:"Muskelvekst Dag 2",items:muscleGrowthRows("muscle_growth_day2")},
      muscle_growth_day3:{name:"Muskelvekst Dag 3",items:muscleGrowthRows("muscle_growth_day3")},
      muscle_growth_day4:{name:"Muskelvekst Dag 4",items:muscleGrowthRows("muscle_growth_day4")},
      muscle_growth_day5:{name:"Muskelvekst Dag 5",items:muscleGrowthRows("muscle_growth_day5")},
      tif_offseason_1_v1:{name:"TIF Viking-Økt 1 (under) vr.1",items:tifOffseasonRows("tif_offseason_1_v1")},
      tif_offseason_1_v2:{name:"TIF Viking-Økt 1 (under) vr.2",items:tifOffseasonRows("tif_offseason_1_v2")},
      tif_offseason_2_v1:{name:"TIF Viking-Økt 2 (over) vr.1",items:tifOffseasonRows("tif_offseason_2_v1")},
      tif_offseason_2_v2:{name:"TIF Viking-Økt 2 (over) vr.2",items:tifOffseasonRows("tif_offseason_2_v2")},
      tif_offseason_3_v1:{name:"TIF Viking-Økt 3 (split) vr.1",items:tifOffseasonRows("tif_offseason_3_v1")},
      tif_offseason_3_v2:{name:"TIF Viking-Økt 3 (split) vr.2",items:tifOffseasonRows("tif_offseason_3_v2")}
    }
  };
})();
