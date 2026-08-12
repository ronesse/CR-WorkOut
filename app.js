(() => {
"use strict";
const SUPABASE_URL="https://lannjcyihlyvvzecefrs.supabase.co";
const SUPABASE_KEY="sb_publishable_q1eHMt-EqiUGnjRF1bUt3A_s8beQVaM";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const INTERVAL_PROGRAMS=window.CR_PROGRAMS?.interval||{};
const SEQUENCE_PROGRAMS=window.CR_PROGRAMS?.sequence||{};

const $=id=>document.getElementById(id),e={};
["accountBtn","landingScreen","athleteScreen","coachScreen","runnerScreen","intervalRunner","sequenceRunner","calendarScreen","statsScreen","bottomNav","athletesNavBtn",
"openLoginBtn","openRegisterBtn","athleteStatusCard","athleteStatusTitle","athleteStatusText","assignedProgramsWrap","assignedPrograms","activeSessionCard","activeSessionName","activeStartedAt","activeElapsed","continueSessionBtn","discardSessionBtn","athleteSessionCount","athleteMinutes","athleteAvgRating",
"copyInviteBtn","copyInviteBtnAthletes","pendingCount","activeAthletesCount","sessionsTodayCount","notificationFeed","athletesList","athletesScreen","programsNavBtn","programsScreen","coachProgramSelect","coachProgramTitle","reloadProgramBtn","programEditorMessage","programActivitiesEditor","saveProgramActivitiesBtn","exportProgramsBtn","importProgramsBtn","importProgramsFile","programMetaEditor","editProgramName","editProgramDescription","intervalSettingsEditor","editWorkSeconds","editRestSeconds","editRounds","editWorkWarning","editRestWarning","calendarSubtitle","calendarAthleteSelect","prevMonthBtn","nextMonthBtn","calendarTitle","calendarGrid","calendarDetails","statsSubtitle","statsAthleteSelect","statSessions","statMinutes","statRating","statCompleted","programStats",
"accountModal","accountTitle","closeAccountBtn","authLoggedOut","authLoggedIn","loginEmail","loginPassword","loginBtn","showRegisterBtn","loginMessage","accountName","accountEmail","logoutBtn",
"registerModal","closeRegisterBtn","regName","regPhone","regEmail","regPassword","registerBtn","registerMessage","programModal","programAthleteName","closeProgramBtn","programChecklist","saveProgramsBtn",
"finishModal","finishSummary","finishStars","finishComment","saveFinishBtn","cancelFinishBtn",
"intervalCard","intervalProgramName","intervalElapsed","intervalRound","intervalRemainingTotal","intervalPhase","intervalMessage","intervalTime","intervalProgressBar","intervalNext","intervalSkipBtn","runnerAbortBtn",
"sequenceProgramName","sequenceGroupRound","sequenceElapsed","sequenceProgressText","sequenceProgressBar","sequenceActivity","sequenceReps","sequenceLoad","sequenceDesc","sequenceNextActivity","sequenceNextMeta","sequenceCompleteBtn","sequenceSkipBtn","sequencePostponeBtn","sequenceAbortBtn","runningScreen","runningProgramName","gpsStatus","runningElapsed","runningDistance","runningAvgPace","runningCurrentPace","runningGpsAccuracy","runningPointCount","runningPauseBtn","runningFinishBtn","runningDiscardBtn","twentyScreen","twentyCard","twentyProgramName","twentyRemaining","twentyBigTime","twentyPhaseText","twentyProgressBar","twentyPauseBtn","twentyFinishBtn","twentyDiscardBtn","freeWorkoutScreen","freeWorkoutProgramName","freeWorkoutElapsed","freeWorkoutBigTime","freeWorkoutFinishBtn","freeWorkoutDiscardBtn","finishDistanceWrap","finishDistance","programInfoModal","programInfoTitle","programInfoDescription","programInfoSummary","programInfoList","programInfoClose"].forEach(id=>e[id]=$(id));

let session=null,user=null,profile=null,athletes=[],programs=[],programAthleteId=null,activeSession=null,homeTimer=null,runnerTimer=null,finishRating=4,currentMonth=new Date(),realtimeChannel=null,runnerMode=null,intervalState=null,sequenceState=null,lastCueKey="";
let wakeLock=null;


function programIcon(program){
  const id=String(program?.id||program?.program_id||"").toLowerCase();
  const name=String(program?.name||program?.title||"").toLowerCase();
  if(id.includes("kettlebell-mix")||id.includes("kettlebell_mix")||name.includes("kettlebell mix")) return "kettlebell.png";
  if(id==="kettlebell"||id.includes("60-30")||id.includes("60_30")||name.includes("arbeid/hvile 60/30")) return "workrest.png";
  return null;
}

async function requestWakeLock(){
  if(!activeSession || document.visibilityState!=="visible") return;
  if(!("wakeLock" in navigator)) return;
  try{
    if(wakeLock && !wakeLock.released) return;
    wakeLock=await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release",()=>{wakeLock=null;});
  }catch(err){
    console.warn("Wake Lock kunne ikke aktiveres:",err);
  }
}
async function releaseWakeLock(){
  try{
    if(wakeLock && !wakeLock.released) await wakeLock.release();
  }catch(err){
    console.warn("Wake Lock kunne ikke frigis:",err);
  }finally{
    wakeLock=null;
  }
}
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible" && activeSession) requestWakeLock();
});
document.addEventListener("pointerdown",()=>{if(activeSession)unlockAudio();},{passive:true});


function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmtDate(iso){return new Intl.DateTimeFormat("nb-NO",{dateStyle:"medium",timeStyle:"short"}).format(new Date(iso))}
function dateKey(d){const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function elapsed(from,to=new Date()){return Math.max(0,Math.floor((new Date(to)-new Date(from))/1000))}
function fmtElapsed(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function showOnly(name){["landing","athlete","coach","athletes","programs","runner","running","twenty","freeWorkout","calendar","stats"].forEach(n=>e[n+"Screen"]?.classList.toggle("hidden",n!==name));document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",(name==="athlete"&&b.dataset.screen==="home")||(name==="coach"&&b.dataset.screen==="home")||(name==="athletes"&&b.dataset.screen==="coach")||b.dataset.screen===name))}
function openModal(m){m.classList.remove("hidden")}function closeModal(m){m.classList.add("hidden")}
function stateKey(){return activeSession?`cr_runner_${activeSession.id}`:""}
function saveRunnerState(obj){if(activeSession)localStorage.setItem(stateKey(),JSON.stringify(obj))}
function loadRunnerState(){try{return JSON.parse(localStorage.getItem(stateKey())||"null")}catch{return null}}
function clearRunnerState(){if(activeSession)localStorage.removeItem(stateKey())}
let sharedAudioContext=null;

function getAudioContext(){
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return null;
  if(!sharedAudioContext)sharedAudioContext=new C();
  return sharedAudioContext;
}

async function unlockAudio(){
  try{
    const c=getAudioContext();
    if(!c)return;
    if(c.state==="suspended")await c.resume();
    const o=c.createOscillator(),g=c.createGain();
    g.gain.value=0.00001;
    o.connect(g);g.connect(c.destination);
    o.start();
    o.stop(c.currentTime+0.02);
  }catch(err){
    console.warn("Audio kunne ikke låses opp:",err);
  }
}

function playTone(freq=1150,duration=0.10,volume=0.25){
  try{
    const c=getAudioContext();
    if(!c)return;
    if(c.state!=="running"){
      c.resume().catch(()=>{});
      return;
    }
    const o=c.createOscillator(),g=c.createGain();
    o.type="sine";
    o.frequency.setValueAtTime(freq,c.currentTime);
    g.gain.setValueAtTime(volume,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+duration);
    o.connect(g);g.connect(c.destination);
    o.start(c.currentTime);
    o.stop(c.currentTime+duration);
  }catch(err){
    console.warn("Tonefeil:",err);
  }
}

function audioCue(text){
  playTone(900,0.12,0.18);
  if("speechSynthesis" in window){
    try{
      const u=new SpeechSynthesisUtterance(text);
      u.lang="nb-NO";
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }catch{}
  }
}

function countdownBeep(){
  playTone(1300,0.10,0.30);
}

async function loadProfile(){if(!user){profile=null;return}const {data}=await sb.from("cr_profiles").select("*").eq("id",user.id).maybeSingle();profile=data||null}
function updateAccount(){const logged=!!user;e.authLoggedOut.classList.toggle("hidden",logged);e.authLoggedIn.classList.toggle("hidden",!logged);if(logged){e.accountName.textContent=profile?.full_name||user.email;e.accountEmail.textContent=user.email;e.accountTitle.textContent=profile?.role==="coach"?"Coach-konto":"Min konto"}}
async function route(){updateAccount();stopRunnerTick();if(!user){e.bottomNav.classList.add("hidden");showOnly("landing");return}e.bottomNav.classList.remove("hidden");const coach=profile?.role==="coach";e.athletesNavBtn?.classList.toggle("hidden",!coach);e.programsNavBtn?.classList.toggle("hidden",!coach);e.calendarAthleteSelect.classList.toggle("hidden",!coach);e.statsAthleteSelect.classList.toggle("hidden",!coach);if(coach){await loadCoachData();showOnly("coach");startRealtime()}else{await loadAthleteData();showOnly("athlete")}}

async function login(){e.loginMessage.textContent="Logger inn…";const {error}=await sb.auth.signInWithPassword({email:e.loginEmail.value.trim(),password:e.loginPassword.value});e.loginMessage.textContent=error?error.message:""}
function coachIdFromUrl(){return new URLSearchParams(location.search).get("coach")||""}
async function register(){const name=e.regName.value.trim(),phone=e.regPhone.value.trim(),email=e.regEmail.value.trim(),password=e.regPassword.value;if(!name||!phone||!email||password.length<6){e.registerMessage.textContent="Fyll ut alle feltene. Passord må ha minst 6 tegn.";return}e.registerMessage.textContent="Registrerer…";const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{full_name:name,phone,coach_id:coachIdFromUrl()}}});e.registerMessage.textContent=error?error.message:(data.session?"Registrert og innlogget.":"Registrert. Sjekk e-post og bekreft kontoen.")}
async function logout(){await releaseWakeLock();await sb.auth.signOut();closeModal(e.accountModal)}

