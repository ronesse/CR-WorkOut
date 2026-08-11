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
"copyInviteBtn","pendingCount","activeAthletesCount","sessionsTodayCount","notificationFeed","athletesList","programsNavBtn","programsScreen","coachProgramSelect","coachProgramTitle","reloadProgramBtn","programEditorMessage","programActivitiesEditor","saveProgramActivitiesBtn","calendarSubtitle","calendarAthleteSelect","prevMonthBtn","nextMonthBtn","calendarTitle","calendarGrid","calendarDetails","statsSubtitle","statsAthleteSelect","statSessions","statMinutes","statRating","statCompleted","programStats",
"accountModal","accountTitle","closeAccountBtn","authLoggedOut","authLoggedIn","loginEmail","loginPassword","loginBtn","showRegisterBtn","loginMessage","accountName","accountEmail","logoutBtn",
"registerModal","closeRegisterBtn","regName","regPhone","regEmail","regPassword","registerBtn","registerMessage","programModal","programAthleteName","closeProgramBtn","programChecklist","saveProgramsBtn",
"finishModal","finishSummary","finishStars","finishComment","saveFinishBtn","cancelFinishBtn",
"intervalCard","intervalProgramName","intervalElapsed","intervalRound","intervalRemainingTotal","intervalPhase","intervalMessage","intervalTime","intervalProgressBar","intervalNext","intervalSkipBtn","runnerAbortBtn",
"sequenceProgramName","sequenceGroupRound","sequenceElapsed","sequenceProgressText","sequenceProgressBar","sequenceActivity","sequenceReps","sequenceLoad","sequenceDesc","sequenceNextActivity","sequenceNextMeta","sequenceCompleteBtn","sequenceSkipBtn","sequencePostponeBtn","sequenceAbortBtn"
].forEach(id=>e[id]=$(id));

let session=null,user=null,profile=null,athletes=[],programs=[],programAthleteId=null,activeSession=null,homeTimer=null,runnerTimer=null,finishRating=4,currentMonth=new Date(),realtimeChannel=null,runnerMode=null,intervalState=null,sequenceState=null,lastCueKey="";

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmtDate(iso){return new Intl.DateTimeFormat("nb-NO",{dateStyle:"medium",timeStyle:"short"}).format(new Date(iso))}
function dateKey(d){const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function elapsed(from,to=new Date()){return Math.max(0,Math.floor((new Date(to)-new Date(from))/1000))}
function fmtElapsed(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function showOnly(name){["landing","athlete","coach","programs","runner","calendar","stats"].forEach(n=>e[n+"Screen"].classList.toggle("hidden",n!==name));document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",(name==="athlete"&&b.dataset.screen==="home")||(name==="coach"&&b.dataset.screen==="home")||b.dataset.screen===name))}
function openModal(m){m.classList.remove("hidden")}function closeModal(m){m.classList.add("hidden")}
function stateKey(){return activeSession?`cr_runner_${activeSession.id}`:""}
function saveRunnerState(obj){if(activeSession)localStorage.setItem(stateKey(),JSON.stringify(obj))}
function loadRunnerState(){try{return JSON.parse(localStorage.getItem(stateKey())||"null")}catch{return null}}
function clearRunnerState(){if(activeSession)localStorage.removeItem(stateKey())}
function audioCue(text){try{const C=window.AudioContext||window.webkitAudioContext;if(C){const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=900;g.gain.value=.15;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close()},100)}}catch{}if("speechSynthesis"in window){const u=new SpeechSynthesisUtterance(text);u.lang="nb-NO";speechSynthesis.cancel();speechSynthesis.speak(u)}}

async function loadProfile(){if(!user){profile=null;return}const {data}=await sb.from("cr_profiles").select("*").eq("id",user.id).maybeSingle();profile=data||null}
function updateAccount(){const logged=!!user;e.authLoggedOut.classList.toggle("hidden",logged);e.authLoggedIn.classList.toggle("hidden",!logged);if(logged){e.accountName.textContent=profile?.full_name||user.email;e.accountEmail.textContent=user.email;e.accountTitle.textContent=profile?.role==="coach"?"Coach-konto":"Min konto"}}
async function route(){updateAccount();stopRunnerTick();if(!user){e.bottomNav.classList.add("hidden");showOnly("landing");return}e.bottomNav.classList.remove("hidden");const coach=profile?.role==="coach";e.athletesNavBtn.classList.toggle("hidden",!coach);e.programsNavBtn.classList.toggle("hidden",!coach);e.calendarAthleteSelect.classList.toggle("hidden",!coach);e.statsAthleteSelect.classList.toggle("hidden",!coach);if(coach){await loadCoachData();showOnly("coach");startRealtime()}else{await loadAthleteData();showOnly("athlete")}}

async function login(){e.loginMessage.textContent="Logger inn…";const {error}=await sb.auth.signInWithPassword({email:e.loginEmail.value.trim(),password:e.loginPassword.value});e.loginMessage.textContent=error?error.message:""}
function coachIdFromUrl(){return new URLSearchParams(location.search).get("coach")||""}
async function register(){const name=e.regName.value.trim(),phone=e.regPhone.value.trim(),email=e.regEmail.value.trim(),password=e.regPassword.value;if(!name||!phone||!email||password.length<6){e.registerMessage.textContent="Fyll ut alle feltene. Passord må ha minst 6 tegn.";return}e.registerMessage.textContent="Registrerer…";const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{full_name:name,phone,coach_id:coachIdFromUrl()}}});e.registerMessage.textContent=error?error.message:(data.session?"Registrert og innlogget.":"Registrert. Sjekk e-post og bekreft kontoen.")}
async function logout(){await sb.auth.signOut();closeModal(e.accountModal)}

