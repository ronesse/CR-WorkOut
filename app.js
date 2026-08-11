(() => {
"use strict";
const SUPABASE_URL="https://lannjcyihlyvvzecefrs.supabase.co";
const SUPABASE_KEY="sb_publishable_q1eHMt-EqiUGnjRF1bUt3A_s8beQVaM";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const $=id=>document.getElementById(id), e={};
["accountBtn","landingScreen","athleteScreen","coachScreen","calendarScreen","statsScreen","bottomNav","athletesNavBtn","openLoginBtn","openRegisterBtn","athleteStatusCard","athleteStatusTitle","athleteStatusText","assignedProgramsWrap","assignedPrograms","activeSessionCard","activeSessionName","activeStartedAt","activeElapsed","finishSessionBtn","athleteSessionCount","athleteMinutes","athleteAvgRating","copyInviteBtn","pendingCount","activeAthletesCount","sessionsTodayCount","notificationFeed","athletesList","calendarSubtitle","calendarAthleteSelect","prevMonthBtn","nextMonthBtn","calendarTitle","calendarGrid","calendarDetails","statsSubtitle","statsAthleteSelect","statSessions","statMinutes","statRating","statCompleted","programStats","accountModal","accountTitle","closeAccountBtn","authLoggedOut","authLoggedIn","loginEmail","loginPassword","loginBtn","showRegisterBtn","loginMessage","accountName","accountEmail","logoutBtn","registerModal","closeRegisterBtn","regName","regPhone","regEmail","regPassword","registerBtn","registerMessage","programModal","programAthleteName","closeProgramBtn","programChecklist","saveProgramsBtn","finishModal","finishSummary","finishStars","finishComment","saveFinishBtn","cancelFinishBtn"].forEach(id=>e[id]=$(id));

let session=null,user=null,profile=null,athletes=[],programs=[],selectedAthleteId="",programAthleteId=null,activeSession=null,activeTimer=null,finishRating=4,currentMonth=new Date(),realtimeChannel=null;

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function fmtDate(iso){return new Intl.DateTimeFormat("nb-NO",{dateStyle:"medium",timeStyle:"short"}).format(new Date(iso))}
function dateKey(d){const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function elapsed(from,to=new Date()){return Math.max(0,Math.floor((new Date(to)-new Date(from))/1000))}
function fmtElapsed(sec){return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`}

function showOnly(name){
  ["landing","athlete","coach","calendar","stats"].forEach(n=>e[n+"Screen"].classList.toggle("hidden",n!==name));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",(name==="athlete"&&b.dataset.screen==="home")||(name==="coach"&&b.dataset.screen==="home")||b.dataset.screen===name));
}
function openModal(m){m.classList.remove("hidden")} function closeModal(m){m.classList.add("hidden")}

async function loadProfile(){
  if(!user){profile=null;return}
  const {data,error}=await sb.from("cr_profiles").select("*").eq("id",user.id).maybeSingle();
  if(error)console.error(error);
  profile=data||null;
}
function updateAccount(){
  const logged=!!user;
  e.authLoggedOut.classList.toggle("hidden",logged);e.authLoggedIn.classList.toggle("hidden",!logged);
  if(logged){e.accountName.textContent=profile?.full_name||user.email;e.accountEmail.textContent=user.email;e.accountTitle.textContent=profile?.role==="coach"?"Coach-konto":"Min konto"}
}
async function route(){
  updateAccount();
  if(!user){e.bottomNav.classList.add("hidden");showOnly("landing");return}
  e.bottomNav.classList.remove("hidden");
  const coach=profile?.role==="coach";
  e.athletesNavBtn.classList.toggle("hidden",!coach);
  e.calendarAthleteSelect.classList.toggle("hidden",!coach);e.statsAthleteSelect.classList.toggle("hidden",!coach);
  if(coach){await loadCoachData();showOnly("coach");startRealtime()}
  else{await loadAthleteData();showOnly("athlete")}
}

async function login(){
  e.loginMessage.textContent="Logger inn…";
  const {error}=await sb.auth.signInWithPassword({email:e.loginEmail.value.trim(),password:e.loginPassword.value});
  e.loginMessage.textContent=error?error.message:"";
}
function coachIdFromUrl(){return new URLSearchParams(location.search).get("coach")||""}
async function register(){
  const name=e.regName.value.trim(),phone=e.regPhone.value.trim(),email=e.regEmail.value.trim(),password=e.regPassword.value;
  if(!name||!phone||!email||password.length<6){e.registerMessage.textContent="Fyll ut alle feltene. Passord må ha minst 6 tegn.";return}
  e.registerMessage.textContent="Registrerer…";
  const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{full_name:name,phone,coach_id:coachIdFromUrl()}}});
  if(error){e.registerMessage.textContent=error.message;return}
  e.registerMessage.textContent=data.session?"Registrert og innlogget.":"Registrert. Sjekk e-post og bekreft kontoen.";
}
async function logout(){await sb.auth.signOut();closeModal(e.accountModal)}

async function loadPrograms(){
  const {data}=await sb.from("cr_programs").select("*").eq("active",true).order("sort_order");
  programs=data||[];
}
async function loadAthleteData(){
  await loadPrograms();
  const {data:sessions}=await sb.from("cr_workout_sessions").select("*").eq("athlete_id",user.id).order("started_at",{ascending:false});
  const all=sessions||[];
  activeSession=all.find(x=>x.status==="started")||null;
  e.athleteSessionCount.textContent=all.filter(x=>x.status==="completed").length;
  const completed=all.filter(x=>x.status==="completed");
  e.athleteMinutes.textContent=Math.round(completed.reduce((sum,x)=>sum+(x.duration_seconds||0),0)/60);
  const ratings=completed.filter(x=>x.rating).map(x=>x.rating);
  e.athleteAvgRating.textContent=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";

  const approved=!!profile?.approved;
  e.athleteStatusCard.className="status-card "+(approved?"approved":"pending");
  e.athleteStatusTitle.textContent=approved?"Godkjent utøver":"Venter på godkjenning";
  e.athleteStatusText.textContent=approved?"Du har tilgang til programmene coachen har tildelt deg.":"Coachen må godkjenne kontoen før programmene blir tilgjengelige.";
  e.assignedProgramsWrap.classList.toggle("hidden",!approved);

  if(approved){
    const {data:assignments}=await sb.from("cr_athlete_programs").select("program_id").eq("athlete_id",user.id).eq("enabled",true);
    const ids=new Set((assignments||[]).map(x=>x.program_id));
    renderPrograms(programs.filter(p=>ids.has(p.id)));
  }
  renderActiveSession();
}
function renderPrograms(list){
  e.assignedPrograms.innerHTML=list.length?list.map(p=>`<article class="program-card"><span>${p.icon||"🏋️"}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><button class="primary-btn start-program" data-id="${p.id}">Start økt</button></article>`).join(""):`<div class="empty">Ingen programmer er tildelt ennå.</div>`;
  e.assignedPrograms.querySelectorAll(".start-program").forEach(b=>b.onclick=()=>startSession(b.dataset.id));
}
async function startSession(programId){
  if(activeSession){alert("Du har allerede en aktiv økt.");return}
  const p=programs.find(x=>x.id===programId);
  const {data,error}=await sb.from("cr_workout_sessions").insert({athlete_id:user.id,program_id:programId,program_name:p.name,status:"started",started_at:new Date().toISOString()}).select().single();
  if(error){alert(error.message);return}
  activeSession=data;renderActiveSession();
}
function renderActiveSession(){
  e.activeSessionCard.classList.toggle("hidden",!activeSession);
  if(!activeSession){clearInterval(activeTimer);return}
  e.activeSessionName.textContent=activeSession.program_name;e.activeStartedAt.textContent=fmtDate(activeSession.started_at);
  const tick=()=>e.activeElapsed.textContent=fmtElapsed(elapsed(activeSession.started_at));
  tick();clearInterval(activeTimer);activeTimer=setInterval(tick,1000);
}
function renderStars(){e.finishStars.querySelectorAll("button").forEach(b=>b.textContent=Number(b.dataset.rating)<=finishRating?"★":"☆")}
function openFinish(){if(!activeSession)return;finishRating=4;e.finishComment.value="";e.finishSummary.textContent=`${activeSession.program_name} · ${fmtElapsed(elapsed(activeSession.started_at))}`;renderStars();openModal(e.finishModal)}
async function saveFinish(){
  const ended=new Date(),duration=elapsed(activeSession.started_at,ended);
  const {error}=await sb.from("cr_workout_sessions").update({status:"completed",completed_at:ended.toISOString(),duration_seconds:duration,rating:finishRating,comment:e.finishComment.value.trim()}).eq("id",activeSession.id);
  if(error){alert(error.message);return}
  activeSession=null;closeModal(e.finishModal);await loadAthleteData();
}

async function loadCoachData(){
  await loadPrograms();
  const {data:links}=await sb.from("cr_coach_athletes").select("athlete_id,status,cr_profiles!cr_coach_athletes_athlete_id_fkey(*)").eq("coach_id",user.id).order("created_at");
  athletes=(links||[]).map(x=>({...x.cr_profiles,link_status:x.status}));
  const ids=athletes.map(a=>a.id);
  e.pendingCount.textContent=athletes.filter(a=>!a.approved).length;e.activeAthletesCount.textContent=athletes.filter(a=>a.approved).length;
  let today=0;
  if(ids.length){const from=new Date();from.setHours(0,0,0,0);const {count}=await sb.from("cr_workout_sessions").select("*",{count:"exact",head:true}).in("athlete_id",ids).gte("started_at",from.toISOString());today=count||0}
  e.sessionsTodayCount.textContent=today;
  renderAthletes();fillAthleteSelectors();
}
function renderAthletes(){
  e.athletesList.innerHTML=athletes.length?athletes.map(a=>`<div class="athlete-item"><div class="athlete-row"><div><strong>${esc(a.full_name||a.email)}</strong><small>${esc(a.phone||"")} · ${esc(a.email||"")}</small><small>${a.approved?"✅ Godkjent":"⏳ Venter på godkjenning"}</small></div><div class="athlete-actions">${!a.approved?`<button class="approve-btn" data-id="${a.id}">Godkjenn</button>`:""}<button class="programs-btn" data-id="${a.id}">Programmer</button></div></div></div>`).join(""):`<div class="empty">Ingen utøvere har registrert seg ennå.</div>`;
  e.athletesList.querySelectorAll(".approve-btn").forEach(b=>b.onclick=()=>approveAthlete(b.dataset.id));
  e.athletesList.querySelectorAll(".programs-btn").forEach(b=>b.onclick=()=>openPrograms(b.dataset.id));
}
async function approveAthlete(id){
  const {error}=await sb.from("cr_profiles").update({approved:true}).eq("id",id);if(error){alert(error.message);return}
  await sb.from("cr_coach_athletes").update({status:"approved"}).eq("coach_id",user.id).eq("athlete_id",id);
  await loadCoachData();
}
async function openPrograms(id){
  programAthleteId=id;const a=athletes.find(x=>x.id===id);e.programAthleteName.textContent=a?.full_name||"Utøver";
  const {data}=await sb.from("cr_athlete_programs").select("program_id,enabled").eq("athlete_id",id);
  const enabled=new Set((data||[]).filter(x=>x.enabled).map(x=>x.program_id));
  e.programChecklist.innerHTML=programs.map(p=>`<label class="program-check"><span><strong>${esc(p.name)}</strong><small>${esc(p.description||"")}</small></span><input type="checkbox" data-id="${p.id}" ${enabled.has(p.id)?"checked":""}></label>`).join("");
  openModal(e.programModal);
}
async function savePrograms(){
  const rows=[...e.programChecklist.querySelectorAll("input")].map(i=>({athlete_id:programAthleteId,program_id:i.dataset.id,enabled:i.checked}));
  const {error}=await sb.from("cr_athlete_programs").upsert(rows,{onConflict:"athlete_id,program_id"});if(error){alert(error.message);return}closeModal(e.programModal);
}
function inviteUrl(){return `${location.origin}${location.pathname}?register=1&coach=${user.id}`}
async function copyInvite(){await navigator.clipboard.writeText(inviteUrl());alert("Registreringslenken er kopiert.")}

function startRealtime(){
  if(realtimeChannel)sb.removeChannel(realtimeChannel);
  realtimeChannel=sb.channel("cr-workout-coach")
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"cr_workout_sessions"},payload=>handleRealtime(payload.new))
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"cr_workout_sessions"},payload=>handleRealtime(payload.new))
    .subscribe();
}
function handleRealtime(row){
  if(!athletes.some(a=>a.id===row.athlete_id))return;
  const a=athletes.find(x=>x.id===row.athlete_id),completed=row.status==="completed";
  const div=document.createElement("div");div.className="notification-item";div.innerHTML=`<strong>${completed?"✅":"🟢"} ${esc(a.full_name||a.email)} ${completed?"fullførte":"startet"} ${esc(row.program_name)}</strong><small>${completed&&row.rating?`Rating ${"★".repeat(row.rating)} · `:""}${fmtDate(completed?row.completed_at:row.started_at)}</small>`;
  if(e.notificationFeed.querySelector(".empty"))e.notificationFeed.innerHTML="";
  e.notificationFeed.prepend(div);loadCoachData();
}

function fillAthleteSelectors(){
  const opts=[`<option value="">Alle utøvere</option>`,...athletes.filter(a=>a.approved).map(a=>`<option value="${a.id}">${esc(a.full_name||a.email)}</option>`)].join("");
  e.calendarAthleteSelect.innerHTML=opts;e.statsAthleteSelect.innerHTML=opts;
}
async function sessionsForView(selected=""){
  if(profile?.role==="coach"){
    const ids=selected?[selected]:athletes.filter(a=>a.approved).map(a=>a.id);if(!ids.length)return[];
    const {data}=await sb.from("cr_workout_sessions").select("*").in("athlete_id",ids).order("started_at",{ascending:false});return data||[];
  }
  const {data}=await sb.from("cr_workout_sessions").select("*").eq("athlete_id",user.id).order("started_at",{ascending:false});return data||[];
}
async function renderCalendar(){
  const selected=e.calendarAthleteSelect.value||"",sessions=await sessionsForView(selected),y=currentMonth.getFullYear(),m=currentMonth.getMonth();
  e.calendarSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";
  e.calendarTitle.textContent=new Intl.DateTimeFormat("nb-NO",{month:"long",year:"numeric"}).format(currentMonth);e.calendarGrid.innerHTML="";
  const first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();
  for(let i=0;i<42;i++){let day,dm=m;if(i<offset){day=prev-offset+i+1;dm=m-1}else if(i>=offset+days){day=i-offset-days+1;dm=m+1}else day=i-offset+1;const d=new Date(y,dm,day),key=dateKey(d),count=sessions.filter(x=>dateKey(new Date(x.started_at))===key).length,b=document.createElement("button");b.className="calendar-day"+(key===dateKey(new Date())?" today":"");b.innerHTML=`${day}${count?`<span class="day-count">${count}</span>`:""}`;b.onclick=()=>renderCalendarDetails(key,sessions);e.calendarGrid.appendChild(b)}
  e.calendarDetails.innerHTML="";
}
function renderCalendarDetails(key,sessions){
  const list=sessions.filter(x=>dateKey(new Date(x.started_at))===key);e.calendarDetails.innerHTML=list.length?list.map(x=>`<div class="notification-item"><strong>${esc(x.program_name)}</strong><small>${fmtDate(x.started_at)} · ${x.status==="completed"?"Fullført":"Startet"}${x.rating?` · ${"★".repeat(x.rating)}`:""}</small>${x.comment?`<p>${esc(x.comment)}</p>`:""}</div>`).join(""):`<div class="empty">Ingen økter.</div>`;
}
async function renderStats(){
  const selected=e.statsAthleteSelect.value||"",sessions=await sessionsForView(selected),completed=sessions.filter(x=>x.status==="completed"),ratings=completed.filter(x=>x.rating).map(x=>x.rating);
  e.statsSubtitle.textContent=profile?.role==="coach"?(selected?(athletes.find(a=>a.id===selected)?.full_name||"Utøver"):"Alle utøvere"):"Mine økter";
  e.statSessions.textContent=sessions.length;e.statMinutes.textContent=Math.round(completed.reduce((s,x)=>s+(x.duration_seconds||0),0)/60);e.statRating.textContent=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";e.statCompleted.textContent=sessions.length?`${Math.round(completed.length/sessions.length*100)}%`:"0%";
  const counts={};completed.forEach(x=>counts[x.program_name]=(counts[x.program_name]||0)+1);const entries=Object.entries(counts),max=Math.max(1,...entries.map(x=>x[1]));e.programStats.innerHTML=entries.length?entries.map(([n,v])=>`<div class="bar-row"><span>${esc(n)}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join(""):`<div class="empty">Ingen fullførte økter ennå.</div>`;
}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=async()=>{const n=b.dataset.screen;if(n==="home"){if(profile?.role==="coach"){await loadCoachData();showOnly("coach")}else{await loadAthleteData();showOnly("athlete")}}else if(n==="coach"){await loadCoachData();showOnly("coach")}else if(n==="calendar"){await renderCalendar();showOnly("calendar")}else if(n==="stats"){await renderStats();showOnly("stats")}});
e.accountBtn.onclick=()=>{updateAccount();openModal(e.accountModal)};e.closeAccountBtn.onclick=()=>closeModal(e.accountModal);e.openLoginBtn.onclick=()=>openModal(e.accountModal);e.openRegisterBtn.onclick=()=>openModal(e.registerModal);e.showRegisterBtn.onclick=()=>{closeModal(e.accountModal);openModal(e.registerModal)};e.closeRegisterBtn.onclick=()=>closeModal(e.registerModal);e.loginBtn.onclick=login;e.registerBtn.onclick=register;e.logoutBtn.onclick=logout;e.copyInviteBtn.onclick=copyInvite;e.closeProgramBtn.onclick=()=>closeModal(e.programModal);e.saveProgramsBtn.onclick=savePrograms;e.finishSessionBtn.onclick=openFinish;e.cancelFinishBtn.onclick=()=>closeModal(e.finishModal);e.saveFinishBtn.onclick=saveFinish;e.finishStars.querySelectorAll("button").forEach(b=>b.onclick=()=>{finishRating=Number(b.dataset.rating);renderStars()});e.prevMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar()};e.nextMonthBtn.onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar()};e.calendarAthleteSelect.onchange=renderCalendar;e.statsAthleteSelect.onchange=renderStats;

sb.auth.onAuthStateChange(async(_event,newSession)=>{session=newSession;user=newSession?.user||null;await loadProfile();closeModal(e.accountModal);await route()});

(async function init(){
  const {data}=await sb.auth.getSession();session=data.session;user=session?.user||null;await loadProfile();
  if(new URLSearchParams(location.search).get("register")==="1"&&!user)openModal(e.registerModal);
  await route();
})();
})();