import { createClient } from '@supabase/supabase-js'
import './style.css'

type Mood = {
  entry_date:string; sleep_hours:number|''; exercise_minutes:number|'';
  racing_thoughts:string; anguish_desperation:string; irritability:string;
  elevated_mood:string; low_mood:string; menstrual_period:string;
  psychosis:string; alcohol_marijuana:string; notes:string
}
type Medication={id?:string; medication_name:string; daily_dose:string; doses_per_day:number}
type MedLog={medication_id:string; entry_date:string; taken:boolean; doses_taken:number}
type Routine={id?:string;start_time:string;title:string;notes:string;active?:boolean}

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL||''
const supabaseKey=import.meta.env.VITE_SUPABASE_ANON_KEY||''
const db=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey):null
const STORE='recuperacion-v3'
const today=()=>new Date().toLocaleDateString('en-CA')
const esc=(v:any)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]!))
const levels=['Sin registro','Leve','Moderado','Marcado','Severo']
let tab='mood', moods:Mood[]=[], meds:Medication[]=[], logs:MedLog[]=[], routine:Routine[]=[]
let reminder=localStorage.getItem(`${STORE}:reminder`)||'21:00'

const defaultMood=():Mood=>({entry_date:today(),sleep_hours:'',exercise_minutes:'',racing_thoughts:'',anguish_desperation:'',irritability:'',elevated_mood:'',low_mood:'',menstrual_period:'',psychosis:'',alcohol_marijuana:'',notes:''})
const read=<T,>(k:string,d:T):T=>{try{return JSON.parse(localStorage.getItem(`${STORE}:${k}`)||JSON.stringify(d))}catch{return d}}
const write=(k:string,v:any)=>localStorage.setItem(`${STORE}:${k}`,JSON.stringify(v))
const uid=async()=>{if(!db)return null;const {data}=await db.auth.getUser();return data.user?.id||null}

