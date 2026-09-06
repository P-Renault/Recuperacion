(() => {
  const KEY = "recuperacion_v2_data";
  const defaults = {
    habits: [
      {id: crypto.randomUUID(), name:"Dormir y descansar adecuadamente", done:false},
      {id: crypto.randomUUID(), name:"Tomar agua y alimentarme", done:false},
      {id: crypto.randomUUID(), name:"Cumplir mi rutina", done:false},
      {id: crypto.randomUUID(), name:"Evitar situaciones de riesgo", done:false}
    ],
    moods: []
  };
  let data = load();

  const $ = s => document.querySelector(s);
  const today = () => new Date().toISOString().slice(0,10);
  const dateText = d => new Intl.DateTimeFormat("es-CL",{dateStyle:"full"}).format(new Date(d+"T12:00:00"));

  $("#todayLabel").textContent = dateText(today());
  $("#anxiety").addEventListener("input", e => $("#anxietyValue").textContent=e.target.value);
  $("#craving").addEventListener("input", e => $("#cravingValue").textContent=e.target.value);

  document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.go)));

  function showTab(name){
    document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
    $("#tab-"+name).classList.add("active");
    if(name==="historial") renderHistory();
    if(name==="habitos") renderHabits();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  $("#moodForm").addEventListener("submit", async e => {
    e.preventDefault();
    const entry = {
      id: crypto.randomUUID(), date: today(),
      mood: Number($("#mood").value), anxiety: Number($("#anxiety").value),
      craving: Number($("#craving").value), thoughts: $("#thoughts").value.trim(),
      trigger: $("#trigger").value.trim(), healthyAction: $("#healthyAction").value.trim(),
      created_at: new Date().toISOString()
    };
    data.moods = [entry, ...data.moods.filter(x=>x.date!==today())];
    save();
    $("#moodStatus").textContent = "✓ Ficha guardada correctamente.";
    await syncMood(entry);
    updateDashboard();
    setTimeout(()=>$("#moodStatus").textContent="",2500);
  });

  $("#habitForm").addEventListener("submit", e => {
    e.preventDefault();
    const name=$("#habitName").value.trim(); if(!name)return;
    data.habits.push({id:crypto.randomUUID(),name,done:false});
    $("#habitName").value=""; save(); renderHabits(); updateDashboard();
  });

  function renderHabits(){
    const box=$("#habitList");
    if(!data.habits.length){box.innerHTML='<div class="empty">Todavía no tienes hábitos registrados.</div>';return;}
    box.innerHTML=data.habits.map(h=>`
      <div class="habit">
        <input type="checkbox" ${h.done?"checked":""} data-habit="${h.id}">
        <span class="name">${escapeHtml(h.name)}</span>
        <button class="delete" data-delete="${h.id}">Eliminar</button>
      </div>`).join("");
    box.querySelectorAll("[data-habit]").forEach(c=>c.addEventListener("change",()=>{
      const h=data.habits.find(x=>x.id===c.dataset.habit); if(h)h.done=c.checked; save(); updateDashboard();
    }));
    box.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{
      data.habits=data.habits.filter(x=>x.id!==b.dataset.delete); save(); renderHabits(); updateDashboard();
    }));
  }

  function renderHistory(){
    const box=$("#historyList");
    if(!data.moods.length){box.innerHTML='<div class="empty">Aún no hay fichas de ánimo registradas.</div>';return;}
    box.innerHTML=data.moods.slice(0,30).map(x=>`
      <article class="history">
        <strong>${dateText(x.date)} · Ánimo ${x.mood}/5</strong>
        <small>Ansiedad ${x.anxiety}/10 · Impulso ${x.craving}/10</small>
        ${x.thoughts?`<p><b>Lo que sentía:</b> ${escapeHtml(x.thoughts)}</p>`:""}
        ${x.trigger?`<p><b>Situación:</b> ${escapeHtml(x.trigger)}</p>`:""}
        ${x.healthyAction?`<p><b>Decisión saludable:</b> ${escapeHtml(x.healthyAction)}</p>`:""}
      </article>`).join("");
  }

  function updateDashboard(){
    const m=data.moods.find(x=>x.date===today());
    $("#moodSummary").textContent=m?`${m.mood}/5`:"Sin registrar";
    $("#habitSummary").textContent=`${data.habits.filter(x=>x.done).length} / ${data.habits.length}`;
  }

  function load(){
    try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")};}
    catch{return structuredClone(defaults);}
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(data));}
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

  async function syncMood(entry){
    const cfg=window.SUPABASE_CONFIG||{};
    if(!cfg.url||!cfg.anonKey)return;
    try{
      const r=await fetch(cfg.url+"/rest/v1/mood_entries",{
        method:"POST",headers:{
          "apikey":cfg.anonKey,"Authorization":"Bearer "+cfg.anonKey,
          "Content-Type":"application/json","Prefer":"resolution=merge-duplicates"
        },body:JSON.stringify(entry)
      });
      if(!r.ok) console.warn("Supabase:",await r.text());
    }catch(err){console.warn("Supabase no disponible:",err);}
  }

  // PWA
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt",e=>{
    e.preventDefault(); deferredPrompt=e; $("#installBtn").hidden=false;
  });
  $("#installBtn").addEventListener("click",async()=>{
    if(!deferredPrompt)return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("#installBtn").hidden=true;
  });

  renderHabits(); renderHistory(); updateDashboard();
})();