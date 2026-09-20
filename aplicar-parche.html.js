/*
RECUPERACION - PARCHE DIRECTO
Este archivo modifica el app.js y style.css existentes del repositorio.
No requiere cambiar credenciales.
*/
(async()=>{
  const app = await (await fetch("./app.js?fix="+Date.now())).text();

  const replacements = [
    [
      'function getSBConfig(){try{return JSON.parse(localStorage.getItem(SBKEY)||"null")}catch{return null}}',
      'function getSBConfig(){try{const c=window.SUPABASE_CONFIG;if(c?.url&&c?.anonKey)return {url:c.url,key:c.anonKey};return JSON.parse(localStorage.getItem(SBKEY)||"null")}catch{return null}}'
    ],
    [
      'function initSB(){const c=getSBConfig(); if(c?.url&&c?.key&&window.supabase?.createClient){try{sb=window.supabase.createClient(c.url,c.key)}catch(e){sb=null}}}',
      'function initSB(){const c=getSBConfig();if(c?.url&&c?.key&&window.supabase?.createClient){try{sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}catch(e){console.error("Supabase init:",e);sb=null}}}'
    ],
    [
      'await upsertTable("mood_medications",meds.map(m=>({id:m.id,user_id:sbUser.id,name:m.name,dose:m.dose,quantity:String(m.quantity??1),active:true})));',
      'await upsertTable("mood_medications",meds.map(m=>({id:m.id,user_id:sbUser.id,name:m.name,daily_dose:m.dose||"",daily_quantity:Number(m.quantity??1),active:true})));'
    ],
    [
      'await upsertTable("mood_medication_logs",medLogs.map(l=>({id:l.id||crypto.randomUUID(),user_id:sbUser.id,medication_id:l.medId,log_date:l.date,taken:!!l.taken,doses:Number(l.doses)||0})));',
      'await upsertTable("mood_medication_logs",medLogs.map(l=>({id:l.id||crypto.randomUUID(),user_id:sbUser.id,medication_id:l.medId,entry_date:l.date,taken:!!l.taken,quantity_taken:Number(l.doses)||0})));'
    ],
    [
      'await upsertTable("daily_risk_logs",risks.map(r=>({id:r.id,user_id:sbUser.id,entry_date:r.date,thought:r.thought,situation:r.situation,trigger:r.trigger,emotion:r.emotion||"",craving_level:Number(r.intensity)||0,action_taken:r.response,result:r.consumption,consumed:r.consumption==="Tuve consumo",notes:r.immediate?"Riesgo inmediato":""})));',
      'await upsertTable("daily_risk_logs",risks.map(r=>({id:r.id,user_id:sbUser.id,entry_date:r.date,thought:r.thought||"",situation:r.situation||"",trigger:r.trigger||"",intensity:Number(r.intensity)||0,response:r.response||"",support_contacted:"",consumption_status:r.consumption||"No tuve consumo",consumption_detail:"",immediate_risk:!!r.immediate})));'
    ],
    [
      'meds=md.map(x=>({id:x.id,name:x.name,dose:x.dose,quantity:x.quantity}));medLogs=mdl.map(x=>({id:x.id,medId:x.medication_id,date:x.log_date,taken:x.taken,doses:x.doses}));',
      'meds=md.map(x=>({id:x.id,name:x.name,dose:x.daily_dose||"",quantity:x.daily_quantity??1}));medLogs=mdl.map(x=>({id:x.id,medId:x.medication_id,date:x.entry_date,taken:x.taken,doses:x.quantity_taken??0}));'
    ],
    [
      'risks=rk.map(x=>({id:x.id,date:x.entry_date,thought:x.thought||"",situation:x.situation||"",trigger:x.trigger||"",intensity:x.craving_level||0,response:x.action_taken||"",consumption:x.result||"No tuve consumo",immediate:(x.notes||"").includes("Riesgo inmediato")}));',
      'risks=rk.map(x=>({id:x.id,date:x.entry_date,thought:x.thought||"",situation:x.situation||"",trigger:x.trigger||"",intensity:x.intensity||0,response:x.response||"",consumption:x.consumption_status||"No tuve consumo",immediate:!!x.immediate_risk}));'
    ],
    [
      'function wireCloud(){initSB();if(sb){sb.auth.getUser().then(({data})=>{sbUser=data?.user||null;render()});sb.auth.onAuthStateChange((_event,session)=>{sbUser=session?.user||null;render()})}}',
      'function wireCloud(){initSB();if(!sb)return;sb.auth.getUser().then(async({data})=>{sbUser=data?.user||null;render();if(sbUser)await pullSB(true)});sb.auth.onAuthStateChange(async(_event,session)=>{sbUser=session?.user||null;render();if(sbUser&&(_event==="SIGNED_IN"||_event==="INITIAL_SESSION"))await pullSB(true)})}'
    ]
  ];

  let out=app;
  const missing=[];
  for(const [a,b] of replacements){
    if(!out.includes(a)) missing.push(a.slice(0,100));
    else out=out.replace(a,b);
  }

  const testOld='async function testSB(){if(!sb)initSB();if(!sb)return alert("Guarda primero la configuración.");try{const {error}=await sb.from("daily_routines").select("id",{count:"exact",head:true});if(error)throw error;alert("Conexión con Supabase correcta.")}catch(e){alert("No se pudo conectar: "+(e.message||e))}}';
  const testNew='async function testSB(){const c=getSBConfig();if(!c?.url||!c?.key)return alert("Configura Supabase primero.");const url=String(c.url).replace(/\\/$/,"");try{const r=await fetch(url+"/rest/v1/",{method:"GET",headers:{apikey:c.key,Authorization:"Bearer "+c.key}});const body=await r.text();console.log("Supabase test",r.status,body);if(!r.ok)return alert("Supabase respondió HTTP "+r.status+". La red funciona; revisa URL, clave o políticas.");alert("Conexión con Supabase correcta. HTTP "+r.status)}catch(e){console.error("Supabase NetworkError",e);alert("NETWORK ERROR\\n\\nNo se pudo alcanzar Supabase.\\nURL: "+url+"\\n\\nVerifica Project URL y estado del proyecto en Supabase.")}}';
  if(out.includes(testOld)) out=out.replace(testOld,testNew); else missing.push("testSB");

  if(missing.length){
    alert("PARCHE NO APLICADO. Faltan coincidencias en app.js. No se modificó nada.\n\n" + missing.join("\n"));
    return;
  }

  const blob=new Blob([out],{type:"text/javascript"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="app.js";
  a.click();

  const cssFix=`\n/* FIX MOBILE SUPABASE */\n.card label{display:flex;flex-direction:column;gap:6px}\n.card input,.card textarea,.card select{max-width:100%;min-width:0}\n.actions{display:flex;gap:8px;flex-wrap:wrap}\n@media(max-width:700px){.head{align-items:flex-start}.head .badge{flex-shrink:0}.card{padding:16px}.card>label{width:100%}.card>label input{width:100%}}\n`;
  const css=await (await fetch("./style.css?fix="+Date.now())).text();
  const cb=new Blob([css+cssFix],{type:"text/css"});
  const b=document.createElement("a");
  b.href=URL.createObjectURL(cb);
  b.download="style.css";
  b.click();

  alert("Parche generado: app.js y style.css.\n\nSube ambos archivos al repositorio Recuperacion reemplazando los actuales.");
})();
