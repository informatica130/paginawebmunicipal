// API del panel de administración (/api/admin/*). Todas las respuestas son JSON.
// Seguridad: sesión por cookie HttpOnly + token CSRF en cada escritura + verificación de
// origen; permisos por rol (src/tipos.js) y, opcionalmente, por áreas municipales;
// auditoría de cada acción; límites de intentos de ingreso.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { json, leerJson, leerCuerpo, ErrorHttp, enviar } from './http.js';
import { hashClave, verificarClave, problemaClave, claveTemporal, crearSesion, cookieSesion, leerCookies, leerSesion, COOKIE, nuevoSecretoTotp, verificarTotp } from './auth.js';
import { TIPOS, TAXONOMIAS, ESTADOS, PERMISOS, ROLES, RUTAS, ICONOS, tienePermiso } from '../src/tipos.js';
import { ErrorValidacion } from './contenidos.js';
import { ahora, parse } from './db.js';
import { slugify, emailValido, urlSegura, textoPlano, recortar } from '../src/util.js';
import { normalizar as normalizarDiseno } from '../public/js/diseno.js';
import { qrSvg } from '../src/qr.js';
import { respaldar } from '../herramientas/respaldo.js';

const MAX_SUBIDA = 40 * 1024 * 1024;
const FIRMAS = [
  ['image/jpeg', '.jpg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['image/png', '.png', (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ['image/gif', '.gif', (b) => b.subarray(0, 4).toString() === 'GIF8'],
  ['image/webp', '.webp', (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'],
  ['image/avif', '.avif', (b) => b.subarray(4, 12).toString() === 'ftypavif'],
  ['application/pdf', '.pdf', (b) => b.subarray(0, 5).toString() === '%PDF-'],
  ['video/mp4', '.mp4', (b) => b.subarray(4, 8).toString() === 'ftyp' && !b.subarray(8, 12).toString().startsWith('avi')],
  ['audio/mpeg', '.mp3', (b) => b.subarray(0, 3).toString() === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)],
  ['application/vnd.ms-office', null, (b) => b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))],
  ['application/zip', null, (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04],
];
const EXT_OFFICE = { '.doc': 'application/msword', '.xls': 'application/vnd.ms-excel', '.ppt': 'application/vnd.ms-powerpoint' };
const EXT_ZIP = { '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.odt': 'application/vnd.oasis.opendocument.text', '.ods': 'application/vnd.oasis.opendocument.spreadsheet', '.zip': 'application/zip', '.kmz': 'application/vnd.google-earth.kmz' };

export function crearApiAdmin({ db, repo, cfg, tramites, mailer, limitador, auditar, invalidar, version }) {
  const rutas = [];
  const ruta = (metodo, patron, permiso, fn) => {
    const claves = [];
    const re = new RegExp('^' + patron.replace(/:(\w+)/g, (_, k) => (claves.push(k), '([^/]+)')) + '/?$');
    rutas.push({ metodo, re, claves, permiso, fn });
  };

  // ---------------------------------------------------------------- utilidades
  const usuarioPublico = (u) => u && ({ id: u.id, email: u.email, nombre: u.nombre, cargo: u.cargo, rol: u.rol, areas: parse(u.areas, []), activo: !!u.activo, totp: !!u.totp_activo, debeCambiarClave: !!u.debe_cambiar_clave, ultimoAcceso: u.ultimo_acceso, bloqueadoHasta: u.bloqueado_hasta, accesoHasta: u.acceso_hasta, creado: u.creado });
  const permisosDe = (u) => ROLES[u.rol]?.permisos || [];
  const exigir = (u, p) => { if (!tienePermiso(u, p)) throw new ErrorHttp(403, 'No tiene permiso para esta acción.'); };
  const areasDe = (u) => parse(u.areas, []).map(Number).filter(Boolean);

  // Un usuario con áreas asignadas sólo trabaja contenidos de esas áreas (y sus subáreas).
  function areasPermitidas(u) {
    const base = areasDe(u);
    if (!base.length || u.rol === 'superadmin' || u.rol === 'administrador') return null;
    const todas = new Set(base);
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const f of db.all("SELECT id, padre_id FROM contenidos WHERE tipo = 'area'")) if (f.padre_id && todas.has(f.padre_id) && !todas.has(f.id)) { todas.add(f.id); cambio = true; }
    }
    return todas;
  }
  function puedeEditar(u, c) {
    if (!c) return false;
    const areas = areasPermitidas(u);
    if (areas && !(areas.has(c.area_id) || (c.tipo === 'area' && areas.has(c.id)))) return false;
    if (tienePermiso(u, 'contenido.editar')) return true;
    return tienePermiso(u, 'contenido.editar_propio') && c.autor_id === u.id && (c.estado !== 'publicado' || tienePermiso(u, 'contenido.publicar'));
  }

  function nombreUsuario(id) { return id ? db.get('SELECT nombre FROM usuarios WHERE id = ?', id)?.nombre || '' : ''; }

  // ---------------------------------------------------------------- Ingreso
  ruta('POST', 'login', null, async ({ body, req, res }) => {
    const ip = req.ip;
    if (limitador.exceso('login-ip:' + ip, 15, 900)) throw new ErrorHttp(429, 'Demasiados intentos desde su conexión. Espere 15 minutos.');
    const email = String(body.email || '').trim().toLowerCase();
    const u = db.get('SELECT * FROM usuarios WHERE email = ?', email);
    if (u?.bloqueado_hasta && u.bloqueado_hasta > ahora()) {
      await verificarClave('x', '');
      throw new ErrorHttp(423, 'La cuenta está bloqueada temporalmente por intentos fallidos. Intente más tarde o pida ayuda a la administración.');
    }
    const ok = await verificarClave(String(body.clave || ''), u?.clave);
    if (!u || !ok || !u.activo || (u.acceso_hasta && u.acceso_hasta < ahora().slice(0, 10))) {
      if (u) {
        const intentos = u.intentos + 1;
        const bloqueo = intentos >= 10 ? 3600e3 : intentos >= 5 ? 900e3 : 0;
        db.run('UPDATE usuarios SET intentos = ?, bloqueado_hasta = ? WHERE id = ?', intentos, bloqueo ? new Date(Date.now() + bloqueo).toISOString() : u.bloqueado_hasta, u.id);
        auditar(u, 'ingreso.fallido', u.email, `Intento ${intentos}`, ip);
      }
      throw new ErrorHttp(401, 'Correo o contraseña incorrectos.');
    }
    db.run('UPDATE usuarios SET intentos = 0, bloqueado_hasta = NULL WHERE id = ?', u.id);
    const paso = u.totp_activo ? 'totp' : 'ok';
    const token = crearSesion(db, u, { ip, agente: req.headers['user-agent'], paso });
    res.setHeader('Set-Cookie', cookieSesion(token, { segura: cfg.SEGURA }));
    if (paso === 'ok') { db.run('UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?', ahora(), u.id); auditar(u, 'ingreso', u.email, '', ip); }
    return { paso };
  });

  ruta('POST', 'login/totp', null, ({ body, req, sesion }) => {
    if (!sesion || sesion.sesion.paso !== 'totp') throw new ErrorHttp(401, 'Ingrese primero su correo y contraseña.');
    if (limitador.exceso('totp:' + sesion.sesion.id, 6, 600)) { db.run('DELETE FROM sesiones WHERE id = ?', sesion.sesion.id); throw new ErrorHttp(429, 'Demasiados códigos incorrectos. Ingrese de nuevo.'); }
    const u = sesion.usuario;
    const paso = verificarTotp(u.totp_secreto, body.codigo, u.totp_ultimo);
    if (!paso) { auditar(u, 'ingreso.totp_fallido', u.email, '', req.ip); throw new ErrorHttp(401, 'El código no es válido. Revise la hora de su teléfono e inténtelo de nuevo.'); }
    db.run('UPDATE usuarios SET totp_ultimo = ?, ultimo_acceso = ? WHERE id = ?', paso, ahora(), u.id);
    db.run("UPDATE sesiones SET paso = 'ok' WHERE id = ?", sesion.sesion.id);
    auditar(u, 'ingreso', u.email, 'con segundo factor', req.ip);
    return { paso: 'ok' };
  });

  ruta('POST', 'logout', null, ({ res, sesion }) => {
    if (sesion) { db.run('DELETE FROM sesiones WHERE id = ?', sesion.sesion.id); auditar(sesion.usuario, 'salida', sesion.usuario.email); }
    res.setHeader('Set-Cookie', cookieSesion('', { segura: cfg.SEGURA, borrar: true }));
    return { ok: true };
  });

  ruta('GET', 'sesion', '*', ({ u, sesion }) => ({
    usuario: usuarioPublico(u), permisos: permisosDe(u), csrf: sesion.sesion.csrf, version,
    esquema: { tipos: TIPOS, taxonomias: TAXONOMIAS, estados: ESTADOS, permisos: PERMISOS, roles: ROLES, rutas: RUTAS, iconos: ICONOS },
    sitio: { nombre: db.ajuste('sitio')?.nombre, url: cfg.PUBLIC_URL, tramites: cfg.TRAMITES_URL || null, correo: !!mailer, efimero: !!cfg.VERCEL },
    areasPermitidas: areasPermitidas(u) ? [...areasPermitidas(u)] : null,
  }));

  ruta('POST', 'clave', '*', async ({ u, body, sesion, req }) => {
    if (!(await verificarClave(String(body.actual || ''), u.clave))) throw new ErrorHttp(400, 'La contraseña actual no es correcta.');
    const p = problemaClave(body.nueva, u);
    if (p) throw new ErrorHttp(400, p);
    if (await verificarClave(String(body.nueva), u.clave)) throw new ErrorHttp(400, 'La nueva contraseña debe ser distinta de la actual.');
    db.run('UPDATE usuarios SET clave = ?, debe_cambiar_clave = 0, clave_cambiada = ? WHERE id = ?', await hashClave(body.nueva), ahora(), u.id);
    db.run('DELETE FROM sesiones WHERE usuario_id = ? AND id != ?', u.id, sesion.sesion.id);
    auditar(u, 'clave.cambiada', u.email, 'Se cerraron las demás sesiones', req.ip);
    return { ok: true };
  });

  ruta('POST', 'totp/iniciar', '*', ({ u }) => {
    const secreto = nuevoSecretoTotp();
    db.run('UPDATE usuarios SET totp_secreto = ? WHERE id = ? AND totp_activo = 0', secreto, u.id);
    const otpauth = `otpauth://totp/${encodeURIComponent('Sitio Melipeuco:' + u.email)}?secret=${secreto}&issuer=${encodeURIComponent('Sitio Melipeuco')}&digits=6&period=30`;
    return { secreto, otpauth, qr: qrSvg(otpauth, { tam: 200 }) };
  });
  ruta('POST', 'totp/activar', '*', ({ u, body }) => {
    const f = db.get('SELECT totp_secreto FROM usuarios WHERE id = ?', u.id);
    const paso = verificarTotp(f.totp_secreto, body.codigo, 0);
    if (!paso) throw new ErrorHttp(400, 'El código no coincide. Escanee de nuevo el código QR e intente con el código que aparece ahora.');
    db.run('UPDATE usuarios SET totp_activo = 1, totp_ultimo = ? WHERE id = ?', paso, u.id);
    auditar(u, 'totp.activado', u.email);
    return { ok: true };
  });
  ruta('POST', 'totp/desactivar', '*', async ({ u, body }) => {
    if (!(await verificarClave(String(body.clave || ''), u.clave))) throw new ErrorHttp(400, 'Contraseña incorrecta.');
    db.run('UPDATE usuarios SET totp_activo = 0, totp_secreto = NULL WHERE id = ?', u.id);
    auditar(u, 'totp.desactivado', u.email);
    return { ok: true };
  });
  ruta('GET', 'mis-sesiones', '*', ({ u, sesion }) => db.all('SELECT id, ip, agente, creado, ultimo_uso FROM sesiones WHERE usuario_id = ? ORDER BY ultimo_uso DESC', u.id).map((s) => ({ ...s, id: s.id.slice(0, 12), actual: s.id === sesion.sesion.id })));
  ruta('DELETE', 'mis-sesiones/:id', '*', ({ u, p }) => { db.run('DELETE FROM sesiones WHERE usuario_id = ? AND substr(id, 1, 12) = ?', u.id, p.id); return { ok: true }; });

  // ---------------------------------------------------------------- Escritorio
  ruta('GET', 'escritorio', 'contenido.ver', async ({ u }) => {
    const cuenta = (sql, ...a) => db.get(sql, ...a).n;
    const hoy = ahora().slice(0, 10);
    const hace30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    return {
      contenidos: db.all("SELECT tipo, estado, count(*) n FROM contenidos GROUP BY tipo, estado"),
      revision: db.all("SELECT id, tipo, titulo, modificado, autor_id FROM contenidos WHERE estado = 'revision' ORDER BY modificado DESC LIMIT 10").map((c) => ({ ...c, autor: nombreUsuario(c.autor_id) })),
      programados: db.all("SELECT id, tipo, titulo, publicado_en FROM contenidos WHERE estado = 'programado' ORDER BY publicado_en LIMIT 10"),
      recientes: db.all('SELECT id, tipo, titulo, estado, modificado, modificado_por FROM contenidos ORDER BY modificado DESC LIMIT 12').map((c) => ({ ...c, por: nombreUsuario(c.modificado_por) })),
      misBorradores: db.all("SELECT id, tipo, titulo, modificado FROM contenidos WHERE autor_id = ? AND estado IN ('borrador','revision') ORDER BY modificado DESC LIMIT 8", u.id),
      mensajes: tienePermiso(u, 'mensajes.ver') ? { nuevos: cuenta("SELECT count(*) n FROM mensajes WHERE estado = 'nuevo'"), enProceso: cuenta("SELECT count(*) n FROM mensajes WHERE estado = 'en_proceso'"), vencidos: cuenta("SELECT count(*) n FROM mensajes WHERE estado IN ('nuevo','en_proceso') AND creado < ?", new Date(Date.now() - 14 * 864e5).toISOString()) } : null,
      visitas: tienePermiso(u, 'estadisticas.ver') ? { hoy: db.get('SELECT coalesce(sum(n),0) n FROM visitas WHERE dia = ?', hoy).n, mes: db.get('SELECT coalesce(sum(n),0) n FROM visitas WHERE dia >= ?', hace30).n, serie: db.all('SELECT dia, sum(n) n FROM visitas WHERE dia >= ? GROUP BY dia ORDER BY dia', hace30) } : null,
      suscriptores: cuenta("SELECT count(*) n FROM suscriptores WHERE estado = 'activo'"),
      avisosVigentes: repo.vigentes('aviso').map((a) => ({ id: a.id, titulo: a.titulo, nivel: a.datos.nivel })),
      plataforma: await tramites.estado(),
    };
  });

  // ---------------------------------------------------------------- Contenidos
  ruta('GET', 'contenidos', 'contenido.ver', ({ u, q }) => {
    const tipo = q.get('tipo') || undefined;
    if (tipo && !TIPOS[tipo]) throw new ErrorHttp(400, 'Tipo desconocido');
    const areas = areasPermitidas(u);
    const r = repo.listar({ tipo, estado: q.get('estado') || undefined, q: q.get('q') || undefined, area: Number(q.get('area')) || undefined, autor: q.get('mios') ? u.id : undefined, taxonomia: Number(q.get('taxonomia')) || undefined, padre: q.get('padre') != null ? Number(q.get('padre')) || 0 : undefined, orden: q.get('orden') || (TIPOS[tipo]?.ordenable || tipo === 'area' ? 'orden' : 'modificado'), limite: Number(q.get('limite')) || 30, pagina: Number(q.get('pagina')) || 1, campos: 'resumen' });
    return { ...r, items: r.items.map((c) => ({ id: c.id, tipo: c.tipo, titulo: c.titulo, slug: c.slug, estado: c.estado, publicado_en: c.publicado_en, modificado: c.modificado, autor: nombreUsuario(c.autor_id), padre_id: c.padre_id, area_id: c.area_id, orden: c.orden, imagen: c.imagen, destacado: c.destacado, url: repo.urlDe(c), editable: puedeEditar(u, c), datos: TIPOS[c.tipo]?.sinPagina || c.tipo === 'evento' || c.tipo === 'sesion' ? c.datos : undefined })).filter((c) => !areas || c.editable || tienePermiso(u, 'contenido.ver')) };
  });

  ruta('GET', 'contenidos/:id', 'contenido.ver', ({ u, p }) => {
    const c = repo.obtener(Number(p.id));
    if (!c) throw new ErrorHttp(404, 'No encontrado');
    const bloqueo = c.bloqueo_por && c.bloqueo_por !== u.id && c.bloqueo_hasta > ahora() ? { por: nombreUsuario(c.bloqueo_por), hasta: c.bloqueo_hasta } : null;
    return { ...c, taxonomias: repo.taxonomiasDe(c.id).map((t) => t.id), url: repo.urlDe(c), autor: nombreUsuario(c.autor_id), modificadoPor: nombreUsuario(c.modificado_por), editable: puedeEditar(u, c), bloqueo, revisiones: db.get('SELECT count(*) n FROM revisiones WHERE contenido_id = ?', c.id).n };
  });

  function prepararEntrada(u, body, previo) {
    const e = { ...body };
    if (!tienePermiso(u, 'contenido.publicar') && ['publicado', 'programado'].includes(e.estado)) e.estado = 'revision';
    if (!tienePermiso(u, 'contenido.publicar')) { delete e.destacado; if (previo) e.publicado_en = previo.publicado_en; }
    const areas = areasPermitidas(u);
    if (areas) {
      const area = Number(e.area_id ?? previo?.area_id);
      if (e.tipo !== 'area' && !areas.has(area)) throw new ErrorHttp(403, 'Debe asignar el contenido a una de sus áreas.');
    }
    delete e.autor_id; delete e.wp_id; delete e.url_antigua;
    return e;
  }

  ruta('POST', 'contenidos', 'contenido.crear', ({ u, body, req }) => {
    if (!TIPOS[body.tipo]) throw new ErrorHttp(400, 'Tipo desconocido');
    if (['area', 'autoridad', 'acceso', 'slide', 'aviso'].includes(body.tipo) && !tienePermiso(u, 'contenido.editar')) throw new ErrorHttp(403, 'No puede crear este tipo de contenido.');
    const c = repo.guardar(prepararEntrada(u, body, null), { usuario: u, htmlAvanzado: tienePermiso(u, 'html.avanzado') });
    auditar(u, 'contenido.crear', `${c.tipo}#${c.id}`, c.titulo, req.ip);
    invalidar();
    return { ...c, url: repo.urlDe(c) };
  });

  ruta('PUT', 'contenidos/:id', 'contenido.ver', ({ u, p, body, req }) => {
    const previo = repo.obtener(Number(p.id));
    if (!previo) throw new ErrorHttp(404, 'No encontrado');
    if (!puedeEditar(u, previo)) throw new ErrorHttp(403, 'No puede editar este contenido.');
    if (body.modificadoBase && body.modificadoBase !== previo.modificado) throw new ErrorHttp(409, `${nombreUsuario(previo.modificado_por) || 'Otra persona'} guardó cambios en este contenido mientras usted lo editaba. Recargue para ver la versión actual (sus cambios siguen en pantalla: cópielos antes).`);
    const c = repo.guardar(prepararEntrada(u, { ...body, tipo: previo.tipo, id: previo.id }, previo), { usuario: u, htmlAvanzado: tienePermiso(u, 'html.avanzado') });
    db.run('UPDATE contenidos SET bloqueo_por = NULL WHERE id = ? AND bloqueo_por = ?', c.id, u.id);
    auditar(u, previo.estado !== c.estado ? `contenido.${c.estado}` : 'contenido.editar', `${c.tipo}#${c.id}`, c.titulo, req.ip);
    invalidar();
    return { ...c, url: repo.urlDe(c) };
  });

  ruta('POST', 'contenidos/:id/bloqueo', 'contenido.ver', ({ u, p }) => {
    const c = db.get('SELECT bloqueo_por, bloqueo_hasta FROM contenidos WHERE id = ?', Number(p.id));
    if (!c) throw new ErrorHttp(404, 'No encontrado');
    if (c.bloqueo_por && c.bloqueo_por !== u.id && c.bloqueo_hasta > ahora()) return { libre: false, por: nombreUsuario(c.bloqueo_por) };
    db.run('UPDATE contenidos SET bloqueo_por = ?, bloqueo_hasta = ? WHERE id = ?', u.id, new Date(Date.now() + 90e3).toISOString(), Number(p.id));
    return { libre: true };
  });

  ruta('DELETE', 'contenidos/:id', 'contenido.ver', ({ u, p, req }) => {
    const c = repo.obtener(Number(p.id));
    if (!c) throw new ErrorHttp(404, 'No encontrado');
    const propioBorrador = c.autor_id === u.id && c.estado !== 'publicado' && tienePermiso(u, 'contenido.editar_propio');
    if (!(tienePermiso(u, 'contenido.eliminar') && puedeEditar(u, c)) && !propioBorrador) throw new ErrorHttp(403, 'No puede eliminar este contenido.');
    repo.eliminar(c.id);
    auditar(u, 'contenido.eliminar', `${c.tipo}#${c.id}`, c.titulo, req.ip);
    invalidar();
    return { ok: true };
  });

  ruta('POST', 'contenidos/:id/duplicar', 'contenido.crear', ({ u, p, req }) => {
    const c = repo.obtener(Number(p.id));
    if (!c) throw new ErrorHttp(404, 'No encontrado');
    const n = repo.guardar(prepararEntrada(u, { ...c, id: undefined, titulo: c.titulo + ' (copia)', slug: c.slug + '-copia', estado: 'borrador', publicado_en: null, taxonomias: repo.taxonomiasDe(c.id).map((t) => t.id) }, null), { usuario: u, htmlAvanzado: true });
    auditar(u, 'contenido.duplicar', `${c.tipo}#${c.id}`, `→ #${n.id}`, req.ip);
    return n;
  });

  ruta('POST', 'contenidos/orden', 'contenido.editar', ({ u, body }) => {
    const ids = (body.ids || []).map(Number).filter(Boolean).slice(0, 1000);
    db.tx(() => ids.forEach((id, i) => db.run('UPDATE contenidos SET orden = ? WHERE id = ?', i, id)));
    auditar(u, 'contenido.ordenar', body.tipo || '', `${ids.length} elementos`);
    repo.invalidar(); invalidar();
    return { ok: true };
  });

  ruta('GET', 'contenidos/:id/revisiones', 'contenido.ver', ({ p }) => db.all('SELECT id, autor_id, creado, nota FROM revisiones WHERE contenido_id = ? ORDER BY id DESC', Number(p.id)).map((r) => ({ ...r, autor: nombreUsuario(r.autor_id) })));
  ruta('GET', 'contenidos/:id/revisiones/:rid', 'contenido.ver', ({ p }) => {
    const r = db.get('SELECT * FROM revisiones WHERE id = ? AND contenido_id = ?', Number(p.rid), Number(p.id));
    if (!r) throw new ErrorHttp(404, 'No encontrada');
    return JSON.parse(r.datos);
  });
  ruta('POST', 'contenidos/:id/revisiones/:rid/restaurar', 'contenido.ver', ({ u, p, req }) => {
    const c = repo.obtener(Number(p.id));
    const r = db.get('SELECT * FROM revisiones WHERE id = ? AND contenido_id = ?', Number(p.rid), Number(p.id));
    if (!c || !r) throw new ErrorHttp(404, 'No encontrada');
    if (!puedeEditar(u, c)) throw new ErrorHttp(403, 'No puede editar este contenido.');
    const d = JSON.parse(r.datos);
    const n = repo.guardar(prepararEntrada(u, { ...d, id: c.id, tipo: c.tipo, estado: c.estado, padre_id: d.padre_id }, c), { usuario: u, htmlAvanzado: tienePermiso(u, 'html.avanzado') });
    auditar(u, 'contenido.restaurar', `${c.tipo}#${c.id}`, `revisión ${r.id}`, req.ip);
    invalidar();
    return n;
  });

  // ---------------------------------------------------------------- Taxonomías
  ruta('GET', 'taxonomias', 'contenido.ver', ({ q }) => {
    const tipo = q.get('tipo');
    return db.all(`SELECT t.*, (SELECT count(*) FROM contenido_taxonomia ct WHERE ct.taxonomia_id = t.id) AS total FROM taxonomias t ${tipo ? 'WHERE t.tipo = ?' : ''} ORDER BY t.tipo, t.orden, t.nombre COLLATE NOCASE`, ...(tipo ? [tipo] : []));
  });
  ruta('POST', 'taxonomias', 'taxonomias.editar', ({ u, body }) => {
    if (!TAXONOMIAS[body.tipo]) throw new ErrorHttp(400, 'Tipo de taxonomía desconocido');
    const nombre = String(body.nombre || '').trim();
    if (!nombre) throw new ErrorHttp(400, 'Indique un nombre.');
    if (db.get('SELECT 1 FROM taxonomias WHERE tipo = ? AND slug = ?', body.tipo, slugify(body.slug || nombre))) throw new ErrorHttp(409, 'Ya existe una con ese nombre.');
    const t = repo.asegurarTaxonomia(body.tipo, nombre, { slug: slugify(body.slug || nombre), descripcion: String(body.descripcion || '').slice(0, 500), padre_id: Number(body.padre_id) || null, color: /^#[0-9a-f]{6}$/i.test(body.color || '') ? body.color : '' });
    auditar(u, 'taxonomia.crear', `${t.tipo}:${t.slug}`, nombre);
    invalidar();
    return t;
  });
  ruta('PUT', 'taxonomias/:id', 'taxonomias.editar', ({ u, p, body }) => {
    const t = db.get('SELECT * FROM taxonomias WHERE id = ?', Number(p.id));
    if (!t) throw new ErrorHttp(404, 'No encontrada');
    const slug = slugify(body.slug || body.nombre || t.slug);
    if (slug !== t.slug && db.get('SELECT 1 FROM taxonomias WHERE tipo = ? AND slug = ?', t.tipo, slug)) throw new ErrorHttp(409, 'Ya existe otra con ese slug.');
    const padre = Number(body.padre_id) || null;
    db.run('UPDATE taxonomias SET nombre = ?, slug = ?, descripcion = ?, padre_id = ?, color = ?, orden = ? WHERE id = ?', String(body.nombre || t.nombre).slice(0, 120), slug, String(body.descripcion ?? t.descripcion).slice(0, 500), padre === t.id ? null : padre, /^#[0-9a-f]{6}$/i.test(body.color || '') ? body.color : '', Number(body.orden) || 0, t.id);
    if (slug !== t.slug && t.tipo !== 'coleccion') db.run('INSERT OR IGNORE INTO redirecciones(origen, destino, codigo, creado) VALUES(?,?,301,?)', `/${t.tipo === 'etiqueta' ? 'etiqueta' : 'categoria'}/${t.slug}/`, `/${t.tipo === 'etiqueta' ? 'etiqueta' : 'categoria'}/${slug}/`, ahora());
    auditar(u, 'taxonomia.editar', `${t.tipo}:${t.slug}`, body.nombre);
    invalidar();
    return db.get('SELECT * FROM taxonomias WHERE id = ?', t.id);
  });
  ruta('DELETE', 'taxonomias/:id', 'taxonomias.editar', ({ u, p }) => {
    const t = db.get('SELECT * FROM taxonomias WHERE id = ?', Number(p.id));
    if (!t) throw new ErrorHttp(404, 'No encontrada');
    db.run('DELETE FROM taxonomias WHERE id = ?', t.id);
    auditar(u, 'taxonomia.eliminar', `${t.tipo}:${t.slug}`, t.nombre);
    invalidar();
    return { ok: true };
  });

  // ---------------------------------------------------------------- Medios
  ruta('GET', 'medios', 'contenido.ver', ({ q }) => {
    const w = [];
    const a = [];
    if (q.get('q')) { w.push('(nombre LIKE ? OR titulo LIKE ? OR alt LIKE ?)'); const t = `%${q.get('q')}%`; a.push(t, t, t); }
    if (q.get('tipo') === 'imagen') w.push("mime LIKE 'image/%'");
    if (q.get('tipo') === 'documento') w.push("mime NOT LIKE 'image/%'");
    if (q.get('carpeta')) { w.push('carpeta = ?'); a.push(q.get('carpeta')); }
    const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
    const limite = Math.min(200, Number(q.get('limite')) || 60);
    const pagina = Math.max(1, Number(q.get('pagina')) || 1);
    return { total: db.get(`SELECT count(*) n FROM medios ${where}`, ...a).n, pagina, items: db.all(`SELECT * FROM medios ${where} ORDER BY creado DESC, id DESC LIMIT ? OFFSET ?`, ...a, limite, (pagina - 1) * limite).map((m) => ({ ...m, variantes: parse(m.variantes, {}) })) };
  });

  ruta('POST', 'medios', 'medios.subir', async ({ u, req }) => {
    if (limitador.exceso('subida:' + u.id, 300, 3600)) throw new ErrorHttp(429, 'Demasiadas subidas en poco tiempo.');
    const nombreOriginal = decodeURIComponent(String(req.headers['x-nombre'] || 'archivo')).slice(0, 200);
    const buf = await leerCuerpo(req, MAX_SUBIDA);
    if (!buf.length) throw new ErrorHttp(400, 'El archivo está vacío.');
    const ext = path.extname(nombreOriginal).toLowerCase();
    let tipo = null;
    let extFinal = null;
    for (const [mime, e, prueba] of FIRMAS) if (prueba(buf)) { tipo = mime; extFinal = e; break; }
    if (tipo === 'application/vnd.ms-office') { tipo = EXT_OFFICE[ext]; extFinal = EXT_OFFICE[ext] ? ext : null; }
    else if (tipo === 'application/zip') { tipo = EXT_ZIP[ext]; extFinal = EXT_ZIP[ext] ? ext : null; }
    else if (!tipo && ['.csv', '.txt', '.kml', '.gpx'].includes(ext) && !/[\x00-\x08]/.test(buf.subarray(0, 4096).toString('latin1')) && !/<script|<html|<svg/i.test(buf.subarray(0, 65536).toString('utf8'))) { tipo = { '.csv': 'text/csv', '.txt': 'text/plain', '.kml': 'application/vnd.google-earth.kml+xml', '.gpx': 'application/gpx+xml' }[ext]; extFinal = ext; }
    if (!tipo || !extFinal) throw new ErrorHttp(415, 'Tipo de archivo no permitido. Se aceptan imágenes (JPG, PNG, WEBP, GIF, AVIF), PDF, Word, Excel, PowerPoint, OpenDocument, ZIP, MP4, MP3, CSV y TXT.');
    const huella = crypto.createHash('sha256').update(buf).digest('hex');
    const variante = Number(req.headers['x-variante-de']) || null;
    if (!variante) {
      const ya = db.get('SELECT * FROM medios WHERE huella = ?', huella);
      if (ya) return { ...ya, variantes: parse(ya.variantes, {}), repetido: true };
    }
    const fecha = new Date();
    const carpeta = `${fecha.getFullYear()}/${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const base = slugify(path.basename(nombreOriginal, ext), 60);
    const archivo = `${carpeta}/${base}-${crypto.randomBytes(4).toString('hex')}${variante ? '-' + (Number(req.headers['x-ancho']) || 'v') : ''}${extFinal}`;
    const destino = path.join(cfg.DATA_DIR, 'uploads', 'sitio', archivo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, buf);
    const url = '/medios/' + archivo;
    const ancho = Number(req.headers['x-ancho']) || null;
    const alto = Number(req.headers['x-alto']) || null;
    if (variante) {
      const m = db.get('SELECT * FROM medios WHERE id = ?', variante);
      if (!m) throw new ErrorHttp(404, 'Original no encontrado');
      const v = parse(m.variantes, {});
      if (ancho) v[ancho] = url;
      db.run('UPDATE medios SET variantes = ? WHERE id = ?', JSON.stringify(v), m.id);
      invalidar();
      return { url, ancho };
    }
    const r = db.run('INSERT INTO medios(url, ruta, nombre, mime, tamano, ancho, alto, alt, titulo, carpeta, huella, subido_por, creado) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
      url, archivo, nombreOriginal, tipo, buf.length, ancho, alto, String(decodeURIComponent(req.headers['x-alt'] || '')).slice(0, 300), path.basename(nombreOriginal, ext).slice(0, 200), String(req.headers['x-carpeta'] || '').slice(0, 60), huella, u.id, ahora());
    auditar(u, 'medio.subir', url, `${nombreOriginal} (${(buf.length / 1024).toFixed(0)} KB)`, req.ip);
    return { ...db.get('SELECT * FROM medios WHERE id = ?', Number(r.lastInsertRowid)), variantes: {} };
  });

  ruta('PUT', 'medios/:id', 'medios.subir', ({ u, p, body }) => {
    const m = db.get('SELECT * FROM medios WHERE id = ?', Number(p.id));
    if (!m) throw new ErrorHttp(404, 'No encontrado');
    db.run('UPDATE medios SET alt = ?, titulo = ?, creditos = ?, carpeta = ? WHERE id = ?', String(body.alt ?? m.alt).slice(0, 300), String(body.titulo ?? m.titulo).slice(0, 200), String(body.creditos ?? m.creditos).slice(0, 200), String(body.carpeta ?? m.carpeta).slice(0, 60), m.id);
    auditar(u, 'medio.editar', m.url);
    invalidar();
    return db.get('SELECT * FROM medios WHERE id = ?', m.id);
  });

  ruta('GET', 'medios/:id/usos', 'contenido.ver', ({ p }) => {
    const m = db.get('SELECT url FROM medios WHERE id = ?', Number(p.id));
    if (!m) throw new ErrorHttp(404, 'No encontrado');
    const t = `%${m.url}%`;
    return db.all('SELECT id, tipo, titulo FROM contenidos WHERE imagen = ? OR cuerpo LIKE ? OR bloques LIKE ? OR datos LIKE ? LIMIT 50', m.url, t, t, t);
  });

  ruta('DELETE', 'medios/:id', 'medios.eliminar', ({ u, p, q, req }) => {
    const m = db.get('SELECT * FROM medios WHERE id = ?', Number(p.id));
    if (!m) throw new ErrorHttp(404, 'No encontrado');
    const t = `%${m.url}%`;
    const usos = db.get('SELECT count(*) n FROM contenidos WHERE imagen = ? OR cuerpo LIKE ? OR bloques LIKE ? OR datos LIKE ?', m.url, t, t, t).n;
    if (usos && q.get('forzar') !== '1') throw new ErrorHttp(409, `El archivo se usa en ${usos} contenido(s). Reemplácelo allí antes de eliminarlo.`);
    if (m.ruta) {
      const base = path.join(cfg.DATA_DIR, 'uploads', 'sitio');
      for (const url of [m.url, ...Object.values(parse(m.variantes, {}))]) {
        if (!String(url).startsWith('/medios/')) continue;
        const f = path.join(base, String(url).slice('/medios/'.length));
        if (f.startsWith(base + path.sep)) fs.rmSync(f, { force: true });
      }
    }
    db.run('DELETE FROM medios WHERE id = ?', m.id);
    auditar(u, 'medio.eliminar', m.url, m.nombre, req.ip);
    invalidar();
    return { ok: true };
  });

  // ---------------------------------------------------------------- Menús y ajustes
  ruta('GET', 'menus', 'contenido.ver', () => db.all('SELECT clave, nombre, items, modificado FROM menus ORDER BY clave').map((m) => ({ ...m, items: parse(m.items, []) })));
  ruta('PUT', 'menus/:clave', 'menus.editar', ({ u, p, body }) => {
    if (!/^[a-z_]{2,40}$/.test(p.clave)) throw new ErrorHttp(400, 'Clave inválida');
    const nombre = String(body.nombre || db.get('SELECT nombre FROM menus WHERE clave = ?', p.clave)?.nombre || p.clave).slice(0, 80);
    const items = repo.guardarMenu(p.clave, nombre, body.items);
    auditar(u, 'menu.editar', p.clave, `${items.length} elementos`);
    invalidar();
    return { clave: p.clave, nombre, items };
  });

  ruta('GET', 'ajustes', 'contenido.ver', () => db.ajuste('sitio') || {});
  ruta('PUT', 'ajustes', 'ajustes.editar', ({ u, body, req }) => {
    const previo = db.ajuste('sitio') || {};
    const limpio = limpiarAjustes(body, previo, u);
    db.guardarAjuste('sitio', limpio);
    const cambiadas = Object.keys(limpio).filter((k) => JSON.stringify(limpio[k]) !== JSON.stringify(previo[k]));
    auditar(u, 'ajustes.editar', 'sitio', cambiadas.join(', '), req.ip);
    invalidar();
    return limpio;
  });

  function limpiarAjustes(b, previo, u) {
    const txt = (v, n = 300) => String(v ?? '').trim().slice(0, n);
    const color = (v, d) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : d);
    const o = { ...previo };
    for (const k of ['nombre', 'nombreCorto', 'lema', 'direccion', 'telefono', 'whatsapp', 'email', 'emailContacto', 'horario']) if (k in b) o[k] = txt(b[k]);
    if ('descripcion' in b) o.descripcion = txt(b.descripcion, 400);
    if (b.mapa) o.mapa = { lat: Number(b.mapa.lat) || previo.mapa?.lat, lng: Number(b.mapa.lng) || previo.mapa?.lng, enlace: urlSegura(b.mapa.enlace) };
    if (b.redes) o.redes = Object.fromEntries(['facebook', 'instagram', 'youtube', 'x', 'tiktok'].map((k) => [k, urlSegura(b.redes[k], { permitirRelativa: false })]));
    if (Array.isArray(b.emergencias)) o.emergencias = b.emergencias.slice(0, 12).map((e) => ({ nombre: txt(e.nombre, 80), telefono: txt(e.telefono, 30) })).filter((e) => e.nombre && e.telefono);
    if (b.diseno) {
      o.diseno = normalizarDiseno(b.diseno, { permitirCss: u.rol === 'superadmin', previo: previo.diseno });
      o.colores = { primario: o.diseno.colores.primario, acento: o.diseno.colores.acento, oscuro: o.diseno.colores.oscuro };
    }
    if (b.colores && !b.diseno) o.colores = { primario: color(b.colores.primario, '#0B4F7C'), acento: color(b.colores.acento, '#F2A900'), oscuro: color(b.colores.oscuro, '#062B45') };
    if (b.turismo) o.turismo = { titulo: txt(b.turismo.titulo), texto: txt(b.turismo.texto, 400), url: urlSegura(b.turismo.url), imagen: urlSegura(b.turismo.imagen) };
    if (b.video) o.video = { titulo: txt(b.video.titulo), url: urlSegura(b.video.url) };
    if (b.clima) o.clima = { activo: !!b.clima.activo, lugar: txt(b.clima.lugar, 60) };
    if (b.portada?.secciones) {
      const conocidas = new Set(['avisos', 'banners', 'cinta', 'mundos', 'campanas', 'accesos', 'tramites', 'noticias', 'eventos', 'areas', 'turismo', 'encuesta', 'video', 'boletin']);
      o.portada = { secciones: b.portada.secciones.filter((s) => conocidas.has(s.id)).map((s) => ({ id: s.id, activo: !!s.activo, titulo: txt(s.titulo, 120), texto: txt(s.texto, 300), cantidad: Math.min(24, Math.max(1, Number(s.cantidad) || 0)) || undefined })) };
    }
    if (b.boletin) o.boletin = { activo: !!b.boletin.activo };
    if (b.mantenimiento) o.mantenimiento = { activo: !!b.mantenimiento.activo, mensaje: txt(b.mantenimiento.mensaje, 400) };
    if (b.pie) o.pie = { texto: txt(b.pie.texto, 300) };
    if (b.oirs) o.oirs = { activo: b.oirs.activo !== false, plazoDias: Math.min(60, Math.max(1, Number(b.oirs.plazoDias) || 10)), tipos: previo.oirs?.tipos || { consulta: 'Consulta', reclamo: 'Reclamo', sugerencia: 'Sugerencia', felicitacion: 'Felicitación', denuncia: 'Denuncia' } };
    // Código de analítica: sólo el Super Administrador (se ejecuta en todas las páginas).
    if (b.analitica && u.rol === 'superadmin') o.analitica = { codigo: String(b.analitica.codigo || '').slice(0, 5000) };
    return o;
  }

  // ---------------------------------------------------------------- Mensajes (OIRS y contacto)
  const ESTADOS_MENSAJE = ['nuevo', 'en_proceso', 'respondido', 'cerrado'];
  ruta('GET', 'mensajes', 'mensajes.ver', ({ q }) => {
    const w = []; const a = [];
    if (q.get('estado')) { w.push('estado = ?'); a.push(q.get('estado')); }
    if (q.get('tipo')) { w.push('tipo = ?'); a.push(q.get('tipo')); }
    if (q.get('q')) { w.push('(codigo LIKE ? OR nombre LIKE ? OR email LIKE ? OR asunto LIKE ?)'); const t = `%${q.get('q')}%`; a.push(t, t, t, t); }
    const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
    const pagina = Math.max(1, Number(q.get('pagina')) || 1);
    return { total: db.get(`SELECT count(*) n FROM mensajes ${where}`, ...a).n, pagina, items: db.all(`SELECT id, codigo, tipo, nombre, email, asunto, estado, area_id, asignado_a, creado, respondido_en, externo FROM mensajes ${where} ORDER BY CASE estado WHEN 'nuevo' THEN 0 WHEN 'en_proceso' THEN 1 ELSE 2 END, creado DESC LIMIT 50 OFFSET ?`, ...a, (pagina - 1) * 50).map((m) => ({ ...m, area: m.area_id ? repo.obtener(m.area_id)?.titulo : '', asignado: nombreUsuario(m.asignado_a) })) };
  });
  ruta('GET', 'mensajes.csv', 'mensajes.ver', ({ u, req, res }) => {
    const filas = db.all('SELECT codigo, tipo, estado, creado, nombre, rut, email, telefono, asunto, mensaje, respuesta, respondido_en, externo FROM mensajes ORDER BY creado DESC');
    auditar(u, 'mensajes.exportar', '', `${filas.length} filas`, req.ip);
    return { csv: csv(filas), archivo: 'mensajes-oirs.csv' };
  });
  ruta('GET', 'mensajes/:id', 'mensajes.ver', ({ p, u, req }) => {
    const m = db.get('SELECT * FROM mensajes WHERE id = ?', Number(p.id));
    if (!m) throw new ErrorHttp(404, 'No encontrado');
    auditar(u, 'mensaje.ver', m.codigo, '', req.ip);
    return { ...m, historial: parse(m.historial, []), area: m.area_id ? repo.obtener(m.area_id)?.titulo : '', asignado: nombreUsuario(m.asignado_a) };
  });
  ruta('PUT', 'mensajes/:id', 'mensajes.responder', ({ p, u, body }) => {
    const m = db.get('SELECT * FROM mensajes WHERE id = ?', Number(p.id));
    if (!m) throw new ErrorHttp(404, 'No encontrado');
    const h = parse(m.historial, []);
    const estado = ESTADOS_MENSAJE.includes(body.estado) ? body.estado : m.estado;
    const asignado = body.asignado_a !== undefined ? Number(body.asignado_a) || null : m.asignado_a;
    if (estado !== m.estado) h.push({ en: ahora(), evento: `Estado: ${estado}`, por: u.nombre });
    if (asignado !== m.asignado_a) h.push({ en: ahora(), evento: `Asignado a ${nombreUsuario(asignado) || 'nadie'}`, por: u.nombre });
    if (body.nota) h.push({ en: ahora(), evento: 'Nota interna', texto: String(body.nota).slice(0, 2000), por: u.nombre });
    db.run('UPDATE mensajes SET estado = ?, asignado_a = ?, area_id = ?, historial = ?, modificado = ? WHERE id = ?', estado, asignado, Number(body.area_id ?? m.area_id) || null, JSON.stringify(h), ahora(), m.id);
    auditar(u, 'mensaje.editar', m.codigo, estado);
    return { ok: true };
  });
  ruta('POST', 'mensajes/:id/responder', 'mensajes.responder', async ({ p, u, body, req }) => {
    const m = db.get('SELECT * FROM mensajes WHERE id = ?', Number(p.id));
    if (!m) throw new ErrorHttp(404, 'No encontrado');
    const respuesta = String(body.respuesta || '').trim().slice(0, 10000);
    if (respuesta.length < 3) throw new ErrorHttp(400, 'Escriba la respuesta.');
    const h = parse(m.historial, []);
    let enviado = false;
    if (body.enviarCorreo !== false && mailer && m.email) {
      try { await mailer.send({ to: m.email, subject: `Respuesta a su mensaje ${m.codigo}`, text: `Estimado(a) ${m.nombre}:\n\n${respuesta}\n\nCódigo: ${m.codigo}\nPuede revisarlo en ${cfg.PUBLIC_URL}oirs/seguimiento/?codigo=${m.codigo}\n\n${u.nombre}${u.cargo ? ', ' + u.cargo : ''}\n${db.ajuste('sitio')?.nombre || ''}`, replyTo: db.ajuste('sitio')?.email }); enviado = true; } catch (e) { h.push({ en: ahora(), evento: 'No se pudo enviar el correo: ' + e.message }); }
    }
    h.push({ en: ahora(), evento: enviado ? 'Respondido y enviado por correo' : 'Respondido (visible con el código de seguimiento)', por: u.nombre });
    db.run("UPDATE mensajes SET respuesta = ?, respondido_en = ?, estado = 'respondido', historial = ?, modificado = ? WHERE id = ?", respuesta, ahora(), JSON.stringify(h), ahora(), m.id);
    auditar(u, 'mensaje.responder', m.codigo, enviado ? 'con correo' : 'sin correo', req.ip);
    return { ok: true, enviado };
  });

  // ---------------------------------------------------------------- Boletín
  ruta('GET', 'suscriptores', 'suscriptores.ver', () => ({ resumen: db.all('SELECT estado, count(*) n FROM suscriptores GROUP BY estado'), items: db.all('SELECT id, email, estado, creado, confirmado FROM suscriptores ORDER BY creado DESC LIMIT 2000') }));
  ruta('GET', 'suscriptores.csv', 'suscriptores.ver', ({ u }) => { auditar(u, 'suscriptores.exportar'); return { csv: csv(db.all("SELECT email, estado, creado, confirmado FROM suscriptores ORDER BY creado")), archivo: 'suscriptores.csv' }; });
  ruta('DELETE', 'suscriptores/:id', 'suscriptores.ver', ({ u, p }) => { db.run('DELETE FROM suscriptores WHERE id = ?', Number(p.id)); auditar(u, 'suscriptor.eliminar', p.id); return { ok: true }; });
  ruta('POST', 'boletin/enviar', 'contenido.publicar', async ({ u, body, req }) => {
    if (!mailer) throw new ErrorHttp(400, 'Configure el correo (SMTP) para enviar el boletín.');
    const c = repo.obtener(Number(body.contenido));
    if (!c || !repo.visible(c)) throw new ErrorHttp(400, 'Elija una noticia publicada.');
    if (c.datos?.boletinEnviado && !body.reenviar) throw new ErrorHttp(409, 'Esta noticia ya se envió por el boletín.');
    const lista = db.all("SELECT email, token FROM suscriptores WHERE estado = 'activo'");
    const url = cfg.PUBLIC_URL.replace(/\/$/, '') + repo.urlDe(c);
    let ok = 0;
    (async () => {
      for (const s of lista) {
        try { await mailer.send({ to: s.email, subject: c.titulo, text: `${c.titulo}\n\n${recortar(textoPlano(c.resumen || c.cuerpo), 600)}\n\nLea la noticia completa: ${url}\n\n—\nPara dejar de recibir estos correos: ${cfg.PUBLIC_URL}boletin/baja/${s.token}/` }); ok++; } catch { /* sigue */ }
        await new Promise((r) => setTimeout(r, 300));
      }
      auditar(u, 'boletin.enviado', `noticia#${c.id}`, `${ok}/${lista.length} correos`);
    })();
    db.run("UPDATE contenidos SET datos = json_set(datos, '$.boletinEnviado', ?) WHERE id = ?", ahora(), c.id);
    auditar(u, 'boletin.enviar', `noticia#${c.id}`, `${lista.length} destinatarios`, req.ip);
    return { destinatarios: lista.length };
  });

  // ---------------------------------------------------------------- Redirecciones
  ruta('GET', 'redirecciones', 'redirecciones.editar', () => db.all('SELECT * FROM redirecciones ORDER BY creado DESC'));
  ruta('POST', 'redirecciones', 'redirecciones.editar', ({ u, body }) => {
    const origen = '/' + String(body.origen || '').trim().replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
    const destino = urlSegura(body.destino);
    if (origen.length < 2 || !destino) throw new ErrorHttp(400, 'Indique un origen (ruta del sitio) y un destino válidos.');
    if (origen === destino) throw new ErrorHttp(400, 'El origen y el destino no pueden ser iguales.');
    db.run('INSERT INTO redirecciones(origen, destino, codigo, creado) VALUES(?,?,?,?) ON CONFLICT(origen) DO UPDATE SET destino = excluded.destino, codigo = excluded.codigo', origen, destino, Number(body.codigo) === 302 ? 302 : 301, ahora());
    auditar(u, 'redireccion.guardar', origen, destino);
    return { ok: true };
  });
  ruta('DELETE', 'redirecciones/:id', 'redirecciones.editar', ({ u, p }) => { db.run('DELETE FROM redirecciones WHERE id = ?', Number(p.id)); auditar(u, 'redireccion.eliminar', p.id); return { ok: true }; });

  // ---------------------------------------------------------------- Usuarios
  ruta('GET', 'usuarios', 'usuarios.gestionar', () => db.all('SELECT * FROM usuarios ORDER BY activo DESC, nombre').map(usuarioPublico));
  ruta('GET', 'usuarios/lista', 'mensajes.ver', () => db.all('SELECT id, nombre, cargo FROM usuarios WHERE activo = 1 ORDER BY nombre'));

  function validarUsuario(u, body, previo) {
    if (!ROLES[body.rol || previo?.rol]) throw new ErrorHttp(400, 'Rol desconocido.');
    if ((body.rol === 'superadmin' || previo?.rol === 'superadmin') && u.rol !== 'superadmin') throw new ErrorHttp(403, 'Sólo un Super Administrador puede gestionar a otro Super Administrador.');
  }
  ruta('POST', 'usuarios', 'usuarios.gestionar', async ({ u, body, req }) => {
    validarUsuario(u, body);
    const email = String(body.email || '').trim().toLowerCase();
    if (!emailValido(email)) throw new ErrorHttp(400, 'Correo inválido.');
    if (db.get('SELECT 1 FROM usuarios WHERE email = ?', email)) throw new ErrorHttp(409, 'Ya existe un usuario con ese correo.');
    const temporal = claveTemporal();
    db.run('INSERT INTO usuarios(email, nombre, cargo, rol, areas, clave, debe_cambiar_clave, acceso_hasta, creado) VALUES(?,?,?,?,?,?,1,?,?)', email, String(body.nombre || email).slice(0, 120), String(body.cargo || '').slice(0, 120), body.rol, JSON.stringify((body.areas || []).map(Number).filter(Boolean)), await hashClave(temporal), /^\d{4}-\d{2}-\d{2}$/.test(body.acceso_hasta || '') ? body.acceso_hasta : null, ahora());
    auditar(u, 'usuario.crear', email, body.rol, req.ip);
    let enviado = false;
    if (mailer && body.enviarCorreo) { try { await mailer.send({ to: email, subject: 'Su acceso al panel del sitio web municipal', text: `Se creó su cuenta en el panel del sitio web.\n\nIngreso: ${cfg.PUBLIC_URL}admin/\nUsuario: ${email}\nContraseña temporal: ${temporal}\n\nDeberá cambiarla al ingresar.` }); enviado = true; } catch { /* se muestra en pantalla */ } }
    return { temporal: enviado ? null : temporal, enviado };
  });
  ruta('PUT', 'usuarios/:id', 'usuarios.gestionar', ({ u, p, body, req }) => {
    const previo = db.get('SELECT * FROM usuarios WHERE id = ?', Number(p.id));
    if (!previo) throw new ErrorHttp(404, 'No encontrado');
    validarUsuario(u, { ...body, rol: body.rol || previo.rol }, previo);
    const rol = body.rol || previo.rol;
    const activo = body.activo === undefined ? previo.activo : body.activo ? 1 : 0;
    if (previo.id === u.id && (rol !== previo.rol || !activo)) throw new ErrorHttp(400, 'No puede cambiar su propio rol ni desactivarse.');
    if (previo.rol === 'superadmin' && (rol !== 'superadmin' || !activo) && db.get("SELECT count(*) n FROM usuarios WHERE rol = 'superadmin' AND activo = 1").n <= 1) throw new ErrorHttp(400, 'Debe quedar al menos un Super Administrador activo.');
    db.run('UPDATE usuarios SET nombre = ?, cargo = ?, rol = ?, areas = ?, activo = ?, acceso_hasta = ? WHERE id = ?', String(body.nombre ?? previo.nombre).slice(0, 120), String(body.cargo ?? previo.cargo).slice(0, 120), rol, JSON.stringify((body.areas ?? parse(previo.areas, [])).map(Number).filter(Boolean)), activo, body.acceso_hasta === undefined ? previo.acceso_hasta : /^\d{4}-\d{2}-\d{2}$/.test(body.acceso_hasta || '') ? body.acceso_hasta : null, previo.id);
    if (!activo || rol !== previo.rol) db.run('DELETE FROM sesiones WHERE usuario_id = ?', previo.id);
    auditar(u, 'usuario.editar', previo.email, `rol ${rol}${activo ? '' : ', desactivado'}`, req.ip);
    return usuarioPublico(db.get('SELECT * FROM usuarios WHERE id = ?', previo.id));
  });
  ruta('POST', 'usuarios/:id/restablecer', 'usuarios.gestionar', async ({ u, p, req }) => {
    const x = db.get('SELECT * FROM usuarios WHERE id = ?', Number(p.id));
    if (!x) throw new ErrorHttp(404, 'No encontrado');
    validarUsuario(u, { rol: x.rol }, x);
    const temporal = claveTemporal();
    db.run('UPDATE usuarios SET clave = ?, debe_cambiar_clave = 1, intentos = 0, bloqueado_hasta = NULL WHERE id = ?', await hashClave(temporal), x.id);
    db.run('DELETE FROM sesiones WHERE usuario_id = ?', x.id);
    auditar(u, 'usuario.restablecer', x.email, '', req.ip);
    return { temporal };
  });
  ruta('POST', 'usuarios/:id/totp-quitar', 'usuarios.gestionar', ({ u, p, req }) => {
    const x = db.get('SELECT * FROM usuarios WHERE id = ?', Number(p.id));
    if (!x) throw new ErrorHttp(404, 'No encontrado');
    validarUsuario(u, { rol: x.rol }, x);
    db.run('UPDATE usuarios SET totp_activo = 0, totp_secreto = NULL WHERE id = ?', x.id);
    auditar(u, 'usuario.totp_quitado', x.email, 'Pérdida del teléfono', req.ip);
    return { ok: true };
  });

  // ---------------------------------------------------------------- Auditoría, estadísticas y sistema
  ruta('GET', 'auditoria', 'auditoria.ver', ({ q }) => {
    const w = []; const a = [];
    if (q.get('q')) { w.push('(accion LIKE ? OR objeto LIKE ? OR detalle LIKE ? OR usuario LIKE ?)'); const t = `%${q.get('q')}%`; a.push(t, t, t, t); }
    if (q.get('accion')) { w.push('accion LIKE ?'); a.push(q.get('accion') + '%'); }
    const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
    const pagina = Math.max(1, Number(q.get('pagina')) || 1);
    return { total: db.get(`SELECT count(*) n FROM auditoria ${where}`, ...a).n, pagina, items: db.all(`SELECT * FROM auditoria ${where} ORDER BY id DESC LIMIT 100 OFFSET ?`, ...a, (pagina - 1) * 100) };
  });
  ruta('GET', 'auditoria.csv', 'auditoria.ver', () => ({ csv: csv(db.all('SELECT en, usuario, accion, objeto, detalle, ip FROM auditoria ORDER BY id DESC LIMIT 50000')), archivo: 'auditoria.csv' }));

  ruta('GET', 'estadisticas', 'estadisticas.ver', ({ q }) => {
    const dias = Math.min(365, Number(q.get('dias')) || 30);
    const desde = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
    return {
      serie: db.all('SELECT dia, sum(n) n FROM visitas WHERE dia >= ? GROUP BY dia ORDER BY dia', desde),
      paginas: db.all('SELECT ruta, sum(n) n FROM visitas WHERE dia >= ? GROUP BY ruta ORDER BY n DESC LIMIT 30', desde),
      total: db.get('SELECT coalesce(sum(n),0) n FROM visitas WHERE dia >= ?', desde).n,
      busquedas: db.all("SELECT ruta, sum(n) n FROM visitas WHERE dia >= ? AND ruta LIKE '/buscar/%' GROUP BY ruta ORDER BY n DESC LIMIT 10", desde),
      mensajesPorTipo: db.all('SELECT tipo, count(*) n FROM mensajes WHERE creado >= ? GROUP BY tipo', desde),
      noticiasPorMes: db.all("SELECT substr(publicado_en,1,7) mes, count(*) n FROM contenidos WHERE tipo='noticia' AND estado='publicado' GROUP BY mes ORDER BY mes DESC LIMIT 12"),
    };
  });

  ruta('GET', 'plataforma', 'contenido.ver', async ({ q }) => {
    if (q.get('refrescar')) tramites.limpiarCache();
    const [estado, catalogo] = await Promise.all([tramites.estado(), tramites.catalogo()]);
    return { estado, catalogo, enlaces: cfg.TRAMITES_URL ? { portal: tramites.enlaces.portal(), intranet: tramites.enlaces.intranet(), widget: tramites.enlaces.widget() } : null };
  });

  ruta('GET', 'buscar', 'contenido.ver', ({ q }) => {
    const t = String(q.get('q') || '').trim();
    if (t.length < 2) return [];
    return db.all('SELECT id, tipo, titulo, estado FROM contenidos WHERE titulo LIKE ? OR slug LIKE ? ORDER BY modificado DESC LIMIT 15', `%${t}%`, `%${t}%`);
  });

  ruta('GET', 'respaldos', 'respaldo.gestionar', () => {
    const dir = path.join(cfg.DATA_DIR, 'backups');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => /^sitio-.*\.db(\.enc)?$/.test(f)).sort().reverse().map((f) => ({ archivo: f, tamano: fs.statSync(path.join(dir, f)).size, fecha: fs.statSync(path.join(dir, f)).mtime }));
  });
  ruta('POST', 'respaldos', 'respaldo.gestionar', ({ u, req }) => { const r = respaldar(db, cfg); auditar(u, 'respaldo.crear', path.basename(r.archivo), r.huella, req.ip); return { archivo: path.basename(r.archivo), tamano: r.tamano }; });
  ruta('GET', 'respaldos/:archivo', 'respaldo.gestionar', ({ u, p, req, res }) => {
    if (!/^sitio-[\w-]+\.db(\.enc)?$/.test(p.archivo)) throw new ErrorHttp(400, 'Archivo inválido');
    const f = path.join(cfg.DATA_DIR, 'backups', p.archivo);
    if (!fs.existsSync(f)) throw new ErrorHttp(404, 'No encontrado');
    auditar(u, 'respaldo.descargar', p.archivo, '', req.ip);
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${p.archivo}"`, 'Content-Length': fs.statSync(f).size, 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
    return undefined;
  });
  ruta('GET', 'exportar', 'respaldo.gestionar', ({ u }) => {
    auditar(u, 'sitio.exportar');
    return { generado: ahora(), contenidos: db.all('SELECT * FROM contenidos'), taxonomias: db.all('SELECT * FROM taxonomias'), contenido_taxonomia: db.all('SELECT * FROM contenido_taxonomia'), menus: db.all('SELECT * FROM menus'), medios: db.all('SELECT * FROM medios'), redirecciones: db.all('SELECT * FROM redirecciones'), ajustes: db.ajuste('sitio') };
  });
  ruta('POST', 'importar-wordpress', 'respaldo.gestionar', async ({ u, body, req }) => {
    const estado = db.ajuste('importacion');
    if (estado?.en === 'curso' && Date.parse(estado.inicio) > Date.now() - 30 * 60e3) throw new ErrorHttp(409, 'Ya hay una importación en curso.');
    db.guardarAjuste('importacion', { en: 'curso', inicio: ahora(), por: u.nombre });
    auditar(u, 'wordpress.importar', '', body.reemplazar ? 'reemplazando' : 'sólo nuevos', req.ip);
    (async () => {
      try {
        const { construirPaquete, descargarMedios } = await import('../herramientas/importar-wordpress.js');
        const { cargarPaquete } = await import('./semilla.js');
        const paquete = await construirPaquete();
        const r = cargarPaquete(db, repo, paquete, { reemplazar: !!body.reemplazar });
        db.guardarAjuste('importacion', { en: body.medios ? 'medios' : 'listo', inicio: estado?.inicio, fin: ahora(), ...r });
        invalidar();
        if (body.medios) { await descargarMedios(paquete, path.join(cfg.DATA_DIR, 'uploads', 'wp')); db.guardarAjuste('importacion', { en: 'listo', fin: ahora(), ...r, medios: true }); }
      } catch (e) {
        db.guardarAjuste('importacion', { en: 'error', fin: ahora(), error: e.message });
      }
    })();
    return { ok: true };
  });
  ruta('GET', 'importar-wordpress', 'respaldo.gestionar', () => db.ajuste('importacion') || { en: 'nunca' });
  ruta('POST', 'reindexar', 'ajustes.editar', ({ u }) => { repo.reindexarTodo(); auditar(u, 'busqueda.reindexar'); invalidar(); return { ok: true }; });
  ruta('POST', 'cache/limpiar', 'contenido.publicar', ({ u }) => { invalidar(); tramites.limpiarCache(); auditar(u, 'cache.limpiar'); return { ok: true }; });

  // ---------------------------------------------------------------- Despachador
  function csv(filas) {
    if (!filas.length) return '';
    const cols = Object.keys(filas[0]);
    const celda = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    return '﻿' + [cols.join(';'), ...filas.map((f) => cols.map((c) => celda(f[c])).join(';'))].join('\r\n');
  }

  async function manejar(req, res, url) {
    const sub = url.pathname.slice('/api/admin/'.length).replace(/\/$/, '');
    const r = rutas.find((x) => x.metodo === req.method && x.re.test(sub));
    if (!r) throw new ErrorHttp(404, 'Ruta no encontrada');
    const m = sub.match(r.re);
    const p = Object.fromEntries(r.claves.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const token = leerCookies(req)[COOKIE];
    const sesion = token ? leerSesion(db, token) : null;
    const cab = { ...req.seguridad('x', true) };
    delete cab['Content-Security-Policy'];
    // Escrituras: mismo origen + token CSRF (salvo el ingreso, que aún no tiene sesión).
    if (req.method !== 'GET') {
      const origen = req.headers.origin;
      if (origen && origen !== new URL(cfg.PUBLIC_URL).origin && origen !== `http://${req.headers.host}` && origen !== `https://${req.headers.host}`) throw new ErrorHttp(403, 'Origen no permitido.');
      if (!['login'].includes(sub) && (!sesion || req.headers['x-csrf'] !== sesion.sesion.csrf)) throw new ErrorHttp(403, 'Sesión vencida. Vuelva a ingresar.');
    }
    let u = null;
    if (r.permiso) {
      if (!sesion || sesion.sesion.paso !== 'ok') throw new ErrorHttp(401, 'Debe ingresar al panel.');
      u = sesion.usuario;
      if (u.debe_cambiar_clave && !['sesion', 'clave', 'logout'].includes(sub)) throw new ErrorHttp(428, 'Debe cambiar su contraseña temporal antes de continuar.');
      if (r.permiso !== '*') exigir(u, r.permiso);
    }
    const tipo = String(req.headers['content-type'] || '');
    const body = req.method === 'GET' || req.method === 'DELETE' || sub === 'medios' ? {} : await leerJson(req, tipo.includes('json') ? 8 * 1024 * 1024 : 1024);
    try {
      const salida = await r.fn({ req, res, u, p, q: url.searchParams, body, sesion });
      if (salida === undefined) return;
      if (salida?.csv !== undefined) return enviar(req, res, 200, salida.csv, { ...cab, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${salida.archivo}"` });
      json(req, res, 200, salida, cab);
    } catch (e) {
      if (e instanceof ErrorValidacion) throw new ErrorHttp(e.status || 400, e.message);
      if (/UNIQUE constraint/.test(e.message)) throw new ErrorHttp(409, 'Ya existe un elemento con ese nombre o dirección.');
      throw e;
    }
  }

  return { manejar };
}