async function loadPrograms(){const {data}=await sb.from("cr_programs").select("*").eq("active",true).order("sort_order");programs=data||[]}
async function loadAthleteData(){
 await loadPrograms();const {data:sessions}=await sb.from("cr_workout_sessions").select("*").eq("athlete_id",user.id).order("started_at",{ascending:false});const all=sessions||[];activeSession=all.find(x=>x.status==="started")||null;
 const completed=all.filter(x=>x.status==="completed");e.athleteSessionCount.textContent=completed.length;e.athleteMinutes.textContent=Math.round(completed.reduce((s,x)=>s+(x.duration_seconds||0),0)/60);const ratings=completed.filter(x=>x.rating).map(x=>x.rating);e.athleteAvgRating.textContent=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";
 const approved=!!profile?.approved;e.athleteStatusCard.className="status-card "+(approved?"approved":"pending");e.athleteStatusTitle.textContent=approved?"Godkjent utøver":"Venter på godkjenning";e.athleteStatusText.textContent=approved?"Du har tilgang til programmene coachen har tildelt deg.":"Coachen må godkjenne kontoen før programmene blir tilgjengelige.";e.assignedProgramsWrap.classList.toggle("hidden",!approved);
 if(approved){const {data:a}=await sb.from("cr_athlete_programs").select("program_id").eq("athlete_id",user.id).eq("enabled",true);const ids=new Set((a||[]).map(x=>x.program_id));renderPrograms(programs.filter(p=>ids.has(p.id)))}
 renderActiveSession();
}
function renderPrograms(list){e.assignedPrograms.innerHTML=list.length?list.map(p=>`<article class="program-card"><span class="program-icon">${p.id==="kettlebell"?`<img src="kettlebell.png" alt="Kettlebell">`:esc(p.icon||"🏋️")}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><button class="primary-btn start-program" data-id="${p.id}">Start økt</button></article>`).join(""):`<div class="empty">Ingen programmer er tildelt ennå.</div>`;e.assignedPrograms.querySelectorAll(".start-program").forEach(b=>b.onclick=()=>startSession(b.dataset.id))}
async function startSession(programId){
 if(activeSession){renderActiveSession();alert("Du har allerede en aktiv økt. Velg «Fortsett økten» eller forkast den først.");return}
 if(!INTERVAL_PROGRAMS[programId]&&!SEQUENCE_PROGRAMS[programId]){alert("Dette programmet er ikke aktivert i treningsmotoren ennå.");return}
 const p=programs.find(x=>x.id===programId);const {data,error}=await sb.from("cr_workout_sessions").insert({athlete_id:user.id,program_id:programId,program_name:p?.name||programId,status:"started",started_at:new Date().toISOString()}).select().single();if(error){alert(error.message);return}activeSession=data;clearRunnerState();launchRunner();
}
function renderActiveSession(){
 e.activeSessionCard.classList.toggle("hidden",!activeSession);clearInterval(homeTimer);if(!activeSession)return;
 e.activeSessionName.textContent=activeSession.program_name;e.activeStartedAt.textContent=fmtDate(activeSession.started_at);const tick=()=>e.activeElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at));tick();homeTimer=setInterval(tick,1000)
}
async function discardActive(){
 if(!activeSession||!confirm(`Forkaste den aktive økten «${activeSession.program_name}»?`))return;
 const id=activeSession.id;const {error}=await sb.from("cr_workout_sessions").update({status:"cancelled",completed_at:new Date().toISOString(),duration_seconds:elapsed(activeSession.started_at)}).eq("id",id);if(error){alert(error.message);return}clearRunnerState();activeSession=null;stopRunnerTick();await loadAthleteData();showOnly("athlete")
}

