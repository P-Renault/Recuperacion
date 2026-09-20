// CONFIGURACIÓN SUPABASE — Recuperación
// Compatible con el app.js actualmente desplegado.
//
// La aplicación actual todavía lee:
// recuperacion-v5:supabaseConfig
// Por eso esta configuración también se guarda automáticamente allí.

window.SUPABASE_CONFIG = {
  url: "https://jxujhaxraqtymphkbpqn.supabase.co",
  anonKey: "sb_publishable_DmxiAmvIa4jOXx_Mh_n-Tw_3KSCFXi-"
};

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
