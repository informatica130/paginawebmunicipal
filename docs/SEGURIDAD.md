# Seguridad

## Acceso al panel

- **Contraseñas** con scrypt (N = 2¹⁵, sal aleatoria), comparación en tiempo constante. Política: 12+ caracteres, tres tipos de caracteres, sin nombre ni correo, sin palabras obvias («melipeuco», «password»…).
- **Contraseña temporal** obligatoria de cambiar en el primer ingreso (el servidor bloquea todo lo demás hasta hacerlo).
- **Verificación en dos pasos** TOTP (RFC 6238) compatible con cualquier aplicación de autenticación; cada código sirve una sola vez.
- **Sesiones**: token aleatorio de 256 bits en cookie `HttpOnly`, `SameSite=Strict` y `Secure` con HTTPS; en la base sólo se guarda su SHA-256. Cierre por 2 h de inactividad y 12 h de duración máxima, máximo 5 sesiones por persona, cierre de las demás al cambiar la contraseña, y «Mis sesiones» para cerrarlas a distancia.
- **Bloqueo** tras 5 intentos fallidos (15 min) y 10 intentos (1 h), más límite de 15 intentos por IP cada 15 minutos.
- **CSRF**: toda escritura exige el token de la sesión en la cabecera `X-CSRF` y que el origen sea el propio sitio.
- **Permisos por rol** y, opcionalmente, **por área municipal**. Sólo el Super Administrador gestiona a otros Super Administradores; siempre debe quedar uno activo; nadie puede cambiar su propio rol.
- **Auditoría** de ingresos, intentos fallidos, cambios de contenido, publicaciones, permisos, exportaciones, respuestas OIRS y configuración, con IP.

## Contenido

- Todo HTML que se guarda pasa por un **saneador de lista blanca** (`server/sanitizar.js`): sin `<script>`, sin manejadores `on*`, sin estilos, sin `javascript:` ni `data:` (salvo imágenes), iframes sólo de YouTube, Vimeo, Google Maps, Google Docs, OpenStreetMap, Facebook y la Plataforma de Trámites.
- Las plantillas escapan todo valor interpolado por defecto.
- Los **bloques HTML avanzados** (páginas heredadas de Elementor) se sirven desde `/embed/bloque/…` con la cabecera `Content-Security-Policy: sandbox`: el navegador los trata como de otro origen, por lo que no pueden leer cookies, sesiones ni el contenido del sitio. Sólo los editan quienes tienen el permiso «HTML avanzado».
- **Archivos subidos**: se valida el tipo por su contenido (firma binaria), no por la extensión; no se aceptan SVG, HTML ni ejecutables; nombres aleatorios; descarga forzada para tipos no visualizables; `X-Content-Type-Options: nosniff`.

## Navegador

- **Content-Security-Policy** con *nonce* por respuesta para los scripts propios, `frame-ancestors 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action` limitado.
- `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-Frame-Options`.
- Sin cookies para visitantes del sitio público (sólo una para recordar un voto en encuestas) y estadísticas propias sin datos personales.

## Formularios públicos

- Antispam sin captchas: campo trampa invisible + sello de tiempo firmado (HMAC) que exige al menos 2,5 s entre cargar y enviar.
- Límites por IP (mensajes, suscripciones, búsquedas, votos, seguimiento).
- Validación de RUN, correo y largos máximos; consentimiento explícito (Ley 19.628 y Ley 21.719).
- El seguimiento OIRS exige código **y** correo.

## Servidor

- Sin dependencias de terceros (menor superficie de ataque y de cadena de suministro).
- Límites de tamaño de cuerpo, tiempo máximo de cabeceras y de solicitud.
- IP real sólo desde proxies de confianza (`TRUST_PROXY`).
- Respaldos diarios cifrados (AES-256-GCM) con huella.
- Pruebas automáticas de seguridad en `tests/sitio.test.mjs` (XSS, CSRF, bloqueo, roles, subida de archivos, rutas, sandbox).

## Recomendaciones de operación

- Activar la verificación en dos pasos en todas las cuentas con permisos de publicación.
- Usar cuentas personales (nunca compartidas) y dar el rol mínimo necesario.
- Revisar la auditoría periódicamente (rol «Consulta / Control»).
- Mantener `BACKUP_KEY` fuera del servidor.