async function loadPrograms(){const {data}=await sb.from("cr_programs").select("*").eq("active",true).order("sort_order");programs=data||[]}
async function loadAthleteData(){
 await loadPrograms();const {data:sessions}=await sb.from("cr_workout_sessions").select("*").eq("athlete_id",user.id).order("started_at",{ascending:false});const all=sessions||[];activeSession=all.find(x=>x.status==="started")||null;
 const completed=all.filter(x=>x.status==="completed");e.athleteSessionCount.textContent=completed.length;e.athleteMinutes.textContent=Math.round(completed.reduce((s,x)=>s+(x.duration_seconds||0),0)/60);const ratings=completed.filter(x=>x.rating).map(x=>x.rating);e.athleteAvgRating.textContent=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";
 const approved=!!profile?.approved;e.athleteStatusCard.className="status-card "+(approved?"approved":"pending");e.athleteStatusTitle.textContent=approved?"Godkjent utøver":"Venter på godkjenning";e.athleteStatusText.textContent=approved?"Du har tilgang til programmene coachen har tildelt deg.":"Coachen må godkjenne kontoen før programmene blir tilgjengelige.";e.assignedProgramsWrap.classList.toggle("hidden",!approved);
 if(approved){let assigned=[];const q=await sb.from("cr_athlete_programs").select("program_id,sort_order").eq("athlete_id",user.id).eq("enabled",true).order("sort_order",{ascending:true});if(q.error){const f=await sb.from("cr_athlete_programs").select("program_id").eq("athlete_id",user.id).eq("enabled",true);assigned=(f.data||[]).map((x,i)=>({...x,sort_order:1000+i}))}else assigned=q.data||[];const rank=new Map(assigned.map((x,i)=>[x.program_id,Number(x.sort_order)||1000+i]));const ids=new Set(assigned.map(x=>x.program_id));renderPrograms(programs.filter(p=>ids.has(p.id)).sort((x,y)=>(rank.get(x.id)??9999)-(rank.get(y.id)??9999)))}
 renderActiveSession();if(activeSession)requestWakeLock();
}
function athleteUiKey(name){return `cr_ui_${user?.id||"anonymous"}_${name}`}
function getProgramColumns(){const n=Number(localStorage.getItem(athleteUiKey("programColumns"))||2);return[1,2,3].includes(n)?n:2}
function setProgramColumns(cols){cols=Number(cols);if(![1,2,3].includes(cols))cols=2;localStorage.setItem(athleteUiKey("programColumns"),String(cols));e.assignedPrograms?.classList.remove("program-cols-1","program-cols-2","program-cols-3");e.assignedPrograms?.classList.add(`program-cols-${cols}`);document.querySelectorAll(".layout-btn").forEach(b=>b.classList.toggle("active",Number(b.dataset.cols)===cols))}
function initProgramLayoutControls(){applyProgramColumns(Number(localStorage.getItem(athleteUiKey("programColumns"))||2))}


function applyProgramColumns(cols){
  cols=Number(cols);
  if(![1,2,3].includes(cols))cols=2;
  localStorage.setItem(athleteUiKey("programColumns"),String(cols));
  const grid=document.getElementById("assignedPrograms");
  if(grid){
    grid.classList.remove("program-cols-1","program-cols-2","program-cols-3");
    grid.classList.add(`program-cols-${cols}`);
    grid.style.gridTemplateColumns=cols===1
      ?"1fr"
      :`repeat(${cols}, minmax(0, 1fr))`;
  }
  document.querySelectorAll(".layout-btn").forEach(b=>{
    b.classList.toggle("active",Number(b.dataset.cols)===cols);
    b.setAttribute("aria-pressed",String(Number(b.dataset.cols)===cols));
  });
}
document.addEventListener("click",ev=>{
  const btn=ev.target.closest?.(".layout-btn");
  if(!btn)return;
  ev.preventDefault();
  applyProgramColumns(btn.dataset.cols);
});

function renderPrograms(list){
  e.assignedPrograms.innerHTML=list.length?list.map(p=>`<article class="program-card" data-program-id="${p.id}">
    <button type="button" class="program-info-btn" data-id="${p.id}" aria-label="Vis programinnhold" title="Vis programinnhold">i</button>
    <span class="program-icon">${programIcon(p)?`<img src="${programIcon(p)}" alt="${esc(p.name)}">`:esc(p.icon||"🏋️")}</span>
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.description||"")}</p>
    <button class="primary-btn start-program" data-id="${p.id}">Start økt</button>
  </article>`).join(""):`<div class="empty">Ingen programmer er tildelt ennå.</div>`;
  e.assignedPrograms.querySelectorAll(".start-program").forEach(b=>b.onclick=()=>startSession(b.dataset.id));
  e.assignedPrograms.querySelectorAll(".program-info-btn").forEach(b=>b.onclick=ev=>{ev.stopPropagation();openProgramInfo(b.dataset.id)});
  initProgramLayoutControls();
}


function programInfoSummaryHtml(program, activities, settings){
  const id=program?.id||"";
  if(id==="running"){
    return `<div class="program-info-badges">
      <span>🏃 GPS</span><span>⏱ Tid</span><span>📏 Distanse</span><span>⚡ Pace</span>
    </div>`;
  }
  if(id==="free_workout"){
    return `<div class="program-info-badges">
      <span>⏱ Fri timer</span><span>⭐ Rating</span><span>📝 Kommentar</span><span>📏 Valgfri distanse</span>
    </div>`;
  }
  if(id==="twenty_minutes"){
    return `<div class="program-info-badges">
      <span>20:00 → 00:00</span><span>🟢 20–12</span><span>🟩 12–7</span><span>🟨 7–2</span><span>🟦 2–0</span>
    </div>`;
  }
  if(settings?.program_type==="interval" || INTERVAL_PROGRAMS[id]){
    const cfg=INTERVAL_PROGRAMS[id]||{};
    const work=settings?.work_seconds??cfg.work;
    const rest=settings?.rest_seconds??cfg.rest;
    const rounds=settings?.rounds??cfg.rounds;
    return `<div class="program-info-badges">
      ${work!=null?`<span>Arbeid ${work}s</span>`:""}
      ${rest!=null?`<span>Hvile ${rest}s</span>`:""}
      ${rounds!=null?`<span>${rounds} runder</span>`:""}
    </div>`;
  }
  if(activities.length){
    const groups=[...new Set(activities.map(x=>x.group_name).filter(Boolean))];
    const rounds=[...new Set(activities.map(x=>x.round_no).filter(x=>x!=null))];
    return `<div class="program-info-badges">
      <span>${activities.length} aktiviteter</span>
      ${groups.length?`<span>${groups.map(esc).join(" + ")}</span>`:""}
      ${rounds.length?`<span>${rounds.length} runder</span>`:""}
    </div>`;
  }
  return "";
}

function programInfoActivityHtml(row, index){
  const isInterval=row.duration_seconds!=null || row.warning_seconds!=null || ["Work","Rest"].includes(row.group_name);
  const groupLabel=row.group_name==="WarmUp"?"Oppvarming":row.group_name==="Main"?"Hoveddel":row.group_name==="Work"?"Arbeid":row.group_name==="Rest"?"Hvile":row.group_name||"";
  const meta=[];
  if(row.round_no!=null)meta.push(`Runde ${row.round_no}`);
  if(row.reps)meta.push(`${esc(String(row.reps))} reps`);
  if(row.load)meta.push(`Load ${esc(String(row.load))}`);
  if(row.duration_seconds!=null)meta.push(`${row.duration_seconds} sek`);
  if(row.warning_seconds!=null && Number(row.warning_seconds)>0)meta.push(`varsel ${row.warning_seconds} sek`);

  return `<div class="program-info-row ${isInterval?"interval-info-row":""}">
    <div class="program-info-order">${row.order_no??index+1}</div>
    <div class="program-info-main">
      <div class="program-info-row-top">
        <strong>${esc(row.activity||"Aktivitet")}</strong>
        ${groupLabel?`<span class="program-info-group">${esc(groupLabel)}</span>`:""}
      </div>
      ${meta.length?`<div class="program-info-meta">${meta.join(" · ")}</div>`:""}
      ${row.description?`<div class="program-info-desc">${esc(row.description)}</div>`:""}
    </div>
  </div>`;
}

