import { createClient } from '@supabase/supabase-js'
import './style.css'

type Mood = {
  id?: string
  entry_date: string
  sleep_hours: number | ''
  exercise_minutes: number | ''
  racing_thoughts: string
  anguish_desperation: string
  irritability: string
  elevated_mood: string
  low_mood: string
  menstrual_period: string
  psychosis: string
  alcohol_marijuana: string
  notes: string
}

type Routine = { id?: string; start_time: string; title: string; notes: string; active?: boolean }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const db = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
const STORE = 'recuperacion-v2'
const today = () => new Date().toLocaleDateString('en-CA')
const esc = (v: any) => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]!))

const defaultMood = (): Mood => ({
  entry_date: today(), sleep_hours: '', exercise_minutes: '',
  racing_thoughts: '', anguish_desperation: '', irritability: '',
  elevated_mood: '', low_mood: '', menstrual_period: '', psychosis: '',
  alcohol_marijuana: '', notes: ''
})

let moodHistory: Mood[] = []
let routine: Routine[] = []
let reminderTime = localStorage.getItem(`${STORE}:reminder`) || '21:00'
let currentTab = 'today'

const levelOptions = ['Sin registro','Leve','Moderado','Marcado','Severo']

function localRead<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(`${STORE}:${key}`) || JSON.stringify(fallback)) } catch { return fallback }
}
function localWrite(key: string, value: any) { localStorage.setItem(`${STORE}:${key}`, JSON.stringify(value)) }

async function userId() {
  if (!db) return null
  const { data } = await db.auth.getUser()
  return data.user?.id || null
}

async function loadData() {
  const localMoods = localRead<Mood[]>('moods', [])
  const localRoutine = localRead<Routine[]>('routine', [
    {start_time:'06:00',title:'Levantarse',notes:''},
    {start_time:'06:15',title:'Higiene personal',notes:''},
    {start_time:'06:30',title:'Desayuno',notes:''},
    {start_time:'07:00',title:'Planificar el día',notes:''},
    {start_time:'13:00',title:'Almuerzo',notes:''},
    {start_time:'18:00',title:'Actividad física',notes:''},
    {start_time:'21:00',title:'Completar ficha del ánimo',notes:''},
    {start_time:'22:30',title:'Prepararse para dormir',notes:''},
    {start_time:'23:00',title:'Dormir',notes:''}
  ])
  moodHistory = localMoods
  routine = localRoutine
  if (db) {
    const uid = await userId()
    if (uid) {
      const [m, r, rem] = await Promise.all([
        db.from('mood_daily').select('*').order('entry_date',{ascending:false}),
        db.from('routine_items').select('*').eq('active',true).order('start_time'),
        db.from('mood_reminders').select('*').eq('user_id',uid).maybeSingle()
      ])
      if (m.data) moodHistory = m.data as Mood[]
      if (r.data && r.data.length) routine = r.data as Routine[]
      if (rem.data?.reminder_time) reminderTime = String(rem.data.reminder_time).slice(0,5)
    }
  }
  scheduleReminder()
  render()
}

function currentMood(): Mood {
  return moodHistory.find(x => x.entry_date === today()) || defaultMood()
}

function render() {
  const m = currentMood()
  document.querySelector<HTMLDivElement>('#root')!.innerHTML = `
  <main>
    <header class="top">
      <div><small>RECUPERACIÓN · ${new Date().toLocaleDateString('es-CL')}</small><h1>Mi día</h1></div>
      <button class="primary" onclick="window.openMood()">Completar ficha del ánimo</button>
    </header>

    <section class="hero">
      <div><span class="pill">● HOY</span><h2>Un día a la vez, pero todos los días.</h2>
      <p>${m.entry_date === today() && moodComplete(m) ? 'Tu ficha de hoy está registrada.' : 'Tu ficha diaria todavía está pendiente.'}</p></div>
      <div class="hero-score">${moodScore(m)}<small>estado registrado</small></div>
    </section>

    <nav class="tabs">
      ${tabButton('today','Hoy')} ${tabButton('mood','Completar mi ficha del ánimo')}
      ${tabButton('analysis','Análisis mensual')} ${tabButton('routine','Horario diario')}
    </nav>
    <div id="content"></div>
  </main>`
  renderTab()
}

function tabButton(id: string, label: string) {
  return `<button class="${currentTab===id?'active':''}" onclick="window.tab('${id}')">${label}</button>`
}

