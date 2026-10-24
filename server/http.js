// Utilidades HTTP: respuestas, compresión, lectura de cuerpos con límite, archivos
// estáticos con ETag y caché, y cabeceras de seguridad.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

export class ErrorHttp extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}

export const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.odt': 'application/vnd.oasis.opendocument.text', '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.zip': 'application/zip', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.csv': 'text/csv; charset=utf-8', '.ics': 'text/calendar; charset=utf-8', '.kml': 'application/vnd.google-earth.kml+xml', '.gpx': 'application/gpx+xml',
};
const COMPRIMIBLE = /^(text\/|application\/(json|javascript|xml|manifest)|image\/svg)/;

export function enviar(req, res, status, cuerpo, cabeceras = {}) {
  let buf = Buffer.isBuffer(cuerpo) ? cuerpo : Buffer.from(String(cuerpo ?? ''), 'utf8');
  const tipo = cabeceras['Content-Type'] || 'text/html; charset=utf-8';
  const h = { 'Content-Type': tipo, ...cabeceras };
  const acepta = String(req.headers['accept-encoding'] || '');
  if (buf.length > 1024 && COMPRIMIBLE.test(tipo) && req.method !== 'HEAD') {
    if (/\bbr\b/.test(acepta)) { buf = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }); h['Content-Encoding'] = 'br'; }
    else if (/\bgzip\b/.test(acepta)) { buf = zlib.gzipSync(buf, { level: 6 }); h['Content-Encoding'] = 'gzip'; }
    h.Vary = 'Accept-Encoding';
  }
  h['Content-Length'] = buf.length;
  res.writeHead(status, h);
  res.end(req.method === 'HEAD' ? undefined : buf);
}

export function json(req, res, status, datos, cabeceras = {}) {
  enviar(req, res, status, JSON.stringify(datos), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras });
}

export function redirigir(res, url, codigo = 302) {
  res.writeHead(codigo, { Location: url, 'Cache-Control': codigo === 301 ? 'public, max-age=86400' : 'no-store' });
  res.end();
}

export function leerCuerpo(req, max = 1024 * 1024) {
  return new Promise((ok, mal) => {
    const largo = Number(req.headers['content-length'] || 0);
    if (largo > max) { req.resume(); return mal(new ErrorHttp(413, 'El contenido enviado es demasiado grande.')); }
    const partes = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > max) { req.destroy(); mal(new ErrorHttp(413, 'El contenido enviado es demasiado grande.')); return; }
      partes.push(c);
    });
    req.on('end', () => ok(Buffer.concat(partes)));
    req.on('error', mal);
  });
}

export async function leerJson(req, max) {
  const b = await leerCuerpo(req, max);
  if (!b.length) return {};
  try { return JSON.parse(b.toString('utf8')); } catch { throw new ErrorHttp(400, 'JSON inválido.'); }
}

export async function leerFormulario(req, max = 64 * 1024) {
  const tipo = String(req.headers['content-type'] || '');
  const b = await leerCuerpo(req, max);
  if (tipo.includes('application/json')) { try { return JSON.parse(b.toString('utf8')); } catch { throw new ErrorHttp(400, 'Datos inválidos.'); } }
  return Object.fromEntries(new URLSearchParams(b.toString('utf8')));
}

// Archivos estáticos. `raiz` es absoluta; se impide salir de ella.
const etags = new Map();
export function servirArchivo(req, res, raiz, relativa, { maxAge = 3600, inmutable = false, descarga = false, cabeceras = {} } = {}) {
  let rel;
  try { rel = decodeURIComponent(relativa); } catch { return false; }
  if (rel.includes('\0')) return false;
  const archivo = path.join(raiz, path.normalize('/' + rel));
  if (!archivo.startsWith(raiz + path.sep) && archivo !== raiz) return false;
  let st;
  try { st = fs.statSync(archivo); } catch { return false; }
  if (!st.isFile()) return false;
  const ext = path.extname(archivo).toLowerCase();
  const tipo = MIME[ext] || 'application/octet-stream';
  const clave = archivo + ':' + st.mtimeMs + ':' + st.size;
  let etag = etags.get(clave);
  if (!etag) { etag = '"' + crypto.createHash('sha1').update(clave).digest('base64url').slice(0, 20) + '"'; etags.set(clave, etag); if (etags.size > 5000) etags.clear(); }
  const h = {
    'Content-Type': tipo, ETag: etag, 'Last-Modified': st.mtime.toUTCString(),
    'Cache-Control': inmutable ? 'public, max-age=31536000, immutable' : `public, max-age=${maxAge}`,
    'X-Content-Type-Options': 'nosniff', ...cabeceras,
  };
  // Archivos subidos: nunca se interpretan como página del sitio.
  if (ext === '.svg') h['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  const enLinea = /^(image|video|audio|font|text\/(css|javascript|plain)|application\/(pdf|json|manifest|xml))/.test(tipo);
  if (descarga || !enLinea) h['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(archivo))}`;
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); res.end(); return true; }
  if (COMPRIMIBLE.test(tipo) && st.size > 1024 && st.size < 5e6) {
    return enviar(req, res, 200, fs.readFileSync(archivo), h), true;
  }
  // Rangos (video/audio/PDF grandes)
  const rango = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
  if (rango && (rango[1] || rango[2])) {
    let ini = rango[1] ? Number(rango[1]) : st.size - Number(rango[2]);
    let fin = rango[1] && rango[2] ? Number(rango[2]) : st.size - 1;
    if (ini < 0) ini = 0;
    if (ini >= st.size || fin < ini) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); res.end(); return true; }
    fin = Math.min(fin, st.size - 1);
    res.writeHead(206, { ...h, 'Content-Range': `bytes ${ini}-${fin}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': fin - ini + 1 });
    if (req.method === 'HEAD') return res.end(), true;
    fs.createReadStream(archivo, { start: ini, end: fin }).pipe(res);
    return true;
  }
  res.writeHead(200, { ...h, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(archivo).pipe(res);
  return true;
}

// Cabeceras de seguridad comunes. `nonce` habilita los <script> en línea propios.
export function cabecerasSeguridad({ nonce, segura, tramites = '', panel = false }) {
  const t = tramites ? new URL(tramites).origin : '';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${t ? ' ' + t : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https:",
    `connect-src 'self'${t ? ' ' + t : ''} https://api.open-meteo.com`,
    `frame-src 'self'${t ? ' ' + t : ''} https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://www.google.com https://maps.google.com https://www.facebook.com https://docs.google.com https://drive.google.com https://calendar.google.com https://www.openstreetmap.org`,
    `form-action 'self'${t ? ' ' + t : ''}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(segura ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    ...(panel ? { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    ...(segura ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
  };
}