function launchRunner(){
 if(!activeSession)return;const id=activeSession.program_id;runnerMode=INTERVAL_PROGRAMS[id]?"interval":SEQUENCE_PROGRAMS[id]?"sequence":null;if(!runnerMode){alert("Programmotor mangler for denne økten.");return}
 showOnly("runner");e.intervalRunner.classList.toggle("hidden",runnerMode!=="interval");e.sequenceRunner.classList.toggle("hidden",runnerMode!=="sequence");
 if(runnerMode==="interval")startIntervalRunner();else startSequenceRunner()
}
function stopRunnerTick(){clearInterval(runnerTimer);runnerTimer=null;lastCueKey=""}
function startIntervalRunner(){
 const cfg=INTERVAL_PROGRAMS[activeSession.program_id];intervalState=loadRunnerState()||{offsetSeconds:0};e.intervalProgramName.textContent=cfg.name;
 const render=()=>{let t=elapsed(activeSession.started_at)+Number(intervalState.offsetSeconds||0),cycle=cfg.work+cfg.rest,total=cfg.rounds*cycle;if(t>=total){stopRunnerTick();openFinish();return}
 const round=Math.floor(t/cycle)+1,into=t%cycle,isWork=into<cfg.work,dur=isWork?cfg.work:cfg.rest,phaseInto=isWork?into:into-cfg.work,remain=Math.max(0,dur-phaseInto),totalRemain=Math.max(0,total-t);
 e.intervalElapsed.textContent=fmtElapsed(t);e.intervalRound.textContent=`Runde ${round} av ${cfg.rounds}`;e.intervalRemainingTotal.textContent=`${fmtElapsed(totalRemain)} igjen`;e.intervalTime.textContent=Math.ceil(remain);
 e.intervalCard.className="interval-card "+(isWork?(remain<=cfg.workWarning?"warning":"work"):"rest");e.intervalPhase.textContent=isWork?(remain<=cfg.workWarning?"HOLD UT!":"ARBEID"):(remain<=cfg.restWarning?"GJØR KLAR!":"HVILE");e.intervalMessage.textContent=isWork?(remain<=cfg.workWarning?"Hold ut!":"Jobb kontrollert"):(remain<=cfg.restWarning?"Gjør klar!":"Pust og hent deg inn");e.intervalNext.textContent=isWork?`Neste: Hvile ${cfg.rest} sek`:(round===cfg.rounds?"Neste: Ferdig":`Neste: Arbeid ${cfg.work} sek`);e.intervalProgressBar.style.width=`${Math.min(100,Math.max(0,phaseInto/dur*100))}%`;
 const cueKey=`${round}-${isWork?"w":"r"}-${Math.ceil(remain)}`;if(cueKey!==lastCueKey){if((isWork&&Math.ceil(remain)===cfg.workWarning)||( !isWork&&Math.ceil(remain)===cfg.restWarning)||Math.ceil(remain)===dur)audioCue(isWork?(remain<=cfg.workWarning?"Hold ut":"Arbeid"):(remain<=cfg.restWarning?"Gjør klar":"Hvile"));lastCueKey=cueKey}}
 render();stopRunnerTick();runnerTimer=setInterval(render,250)
}
function skipInterval(){const cfg=INTERVAL_PROGRAMS[activeSession.program_id],t=elapsed(activeSession.started_at)+Number(intervalState.offsetSeconds||0),cycle=cfg.work+cfg.rest,into=t%cycle,isWork=into<cfg.work,remain=isWork?(cfg.work-into):(cycle-into);intervalState.offsetSeconds=Number(intervalState.offsetSeconds||0)+Math.max(1,Math.ceil(remain));saveRunnerState(intervalState)}

