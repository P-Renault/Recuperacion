// Diagnóstico rápido: abrir desde la consola del sitio de Recuperación.
(async()=>{
 const url="https://jxujhaxraqtymphkbpqn.supabase.co";
 const key="sb_publishable_DmxiAmvIa4jOXx_Mh_n-Tw_3KSCFXi-";
 try{
   const r=await fetch(url+"/rest/v1/",{
     headers:{apikey:key,Authorization:"Bearer "+key}
   });
   console.log("HTTP:",r.status);
   console.log("Respuesta:",await r.text());
 }catch(e){
   console.error("NETWORK ERROR:",e);
 }
})();
