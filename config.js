// RECUPERACIÓN — configuración final de Supabase
// Usa únicamente la clave pública/publishable. Nunca coloques service_role aquí.

window.SUPABASE_CONFIG = {
  url: "https://jxujhaxraqtymphkbpqn.supabase.co",
  anonKey: "sb_publishable_DmxiAmvIa4jOXx_Mh_n-Tw_3KSCFXi-"
};

// Compatibilidad con el app.js actualmente desplegado.
try {
  localStorage.setItem(
    "recuperacion-v5:supabaseConfig",
    JSON.stringify({
      url: window.SUPABASE_CONFIG.url,
      key: window.SUPABASE_CONFIG.anonKey
    })
  );
} catch (e) {
  console.error("No se pudo guardar la configuración Supabase:", e);
}
