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
"sequenceProgramName","sequenceGroupRound","sequenceElapsed","sequenceProgressText","sequenceProgressBar","sequenceActivity","sequenceReps","sequenceLoad","sequenceDesc","sequenceNextActivity","sequenceNextMeta","sequenceCompleteBtn","sequenceSkipBtn","sequencePostponeBtn","sequenceHowToBtn","sequenceNextHowToBtn","exerciseHowToModal","exerciseHowToTitle","exerciseHowToBody","exerciseHowToTip","exerciseHowToClose","exerciseHowToOk","sequenceAbortBtn","runningScreen","runningProgramName","gpsStatus","runningElapsed","runningDistance","runningAvgPace","runningCurrentPace","runningGpsAccuracy","runningPointCount","runningPauseBtn","runningFinishBtn","runningDiscardBtn","twentyScreen","twentyCard","twentyProgramName","twentyRemaining","twentyBigTime","twentyPhaseText","twentyProgressBar","twentyPauseBtn","twentyFinishBtn","twentyDiscardBtn","freeWorkoutScreen","freeWorkoutProgramName","freeWorkoutElapsed","freeWorkoutBigTime","freeWorkoutFinishBtn","freeWorkoutDiscardBtn","finishDistanceWrap","finishDistance","programInfoModal","programInfoTitle","programInfoDescription","programInfoSummary","programInfoList","programInfoClose","routeMapModal","routeMapTitle","routeMapMeta","routeMap","routeMapClose","coachLiveSection","coachLiveSummary","coachLiveList","coachLiveRefreshBtn","liveRouteMapModal","liveRouteMapTitle","liveRouteMapMeta","liveRouteMap","liveRouteMapClose","coachLiveUpdated","golfScreen","golfCourseName","golfRoundMeta","golfElapsed","golfProgressText","golfTotalStrokes","golfProgressBar","golfDistance","golfGpsStatus","golfCurrentHole","golfHoleStatus","golfStrokesInput","golfMinusStrokeBtn","golfPlusStrokeBtn","golfNextHole","golfNextMeta","golfCompleteBtn","golfSkipBtn","golfPostponeBtn","golfMapBtn","golfFinishRoundBtn","golfDiscardBtn","golfSetupModal","golfSetupClose","golfSetupCourse","golfSetupHoles","golfSetupStartHole","golfStartRoundBtn","golfPreviousBtn","golfNextBtn","golfHistoryLabel","golfPar","golfPinDistance","golfFindCourseBtn","golfNearbyCourseBtn","golfCourseResultsWrap","golfCourseResults","golfCourseLookupStatus","golfTrackCount","coachGolfCoursesBtn","golfCoursesScreen","golfCoursesBackBtn","golfAdminCourseSelect","golfAdminNewCourseBtn","golfAdminCourseMeta","golfAdminHoles","golfAdminSaveBtn","golfSavedCourseSelect","golfSwipe","golfSwipeDots","golfOverviewHole","golfOverviewPar","golfMapHoleTitle","golfMapCourseTitle","golfMapDistance","golfInlineMap","golfInlineMapMessage","installAppBtn","golfSetupTee","golfHoleLength","golfOverviewLength","golfAdminTees","golfImportCsvBtn","golfImportCsvFile","golfDownloadCsvTemplateBtn","golfImportStatus"].forEach(id=>e[id]=$(id));

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
  if(typeof activeProgramWakeLockMode==="function" && activeProgramWakeLockMode()==="off"){ await releaseWorkoutWakeLock(); return null; }

  if(!activeSession || document.visibilityState!=="visible") return;
  if(!("wakeLock" in navigator)) return;
  try{
    if(wakeLock && !wakeLock.released) return;
    const request=navigator.wakeLock.request("screen");
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error("Wake Lock timeout")),1500));
    wakeLock=await Promise.race([request,timeout]);
    if(wakeLock)wakeLock.addEventListener("release",()=>{wakeLock=null;});
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
function showOnly(name){
  ["landing","athlete","coach","athletes","programs","golfCourses","runner","running","twenty","freeWorkout","golf","calendar","stats"]
    .forEach(n=>e[n+"Screen"]?.classList.toggle("hidden",n!==name));

  document.querySelectorAll(".nav-btn").forEach(b=>
    b.classList.toggle("active",
      (name==="athlete"&&b.dataset.screen==="home")||
      (name==="coach"&&b.dataset.screen==="home")||
      (name==="athletes"&&b.dataset.screen==="coach")||
      b.dataset.screen===name
    )
  );

  const isCoachDashboard=profile?.role==="coach"&&name==="coach";
  document.body.classList.toggle("coach-mode",profile?.role==="coach");
  if(!isCoachDashboard)stopCoachLivePolling();

  document.body.classList.toggle("golf-active-screen",name==="golf");
  window.scrollTo({top:0,left:0,behavior:"auto"});
}

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



/* v9.8.3 – programstyrt Wake Lock
   Løping, Golf og Fri økt skal kunne kjøres med skjermen av.
   Tids-/intervallprogrammer beholder Wake Lock. */
function activeProgramWakeLockMode(){
  const type=String(activeSession?.type||activeSession?.program_type||activeSession?.mode||"").toLowerCase();
  const name=String(activeSession?.program_name||activeSession?.name||activeSession?.title||"").toLowerCase();

  if(
    type.includes("running") || type.includes("run") || type.includes("golf") || type.includes("free") ||
    name.includes("løping") || name.includes("loping") || name.includes("running") ||
    name.includes("golf") || name.includes("fri økt") || name.includes("fri okt")
  ) return "off";

  return "on";
}

async function releaseWorkoutWakeLock(){
  try{
    if(typeof wakeLockSentinel!=="undefined" && wakeLockSentinel && !wakeLockSentinel.released){
      await wakeLockSentinel.release();
    }
  }catch(err){ console.warn("Wake Lock release:",err); }
  try{
    if(typeof wakeLock!=="undefined" && wakeLock && !wakeLock.released && typeof wakeLock.release==="function"){
      await wakeLock.release();
    }
  }catch(err){ console.warn("Wake Lock release:",err); }
}

async function applyWorkoutWakeLockPolicy(){
  if(activeProgramWakeLockMode()==="off"){
    await releaseWorkoutWakeLock();
    return false;
  }
  try{
    if(typeof requestWakeLock==="function"){ await requestWakeLock(); return true; }
    if(typeof acquireWakeLock==="function"){ await acquireWakeLock(); return true; }
  }catch(err){ console.warn("Wake Lock policy:",err); }
  return false;
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
async function route(){updateAccount();stopRunnerTick();if(!user){e.bottomNav.classList.add("hidden");showOnly("landing");return}e.bottomNav.classList.remove("hidden");const coach=profile?.role==="coach";e.athletesNavBtn?.classList.toggle("hidden",!coach);e.programsNavBtn?.classList.toggle("hidden",!coach);e.calendarAthleteSelect.classList.toggle("hidden",!coach);e.statsAthleteSelect.classList.toggle("hidden",!coach);if(coach){
  await loadCoachData();
  showOnly("coach");
  startCoachLivePolling();
  startRealtime();
}else{
  await loadAthleteData();
  showOnly("athlete");
}}

async function login(){e.loginMessage.textContent="Logger inn…";const {error}=await sb.auth.signInWithPassword({email:e.loginEmail.value.trim(),password:e.loginPassword.value});e.loginMessage.textContent=error?error.message:""}
function coachIdFromUrl(){return new URLSearchParams(location.search).get("coach")||""}
async function register(){const name=e.regName.value.trim(),phone=e.regPhone.value.trim(),email=e.regEmail.value.trim(),password=e.regPassword.value;if(!name||!phone||!email||password.length<6){e.registerMessage.textContent="Fyll ut alle feltene. Passord må ha minst 6 tegn.";return}e.registerMessage.textContent="Registrerer…";const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{full_name:name,phone,coach_id:coachIdFromUrl()}}});e.registerMessage.textContent=error?error.message:(data.session?"Registrert og innlogget.":"Registrert. Sjekk e-post og bekreft kontoen.")}
async function logout(){await releaseWakeLock();await sb.auth.signOut();closeModal(e.accountModal)}