function renderTab() {
  const c = document.querySelector('#content')!
  if (currentTab === 'mood') c.innerHTML = moodForm(currentMood())
  else if (currentTab === 'analysis') c.innerHTML = analysis()
  else if (currentTab === 'routine') c.innerHTML = routineView()
  else c.innerHTML = todayView()
}

function todayView() {
  const next = routine.find(r => r.start_time >= new Date().toTimeString().slice(0,5))
  return `<div class="grid">
    <section class="card"><h2>Ficha de hoy</h2>
      ${moodSummary(currentMood())}
      <button class="primary full" onclick="window.openMood()">Abrir ficha diaria</button>
    </section>
    <section class="card"><h2>Próxima actividad</h2>
      <div class="next"><b>${next ? esc(next.start_time) : '—'}</b><span>${next ? esc(next.title) : 'Cierre del día y descanso'}</span></div>
      <h3>Recordatorio diario</h3>
      <div class="reminder"><input id="reminderTime" type="time" value="${esc(reminderTime)}">
      <button onclick="window.saveReminder()">Guardar hora</button>
      <button class="secondary" onclick="window.enableNotifications()">Activar notificaciones</button></div>
      <small class="muted">La notificación funciona como recordatorio local cuando la PWA está activa.</small>
    </section>
  </div>`
}

function moodForm(m: Mood) {
  const select = (key: keyof Mood, label: string, hint='') => `
    <label><span>${label}</span>${hint?`<small>${hint}</small>`:''}
      <select data-field="${key}">${levelOptions.map(x=>`<option ${m[key]===x?'selected':''}>${x}</option>`).join('')}</select>
    </label>`
  return `<section class="card mood-card">
    <div class="section-head"><div><small>FICHA DIARIA</small><h2>¿Cómo está tu ánimo?</h2></div>
      <input id="entryDate" type="date" value="${esc(m.entry_date)}"></div>
    <div class="form-grid">
      <label><span>Horas totales de sueño</span><input data-field="sleep_hours" type="number" min="0" max="24" step="0.5" value="${esc(m.sleep_hours)}"></label>
      <label><span>Ejercicio</span><input data-field="exercise_minutes" type="number" min="0" max="600" value="${esc(m.exercise_minutes)}" placeholder="Minutos"></label>
      ${select('racing_thoughts','Pensamiento acelerado')}
      ${select('anguish_desperation','Angustia / desesperación')}
      <fieldset><legend>Irritabilidad</legend>${levelRadio('irritability',m.irritability)}</fieldset>
      <fieldset><legend>Ánimo elevado</legend>${levelRadio('elevated_mood',m.elevated_mood)}</fieldset>
      <fieldset><legend>Ánimo bajo</legend>${levelRadio('low_mood',m.low_mood)}</fieldset>
      ${select('menstrual_period','Período menstrual','Puedes usar “No aplica”.')}
      ${select('psychosis','Psicosis')}
      ${select('alcohol_marijuana','Alcohol / marihuana')}
    </div>
    <label class="wide"><span>Notas del día</span><textarea id="moodNotes" placeholder="Observaciones, situaciones relevantes, logros o señales de alerta...">${esc(m.notes)}</textarea></label>
    <div class="actions"><button class="primary" onclick="window.saveMood()">Guardar ficha del día</button><button class="secondary" onclick="window.tab('analysis')">Ver evolución mensual</button></div>
  </section>`
}

function levelRadio(name:string, value:string) {
  return `<div class="levels">${['Leve','Moderado','Marcado','Severo'].map(x=>`<label class="${value===x?'selected':''}"><input type="radio" name="${name}" value="${x}" ${value===x?'checked':''}>${x}</label>`).join('')}</div>`
}

function moodSummary(m: Mood) {
  const fields = [['Sueño',m.sleep_hours?`${m.sleep_hours} h`:'—'],['Ejercicio',m.exercise_minutes?`${m.exercise_minutes} min`:'—'],['Irritabilidad',m.irritability||'—'],['Ánimo elevado',m.elevated_mood||'—'],['Ánimo bajo',m.low_mood||'—']]
  return `<div class="summary">${fields.map(([a,b])=>`<div><small>${a}</small><b>${esc(b)}</b></div>`).join('')}</div>`
}

function moodComplete(m:Mood) {
  return Boolean(m.sleep_hours !== '' || m.exercise_minutes !== '' || m.irritability || m.elevated_mood || m.low_mood || m.notes)
}