async function startSequenceRunner(){
 const cfg=SEQUENCE_PROGRAMS[activeSession.program_id];e.sequenceProgramName.textContent=cfg.name;
 const saved=loadRunnerState();const items=await getSequenceItems(activeSession.program_id);sequenceState=saved&&saved.mode==="sequence"?saved:{mode:"sequence",queue:items.map(x=>({...x})),completed:[],skipped:[]};saveRunnerState(sequenceState);
 const render=()=>{const cur=sequenceState.queue[0];e.sequenceElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at));if(!cur){stopRunnerTick();openFinish();return}const next=sequenceState.queue[1],done=sequenceState.completed.length+sequenceState.skipped.length,total=cfg.items.length;e.sequenceGroupRound.textContent=`${cur.group==="WarmUp"?"Oppvarming":"Hoveddel"} · Runde ${cur.round}`;e.sequenceProgressText.textContent=`Aktivitet ${done+1} av ${total} · ${sequenceState.completed.length} fullført`;e.sequenceProgressBar.style.width=`${done/total*100}%`;e.sequenceActivity.textContent=cur.activity;e.sequenceReps.textContent=cur.reps||"–";e.sequenceLoad.textContent=cur.load||"–";e.sequenceDesc.textContent=cur.desc||"";e.sequenceNextActivity.textContent=next?next.activity:"Ferdig";e.sequenceNextMeta.textContent=next?`${next.group==="WarmUp"?"Oppvarming":"Hoveddel"} · Runde ${next.round}${next.reps?` · ${next.reps} reps`:""}${next.load?` · ${next.load}`:""}`:"Siste aktivitet"}
 render();stopRunnerTick();runnerTimer=setInterval(render,500)
}
function seqComplete(){if(!sequenceState?.queue.length)return;sequenceState.completed.push(sequenceState.queue.shift());saveRunnerState(sequenceState);startSequenceRunner()}
function seqSkip(){if(!sequenceState?.queue.length)return;sequenceState.skipped.push(sequenceState.queue.shift());saveRunnerState(sequenceState);startSequenceRunner()}
function seqPostpone(){if(!sequenceState?.queue.length)return;const item=sequenceState.queue[0];let last=-1;for(let i=1;i<sequenceState.queue.length;i++){const x=sequenceState.queue[i];if(x.group===item.group&&x.round===item.round)last=i;else break}if(last<1){alert("Dette er siste aktivitet i denne runden.");return}sequenceState.queue.shift();sequenceState.queue.splice(last,0,item);saveRunnerState(sequenceState);startSequenceRunner()}