async function loadPrograms(){const {data}=await sb.from("cr_programs").select("*").eq("active",true).order("sort_order");programs=data||[]}
async function loadAthleteData(){
  if(e.coachLiveSection)e.coachLiveSection.classList.add("hidden");

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
  if(id==="golf"){
    return `<div class="program-info-badges">
      <span>⛳ Hull-for-hull</span><span>🏌️ Slag</span><span>⏱ Tid</span><span>📏 GPS-distanse</span><span>🗺 GPS-spor</span>
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
  }else if(programId==="golf"){
    e.programInfoList.innerHTML=`
      <div class="program-info-simple">Velg golfbane, antall hull og starthull. Runden lagrer tid, GPS-spor, gangdistanse og score per hull. Hull kan fullføres, hoppes over eller utsettes.</div>`;
  }else if(settings?.program_type==="interval" || INTERVAL_PROGRAMS[programId]){
    e.programInfoList.innerHTML=`
      <div class="program-info-simple">Intervallprogram med automatisk veksling mellom arbeid og hvile, varsler og nedtelling.</div>`;
  }else{
    e.programInfoList.innerHTML='<div class="program-info-simple">Ingen detaljert aktivitetsliste er registrert for dette programmet.</div>';
  }
}



function isSequenceProgram(programId){
  const id=String(programId||"").trim();
  if(SEQUENCE_PROGRAMS[id])return true;
  if(/^bodyweight_day[123]$/i.test(id))return true;
  if(/^muscle_growth_day[1-5]$/i.test(id))return true;
  if(/^strength_day[12]$/i.test(id))return true;

  const p=programs.find(x=>String(x.id)===id);
  const name=String(p?.name||"").trim().toLowerCase();
  return name.startsWith("kroppsvekt dag ") || name.startsWith("styrke dag") || name.startsWith("muskelvekst dag ");
}

function isRunningProgram(programId){
  const id=String(programId||"").trim().toLowerCase();
  if(id==="running")return true;
  const p=programs.find(x=>String(x.id)===String(programId));
  return String(p?.name||"").trim().toLowerCase()==="løping";
}

async function startSession(programId){
  setTimeout(()=>applyWorkoutWakeLockPolicy(),0);

 await unlockAudio();
 if(activeSession){renderActiveSession();alert("Du har allerede en aktiv økt. Velg «Fortsett økten» eller forkast den først.");return}
 if(programId==="golf"){openGolfSetup();return}
 if(!INTERVAL_PROGRAMS[programId]&&!isSequenceProgram(programId)&&programId!=="kettlebell_mix"&&!isRunningProgram(programId)&&programId!=="twenty_minutes"&&programId!=="free_workout"&&programId!=="golf"){alert("Dette programmet er ikke aktivert i treningsmotoren ennå.");return}
 const p=programs.find(x=>x.id===programId);const {data,error}=await sb.from("cr_workout_sessions").insert({athlete_id:user.id,program_id:programId,program_name:p?.name||programId,status:"started",started_at:new Date().toISOString()}).select().single();if(error){alert(error.message);return}activeSession=data;clearRunnerState();requestWakeLock().catch(()=>{});await launchRunner();
}
function renderActiveSession(){
 e.activeSessionCard.classList.toggle("hidden",!activeSession);
 clearInterval(homeTimer);
 if(!activeSession)return;
 const sessionId=activeSession.id;
 e.activeSessionName.textContent=activeSession.program_name||"Aktiv økt";
 e.activeStartedAt.textContent=activeSession.started_at?fmtDate(activeSession.started_at):"";
 const tick=()=>{
   if(!activeSession || activeSession.id!==sessionId || !activeSession.started_at){
     clearInterval(homeTimer);
     return;
   }
   e.activeElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at));
 };
 tick();
 homeTimer=setInterval(tick,1000);
}
async function discardActive(){
 if(!activeSession||!confirm(`Forkaste den aktive økten «${activeSession.program_name}»?`))return;
 const id=activeSession.id;const {error}=await sb.from("cr_workout_sessions").update({status:"cancelled",completed_at:new Date().toISOString(),duration_seconds:elapsed(activeSession.started_at)}).eq("id",id);if(error){alert(error.message);return}if(activeSession?.program_id==="running"){clearRunningState();stopGeolocation();runningState=null}if(activeSession?.program_id==="twenty_minutes"){clearTwentyState();twentyState=null}if(activeSession?.program_id==="golf"){stopGolfGeolocation();destroyGolfInlineMap();clearGolfState();golfState=null}stopLivePublishing();clearRunnerState();activeSession=null;stopLivePublishing();await releaseWakeLock();stopRunnerTick();await loadAthleteData();showOnly("athlete")
}

async function launchRunner(){
  setTimeout(()=>applyWorkoutWakeLockPolicy(),0);

 if(!activeSession || !activeSession.program_id)return;
 requestWakeLock().catch(()=>{});
 const id=activeSession.program_id;

 if(id==="golf")runnerMode="golf";
 else if(id==="free_workout")runnerMode="freeWorkout";
 else if(id==="twenty_minutes")runnerMode="twenty";
 else if(isRunningProgram(id))runnerMode="running";
 else if(id==="kettlebell_mix")runnerMode="intervalSequence";
 else if(INTERVAL_PROGRAMS[id])runnerMode="interval";
 else if(isSequenceProgram(id))runnerMode="sequence";
 else runnerMode=null;

 if(!runnerMode){
   alert("Programmotor mangler for denne økten.");
   return;
 }

 startLivePublishing();

 if(runnerMode==="golf"){showOnly("golf");await startGolfRunner();return}
 if(runnerMode==="freeWorkout"){showOnly("freeWorkout");await startFreeWorkoutRunner();return}
 if(runnerMode==="twenty"){showOnly("twenty");await startTwentyRunner();return}
 if(runnerMode==="running"){showOnly("running");await startRunningRunner();return}

 showOnly("runner");
 e.intervalRunner.classList.toggle("hidden",!["interval","intervalSequence"].includes(runnerMode));
 e.sequenceRunner.classList.toggle("hidden",runnerMode!=="sequence");

 if(runnerMode==="interval")await startIntervalRunner();
 else if(runnerMode==="intervalSequence")await startIntervalSequenceRunner();
 else await startSequenceRunner();
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


const MUSCLE_GROWTH_HOWTO={
  "Brystpress flatbenk":["Ligg stabilt på benken med føttene i gulvet. Hold manualene ved brystet, senk kontrollert og press dem opp til armene nesten er strake.","Hold skulderbladene lett trukket sammen og unngå å løfte skuldrene mot ørene."],
  "Skrå brystpress":["Still benken i moderat skrå vinkel. Start manualene ved øvre del av brystet, senk kontrollert og press opp og litt inn.","Hold brystet oppe og skulderbladene stabile mot benken."],
  "Brystpress fra gulv":["Ligg på ryggen med bøyde knær. Senk manualene til overarmene møter gulvet, stopp kort og press opp igjen.","Gulvet begrenser bevegelsen; hold håndleddene stabile over albuene."],
  "Stående skulderpress":["Stå stødig med manualene ved skuldrene. Stram mage og sete og press manualene rett opp over hodet før du senker kontrollert.","Unngå å svaie i korsryggen."],
  "Sidehev":["Stå med manualene langs siden og lett bøy i albuene. Løft armene kontrollert ut til siden omtrent til skulderhøyde, og senk rolig.","Bruk lett nok vekt til at skuldrene gjør jobben uten sving."],
  "Enarms triceps press":["Hold én manual over hodet. Bøy albuen slik at manualen senkes bak hodet, og strekk deretter albuen helt ut igjen.","Hold overarmen mest mulig i ro og nær hodet."],
  "Dips på benk (eller stol)":["Plasser hendene på kanten bak deg og føttene foran. Senk kroppen ved å bøye albuene, og press deg opp igjen.","Hold skuldrene nede og beveg deg kontrollert; kort ned bevegelsen hvis skuldrene blir ukomfortable."],
  "Goblet squat":["Hold én manual tett foran brystet. Sett hoftene bak og ned mellom beina, hold brystet oppe og press gjennom hele foten tilbake til stående.","La knærne følge retningen til tærne og behold en stabil rygg."],
  "Strake markløft":["Hold manualene foran lårene. Skyv hoftene bak med lett bøyde knær og senk vektene langs beina til du kjenner strekk bak på lårene. Strekk hoften frem igjen.","Hold ryggen nøytral og manualene nær kroppen."],
  "Utfall bakover":["Stå høyt og ta et kontrollert steg bak. Senk bakre kne mot gulvet mens fremre fot står stabilt, og press deg tilbake til start.","Hold fremre kne i samme retning som foten."],
  "Markløft":["Start med manualene nær beina. Bøy i hofte og knær, hold ryggen stabil og reis deg ved å presse gulvet bort og strekke hoften.","Hold vektene tett på kroppen gjennom hele løftet."],
  "Tåhev":["Stå stødig og løft hælene så høyt du kan ved å presse gjennom forfoten. Hold kort på toppen og senk kontrollert.","Bruk full kontroll og unngå å sprette i bunnposisjonen."],
  "Russian twist":["Sitt med lett bakoverlent overkropp og stram mage. Roter brystkassen kontrollert fra side til side med manualen foran kroppen.","La rotasjonen komme fra overkroppen, ikke bare armene."],
  "Liggende beinhev":["Ligg på ryggen og hold korsryggen stabil mot underlaget. Senk strake eller lett bøyde bein kontrollert og løft dem tilbake.","Stopp før korsryggen begynner å løfte seg."],
  "Fremoverlent roing":["Bøy i hoften med stabil rygg og manualene hengende ned. Trekk albuene bakover og manualene mot kroppen, og senk kontrollert.","Tenk at skulderbladene trekkes sammen uten at skuldrene løftes."],
  "En-arms roing":["Støtt deg på benk eller lår. Trekk manualen mot hoften med albuen tett inn, og senk kontrollert til armen er lang.","Hold overkroppen stabil og unngå å rotere."],
  "Pullover":["Ligg på benk og hold én manual over brystet. Før vekten kontrollert bak hodet med lett bøyde albuer, og trekk den tilbake over brystet.","Behold ribbeina kontrollert og unngå stor svai i korsryggen."],
  "Renegade row":["Start i høy plankeposisjon med hendene på manualene. Hold kroppen stabil mens du ror én manual mot hoften, sett den ned og bytt side.","Stå gjerne litt bredt med føttene for å redusere rotasjon."],
  "Bicepscurl":["Stå med armene langs siden. Hold albuene nær kroppen, bøy dem og løft manualene mot skuldrene før du senker rolig.","Unngå å svinge overkroppen for å få vekten opp."],
  "Hammercurl":["Hold manualene med håndflatene vendt mot hverandre. Curl opp med albuene tett ved siden og senk kontrollert.","Behold nøytralt håndledd og rolig overkropp."],
  "Knebøy":["Hold manualene stabilt og sett hoftene bak og ned. Hold brystet oppe, knærne i retning tærne og reis deg ved å presse gjennom føttene.","Velg dybde der du kan beholde kontroll og stabil rygg."],
  "Splitt-knebøy":["Stå i splittstilling med føttene i samme posisjon gjennom settet. Senk kroppen rett ned og press opp gjennom fremre fot.","Hold bekken og kne stabilt; bytt side etter ønsket antall reps."],
  "Hip Thrust":["Plasser øvre rygg mot benken og manualen over hoften. Senk hoften kontrollert og press den opp til hofte og overkropp danner en rett linje.","Stram setet på toppen uten å overdrive svai i korsryggen."],
  "Sidebøy":["Stå høyt med én manual i hånden. Senk vekten kontrollert ned langs siden ved å bøye overkroppen sideveis, og trekk deg tilbake til oppreist.","Hold kroppen vendt rett frem uten å rotere."],
  "Planken":["Støtt på underarmer og tær. Stram mage og sete og hold kroppen i en rett linje.","Unngå at hoften synker eller løftes for høyt."],
  "Arnold Press":["Start manualene foran skuldrene med håndflatene mot deg. Roter armene utover samtidig som du presser vektene over hodet, og reverser bevegelsen ned.","Beveg kontrollert og hold magen aktiv gjennom hele presset."],
  "Roing over benk":["Ligg med brystet støttet mot en skrå benk. La manualene henge ned, trekk albuene bakover mot kroppen og senk kontrollert.","Bryststøtten skal hindre at du bruker fart fra korsryggen."]
};

function showExerciseHowTo(item){
  const data=MUSCLE_GROWTH_HOWTO[String(item?.activity||"")];
  if(!data)return;
  e.exerciseHowToTitle.textContent=item.activity||"Øvelse";
  e.exerciseHowToBody.textContent=data[0];
  e.exerciseHowToTip.textContent="Tips: "+data[1];
  openModal(e.exerciseHowToModal);
}
function closeExerciseHowTo(){ closeModal(e.exerciseHowToModal); }

async function startSequenceRunner(){
  const cfg=SEQUENCE_PROGRAMS[activeSession.program_id] || {
    name: programs.find(x=>String(x.id)===String(activeSession.program_id))?.name
      || activeSession.program_name
      || activeSession.program_id
  };

  showOnly("runner");
  e.intervalRunner.classList.add("hidden");
  e.sequenceRunner.classList.remove("hidden");
  e.sequenceProgramName.textContent=cfg.name;

  const saved=loadRunnerState();
  try{ await ensureProgramActivitiesSeeded(activeSession.program_id); }catch(err){ console.warn("Aktivitets-seed:",err); }
  const items=await getSequenceItems(activeSession.program_id);

  if(!items.length){
    alert("Dette programmet har ingen aktiviteter registrert.");
    return;
  }

  sequenceState=
    saved &&
    saved.mode==="sequence" &&
    Array.isArray(saved.queue) &&
    Array.isArray(saved.completed) &&
    Array.isArray(saved.skipped)
      ? saved
      : {
          mode:"sequence",
          queue:items.map(x=>({...x})),
          completed:[],
          skipped:[]
        };

  // Repair any malformed/stale state created by an older version.
  if(!Array.isArray(sequenceState.queue) ||
     !Array.isArray(sequenceState.completed) ||
     !Array.isArray(sequenceState.skipped)){
    sequenceState={
      mode:"sequence",
      queue:items.map(x=>({...x})),
      completed:[],
      skipped:[]
    };
  }

  saveRunnerState(sequenceState);

  const render=()=>{
    const cur=sequenceState.queue[0];
    e.sequenceElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at));

    if(!cur){
      stopRunnerTick();
      openFinish();
      return;
    }

    const next=sequenceState.queue[1];
    const done=sequenceState.completed.length+sequenceState.skipped.length;
    const total=items.length;

    e.sequenceGroupRound.textContent=
      `${cur.group==="WarmUp"?"Oppvarming":"Hoveddel"} · Runde ${cur.round}`;

    e.sequenceProgressText.textContent=
      `Aktivitet ${done+1} av ${total} · ${sequenceState.completed.length} fullført`;

    e.sequenceProgressBar.style.width=
      `${Math.min(100,(done/Math.max(1,total))*100)}%`;

    e.sequenceActivity.textContent=cur.activity||"Aktivitet";
    const curHowTo=MUSCLE_GROWTH_HOWTO[String(cur.activity||"")];
    e.sequenceHowToBtn.classList.toggle("hidden",!curHowTo);
    e.sequenceHowToBtn.onclick=curHowTo?()=>showExerciseHowTo(cur):null;
    const nextHowTo=next?MUSCLE_GROWTH_HOWTO[String(next.activity||"")]:null;
    e.sequenceNextHowToBtn.classList.toggle("hidden",!nextHowTo);
    e.sequenceNextHowToBtn.onclick=nextHowTo?()=>showExerciseHowTo(next):null;
    e.sequenceReps.textContent=cur.reps||"–";
    e.sequenceLoad.textContent=cur.load||"–";
    e.sequenceDesc.textContent=cur.desc||"";

    e.sequenceNextActivity.textContent=next?next.activity:"Ferdig";
    e.sequenceNextMeta.textContent=next
      ? `${next.group==="WarmUp"?"Oppvarming":"Hoveddel"} · Runde ${next.round}${next.reps?` · ${next.reps} reps`:""}${next.load?` · ${next.load}`:""}`
      : "Siste aktivitet";
  };

  render();
  stopRunnerTick();
  runnerTimer=setInterval(render,500);
}

function seqComplete(){if(!sequenceState?.queue.length)return;sequenceState.completed.push(sequenceState.queue.shift());saveRunnerState(sequenceState);startSequenceRunner()}
function seqSkip(){if(!sequenceState?.queue.length)return;sequenceState.skipped.push(sequenceState.queue.shift());saveRunnerState(sequenceState);startSequenceRunner()}
function seqPostpone(){if(!sequenceState?.queue.length)return;const item=sequenceState.queue[0];let last=-1;for(let i=1;i<sequenceState.queue.length;i++){const x=sequenceState.queue[i];if(x.group===item.group&&x.round===item.round)last=i;else break}if(last<1){alert("Dette er siste aktivitet i denne runden.");return}sequenceState.queue.shift();sequenceState.queue.splice(last,0,item);saveRunnerState(sequenceState);startSequenceRunner()}

function renderStars(){e.finishStars.querySelectorAll("button").forEach(b=>b.textContent=Number(b.dataset.rating)<=finishRating?"★":"☆")}
function openFinish(){if(!activeSession||!e.finishModal.classList.contains("hidden"))return;finishRating=4;e.finishComment.value="";e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(elapsed(activeSession.started_at))}`;renderStars();openModal(e.finishModal)}
async function saveFinish(){
  const ended=new Date(),isRunning=activeSession?.program_id==="running",isTwenty=activeSession?.program_id==="twenty_minutes",isFree=activeSession?.program_id==="free_workout",isGolf=activeSession?.program_id==="golf";
  const duration=isRunning?(activeSession._runningDuration||runningElapsedSeconds()):isTwenty?(activeSession._twentyDuration??twentyElapsedSeconds()):isFree?(activeSession._freeDuration??elapsed(activeSession.started_at)):isGolf?(activeSession._golfDuration??elapsed(activeSession.started_at)):elapsed(activeSession.started_at);
  const distance=isRunning?(activeSession._runningDistance??runningState?.distanceMeters??0):null;
  const avgPace=isRunning?(activeSession._runningAvgPace??(distance>=50?duration/(distance/1000):null)):null;
  const updates={status:"completed",completed_at:ended.toISOString(),duration_seconds:duration,rating:finishRating,comment:e.finishComment.value.trim()};
  if(isRunning){
    updates.distance_meters=distance;
    updates.avg_pace_seconds_per_km=avgPace;
    updates.gps_track=activeSession?._runningTrack??(Array.isArray(runningState?.track)?runningState.track:[]);
  }if(isGolf){
    updates.distance_meters=(activeSession?._golfDistance??Number(golfState?.distanceMeters))||0;
    updates.gps_track=activeSession?._golfTrack??(Array.isArray(golfState?.track)?golfState.track:[]);
    updates.golf_scorecard=activeSession?._golfScorecard??{
      course:golfState?.course||activeSession?.golf_course||"Golf",
      holes:golfState?.holes||activeSession?.golf_holes||18,
      start_hole:golfState?.startHole||activeSession?.golf_start_hole||1,
      completed:golfState?.completed||[],
      skipped:golfState?.skipped||[],
      total_strokes:golfTotalStrokes()
    };
  }if(isFree){const km=Number(String(e.finishDistance?.value||"").replace(",","."));if(km>0)updates.distance_meters=km*1000}
  const {error}=await sb.from("cr_workout_sessions").update(updates).eq("id",activeSession.id);
  if(error){alert(error.message);return}
  if(isRunning){clearRunningState();stopGeolocation();runningState=null}if(isTwenty){clearTwentyState();twentyState=null}if(isGolf){stopGolfGeolocation();destroyGolfInlineMap();clearGolfState();golfState=null}
  stopLivePublishing();clearRunnerState();activeSession=null;stopLivePublishing();await releaseWakeLock();stopRunnerTick();closeModal(e.finishModal);await loadAthleteData();showOnly("athlete")
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
function handleRunningPosition(pos){
  if(runningPaused||!runningState)return;
  const c=pos.coords;
  const p={lat:c.latitude,lon:c.longitude,accuracy:c.accuracy,ts:pos.timestamp};
  const prev=runningState.lastPoint;
  updateGpsStatus(c.accuracy);

  let acceptedForTrack=(p.accuracy||999)<=50;

  if(prev){
    const dt=(p.ts-prev.ts)/1000;
    const dist=haversineMeters(prev,p);
    const speed=dt>0?(dist/dt)*3.6:0;
    const good=Math.max(p.accuracy||999,prev.accuracy||999)<=50;

    if(good&&dist>=3&&speed<=25){
      runningState.distanceMeters+=dist;
      if(dt>0&&dist>=5){
        const pace=dt/(dist/1000);
        if(pace>120&&pace<1800)runningState.currentPace=pace;
      }
    }

    // Reject obvious GPS jumps from saved route as well.
    if(speed>25)acceptedForTrack=false;
  }

  if(acceptedForTrack){
    runningState.track.push({
      lat:p.lat,
      lon:p.lon,
      accuracy:p.accuracy,
      ts:p.ts
    });
  }

  runningState.lastPoint=p;
  runningState.pointCount=(runningState.pointCount||0)+1;
  saveRunningState();
  renderRunning();
}
function runningElapsedSeconds(){if(!activeSession||!runningState)return 0;const raw=elapsed(activeSession.started_at),paused=Number(runningState.pausedSeconds||0),cur=runningPaused&&runningPauseStartedAt?elapsed(runningPauseStartedAt):0;return Math.max(0,raw-paused-cur)}
function renderRunning(){if(!activeSession||!runningState)return;const sec=runningElapsedSeconds(),km=(runningState.distanceMeters||0)/1000;e.runningProgramName.textContent=activeSession.program_name||"Løping";e.runningElapsed.textContent=fmtElapsed(sec);e.runningDistance.textContent=`${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km`;e.runningAvgPace.textContent=km>.05?formatPace(sec/km):"– /km";e.runningCurrentPace.textContent=formatPace(runningState.currentPace);e.runningPointCount.textContent=`${runningState.track?.length||0} lagrede GPS-punkter`;e.runningPauseBtn.textContent=runningPaused?"▶ Fortsett":"⏸ Pause"}
function startRunningGeolocation(){if(!navigator.geolocation){e.gpsStatus.textContent="GPS støttes ikke";e.gpsStatus.className="gps-status bad";return}stopGeolocation();runningWatchId=navigator.geolocation.watchPosition(handleRunningPosition,err=>{e.gpsStatus.textContent=err.code===1?"GPS-tillatelse avslått":"Kunne ikke hente GPS";e.gpsStatus.className="gps-status bad"},{enableHighAccuracy:true,maximumAge:1000,timeout:15000})}
async function startRunningRunner(){await requestWakeLock();runningState=loadRunningState()||{distanceMeters:0,pointCount:0,lastPoint:null,currentPace:null,pausedSeconds:0,track:[]};if(!Array.isArray(runningState.track))runningState.track=[];runningPaused=!!runningState.paused;runningPauseStartedAt=runningState.pauseStartedAt||null;renderRunning();stopRunnerTick();runnerTimer=setInterval(renderRunning,500);if(!runningPaused)startRunningGeolocation()}
function toggleRunningPause(){if(!runningState)return;if(!runningPaused){runningPaused=true;runningPauseStartedAt=new Date().toISOString();runningState.paused=true;runningState.pauseStartedAt=runningPauseStartedAt;stopGeolocation()}else{if(runningPauseStartedAt)runningState.pausedSeconds=(runningState.pausedSeconds||0)+elapsed(runningPauseStartedAt);runningPaused=false;runningPauseStartedAt=null;runningState.paused=false;runningState.pauseStartedAt=null;runningState.lastPoint=null;startRunningGeolocation()}saveRunningState();renderRunning()}
async function finishRunning(){if(!activeSession||!runningState)return;stopGeolocation();stopRunnerTick();const sec=runningElapsedSeconds(),distance=runningState.distanceMeters||0,avgPace=distance>=50?sec/(distance/1000):null;activeSession._runningDuration=sec;activeSession._runningDistance=distance;activeSession._runningAvgPace=avgPace;activeSession._runningTrack=Array.isArray(runningState?.track)?runningState.track:[];e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(sec)} · ${(distance/1000).toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km${avgPace?` · ${formatPace(avgPace)}`:""}`;finishRating=4;e.finishComment.value="";renderStars();openModal(e.finishModal)}


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
  unlockAudio().catch(()=>{});
  requestWakeLock().catch(()=>{});
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
async function startFreeWorkoutRunner(){requestWakeLock().catch(()=>{});renderFreeWorkout();stopRunnerTick();runnerTimer=setInterval(renderFreeWorkout,500)}
async function finishFreeWorkout(){if(!activeSession)return;stopRunnerTick();const sec=elapsed(activeSession.started_at);activeSession._freeDuration=sec;e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(sec)}`;finishRating=4;e.finishComment.value="";e.finishDistance.value="";e.finishDistanceWrap.classList.remove("hidden");renderStars();openModal(e.finishModal)}


let livePublishTimer=null;
let lastLivePublishAt=0;

function stopLivePublishing(){
  if(livePublishTimer){clearInterval(livePublishTimer);livePublishTimer=null}
}

function currentWorkoutLivePayload(){
  if(!activeSession)return null;

  const payload={
    last_live_update:new Date().toISOString()
  };

  if(activeSession.program_id==="running"){
    const sec=runningElapsedSeconds();
    payload.progress_percent=null;
    payload.current_activity="Løping";
    payload.current_pace_seconds_per_km=Number.isFinite(Number(runningState?.currentPace))?Number(runningState.currentPace):null;
    payload.live_distance_meters=Number(runningState?.distanceMeters)||0;
    payload.live_gps_track=Array.isArray(runningState?.track)?runningState.track.slice(-1000):[];
    return payload;
  }

  if(activeSession.program_id==="twenty_minutes"){
    const elapsedSec=twentyElapsedSeconds();
    payload.progress_percent=Math.min(100,Math.max(0,(elapsedSec/1200)*100));
    payload.current_activity=e.twentyPhaseText?.textContent||"20 minutes Workout";
    return payload;
  }

  if(activeSession.program_id==="free_workout"){
    payload.progress_percent=null;
    payload.current_activity="Fri økt";
    return payload;
  }

  if(activeSession.program_id==="golf"){
    const done=golfProcessedCount();
    const total=Number(golfState?.holes)||Number(activeSession.golf_holes)||18;
    const track=Array.isArray(golfState?.track)?golfState.track:[];
    payload.progress_percent=total?Math.min(100,(done/total)*100):0;
    payload.current_activity=golfState?.queue?.[0]?`Hull ${golfState.queue[0]}`:"Golf";
    payload.live_distance_meters=Number(golfState?.distanceMeters)||0;
    payload.live_gps_track=track.slice(-1000);

    // Golf-runden lagres fortløpende, ikke bare ved avslutning.
    payload.distance_meters=Number(golfState?.distanceMeters)||0;
    payload.gps_track=track;
    payload.golf_scorecard={
      course:golfState?.course||activeSession.golf_course||"Golf",
      holes:golfState?.holes||activeSession.golf_holes||18,
      start_hole:golfState?.startHole||activeSession.golf_start_hole||1,
      tee:normalizeGolfTee(golfState?.tee||activeSession.golf_tee||""),
      completed:golfState?.completed||[],
      skipped:golfState?.skipped||[],
      total_strokes:golfTotalStrokes(),
      course_data:golfState?.courseData||activeSession.golf_course_data||null
    };
    return payload;
  }

  if(runnerMode==="sequence" && sequenceState){
    const done=(sequenceState.completed?.length||0)+(sequenceState.skipped?.length||0);
    const total=done+(sequenceState.queue?.length||0);
    payload.progress_percent=total?Math.min(100,(done/total)*100):0;
    payload.current_activity=sequenceState.queue?.[0]?.activity||"";
    return payload;
  }

  if(runnerMode==="intervalSequence" && intervalSequenceState){
    const total=intervalSequenceState.items?.length||0;
    const idx=Number(intervalSequenceState.index)||0;
    payload.progress_percent=total?Math.min(100,(idx/total)*100):0;
    payload.current_activity=intervalSequenceState.items?.[idx]?.activity||"";
    return payload;
  }

  if(runnerMode==="interval"){
    const cfg=INTERVAL_PROGRAMS[activeSession.program_id];
    const total=(cfg?.rounds||0)*((cfg?.work||0)+(cfg?.rest||0));
    const sec=elapsed(activeSession.started_at);
    payload.progress_percent=total?Math.min(100,(sec/total)*100):0;
    payload.current_activity=e.intervalPhase?.textContent||activeSession.program_name||"";
    return payload;
  }

  payload.progress_percent=null;
  payload.current_activity=activeSession.program_name||"";
  return payload;
}

async function publishLiveWorkout(force=false){
  if(!activeSession)return;
  const now=Date.now();
  if(!force && now-lastLivePublishAt<4000)return;
  lastLivePublishAt=now;
  const payload=currentWorkoutLivePayload();
  if(!payload)return;
  try{
    await sb.from("cr_workout_sessions").update(payload).eq("id",activeSession.id);
  }catch(err){
    console.warn("Live-oppdatering feilet:",err);
  }
}

function startLivePublishing(){
  stopLivePublishing();
  publishLiveWorkout(true);
  livePublishTimer=setInterval(()=>publishLiveWorkout(false),5000);
}


let coachLiveSessions=[];
let coachLiveInterval=null;
let coachLiveClockInterval=null;
let liveLeafletMap=null;
let liveLeafletLayer=null;

function destroyLiveRouteMap(){
  try{
    if(liveLeafletMap){liveLeafletMap.remove();liveLeafletMap=null;liveLeafletLayer=null}
  }catch(err){console.warn(err)}
}


function isOpenEndedLiveSession(session){
  const id=String(session?.program_id||"").toLowerCase();
  const name=String(session?.program_name||"").trim().toLowerCase();
  return id==="running" || id==="free_workout" || name==="løping" || name==="fri økt";
}

function rollingHourProgress(session){
  const started=session?.started_at?new Date(session.started_at).getTime():NaN;
  if(!Number.isFinite(started))return null;

  const elapsedMinutes=Math.max(0,(Date.now()-started)/60000);
  const block=Math.floor(elapsedMinutes/60);
  const startMin=block*60;
  const goalMin=(block+1)*60;
  const within=elapsedMinutes-startMin;
  const percent=Math.min(100,Math.max(0,(within/60)*100));

  return {
    elapsedMinutes,
    startMin,
    goalMin,
    percent
  };
}

function formatElapsedMinutes(mins){
  const total=Math.max(0,Math.floor(mins));
  const h=Math.floor(total/60);
  const m=total%60;
  return h>0?`${h} t ${String(m).padStart(2,"0")} min`:`${m} min`;
}

function liveSessionProgress(session){
  if(isOpenEndedLiveSession(session)){
    return rollingHourProgress(session)?.percent ?? null;
  }
  const p=Number(session.progress_percent);
  return Number.isFinite(p)?Math.min(100,Math.max(0,p)):null;
}

function liveSessionSubtitle(session){
  const parts=[];
  if(session.current_activity)parts.push(session.current_activity);
  if(session.started_at)parts.push(`Startet ${fmtDate(session.started_at)}`);
  return parts.join(" · ");
}

function liveSessionMetrics(session){
  const isRun=session.program_id==="running" || String(session.program_name||"").toLowerCase()==="løping";
  if(!isRun)return "";
  const km=(Number(session.live_distance_meters)||0)/1000;
  const pace=Number(session.current_pace_seconds_per_km)||0;
  return `<div class="coach-live-run-metrics">
    <span><small>Distanse</small><strong>${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km</strong></span>
    <span><small>Current pace</small><strong>${pace>0?formatPace(pace):"– /km"}</strong></span>
  </div>`;
}

function renderCoachLive(){
  const list=coachLiveSessions||[];
  e.coachLiveSummary.innerHTML=list.length
    ? `<span class="viz-badge">${list.length} aktive økter</span>`
    : "";

  e.coachLiveList.innerHTML=list.length?list.map(s=>{
    const progress=liveSessionProgress(s);
    const isRun=s.program_id==="running" || String(s.program_name||"").toLowerCase()==="løping";
    const isGolf=s.program_id==="golf" || String(s.program_name||"").toLowerCase()==="golf";
    const hasMap=(isRun||isGolf) && Array.isArray(s.live_gps_track) && s.live_gps_track.length>1;
    return `<article class="coach-live-card">
      <div class="coach-live-top">
        <div>
          <div class="coach-live-athlete">${esc(s.athlete_name||"Utøver")}</div>
          <h3>${esc(s.program_name||"Aktiv økt")}</h3>
          <p>${esc(liveSessionSubtitle(s))}</p>
        </div>
        <span class="live-pill">LIVE</span>
      </div>

      ${progress!=null?(()=>{
        if(isOpenEndedLiveSession(s)){
          const tp=rollingHourProgress(s);
          return tp?`<div class="coach-progress-wrap rolling-time-progress">
            <div class="coach-progress-label">
              <span>Påløpt tid</span>
              <strong>${formatElapsedMinutes(tp.elapsedMinutes)}</strong>
            </div>
            <div class="coach-progress-track"><div style="width:${tp.percent}%"></div></div>
            <div class="coach-progress-scale">
              <span>${tp.startMin} min</span>
              <span>${tp.goalMin} min</span>
            </div>
          </div>`:"";
        }
        return `<div class="coach-progress-wrap">
          <div class="coach-progress-label"><span>Progresjon</span><strong>${Math.round(progress)} %</strong></div>
          <div class="coach-progress-track"><div style="width:${progress}%"></div></div>
        </div>`;
      })():""}

      ${liveSessionMetrics(s)}

      <div class="coach-live-actions">
        ${hasMap?`<button class="secondary-btn compact-btn live-map-btn" data-id="${s.id}">🗺 Kartplassering</button>`:""}
      </div>
    </article>`;
  }).join(""):`<div class="empty">Ingen aktive økter.</div>`;

  e.coachLiveList.querySelectorAll(".live-map-btn").forEach(btn=>{
    btn.onclick=()=>{
      const session=coachLiveSessions.find(x=>String(x.id)===String(btn.dataset.id));
      if(session)openLiveRouteMap(session);
    };
  });
}

async function loadCoachLiveSessions(){
  if(!profile || profile.role!=="coach")return;

  const {data:links,error:linksError}=await sb
    .from("cr_coach_athletes")
    .select("athlete_id")
    .eq("coach_id",user.id)
    .eq("status","approved");

  if(linksError){
    console.warn("Kunne ikke hente coach-utøvere:",linksError);
    return;
  }

  const athleteIds=(links||[]).map(x=>x.athlete_id);
  if(!athleteIds.length){
    coachLiveSessions=[];
    renderCoachLive();
    if(e.coachLiveUpdated)e.coachLiveUpdated.textContent=`Oppdatert ${new Date().toLocaleTimeString("nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
    return;
  }

  const {data:sessions,error}=await sb
    .from("cr_workout_sessions")
    .select("id,athlete_id,program_id,program_name,started_at,status,progress_percent,current_activity,current_pace_seconds_per_km,live_distance_meters,live_gps_track,last_live_update")
    .in("athlete_id",athleteIds)
    .eq("status","started")
    .order("started_at",{ascending:false});

  if(error){
    console.warn("Kunne ikke hente aktive økter:",error);
    return;
  }

  const {data:profiles}=await sb
    .from("cr_profiles")
    .select("id,full_name,email")
    .in("id",athleteIds);

  const names=new Map((profiles||[]).map(p=>[p.id,p.full_name||p.email||"Utøver"]));

  coachLiveSessions=(sessions||[]).map(s=>({
    ...s,
    athlete_name:names.get(s.athlete_id)||"Utøver"
  }));

  renderCoachLive();
  if(e.coachLiveUpdated)e.coachLiveUpdated.textContent=`Oppdatert ${new Date().toLocaleTimeString("nb-NO",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
}

function stopCoachLivePolling(){
  if(coachLiveInterval){
    clearInterval(coachLiveInterval);
    coachLiveInterval=null;
  }
  if(coachLiveClockInterval){
    clearInterval(coachLiveClockInterval);
    coachLiveClockInterval=null;
  }
}

function coachDashboardVisible(){
  return profile?.role==="coach"
    && e.coachScreen
    && !e.coachScreen.classList.contains("hidden")
    && document.visibilityState==="visible";
}

function startCoachLivePolling(){
  stopCoachLivePolling();
  if(!coachDashboardVisible())return;

  loadCoachLiveSessions();

  // Database oppdateres hvert 5. sekund.
  coachLiveInterval=setInterval(()=>{
    if(!coachDashboardVisible()){
      stopCoachLivePolling();
      return;
    }
    loadCoachLiveSessions();
  },5000);

  // Kun lokal visning oppdateres hvert sekund, slik at tidsbaren flyter jevnt.
  coachLiveClockInterval=setInterval(()=>{
    if(!coachDashboardVisible()){
      stopCoachLivePolling();
      return;
    }
    if(coachLiveSessions.some(isOpenEndedLiveSession))renderCoachLive();
  },1000);
}

function openLiveRouteMap(session){
  const points=normalizeGpsTrack(session?.live_gps_track);
  e.liveRouteMapTitle.textContent=`${session.athlete_name||"Utøver"} · ${session.program_name||"Løping"}`;
  e.liveRouteMapMeta.textContent=[
    `${((Number(session.live_distance_meters)||0)/1000).toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km`,
    Number(session.current_pace_seconds_per_km)>0?formatPace(Number(session.current_pace_seconds_per_km)):null
  ].filter(Boolean).join(" · ");

  e.liveRouteMap.innerHTML='<div class="route-map-loading">Laster live-kart…</div>';
  openModal(e.liveRouteMapModal);

  setTimeout(()=>{
    destroyLiveRouteMap();

    if(!points.length){
      e.liveRouteMap.innerHTML='<div class="route-map-empty">Ingen GPS-posisjon tilgjengelig ennå.</div>';
      return;
    }

    if(!window.L){
      e.liveRouteMap.innerHTML='<div class="route-map-empty">Kartbiblioteket kunne ikke lastes.</div>';
      return;
    }

    try{
      liveLeafletMap=L.map(e.liveRouteMap,{zoomControl:true,attributionControl:true});
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        maxZoom:19,
        attribution:"© OpenStreetMap"
      }).addTo(liveLeafletMap);

      const latlngs=points.map(p=>[p.lat,p.lon]);
      liveLeafletLayer=L.polyline(latlngs,{weight:5,opacity:.9}).addTo(liveLeafletMap);

      L.circleMarker(latlngs[0],{radius:8,weight:3,fillOpacity:1})
        .bindTooltip("Start").addTo(liveLeafletMap);

      L.circleMarker(latlngs[latlngs.length-1],{radius:9,weight:3,fillOpacity:1})
        .bindTooltip("Nå").addTo(liveLeafletMap);

      liveLeafletMap.fitBounds(liveLeafletLayer.getBounds(),{padding:[24,24],maxZoom:17});
      setTimeout(()=>liveLeafletMap?.invalidateSize(),100);
    }catch(err){
      console.error(err);
      destroyLiveRouteMap();
      e.liveRouteMap.innerHTML='<div class="route-map-empty">Kunne ikke vise kartet.</div>';
    }
  },80);
}


let golfWatchId=null,golfState=null;


let golfDbCourses=[],golfAdminCourseId=null;
async function loadGolfDbCourses(){
 const {data,error}=await sb.from("cr_golf_courses").select("*").eq("active",true).order("name");
 if(error){console.warn(error);return[]}
 golfDbCourses=data||[];
 if(e.golfSavedCourseSelect)e.golfSavedCourseSelect.innerHTML='<option value="">Velg bane…</option>'+golfDbCourses.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
 return golfDbCourses;
}
async function loadGolfDbCourse(id){
  const course=golfDbCourses.find(c=>c.id===id)||(await sb.from("cr_golf_courses").select("*").eq("id",id).maybeSingle()).data;
  const {data:holes,error}=await sb.from("cr_golf_holes").select("*").eq("course_id",id).order("hole_no");
  if(error)return null;

  let tees=[],lengths=[];
  try{
    const tr=await sb.from("cr_golf_tees").select("*").eq("course_id",id).eq("active",true).order("sort_order");
    if(!tr.error)tees=tr.data||[];
    const lr=await sb.from("cr_golf_hole_lengths").select("*").eq("course_id",id);
    if(!lr.error)lengths=lr.data||[];
  }catch(err){console.warn("Dynamiske tee-data ikke tilgjengelig:",err)}

  return{course,holes:holes||[],tees,lengths};
}
function dbCourseToGolfData(course,holes,tees=[],lengthRows=[]){
  const d={name:course.name,source:"CR-Workout banedatabase",courseId:course.id,tees:[],holes:{}};

  // Ny normalisert tee-modell
  if(Array.isArray(tees)&&tees.length){
    d.tees=tees.map(t=>({
      code:String(t.tee_code),
      name:t.tee_name||String(t.tee_code),
      totalLength:Number(t.total_length_m)||null,
      notes:t.notes||""
    }));
  }

  const lengthMap=new Map((lengthRows||[]).map(r=>[
    `${r.hole_no}:${String(r.tee_code)}`,
    Number(r.length_m)||null
  ]));

  holes.forEach(h=>{
    const lengths={};

    if(d.tees.length){
      d.tees.forEach(t=>lengths[t.code]=lengthMap.get(`${h.hole_no}:${t.code}`)??null);
    }else{
      // Bakoverkompatibilitet med gammel Norefjell-modell
      [["39",h.tee_39_m],["43",h.tee_43_m],["48",h.tee_48_m],["50",h.tee_50_m]]
        .forEach(([code,val])=>{if(val!=null)lengths[code]=Number(val)});
      d.tees=Object.keys(lengths).map((code,i)=>({code,name:code,totalLength:null,notes:""}));
    }

    d.holes[h.hole_no]={
      number:h.hole_no,par:h.par,strokeIndex:h.stroke_index,lengths,
      pin:h.green_lat!=null&&h.green_lon!=null?{lat:Number(h.green_lat),lon:Number(h.green_lon)}:null,
      pinSource:h.green_lat!=null?"CR-Workout green":""
    };
  });
  return d;
}

async function resolveGolfCourseDataFromDb(courseName=""){
  await loadGolfDbCourses();
  let course=null;

  const selectedId=e.golfSavedCourseSelect?.value||"";
  if(selectedId)course=golfDbCourses.find(c=>c.id===selectedId)||null;

  if(!course && courseName){
    const wanted=String(courseName).trim().toLowerCase();
    course=golfDbCourses.find(c=>String(c.name||"").trim().toLowerCase()===wanted)||null;
  }

  if(!course && courseName){
    const wanted=String(courseName).trim().toLowerCase();
    course=golfDbCourses.find(c=>{
      const n=String(c.name||"").trim().toLowerCase();
      return n.includes(wanted)||wanted.includes(n);
    })||null;
  }

  if(!course)return null;
  const result=await loadGolfDbCourse(course.id);
  if(!result)return null;
  return dbCourseToGolfData(result.course,result.holes,result.tees,result.lengths);
}


function populateGolfTeeOptions(courseData,preferred=""){
  if(!e.golfSetupTee)return;
  const tees=courseData?.tees||[];
  e.golfSetupTee.innerHTML=tees.length
    ?tees.map(t=>`<option value="${esc(t.code)}">${esc(t.name)}${t.totalLength?` · ${t.totalLength} m`:""}</option>`).join("")
    :'<option value="">Ingen utslagssteder registrert</option>';

  const wanted=String(preferred||"");
  if(wanted&&tees.some(t=>String(t.code)===wanted))e.golfSetupTee.value=wanted;
  else if(tees.length)e.golfSetupTee.value=String(tees[Math.min(2,tees.length-1)].code);
}

async function chooseSavedGolfCourse(){
 const r=await loadGolfDbCourse(e.golfSavedCourseSelect.value); if(!r)return;
 e.golfSetupCourse.value=r.course.name;e.golfSetupHoles.value=String(r.course.holes||18);
 golfSetupCourseData=dbCourseToGolfData(r.course,r.holes,r.tees,r.lengths);
 populateGolfTeeOptions(golfSetupCourseData);
 const pins=r.holes.filter(h=>h.green_lat!=null&&h.green_lon!=null).length;
 const lengthCount=(r.lengths||[]).filter(x=>Number(x.length_m)>0).length;
 setGolfCourseStatus(`Banedata lastet: ${r.holes.length} hull · ${r.tees?.length||0} utslagssteder · ${lengthCount} hull-lengder · ${pins} green-posisjoner.`,"ok");
}

const GOLF_CSV_REQUIRED=[
  "course_id","course_name","hole_no","par","tee_code","length_m"
];

function golfCsvStatus(text,state=""){
  if(!e.golfImportStatus)return;
  e.golfImportStatus.textContent=text;
  e.golfImportStatus.dataset.state=state;
}

function parseCsvText(text){
  const rows=[];
  let row=[],field="",quoted=false;
  text=String(text||"").replace(/^\uFEFF/,"");

  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){
      if(ch==='"'&&text[i+1]==='"'){field+='"';i++}
      else if(ch==='"'){quoted=false}
      else field+=ch;
    }else{
      if(ch==='"')quoted=true;
      else if(ch===","){row.push(field);field=""}
      else if(ch==="\n"){
        row.push(field);field="";
        if(row.some(v=>String(v).trim()!==""))rows.push(row);
        row=[];
      }else if(ch!=="\r")field+=ch;
    }
  }
  row.push(field);
  if(row.some(v=>String(v).trim()!==""))rows.push(row);
  if(!rows.length)return [];

  const headers=rows.shift().map(h=>String(h).trim().toLowerCase());
  return rows.map(cols=>{
    const obj={};
    headers.forEach((h,i)=>obj[h]=String(cols[i]??"").trim());
    return obj;
  });
}

function csvNum(v){
  if(v==null||String(v).trim()==="")return null;
  const n=Number(String(v).replace(",","."));
  return Number.isFinite(n)?n:null;
}

function csvInt(v){
  const n=csvNum(v);
  return n==null?null:Math.trunc(n);
}

function slugGolfCourse(name){
  return String(name||"course")
    .trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/æ/g,"ae").replace(/ø/g,"o").replace(/å/g,"a")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}

