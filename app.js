(() => {
'use strict';

const KEY='recuperacion-v4';
const today=()=>new Date().toLocaleDateString('en-CA');
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(KEY+':'+k)||JSON.stringify(d))}catch{return d}};
const write=(k,v)=>localStorage.setItem(KEY+':'+k,JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const levels=['Sin registro','Leve','Moderado','Marcado','Severo'];
let tab=localStorage.getItem(KEY+':tab')||'mood';
let moods=read('moods',[]);
let meds=read('meds',[]);
let logs=read('logs',[]);
let routines=read('routines',[
 {id:crypto.randomUUID(),time:'06:00',title:'Levantarse',notes:''},
 {id:crypto.randomUUID(),time:'06:15',title:'Higiene personal',notes:''},
 {id:crypto.randomUUID(),time:'06:30',title:'Desayuno',notes:''},
 {id:crypto.randomUUID(),time:'07:00',title:'Planificar el día',notes:''},
 {id:crypto.randomUUID(),time:'13:00',title:'Almuerzo',notes:''},
 {id:crypto.randomUUID(),time:'18:00',title:'Actividad física',notes:''},
 {id:crypto.randomUUID(),time:'21:00',title:'Completar ficha del ánimo',notes:''},
 {id:crypto.randomUUID(),time:'23:00',title:'Dormir',notes:''}
]);
let reminder=localStorage.getItem(KEY+':reminder')||'21:00';

function blankMood(date=today()){return {
 date,sleep:'',exercise:'',
 racing:'',anguish:'',irritability:'',elevated:'',low:'',
 menstrual:'',psychosis:'',substances:'',notes:''
}}
function getMood(date=today()){return moods.find(x=>x.date===date)||blankMood(date)}
function complete(m){return [m.sleep,m.exercise,m.racing,m.anguish,m.irritability,m.elevated,m.low,m.menstrual,m.psychosis,m.substances,m.notes].some(Boolean)}
function mark(v){return v&&v!=='Sin registro'?'✓':'·'}

function layout(content){
 document.getElementById('app').innerHTML=`
 <header class="top">
   <div><small>RECUPERACIÓN Y RUTINA PERSONAL</small><h1>Mi día</h1></div>
   <button class="primary" data-action="mood">Completar mi ficha del ánimo</button>
 </header>
 <section class="hero">
   <div><span>● ${complete(getMood())?'FICHA DE HOY REGISTRADA':'FICHA DE HOY PENDIENTE'}</span>
   <h2>Un día a la vez.</h2><p>Registra, observa y compara tu evolución.</p></div>
   <div class="score">${[getMood().racing,getMood().anguish,getMood().irritability,getMood().elevated,getMood().low].filter(Boolean).length}<small>indicadores</small></div>
 </section>
 <nav>
   <button class="${tab==='mood'?'active':''}" data-action="mood">Carta del ánimo</button>
   <button class="${tab==='analysis'?'active':''}" data-action="analysis">Análisis mensual</button>
   <button class="${tab==='routine'?'active':''}" data-action="routine">Horario diario</button>
 </nav>
 <main>${content}</main>`;
 document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{tab=b.dataset.action;localStorage.setItem(KEY+':tab',tab);render()});
}

function choices(name,value,items=levels){
 return `<div class="choices">${items.map(x=>`<label class="${value===x?'selected':''}"><input type="radio" name="${name}" value="${esc(x)}" ${value===x?'checked':''}>${esc(x)}</label>`).join('')}</div>`;
}
function binary(name,value){return choices(name,value,['Sí','No','Sin registro'])}

