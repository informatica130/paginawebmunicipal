# Despliegue

## Vercel (demostración)

El repositorio incluye `vercel.json` y la función `api/index.js`: Vercel sirve estilos, scripts e imágenes desde su CDN y todo lo demás lo responde el servidor del sitio como función. Basta con importar el repositorio en Vercel (sin cambiar *Build Command* ni *Output Directory*: los define `vercel.json`) y configurar en *Settings → Environment Variables*:

| Variable | Valor |
|---|---|
| `ADMIN_EMAIL` | correo del Super Administrador |
| `ADMIN_PASSWORD` | contraseña del Super Administrador (obligatoria en Vercel) |
| `SITIO_SECRETO` | texto aleatorio largo (comparte las firmas de formularios entre instancias) |
| `TRAMITES_URL` | dirección de la Plataforma de Trámites (opcional) |

Use Node.js 22.x o superior (*Settings → General → Node.js Version*).

### Guardar los cambios en Vercel: memoria compartida (obligatorio para usar el panel)

Vercel no tiene disco persistente y puede atender con varias instancias a la vez, cada una con su propia base en `/tmp`. Sin memoria compartida, lo que se guarda en el panel sólo existe en la instancia que atendió esa petición: otras visitas no lo ven y se pierde al reiniciar.

Para que todo se guarde de forma permanente, conecte una base **Redis** gratuita de Upstash:

1. En Vercel abra el proyecto → **Storage** → **Create Database** → **Upstash for Redis** (plan *Free*).
2. Elija la región más cercana (por ejemplo, São Paulo) y pulse **Connect** para este proyecto. Vercel agrega solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` (o `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`).
3. **Deployments → … → Redeploy**.

El escritorio del panel muestra «Memoria compartida activa» cuando está funcionando (también `/api/salud` → `memoriaCompartida`).

Qué se guarda: todas las escrituras de la base (contenidos, ajustes, diseño, menús, usuarios, mensajes OIRS, suscriptores, votos, auditoría) en un diario ordenado que cada instancia aplica al iniciar y antes de atender; aparte, los ajustes y menús completos (sobreviven aunque cambie la semilla del contenido) y los archivos subidos a la biblioteca de medios (hasta 8 MB cada uno). Las sesiones del panel viajan firmadas en la cookie y las visitas no se guardan.

Si se cambia la semilla del contenido importado (`contenido/semilla/`, `server/semilla.js`), el diario de contenidos empieza de nuevo para no mezclar números de fila; los ajustes, el diseño y los menús se conservan.

Aun así, para un uso intensivo del panel se recomienda un servidor con disco persistente (abajo) o Railway, Render o Fly.io con un volumen montado en `DATA_DIR`.

## Requisitos

- Linux con **Node.js 22.5 o superior** (usa `node:sqlite`, sin dependencias externas).
- nginx (o similar) como proxy inverso con HTTPS.
- 1 GB de RAM es suficiente; el disco depende de las imágenes (el sitio actual tiene ~1.800 archivos).

## Instalación

```bash
git clone <repositorio> /srv/sitio-melipeuco && cd /srv/sitio-melipeuco
cp .env.example .env
nano .env                      # PUBLIC_URL, ADMIN_EMAIL, ADMIN_PASSWORD, TRAMITES_URL, SMTP_*, BACKUP_KEY
npm test                       # verifica el entorno
npm start                      # primer arranque: crea data/sitio.db con todo el contenido
```

Servicio systemd (`/etc/systemd/system/sitio-melipeuco.service`):

```ini
[Unit]
Description=Sitio web Municipalidad de Melipeuco
After=network.target

[Service]
WorkingDirectory=/srv/sitio-melipeuco
ExecStart=/usr/bin/node --no-warnings server/server.js
Restart=always
User=sitio
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## nginx (sitio y Plataforma en el mismo servidor)

```nginx
server {
  listen 443 ssl http2;
  server_name municipalidadmelipeuco.cl www.municipalidadmelipeuco.cl;
  # ssl_certificate ... (Let's Encrypt)
  client_max_body_size 45m;
  location / { proxy_pass http://127.0.0.1:8090; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto https; }
}
server {
  listen 443 ssl http2;
  server_name tramites.municipalidadmelipeuco.cl;
  client_max_body_size 50m;
  location / { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_buffering off; }
}
server { listen 80; server_name municipalidadmelipeuco.cl www.municipalidadmelipeuco.cl tramites.municipalidadmelipeuco.cl; return 301 https://$host$request_uri; }
```

Con un proxy delante, deje `TRUST_PROXY=1` para registrar la IP real (límites de intentos y auditoría).

## Paso a producción desde el WordPress actual

1. Instale el sitio nuevo en el servidor con un subdominio de prueba (por ejemplo `nuevo.municipalidadmelipeuco.cl`) y `MEDIOS_RESPALDO_URL=https://municipalidadmelipeuco.cl/`: las imágenes antiguas se cargan desde el WordPress mientras tanto.
2. Actualice el contenido publicado después de la semilla: `npm run importar` (agrega noticias y páginas nuevas sin tocar lo editado).
3. **Copie las imágenes y archivos**: `npm run importar -- --medios` (o *Sistema → Importar desde WordPress* marcando «Descargar también imágenes»). Quedan en `data/uploads/wp/` y se sirven en las mismas direcciones `/wp-content/uploads/…`.
4. Revise el sitio, cree los usuarios y active la verificación en dos pasos.
5. Mueva el WordPress a otro subdominio (por ejemplo `antiguo.municipalidadmelipeuco.cl`) por si hace falta consultarlo, y apunte el dominio principal al sitio nuevo. Cambie `PUBLIC_URL` y `MEDIOS_RESPALDO_URL=https://antiguo.municipalidadmelipeuco.cl/` (o déjelo vacío si ya copió todos los medios).
6. En Google Search Console, envíe `https://municipalidadmelipeuco.cl/sitemap.xml`.

## Respaldos

- Automáticos cada 24 horas en `data/backups/` (se conservan `BACKUP_KEEP`). Con `BACKUP_KEY` se cifran con AES-256-GCM y cada uno lleva su huella SHA-256.
- Manual: `npm run respaldo` o *Sistema → Crear respaldo ahora*.
- Restaurar: detenga el servicio, copie el respaldo como `data/sitio.db` (si está cifrado: `BACKUP_KEY=… node herramientas/respaldo.js descifrar archivo.db.enc data/sitio.db`) y vuelva a iniciar.
- Respalde también `data/uploads/` (imágenes y archivos) con la copia del servidor.

## Actualizar

```bash
git pull && npm test && sudo systemctl restart sitio-melipeuco
```

La base se migra sola al iniciar (versiones de esquema en `server/db.js`).

## Recuperar el acceso

```bash
npm run usuario -- listar
npm run usuario -- restablecer informatica@munimelipeuco.cl   # nueva contraseña temporal y desbloqueo
npm run usuario -- quitar-2fa informatica@munimelipeuco.cl
```