function validateGolfCsv(rows){
  const errors=[];
  if(!rows.length)return ["CSV-filen inneholder ingen datarader."];

  const headers=Object.keys(rows[0]||{});
  GOLF_CSV_REQUIRED.forEach(h=>{
    if(!headers.includes(h))errors.push(`Mangler kolonnen ${h}`);
  });
  if(errors.length)return errors;

  const courseIds=new Set(rows.map(r=>r.course_id).filter(Boolean));
  if(courseIds.size!==1)errors.push("CSV-filen må inneholde nøyaktig én course_id.");

  rows.forEach((r,i)=>{
    const line=i+2;
    const hole=csvInt(r.hole_no),par=csvInt(r.par),len=csvInt(r.length_m);
    if(!r.course_name)errors.push(`Linje ${line}: course_name mangler.`);
    if(!(hole>=1&&hole<=36))errors.push(`Linje ${line}: ugyldig hole_no.`);
    if(!(par>=3&&par<=6))errors.push(`Linje ${line}: ugyldig par.`);
    if(!r.tee_code)errors.push(`Linje ${line}: tee_code mangler.`);
    if(!(len>0))errors.push(`Linje ${line}: length_m må være > 0.`);
  });
  return errors.slice(0,25);
}

async function importGolfCourseCsv(file){
  if(!file)return;
  golfCsvStatus("Leser CSV…","loading");

  try{
    const text=await file.text();
    const rows=parseCsvText(text);
    const errors=validateGolfCsv(rows);
    if(errors.length){
      golfCsvStatus("Import stoppet: "+errors.join(" | "),"warn");
      return;
    }

    const first=rows[0];
    const courseId=first.course_id||slugGolfCourse(first.course_name);
    const courseName=first.course_name;
    const holesCount=Math.max(...rows.map(r=>csvInt(r.hole_no)||0));
    const checkedDates=rows.map(r=>r.data_checked_date).filter(Boolean).sort();
    const checkedDate=checkedDates.at(-1)||"";

    golfCsvStatus(`Validerer ${courseName}…`,"loading");

    const course={
      id:courseId,
      name:courseName,
      country:first.country||"NO",
      location:first.location||null,
      holes:csvInt(first.course_holes)||holesCount||18,
      source_name:first.source_name||"CSV import",
      source_url:first.source_url||null,
      active:true,
      updated_at:new Date().toISOString()
    };

    const holeMap=new Map();
    const teeMap=new Map();
    const lengthMap=new Map();

    rows.forEach(r=>{
      const holeNo=csvInt(r.hole_no);
      const teeCode=String(r.tee_code);
      const hk=holeNo;
      const tk=teeCode;
      const lk=`${holeNo}:${teeCode}`;

      if(!holeMap.has(hk)){
        holeMap.set(hk,{
          course_id:courseId,
          hole_no:holeNo,
          par:csvInt(r.par),
          stroke_index:csvInt(r.stroke_index),
          green_lat:csvNum(r.green_lat),
          green_lon:csvNum(r.green_lon),
          notes:r.hole_notes||null,
          updated_at:new Date().toISOString()
        });
      }else{
        const h=holeMap.get(hk);
        if(h.green_lat==null&&csvNum(r.green_lat)!=null)h.green_lat=csvNum(r.green_lat);
        if(h.green_lon==null&&csvNum(r.green_lon)!=null)h.green_lon=csvNum(r.green_lon);
      }

      if(!teeMap.has(tk)){
        teeMap.set(tk,{
          course_id:courseId,
          tee_code:teeCode,
          tee_name:r.tee_name||teeCode,
          sort_order:csvInt(r.tee_sort_order)??100,
          total_length_m:csvInt(r.tee_total_length_m),
          active:true,
          notes:r.tee_notes||null
        });
      }

      lengthMap.set(lk,{
        course_id:courseId,
        hole_no:holeNo,
        tee_code:teeCode,
        length_m:csvInt(r.length_m)
      });
    });

    const holes=[...holeMap.values()].sort((a,b)=>a.hole_no-b.hole_no);
    const tees=[...teeMap.values()].sort((a,b)=>a.sort_order-b.sort_order);
    const lengths=[...lengthMap.values()];

    // Safety: verify each tee has a useful number of lengths.
    const coverage=tees.map(t=>({
      tee:t.tee_code,
      count:lengths.filter(x=>x.tee_code===t.tee_code&&x.length_m>0).length
    }));
    const low=coverage.filter(x=>x.count<Math.min(9,course.holes));
    if(low.length){
      golfCsvStatus(`Import stoppet: mangelfulle hullengder for ${low.map(x=>`${x.tee} (${x.count})`).join(", ")}.`,"warn");
      return;
    }

    let r=await sb.from("cr_golf_courses").upsert(course,{onConflict:"id"});
    if(r.error)throw r.error;

    r=await sb.from("cr_golf_holes").upsert(holes,{onConflict:"course_id,hole_no"});
    if(r.error)throw r.error;

    r=await sb.from("cr_golf_tees").upsert(tees,{onConflict:"course_id,tee_code"});
    if(r.error)throw r.error;

    r=await sb.from("cr_golf_hole_lengths").upsert(lengths,{onConflict:"course_id,hole_no,tee_code"});
    if(r.error)throw r.error;

    await loadGolfDbCourses();
    if(e.golfAdminCourseSelect){
      e.golfAdminCourseSelect.innerHTML=golfDbCourses.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
      e.golfAdminCourseSelect.value=courseId;
      golfAdminCourseId=courseId;
      await renderGolfCourseAdmin();
    }

    golfCsvStatus(
      `✅ Importert ${courseName}: ${holes.length} hull · ${tees.length} utslagssteder · ${lengths.length} hullengder${checkedDate?` · kontrollert ${checkedDate}`:""}.`,
      "ok"
    );
  }catch(err){
    console.error("Golf CSV import:",err);
    golfCsvStatus(`Import feilet: ${err?.message||err}`,"warn");
  }finally{
    if(e.golfImportCsvFile)e.golfImportCsvFile.value="";
  }
}

