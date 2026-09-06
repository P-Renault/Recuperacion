# Recuperación v4.0 — Corrección GitHub Pages

Esta versión evita la pantalla blanca causada por una cadena de build innecesaria: es una PWA estática, sin dependencia de Node/Vite para mostrar la interfaz.

Incluye:
- Carta del ánimo diaria con la estructura de la imagen y checklists.
- Vista mensual con días 1–31.
- Medicamentos configurables y registro diario de tomas.
- Horario editable.
- Recordatorio y solicitud de notificaciones.
- Persistencia local en el teléfono.
- Service worker.
- GitHub Pages mediante publicación directa del contenido del repositorio.

IMPORTANTE:
Para usar Supabase con autenticación/sincronización hay que conectar las credenciales y sesión del proyecto existente. Esta versión prioriza que la aplicación cargue correctamente en GitHub Pages y no quede en blanco.