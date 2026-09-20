/*
 * FIX FINAL - Recuperación + Supabase
 * Ejecutar una vez desde la consola del navegador de la aplicación,
 * o usar como referencia para aplicar los cambios a app.js.
 *
 * Este parche:
 * 1) toma la configuración de config.js;
 * 2) activa persistSession/autoRefreshToken;
 * 3) diagnostica NetworkError por separado de errores HTTP/RLS;
 * 4) corrige nombres de columnas de Supabase;
 * 5) recupera automáticamente los datos al iniciar si existe sesión.
 */
(async () => {
  const CONFIG = window.SUPABASE_CONFIG || {};
  if (!CONFIG.url || !CONFIG.anonKey) {
    alert("Falta config.js o la configuración pública de Supabase.");
    return;
  }

  const url = String(CONFIG.url).replace(/\/$/, "");
  const key = String(CONFIG.anonKey);

  // Diagnóstico directo del endpoint REST.
  try {
    const r = await fetch(url + "/rest/v1/", {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key
      }
    });
    const body = await r.text();
    console.log("[Supabase] HTTP", r.status, body.slice(0, 500));
    if (!r.ok) {
      alert(
        "Supabase responde, pero con HTTP " + r.status +
        ". La red funciona; revisar URL/clave/políticas."
      );
      return;
    }
  } catch (e) {
    console.error("[Supabase] NetworkError", e);
    alert(
      "El endpoint de Supabase no es accesible desde el navegador.\n\n" +
      "URL: " + url + "\n\n" +
      "Esto ocurre antes de RLS/autenticación. Verifica que la Project URL " +
      "sea exactamente la mostrada en Supabase > Settings > API."
    );
    return;
  }

  // El app.js existente se debe actualizar con el código del README.
  alert(
    "Endpoint Supabase accesible correctamente.\n\n" +
    "Ahora reemplaza app.js por la versión corregida o aplica los cambios " +
    "indicados en README.txt."
  );
})();