function downloadGolfCsvTemplate(){
  const header=[
    "course_id","course_name","country","location","course_holes",
    "source_name","source_url","data_checked_date",
    "hole_no","par","stroke_index",
    "tee_code","tee_name","tee_sort_order","tee_total_length_m","length_m",
    "green_lat","green_lon","hole_notes","tee_notes"
  ].join(",");

  const example=[
    "example-golfklubb","Example Golfklubb","NO","By, Fylke","18",
    "Klubbens offisielle baneguide","https://example.no/baneguide","2026-08-13",
    "1","4","7","57","57","30","5700","345","","","",""
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",");

  const blob=new Blob([header+"\n"+example+"\n"],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="CR-Workout_Golfbane_Mal.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function openGolfCourseAdmin(){
  showOnly("golfCourses");
  golfCsvStatus("Laster golfbaner…","loading");
  try{
    const courses=await loadGolfDbCourses();
    if(e.golfAdminCourseSelect){
      e.golfAdminCourseSelect.innerHTML=(courses||[]).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
    }
    if(courses?.length){
      golfAdminCourseId=courses[0].id;
      if(e.golfAdminCourseSelect)e.golfAdminCourseSelect.value=golfAdminCourseId;
      await renderGolfCourseAdmin();
    }
    golfCsvStatus("Velg en CSV-fil generert med CR-Workout-promten.","");
  }catch(err){
    console.error(err);
    golfCsvStatus("Kunne ikke laste golfbanesiden: "+(err?.message||err),"warn");
  }
}
async function renderGolfCourseAdmin(){
 const id=e.golfAdminCourseSelect.value||golfAdminCourseId;if(!id)return;golfAdminCourseId=id;
 const r=await loadGolfDbCourse(id);if(!r)return;
 e.golfAdminCourseMeta.textContent=`${r.course.name} · ${r.course.location||""} · ${r.course.holes} hull`;
 e.golfAdminTees.innerHTML=(r.tees||[]).length
   ?`<div class="golf-admin-tee-list"><strong>Utslagssteder:</strong> ${(r.tees||[]).map(t=>`<span>${esc(t.tee_name||t.tee_code)}${t.total_length_m?` · ${t.total_length_m} m`:""}</span>`).join("")}</div>`
   :'<div class="golf-course-status">Ingen dynamiske utslagssteder registrert.</div>';
 e.golfAdminHoles.innerHTML=r.holes.map(h=>`<div class="golf-admin-hole" data-hole="${h.hole_no}"><strong>Hull ${h.hole_no}</strong>
 ${[["par","Par"],["stroke_index","HCP"],["tee_39_m","Tee 39"],["tee_43_m","Tee 43"],["tee_48_m","Tee 48"],["tee_50_m","Tee 50"],["green_lat","Green lat"],["green_lon","Green lon"]].map(([f,l])=>`<label>${l}<input data-f="${f}" type="number" step="${f.includes("green")?"0.000001":"1"}" value="${h[f]??""}"></label>`).join("")}</div>`).join("");
}
async function saveGolfCourseAdmin(){
 const rows=[...e.golfAdminHoles.querySelectorAll(".golf-admin-hole")].map(c=>{const r={course_id:golfAdminCourseId,hole_no:Number(c.dataset.hole)};c.querySelectorAll("input").forEach(i=>r[i.dataset.f]=i.value===""?null:Number(i.value));return r});
 const {error}=await sb.from("cr_golf_holes").upsert(rows,{onConflict:"course_id,hole_no"});if(error)alert(error.message);else alert("Golfbanen er lagret.");
}
async function createGolfCourseAdmin(){
 const name=prompt("Navn på golfbanen:");if(!name?.trim())return;
 const id="course-"+Date.now();let r=await sb.from("cr_golf_courses").insert({id,name:name.trim(),holes:18,active:true});if(r.error){alert(r.error.message);return}
 r=await sb.from("cr_golf_holes").insert(Array.from({length:18},(_,i)=>({course_id:id,hole_no:i+1})));if(r.error){alert(r.error.message);return}
 await loadGolfDbCourses();e.golfAdminCourseSelect.innerHTML=golfDbCourses.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");e.golfAdminCourseSelect.value=id;golfAdminCourseId=id;await renderGolfCourseAdmin();
}

let golfSetupCourseData=null;
let golfCourseCandidates=[];

function setGolfCourseStatus(text,state=""){
  if(!e.golfCourseLookupStatus)return;
  e.golfCourseLookupStatus.textContent=text;
  e.golfCourseLookupStatus.dataset.state=state;
}

function courseCandidateLabel(c){
  const bits=[c.name,c.display_name].filter(Boolean);
  return [...new Set(bits)].join(" · ");
}

function renderGolfCourseCandidates(candidates){
  golfCourseCandidates=candidates||[];
  if(!golfCourseCandidates.length){
    e.golfCourseResultsWrap.classList.add("hidden");
    e.golfCourseResults.innerHTML="";
    return;
  }
  e.golfCourseResults.innerHTML=golfCourseCandidates.map((c,i)=>
    `<option value="${i}">${esc(courseCandidateLabel(c))}</option>`
  ).join("");
  e.golfCourseResultsWrap.classList.remove("hidden");
}

function elementCenter(el){
  if(Number.isFinite(Number(el.lat))&&Number.isFinite(Number(el.lon))){
    return {lat:Number(el.lat),lon:Number(el.lon)};
  }
  if(el.center&&Number.isFinite(Number(el.center.lat))&&Number.isFinite(Number(el.center.lon))){
    return {lat:Number(el.center.lat),lon:Number(el.center.lon)};
  }
  if(Array.isArray(el.geometry)&&el.geometry.length){
    const good=el.geometry.filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)));
    if(good.length){
      return {
        lat:good.reduce((s,p)=>s+Number(p.lat),0)/good.length,
        lon:good.reduce((s,p)=>s+Number(p.lon),0)/good.length
      };
    }
  }
  return null;
}