function moodView(){
 const m=getMood();
 const med=meds.map(x=>{
   const l=logs.find(z=>z.medId===x.id&&z.date===m.date)||{};
   return `<div class="medrow"><div><b>${esc(x.name)}</b><small>Dosis diaria: ${esc(x.dose||'—')} · ${x.times} toma(s)</small></div>
   <label class="take"><input type="checkbox" data-med="${x.id}" ${l.taken?'checked':''}> Tomado</label>
   <input class="mini" type="number" min="0" max="20" data-doses="${x.id}" value="${l.doses??0}" aria-label="Tomas realizadas"></div>`;
 }).join('');
 return `<section class="card">
 <div class="head"><div><small>CARTA DEL ÁNIMO · REGISTRO DIARIO</small><h2>Completar mi ficha del ánimo</h2></div>
 <label>Fecha<input id="moodDate" type="date" value="${esc(m.date)}"></label></div>

 <div class="cardnote">Completa esta ficha una vez al día. La vista mensual se genera automáticamente a partir de estos registros.</div>

 <div class="strip"><b>MEDICAMENTOS</b><span>Dosis diaria</span><span>N.º de veces / tomas</span></div>
 <div class="meds">${med||'<p class="muted">No hay medicamentos configurados.</p>'}</div>
 <button class="secondary" data-action2="addMed">+ Agregar medicamento</button>

 <div class="grid2">
   <label><b>HORAS TOTALES DE SUEÑO</b><input id="sleep" type="number" min="0" max="24" step=".5" value="${esc(m.sleep)}"></label>
   <label><b>EJERCICIO</b><input id="exercise" type="number" min="0" max="600" value="${esc(m.exercise)}" placeholder="minutos"></label>
 </div>

 <div class="row"><b>PENSAMIENTO ACELERADO</b>${choices('racing',m.racing)}</div>
 <div class="row"><b>ANGUSTIA / DESESPERACIÓN</b>${choices('anguish',m.anguish)}</div>

 <div class="band orange">IRRITABILIDAD</div>
 <div class="row"><b>Nivel</b>${choices('irritability',m.irritability)}</div>

 <div class="band yellow">ÁNIMO ELEVADO</div>
 <div class="row"><b>Nivel</b>${choices('elevated',m.elevated)}</div>
 <div class="stable">ESTABLE <span>○</span></div>

 <div class="band orange">ÁNIMO BAJO</div>
 <div class="row"><b>Nivel</b>${choices('low',m.low)}</div>

 <div class="row"><b>PERÍODO MENSTRUAL</b>${binary('menstrual',m.menstrual)}</div>
 <div class="row"><b>PSICOSIS</b>${binary('psychosis',m.psychosis)}</div>
 <div class="row"><b>ALCOHOL / MARIHUANA</b>${binary('substances',m.substances)}</div>

 <label class="notes"><b>OBSERVACIONES</b><textarea id="notes">${esc(m.notes)}</textarea></label>
 <div class="actions"><button class="primary" data-action2="saveMood">Guardar ficha del día</button></div>
 </section>`;
}

function analysisView(){
 const now=new Date(), y=now.getFullYear(), month=now.getMonth()+1, days=new Date(y,month,0).getDate();
 const prefix=`${y}-${String(month).padStart(2,'0')}-`;
 const data=day=>moods.find(x=>x.date===`${prefix}${String(day).padStart(2,'0')}`);
 const row=(label,key)=>`<tr><th>${label}</th>${Array.from({length:31},(_,i)=>i+1>days?'<td class="off">—</td>':`<td>${mark(data(i+1)?.[key])}</td>`).join('')}</tr>`;
 return `<section class="card"><div class="head"><div><small>CARTA DEL ÁNIMO · ANÁLISIS MENSUAL</small><h2>${now.toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</h2></div>
 <span class="badge">${moods.filter(x=>x.date.startsWith(prefix)).length} días</span></div>
 <p class="muted">La planilla mensual es exclusivamente para observar comparación y evolución. Cada columna representa un día.</p>
 <div class="tablewrap"><table><thead><tr><th>DÍAS DEL MES</th>${Array.from({length:31},(_,i)=>`<th>${i+1}</th>`).join('')}</tr></thead><tbody>
 ${row('HORAS TOTALES DE SUEÑO','sleep')}${row('EJERCICIO','exercise')}${row('PENSAMIENTO ACELERADO','racing')}${row('ANGUSTIA / DESESPERACIÓN','anguish')}
 <tr class="section"><th>IRRITABILIDAD</th>${Array.from({length:31},(_,i)=>i+1>days?'<td class="off">—</td>':`<td>${mark(data(i+1)?.irritability)}</td>`).join('')}</tr>
 ${row('ÁNIMO ELEVADO','elevated')}<tr class="stableRow"><th>ESTABLE</th>${Array.from({length:31},(_,i)=>i+1>days?'<td class="off">—</td>':'<td>○</td>').join('')}</tr>
 ${row('ÁNIMO BAJO','low')}${row('PERÍODO MENSTRUAL','menstrual')}${row('PSICOSIS','psychosis')}${row('ALCOHOL / MARIHUANA','substances')}
 </tbody></table></div></section>`;
}

function routineView(){
 const rs=routines.slice().sort((a,b)=>a.time.localeCompare(b.time));
 return `<section class="card"><div class="head"><div><small>HORARIO DIARIO</small><h2>Mis rutinas</h2></div><button class="primary" data-action2="addRoutine">+ Agregar actividad</button></div>
 <div class="routine">${rs.map(r=>`<div class="routineitem"><time>${esc(r.time)}</time><span><b>${esc(r.title)}</b><small>${esc(r.notes)}</small></span>
 <button data-edit="${r.id}">Editar</button><button class="danger" data-del="${r.id}">Eliminar</button></div>`).join('')}</div>
 <hr><div class="head"><h3>Recordatorio diario de la ficha</h3></div>
 <div class="rem"><input id="reminder" type="time" value="${esc(reminder)}"><button data-action2="saveReminder">Guardar hora</button><button data-action2="notify">Activar notificaciones</button></div>
 <p class="muted">El navegador debe tener permiso de notificaciones. Una PWA en GitHub Pages no puede garantizar una alarma si Android detiene completamente el navegador.</p>
 </section>`;
}