function renderStars(){e.finishStars.querySelectorAll("button").forEach(b=>b.textContent=Number(b.dataset.rating)<=finishRating?"★":"☆")}
function openFinish(){if(!activeSession||!e.finishModal.classList.contains("hidden"))return;finishRating=4;e.finishComment.value="";e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(elapsed(activeSession.started_at))}`;renderStars();openModal(e.finishModal)}
async function saveFinish(){const ended=new Date(),duration=elapsed(activeSession.started_at),id=activeSession.id;const {error}=await sb.from("cr_workout_sessions").update({status:"completed",completed_at:ended.toISOString(),duration_seconds:duration,rating:finishRating,comment:e.finishComment.value.trim()}).eq("id",id);if(error){alert(error.message);return}clearRunnerState();activeSession=null;stopRunnerTick();closeModal(e.finishModal);await loadAthleteData();showOnly("athlete")}


async function ensureProgramActivitiesSeeded(programId){
  const {data:existing,error}=await sb.from("cr_program_activities").select("id").eq("program_id",programId).limit(1);
  if(error){console.error(error);return}
  if(existing&&existing.length)return;

  let src=[];
  if(SEQUENCE_PROGRAMS[programId]) src=SEQUENCE_PROGRAMS[programId].items;
  if(!src.length)return;

  const rows=src.map(x=>({
    program_id:programId,
    group_name:x.group||null,
    order_no:x.order,
    round_no:x.round||null,
    activity:x.activity,
    reps:x.reps||"",
    load:x.load||"",
    description:x.desc||""
  }));
  const {error:insErr}=await sb.from("cr_program_activities").insert(rows);
  if(insErr)console.error(insErr);
}
async function loadCoachProgramOptions(){
  await loadPrograms();
  const editable=programs.filter(p=>SEQUENCE_PROGRAMS[p.id]);
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
  await ensureProgramActivitiesSeeded(programId);
  const {data,error}=await sb.from("cr_program_activities").select("*").eq("program_id",programId).order("order_no");
  if(error){e.programEditorMessage.textContent=error.message;return}
  const p=programs.find(x=>x.id===programId);
  e.coachProgramTitle.textContent=p?.name||programId;
  const rows=data||[];
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
  e.programEditorMessage.textContent=`${rows.length} aktiviteter lastet.`;
}
async function saveProgramActivities(){
  const rows=[...e.programActivitiesEditor.querySelectorAll(".activity-edit-row")].map(row=>{
    const obj={id:Number(row.dataset.id)};
    row.querySelectorAll("input[data-field]").forEach(inp=>obj[inp.dataset.field]=inp.value.trim());
    return obj;
  });
  if(!rows.length)return;
  e.programEditorMessage.textContent="Lagrer…";
  for(const r of rows){
    const {id,...changes}=r;
    const {error}=await sb.from("cr_program_activities").update({...changes,updated_at:new Date().toISOString()}).eq("id",id);
    if(error){e.programEditorMessage.textContent=`Feil: ${error.message}`;return}
  }
  e.programEditorMessage.textContent="✓ Endringer lagret";
}
async function getSequenceItems(programId){
  const {data,error}=await sb.from("cr_program_activities").select("*").eq("program_id",programId).order("order_no");
  if(!error && data && data.length){
    return data.map(r=>({group:r.group_name,order:r.order_no,activity:r.activity,round:r.round_no,reps:r.reps||"",load:r.load||"",desc:r.description||""}));
  }
  return SEQUENCE_PROGRAMS[programId]?.items||[];
}

async function loadCoachData(){await loadPrograms();const {data:links}=await sb.from("cr_coach_athletes").select("athlete_id,status,cr_profiles!cr_coach_athletes_athlete_id_fkey(*)").eq("coach_id",user.id).order("created_at");athletes=(links||[]).map(x=>({...x.cr_profiles,link_status:x.status}));const ids=athletes.map(a=>a.id);e.pendingCount.textContent=athletes.filter(a=>!a.approved).length;e.activeAthletesCount.textContent=athletes.filter(a=>a.approved).length;let today=0;if(ids.length){const from=new Date();from.setHours(0,0,0,0);const {count}=await sb.from("cr_workout_sessions").select("*",{count:"exact",head:true}).in("athlete_id",ids).gte("started_at",from.toISOString());today=count||0}e.sessionsTodayCount.textContent=today;renderAthletes();fillAthleteSelectors()}
function renderAthletes(){e.athletesList.innerHTML=athletes.length?athletes.map(a=>`<div class="athlete-item"><div class="athlete-row"><div><strong>${esc(a.full_name||a.email)}</strong><small>${esc(a.phone||"")} · ${esc(a.email||"")}</small><small>${a.approved?"✅ Godkjent":"⏳ Venter på godkjenning"}</small></div><div class="athlete-actions">${!a.approved?`<button class="approve-btn" data-id="${a.id}">Godkjenn</button>`:""}<button class="programs-btn" data-id="${a.id}">Programmer</button></div></div></div>`).join(""):`<div class="empty">Ingen utøvere har registrert seg ennå.</div>`;e.athletesList.querySelectorAll(".approve-btn").forEach(b=>b.onclick=()=>approveAthlete(b.dataset.id));e.athletesList.querySelectorAll(".programs-btn").forEach(b=>b.onclick=()=>openPrograms(b.dataset.id))}
async function approveAthlete(id){const {error}=await sb.from("cr_profiles").update({approved:true}).eq("id",id);if(error){alert(error.message);return}await sb.from("cr_coach_athletes").update({status:"approved"}).eq("coach_id",user.id).eq("athlete_id",id);await loadCoachData()}
async function openPrograms(id){programAthleteId=id;const a=athletes.find(x=>x.id===id);e.programAthleteName.textContent=a?.full_name||"Utøver";const {data}=await sb.from("cr_athlete_programs").select("program_id,enabled").eq("athlete_id",id);const enabled=new Set((data||[]).filter(x=>x.enabled).map(x=>x.program_id));e.programChecklist.innerHTML=programs.map(p=>`<label class="program-check"><span><strong>${esc(p.name)}</strong><small>${esc(p.description||"")}</small></span><input type="checkbox" data-id="${p.id}" ${enabled.has(p.id)?"checked":""}></label>`).join("");openModal(e.programModal)}
async function savePrograms(){const rows=[...e.programChecklist.querySelectorAll("input")].map(i=>({athlete_id:programAthleteId,program_id:i.dataset.id,enabled:i.checked}));const {error}=await sb.from("cr_athlete_programs").upsert(rows,{onConflict:"athlete_id,program_id"});if(error){alert(error.message);return}closeModal(e.programModal)}
function inviteUrl(){return `${location.origin}${location.pathname}?register=1&coach=${user.id}`}async function copyInvite(){await navigator.clipboard.writeText(inviteUrl());alert("Registreringslenken er kopiert.")}
function startRealtime(){if(realtimeChannel)sb.removeChannel(realtimeChannel);realtimeChannel=sb.channel("cr-workout-coach-v2").on("postgres_changes",{event:"INSERT",schema:"public",table:"cr_workout_sessions"},p=>handleRealtime(p.new)).on("postgres_changes",{event:"UPDATE",schema:"public",table:"cr_workout_sessions"},p=>handleRealtime(p.new)).subscribe()}
function handleRealtime(row){if(!athletes.some(a=>a.id===row.athlete_id))return;const a=athletes.find(x=>x.id===row.athlete_id),completed=row.status==="completed";if(row.status==="cancelled")return;const div=document.createElement("div");div.className="notification-item";div.innerHTML=`<strong>${completed?"✅":"🟢"} ${esc(a.full_name||a.email)} ${completed?"fullførte":"startet"} ${esc(row.program_name)}</strong><small>${completed&&row.rating?`Rating ${"★".repeat(row.rating)} · `:""}${fmtDate(completed?row.completed_at:row.started_at)}</small>`;if(e.notificationFeed.querySelector(".empty"))e.notificationFeed.innerHTML="";e.notificationFeed.prepend(div);loadCoachData()}

function fillAthleteSelectors(){const opts=[`<option value="">Alle utøvere</option>`,...athletes.filter(a=>a.approved).map(a=>`<option value="${a.id}">${esc(a.full_name||a.email)}</option>`)].join("");e.calendarAthleteSelect.innerHTML=opts;e.statsAthleteSelect.innerHTML=opts}
async function sessionsForView(selected=""){if(profile?.role==="coach"){const ids=selected?[selected]:athletes.filter(a=>a.approved).map(a=>a.id);if(!ids.length)return[];const {data}=await sb.from("cr_workout_sessions").select("*").in("athlete_id",ids).order("started_at",{ascending:false});return data||[]}const {data}=await sb.from("cr_workout_sessions").select("*").eq("athlete_id",user.id).order("started_at",{ascending:false});return data||[]}
async function renderCalendar(){const selected=e.calendarAthleteSelect.value||"",sessions=await sessionsForView(selected),y=currentMonth.getFullYear(),m=currentMonth.getMonth();e.calendarSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";e.calendarTitle.textContent=new Intl.DateTimeFormat("nb-NO",{month:"long",year:"numeric"}).format(currentMonth);e.calendarGrid.innerHTML="";const first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();for(let i=0;i<42;i++){let day,dm=m;if(i<offset){day=prev-offset+i+1;dm=m-1}else if(i>=offset+days){day=i-offset-days+1;dm=m+1}else day=i-offset+1;const d=new Date(y,dm,day),key=dateKey(d),count=sessions.filter(x=>dateKey(new Date(x.started_at))===key).length,b=document.createElement("button");b.className="calendar-day"+(key===dateKey(new Date())?" today":"");b.innerHTML=`${day}${count?`<span class="day-count">${count}</span>`:""}`;b.onclick=()=>renderCalendarDetails(key,sessions);e.calendarGrid.appendChild(b)}e.calendarDetails.innerHTML=""}
function renderCalendarDetails(key,sessions){const list=sessions.filter(x=>dateKey(new Date(x.started_at))===key);e.calendarDetails.innerHTML=list.length?list.map(x=>`<div class="notification-item"><strong>${esc(x.program_name)}</strong><small>${fmtDate(x.started_at)} · ${x.status==="completed"?"Fullført":x.status==="cancelled"?"Forkastet":"Startet"}${x.rating?` · ${"★".repeat(x.rating)}`:""}</small>${x.comment?`<p>${esc(x.comment)}</p>`:""}</div>`).join(""):`<div class="empty">Ingen økter.</div>`}
async function renderStats(){const selected=e.statsAthleteSelect.value||"",sessions=await sessionsForView(selected),valid=sessions.filter(x=>x.status!=="cancelled"),completed=valid.filter(x=>x.status==="completed"),ratings=completed.filter(x=>x.rating).map(x=>x.rating);e.statsSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";e.statSessions.textContent=valid.length;e.statMinutes.textContent=Math.round(completed.reduce((s,x)=>s+(x.duration_seconds||0),0)/60);e.statRating.textContent=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";e.statCompleted.textContent=valid.length?`${Math.round(completed.length/valid.length*100)}%`:"0%";const counts={};completed.forEach(x=>counts[x.program_name]=(counts[x.program_name]||0)+1);const entries=Object.entries(counts),max=Math.max(1,...entries.map(x=>x[1]));e.programStats.innerHTML=entries.length?entries.map(([n,v])=>`<div class="bar-row"><span>${esc(n)}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join(""):`<div class="empty">Ingen fullførte økter ennå.</div>`}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=async()=>{const n=b.dataset.screen;if(n==="home"){if(profile?.role==="coach"){await loadCoachData();showOnly("coach")}else{await loadAthleteData();showOnly("athlete")}}else if(n==="coach"){await loadCoachData();showOnly("coach")}else if(n==="programs"){await loadCoachProgramOptions();showOnly("programs")}else if(n==="calendar"){await renderCalendar();showOnly("calendar")}else if(n==="stats"){await renderStats();showOnly("stats")}});
e.accountBtn.onclick=()=>{updateAccount();openModal(e.accountModal)};e.closeAccountBtn.onclick=()=>closeModal(e.accountModal);e.openLoginBtn.onclick=()=>openModal(e.accountModal);e.openRegisterBtn.onclick=()=>openModal(e.registerModal);e.showRegisterBtn.onclick=()=>{closeModal(e.accountModal);openModal(e.registerModal)};e.closeRegisterBtn.onclick=()=>closeModal(e.registerModal);e.loginBtn.onclick=login;e.registerBtn.onclick=register;e.logoutBtn.onclick=logout;e.copyInviteBtn.onclick=copyInvite;e.closeProgramBtn.onclick=()=>closeModal(e.programModal);e.saveProgramsBtn.onclick=savePrograms;
e.coachProgramSelect.onchange=()=>loadProgramEditor(e.coachProgramSelect.value);e.reloadProgramBtn.onclick=()=>loadProgramEditor(e.coachProgramSelect.value);e.saveProgramActivitiesBtn.onclick=saveProgramActivities;
e.continueSessionBtn.onclick=launchRunner;e.discardSessionBtn.onclick=discardActive;e.intervalSkipBtn.onclick=skipInterval;e.runnerAbortBtn.onclick=discardActive;e.sequenceCompleteBtn.onclick=seqComplete;e.sequenceSkipBtn.onclick=seqSkip;e.sequencePostponeBtn.onclick=seqPostpone;e.sequenceAbortBtn.onclick=discardActive;
e.cancelFinishBtn.onclick=()=>closeModal(e.finishModal);e.saveFinishBtn.onclick=saveFinish;e.finishStars.querySelectorAll("button").forEach(b=>b.onclick=()=>{finishRating=Number(b.dataset.rating);renderStars()});e.prevMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar()};e.nextMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar()};e.calendarAthleteSelect.onchange=renderCalendar;e.statsAthleteSelect.onchange=renderStats;

sb.auth.onAuthStateChange(async(_event,newSession)=>{session=newSession;user=newSession?.user||null;await loadProfile();closeModal(e.accountModal);await route()});
(async function init(){const {data}=await sb.auth.getSession();session=data.session;user=session?.user||null;await loadProfile();if(new URLSearchParams(location.search).get("register")==="1"&&!user)openModal(e.registerModal);await route()})();
})();