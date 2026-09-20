// apply-fix-app.js
// Ejecutar desde la raíz del repositorio: node apply-fix-app.js
const fs = require("fs");

const file = "app.js";
if (!fs.existsSync(file)) {
  console.error("No se encontró app.js. Ejecuta este script desde la raíz del repositorio.");
  process.exit(1);
}

let s = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, "app.js.bak");

function replaceOnce(label, from, to) {
  if (!s.includes(from)) {
    console.error("No se encontró el bloque esperado: " + label);
    process.exit(2);
  }
  s = s.replace(from, to);
  console.log("OK:", label);
}

// 1) La configuración debe sobrevivir al borrado de localStorage mediante config.js.
replaceOnce("getSBConfig", 
`function getSBConfig(){try{return JSON.parse(localStorage.getItem(SBKEY)||"null")}catch{return null}}`,
`function getSBConfig(){try{const c=window.SUPABASE_CONFIG;if(c?.url&&c?.anonKey)return{url:c.url,key:c.anonKey};const l=JSON.parse(localStorage.getItem(SBKEY)||"null");if(l?.url&&l?.key)return l;return null}catch{return null}}`);

// 2) Sesión persistente y auto-refresh de Supabase.
replaceOnce("initSB",
`function initSB(){const c=getSBConfig(); if(c?.url&&c?.key&&window.supabase?.createClient){try{sb=window.supabase.createClient(c.url,c.key)}catch(e){sb=null}}}`,
`function initSB(){const c=getSBConfig(); if(c?.url&&c?.key&&window.supabase?.createClient){try{sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}catch(e){sb=null}}}`);

// 3) Medicamentos: alinear frontend con supabase_v5.sql.
replaceOnce("push medications",
`await upsertTable("mood_medications",meds.map(m=>({id:m.id,user_id:sbUser.id,name:m.name,dose:m.dose,quantity:String(m.quantity??1),active:true})));`,
`await upsertTable("mood_medications",meds.map(m=>({id:m.id,user_id:sbUser.id,name:m.name,daily_dose:m.dose,daily_quantity:Number(m.quantity)||1,active:true})));`);

replaceOnce("push medication logs",
`await upsertTable("mood_medication_logs",medLogs.map(l=>({id:l.id||crypto.randomUUID(),user_id:sbUser.id,medication_id:l.medId,log_date:l.date,taken:!!l.taken,doses:Number(l.doses)||0})));`,
`await upsertTable("mood_medication_logs",medLogs.map(l=>({id:l.id||crypto.randomUUID(),user_id:sbUser.id,medication_id:l.medId,entry_date:l.date,taken:!!l.taken,quantity_taken:Number(l.doses)||0})));`);

// 4) Riesgos: alinear frontend con supabase_v5.sql.
replaceOnce("push risks",
`await upsertTable("daily_risk_logs",risks.map(r=>({id:r.id,user_id:sbUser.id,entry_date:r.date,thought:r.thought,situation:r.situation,trigger:r.trigger,emotion:r.emotion||"",craving_level:Number(r.intensity)||0,action_taken:r.response,result:r.consumption,consumed:r.consumption==="Tuve consumo",notes:r.immediate?"Riesgo inmediato":""})));`,
`await upsertTable("daily_risk_logs",risks.map(r=>({id:r.id,user_id:sbUser.id,entry_date:r.date,thought:r.thought,situation:r.situation,trigger:r.trigger,intensity:Number(r.intensity)||0,response:r.response||"",support_contacted:false,consumption_status:r.consumption||"No tuve consumo",consumption_detail:"",immediate_risk:!!r.immediate})));`);

// 5) Restauración desde Supabase al arrancar.
replaceOnce("wireCloud",
`function wireCloud(){initSB();if(sb){sb.auth.getUser().then(({data})=>{sbUser=data?.user||null;render()});sb.auth.onAuthStateChange((_event,session)=>{sbUser=session?.user||null;render()})}}`,
`async function wireCloud(){initSB();if(!sb)return;const {data}=await sb.auth.getUser();sbUser=data?.user||null;if(sbUser){try{await pullSB(true)}catch(e){console.error("Restauración Supabase:",e)}}render();sb.auth.onAuthStateChange(async (_event,session)=>{sbUser=session?.user||null;if(sbUser){try{await pullSB(true)}catch(e){console.error("Restauración Supabase:",e)}}render()})}`);

// 6) pull: medicamentos.
replaceOnce("pull medications",
`meds=md.map(x=>({id:x.id,name:x.name,dose:x.dose,quantity:x.quantity}));`,
`meds=md.map(x=>({id:x.id,name:x.name,dose:x.daily_dose||"",quantity:x.daily_quantity??1}));`);

replaceOnce("pull medication logs",
`medLogs=mdl.map(x=>({id:x.id,medId:x.medication_id,date:x.log_date,taken:x.taken,doses:x.doses}));`,
`medLogs=mdl.map(x=>({id:x.id,medId:x.medication_id,date:x.entry_date,taken:x.taken,doses:x.quantity_taken??0}));`);

// 7) pull: riesgos.
replaceOnce("pull risks",
`risks=rk.map(x=>({id:x.id,date:x.entry_date,thought:x.thought||"",situation:x.situation||"",trigger:x.trigger||"",intensity:x.craving_level||0,response:x.action_taken||"",consumption:x.result||"No tuve consumo",immediate:(x.notes||"").includes("Riesgo inmediato")}));`,
`risks=rk.map(x=>({id:x.id,date:x.entry_date,thought:x.thought||"",situation:x.situation||"",trigger:x.trigger||"",intensity:x.intensity||0,response:x.response||"",consumption:x.consumption_status||"No tuve consumo",immediate:!!x.immediate_risk}));`);

fs.writeFileSync(file, s, "utf8");
console.log("\\nCorrección aplicada. Backup: app.js.bak");