function moodScore(m:Mood) {
  const vals = [m.irritability,m.elevated_mood,m.low_mood,m.anguish_desperation,m.racing_thoughts,m.psychosis,m.alcohol_marijuana]
  return vals.filter(v => v && v !== 'Sin registro').length
}

function analysis() {
  const month = today().slice(0,7)
  const rows = moodHistory.filter(x=>x.entry_date.startsWith(month)).sort((a,b)=>a.entry_date.localeCompare(b.entry_date))
  const avgSleep = rows.filter(x=>x.sleep_hours!=='').reduce((a,x)=>a+Number(x.sleep_hours),0)/(rows.filter(x=>x.sleep_hours!=='').length||1)
  const avgExercise = rows.filter(x=>x.exercise_minutes!=='').reduce((a,x)=>a+Number(x.exercise_minutes),0)/(rows.filter(x=>x.exercise_minutes!=='').length||1)
  return `<section class="card"><div class="section-head"><div><small>ANÁLISIS Y EVOLUCIÓN</small><h2>${new Date().toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</h2></div>
  <span class="badge">${rows.length} días registrados</span></div>
  <div class="metrics"><div><b>${avgSleep.toFixed(1)} h</b><small>Sueño promedio</small></div><div><b>${Math.round(avgExercise)} min</b><small>Ejercicio promedio</small></div><div><b>${rows.filter(x=>x.irritability&&x.irritability!=='Sin registro').length}</b><small>Días con irritabilidad</small></div></div>
  <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Sueño</th><th>Ejercicio</th><th>Pensamiento</th><th>Angustia</th><th>Irritabilidad</th><th>Elevado</th><th>Bajo</th><th>Psicosis</th><th>Alcohol/Marihuana</th></tr></thead><tbody>
  ${rows.map(x=>`<tr><td>${esc(x.entry_date)}</td><td>${esc(x.sleep_hours)}</td><td>${esc(x.exercise_minutes)}</td><td>${esc(x.racing_thoughts)}</td><td>${esc(x.anguish_desperation)}</td><td>${esc(x.irritability)}</td><td>${esc(x.elevated_mood)}</td><td>${esc(x.low_mood)}</td><td>${esc(x.psychosis)}</td><td>${esc(x.alcohol_marijuana)}</td></tr>`).join('') || `<tr><td colspan="10" class="muted">Todavía no hay registros de este mes.</td></tr>`}
  </tbody></table></div>
  <p class="muted">La vista mensual sirve para comparar patrones y evolución. La ficha que completas diariamente siempre corresponde a un solo día.</p></section>`
}

function routineView() {
  return `<section class="card"><div class="section-head"><div><small>ORGANIZACIÓN</small><h2>Horario de rutinas diarias</h2></div><button class="primary" onclick="window.editRoutine()">+ Agregar actividad</button></div>
  <div class="routine-list">${routine.slice().sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(r=>`<div class="routine-row"><b>${esc(r.start_time)}</b><span><strong>${esc(r.title)}</strong><small>${esc(r.notes||'')}</small></span><button onclick="window.editRoutine('${esc(r.id||'')}')">Editar</button><button class="danger" onclick="window.deleteRoutine('${esc(r.id||'')}')">Eliminar</button></div>`).join('')}</div></section>`
}

