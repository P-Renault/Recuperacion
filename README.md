# Recuperación v5.4 — Supabase

Aplicación PWA para GitHub Pages con almacenamiento local + sincronización opcional con Supabase.

## v5.4
- Mantiene todas las funciones de v5.3.
- Agrega **Cuenta / Supabase**.
- Configuración mediante URL del proyecto + clave pública `anon`.
- Registro e inicio de sesión con Supabase Auth.
- Subir datos locales a Supabase.
- Descargar datos de Supabase al teléfono.
- Mantiene localStorage como respaldo local.
- Horario con hora de inicio y hora de fin.
- Medicamentos: nombre, dosis diaria y cantidad diaria.

## Seguridad
Usa únicamente la clave pública `anon`. **Nunca** introduzcas una clave `service_role` en la aplicación.

## GitHub Pages
Sube el contenido de esta carpeta a la raíz del repositorio `P-Renault/Recuperacion`.
La URL esperada es `https://p-renault.github.io/Recuperacion/`.

## Configuración
1. Abre la aplicación.
2. Entra a **Cuenta / Supabase**.
3. Introduce la URL del proyecto Supabase.
4. Introduce la clave pública `anon`.
5. Guarda y prueba la conexión.
6. Crea una cuenta o inicia sesión.
7. Usa **Subir datos locales** para enviar los registros del teléfono a Supabase.
8. En otro dispositivo, inicia sesión y usa **Descargar datos de Supabase**.

## Notas
Las notificaciones del navegador dependen de los permisos y del sistema operativo; GitHub Pages por sí solo no garantiza alarmas si el navegador es terminado completamente.
