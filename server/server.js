#!/usr/bin/env node
// Sitio web de la Ilustre Municipalidad de Melipeuco (Node.js ≥ 22.5, sin dependencias).
//   npm start   -> http://localhost:8090      ·   panel: /admin/
// Configuración por variables de entorno (ver .env.example).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { cargarEnv, RAIZ } from './config.js';
import { Db, ahora } from './db.js';
import { crearRepositorio } from './contenidos.js';
import { crearClienteTramites } from './tramites.js';
import { createMailer } from './correo.js';
import { crearSitio } from './sitio.js';
import { crearApiAdmin } from './api-admin.js';
import { cargarSemillaWordpress, sembrarBase } from './semilla.js';
import { permitirIframes } from './sanitizar.js';
import { enviar, json, servirArchivo, cabecerasSeguridad, redirigir, ErrorHttp } from './http.js';
import { hashClave, claveTemporal, leerCookies, leerSesion, COOKIE, Limitador } from './auth.js';
import { respaldar } from '../herramientas/respaldo.js';

export async function iniciar(opciones = {}) {
  const cfg = { ...cargarEnv(), ...opciones };
  fs.mkdirSync(path.join(cfg.DATA_DIR, 'uploads'), { recursive: true });
  const db = new Db(opciones.archivoDb || path.join(cfg.DATA_DIR, 'sitio.db'));
  const repo = crearRepositorio(db);

  // Primer arranque: contenido importado del sitio anterior + estructura mejorada.
  const wp = opciones.sinSemilla ? null : cargarSemillaWordpress(db, repo);
  if (wp) console.log(`Contenido del sitio anterior cargado: ${wp.creados} elementos.`);
  if (sembrarBase(db, repo)) console.log('Estructura base del sitio creada (áreas, trámites, menús, accesos).');

  // Super Administrador inicial
  if (!db.get('SELECT 1 FROM usuarios LIMIT 1')) {
    const clave = cfg.ADMIN_PASSWORD || claveTemporal();
    db.run('INSERT INTO usuarios(email, nombre, cargo, rol, clave, debe_cambiar_clave, creado) VALUES(?,?,?,?,?,?,?)', cfg.ADMIN_EMAIL, 'Administración del sitio', 'Informática', 'superadmin', await hashClave(clave), cfg.ADMIN_PASSWORD ? 0 : 1, ahora());
    if (!opciones.silencioso) console.log(`\nSuper Administrador: ${cfg.ADMIN_EMAIL}\n${cfg.ADMIN_PASSWORD ? 'Contraseña: la de ADMIN_PASSWORD' : `Contraseña temporal (cámbiela al ingresar): ${clave}`}\n`);
  }

  let secreto = cfg.SECRETO || db.ajuste('secreto');
  if (!secreto) { secreto = crypto.randomBytes(32).toString('base64url'); db.guardarAjuste('secreto', secreto); }

  const tramites = crearClienteTramites({ base: cfg.TRAMITES_URL, apiKey: cfg.TRAMITES_API_KEY, codigoOirs: cfg.TRAMITES_OIRS_CODIGO, fetchImpl: opciones.fetchTramites });
  permitirIframes([cfg.TRAMITES_URL]);
  const mailer = createMailer(cfg.SMTP);
  const limitador = new Limitador();

  // Versión de los archivos estáticos para invalidar la caché del navegador.
  const PUB = path.join(RAIZ, 'public');
  const version = crypto.createHash('sha1').update(['css/sitio.css', 'js/sitio.js', 'admin/admin.js', 'admin/admin.css'].map((f) => { try { return fs.statSync(path.join(PUB, f)).mtimeMs; } catch { return 0; } }).join('|')).digest('hex').slice(0, 10);

  const leerUsuario = (req) => {
    if (req._usuario !== undefined) return req._usuario;
    const t = leerCookies(req)[COOKIE];
    const s = t ? leerSesion(db, t) : null;
    req._sesion = s?.sesion || null;
    req._usuario = s && s.sesion.paso === 'ok' ? s.usuario : null;
    return req._usuario;
  };

  const auditar = (usuario, accion, objeto = '', detalle = '', ip = null) => {
    db.run('INSERT INTO auditoria(en, usuario_id, usuario, accion, objeto, detalle, ip) VALUES(?,?,?,?,?,?,?)', ahora(), usuario?.id || null, usuario ? `${usuario.nombre} <${usuario.email}>` : '', accion, String(objeto).slice(0, 200), typeof detalle === 'string' ? detalle.slice(0, 2000) : JSON.stringify(detalle).slice(0, 2000), ip);
  };

  const sitio = crearSitio({ db, repo, cfg, tramites, mailer, limitador, version, secreto, leerUsuario, auditar });
  const admin = crearApiAdmin({ db, repo, cfg, tramites, mailer, limitador, auditar, invalidar: () => sitio.invalidar(), leerUsuario, version });

  // Tareas periódicas: publicar lo programado, limpiar sesiones vencidas y respaldo diario.
  const tareas = [];
  tareas.push(setInterval(() => { if (repo.publicarProgramados()) sitio.invalidar(); }, 60e3));
  tareas.push(setInterval(() => db.run('DELETE FROM sesiones WHERE expira < ?', ahora()), 3600e3));
  if (!opciones.sinRespaldos) {
    const hacerRespaldo = () => { try { respaldar(db, cfg); } catch (e) { console.error('Respaldo:', e.message); } };
    tareas.push(setInterval(hacerRespaldo, 24 * 3600e3));
    setTimeout(hacerRespaldo, 5 * 60e3).unref();
  }
  tareas.forEach((t) => t.unref());

  const UPLOADS = path.join(cfg.DATA_DIR, 'uploads');
  const respaldoMedios = cfg.MEDIOS_RESPALDO_URL && new URL(cfg.MEDIOS_RESPALDO_URL).origin !== new URL(cfg.PUBLIC_URL).origin ? cfg.MEDIOS_RESPALDO_URL : '';

  function ipDe(req) {
    const directa = req.socket.remoteAddress || '';
    if (!cfg.TRUST_PROXY) return directa;
    const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    return xff[xff.length - cfg.TRUST_PROXY] || xff[0] || directa;
  }

  async function manejar(req, res) {
    const inicio = Date.now();
    req.ip = ipDe(req);
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400); return res.end(); }
    const ruta = url.pathname;
    req.seguridad = (nonce, panel = false) => cabecerasSeguridad({ nonce, segura: cfg.SEGURA, tramites: cfg.TRAMITES_URL, panel });
    res.on('finish', () => { if (cfg.LOG_REQUESTS) console.log(JSON.stringify({ t: new Date().toISOString(), m: req.method, r: ruta, s: res.statusCode, ms: Date.now() - inicio })); });
    try {
      if (ruta.length > 2000 || ruta.includes('\0')) throw new ErrorHttp(400, 'Solicitud inválida');
      // Archivos estáticos
      if (/^\/(css|js|img|fuentes)\//.test(ruta)) {
        if (servirArchivo(req, res, PUB, ruta, { maxAge: url.search ? 31536000 : 3600, inmutable: !!url.search })) return;
        throw new ErrorHttp(404, 'No encontrado');
      }
      if (ruta === '/favicon.ico') return servirArchivo(req, res, PUB, '/img/favicon.png', { maxAge: 86400 }) || undefined;
      if (ruta === '/sw.js') return servirArchivo(req, res, PUB, '/js/sw.js', { maxAge: 0, cabeceras: { 'Service-Worker-Allowed': '/', 'Cache-Control': 'no-cache' } }) || undefined;
      // Medios subidos y heredados de WordPress
      if (ruta.startsWith('/medios/')) {
        if (servirArchivo(req, res, path.join(UPLOADS, 'sitio'), ruta.slice('/medios'.length), { inmutable: true })) return;
        throw new ErrorHttp(404, 'Archivo no encontrado');
      }
      if (ruta.startsWith('/wp-content/uploads/')) {
        if (servirArchivo(req, res, path.join(UPLOADS, 'wp'), ruta.slice('/wp-content/uploads'.length), { maxAge: 30 * 86400 })) return;
        if (respaldoMedios) return redirigir(res, respaldoMedios + ruta.slice(1), 302);
        throw new ErrorHttp(404, 'Archivo no encontrado');
      }
      // Panel de administración
      if (ruta === '/admin') return redirigir(res, '/admin/', 301);
      if (ruta.startsWith('/admin/')) {
        if (ruta === '/admin/' || ruta === '/admin/index.html') {
          const nonce = crypto.randomBytes(16).toString('base64');
          const h = fs.readFileSync(path.join(PUB, 'admin/index.html'), 'utf8').replaceAll('{{NONCE}}', nonce).replaceAll('{{V}}', version);
          return enviar(req, res, 200, h, { 'Content-Type': 'text/html; charset=utf-8', ...req.seguridad(nonce, true) });
        }
        if (servirArchivo(req, res, PUB, ruta, { maxAge: url.search ? 31536000 : 0, inmutable: !!url.search, cabeceras: { 'X-Robots-Tag': 'noindex' } })) return;
        throw new ErrorHttp(404, 'No encontrado');
      }
      if (ruta.startsWith('/api/admin/')) return await admin.manejar(req, res, url);
      if (ruta === '/api/salud') return json(req, res, 200, { ok: true, version, hora: ahora(), tramites: await tramites.estado() });
      return await sitio.manejar(req, res, url);
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error(e);
      if (res.headersSent) return res.end();
      if (ruta.startsWith('/api/')) return json(req, res, status, { error: status >= 500 ? 'Error interno. Intente nuevamente.' : e.message });
      const nonce = crypto.randomBytes(16).toString('base64');
      enviar(req, res, status, `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error ${status}</title><link rel="stylesheet" href="/css/sitio.css"></head><body><main class="contenedor angosto error-404"><p class="error-codigo">${status}</p><h1>${status === 429 ? 'Demasiadas solicitudes' : status === 404 ? 'No encontrado' : status >= 500 ? 'Ocurrió un problema' : 'No se pudo completar la solicitud'}</h1><p>${String(status >= 500 ? 'Estamos trabajando para resolverlo. Intente nuevamente en unos minutos.' : e.message).replace(/[<>&]/g, '')}</p><p><a class="boton boton-primario" href="/">Ir al inicio</a></p></main></body></html>`, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...req.seguridad(nonce) });
    }
  }

  const servidor = http.createServer(manejar);
  servidor.headersTimeout = 20000;
  servidor.requestTimeout = 120000;
  servidor.keepAliveTimeout = 5000;
  const cerrar = () => { tareas.forEach(clearInterval); sitio.volcarVisitas(); servidor.close(); db.cerrar(); };
  return { servidor, db, repo, cfg, cerrar, sitio, admin };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(RAIZ, 'server/server.js')) {
  const app = await iniciar();
  app.servidor.listen(app.cfg.PORT, () => console.log(`Sitio web de Melipeuco en ${app.cfg.PUBLIC_URL} (puerto ${app.cfg.PORT}) · panel: ${app.cfg.PUBLIC_URL}admin/`));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { app.cerrar(); process.exit(0); });
}