async function openProgramInfo(programId){
  const program=programs.find(p=>p.id===programId);
  if(!program)return;

  e.programInfoTitle.textContent=program.name||"Program";
  e.programInfoDescription.textContent=program.description||"";
  e.programInfoSummary.innerHTML='<div class="program-info-loading">Laster programinnhold…</div>';
  e.programInfoList.innerHTML="";
  openModal(e.programInfoModal);

  let activities=[];
  let settings=null;

  try{
    const a=await sb.from("cr_program_activities").select("*").eq("program_id",programId).order("order_no");
    if(!a.error)activities=a.data||[];
  }catch(err){console.warn(err)}

  try{
    const s=await sb.from("cr_program_settings").select("*").eq("program_id",programId).maybeSingle();
    if(!s.error)settings=s.data||null;
  }catch(err){console.warn(err)}

  e.programInfoSummary.innerHTML=programInfoSummaryHtml(program,activities,settings);

  if(activities.length){
    e.programInfoList.innerHTML=activities.map(programInfoActivityHtml).join("");
    return;
  }

  if(programId==="twenty_minutes"){
    e.programInfoList.innerHTML=`
      <div class="program-info-row"><div class="program-info-order">1</div><div class="program-info-main"><strong>20:00–12:00</strong><div class="program-info-desc">Mørk grønn bakgrunn</div></div></div>
      <div class="program-info-row"><div class="program-info-order">2</div><div class="program-info-main"><strong>12:00–07:00</strong><div class="program-info-desc">Lys grønn bakgrunn</div></div></div>
      <div class="program-info-row"><div class="program-info-order">3</div><div class="program-info-main"><strong>07:00–02:00</strong><div class="program-info-desc">Gul bakgrunn</div></div></div>
      <div class="program-info-row"><div class="program-info-order">4</div><div class="program-info-main"><strong>02:00–00:00</strong><div class="program-info-desc">Lys blå bakgrunn</div></div></div>
      <div class="program-info-row"><div class="program-info-order">♪</div><div class="program-info-main"><strong>10:00</strong><div class="program-info-desc">3 sekunder lang beep</div></div></div>`;
  }else if(programId==="running"){
    e.programInfoList.innerHTML=`
      <div class="program-info-simple">Starter tid og GPS-tracking. Under økten vises distanse, snittpace, aktuell pace og GPS-status.</div>`;
  }else if(programId==="free_workout"){
    e.programInfoList.innerHTML=`
      <div class="program-info-simple">Starter en fri timer. Ved avslutning kan utøveren rate økten, beskrive hva som er gjort og angi valgfri distanse.</div>`;
  }else if(settings?.program_type==="interval" || INTERVAL_PROGRAMS[programId]){
    e.programInfoList.innerHTML=`
      <div class="program-info-simple">Intervallprogram med automatisk veksling mellom arbeid og hvile, varsler og nedtelling.</div>`;
  }else{
    e.programInfoList.innerHTML='<div class="program-info-simple">Ingen detaljert aktivitetsliste er registrert for dette programmet.</div>';
  }
}

async function startSession(programId){
 await unlockAudio();
 if(activeSession){renderActiveSession();alert("Du har allerede en aktiv økt. Velg «Fortsett økten» eller forkast den først.");return}
 if(!INTERVAL_PROGRAMS[programId]&&!SEQUENCE_PROGRAMS[programId]&&programId!=="kettlebell_mix"&&!isRunningProgram(programId)&&programId!=="twenty_minutes"&&programId!=="free_workout"){alert("Dette programmet er ikke aktivert i treningsmotoren ennå.");return}
 const p=programs.find(x=>x.id===programId);const {data,error}=await sb.from("cr_workout_sessions").insert({athlete_id:user.id,program_id:programId,program_name:p?.name||programId,status:"started",started_at:new Date().toISOString()}).select().single();if(error){alert(error.message);return}activeSession=data;clearRunnerState();await requestWakeLock();launchRunner();
}
function renderActiveSession(){
 e.activeSessionCard.classList.toggle("hidden",!activeSession);clearInterval(homeTimer);if(!activeSession)return;
 e.activeSessionName.textContent=activeSession.program_name;e.activeStartedAt.textContent=fmtDate(activeSession.started_at);const tick=()=>e.activeElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at));tick();homeTimer=setInterval(tick,1000)
}
async function discardActive(){
 if(!activeSession||!confirm(`Forkaste den aktive økten «${activeSession.program_name}»?`))return;
 const id=activeSession.id;const {error}=await sb.from("cr_workout_sessions").update({status:"cancelled",completed_at:new Date().toISOString(),duration_seconds:elapsed(activeSession.started_at)}).eq("id",id);if(error){alert(error.message);return}if(activeSession?.program_id==="running"){clearRunningState();stopGeolocation();runningState=null}if(activeSession?.program_id==="twenty_minutes"){clearTwentyState();twentyState=null}clearRunnerState();activeSession=null;await releaseWakeLock();stopRunnerTick();await loadAthleteData();showOnly("athlete")
}

async function launchRunner(){
 if(!activeSession)return;
 await requestWakeLock();const id=activeSession.program_id;runnerMode=id==="free_workout"?"freeWorkout":id==="twenty_minutes"?"twenty":isRunningProgram(id)?"running":id==="kettlebell_mix"?"intervalSequence":INTERVAL_PROGRAMS[id]?"interval":SEQUENCE_PROGRAMS[id]?"sequence":null;if(!runnerMode){alert("Programmotor mangler for denne økten.");return}
 if(runnerMode==="freeWorkout"){showOnly("freeWorkout");startFreeWorkoutRunner();return}
 if(runnerMode==="twenty"){showOnly("twenty");startTwentyRunner();return}
 if(runnerMode==="running"){showOnly("running");startRunningRunner();return}
 showOnly("runner");e.intervalRunner.classList.toggle("hidden",!["interval","intervalSequence"].includes(runnerMode));e.sequenceRunner.classList.toggle("hidden",runnerMode!=="sequence");
 if(runnerMode==="interval")startIntervalRunner();else if(runnerMode==="intervalSequence")startIntervalSequenceRunner();else await startSequenceRunner()
}
function stopRunnerTick(){clearInterval(runnerTimer);runnerTimer=null;lastCueKey=""}
async function startIntervalRunner(){
 const cfg=await getIntervalConfig(activeSession.program_id);intervalState=loadRunnerState()||{offsetSeconds:0};e.intervalProgramName.textContent=cfg.name;
 const render=()=>{let t=elapsed(activeSession.started_at)+Number(intervalState.offsetSeconds||0),cycle=cfg.work+cfg.rest,total=cfg.rounds*cycle;if(t>=total){stopRunnerTick();openFinish();return}
 const round=Math.floor(t/cycle)+1,into=t%cycle,isWork=into<cfg.work,dur=isWork?cfg.work:cfg.rest,phaseInto=isWork?into:into-cfg.work,remain=Math.max(0,dur-phaseInto),totalRemain=Math.max(0,total-t);
 e.intervalElapsed.textContent=fmtElapsed(t);e.intervalRound.textContent=`Runde ${round} av ${cfg.rounds}`;e.intervalRemainingTotal.textContent=`${fmtElapsed(totalRemain)} igjen`;e.intervalTime.textContent=Math.ceil(remain);
 e.intervalCard.className="interval-card "+(isWork?(remain<=cfg.workWarning?"warning-hold":"work"):(remain<=cfg.restWarning?"warning-ready":"rest"));e.intervalPhase.textContent=isWork?(remain<=cfg.workWarning?"HOLD UT!":"ARBEID"):(remain<=cfg.restWarning?"GJØR KLAR!":"HVILE");e.intervalMessage.textContent=isWork?(remain<=cfg.workWarning?"Hold ut!":"Jobb kontrollert"):(remain<=cfg.restWarning?"Gjør klar!":"Pust og hent deg inn");e.intervalNext.textContent=isWork?`Neste: Hvile ${cfg.rest} sek`:(round===cfg.rounds?"Neste: Ferdig":`Neste: Arbeid ${cfg.work} sek`);e.intervalProgressBar.style.width=`${Math.min(100,Math.max(0,phaseInto/dur*100))}%`;
 const secondsLeft=Math.ceil(remain),cueKey=`${round}-${isWork?"w":"r"}-${secondsLeft}`;if(cueKey!==lastCueKey){if((isWork&&secondsLeft===cfg.workWarning)||(!isWork&&secondsLeft===cfg.restWarning)||secondsLeft===dur)audioCue(isWork?(remain<=cfg.workWarning?"Hold ut":"Arbeid"):(remain<=cfg.restWarning?"Gjør klar":"Hvile"));if(secondsLeft<=5&&secondsLeft>=1)countdownBeep();lastCueKey=cueKey}}
 render();stopRunnerTick();runnerTimer=setInterval(render,250)
}
async function skipInterval(){const cfg=await getIntervalConfig(activeSession.program_id),t=elapsed(activeSession.started_at)+Number(intervalState.offsetSeconds||0),cycle=cfg.work+cfg.rest,into=t%cycle,isWork=into<cfg.work,remain=isWork?(cfg.work-into):(cycle-into);intervalState.offsetSeconds=Number(intervalState.offsetSeconds||0)+Math.max(1,Math.ceil(remain));saveRunnerState(intervalState)}