function golfHoleNumber(tags){
  const raw=tags?.ref||tags?.["ref:hole"]||tags?.hole||"";
  const m=String(raw).match(/\d+/);
  return m?Number(m[0]):null;
}

function parseGolfCourseOverpass(json,courseName,center){
  const elements=json?.elements||[];
  const holes=elements.filter(x=>x.tags?.golf==="hole");
  const pins=elements.filter(x=>x.tags?.golf==="pin")
    .map(x=>({...x,_center:elementCenter(x)}))
    .filter(x=>x._center);

  const parsed={name:courseName,center,source:"OpenStreetMap",holes:{}};

  holes.forEach(h=>{
    const number=golfHoleNumber(h.tags);
    if(!number)return;
    const geom=Array.isArray(h.geometry)?h.geometry.map(p=>({lat:Number(p.lat),lon:Number(p.lon)})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)):[];
    const endpoint=geom.length?geom[geom.length-1]:elementCenter(h);
    const tee=geom.length?geom[0]:null;

    let pin=endpoint||null;
    let pinSource=endpoint?"hole-end":"";
    if(endpoint&&pins.length){
      let best=null,bestD=Infinity;
      pins.forEach(p=>{
        const d=haversineMeters(endpoint,p._center);
        if(d<bestD){bestD=d;best=p}
      });
      if(best&&bestD<=120){
        pin=best._center;
        pinSource="golf=pin";
      }
    }

    parsed.holes[number]={
      number,
      par:h.tags?.par?Number(h.tags.par)||h.tags.par:null,
      name:h.tags?.name||null,
      tee,
      pin,
      pinSource,
      geometry:geom
    };
  });

  return parsed;
}

async function fetchGolfCourseDetails(candidate){
  const lat=Number(candidate.lat),lon=Number(candidate.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error("Mangler koordinater for banen.");

  setGolfCourseStatus("Henter hull, par og flaggplasseringer…","loading");

  const query=`[out:json][timeout:25];
(
  nwr(around:2500,${lat},${lon})["leisure"="golf_course"];
  way(around:2500,${lat},${lon})["golf"="hole"];
  node(around:2500,${lat},${lon})["golf"="pin"];
);
out tags center geom;`;

  const res=await fetch("https://overpass-api.de/api/interpreter",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
    body:"data="+encodeURIComponent(query)
  });
  if(!res.ok)throw new Error(`Overpass ${res.status}`);
  const json=await res.json();
  const data=parseGolfCourseOverpass(json,candidate.name||e.golfSetupCourse.value,{lat,lon});

  const holeCount=Object.keys(data.holes).length;
  const parCount=Object.values(data.holes).filter(h=>h.par!=null).length;
  const pinCount=Object.values(data.holes).filter(h=>h.pin).length;

  golfSetupCourseData=data;
  if(candidate.name)e.golfSetupCourse.value=candidate.name;
  setGolfCourseStatus(
    holeCount
      ?`Fant ${holeCount} hull · par på ${parCount} · flagg/greenposisjon på ${pinCount}.`
      :"Fant banen, men ingen detaljerte hull i OpenStreetMap.",
    holeCount?"ok":"warn"
  );
  return data;
}

