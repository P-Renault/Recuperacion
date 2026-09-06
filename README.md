# Recuperación y Rutina Personal — v2.0

Nueva versión para GitHub Pages + Supabase.

## Funciones
- Pestaña **Completar mi ficha del ánimo** para registrar el estado del día.
- Ficha diaria basada en las filas de la carta del ánimo.
- Historial y análisis mensual para comparar evolución.
- Horario diario editable: crear, editar, eliminar y ordenar actividades por hora.
- Recordatorio diario de la ficha del ánimo con notificación del navegador.
- Funciona con Supabase cuando se configuran las variables de entorno.
- Tiene respaldo local en el navegador para que la interfaz siga funcionando sin Supabase.
- PWA instalable en Android.

## Publicación en GitHub Pages
El workflow de `.github/workflows/deploy.yml` compila con Vite y publica `dist/`.

En GitHub:
Settings → Pages → Source → GitHub Actions.

## Supabase
Ejecuta `supabase.sql` en el SQL Editor. Después configura:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Para GitHub Actions, esas variables deben existir como Secrets/Variables del repositorio.

## Importante sobre las notificaciones
El navegador debe conceder permiso para notificaciones. En GitHub Pages una web estática no puede garantizar una alarma del sistema cuando el navegador está completamente cerrado. Esta versión programa el recordatorio local mientras la PWA está activa y permite configurar la hora. Para notificaciones push garantizadas con la app cerrada se necesita un servicio push/backend adicional.