async function getIntervalSequence(programId){
  const {data,error}=await sb.from("cr_program_activities")
    .select("*").eq("program_id",programId).order("order_no");
  if(error){console.error(error);return[]}
  return (data||[]).map(r=>({
    order:r.order_no,
    activity:r.activity||"",
    duration:Number(r.duration_seconds)||0,
    warning:Number(r.warning_seconds)||0,
    group:r.group_name||""
  }));
}
async function startIntervalSequenceRunner(){
  const steps=await getIntervalSequence(activeSession.program_id);
  if(!steps.length){alert("Programmet inneholder ingen aktiviteter.");return}
  const programName=programs.find(p=>p.id===activeSession.program_id)?.name||activeSession.program_name;
  e.intervalProgramName.textContent=programName;

  const render=()=>{
    const t=elapsed(activeSession.started_at);
    const total=steps.reduce((sum,x)=>sum+x.duration,0);
    if(t>=total){stopRunnerTick();openFinish();return}

    let acc=0,index=0,phaseInto=0;
    for(let i=0;i<steps.length;i++){
      const end=acc+steps[i].duration;
      if(t<end){index=i;phaseInto=t-acc;break}
      acc=end;
    }
    const step=steps[index],remain=Math.max(0,step.duration-phaseInto);
    const next=steps[index+1];
    const isRest=(step.group||"").toLowerCase()==="rest" || step.activity.toLowerCase()==="hvile";
    const warn=step.warning>0 && remain<=step.warning;

    e.intervalElapsed.textContent=fmtElapsed(t);
    e.intervalRound.textContent=`Aktivitet ${index+1} av ${steps.length}`;
    e.intervalRemainingTotal.textContent=`${fmtElapsed(total-t)} igjen`;
    e.intervalPhase.textContent=warn?(isRest?"GJØR KLAR!":"HOLD UT!"):(isRest?"HVILE":step.activity.toUpperCase());
    e.intervalMessage.textContent=warn?(isRest?"Neste aktivitet nærmer seg":"Hold ut!"):(isRest?"Pust og hent deg inn":step.activity);
    e.intervalTime.textContent=Math.ceil(remain);
    e.intervalNext.textContent=next?`Neste: ${next.activity} · ${next.duration} sek`:"Neste: Ferdig";
    e.intervalProgressBar.style.width=`${Math.min(100,Math.max(0,phaseInto/Math.max(1,step.duration)*100))}%`;
    e.intervalCard.className="interval-card interval-sequence-card "+(isRest?(warn?"warning-ready":"rest"):(warn?"warning-hold":"work"));

    const secondsLeft=Math.ceil(remain),cueKey=`seq-${index}-${secondsLeft}`;
    if(cueKey!==lastCueKey){
      if(secondsLeft===step.duration)audioCue(isRest?"Hvile":step.activity);
      else if(step.warning>0 && secondsLeft===step.warning)audioCue(isRest?"Gjør klar":"Hold ut");
      if(secondsLeft<=5&&secondsLeft>=1)countdownBeep();
      lastCueKey=cueKey;
    }
  };
  render();stopRunnerTick();runnerTimer=setInterval(render,250);
}
async function skipIntervalSequence(){
  const steps=await getIntervalSequence(activeSession.program_id);
  if(!steps.length)return;
  const t=elapsed(activeSession.started_at);
  let acc=0,remain=0;
  for(const step of steps){
    const end=acc+step.duration;
    if(t<end){remain=end-t;break}
    acc=end;
  }
  if(remain>0){
    // Move the session start backwards so elapsed jumps to the next segment.
    const shifted=new Date(new Date(activeSession.started_at).getTime()-remain*1000);
    activeSession.started_at=shifted.toISOString();
  }
}

async function startSequenceRunner(){
  const programId=activeSession?.program_id;
  if(!programId)return;

  let items=[];

  // Prefer the editable Supabase activities.
  try{
    const {data,error}=await sb.from("cr_program_activities")
      .select("*")
      .eq("program_id",programId)
      .order("order_no");
    if(!error && data?.length){
      items=data.map(r=>({
        group:r.group_name||"",
        order:r.order_no,
        round:r.round_no,
        activity:r.activity||"",
        reps:r.reps||"",
        load:r.load||"",
        desc:r.description||""
      }));
    }
  }catch(err){
    console.warn("Kunne ikke hente programaktiviteter fra Supabase:",err);
  }

  // Fallback to local program definition if DB is empty/unavailable.
  if(!items.length){
    items=(SEQUENCE_PROGRAMS[programId]?.items||[]).map(x=>({...x}));
  }

  if(!items.length){
    alert("Dette programmet har ingen aktiviteter registrert.");
    return;
  }

  sequenceState=loadSequenceState()||{
    queue:items.map((x,i)=>({...x,_key:`${x.order??i+1}-${i}`})),
    completed:0,
    skipped:0
  };

  // If an old/empty local state exists, rebuild it.
  if(!Array.isArray(sequenceState.queue) || !sequenceState.queue.length){
    sequenceState={
      queue:items.map((x,i)=>({...x,_key:`${x.order??i+1}-${i}`})),
      completed:0,
      skipped:0
    };
    saveSequenceState();
  }

  renderSequence();
  stopRunnerTick();
  runnerTimer=setInterval(()=>{if(activeSession)e.sequenceElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at))},500);
}
function seqComplete(){if(!sequenceState?.queue.length)return;sequenceState.completed.push(sequenceState.queue.shift());saveRunnerState(sequenceState);startSequenceRunner()}
function seqSkip(){if(!sequenceState?.queue.length)return;sequenceState.skipped.push(sequenceState.queue.shift());saveRunnerState(sequenceState);startSequenceRunner()}
function seqPostpone(){if(!sequenceState?.queue.length)return;const item=sequenceState.queue[0];let last=-1;for(let i=1;i<sequenceState.queue.length;i++){const x=sequenceState.queue[i];if(x.group===item.group&&x.round===item.round)last=i;else break}if(last<1){alert("Dette er siste aktivitet i denne runden.");return}sequenceState.queue.shift();sequenceState.queue.splice(last,0,item);saveRunnerState(sequenceState);startSequenceRunner()}

