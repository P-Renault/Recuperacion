RECUPERACIÓN — FIX FINAL SUPABASE

PROYECTO
https://jxujhaxraqtymphkbpqn.supabase.co

QUÉ SOLUCIONA
- La configuración de Supabase ya no depende de localStorage.
- Al borrar datos/cookies del navegador, config.js vuelve a proporcionar URL y clave.
- Se activa persistencia de sesión.
- Se puede distinguir NetworkError de errores HTTP/RLS.
- La aplicación puede recuperar datos desde Supabase al iniciar sesión.
- Se deben corregir los nombres de columnas de medicamentos y riesgos para coincidir con supabase_v5.sql.

ARCHIVOS
1. config.js
   Configuración pública exacta entregada para este proyecto.

2. test-supabase.js
   Diagnóstico directo del endpoint REST. Permite comprobar si el problema es red/URL antes de revisar RLS.

3. app.js.patch.txt
   Cambios exactos que deben aplicarse a app.js.

4. index.html.patch.txt
   Cambio necesario para cargar config.js ANTES de app.js.

IMPORTANTE
La clave entregada comienza con sb_publishable_, por lo que es una clave pública para frontend.
No uses aquí una service_role key.

PASOS
1. Sube config.js a la raíz del repositorio Recuperacion.
2. En index.html, agrega:
   <script src="./config.js"></script>
   antes del CDN de Supabase y antes de app.js.
3. Aplica los cambios de app.js incluidos en app.js.patch.txt.
4. Haz commit/push.
5. Espera el despliegue de GitHub Pages.
6. En el navegador, recarga con limpieza de caché.
7. En Cuenta / Supabase pulsa Guardar conexión.
8. Pulsa Probar conexión.

SI APARECE NetworkError
No es un error de RLS ni de contraseña. Significa que el navegador no consiguió obtener una respuesta HTTP del endpoint.
Prueba:
https://jxujhaxraqtymphkbpqn.supabase.co/rest/v1/

Si el endpoint responde con cualquier HTTP (por ejemplo 200, 401 o 404), la red llegó a Supabase y el diagnóstico debe continuar por URL/clave/RLS.
Si el navegador no puede abrirlo, revisar estado del proyecto y Project URL en Supabase > Settings > API.

CAMBIOS CLAVE EN app.js

A) Reemplazar getSBConfig por:

function getSBConfig(){
  try{
    const c = window.SUPABASE_CONFIG;
    if(c?.url && c?.anonKey){
      return {url:c.url,key:c.anonKey};
    }
    return JSON.parse(localStorage.getItem(SBKEY)||"null");
  }catch{
    return null;
  }
}

B) Reemplazar initSB por:

function initSB(){
  const c=getSBConfig();
  if(c?.url && c?.key && window.supabase?.createClient){
    try{
      sb=window.supabase.createClient(c.url,c.key,{
        auth:{
          persistSession:true,
          autoRefreshToken:true,
          detectSessionInUrl:true
        }
      });
    }catch(e){
      console.error("Supabase init:",e);
      sb=null;
    }
  }
}

C) Reemplazar testSB por:

async function testSB(){
  const c=getSBConfig();
  if(!c?.url || !c?.key){
    return alert("Configura Supabase primero.");
  }
  const url=String(c.url).replace(/\/$/,"");
  try{
    const r=await fetch(url+"/rest/v1/",{
      method:"GET",
      headers:{
        apikey:c.key,
        Authorization:"Bearer "+c.key
      }
    });
    const body=await r.text();
    console.log("Supabase test",r.status,body);
    if(!r.ok){
      return alert(
        "Supabase respondió HTTP "+r.status+
        ". La red funciona. Revisa Project URL, clave y políticas."
      );
    }
    alert("Conexión con Supabase correcta. HTTP "+r.status);
  }catch(e){
    console.error("Supabase NetworkError",e);
    alert(
      "NetworkError: el navegador no pudo alcanzar Supabase.\n\n"+
      "URL probada: "+url+"\n\n"+
      "Revisa que la Project URL sea exactamente la de Supabase > Settings > API."
    );
  }
}

D) En wireCloud, después de obtener el usuario, descargar automáticamente:

function wireCloud(){
  initSB();
  if(!sb)return;
  sb.auth.getUser().then(async ({data})=>{
    sbUser=data?.user||null;
    render();
    if(sbUser) await pullSB(true);
  });
  sb.auth.onAuthStateChange(async (_event,session)=>{
    sbUser=session?.user||null;
    render();
    if(sbUser && (_event==="SIGNED_IN" || _event==="INITIAL_SESSION")){
      await pullSB(true);
    }
  });
}

E) CORREGIR MEDICAMENTOS EN pushSB:

mood_medications:
{id:m.id,user_id:sbUser.id,name:m.name,daily_dose:m.dose,daily_quantity:Number(m.quantity??1),active:true}

mood_medication_logs:
{id:l.id||crypto.randomUUID(),user_id:sbUser.id,medication_id:l.medId,entry_date:l.date,taken:!!l.taken,quantity_taken:Number(l.doses)||0}

F) CORREGIR RIESGOS EN pushSB:

daily_risk_logs:
{
  id:r.id,
  user_id:sbUser.id,
  entry_date:r.date,
  thought:r.thought||"",
  situation:r.situation||"",
  trigger:r.trigger||"",
  intensity:Number(r.intensity)||0,
  response:r.response||"",
  support_contacted:"",
  consumption_status:r.consumption||"No tuve consumo",
  consumption_detail:"",
  immediate_risk:!!r.immediate
}

G) CORREGIR pullSB:

meds=md.map(x=>({
  id:x.id,
  name:x.name,
  dose:x.daily_dose||"",
  quantity:x.daily_quantity??1
}));

medLogs=mdl.map(x=>({
  id:x.id,
  medId:x.medication_id,
  date:x.entry_date,
  taken:x.taken,
  doses:x.quantity_taken??0
}));

risks=rk.map(x=>({
  id:x.id,
  date:x.entry_date,
  thought:x.thought||"",
  situation:x.situation||"",
  trigger:x.trigger||"",
  intensity:x.intensity||0,
  response:x.response||"",
  consumption:x.consumption_status||"No tuve consumo",
  immediate:!!x.immediate_risk
}));

NOTA SOBRE LOS DATOS
La aplicación sigue usando localStorage como caché local, pero Supabase queda como almacenamiento persistente de la cuenta autenticada.
Para recuperar los datos después de borrar historial/datos del navegador:
- cargar config.js,
- iniciar sesión,
- pullSB() recuperará los datos de Supabase.

No se debe confiar en localStorage para conservar datos críticos.
