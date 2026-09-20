// RECUPERACIÓN v6 — configuración pública de Supabase
// Esta clave es la clave pública/publishable. Nunca uses service_role/secret aquí.

window.SUPABASE_CONFIG = {
  url: "https://jxujhaxraqtymphkbpqn.supabase.co",
  anonKey: "sb_publishable_DmxiAmvIa4jOXx_Mh_n-Tw_3KSCFXi-"
};

// Compatibilidad con app.js v5.4: ese código todavía lee este registro.
try {
  localStorage.setItem("recuperacion-v5:supabaseConfig", JSON.stringify({
    url: window.SUPABASE_CONFIG.url,
    key: window.SUPABASE_CONFIG.anonKey
  }));
} catch (e) {
  console.error("No se pudo guardar la configuración Supabase:", e);
}

// Corrección visual inmediata del formulario móvil sin tocar app.js.
(function fixMobileAccountForm(){
  const css = `
    .card > label{display:flex;flex-direction:column;gap:6px;width:100%;font-size:14px}
    .card > label input,.card > label textarea,.card > label select{
      width:100%;min-width:0;max-width:100%;
      border:1px solid #ccd6da;border-radius:9px;padding:9px;
    }
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    @media(max-width:700px){
      .card{overflow:hidden}
      .card .head{align-items:flex-start;flex-wrap:wrap}
      .card .head > label{width:100%}
      .card .head > label input{width:100%}
      .card > label{width:100%}
      .card > label input{width:100%}
    }
  `;
  const style=document.createElement("style");
  style.id="recuperacion-v6-mobile-fix";
  style.textContent=css;
  document.head.appendChild(style);
})();
