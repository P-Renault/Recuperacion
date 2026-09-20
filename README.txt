RECUPERACION — FIX INCIDENCIA PERSISTENCIA SUPABASE
=====================================================

Objetivo
--------
Corregir la pérdida aparente de datos al borrar historial/datos del navegador.

Causa corregida:
1. config.js no era cargado por index.html.
2. La configuración de Supabase se guardaba únicamente en localStorage.
3. Al iniciar, la aplicación no restauraba automáticamente los datos desde Supabase.
4. Los campos de medicamentos y riesgos no coincidían con supabase_v5.sql.

Contenido
---------
- index.html               -> versión corregida, carga config.js antes de Supabase/app.js
- config.js                -> configuración pública de Supabase (rellenar URL y anonKey)
- apply-fix-app.js         -> parche automático para app.js existente
- README.txt               -> estas instrucciones

IMPORTANTE
----------
No contiene claves privadas. Solo debe utilizarse la clave pública anon de Supabase.
No subas una service_role key al repositorio.

Cómo aplicarlo
--------------
1. Descarga/descomprime este ZIP.
2. Copia index.html y config.js sobre los archivos del repositorio.
3. Ejecuta:
      node apply-fix-app.js
   desde la carpeta raíz del repositorio.
4. El script crea app.js.bak antes de modificar app.js.
5. Configura config.js con:
      window.SUPABASE_CONFIG = {
        url: "https://TU-PROYECTO.supabase.co",
        anonKey: "TU_ANON_KEY"
      };
6. Haz commit y push.
7. Abre la aplicación, inicia sesión con Supabase y verifica que los datos se restauren.
8. Una vez restaurados, limpiar el almacenamiento del navegador ya no debería eliminar los
   datos que estén sincronizados en Supabase.

Si tu repositorio ya tiene valores válidos de Supabase en otra configuración de despliegue,
mantén esos valores; no sustituyas credenciales existentes por placeholders.

Nota
----
El conector de GitHub disponible en esta sesión permite leer el repositorio, pero la escritura
directa devolvió HTTP 403. Por eso este paquete está preparado para cargar/aplicar en el repo.
