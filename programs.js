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
    kettlebell: {name:"Kettlebell 60/30", work:60, rest:30, rounds:20, workWarning:10, restWarning:5},
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

  window.CR_PROGRAMS = {
    interval,
    sequence: {
      strength_day1:{name:"Styrke Dag1",items:rows(DAY1_MAIN)},
      strength_day2:{name:"Styrke Dag2",items:rows(DAY2_MAIN)}
    }
  };
})();
