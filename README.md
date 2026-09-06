# Mi Recuperación v2

Versión estable y estática para GitHub Pages.

## Por qué esta versión no queda en blanco

No depende de Vite, React ni de una carpeta `src/`. `index.html` carga directamente `styles.css`, `app.js` y `config.js`, por lo que GitHub Pages puede servirla como sitio estático.

## Funcionalidades

- Inicio con resumen diario.
- Pestaña **Completar mi ficha del ánimo**.
- Registro de ánimo 1–5.
- Ansiedad 0–10.
- Intensidad del deseo/impulso 0–10.
- Pensamientos, situaciones influyentes y decisión saludable.
- Hábitos diarios.
- Historial de fichas.
- Persistencia local en el teléfono.
- Preparada para sincronización con Supabase.
- PWA instalable cuando el navegador lo permita.

## Publicar desde el teléfono

1. Abre tu repositorio `P-Renault/Recuperacion`.
2. Reemplaza los archivos del repositorio con los contenidos de este ZIP.
3. En GitHub entra a **Settings → Pages**.
4. En **Build and deployment**, selecciona `Deploy from a branch`.
5. Selecciona `main` y carpeta `/ (root)`.
6. Guarda.
7. Espera la publicación y abre nuevamente tu sitio.

## Supabase

1. Abre Supabase → SQL Editor.
2. Ejecuta `supabase.sql`.
3. Ve a Project Settings → API.
4. Copia **Project URL** y la clave pública **anon**.
5. Abre `config.js` y coloca:

window.SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_CLAVE_ANON"
};

No uses jamás la clave `service_role` en `config.js`.

La aplicación funciona aunque Supabase no esté configurado: guarda localmente en el navegador.