function openRoutineForm(id='') {
  const r = routine.find(x=>x.id===id)
  const start = r?.start_time || '08:00', title=r?.title||'', notes=r?.notes||''
  document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="routineModal"><div class="modal-box"><h2>${id?'Editar':'Nueva'} actividad</h2>
    <label>Hora<input id="rtTime" type="time" value="${esc(start)}"></label>
    <label>Actividad<input id="rtTitle" value="${esc(title)}" placeholder="Ej.: Trabajo, ejercicio, estudio"></label>
    <label>Notas<input id="rtNotes" value="${esc(notes)}"></label>
    <div class="actions"><button class="primary" onclick="window.saveRoutine('${esc(id)}')">Guardar</button><button onclick="document.querySelector('#routineModal')?.remove()">Cancelar</button></div>
  </div></div>`)
}

async function saveRoutine(id='') {
  const item:Routine={id:id||undefined,start_time:(document.querySelector('#rtTime') as HTMLInputElement).value,title:(document.querySelector('#rtTitle') as HTMLInputElement).value.trim(),notes:(document.querySelector('#rtNotes') as HTMLInputElement).value.trim(),active:true}
  if (!item.title) return alert('Escribe una actividad.')
  if (db) {
    const uid=await userId()
    if(uid) {
      if(id) await db.from('routine_items').update({start_time:item.start_time,title:item.title,notes:item.notes,updated_at:new Date().toISOString()}).eq('id',id)
      else await db.from('routine_items').insert({...item,user_id:uid})
    }
  }
  if(id) routine=routine.map(x=>x.id===id?item:x)
  else routine.push(item)
  localWrite('routine',routine)
  document.querySelector('#routineModal')?.remove(); render()
  currentTab='routine'; renderTab()
}

async function deleteRoutine(id:string) {
  if(!id) { routine=routine.filter(x=>x.id!==id); localWrite('routine',routine); render(); currentTab='routine'; renderTab(); return }
  if(!confirm('¿Eliminar esta actividad del horario?')) return
  if(db) await db.from('routine_items').delete().eq('id',id)
  routine=routine.filter(x=>x.id!==id); localWrite('routine',routine); render(); currentTab='routine'; renderTab()
}

async function saveMood() {
  const m = currentMood()
  const entry:Mood={...m,entry_date:(document.querySelector('#entryDate') as HTMLInputElement).value || today(),notes:(document.querySelector('#moodNotes') as HTMLTextAreaElement).value}
  document.querySelectorAll<HTMLElement>('[data-field]').forEach(el=>{
    const key=el.dataset.field as keyof Mood
    if(key) (entry as any)[key]=(el as HTMLInputElement|HTMLSelectElement).value
  })
  document.querySelectorAll<HTMLInputElement>('input[type=radio]:checked').forEach(el=>(entry as any)[el.name]=el.value)
  const idx=moodHistory.findIndex(x=>x.entry_date===entry.entry_date)
  if(idx>=0) moodHistory[idx]=entry; else moodHistory.push(entry)
  localWrite('moods',moodHistory)
  if(db) {
    const uid=await userId()
    if(uid) await db.from('mood_daily').upsert({...entry,user_id:uid,updated_at:new Date().toISOString()},{onConflict:'user_id,entry_date'})
  }
  alert('Ficha del ánimo guardada.')
  currentTab='mood'; render()
}

async function saveReminder() {
  reminderTime=(document.querySelector('#reminderTime') as HTMLInputElement).value || '21:00'
  localStorage.setItem(`${STORE}:reminder`,reminderTime)
  if(db) {
    const uid=await userId()
    if(uid) await db.from('mood_reminders').upsert({user_id:uid,reminder_time:reminderTime,enabled:true,updated_at:new Date().toISOString()},{onConflict:'user_id'})
  }
  scheduleReminder()
  alert(`Recordatorio configurado para las ${reminderTime}.`)
}

async function enableNotifications() {
  if (!('Notification' in window)) return alert('Este navegador no admite notificaciones.')
  const permission=await Notification.requestPermission()
  if(permission==='granted') {
    try { await navigator.serviceWorker.register('/Recuperacion/sw.js') } catch {}
    new Notification('Recuperación', {body:`Recordatorio activado para las ${reminderTime}.`})
    scheduleReminder()
  } else alert('Debes permitir las notificaciones del navegador.')
}

let reminderTimer:number|undefined
function scheduleReminder() {
  if(reminderTimer) window.clearTimeout(reminderTimer)
  const [h,m]=reminderTime.split(':').map(Number), now=new Date(), target=new Date()
  target.setHours(h,m,0,0)
  if(target<=now) target.setDate(target.getDate()+1)
  reminderTimer=window.setTimeout(async()=>{
    const existing=currentMood()
    if(!moodComplete(existing) && 'Notification' in window && Notification.permission==='granted') {
      try { await navigator.serviceWorker.ready; new Notification('Completar mi ficha del ánimo',{body:'Tómate unos minutos para registrar cómo estás hoy.'}) } catch {}
    }
    scheduleReminder()
  }, target.getTime()-now.getTime())
}

;(window as any).tab=(t:string)=>{currentTab=t;render()}
;(window as any).openMood=()=>{currentTab='mood';render()}
;(window as any).saveMood=saveMood
;(window as any).editRoutine=openRoutineForm
;(window as any).saveRoutine=saveRoutine
;(window as any).deleteRoutine=deleteRoutine
;(window as any).saveReminder=saveReminder
;(window as any).enableNotifications=enableNotifications

loadData()