function renderStars(){e.finishStars.querySelectorAll("button").forEach(b=>b.textContent=Number(b.dataset.rating)<=finishRating?"★":"☆")}
function openFinish(){if(!activeSession||!e.finishModal.classList.contains("hidden"))return;finishRating=4;e.finishComment.value="";e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(elapsed(activeSession.started_at))}`;renderStars();openModal(e.finishModal)}
async function saveFinish(){
  const ended=new Date(),isRunning=activeSession?.program_id==="running",isTwenty=activeSession?.program_id==="twenty_minutes",isFree=activeSession?.program_id==="free_workout";
  const duration=isRunning?(activeSession._runningDuration||runningElapsedSeconds()):isTwenty?(activeSession._twentyDuration??twentyElapsedSeconds()):isFree?(activeSession._freeDuration??elapsed(activeSession.started_at)):elapsed(activeSession.started_at);
  const distance=isRunning?(activeSession._runningDistance??runningState?.distanceMeters??0):null;
  const avgPace=isRunning?(activeSession._runningAvgPace??(distance>=50?duration/(distance/1000):null)):null;
  const updates={status:"completed",completed_at:ended.toISOString(),duration_seconds:duration,rating:finishRating,comment:e.finishComment.value.trim()};
  if(isRunning){updates.distance_meters=distance;updates.avg_pace_seconds_per_km=avgPace}if(isFree){const km=Number(String(e.finishDistance?.value||"").replace(",","."));if(km>0)updates.distance_meters=km*1000}
  const {error}=await sb.from("cr_workout_sessions").update(updates).eq("id",activeSession.id);
  if(error){alert(error.message);return}
  if(isRunning){clearRunningState();stopGeolocation();runningState=null}if(isTwenty){clearTwentyState();twentyState=null}
  clearRunnerState();activeSession=null;await releaseWakeLock();stopRunnerTick();closeModal(e.finishModal);await loadAthleteData();showOnly("athlete")
}

async function ensureProgramActivitiesSeeded(programId){
  // If activities already exist in Supabase, do nothing.
  const {data:existing,error:readError}=await sb
    .from("cr_program_activities")
    .select("id")
    .eq("program_id",programId)
    .limit(1);

  if(readError){
    console.error("Kunne ikke kontrollere programaktiviteter:",readError);
    return;
  }
  if(existing && existing.length)return;

  // Only task-based programs have a local fallback that can be seeded.
  const source=SEQUENCE_PROGRAMS[programId]?.items||[];
  if(!source.length)return;

  const rows=source.map(x=>({
    program_id:programId,
    group_name:x.group||null,
    order_no:x.order,
    round_no:x.round||null,
    activity:x.activity||"",
    reps:x.reps||"",
    load:x.load||"",
    description:x.desc||""
  }));

  const {error:insertError}=await sb.from("cr_program_activities").insert(rows);
  if(insertError)console.error("Kunne ikke opprette programaktiviteter:",insertError);
}

async function loadCoachProgramOptions(){
  e.programEditorMessage.textContent="Laster programmer…";
  await loadPrograms();
  const editable=programs;
  e.coachProgramSelect.innerHTML=editable.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
  if(editable.length){
    await loadProgramEditor(e.coachProgramSelect.value);
  }else{
    e.coachProgramTitle.textContent="Ingen redigerbare programmer";
    e.programActivitiesEditor.innerHTML='<div class="empty">Ingen oppgavebaserte programmer tilgjengelig.</div>';
  }
}
async function loadProgramEditor(programId){
  if(!programId)return;
  e.programEditorMessage.textContent="Laster…";
  try{
    await ensureProgramActivitiesSeeded(programId);
  }catch(err){
    console.error(err);
    e.programEditorMessage.textContent="Kunne ikke laste programaktivitetene: "+(err?.message||err);
    return;
  }

  const p=programs.find(x=>x.id===programId);
  e.coachProgramTitle.textContent=p?.name||programId;
  if(e.editProgramName)e.editProgramName.value=p?.name||"";
  if(e.editProgramDescription)e.editProgramDescription.value=p?.description||"";

  const isInterval=!!INTERVAL_PROGRAMS[programId];
  const isIntervalSequence=programId==="kettlebell_mix";
  e.intervalSettingsEditor?.classList.toggle("hidden",!isInterval);

  if(isInterval){
    const {data:settings,error:settingsError}=await sb.from("cr_program_settings").select("*").eq("program_id",programId).maybeSingle();
    const fallback=INTERVAL_PROGRAMS[programId];
    if(settingsError)console.error(settingsError);
    if(e.editWorkSeconds)e.editWorkSeconds.value=settings?.work_seconds ?? fallback.work;
    if(e.editRestSeconds)e.editRestSeconds.value=settings?.rest_seconds ?? fallback.rest;
    if(e.editRounds)e.editRounds.value=settings?.rounds ?? fallback.rounds;
    if(e.editWorkWarning)e.editWorkWarning.value=settings?.work_warning ?? fallback.workWarning;
    if(e.editRestWarning)e.editRestWarning.value=settings?.rest_warning ?? fallback.restWarning;
  }

  const {data,error}=await sb.from("cr_program_activities").select("*").eq("program_id",programId).order("order_no");
  if(error){e.programEditorMessage.textContent=error.message;return}
  const rows=data||[];

  if(isInterval && !rows.length){
    e.programActivitiesEditor.innerHTML='<div class="empty">Dette er et intervallprogram. Rediger arbeid, hvile, runder og varsler over.</div>';
  }else if(isIntervalSequence){
    e.programActivitiesEditor.innerHTML=rows.length?rows.map(r=>`
      <div class="activity-edit-row interval-sequence-edit-row" data-id="${r.id}">
        <div class="mini-meta">${esc(r.group_name||"")}<br>#${r.order_no}</div>
        <label class="activity-name">Aktivitet
          <input data-field="activity" type="text" value="${esc(r.activity||"")}">
        </label>
        <label>Timer
          <input data-field="duration_seconds" type="number" min="1" value="${r.duration_seconds??""}">
        </label>
        <label>Warning
          <input data-field="warning_seconds" type="number" min="0" value="${r.warning_seconds??""}">
        </label>
        <label class="activity-desc">Beskrivelse
          <input data-field="description" type="text" value="${esc(r.description||"")}">
        </label>
      </div>`).join(""):'<div class="empty">Ingen aktiviteter i programmet.</div>';
  }else{
    e.programActivitiesEditor.innerHTML=rows.length?rows.map(r=>`
      <div class="activity-edit-row" data-id="${r.id}">
        <div class="mini-meta">${esc(r.group_name||"")}<br>Runde ${r.round_no??"–"}<br>#${r.order_no}</div>
        <label class="activity-name">Aktivitet
          <input data-field="activity" type="text" value="${esc(r.activity||"")}">
        </label>
        <label>Reps
          <input data-field="reps" type="text" value="${esc(r.reps||"")}">
        </label>
        <label>Load
          <input data-field="load" type="text" value="${esc(r.load||"")}">
        </label>
        <label class="activity-desc">Beskrivelse
          <input data-field="description" type="text" value="${esc(r.description||"")}">
        </label>
      </div>`).join(""):'<div class="empty">Ingen aktiviteter i programmet.</div>';
  }
  e.programEditorMessage.textContent=isInterval?"Intervallprogram lastet.":isIntervalSequence?`${rows.length} intervallaktiviteter lastet.`:`${rows.length} aktiviteter lastet.`;
}
async function saveProgramActivities(){
  const programId=e.coachProgramSelect.value;
  if(!programId)return;
  e.programEditorMessage.textContent="Lagrer…";

  const {error:programError}=await sb.from("cr_programs").update({
    name:(e.editProgramName?.value||"").trim(),
    description:(e.editProgramDescription?.value||"").trim()
  }).eq("id",programId);
  if(programError){e.programEditorMessage.textContent=`Feil: ${programError.message}`;return}

  if(INTERVAL_PROGRAMS[programId]){
    const settings={
      program_id:programId,
      program_type:"interval",
      work_seconds:Number(e.editWorkSeconds?.value)||0,
      rest_seconds:Number(e.editRestSeconds?.value)||0,
      rounds:Number(e.editRounds?.value)||1,
      work_warning:Number(e.editWorkWarning?.value)||0,
      rest_warning:Number(e.editRestWarning?.value)||0,
      updated_at:new Date().toISOString()
    };
    const {error:settingsError}=await sb.from("cr_program_settings").upsert(settings,{onConflict:"program_id"});
    if(settingsError){e.programEditorMessage.textContent=`Feil: ${settingsError.message}`;return}
  }

  const rows=[...e.programActivitiesEditor.querySelectorAll(".activity-edit-row")].map(row=>{
    const obj={id:Number(row.dataset.id)};
    row.querySelectorAll("input[data-field]").forEach(inp=>{
      const field=inp.dataset.field;
      obj[field]=["duration_seconds","warning_seconds"].includes(field)?Number(inp.value)||0:inp.value.trim();
    });
    return obj;
  });
  for(const r of rows){
    const {id,...changes}=r;
    const {error}=await sb.from("cr_program_activities").update({...changes,updated_at:new Date().toISOString()}).eq("id",id);
    if(error){e.programEditorMessage.textContent=`Feil: ${error.message}`;return}
  }
  await loadPrograms();
  e.programEditorMessage.textContent="✓ Endringer lagret";
}
async function getSequenceItems(programId){
  const {data,error}=await sb.from("cr_program_activities").select("*").eq("program_id",programId).order("order_no");
  if(!error && data && data.length){
    return data.map(r=>({group:r.group_name,order:r.order_no,activity:r.activity,round:r.round_no,reps:r.reps||"",load:r.load||"",desc:r.description||""}));
  }
  return SEQUENCE_PROGRAMS[programId]?.items||[];
}


async function exportPrograms(){
  e.programEditorMessage.textContent="Eksporterer…";
  const [{data:p,error:pe},{data:a,error:ae},{data:s,error:se}]=await Promise.all([
    sb.from("cr_programs").select("*").order("sort_order"),
    sb.from("cr_program_activities").select("*").order("program_id").order("order_no"),
    sb.from("cr_program_settings").select("*").order("program_id")
  ]);
  if(pe||ae||se){e.programEditorMessage.textContent=`Eksportfeil: ${(pe||ae||se).message}`;return}
  const payload={format:"CR-Workout Programs",version:1,exported_at:new Date().toISOString(),programs:p||[],activities:a||[],settings:s||[]};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=`CR-Workout-programmer-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  e.programEditorMessage.textContent="✓ Programmer eksportert";
}
async function importProgramsFile(file){
  if(!file)return;
  e.programEditorMessage.textContent="Importerer…";
  let payload;
  try{payload=JSON.parse(await file.text())}catch{e.programEditorMessage.textContent="Ugyldig JSON-fil.";return}
  if(!payload||!Array.isArray(payload.programs)){e.programEditorMessage.textContent="Filen er ikke en gyldig CR-Workout programeksport.";return}
  if(!confirm(`Importere ${payload.programs.length} programmer? Eksisterende programmer med samme ID blir oppdatert.`)){e.programEditorMessage.textContent="Import avbrutt.";return}

  const cleanPrograms=payload.programs.map(({id,name,description,icon,active,sort_order})=>({id,name,description,icon,active,sort_order}));
  if(cleanPrograms.length){
    const {error}=await sb.from("cr_programs").upsert(cleanPrograms,{onConflict:"id"});
    if(error){e.programEditorMessage.textContent=`Importfeil programmer: ${error.message}`;return}
  }

  if(Array.isArray(payload.settings)&&payload.settings.length){
    const cleanSettings=payload.settings.map(({program_id,program_type,work_seconds,rest_seconds,rounds,work_warning,rest_warning})=>({program_id,program_type,work_seconds,rest_seconds,rounds,work_warning,rest_warning,updated_at:new Date().toISOString()}));
    const {error}=await sb.from("cr_program_settings").upsert(cleanSettings,{onConflict:"program_id"});
    if(error){e.programEditorMessage.textContent=`Importfeil innstillinger: ${error.message}`;return}
  }

  if(Array.isArray(payload.activities)){
    const affected=[...new Set(payload.activities.map(x=>x.program_id).filter(Boolean))];
    for(const programId of affected){
      const {error:delError}=await sb.from("cr_program_activities").delete().eq("program_id",programId);
      if(delError){e.programEditorMessage.textContent=`Importfeil ved sletting: ${delError.message}`;return}
    }
    const cleanActivities=payload.activities.map(({program_id,group_name,order_no,round_no,activity,reps,load,description,duration_seconds,warning_seconds})=>({program_id,group_name,order_no,round_no,activity,reps,load,description,duration_seconds,warning_seconds,updated_at:new Date().toISOString()}));
    if(cleanActivities.length){
      const {error}=await sb.from("cr_program_activities").insert(cleanActivities);
      if(error){e.programEditorMessage.textContent=`Importfeil aktiviteter: ${error.message}`;return}
    }
  }
  await loadPrograms();
  await loadCoachProgramOptions();
  e.programEditorMessage.textContent="✓ Import fullført";
}
async function getIntervalConfig(programId){
  const fallback=INTERVAL_PROGRAMS[programId];
  if(!fallback)return null;
  const {data,error}=await sb.from("cr_program_settings").select("*").eq("program_id",programId).maybeSingle();
  if(error)console.error(error);
  return {
    name:programs.find(p=>p.id===programId)?.name||fallback.name,
    work:data?.work_seconds ?? fallback.work,
    rest:data?.rest_seconds ?? fallback.rest,
    rounds:data?.rounds ?? fallback.rounds,
    workWarning:data?.work_warning ?? fallback.workWarning,
    restWarning:data?.rest_warning ?? fallback.restWarning
  };
}