async function load(){
  moods=read<Mood[]>('moods',[]); meds=read<Medication[]>('meds',[]); logs=read<MedLog[]>('logs',[])
  routine=read<Routine[]>('routine',[
    {start_time:'06:00',title:'Levantarse',notes:''},{start_time:'06:15',title:'Higiene personal',notes:''},
    {start_time:'06:30',title:'Desayuno',notes:''},{start_time:'07:00',title:'Planificar el día',notes:''},
    {start_time:'13:00',title:'Almuerzo',notes:''},{start_time:'18:00',title:'Actividad física',notes:''},
    {start_time:'21:00',title:'Completar ficha del ánimo',notes:''},{start_time:'23:00',title:'Dormir',notes:''}
  ])
  if(db){const u=await uid();if(u){
    const [a,b,c,d]=await Promise.all([
      db.from('mood_daily').select('*').order('entry_date',{ascending:false}),
      db.from('mood_medications').select('*').eq('active',true),
      db.from('mood_medication_logs').select('*').order('entry_date',{ascending:false}),
      db.from('routine_items').select('*').eq('active',true).order('start_time')
    ])
    if(a.data)moods=a.data as Mood[]; if(b.data)meds=b.data as Medication[]; if(c.data)logs=c.data as MedLog[]; if(d.data?.length)routine=d.data as Routine[]
  }}
  schedule(); render()
}
function current(){return moods.find(x=>x.entry_date===today())||defaultMood()}
function render(){
 document.querySelector('#root')!.innerHTML=`<main>
 <header class="top"><div><small>RECUPERACIÓN · ${new Date().toLocaleDateString('es-CL')}</small><h1>Mi día</h1></div>
 <button class="primary" onclick="window.mood()">Completar mi ficha del ánimo</button></header>
 <section class="hero"><div><span>● HOY</span><h2>Un día a la vez, pero todos los días.</h2><p>${complete(current())?'Ficha de hoy registrada':'Ficha de hoy pendiente'}</p></div>
 <div class="score">${score(current())}<small>indicadores marcados</small></div></section>
 <nav>${btn('mood','Completar mi ficha del ánimo')}${btn('analysis','Análisis mensual')}${btn('routine','Horario diario')}</nav>
 <div id="content"></div></main>`
 renderTab()
}
function btn(id:string,label:string){return `<button class="${tab===id?'active':''}" onclick="window.tab('${id}')">${label}</button>`}
function renderTab(){const c=document.querySelector('#content')!;if(tab==='analysis')c.innerHTML=analysis();else if(tab==='routine')c.innerHTML=routineView();else c.innerHTML=moodForm(current())}
function checklist(name:keyof Mood,label:string,value:string){
 return `<div class="checkrow"><b>${label}</b><div class="checks">${levels.map(x=>`<label class="${value===x?'on':''}"><input type="radio" name="${name}" value="${x}" ${value===x?'checked':''}>${x}</label>`).join('')}</div></div>`
}
function moodForm(m:Mood){
 const medsHtml=meds.map(x=>{const l=logs.find(z=>z.medication_id===x.id&&z.entry_date===today());return `<div class="med-row"><div><b>${esc(x.medication_name)}</b><small>Dosis diaria: ${esc(x.daily_dose||'—')} · ${x.doses_per_day} toma(s)</small></div><label class="take"><input type="checkbox" data-med="${esc(x.id||'')}" ${l?.taken?'checked':''}> Tomado hoy</label><input class="dose-taken" data-dose="${esc(x.id||'')}" type="number" min="0" max="20" value="${l?.doses_taken??0}" title="N.º de tomas realizadas"></div>`}).join('')
 return `<section class="card"><div class="section-head"><div><small>CARTA DEL ÁNIMO · REGISTRO DIARIO</small><h2>Completar mi ficha del ánimo</h2></div><input id="date" type="date" value="${esc(m.entry_date)}"></div>
 <div class="daily-columns"><div class="labels"><div class="orange head">MEDICAMENTOS</div><div class="orange">Dosis diaria</div><div class="orange">N.º de veces / tomas</div></div>
 <div class="med-list">${medsHtml||'<p class="muted">No hay medicamentos configurados. Puedes añadirlos abajo; no se escribe ningún nombre automáticamente.</p>'}</div></div>
 <button class="secondary" onclick="window.addMed()">+ Configurar medicamento</button>
 <div class="basic-grid">
  <label><b>Horas totales de sueño</b><input data-field="sleep_hours" type="number" min="0" max="24" step=".5" value="${esc(m.sleep_hours)}"></label>
  <label><b>Ejercicio</b><input data-field="exercise_minutes" type="number" min="0" max="600" value="${esc(m.exercise_minutes)}" placeholder="Minutos"></label>
 </div>
 ${checklist('racing_thoughts','Pensamiento acelerado',m.racing_thoughts)}
 ${checklist('anguish_desperation','Angustia / desesperación',m.anguish_desperation)}
 <div class="band">IRRITABILIDAD</div>
 ${checklist('irritability','Nivel',m.irritability)}
 <div class="band yellow">ÁNIMO ELEVADO</div>
 ${checklist('elevated_mood','Nivel',m.elevated_mood)}
 <div class="stable">ESTABLE <span>○</span></div>
 <div class="band orange2">ÁNIMO BAJO</div>
 ${checklist('low_mood','Nivel',m.low_mood)}
 ${simpleCheck('menstrual_period','PERÍODO MENSTRUAL',m.menstrual_period)}
 ${simpleCheck('psychosis','PSICOSIS',m.psychosis)}
 ${simpleCheck('alcohol_marijuana','ALCOHOL / MARIHUANA',m.alcohol_marijuana)}
 <label class="notes"><b>Observaciones del día</b><textarea id="notes">${esc(m.notes)}</textarea></label>
 <div class="actions"><button class="primary" onclick="window.saveMood()">Guardar ficha del día</button><button onclick="window.tab('analysis')">Ver carta mensual</button></div>
 </section>`
}
function simpleCheck(name:keyof Mood,label:string,value:string){return `<div class="simple"><b>${label}</b><div class="checks">${['Sí','No','Sin registro'].map(x=>`<label class="${value===x?'on':''}"><input type="radio" name="${name}" value="${x}" ${value===x?'checked':''}>${x}</label>`).join('')}</div></div>`}
function complete(m:Mood){return Boolean(m.sleep_hours!==''||m.exercise_minutes!==''||m.racing_thoughts||m.anguish_desperation||m.irritability||m.elevated_mood||m.low_mood||m.menstrual_period||m.psychosis||m.alcohol_marijuana||m.notes)}
function score(m:Mood){return [m.racing_thoughts,m.anguish_desperation,m.irritability,m.elevated_mood,m.low_mood,m.menstrual_period,m.psychosis,m.alcohol_marijuana].filter(Boolean).length}
async function saveMood(){
 const m=current(), e:any={...m,entry_date:(document.querySelector('#date') as HTMLInputElement).value||today(),notes:(document.querySelector('#notes') as HTMLTextAreaElement).value}
 document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-field]').forEach(x=>(e[x.dataset.field!]=x.value))
 document.querySelectorAll<HTMLInputElement>('input[type=radio]:checked').forEach(x=>e[x.name]=x.value)
 const i=moods.findIndex(x=>x.entry_date===e.entry_date);if(i>=0)moods[i]=e;else moods.push(e);write('moods',moods)
 if(db){const u=await uid();if(u)await db.from('mood_daily').upsert({...e,user_id:u},{onConflict:'user_id,entry_date'})}
 for(const el of document.querySelectorAll<HTMLInputElement>('[data-med]')){const id=el.dataset.med;if(!id)continue;const dose=(document.querySelector(`[data-dose="${CSS.escape(id)}"]`) as HTMLInputElement)?.value||'0';const l={medication_id:id,entry_date:e.entry_date,taken:el.checked,doses_taken:Number(dose)};logs=logs.filter(x=>!(x.medication_id===id&&x.entry_date===e.entry_date));logs.push(l)}
 write('logs',logs); if(db){const u=await uid();if(u)for(const l of logs.filter(x=>x.entry_date===e.entry_date)){const {data:med}=await db.from('mood_medications').select('id').eq('id',l.medication_id).maybeSingle();if(med)await db.from('mood_medication_logs').upsert({...l,user_id:u},{onConflict:'medication_id,entry_date'})}}
 alert('Ficha del ánimo guardada.');render()
}
function analysis(){
 const d=new Date(), y=d.getFullYear(), mo=d.getMonth()+1, days=new Date(y,mo,0).getDate(), month=`${y}-${String(mo).padStart(2,'0')}`
 const rows=moods.filter(x=>x.entry_date.startsWith(month)), by=(day:number)=>rows.find(x=>Number(x.entry_date.slice(-2))===day)
 const row=(label:string,key:keyof Mood)=>`<tr><th>${label}</th>${Array.from({length:31},(_,i)=>{const day=i+1;if(day>days)return '<td class="off">—</td>';const v=by(day)?.[key];return `<td class="${v&&v!=='Sin registro'?'mark':''}">${v&&v!=='Sin registro'?'✓':'·'}</td>`}).join('')}</tr>`
 return `<section class="card"><div class="section-head"><div><small>CARTA DEL ÁNIMO · ANÁLISIS</small><h2>${d.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</h2></div><span class="badge">${rows.length} días registrados</span></div>
 <p class="muted">Se conserva la lógica visual de la carta: días del mes en columnas 1–31 y cada indicador en su propia fila. Esta vista es para análisis y comparación; la ficha diaria se completa en la pestaña anterior.</p>
 <div class="month-wrap"><table class="month"><thead><tr><th>INDICADOR</th>${Array.from({length:31},(_,i)=>`<th>${i+1}</th>`).join('')}</tr></thead><tbody>
 ${row('Horas de sueño','sleep_hours')}${row('Ejercicio','exercise_minutes')}${row('Pensamiento acelerado','racing_thoughts')}${row('Angustia / desesperación','anguish_desperation')}
 <tr class="section"><th>IRRITABILIDAD</th>${Array.from({length:31},(_,i)=>`<td>${by(i+1)?.irritability&&by(i+1)?.irritability!=='Sin registro'?'✓':'·'}</td>`).join('')}</tr>
 ${row('Ánimo elevado','elevated_mood')}<tr class="stable"><th>ESTABLE</th>${Array.from({length:31},()=>'<td>○</td>').join('')}</tr>
 ${row('Ánimo bajo','low_mood')}${row('Período menstrual','menstrual_period')}${row('Psicosis','psychosis')}${row('Alcohol / marihuana','alcohol_marijuana')}
 </tbody></table></div></section>`
}
function routineView(){return `<section class="card"><div class="section-head"><div><small>HORARIO</small><h2>Rutinas diarias</h2></div><button class="primary" onclick="window.editRoutine()">+ Agregar actividad</button></div><div class="routine">${routine.slice().sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(r=>`<div><b>${esc(r.start_time)}</b><span><strong>${esc(r.title)}</strong><small>${esc(r.notes)}</small></span><button onclick="window.editRoutine('${esc(r.id||'')}')">Editar</button>${r.id?`<button class="danger" onclick="window.delRoutine('${esc(r.id)}')">Eliminar</button>`:''}</div>`).join('')}</div><hr><h3>Recordatorio de la ficha</h3><div class="rem"><input id="rem" type="time" value="${esc(reminder)}"><button onclick="window.saveRem()">Guardar</button><button onclick="window.notify()">Activar notificación</button></div></section>`}
function addMed(){document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="medModal"><div class="box"><h2>Configurar medicamento</h2><label>Medicamento<input id="mn" placeholder="Escribe el nombre"></label><label>Dosis diaria<input id="md" placeholder="Ej.: según indicación"></label><label>N.º de tomas al día<input id="mt" type="number" min="1" value="1"></label><div class="actions"><button class="primary" onclick="window.saveMed()">Guardar</button><button onclick="document.querySelector('#medModal')?.remove()">Cancelar</button></div></div></div>`)}
async function saveMed(){const m={medication_name:(document.querySelector('#mn') as HTMLInputElement).value.trim(),daily_dose:(document.querySelector('#md') as HTMLInputElement).value.trim(),doses_per_day:Number((document.querySelector('#mt') as HTMLInputElement).value)||1};if(!m.medication_name)return alert('Escribe el nombre.');if(db){const u=await uid();if(u){const {data}=await db.from('mood_medications').insert({...m,user_id:u}).select().single();if(data)m.id=data.id}}meds.push(m);write('meds',meds);document.querySelector('#medModal')?.remove();render()}
function editRoutine(id=''){const r=routine.find(x=>x.id===id);document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="rt"><div class="box"><h2>${id?'Editar':'Nueva'} actividad</h2><label>Hora<input id="rtTime" type="time" value="${esc(r?.start_time||'08:00')}"></label><label>Actividad<input id="rtTitle" value="${esc(r?.title||'')}"></label><label>Notas<input id="rtNotes" value="${esc(r?.notes||'')}"></label><div class="actions"><button class="primary" onclick="window.saveRt('${esc(id)}')">Guardar</button><button onclick="document.querySelector('#rt')?.remove()">Cancelar</button></div></div></div>`)}
async function saveRt(id=''){const r:any={start_time:(document.querySelector('#rtTime') as HTMLInputElement).value,title:(document.querySelector('#rtTitle') as HTMLInputElement).value.trim(),notes:(document.querySelector('#rtNotes') as HTMLInputElement).value.trim(),active:true};if(!r.title)return alert('Escribe una actividad.');if(db){const u=await uid();if(u){if(id)await db.from('routine_items').update(r).eq('id',id);else{const {data}=await db.from('routine_items').insert({...r,user_id:u}).select().single();if(data)r.id=data.id}}}if(id)routine=routine.map(x=>x.id===id?{...x,...r}:x);else routine.push(r);write('routine',routine);document.querySelector('#rt')?.remove();tab='routine';render()}
async function delRoutine(id:string){if(!confirm('¿Eliminar esta actividad?'))return;if(db)await db.from('routine_items').delete().eq('id',id);routine=routine.filter(x=>x.id!==id);write('routine',routine);render()}
async function saveRem(){reminder=(document.querySelector('#rem') as HTMLInputElement).value||'21:00';localStorage.setItem(`${STORE}:reminder`,reminder);if(db){const u=await uid();if(u)await db.from('mood_reminders').upsert({user_id:u,reminder_time:reminder,enabled:true},{onConflict:'user_id'})}schedule();alert(`Recordatorio configurado para las ${reminder}.`)}
async function notify(){if(!('Notification'in window))return alert('El navegador no admite notificaciones.');const p=await Notification.requestPermission();if(p==='granted'){try{await navigator.serviceWorker.register('/Recuperacion/sw.js')}catch{}new Notification('Recuperación',{body:'Notificaciones activadas para tu ficha del ánimo.'});schedule()}else alert('Debes permitir las notificaciones.')}
let timer:number
function schedule(){clearTimeout(timer);const [h,m]=reminder.split(':').map(Number),t=new Date();t.setHours(h,m,0,0);if(t<=new Date())t.setDate(t.getDate()+1);timer=window.setTimeout(()=>{if(!complete(current())&&'Notification'in window&&Notification.permission==='granted')new Notification('Completar mi ficha del ánimo',{body:'Registra la carta del ánimo de hoy.'});schedule()},t.getTime()-Date.now())}
;(window as any).tab=(x:string)=>{tab=x;render()};(window as any).mood=()=>{tab='mood';render()};(window as any).saveMood=saveMood
;(window as any).addMed=addMed;(window as any).saveMed=saveMed;(window as any).editRoutine=editRoutine;(window as any).saveRt=saveRt;(window as any).delRoutine=delRoutine
;(window as any).saveRem=saveRem;(window as any).notify=notify
load()