async function searchGolfCourseByName(){
  const q=e.golfSetupCourse.value.trim();
  if(!q){alert("Skriv inn navnet på golfbanen.");return}
  golfSetupCourseData=null;
  setGolfCourseStatus("Søker etter golfbanen…","loading");
  renderGolfCourseCandidates([]);

  try{
    const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(q+" golf")}`;
    const res=await fetch(url,{headers:{"Accept":"application/json"}});
    if(!res.ok)throw new Error(`Nominatim ${res.status}`);
    const rows=await res.json();
    const candidates=(rows||[]).map(r=>({
      name:String(r.name||r.display_name||q).split(",")[0],
      display_name:r.display_name,
      lat:Number(r.lat),
      lon:Number(r.lon)
    })).filter(c=>Number.isFinite(c.lat)&&Number.isFinite(c.lon));

    renderGolfCourseCandidates(candidates);
    if(!candidates.length){
      setGolfCourseStatus("Fant ingen bane. Du kan fortsatt starte runden uten banedata.","warn");
      return;
    }
    await fetchGolfCourseDetails(candidates[0]);
  }catch(err){
    console.warn("Golfbanesøk:",err);
    setGolfCourseStatus("Kunne ikke hente banedata. Runden kan fortsatt startes uten kartdata.","warn");
  }
}

async function findNearbyGolfCourses(){
  if(!navigator.geolocation){alert("GPS støttes ikke i denne nettleseren.");return}
  golfSetupCourseData=null;
  setGolfCourseStatus("Finner posisjonen din…","loading");
  renderGolfCourseCandidates([]);

  navigator.geolocation.getCurrentPosition(async pos=>{
    const lat=pos.coords.latitude,lon=pos.coords.longitude;
    try{
      setGolfCourseStatus("Søker etter golfbaner i nærheten…","loading");
      const query=`[out:json][timeout:20];
nwr(around:12000,${lat},${lon})["leisure"="golf_course"];
out tags center;`;
      const res=await fetch("https://overpass-api.de/api/interpreter",{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
        body:"data="+encodeURIComponent(query)
      });
      if(!res.ok)throw new Error(`Overpass ${res.status}`);
      const json=await res.json();
      const candidates=(json.elements||[]).map(el=>{
        const c=elementCenter(el);
        if(!c)return null;
        return {
          name:el.tags?.name||"Golfbane",
          display_name:el.tags?.name||"Golfbane",
          lat:c.lat,lon:c.lon,
          distance:haversineMeters({lat,lon},c)
        };
      }).filter(Boolean).sort((a,b)=>a.distance-b.distance).slice(0,8);

      renderGolfCourseCandidates(candidates);
      if(!candidates.length){
        setGolfCourseStatus("Fant ingen kartlagt golfbane i nærheten.","warn");
        return;
      }
      await fetchGolfCourseDetails(candidates[0]);
    }catch(err){
      console.warn(err);
      setGolfCourseStatus("Kunne ikke hente golfbaner i nærheten.","warn");
    }
  },err=>{
    setGolfCourseStatus(err.code===1?"GPS-tilgang ble ikke gitt.":"Kunne ikke finne posisjonen.","warn");
  },{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
}

async function selectGolfCourseCandidate(){
  const c=golfCourseCandidates[Number(e.golfCourseResults.value)];
  if(!c)return;
  try{await fetchGolfCourseDetails(c)}
  catch(err){
    console.warn(err);
    setGolfCourseStatus("Fant banen, men kunne ikke hente hulldata.","warn");
  }
}


function normalizeGolfTee(value){
  const raw=String(value??"").trim();
  if(raw)return raw;
  const first=golfState?.courseData?.tees?.[0]?.code;
  return first?String(first):"";
}


function golfCourseHasLengthData(courseData,teeCode=""){
  if(!courseData?.holes)return false;
  const tee=String(teeCode||"");
  return Object.values(courseData.holes).some(h=>{
    if(!h?.lengths)return false;
    if(tee)return Number(h.lengths?.[tee])>0;
    return Object.values(h.lengths).some(v=>Number(v)>0);
  });
}

async function refreshGolfCourseDataForActiveRound(){
  const courseId=golfState?.courseData?.courseId
    || golfSetupCourseData?.courseId
    || golfDbCourses.find(c=>String(c.name||"").trim().toLowerCase()===String(golfState?.course||activeSession?.golf_course||"").trim().toLowerCase())?.id
    || null;

  let result=null;
  if(courseId)result=await loadGolfDbCourse(courseId);
  if(!result){
    const name=golfState?.course||activeSession?.golf_course||"";
    await loadGolfDbCourses();
    const c=golfDbCourses.find(x=>String(x.name||"").trim().toLowerCase()===String(name).trim().toLowerCase());
    if(c)result=await loadGolfDbCourse(c.id);
  }
  if(!result)return null;

  const fresh=dbCourseToGolfData(result.course,result.holes,result.tees,result.lengths);
  golfState.courseData=fresh;
  activeSession.golf_course_data=fresh;
  saveGolfState();

  try{
    await sb.from("cr_workout_sessions")
      .update({golf_course_data:fresh})
      .eq("id",activeSession.id);
  }catch(err){console.warn("Kunne ikke oppdatere golf_course_data:",err)}

  return fresh;
}

function golfHoleLength(holeNo){
  const h=golfHoleData(holeNo);
  if(!h)return null;
  const tee=String(normalizeGolfTee(golfState?.tee||activeSession?.golf_tee||""));
  if(!tee)return null;

  const candidates=[
    h.lengths?.[tee],
    h.lengths?.[String(Number(tee))],
    h[`tee_${tee}_m`]
  ];
  for(const val of candidates){
    const n=Number(val);
    if(Number.isFinite(n)&&n>0)return n;
  }
  return null;
}

function golfHoleData(holeNo){
  return golfState?.courseData?.holes?.[holeNo]||golfState?.courseData?.holes?.[String(holeNo)]||null;
}

function golfDistanceToPin(holeNo){
  const h=golfHoleData(holeNo);
  const here=golfState?.lastPoint;
  if(!h?.pin||!here)return null;
  return haversineMeters(here,h.pin);
}

function golfStorageKey(){return activeSession?`cr_golf_${activeSession.id}`:""}
function saveGolfState(){if(activeSession&&golfState)localStorage.setItem(golfStorageKey(),JSON.stringify(golfState))}
function loadGolfState(){try{return JSON.parse(localStorage.getItem(golfStorageKey())||"null")}catch{return null}}
function clearGolfState(){if(activeSession)localStorage.removeItem(golfStorageKey())}

function buildGolfHoleQueue(count,startHole){
  const holes=[];
  const n=Math.max(1,Math.min(18,Number(count)||18));
  const start=Math.max(1,Math.min(18,Number(startHole)||1));
  for(let i=0;i<n;i++)holes.push(((start-1+i)%18)+1);
  return holes;
}

function populateGolfStartHoles(){
  const selected=Number(e.golfSetupStartHole?.value)||1;
  if(!e.golfSetupStartHole)return;
  e.golfSetupStartHole.innerHTML=Array.from({length:18},(_,i)=>`<option value="${i+1}">Hull ${i+1}</option>`).join("");
  e.golfSetupStartHole.value=String(Math.min(18,Math.max(1,selected)));
}

async function openGolfSetup(){
  golfSetupCourseData=null;
  await loadGolfDbCourses();
  if(golfDbCourses.length===1 && e.golfSavedCourseSelect){
    e.golfSavedCourseSelect.value=golfDbCourses[0].id;
    const r=await loadGolfDbCourse(golfDbCourses[0].id);
    if(r){
      e.golfSetupCourse.value=r.course.name;
      e.golfSetupHoles.value=String(r.course.holes||18);
      golfSetupCourseData=dbCourseToGolfData(r.course,r.holes,r.tees,r.lengths);
      populateGolfTeeOptions(golfSetupCourseData);
    }
  }
  golfCourseCandidates=[];
  populateGolfStartHoles();
  if(!golfSetupCourseData)e.golfSetupCourse.value="";
  if(!golfSetupCourseData)e.golfSetupHoles.value="18";
  e.golfSetupStartHole.value="1";
  if(!golfSetupCourseData)populateGolfTeeOptions(null);
  renderGolfCourseCandidates([]);
  if(golfSetupCourseData){
    const count=Object.keys(golfSetupCourseData.holes||{}).length;
    setGolfCourseStatus(`Lagret banedata klar: ${count} hull.`,"ok");
  }else{
    setGolfCourseStatus("Du kan starte uten kartdata, eller la appen forsøke å hente hull, par og flagg fra OpenStreetMap.");
  }
  openModal(e.golfSetupModal);
}

async function createGolfSession(){
  if(activeSession)return;
  const course=e.golfSetupCourse.value.trim()||"Golf";
  const holes=Number(e.golfSetupHoles.value)||18;
  const startHole=Number(e.golfSetupStartHole.value)||1;
  const tee=normalizeGolfTee(e.golfSetupTee.value);
  if(!tee){alert("Velg utslagssted.");return}
  const p=programs.find(x=>x.id==="golf");

  if(!golfSetupCourseData){
    golfSetupCourseData=await resolveGolfCourseDataFromDb(course);
  }

  if(golfSetupCourseData && !golfCourseHasLengthData(golfSetupCourseData,tee)){
    const result=await loadGolfDbCourse(golfSetupCourseData.courseId);
    if(result)golfSetupCourseData=dbCourseToGolfData(result.course,result.holes,result.tees,result.lengths);
  }

  const {data,error}=await sb.from("cr_workout_sessions").insert({
    athlete_id:user.id,
    program_id:"golf",
    program_name:p?.name||"Golf",
    status:"started",
    started_at:new Date().toISOString(),
    golf_course:course,
    golf_holes:holes,
    golf_start_hole:startHole,
    golf_tee:tee,
    golf_course_data:golfSetupCourseData
  }).select().single();

  if(error){alert(error.message);return}

  activeSession=data;
  golfState={
    course,
    holes,
    startHole,
    tee,
    queue:buildGolfHoleQueue(holes,startHole),
    completed:[],
    skipped:[],
    distanceMeters:0,
    track:[],
    lastPoint:null,
    pointCount:0,
    courseData:golfSetupCourseData,
    viewIndex:null
  };
  saveGolfState();
  closeModal(e.golfSetupModal);
  requestWakeLock().catch(()=>{});
  await launchRunner();
}

function stopGolfGeolocation(){
  if(golfWatchId!==null){
    navigator.geolocation?.clearWatch(golfWatchId);
    golfWatchId=null;
  }
}

function updateGolfGpsStatus(accuracy){
  if(!e.golfGpsStatus)return;
  if(!Number.isFinite(Number(accuracy))){e.golfGpsStatus.textContent="Søker…";return}
  const a=Math.round(Number(accuracy));
  e.golfGpsStatus.textContent=`Aktiv · ±${a} m`;
}

function handleGolfPosition(pos){
  if(!golfState)return;
  const c=pos.coords;
  const p={lat:c.latitude,lon:c.longitude,accuracy:c.accuracy,ts:pos.timestamp};
  const prev=golfState.lastPoint;
  updateGolfGpsStatus(c.accuracy);

  let accept=(p.accuracy||999)<=50;
  if(prev){
    const dt=(p.ts-prev.ts)/1000;
    const dist=haversineMeters(prev,p);
    const speed=dt>0?(dist/dt)*3.6:0;
    const good=Math.max(p.accuracy||999,prev.accuracy||999)<=50;
    if(good&&dist>=2&&speed<=18)golfState.distanceMeters+=dist;
    if(speed>25)accept=false;
  }

  if(accept){
    golfState.track.push({lat:p.lat,lon:p.lon,accuracy:p.accuracy,ts:p.ts});
  }

  golfState.lastPoint=p;
  golfState.pointCount=(golfState.pointCount||0)+1;
  saveGolfState();
  renderGolf();

  if(golfState.track.length===1 || golfState.track.length%10===0){
    publishLiveWorkout(true);
  }
}

function startGolfGeolocation(){
  if(!navigator.geolocation){
    e.golfGpsStatus.textContent="Ikke støttet";
    return;
  }
  stopGolfGeolocation();
  e.golfGpsStatus.textContent="Søker…";
  golfWatchId=navigator.geolocation.watchPosition(
    handleGolfPosition,
    err=>{
      console.warn("Golf GPS:",err);
      e.golfGpsStatus.textContent=err.code===1?"Ingen tilgang":"GPS-feil";
    },
    {enableHighAccuracy:true,maximumAge:2000,timeout:15000}
  );
}

function golfTotalStrokes(){
  return (golfState?.completed||[]).reduce((sum,x)=>sum+(Number(x.strokes)||0),0);
}

function golfProcessedCount(){
  return (golfState?.completed?.length||0)+(golfState?.skipped?.length||0);
}



let golfInlineLeafletMap=null,golfInlineTrackLayer=null,golfInlinePlayerMarker=null,golfInlinePinMarker=null,golfInlineDistanceLine=null;
let golfSwipePage=0,golfSwipeBound=false;

function destroyGolfInlineMap(){
  try{if(golfInlineLeafletMap){golfInlineLeafletMap.remove();golfInlineLeafletMap=null;golfInlineTrackLayer=golfInlinePlayerMarker=golfInlinePinMarker=golfInlineDistanceLine=null}}catch(err){console.warn(err)}
}
function updateGolfSwipeDots(){
  e.golfSwipeDots?.querySelectorAll("button").forEach(b=>b.classList.toggle("active",Number(b.dataset.page)===golfSwipePage));
}
function golfSetSwipePage(page,behavior="smooth"){
  const p=Math.max(0,Math.min(2,Number(page)||0)),target=e.golfSwipe?.querySelector(`[data-golf-page="${p}"]`);
  if(!target)return;golfSwipePage=p;target.scrollIntoView({behavior,block:"nearest",inline:"start"});updateGolfSwipeDots();
  if(p===2)setTimeout(()=>renderGolfInlineMap(true),100);
}
function bindGolfSwipe(){
  if(golfSwipeBound||!e.golfSwipe)return;golfSwipeBound=true;
  e.golfSwipe.addEventListener("scroll",()=>{const p=Math.round(e.golfSwipe.scrollLeft/Math.max(1,e.golfSwipe.clientWidth));if(p!==golfSwipePage){golfSwipePage=Math.max(0,Math.min(2,p));updateGolfSwipeDots();if(golfSwipePage===2)setTimeout(()=>renderGolfInlineMap(true),80)}},{passive:true});
  e.golfSwipeDots?.querySelectorAll("button").forEach(b=>b.onclick=()=>golfSetSwipePage(Number(b.dataset.page)));
}
function golfCurrentShownHole(){const v=golfViewedEntry();return v?.hole??golfState?.queue?.[0]??null}
function renderGolfInlineMap(forceFit=false){
  if(!golfState||!e.golfInlineMap)return;
  const hole=golfCurrentShownHole(),hd=hole?golfHoleData(hole):null;
  const here=golfState.lastPoint&&Number.isFinite(Number(golfState.lastPoint.lat))?{lat:Number(golfState.lastPoint.lat),lon:Number(golfState.lastPoint.lon)}:null;
  const pin=hd?.pin&&Number.isFinite(Number(hd.pin.lat))?{lat:Number(hd.pin.lat),lon:Number(hd.pin.lon)}:null;
  const dist=here&&pin?haversineMeters(here,pin):null;
  const mapLength=hole?golfHoleLength(hole):null;
  e.golfMapHoleTitle.textContent=hole?`Hull ${hole}${hd?.par?` · Par ${hd.par}`:""}${mapLength?` · ${mapLength} m`:""}`:"Golf";
  e.golfMapCourseTitle.textContent=golfState.course||"";e.golfMapDistance.textContent=dist!=null?`${Math.round(dist)} m`:"–";
  if(!window.L){e.golfInlineMap.innerHTML='<div class="route-map-empty">Kartbiblioteket kunne ikke lastes.</div>';return}
  if(!golfInlineLeafletMap){e.golfInlineMap.innerHTML="";golfInlineLeafletMap=L.map(e.golfInlineMap,{zoomControl:true,attributionControl:false});L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(golfInlineLeafletMap)}
  const track=(golfState.track||[]).filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon))).map(p=>[Number(p.lat),Number(p.lon)]);
  if(golfInlineTrackLayer){golfInlineTrackLayer.remove();golfInlineTrackLayer=null} if(track.length>1)golfInlineTrackLayer=L.polyline(track,{weight:4,opacity:.75}).addTo(golfInlineLeafletMap);
  if(golfInlinePlayerMarker){golfInlinePlayerMarker.remove();golfInlinePlayerMarker=null} if(here)golfInlinePlayerMarker=L.circleMarker([here.lat,here.lon],{radius:8,weight:3,fillOpacity:1}).bindTooltip("Din posisjon").addTo(golfInlineLeafletMap);
  if(golfInlinePinMarker){golfInlinePinMarker.remove();golfInlinePinMarker=null} if(pin)golfInlinePinMarker=L.circleMarker([pin.lat,pin.lon],{radius:9,weight:3,fillOpacity:1}).bindTooltip("⛳ Green").addTo(golfInlineLeafletMap);
  if(golfInlineDistanceLine){golfInlineDistanceLine.remove();golfInlineDistanceLine=null} if(here&&pin)golfInlineDistanceLine=L.polyline([[here.lat,here.lon],[pin.lat,pin.lon]],{weight:3,opacity:.75,dashArray:"8 7"}).addTo(golfInlineLeafletMap);
  const bounds=[];if(here)bounds.push([here.lat,here.lon]);if(pin)bounds.push([pin.lat,pin.lon]);if(track.length)bounds.push(...track.slice(-120));
  if(forceFit&&bounds.length){bounds.length===1?golfInlineLeafletMap.setView(bounds[0],17):golfInlineLeafletMap.fitBounds(bounds,{padding:[28,28],maxZoom:17})}
  setTimeout(()=>golfInlineLeafletMap?.invalidateSize(),50);
  e.golfInlineMapMessage.textContent=!here&&!pin?"Venter på GPS. Green er ikke kartlagt for dette hullet.":!here?"Green er kjent. Venter på GPS-posisjon.":!pin?"Din posisjon vises. Green-koordinat mangler for dette hullet.":`Luftlinje til green: ${Math.round(dist)} m`;
}

function golfHistoryEntries(){
  const completed=(golfState?.completed||[]).map(x=>({
    type:"completed",hole:Number(x.hole),record:x,
    at:new Date(x.completed_at||0).getTime()
  }));
  const skipped=(golfState?.skipped||[]).map(x=>({
    type:"skipped",hole:Number(x.hole),record:x,
    at:new Date(x.skipped_at||0).getTime()
  }));
  return completed.concat(skipped).sort((a,b)=>a.at-b.at);
}

function golfBrowseEntries(){
  const history=golfHistoryEntries();
  const current=golfState?.queue?.length
    ?[{type:"current",hole:Number(golfState.queue[0]),record:null,at:Infinity}]
    :[];
  return history.concat(current);
}

function golfEnsureViewIndex(){
  const entries=golfBrowseEntries();
  if(!entries.length){golfState.viewIndex=null;return null}
  const currentIndex=entries.findIndex(x=>x.type==="current");
  if(golfState.viewIndex==null || golfState.viewIndex<0 || golfState.viewIndex>=entries.length){
    golfState.viewIndex=currentIndex>=0?currentIndex:entries.length-1;
  }
  return entries;
}

function golfViewedEntry(){
  const entries=golfEnsureViewIndex();
  return entries?.[golfState.viewIndex]||null;
}

function golfPrevious(){
  const entries=golfEnsureViewIndex();
  if(!entries?.length)return;
  golfState.viewIndex=Math.max(0,(golfState.viewIndex??0)-1);
  renderGolf();
}

function golfNext(){
  const entries=golfEnsureViewIndex();
  if(!entries?.length)return;
  golfState.viewIndex=Math.min(entries.length-1,(golfState.viewIndex??0)+1);
  renderGolf();
}

function golfResetViewToCurrent(){
  golfState.viewIndex=null;
  golfEnsureViewIndex();
}

function golfSaveHistoricalEdit(entry){
  if(entry?.type!=="completed")return;
  const strokes=Math.max(1,Math.min(30,Number(e.golfStrokesInput.value)||0));
  if(!strokes){alert("Angi antall slag.");return}
  entry.record.strokes=strokes;
  entry.record.edited_at=new Date().toISOString();
  saveGolfState();
  publishLiveWorkout(true);
  renderGolf();
}

function renderGolf(){
  if(!activeSession||!golfState)return;

  const viewed=golfViewedEntry();
  const activeHole=golfState.queue?.[0]??null;
  const shownHole=viewed?.hole??activeHole;
  const nextActive=golfState.queue?.[1];
  const processed=golfProcessedCount();
  const total=Number(golfState.holes)||18;
  const pct=Math.min(100,(processed/Math.max(1,total))*100);
  const km=(Number(golfState.distanceMeters)||0)/1000;
  const holeData=shownHole?golfHoleData(shownHole):null;
  const pinDist=shownHole?golfDistanceToPin(shownHole):null;

  e.golfCourseName.textContent=golfState.course||"Golf";
  const tee=normalizeGolfTee(golfState.tee||"");
  const holeLength=shownHole?golfHoleLength(shownHole):null;
  e.golfRoundMeta.textContent=`${total} hull · start hull ${golfState.startHole} · Tee ${tee}${golfState.courseData?.source?` · ${golfState.courseData.source}`:""}`;
  e.golfElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at));
  e.golfProgressText.textContent=activeHole?`Spilt ${processed} av ${total} hull`:`Runden er ferdig`;
  e.golfTotalStrokes.textContent=`${golfTotalStrokes()} slag`;
  e.golfProgressBar.style.width=`${pct}%`;
  e.golfDistance.textContent=`${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km`;
  e.golfTrackCount.textContent=`${golfState.track?.length||0} punkter`;

  const entries=golfBrowseEntries();
  const idx=golfState.viewIndex??Math.max(0,entries.length-1);
  e.golfPreviousBtn.disabled=!entries.length||idx<=0;
  e.golfNextBtn.disabled=!entries.length||idx>=entries.length-1;
  e.golfHistoryLabel.textContent=viewed?.type==="current"?"Aktuelt hull":viewed?.type==="completed"?"Tidligere hull":"Skippet hull";

  e.golfOverviewHole.textContent=shownHole?`Hull ${shownHole}`:"Ferdig";
  e.golfOverviewPar.textContent=holeData?.par?`Par ${holeData.par}`:"Par –";
  e.golfOverviewLength.textContent=holeLength?` · ${holeLength} m · Tee ${tee}`:` · Tee ${tee}`;
  e.golfCurrentHole.textContent=shownHole?`Hull ${shownHole}`:"Ferdig";
  e.golfPar.textContent=holeData?.par?`Par ${holeData.par}`:"Par –";
  e.golfHoleLength.textContent=holeLength?`${holeLength} m · Tee ${tee}`:`Lengde – · Tee ${tee}`;
  e.golfPinDistance.textContent=pinDist!=null
    ?`Flagg: ${Math.round(pinDist)} m`
    :(holeData?.pin?"Flagg: venter på GPS":"Flagg: ikke kartlagt");

  if(viewed?.type==="completed"){
    e.golfHoleStatus.textContent="Tidligere fullført hull – du kan endre antall slag.";
    e.golfStrokesInput.value=String(viewed.record.strokes||4);
    e.golfStrokesInput.disabled=false;
    e.golfCompleteBtn.disabled=false;
    e.golfCompleteBtn.textContent="💾 Lagre endring";
    e.golfSkipBtn.disabled=true;
    e.golfPostponeBtn.disabled=true;
  }else if(viewed?.type==="skipped"){
    e.golfHoleStatus.textContent="Dette hullet ble skippet.";
    e.golfStrokesInput.disabled=true;
    e.golfCompleteBtn.disabled=true;
    e.golfCompleteBtn.textContent="✓ Fullført hull";
    e.golfSkipBtn.disabled=true;
    e.golfPostponeBtn.disabled=true;
  }else if(viewed?.type==="current"){
    e.golfHoleStatus.textContent=holeData?.name
      ?`${holeData.name} · registrer slag når hullet er ferdig.`
      :"Registrer antall slag når hullet er ferdig.";
    e.golfStrokesInput.disabled=false;
    if(document.activeElement!==e.golfStrokesInput && !e.golfStrokesInput.value)e.golfStrokesInput.value="4";
    e.golfCompleteBtn.disabled=false;
    e.golfCompleteBtn.textContent="✓ Fullført hull";
    e.golfSkipBtn.disabled=false;
    e.golfPostponeBtn.disabled=false;
  }else{
    e.golfHoleStatus.textContent="Alle hull er behandlet.";
    e.golfStrokesInput.disabled=true;
    e.golfCompleteBtn.disabled=true;
    e.golfSkipBtn.disabled=true;
    e.golfPostponeBtn.disabled=true;
  }

  e.golfNextHole.textContent=nextActive?`Hull ${nextActive}`:"Ingen flere hull";
  const nextData=nextActive?golfHoleData(nextActive):null;
  const nextLength=nextActive?golfHoleLength(nextActive):null;
  e.golfNextMeta.textContent=nextActive
    ?[nextData?.par?`Par ${nextData.par}`:null,nextLength?`${nextLength} m`:null,`Tee ${tee}`,nextData?.pin?"flagg kartlagt":null].filter(Boolean).join(" · ")
    :"";

  if(golfSwipePage===2)renderGolfInlineMap(false);
  if(!activeHole){stopGolfGeolocation();openGolfFinish();}
}

async function startGolfRunner(){
  requestWakeLock().catch(()=>{});
  golfState=loadGolfState()||{
    course:activeSession.golf_course||"Golf",
    holes:activeSession.golf_holes||18,
    startHole:activeSession.golf_start_hole||1,
    tee:normalizeGolfTee(activeSession.golf_tee||""),
    queue:buildGolfHoleQueue(activeSession.golf_holes||18,activeSession.golf_start_hole||1),
    completed:[],
    skipped:[],
    distanceMeters:0,
    track:[],
    lastPoint:null,
    pointCount:0,
    courseData:activeSession.golf_course_data||null,
    viewIndex:null
  };

  if(!golfState.tee)golfState.tee=normalizeGolfTee(activeSession.golf_tee||golfState.courseData?.tees?.[0]?.code||"");
  if(!golfState.courseData&&activeSession.golf_course_data)golfState.courseData=activeSession.golf_course_data;
  if(!golfState.courseData){
    golfState.courseData=await resolveGolfCourseDataFromDb(golfState.course||activeSession.golf_course||"");
    if(golfState.courseData){
      activeSession.golf_course_data=golfState.courseData;
      saveGolfState();
      try{
        await sb.from("cr_workout_sessions")
          .update({golf_course_data:golfState.courseData})
          .eq("id",activeSession.id);
      }catch(err){console.warn("Kunne ikke lagre banedata på aktiv golfrunde:",err)}
    }
  }
  const activeTee=normalizeGolfTee(golfState.tee||activeSession.golf_tee||"");
  if(activeTee && !golfCourseHasLengthData(golfState.courseData,activeTee)){
    await refreshGolfCourseDataForActiveRound();
  }

  if(!Array.isArray(golfState.queue))golfState.queue=[];
  if(!Array.isArray(golfState.completed))golfState.completed=[];
  if(!Array.isArray(golfState.skipped))golfState.skipped=[];
  if(!Array.isArray(golfState.track))golfState.track=[];

  bindGolfSwipe();
  golfSwipePage=1;
  renderGolf();
  setTimeout(()=>golfSetSwipePage(1,"auto"),30);
  stopRunnerTick();
  runnerTimer=setInterval(renderGolf,500);
  startGolfGeolocation();
}

function changeGolfStrokes(delta){
  const v=Math.max(1,Math.min(30,(Number(e.golfStrokesInput.value)||1)+delta));
  e.golfStrokesInput.value=String(v);
}

function golfCompleteHole(){
  const viewed=golfViewedEntry();
  if(viewed?.type==="completed"){golfSaveHistoricalEdit(viewed);return}
  if(viewed?.type!=="current"||!golfState?.queue?.length)return;

  const strokes=Math.max(1,Math.min(30,Number(e.golfStrokesInput.value)||0));
  if(!strokes){alert("Angi antall slag.");return}
  const hole=golfState.queue.shift();
  const previousDistance=golfState.completed.length
    ? Number(golfState.completed[golfState.completed.length-1].cumulative_distance_meters)||0
    : 0;

  golfState.completed.push({
    hole,
    strokes,
    par:golfHoleData(hole)?.par??null,
    tee:normalizeGolfTee(golfState.tee||""),
    hole_length_m:golfHoleLength(hole),
    completed_at:new Date().toISOString(),
    cumulative_distance_meters:Number(golfState.distanceMeters)||0,
    hole_walk_distance_meters:Math.max(0,(Number(golfState.distanceMeters)||0)-previousDistance)
  });

  e.golfStrokesInput.value="4";
  golfResetViewToCurrent();
  saveGolfState();
  publishLiveWorkout(true);
  renderGolf();
}

function golfSkipHole(){
  if(!golfState?.queue?.length)return;
  const hole=golfState.queue.shift();
  golfState.skipped.push({hole,skipped_at:new Date().toISOString()});
  golfResetViewToCurrent();
  saveGolfState();
  publishLiveWorkout(true);
  renderGolf();
}

function golfPostponeHole(){
  if(!golfState?.queue?.length)return;
  if(golfState.queue.length===1){alert("Dette er siste gjenstående hull.");return}
  golfState.queue.push(golfState.queue.shift());
  golfResetViewToCurrent();
  saveGolfState();
  publishLiveWorkout(true);
  renderGolf();
}

function openGolfCurrentMap(){
  const track=Array.isArray(golfState?.track)?golfState.track:[];
  const viewed=golfViewedEntry();
  const hole=viewed?.hole??golfState?.queue?.[0];
  const hd=hole?golfHoleData(hole):null;
  openRouteMap({
    program_name:`${golfState?.course||"Golf"} · Hull ${hole||""}`,
    gps_track:track,
    distance_meters:Number(golfState?.distanceMeters)||0,
    duration_seconds:elapsed(activeSession.started_at),
    golf_pin:hd?.pin||null,
    golf_hole_geometry:hd?.geometry||[],
    golf_par:hd?.par||null
  });
}

function openGolfFinish(){
  if(!activeSession||!golfState||!e.finishModal.classList.contains("hidden"))return;
  stopGolfGeolocation();
  activeSession._golfDuration=elapsed(activeSession.started_at);
  activeSession._golfDistance=Number(golfState.distanceMeters)||0;
  activeSession._golfTrack=Array.isArray(golfState.track)?golfState.track:[];
  activeSession._golfScorecard={
    course:golfState.course,
    holes:golfState.holes,
    start_hole:golfState.startHole,
    tee:normalizeGolfTee(golfState.tee||""),
    completed:golfState.completed,
    skipped:golfState.skipped,
    total_strokes:golfTotalStrokes(),
    course_data:golfState.courseData||null
  };

  e.finishSummary.textContent=`${golfState.course} · Tee ${normalizeGolfTee(golfState.tee||"")} · ${golfState.completed.length}/${golfState.holes} hull · ${golfTotalStrokes()} slag · ${fmtElapsed(activeSession._golfDuration)}`;
  finishRating=4;
  e.finishComment.value="";
  if(e.finishDistanceWrap)e.finishDistanceWrap.classList.add("hidden");
  renderStars();
  openModal(e.finishModal);
}

async function loadCoachData(){
  if(e.coachLiveSection)e.coachLiveSection.classList.remove("hidden");
await loadPrograms();const {data:links}=await sb.from("cr_coach_athletes").select("athlete_id,status,cr_profiles!cr_coach_athletes_athlete_id_fkey(*)").eq("coach_id",user.id).order("created_at");athletes=(links||[]).map(x=>({...x.cr_profiles,link_status:x.status}));const ids=athletes.map(a=>a.id);e.pendingCount.textContent=athletes.filter(a=>!a.approved).length;e.activeAthletesCount.textContent=athletes.filter(a=>a.approved).length;let today=0;if(ids.length){const from=new Date();from.setHours(0,0,0,0);const {count}=await sb.from("cr_workout_sessions").select("*",{count:"exact",head:true}).in("athlete_id",ids).gte("started_at",from.toISOString());today=count||0}e.sessionsTodayCount.textContent=today;renderAthletes();fillAthleteSelectors()}
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
const realtimeNoticeKeys=new Set();

function startRealtime(){
  if(realtimeChannel)sb.removeChannel(realtimeChannel);
  realtimeChannel=sb.channel("cr-workout-coach-v3")
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"cr_workout_sessions"},
      p=>handleRealtime("INSERT",p.new))
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"cr_workout_sessions"},
      p=>handleRealtime("UPDATE",p.new))
    .subscribe();
}

function handleRealtime(eventType,row){
  if(!athletes.some(a=>a.id===row.athlete_id))return;
  if(row.status==="cancelled")return;

  const isStart=eventType==="INSERT"&&row.status==="started";
  const isCompleted=eventType==="UPDATE"&&row.status==="completed";
  if(!isStart&&!isCompleted)return;

  const key=`${row.id}:${isCompleted?"completed":"started"}`;
  if(realtimeNoticeKeys.has(key))return;
  realtimeNoticeKeys.add(key);

  const a=athletes.find(x=>x.id===row.athlete_id);
  const div=document.createElement("div");
  div.className="notification-item";
  div.innerHTML=`<strong>${isCompleted?"✅":"🟢"} ${esc(a.full_name||a.email)} ${isCompleted?"fullførte":"startet"} ${esc(row.program_name)}</strong>
    <small>${isCompleted&&row.rating?`Rating ${"★".repeat(row.rating)} · `:""}${fmtDate(isCompleted?row.completed_at:row.started_at)}</small>`;

  if(e.notificationFeed.querySelector(".empty"))e.notificationFeed.innerHTML="";
  e.notificationFeed.prepend(div);

  // Live-listen håndteres separat av polling; ingen full dashboard-reload her.
  if(isCompleted)loadCoachLiveSessions();
}

function fillAthleteSelectors(){const opts=[`<option value="">Alle utøvere</option>`,...athletes.filter(a=>a.approved).map(a=>`<option value="${a.id}">${esc(a.full_name||a.email)}</option>`)].join("");e.calendarAthleteSelect.innerHTML=opts;e.statsAthleteSelect.innerHTML=opts}
async function sessionsForView(selected=""){if(profile?.role==="coach"){const ids=selected?[selected]:athletes.filter(a=>a.approved).map(a=>a.id);if(!ids.length)return[];const {data}=await sb.from("cr_workout_sessions").select("*").in("athlete_id",ids).order("started_at",{ascending:false});return data||[]}const {data}=await sb.from("cr_workout_sessions").select("*").eq("athlete_id",user.id).order("started_at",{ascending:false});return data||[]}

let routeLeafletMap=null;
let routeLeafletLayer=null;

function normalizeGpsTrack(track){
  if(!Array.isArray(track))return [];
  return track.map(p=>({
    lat:Number(p.lat),
    lon:Number(p.lon),
    accuracy:Number(p.accuracy)||null,
    ts:p.ts||null
  })).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));

  startCoachLivePolling();
}

function runningSessionMapMeta(session){
  const parts=[];
  const km=Number(session.distance_meters)>0?Number(session.distance_meters)/1000:0;
  const sec=Number(session.duration_seconds)||0;
  const pace=Number(session.avg_pace_seconds_per_km)||0;
  if(km>0)parts.push(`${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km`);
  if(sec>0)parts.push(`${Math.max(1,Math.round(sec/60))} min`);
  if(pace>0)parts.push(formatPace(pace));
  return parts.join(" · ");
}

function destroyRouteMap(){
  try{
    if(routeLeafletMap){
      routeLeafletMap.remove();
      routeLeafletMap=null;
      routeLeafletLayer=null;
    }
  }catch(err){console.warn("Kunne ikke lukke kart:",err)}
}

function showRouteFallback(points){
  if(!points.length){
    e.routeMap.innerHTML='<div class="route-map-empty">Ingen GPS-spor er lagret for denne økten.</div>';
    return;
  }

  const w=800,h=420,pad=24;
  const lats=points.map(p=>p.lat),lons=points.map(p=>p.lon);
  const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons);
  const latSpan=Math.max(.000001,maxLat-minLat),lonSpan=Math.max(.000001,maxLon-minLon);

  const xy=points.map(p=>{
    const x=pad+((p.lon-minLon)/lonSpan)*(w-pad*2);
    const y=pad+(1-(p.lat-minLat)/latSpan)*(h-pad*2);
    return [x,y];
  });
  const line=xy.map(p=>p.join(",")).join(" ");
  const s=xy[0],f=xy[xy.length-1];

  e.routeMap.innerHTML=`<svg class="route-fallback-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="GPS-rute">
    <rect x="0" y="0" width="${w}" height="${h}" rx="18"></rect>
    <polyline points="${line}" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></polyline>
    <circle cx="${s[0]}" cy="${s[1]}" r="10" class="route-start"></circle>
    <circle cx="${f[0]}" cy="${f[1]}" r="10" class="route-finish"></circle>
  </svg>`;
}

function openRouteMap(session){
  const points=normalizeGpsTrack(session?.gps_track);
  e.routeMapTitle.textContent=session?.program_name||"Løping";
  e.routeMapMeta.textContent=runningSessionMapMeta(session);
  e.routeMap.innerHTML='<div class="route-map-loading">Laster kart…</div>';
  openModal(e.routeMapModal);

  setTimeout(()=>{
    destroyRouteMap();

    if(!points.length){
      showRouteFallback(points);
      return;
    }

    if(!window.L){
      showRouteFallback(points);
      return;
    }

    try{
      routeLeafletMap=L.map(e.routeMap,{zoomControl:true,attributionControl:true});
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        maxZoom:19,
        attribution:"© OpenStreetMap"
      }).addTo(routeLeafletMap);

      const latlngs=points.map(p=>[p.lat,p.lon]);
      routeLeafletLayer=L.polyline(latlngs,{
        weight:5,
        opacity:.9
      }).addTo(routeLeafletMap);

      if(Array.isArray(session?.golf_hole_geometry)&&session.golf_hole_geometry.length>1){
        const holeLine=session.golf_hole_geometry
          .filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)))
          .map(p=>[Number(p.lat),Number(p.lon)]);
        if(holeLine.length>1){
          L.polyline(holeLine,{weight:3,opacity:.65,dashArray:"8 7"})
            .bindTooltip(`Hull${session.golf_par?` · Par ${session.golf_par}`:""}`)
            .addTo(routeLeafletMap);
        }
      }

      if(session?.golf_pin&&Number.isFinite(Number(session.golf_pin.lat))&&Number.isFinite(Number(session.golf_pin.lon))){
        L.circleMarker([Number(session.golf_pin.lat),Number(session.golf_pin.lon)],{
          radius:9,weight:3,fillOpacity:1
        }).bindTooltip("⛳ Flagg").addTo(routeLeafletMap);
      }

      L.circleMarker(latlngs[0],{
        radius:8,
        weight:3,
        fillOpacity:1
      }).bindTooltip("Start").addTo(routeLeafletMap);

      L.circleMarker(latlngs[latlngs.length-1],{
        radius:8,
        weight:3,
        fillOpacity:1
      }).bindTooltip("Slutt").addTo(routeLeafletMap);

      routeLeafletMap.fitBounds(routeLeafletLayer.getBounds(),{padding:[24,24],maxZoom:17});
      setTimeout(()=>routeLeafletMap?.invalidateSize(),100);
    }catch(err){
      console.error("Kartfeil:",err);
      destroyRouteMap();
      showRouteFallback(points);
    }
  },80);
}

async function renderCalendar(){const selected=e.calendarAthleteSelect.value||"",sessions=await sessionsForView(selected),y=currentMonth.getFullYear(),m=currentMonth.getMonth();e.calendarSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";e.calendarTitle.textContent=new Intl.DateTimeFormat("nb-NO",{month:"long",year:"numeric"}).format(currentMonth);e.calendarGrid.innerHTML="";const first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();for(let i=0;i<42;i++){let day,dm=m;if(i<offset){day=prev-offset+i+1;dm=m-1}else if(i>=offset+days){day=i-offset-days+1;dm=m+1}else day=i-offset+1;const d=new Date(y,dm,day),key=dateKey(d),count=sessions.filter(x=>dateKey(new Date(x.started_at))===key).length,b=document.createElement("button");b.className="calendar-day"+(key===dateKey(new Date())?" today":"");b.innerHTML=`${day}${count?`<span class="day-count">${count}</span>`:""}`;b.onclick=()=>renderCalendarDetails(key,sessions);e.calendarGrid.appendChild(b)}e.calendarDetails.innerHTML=""}
function renderCalendarDetails(key,sessions){
  const list=sessions.filter(x=>dateKey(new Date(x.started_at))===key);
  e.calendarDetails.innerHTML=list.length?list.map(x=>{
    const isRunning=x.program_id==="running"||String(x.program_name||"").trim().toLowerCase()==="løping";
    const isGolf=x.program_id==="golf"||String(x.program_name||"").trim().toLowerCase()==="golf";
    const status=x.status==="completed"?"Fullført":x.status==="cancelled"?"Forkastet":"Startet";
    const durationSeconds=Number(x.duration_seconds)||(x.status==="started"?elapsed(x.started_at):0);
    const minutes=durationSeconds>0?Math.max(1,Math.round(durationSeconds/60)):0;
    const km=Number(x.distance_meters)>0?Number(x.distance_meters)/1000:0;
    const pace=Number(x.avg_pace_seconds_per_km)>0?formatPace(Number(x.avg_pace_seconds_per_km)):"";
    const meta=[fmtDate(x.started_at),status];
    if(isRunning&&km>0)meta.push(`${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})} km`);
    if(isRunning&&minutes>0)meta.push(`${minutes} min`);
    if(isRunning&&pace)meta.push(pace);
    if(isGolf&&x.golf_course)meta.push(x.golf_course);
    if(isGolf&&x.golf_scorecard?.total_strokes)meta.push(`${x.golf_scorecard.total_strokes} slag`);
    if(x.rating)meta.push("★".repeat(x.rating));

    return `<div class="notification-item calendar-workout-card">
      <strong>${esc(x.program_name)}</strong>
      <small>${meta.join(" · ")}</small>
      ${isRunning&&(km>0||minutes>0)?`<div class="calendar-running-metrics">
        ${km>0?`<span><b>${km.toLocaleString("nb-NO",{minimumFractionDigits:2,maximumFractionDigits:2})}</b><em>km</em></span>`:""}
        ${minutes>0?`<span><b>${minutes}</b><em>min</em></span>`:""}
      </div>`:""}
      ${(isRunning||isGolf)&&Array.isArray(x.gps_track)&&x.gps_track.length>1
        ?`<button type="button" class="route-map-btn" data-session-id="${x.id}">🗺 Vis rute</button>`
        :""}
      ${x.comment?`<p>${esc(x.comment)}</p>`:""}
    </div>`;
  }).join(""):`<div class="empty">Ingen økter.</div>`;

  e.calendarDetails.querySelectorAll(".route-map-btn").forEach(btn=>{
    btn.onclick=()=>{
      const session=list.find(x=>String(x.id)===String(btn.dataset.sessionId));
      if(session)openRouteMap(session);
    };
  });
}
async function renderStats(){const selected=e.statsAthleteSelect.value||"",sessions=await sessionsForView(selected),valid=sessions.filter(x=>x.status!=="cancelled"),completed=valid.filter(x=>x.status==="completed"),ratings=completed.filter(x=>x.rating).map(x=>x.rating);e.statsSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";e.statSessions.textContent=valid.length;e.statMinutes.textContent=Math.round(completed.reduce((s,x)=>s+(x.duration_seconds||0),0)/60);e.statRating.textContent=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";e.statCompleted.textContent=valid.length?`${Math.round(completed.length/valid.length*100)}%`:"0%";const counts={};completed.forEach(x=>counts[x.program_name]=(counts[x.program_name]||0)+1);const entries=Object.entries(counts),max=Math.max(1,...entries.map(x=>x[1]));e.programStats.innerHTML=entries.length?entries.map(([n,v])=>`<div class="bar-row"><span>${esc(n)}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join(""):`<div class="empty">Ingen fullførte økter ennå.</div>`}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=async()=>{
  const n=b.dataset.screen;
  try{
    if(n==="home"){
      if(profile?.role==="coach"){
        await loadCoachData();
        showOnly("coach");
        startCoachLivePolling();
      }else{
        await loadAthleteData();
        showOnly("athlete");
      }
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

let deferredInstallPrompt=null;

function updateInstallButton(){
  if(!e.installAppBtn)return;
  const standalone=window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone===true;
  e.installAppBtn.classList.toggle("hidden",standalone || !deferredInstallPrompt);
}

window.addEventListener("beforeinstallprompt",ev=>{
  ev.preventDefault();
  deferredInstallPrompt=ev;
  updateInstallButton();
});

window.addEventListener("appinstalled",()=>{
  deferredInstallPrompt=null;
  updateInstallButton();
});

if(e.installAppBtn)e.installAppBtn.onclick=async()=>{
  if(!deferredInstallPrompt)return;
  deferredInstallPrompt.prompt();
  try{await deferredInstallPrompt.userChoice}catch{}
  deferredInstallPrompt=null;
  updateInstallButton();
};

e.accountBtn.onclick=()=>{updateAccount();openModal(e.accountModal)};e.closeAccountBtn.onclick=()=>closeModal(e.accountModal);e.openLoginBtn.onclick=()=>openModal(e.accountModal);e.openRegisterBtn.onclick=()=>openModal(e.registerModal);e.showRegisterBtn.onclick=()=>{closeModal(e.accountModal);openModal(e.registerModal)};e.closeRegisterBtn.onclick=()=>closeModal(e.registerModal);e.loginBtn.onclick=login;e.registerBtn.onclick=register;e.logoutBtn.onclick=logout;e.copyInviteBtn.onclick=copyInvite;if(e.copyInviteBtnAthletes)e.copyInviteBtnAthletes.onclick=copyInvite;e.closeProgramBtn.onclick=()=>closeModal(e.programModal);e.saveProgramsBtn.onclick=savePrograms;
if(e.coachProgramSelect)e.coachProgramSelect.onchange=()=>loadProgramEditor(e.coachProgramSelect.value);if(e.exportProgramsBtn)e.exportProgramsBtn.onclick=exportPrograms;if(e.importProgramsBtn&&e.importProgramsFile)e.importProgramsBtn.onclick=()=>e.importProgramsFile.click();if(e.importProgramsFile)e.importProgramsFile.onchange=async()=>{await importProgramsFile(e.importProgramsFile.files?.[0]);e.importProgramsFile.value="";};if(e.reloadProgramBtn)e.reloadProgramBtn.onclick=()=>loadProgramEditor(e.coachProgramSelect.value);if(e.saveProgramActivitiesBtn)e.saveProgramActivitiesBtn.onclick=saveProgramActivities;
e.continueSessionBtn.onclick=async()=>{
  if(!activeSession){
    await loadAthleteData();
    if(!activeSession){alert("Fant ingen aktiv økt.");return}
  }
  unlockAudio().catch(()=>{});
  requestWakeLock().catch(()=>{});
  await launchRunner();
};e.runningPauseBtn.onclick=toggleRunningPause;e.runningFinishBtn.onclick=finishRunning;e.runningDiscardBtn.onclick=discardActive;e.twentyPauseBtn.onclick=toggleTwentyPause;e.twentyFinishBtn.onclick=finishTwenty;e.twentyDiscardBtn.onclick=discardActive;e.freeWorkoutFinishBtn.onclick=finishFreeWorkout;e.freeWorkoutDiscardBtn.onclick=discardActive;
e.golfSetupClose.onclick=()=>closeModal(e.golfSetupModal);
if(e.golfDownloadCsvTemplateBtn)e.golfDownloadCsvTemplateBtn.onclick=downloadGolfCsvTemplate;
if(e.golfImportCsvFile)e.golfImportCsvFile.onchange=()=>importGolfCourseCsv(e.golfImportCsvFile.files?.[0]);
if(e.golfImportCsvBtn&&e.golfImportCsvFile)e.golfImportCsvBtn.onclick=()=>e.golfImportCsvFile.click();
if(e.golfSavedCourseSelect)e.golfSavedCourseSelect.onchange=chooseSavedGolfCourse;
if(e.coachGolfCoursesBtn)e.coachGolfCoursesBtn.onclick=openGolfCourseAdmin;
if(e.golfCoursesBackBtn)e.golfCoursesBackBtn.onclick=()=>showOnly("coach");
if(e.golfAdminCourseSelect)e.golfAdminCourseSelect.onchange=renderGolfCourseAdmin;
if(e.golfAdminNewCourseBtn)e.golfAdminNewCourseBtn.onclick=createGolfCourseAdmin;
if(e.golfAdminSaveBtn)e.golfAdminSaveBtn.onclick=saveGolfCourseAdmin;
e.golfFindCourseBtn.onclick=searchGolfCourseByName;
e.golfNearbyCourseBtn.onclick=findNearbyGolfCourses;
e.golfCourseResults.onchange=selectGolfCourseCandidate;
e.golfPreviousBtn.onclick=golfPrevious;
e.golfNextBtn.onclick=golfNext;

e.golfStartRoundBtn.onclick=createGolfSession;
e.golfMinusStrokeBtn.onclick=()=>changeGolfStrokes(-1);
e.golfPlusStrokeBtn.onclick=()=>changeGolfStrokes(1);
e.golfCompleteBtn.onclick=golfCompleteHole;
e.golfSkipBtn.onclick=golfSkipHole;
e.golfPostponeBtn.onclick=golfPostponeHole;
e.golfMapBtn.onclick=openGolfCurrentMap;
e.golfFinishRoundBtn.onclick=openGolfFinish;
e.golfDiscardBtn.onclick=discardActive;
e.discardSessionBtn.onclick=discardActive;e.intervalSkipBtn.onclick=()=>runnerMode==="intervalSequence"?skipIntervalSequence():skipInterval();e.runnerAbortBtn.onclick=discardActive;e.sequenceCompleteBtn.onclick=seqComplete;e.sequenceSkipBtn.onclick=seqSkip;e.sequencePostponeBtn.onclick=seqPostpone;e.sequenceAbortBtn.onclick=discardActive;
e.cancelFinishBtn.onclick=()=>closeModal(e.finishModal);e.saveFinishBtn.onclick=saveFinish;e.finishStars.querySelectorAll("button").forEach(b=>b.onclick=()=>{finishRating=Number(b.dataset.rating);renderStars()});e.prevMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar()};e.nextMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar()};e.calendarAthleteSelect.onchange=renderCalendar;e.statsAthleteSelect.onchange=renderStats;

sb.auth.onAuthStateChange(async(_event,newSession)=>{session=newSession;user=newSession?.user||null;await loadProfile();closeModal(e.accountModal);await route()});
(async function init(){const {data}=await sb.auth.getSession();session=data.session;user=session?.user||null;await loadProfile();if(new URLSearchParams(location.search).get("register")==="1"&&!user)openModal(e.registerModal);await route()})();

e.programInfoClose.onclick=()=>closeModal(e.programInfoModal);e.routeMapClose.onclick=()=>{destroyRouteMap();closeModal(e.routeMapModal)};e.liveRouteMapClose.onclick=()=>{destroyLiveRouteMap();closeModal(e.liveRouteMapModal)};e.coachLiveRefreshBtn.onclick=loadCoachLiveSessions;
})();