let runningWatchId=null,runningState=null,runningPaused=false,runningPauseStartedAt=null;
function haversineMeters(a,b){const R=6371000,toRad=x=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon),lat1=toRad(a.lat),lat2=toRad(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function formatPace(sec){if(!Number.isFinite(sec)||sec<=0)return"– /km";const m=Math.floor(sec/60),s=Math.round(sec%60);return`${m}:${String(s).padStart(2,"0")} /km`}
function runningStorageKey(){return activeSession?`cr_running_${activeSession.id}`:""}
function saveRunningState(){if(activeSession&&runningState)localStorage.setItem(runningStorageKey(),JSON.stringify(runningState))}
function loadRunningState(){try{return JSON.parse(localStorage.getItem(runningStorageKey())||"null")}catch{return null}}
function clearRunningState(){if(activeSession)localStorage.removeItem(runningStorageKey())}
function stopGeolocation(){if(runningWatchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(runningWatchId);runningWatchId=null}}
function updateGpsStatus(a){if(!Number.isFinite(a)){e.gpsStatus.textContent="Venter på GPS…";e.gpsStatus.className="gps-status";return}if(a<=15){e.gpsStatus.textContent="God GPS";e.gpsStatus.className="gps-status good"}else if(a<=35){e.gpsStatus.textContent="Svak GPS";e.gpsStatus.className="gps-status weak"}else{e.gpsStatus.textContent="Dårlig GPS";e.gpsStatus.className="gps-status bad"}e.runningGpsAccuracy.textContent=`GPS-nøyaktighet: ±${Math.round(a)} m`}
function handleRunningPosition(pos){if(runningPaused||!runningState)return;const c=pos.coords,p={lat:c.latitude,lon:c.longitude,accuracy:c.accuracy,ts:pos.timestamp},prev=runningState.lastPoint;updateGpsStatus(c.accuracy);if(prev){const dt=(p.ts-prev.ts)/1000,dist=haversineMeters(prev,p),speed=dt>0?(dist/dt)*3.6:0,good=Math.max(p.accuracy||999,prev.accuracy||999)<=50;if(good&&dist>=3&&speed<=25){runningState.distanceMeters+=dist;if(dt>0&&dist>=5){const pace=dt/(dist/1000);if(pace>120&&pace<1800)runningState.currentPace=pace}}}runningState.lastPoint=p;runningState.pointCount=(runningState.pointCount||0)+1;saveRunningState();renderRunning()}
function runningElapsedSeconds(){if(!activeSession||!runningState)return 0;const raw=elapsed(activeSession.started_at),paused=Number(runningState.pausedSeconds||0),cur=runningPaused&&runningPauseStartedAt?elapsed(runningPauseStartedAt):0;return Math.max(0,raw-paused-cur)}
function renderRunning(){if(!activeSession||!runningState)return;const sec=runningElapsedSeconds(),km=(runningState.distanceMeters||0)/1000;e.runningProgramName.textContent=activeSession.program_name||"Løping";e.runningElapsed.textContent=fmtElapsed(sec);e.runningDistance.textContent=`${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km`;e.runningAvgPace.textContent=km>.05?formatPace(sec/km):"– /km";e.runningCurrentPace.textContent=formatPace(runningState.currentPace);e.runningPointCount.textContent=`${runningState.pointCount||0} GPS-punkter`;e.runningPauseBtn.textContent=runningPaused?"▶ Fortsett":"⏸ Pause"}
function startRunningGeolocation(){if(!navigator.geolocation){e.gpsStatus.textContent="GPS støttes ikke";e.gpsStatus.className="gps-status bad";return}stopGeolocation();runningWatchId=navigator.geolocation.watchPosition(handleRunningPosition,err=>{e.gpsStatus.textContent=err.code===1?"GPS-tillatelse avslått":"Kunne ikke hente GPS";e.gpsStatus.className="gps-status bad"},{enableHighAccuracy:true,maximumAge:1000,timeout:15000})}
async function startRunningRunner(){await requestWakeLock();runningState=loadRunningState()||{distanceMeters:0,pointCount:0,lastPoint:null,currentPace:null,pausedSeconds:0};runningPaused=!!runningState.paused;runningPauseStartedAt=runningState.pauseStartedAt||null;renderRunning();stopRunnerTick();runnerTimer=setInterval(renderRunning,500);if(!runningPaused)startRunningGeolocation()}
function toggleRunningPause(){if(!runningState)return;if(!runningPaused){runningPaused=true;runningPauseStartedAt=new Date().toISOString();runningState.paused=true;runningState.pauseStartedAt=runningPauseStartedAt;stopGeolocation()}else{if(runningPauseStartedAt)runningState.pausedSeconds=(runningState.pausedSeconds||0)+elapsed(runningPauseStartedAt);runningPaused=false;runningPauseStartedAt=null;runningState.paused=false;runningState.pauseStartedAt=null;runningState.lastPoint=null;startRunningGeolocation()}saveRunningState();renderRunning()}
async function finishRunning(){if(!activeSession||!runningState)return;stopGeolocation();stopRunnerTick();const sec=runningElapsedSeconds(),distance=runningState.distanceMeters||0,avgPace=distance>=50?sec/(distance/1000):null;activeSession._runningDuration=sec;activeSession._runningDistance=distance;activeSession._runningAvgPace=avgPace;e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(sec)} · ${(distance/1000).toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km${avgPace?` · ${formatPace(avgPace)}`:""}`;finishRating=4;e.finishComment.value="";renderStars();openModal(e.finishModal)}


let twentyState=null,twentyPaused=false,twentyPauseStartedAt=null,twentyBeepDone=false,twentyBeepTimeout=null;

function twentyStorageKey(){return activeSession?`cr_twenty_${activeSession.id}`:""}
function saveTwentyState(){if(activeSession&&twentyState)localStorage.setItem(twentyStorageKey(),JSON.stringify(twentyState))}
function loadTwentyState(){try{return JSON.parse(localStorage.getItem(twentyStorageKey())||"null")}catch{return null}}
function clearTwentyState(){if(activeSession)localStorage.removeItem(twentyStorageKey())}

function twentyElapsedSeconds(){
  if(!activeSession||!twentyState)return 0;
  const raw=elapsed(activeSession.started_at);
  const paused=Number(twentyState.pausedSeconds||0);
  const currentPause=twentyPaused&&twentyPauseStartedAt?elapsed(twentyPauseStartedAt):0;
  return Math.max(0,raw-paused-currentPause);
}
function twentyPhaseByRemaining(remain){
  if(remain>720)return["phase-darkgreen","MØRK GRØNN"];
  if(remain>420)return["phase-lightgreen","LYS GRØNN"];
  if(remain>120)return["phase-yellow","GUL"];
  return["phase-lightblue","LYS BLÅ"];
}
function playThreeSecondBeep(){
  try{
    const c=getAudioContext();
    if(!c)return;
    if(c.state!=="running"){c.resume().catch(()=>{});return}
    const o=c.createOscillator(),g=c.createGain();
    o.type="sine";o.frequency.value=1100;g.gain.value=.28;
    o.connect(g);g.connect(c.destination);
    o.start();
    o.stop(c.currentTime+3.0);
  }catch(err){console.warn("3 sek beep feilet:",err)}
}
function renderTwenty(){
  if(!activeSession||!twentyState)return;
  const total=1200,elapsedSec=twentyElapsedSeconds(),remain=Math.max(0,total-elapsedSec);
  const mins=Math.floor(remain/60),secs=Math.floor(remain%60),txt=`${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  e.twentyRemaining.textContent=txt;
  e.twentyBigTime.textContent=txt;
  const [phaseClass,phaseText]=twentyPhaseByRemaining(remain);
  e.twentyCard.className=`twenty-card ${phaseClass}`;
  e.twentyPhaseText.textContent=phaseText;
  e.twentyProgressBar.style.width=`${Math.min(100,Math.max(0,(elapsedSec/total)*100))}%`;
  e.twentyPauseBtn.textContent=twentyPaused?"▶ Fortsett":"⏸ Pause";

  if(!twentyBeepDone && remain<=600 && remain>596){
    twentyBeepDone=true;
    twentyState.beepDone=true;
    saveTwentyState();
    playThreeSecondBeep();
  }

  if(remain<=0){
    stopRunnerTick();
    activeSession._twentyDuration=1200;
    e.finishSummary.textContent=`${activeSession.program_name} · 20:00`;
    finishRating=4;e.finishComment.value="";if(e.finishDistanceWrap)e.finishDistanceWrap.classList.add("hidden");if(e.finishDistance)e.finishDistance.value="";renderStars();openModal(e.finishModal);
  }
}
async function startTwentyRunner(){
  await unlockAudio();
  await requestWakeLock();
  twentyState=loadTwentyState()||{pausedSeconds:0,paused:false,pauseStartedAt:null,beepDone:false};
  twentyPaused=!!twentyState.paused;
  twentyPauseStartedAt=twentyState.pauseStartedAt||null;
  twentyBeepDone=!!twentyState.beepDone;
  renderTwenty();
  stopRunnerTick();
  runnerTimer=setInterval(renderTwenty,250);
}
function toggleTwentyPause(){
  if(!twentyState)return;
  if(!twentyPaused){
    twentyPaused=true;
    twentyPauseStartedAt=new Date().toISOString();
    twentyState.paused=true;
    twentyState.pauseStartedAt=twentyPauseStartedAt;
  }else{
    if(twentyPauseStartedAt)twentyState.pausedSeconds=(twentyState.pausedSeconds||0)+elapsed(twentyPauseStartedAt);
    twentyPaused=false;
    twentyPauseStartedAt=null;
    twentyState.paused=false;
    twentyState.pauseStartedAt=null;
  }
  saveTwentyState();
  renderTwenty();
}
async function finishTwenty(){
  if(!activeSession)return;
  const duration=Math.min(1200,twentyElapsedSeconds());
  activeSession._twentyDuration=duration;
  e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(duration)}`;
  finishRating=4;e.finishComment.value="";if(e.finishDistanceWrap)e.finishDistanceWrap.classList.add("hidden");if(e.finishDistance)e.finishDistance.value="";renderStars();openModal(e.finishModal);
}

function renderFreeWorkout(){if(!activeSession)return;const sec=elapsed(activeSession.started_at);e.freeWorkoutElapsed.textContent=fmtElapsed(sec);e.freeWorkoutBigTime.textContent=fmtElapsed(sec);e.freeWorkoutProgramName.textContent=activeSession.program_name||"Fri økt"}
async function startFreeWorkoutRunner(){await requestWakeLock();renderFreeWorkout();stopRunnerTick();runnerTimer=setInterval(renderFreeWorkout,500)}
async function finishFreeWorkout(){if(!activeSession)return;stopRunnerTick();const sec=elapsed(activeSession.started_at);activeSession._freeDuration=sec;e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(sec)}`;finishRating=4;e.finishComment.value="";e.finishDistance.value="";e.finishDistanceWrap.classList.remove("hidden");renderStars();openModal(e.finishModal)}

async function loadCoachData(){await loadPrograms();const {data:links}=await sb.from("cr_coach_athletes").select("athlete_id,status,cr_profiles!cr_coach_athletes_athlete_id_fkey(*)").eq("coach_id",user.id).order("created_at");athletes=(links||[]).map(x=>({...x.cr_profiles,link_status:x.status}));const ids=athletes.map(a=>a.id);e.pendingCount.textContent=athletes.filter(a=>!a.approved).length;e.activeAthletesCount.textContent=athletes.filter(a=>a.approved).length;let today=0;if(ids.length){const from=new Date();from.setHours(0,0,0,0);const {count}=await sb.from("cr_workout_sessions").select("*",{count:"exact",head:true}).in("athlete_id",ids).gte("started_at",from.toISOString());today=count||0}e.sessionsTodayCount.textContent=today;renderAthletes();fillAthleteSelectors()}
function renderAthletes(){e.athletesList.innerHTML=athletes.length?athletes.map(a=>`<div class="athlete-item"><div class="athlete-row"><div><strong>${esc(a.full_name||a.email)}</strong><small>${esc(a.phone||"")} · ${esc(a.email||"")}</small><small>${a.approved?"✅ Godkjent":"⏳ Venter på godkjenning"}</small></div><div class="athlete-actions">${!a.approved?`<button class="approve-btn" data-id="${a.id}">Godkjenn</button>`:""}<button class="programs-btn" data-id="${a.id}">Programmer</button></div></div></div>`).join(""):`<div class="empty">Ingen utøvere har registrert seg ennå.</div>`;e.athletesList.querySelectorAll(".approve-btn").forEach(b=>b.onclick=()=>approveAthlete(b.dataset.id));e.athletesList.querySelectorAll(".programs-btn").forEach(b=>b.onclick=()=>openPrograms(b.dataset.id))}
async function approveAthlete(id){const {error}=await sb.from("cr_profiles").update({approved:true}).eq("id",id);if(error){alert(error.message);return}await sb.from("cr_coach_athletes").update({status:"approved"}).eq("coach_id",user.id).eq("athlete_id",id);await loadCoachData()}
async function openPrograms(id){
programAthleteId=id;const athlete=athletes.find(x=>x.id===id);e.programAthleteName.textContent=athlete?.full_name||"Utøver";
let rows=[];const q=await sb.from("cr_athlete_programs").select("program_id,enabled,sort_order").eq("athlete_id",id);
if(q.error){const f=await sb.from("cr_athlete_programs").select("program_id,enabled").eq("athlete_id",id);if(f.error){alert("Kunne ikke laste programtilgang: "+f.error.message);return}rows=(f.data||[]).map((x,i)=>({...x,sort_order:i+1}))}else rows=q.data||[];
const current=new Map(rows.map(x=>[x.program_id,x]));
e.programChecklist.innerHTML=programs.map((p,idx)=>{const row=current.get(p.id),checked=!!row?.enabled,order=row?.sort_order??idx+1;return `<div class="program-order-row" data-program-id="${p.id}"><label class="program-enable"><span><strong>${esc(p.name)}</strong><small>${esc(p.description||"")}</small></span><input class="program-enabled" type="checkbox" ${checked?"checked":""}></label><label class="program-order-label"><span>Nr.</span><input class="program-order-input" type="number" min="1" value="${order}" ${checked?"":"disabled"}></label></div>`}).join("");
e.programChecklist.querySelectorAll(".program-enabled").forEach(cb=>cb.onchange=()=>{cb.closest(".program-order-row").querySelector(".program-order-input").disabled=!cb.checked});openModal(e.programModal)}
async function savePrograms(){const rows=[...e.programChecklist.querySelectorAll(".program-order-row")].map((row,idx)=>{const enabled=row.querySelector(".program-enabled").checked;return{athlete_id:programAthleteId,program_id:row.dataset.programId,enabled,sort_order:enabled?Math.max(1,Number(row.querySelector(".program-order-input").value)||idx+1):null}});const en=rows.filter(x=>x.enabled).sort((a,b)=>(a.sort_order??9999)-(b.sort_order??9999));en.forEach((r,i)=>r.sort_order=i+1);const {error}=await sb.from("cr_athlete_programs").upsert(rows,{onConflict:"athlete_id,program_id"});if(error){alert("Kunne ikke lagre programrekkefølge. Kjør v7.6 SQL først.\n\n"+error.message);return}closeModal(e.programModal)}

function inviteUrl(){return `${location.origin}${location.pathname}?register=1&coach=${user.id}`}async function copyInvite(){await navigator.clipboard.writeText(inviteUrl());alert("Registreringslenken er kopiert.")}
function startRealtime(){if(realtimeChannel)sb.removeChannel(realtimeChannel);realtimeChannel=sb.channel("cr-workout-coach-v2").on("postgres_changes",{event:"INSERT",schema:"public",table:"cr_workout_sessions"},p=>handleRealtime(p.new)).on("postgres_changes",{event:"UPDATE",schema:"public",table:"cr_workout_sessions"},p=>handleRealtime(p.new)).subscribe()}
function handleRealtime(row){if(!athletes.some(a=>a.id===row.athlete_id))return;const a=athletes.find(x=>x.id===row.athlete_id),completed=row.status==="completed";if(row.status==="cancelled")return;const div=document.createElement("div");div.className="notification-item";div.innerHTML=`<strong>${completed?"✅":"🟢"} ${esc(a.full_name||a.email)} ${completed?"fullførte":"startet"} ${esc(row.program_name)}</strong><small>${completed&&row.rating?`Rating ${"★".repeat(row.rating)} · `:""}${fmtDate(completed?row.completed_at:row.started_at)}</small>`;if(e.notificationFeed.querySelector(".empty"))e.notificationFeed.innerHTML="";e.notificationFeed.prepend(div);loadCoachData()}

function fillAthleteSelectors(){const opts=[`<option value="">Alle utøvere</option>`,...athletes.filter(a=>a.approved).map(a=>`<option value="${a.id}">${esc(a.full_name||a.email)}</option>`)].join("");e.calendarAthleteSelect.innerHTML=opts;e.statsAthleteSelect.innerHTML=opts}
async function sessionsForView(selected=""){if(profile?.role==="coach"){const ids=selected?[selected]:athletes.filter(a=>a.approved).map(a=>a.id);if(!ids.length)return[];const {data}=await sb.from("cr_workout_sessions").select("*").in("athlete_id",ids).order("started_at",{ascending:false});return data||[]}const {data}=await sb.from("cr_workout_sessions").select("*").eq("athlete_id",user.id).order("started_at",{ascending:false});return data||[]}
async function renderCalendar(){const selected=e.calendarAthleteSelect.value||"",sessions=await sessionsForView(selected),y=currentMonth.getFullYear(),m=currentMonth.getMonth();e.calendarSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";e.calendarTitle.textContent=new Intl.DateTimeFormat("nb-NO",{month:"long",year:"numeric"}).format(currentMonth);e.calendarGrid.innerHTML="";const first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();for(let i=0;i<42;i++){let day,dm=m;if(i<offset){day=prev-offset+i+1;dm=m-1}else if(i>=offset+days){day=i-offset-days+1;dm=m+1}else day=i-offset+1;const d=new Date(y,dm,day),key=dateKey(d),count=sessions.filter(x=>dateKey(new Date(x.started_at))===key).length,b=document.createElement("button");b.className="calendar-day"+(key===dateKey(new Date())?" today":"");b.innerHTML=`${day}${count?`<span class="day-count">${count}</span>`:""}`;b.onclick=()=>renderCalendarDetails(key,sessions);e.calendarGrid.appendChild(b)}e.calendarDetails.innerHTML=""}
function renderCalendarDetails(key,sessions){
  const list=sessions.filter(x=>dateKey(new Date(x.started_at))===key);
  e.calendarDetails.innerHTML=list.length?list.map(x=>{
    const isRunning=x.program_id==="running"||String(x.program_name||"").trim().toLowerCase()==="løping";
    const status=x.status==="completed"?"Fullført":x.status==="cancelled"?"Forkastet":"Startet";
    const durationSeconds=Number(x.duration_seconds)||(x.status==="started"?elapsed(x.started_at):0);
    const minutes=durationSeconds>0?Math.max(1,Math.round(durationSeconds/60)):0;
    const km=Number(x.distance_meters)>0?Number(x.distance_meters)/1000:0;
    const pace=Number(x.avg_pace_seconds_per_km)>0?formatPace(Number(x.avg_pace_seconds_per_km)):"";
    const meta=[fmtDate(x.started_at),status];
    if(isRunning&&km>0)meta.push(`${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km`);
    if(isRunning&&minutes>0)meta.push(`${minutes} min`);
    if(isRunning&&pace)meta.push(pace);
    if(x.rating)meta.push("★".repeat(x.rating));

    return `<div class="notification-item calendar-workout-card">
      <strong>${esc(x.program_name)}</strong>
      <small>${meta.join(" · ")}</small>
      ${isRunning&&(km>0||minutes>0)?`<div class="calendar-running-metrics">
        ${km>0?`<span><b>${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})}</b><em>km</em></span>`:""}
        ${minutes>0?`<span><b>${minutes}</b><em>min</em></span>`:""}
      </div>`:""}
      ${x.comment?`<p>${esc(x.comment)}</p>`:""}
    </div>`;
  }).join(""):`<div class="empty">Ingen økter.</div>`
}
async function renderStats(){const selected=e.statsAthleteSelect.value||"",sessions=await sessionsForView(selected),valid=sessions.filter(x=>x.status!=="cancelled"),completed=valid.filter(x=>x.status==="completed"),ratings=completed.filter(x=>x.rating).map(x=>x.rating);e.statsSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";e.statSessions.textContent=valid.length;e.statMinutes.textContent=Math.round(completed.reduce((s,x)=>s+(x.duration_seconds||0),0)/60);e.statRating.textContent=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";e.statCompleted.textContent=valid.length?`${Math.round(completed.length/valid.length*100)}%`:"0%";const counts={};completed.forEach(x=>counts[x.program_name]=(counts[x.program_name]||0)+1);const entries=Object.entries(counts),max=Math.max(1,...entries.map(x=>x[1]));e.programStats.innerHTML=entries.length?entries.map(([n,v])=>`<div class="bar-row"><span>${esc(n)}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join(""):`<div class="empty">Ingen fullførte økter ennå.</div>`}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=async()=>{
  const n=b.dataset.screen;
  try{
    if(n==="home"){
      if(profile?.role==="coach"){await loadCoachData();showOnly("coach")}
      else{await loadAthleteData();showOnly("athlete")}
    }else if(n==="coach"){
      await loadCoachData();showOnly("athletes");
    }else if(n==="programs"){
      showOnly("programs");
      await loadCoachProgramOptions();
    }else if(n==="calendar"){
      showOnly("calendar");await renderCalendar();
    }else if(n==="stats"){
      showOnly("stats");await renderStats();
    }
  }catch(err){
    console.error("Navigation error",err);
    alert("Kunne ikke åpne siden: "+(err?.message||err));
  }
});
e.accountBtn.onclick=()=>{updateAccount();openModal(e.accountModal)};e.closeAccountBtn.onclick=()=>closeModal(e.accountModal);e.openLoginBtn.onclick=()=>openModal(e.accountModal);e.openRegisterBtn.onclick=()=>openModal(e.registerModal);e.showRegisterBtn.onclick=()=>{closeModal(e.accountModal);openModal(e.registerModal)};e.closeRegisterBtn.onclick=()=>closeModal(e.registerModal);e.loginBtn.onclick=login;e.registerBtn.onclick=register;e.logoutBtn.onclick=logout;e.copyInviteBtn.onclick=copyInvite;if(e.copyInviteBtnAthletes)e.copyInviteBtnAthletes.onclick=copyInvite;e.closeProgramBtn.onclick=()=>closeModal(e.programModal);e.saveProgramsBtn.onclick=savePrograms;
if(e.coachProgramSelect)e.coachProgramSelect.onchange=()=>loadProgramEditor(e.coachProgramSelect.value);if(e.exportProgramsBtn)e.exportProgramsBtn.onclick=exportPrograms;if(e.importProgramsBtn&&e.importProgramsFile)e.importProgramsBtn.onclick=()=>e.importProgramsFile.click();if(e.importProgramsFile)e.importProgramsFile.onchange=async()=>{await importProgramsFile(e.importProgramsFile.files?.[0]);e.importProgramsFile.value="";};if(e.reloadProgramBtn)e.reloadProgramBtn.onclick=()=>loadProgramEditor(e.coachProgramSelect.value);if(e.saveProgramActivitiesBtn)e.saveProgramActivitiesBtn.onclick=saveProgramActivities;
e.continueSessionBtn.onclick=async()=>{await unlockAudio();await requestWakeLock();launchRunner();};e.runningPauseBtn.onclick=toggleRunningPause;e.runningFinishBtn.onclick=finishRunning;e.runningDiscardBtn.onclick=discardActive;e.twentyPauseBtn.onclick=toggleTwentyPause;e.twentyFinishBtn.onclick=finishTwenty;e.twentyDiscardBtn.onclick=discardActive;e.freeWorkoutFinishBtn.onclick=finishFreeWorkout;e.freeWorkoutDiscardBtn.onclick=discardActive;e.discardSessionBtn.onclick=discardActive;e.intervalSkipBtn.onclick=()=>runnerMode==="intervalSequence"?skipIntervalSequence():skipInterval();e.runnerAbortBtn.onclick=discardActive;e.sequenceCompleteBtn.onclick=seqComplete;e.sequenceSkipBtn.onclick=seqSkip;e.sequencePostponeBtn.onclick=seqPostpone;e.sequenceAbortBtn.onclick=discardActive;
e.cancelFinishBtn.onclick=()=>closeModal(e.finishModal);e.saveFinishBtn.onclick=saveFinish;e.finishStars.querySelectorAll("button").forEach(b=>b.onclick=()=>{finishRating=Number(b.dataset.rating);renderStars()});e.prevMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar()};e.nextMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar()};e.calendarAthleteSelect.onchange=renderCalendar;e.statsAthleteSelect.onchange=renderStats;

sb.auth.onAuthStateChange(async(_event,newSession)=>{session=newSession;user=newSession?.user||null;await loadProfile();closeModal(e.accountModal);await route()});
(async function init(){const {data}=await sb.auth.getSession();session=data.session;user=session?.user||null;await loadProfile();if(new URLSearchParams(location.search).get("register")==="1"&&!user)openModal(e.registerModal);await route()})();

e.programInfoClose.onclick=()=>closeModal(e.programInfoModal);
})();