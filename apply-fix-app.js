const fs=require("fs");
const file="app.js";
if(!fs.existsSync(file)){console.error("No se encontró app.js. Ejecuta desde la raíz del repositorio.");process.exit(1)}
let s=fs.readFileSync(file,"utf8");
fs.copyFileSync(file,"app.js.bak");

const reps=[
[`function getSBConfig(){try{return JSON.parse(localStorage.getItem(SBKEY)||"null")}catch{return null}}`,
`function getSBConfig(){try{const c=window.SUPABASE_CONFIG;if(c?.url&&c?.anonKey&&!/^TU-|TU_/.test(c.url)&&!/^TU_/.test(c.anonKey))return{url:c.url,key:c.anonKey};const l=JSON.parse(localStorage.getItem(SBKEY)||"null");return l?.url&&l?.key?l:null}catch{return null}}`],

[`function initSB(){const c=getSBConfig(); if(c?.url&&c?.key&&window.supabase?.createClient){try{sb=window.supabase.createClient(c.url,c.key)}catch(e){sb=null}}}`,
`function initSB(){const c=getSBConfig();if(c?.url&&c?.key&&window.supabase?.createClient){try{sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}catch(e){console.error(e);sb=null}}}`],

[`async function testSB(){if(!sb)initSB();if(!sb)return alert("Guarda primero la configuración.");try{const {error}=await sb.from("daily_routines").select("id",{count:"exact",head:true});if(error)throw error;alert("Conexión con Supabase correcta.")}catch(e){alert("No se pudo conectar: "+(e.message||e))}}`,
`async function testSB(){if(!sb)initSB();if(!sb)return alert("Guarda primero la configuración.");try{const {error}=await sb.from("daily_routines").select("id",{count:"exact",head:true}).limit(1);if(error&&error.code!=="42501")throw error;alert(error?.code==="42501"?"Supabase responde correctamente; inicia sesión para acceder a tus datos.":"Conexión con Supabase correcta.")}catch(e){alert("Supabase no responde o la configuración es incorrecta: "+(e?.message||e))}}`],

[`await upsertTable("mood_medications",meds.map(m=>({id:m.id,user_id:sbUser.id,name:m.name,dose:m.dose,quantity:String(m.quantity??1),active:true})));`,
`await upsertTable("mood_medications",meds.map(m=>({id:m.id,user_id:sbUser.id,name:m.name,daily_dose:m.dose,daily_quantity:Number(m.quantity)||1,active:true})));`],

[`await upsertTable("mood_medication_logs",medLogs.map(l=>({id:l.id||crypto.randomUUID(),user_id:sbUser.id,medication_id:l.medId,log_date:l.date,taken:!!l.taken,doses:Number(l.doses)||0})));`,
`await upsertTable("mood_medication_logs",medLogs.map(l=>({id:l.id||crypto.randomUUID(),user_id:sbUser.id,medication_id:l.medId,entry_date:l.date,taken:!!l.taken,quantity_taken:Number(l.doses)||0})));`],

[`await upsertTable("daily_risk_logs",risks.map(r=>({id:r.id,user_id:sbUser.id,entry_date:r.date,thought:r.thought,situation:r.situation,trigger:r.trigger,emotion:r.emotion||"",craving_level:Number(r.intensity)||0,action_taken:r.response,result:r.consumption,consumed:r.consumption==="Tuve consumo",notes:r.immediate?"Riesgo inmediato":""})));`,
`await upsertTable("daily_risk_logs",risks.map(r=>({id:r.id,user_id:sbUser.id,entry_date:r.date,thought:r.thought,situation:r.situation,trigger:r.trigger,intensity:Number(r.intensity)||0,response:r.response||"",support_contacted:false,consumption_status:r.consumption||"No tuve consumo",consumption_detail:"",immediate_risk:!!r.immediate})));`],

[`meds=md.map(x=>({id:x.id,name:x.name,dose:x.dose,quantity:x.quantity}));`,
`meds=md.map(x=>({id:x.id,name:x.name,dose:x.daily_dose||"",quantity:x.daily_quantity??1}));`],

[`medLogs=mdl.map(x=>({id:x.id,medId:x.medication_id,date:x.log_date,taken:x.taken,doses:x.doses}));`,
`medLogs=mdl.map(x=>({id:x.id,medId:x.medication_id,date:x.entry_date,taken:x.taken,doses:x.quantity_taken??0}));`],

[`risks=rk.map(x=>({id:x.id,date:x.entry_date,thought:x.thought||"",situation:x.situation||"",trigger:x.trigger||"",intensity:x.craving_level||0,response:x.action_taken||"",consumption:x.result||"No tuve consumo",immediate:(x.notes||"").includes("Riesgo inmediato")}));`,
`risks=rk.map(x=>({id:x.id,date:x.entry_date,thought:x.thought||"",situation:x.situation||"",trigger:x.trigger||"",intensity:x.intensity||0,response:x.response||"",consumption:x.consumption_status||"No tuve consumo",immediate:!!x.immediate_risk}));`],

[`function wireCloud(){initSB();if(sb){sb.auth.getUser().then(({data})=>{sbUser=data?.user||null;render()});sb.auth.onAuthStateChange((_event,session)=>{sbUser=session?.user||null;render()})}}`,
`async function wireCloud(){initSB();if(!sb){render();return}try{const {data}=await sb.auth.getUser();sbUser=data?.user||null;if(sbUser)await pullSB(true)}catch(e){console.error("Restauración Supabase:",e)}render();sb.auth.onAuthStateChange(async (_event,session)=>{sbUser=session?.user||null;if(sbUser)try{await pullSB(true)}catch(e){console.error("Restauración Supabase:",e)}render()})}`],

[`<span class="badge">\${sbUser?"Conectado":"No conectado"}</span>`,
`<span class="badge">\${sbUser?"Sesión activa":(getSBConfig()?"Configurado · inicia sesión":"No configurado")}</span>`]
];

for(const [a,b] of reps){
 if(!s.includes(a)){console.error("No se encontró un bloque esperado.");process.exit(2)}
 s=s.replace(a,b);
}
fs.writeFileSync(file,s,"utf8");
console.log("Corrección aplicada. Backup creado: app.js.bak");