function modal(html){document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="modal"><div class="modalbox">${html}</div></div>`)}

function bindSecondary(){
 document.querySelectorAll('[data-action2]').forEach(b=>b.onclick=()=>actions(b.dataset.action2));
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editRoutine(b.dataset.edit));
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>delRoutine(b.dataset.del));
 document.querySelectorAll('input[type=radio]').forEach(x=>x.onchange=()=>x.parentElement.parentElement.querySelectorAll('label').forEach(l=>l.classList.toggle('selected',l.querySelector('input')?.checked)));
}
function actions(a){
 if(a==='saveMood')saveMood(); if(a==='addMed')addMed(); if(a==='addRoutine')editRoutine();
 if(a==='saveReminder')saveReminder(); if(a==='notify')notify();
}
function saveMood(){
 const date=document.getElementById('moodDate').value||today(), m=getMood(date);
 m.date=date;m.sleep=document.getElementById('sleep').value;m.exercise=document.getElementById('exercise').value;m.notes=document.getElementById('notes').value;
 ['racing','anguish','irritability','elevated','low','menstrual','psychosis','substances'].forEach(k=>{const x=document.querySelector(`input[name="${k}"]:checked`);m[k]=x?x.value:''});
 const i=moods.findIndex(x=>x.date===date);if(i>=0)moods[i]=m;else moods.push(m);write('moods',moods);
 document.querySelectorAll('[data-med]').forEach(x=>{const medId=x.dataset.med;const d=document.querySelector(`[data-doses="${medId}"]`)?.value||0;logs=logs.filter(z=>!(z.medId===medId&&z.date===date));logs.push({medId,date,taken:x.checked,doses:Number(d)});});write('logs',logs);
 alert('Ficha del ánimo guardada correctamente.');render();
}
function addMed(){modal(`<h2>Agregar medicamento</h2><label>Medicamento<input id="mn"></label><label>Dosis diaria<input id="md" placeholder="Escribe la dosis indicada"></label><label>N.º de veces / tomas al día<input id="mt" type="number" min="1" value="1"></label><div class="actions"><button class="primary" id="ok">Guardar</button><button onclick="document.getElementById('modal').remove()">Cancelar</button></div>`);document.getElementById('ok').onclick=()=>{const name=document.getElementById('mn').value.trim();if(!name)return alert('Escribe el nombre del medicamento.');meds.push({id:crypto.randomUUID(),name,dose:document.getElementById('md').value.trim(),times:Number(document.getElementById('mt').value)||1});write('meds',meds);document.getElementById('modal').remove();render()}}
function editRoutine(id){
 const r=routines.find(x=>x.id===id)||{id:'',time:'08:00',title:'',notes:''};
 modal(`<h2>${id?'Editar':'Agregar'} actividad</h2><label>Hora<input id="rt" type="time" value="${esc(r.time)}"></label><label>Actividad<input id="rtitle" value="${esc(r.title)}"></label><label>Notas<input id="rnotes" value="${esc(r.notes)}"></label><div class="actions"><button class="primary" id="rok">Guardar</button><button onclick="document.getElementById('modal').remove()">Cancelar</button></div>`);
 document.getElementById('rok').onclick=()=>{const n={id:id||crypto.randomUUID(),time:document.getElementById('rt').value,title:document.getElementById('rtitle').value.trim(),notes:document.getElementById('rnotes').value.trim()};if(!n.title)return alert('Escribe una actividad.');const i=routines.findIndex(x=>x.id===id);if(i>=0)routines[i]=n;else routines.push(n);write('routines',routines);document.getElementById('modal').remove();render()}
}
function delRoutine(id){if(confirm('¿Eliminar esta actividad?')){routines=routines.filter(x=>x.id!==id);write('routines',routines);render()}}
function saveReminder(){reminder=document.getElementById('reminder').value||'21:00';localStorage.setItem(KEY+':reminder',reminder);alert('Recordatorio guardado para las '+reminder+'.')}
async function notify(){if(!('Notification'in window))return alert('Este navegador no admite notificaciones.');const p=await Notification.requestPermission();if(p==='granted'){new Notification('Recuperación',{body:'Notificaciones activadas. Recuerda completar tu ficha del ánimo cada día.'});}else alert('Permite las notificaciones en el navegador.')}
function render(){let c=tab==='analysis'?analysisView():tab==='routine'?routineView():moodView();layout(c);bindSecondary()}
window.addEventListener('load',()=>{if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});render()});
})();