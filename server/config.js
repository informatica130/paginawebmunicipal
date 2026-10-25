// Configuración por variables de entorno (archivo .env opcional, ver .env.example).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function cargarEnv(archivo = path.join(RAIZ, '.env')) {
  if (fs.existsSync(archivo)) {
    for (const linea of fs.readFileSync(archivo, 'utf8').split(/\r?\n/)) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  const e = process.env;
  const PORT = Number(e.PORT || 8090);
  // En Vercel, si no se definió PUBLIC_URL se usa el dominio del proyecto.
  const vercel = e.VERCEL_PROJECT_PRODUCTION_URL || e.VERCEL_URL;
  const PUBLIC_URL = (e.PUBLIC_URL || (vercel ? `https://${vercel}/` : `http://localhost:${PORT}/`)).replace(/\/?$/, '/');
  const conBarra = (u) => (u ? String(u).trim().replace(/\/?$/, '/') : '');
  return {
    PORT,
    PUBLIC_URL,
    SEGURA: PUBLIC_URL.startsWith('https://'),
    // Vercel sólo permite escribir en /tmp (efímero).
    DATA_DIR: path.resolve(RAIZ, e.DATA_DIR || (e.VERCEL ? '/tmp/sitio-melipeuco' : 'data')),
    VERCEL: !!e.VERCEL,
    // Sesiones del panel firmadas en la cookie (varias instancias sin base compartida).
    SESIONES_FIRMADAS: e.SESIONES_FIRMADAS === '1' || e.SESIONES_FIRMADAS === true,
    TRUST_PROXY: Math.max(0, Number(e.TRUST_PROXY || (e.VERCEL ? 1 : 0)) || 0),
    LOG_REQUESTS: e.LOG_REQUESTS === '1',
    ADMIN_EMAIL: e.ADMIN_EMAIL || 'informatica@munimelipeuco.cl',
    ADMIN_PASSWORD: e.ADMIN_PASSWORD || '',
    TRAMITES_URL: conBarra(e.TRAMITES_URL),
    TRAMITES_API_KEY: e.TRAMITES_API_KEY || '',
    TRAMITES_OIRS_CODIGO: e.TRAMITES_OIRS_CODIGO || 'SEC-OIRS-01',
    CORS_ORIGINS: String(e.CORS_ORIGINS || '').split(/[\s,]+/).filter(Boolean),
    MEDIOS_RESPALDO_URL: conBarra(e.MEDIOS_RESPALDO_URL ?? 'https://municipalidadmelipeuco.cl/'),
    SMTP: { host: e.SMTP_HOST, port: e.SMTP_PORT || 587, user: e.SMTP_USER, pass: e.SMTP_PASS, from: e.SMTP_FROM },
    AVISOS_EMAIL: e.AVISOS_EMAIL || '',
    BACKUP_KEEP: Number(e.BACKUP_KEEP || 14),
    BACKUP_KEY: e.BACKUP_KEY || '',
    DEMO: e.DEMO === '1',
    SECRETO: e.SITIO_SECRETO || '',
  };
}