document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible" && activeSession){
    applyWorkoutWakeLockPolicy();
  }
});


/* v9.8.3 – ekstra avslutningssikring for GPS-økter */
function isGpsFreeEndTarget(target){
  const btn=target?.closest?.("button");
  if(!btn)return null;
  const text=String(btn.textContent||"").trim().toLowerCase();
  const id=String(btn.id||"").toLowerCase();
  const ending=text.includes("avslutt") || text.includes("fullfør økt") || id.includes("end") || id.includes("finish");
  if(!ending)return null;
  return btn;
}

document.addEventListener("click",(ev)=>{
  if(!activeSession || activeProgramWakeLockMode()!=="off")return;
  const btn=isGpsFreeEndTarget(ev.target);
  if(!btn)return;

  const now=Date.now();
  const armedUntil=Number(btn.dataset.endConfirmUntil||0);

  if(now<=armedUntil){
    delete btn.dataset.endConfirmUntil;
    return; // second intentional tap: let original handler run
  }

  ev.preventDefault();
  ev.stopImmediatePropagation();
  btn.dataset.endConfirmUntil=String(now+5000);

  const old=btn.dataset.originalEndLabel || btn.textContent;
  btn.dataset.originalEndLabel=old;
  btn.textContent="Trykk igjen for å avslutte";
  btn.classList.add("confirm-end");

  setTimeout(()=>{
    if(Number(btn.dataset.endConfirmUntil||0)<=Date.now()){
      btn.textContent=btn.dataset.originalEndLabel||old;
      btn.classList.remove("confirm-end");
      delete btn.dataset.endConfirmUntil;
    }
  },5100);
},true);

if(e.exerciseHowToClose)e.exerciseHowToClose.addEventListener("click",closeExerciseHowTo);
if(e.exerciseHowToOk)e.exerciseHowToOk.addEventListener("click",closeExerciseHowTo);
