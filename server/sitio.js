// Sitio público: enrutamiento, formularios (OIRS, contacto, boletín, encuestas), feeds,
// mapa del sitio, calendario ICS, bloques aislados y API pública de datos abiertos.

import crypto from 'node:crypto';
import vm from 'node:vm';
import * as V from './render/paginas.js';
import { html, crudo, esc, icono } from './render/comun.js';
import { crearImagenes } from './render/comun.js';
import { enviar, json, redirigir, leerFormulario, ErrorHttp } from './http.js';
import { resumenDe } from './contenidos.js';
import { textoPlano, recortar, emailValido, rutValido, formatoRut, hoyLocal } from '../src/util.js';
import { TIPOS, RUTAS } from '../src/tipos.js';
import { ahora } from './db.js';
import { sha256, tokenAleatorio } from './auth.js';
import { crearExtensiones } from './extensiones.js';
import { buscarTransparencia } from './render/transparencia.js';
import { paginaArchivo, buscarArchivo, inventario, urlDoc } from './render/archivo.js';
import { Readable } from 'node:stream';
import { paginaVideos, paginaLista, fichaVideo, prepararVideos, buscarVideos, urlVideo, urlsVideos, indice as indiceVideos } from './render/videos.js';

export function crearSitio({ db, repo, cfg, tramites, mailer, limitador, version, secreto, leerUsuario, auditar }) {
  const img = crearImagenes(db);
  const cacheHtml = new Map();
  const NONCE_CACHE = 'N0NCE-CACHE-7f3a';
  let visitas = new Map();

  const ajustes = () => ({ ...(db.ajuste('sitio') || {}) });
  const ext = crearExtensiones({ db });
  // Dominios externos que el código propio necesita (se suman a la política de seguridad).
  const seguridad = (req, nonce) => req.seguridad(nonce, false, ext.dominios());
  const categoriasDe = (id) => repo.taxonomiasDe(id).filter((t) => t.tipo === 'categoria');

  function invalidar() { cacheHtml.clear(); img.invalidar(); }

  // ---------------------------------------------------------------- Antispam
  function firmar(v) { return crypto.createHmac('sha256', secreto).update(String(v)).digest('base64url').slice(0, 22); }
  function campoAntispam() {
    const t = Date.now();
    return `<input type="hidden" name="tk" value="${t}.${firmar(t)}"><div class="trampa" aria-hidden="true"><label>No completar <input name="sitio_web" tabindex="-1" autocomplete="off"></label></div>`;
  }
  function validarAntispam(body) {
    if (body.sitio_web) return false;
    const [t, f] = String(body.tk || '').split('.');
    if (!t || f !== firmar(t)) return false;
    const edad = Date.now() - Number(t);
    return edad > 2500 && edad < 6 * 3600e3;
  }

  // ---------------------------------------------------------------- Formularios
  function formulario(tipo, { titulo = '', areaId = '', tipo: tipoOirs = 'consulta' } = {}) {
    const s = db.ajuste('sitio') || {};
    if (tipo === 'suscripcion') {
      return html`<form class="formulario boletin" method="post" action="/boletin/">
        <div><h2>${crudo(icono('correo', { tam: 24 }))} ${titulo || 'Reciba las noticias en su correo'}</h2><p>Noticias, avisos y convocatorias de la Municipalidad. Puede darse de baja cuando quiera.</p></div>
        <div class="campo-buscar"><label for="boletin-email" class="sr">Su correo</label><input id="boletin-email" name="email" type="email" required placeholder="su@correo.cl" autocomplete="email"><button class="boton boton-acento" type="submit">Suscribirme</button></div>
        ${crudo(campoAntispam())}
      </form>`;
    }
    const areas = repo.listar({ tipo: 'area', publico: true, orden: 'orden', limite: 500 }).items.filter((a) => ['direccion', 'alcaldia', 'juzgado', 'departamento'].includes(a.datos.tipoUnidad));
    const esOirs = tipo === 'oirs';
    const tipos = s.oirs?.tipos || { consulta: 'Consulta', reclamo: 'Reclamo', sugerencia: 'Sugerencia', felicitacion: 'Felicitación' };
    return html`<form class="formulario" method="post" action="${esOirs ? '/oirs/' : '/contacto/'}" data-formulario>
      ${titulo ? html`<h2>${titulo}</h2>` : ''}
      <p class="meta">Los campos con * son obligatorios. Sus datos se usan sólo para responder su mensaje (Ley 19.628 y Ley 21.719).</p>
      <div class="filas">
        ${esOirs ? html`<div class="campo"><label for="f-tipo">Tipo de mensaje *</label><select id="f-tipo" name="tipo" required>${Object.entries(tipos).map(([k, v]) => html`<option value="${k}"${k === tipoOirs ? crudo(' selected') : ''}>${v}</option>`)}</select></div>` : crudo('<input type="hidden" name="tipo" value="contacto">')}
        <div class="campo"><label for="f-area">Área relacionada</label><select id="f-area" name="area"><option value="">No sé / General</option>${areas.map((a) => html`<option value="${a.id}"${String(a.id) === String(areaId) ? crudo(' selected') : ''}>${a.datos.nombreCorto || a.titulo}</option>`)}</select></div>
        <div class="campo"><label for="f-nombre">Nombre completo *</label><input id="f-nombre" name="nombre" required maxlength="120" autocomplete="name"></div>
        ${esOirs ? html`<div class="campo"><label for="f-rut">RUN</label><input id="f-rut" name="rut" maxlength="12" placeholder="12.345.678-9" data-rut aria-describedby="ayuda-rut">${tramites.configurado ? html`<small id="ayuda-rut" class="meta">Con su RUN, el mensaje ingresa también a la Oficina de Partes y queda en «Mis trámites».</small>` : ''}</div>` : ''}
        <div class="campo"><label for="f-email">Correo electrónico *</label><input id="f-email" name="email" type="email" required maxlength="200" autocomplete="email"></div>
        <div class="campo"><label for="f-telefono">Teléfono</label><input id="f-telefono" name="telefono" type="tel" maxlength="20" autocomplete="tel"></div>
        <div class="campo ancho"><label for="f-asunto">Asunto *</label><input id="f-asunto" name="asunto" required maxlength="160"></div>
        <div class="campo ancho"><label for="f-mensaje">Mensaje *</label><textarea id="f-mensaje" name="mensaje" required rows="6" maxlength="5000" data-contador></textarea></div>
      </div>
      <label class="casilla"><input type="checkbox" name="acepto" value="1" required> Acepto que la Municipalidad use estos datos para responder mi mensaje. *</label>
      ${crudo(campoAntispam())}
      <button class="boton boton-primario" type="submit">${crudo(icono('correo', { tam: 18 }))} Enviar mensaje</button>
    </form>`;
  }

  function resultadosEncuesta(e) {
    const opciones = e.datos.opciones || [];
    const conteo = db.all('SELECT opcion, count(*) n FROM votos WHERE encuesta_id = ? GROUP BY opcion', e.id);
    const total = conteo.reduce((a, r) => a + r.n, 0);
    return html`<ul class="resultados-encuesta">${opciones.map((o, i) => {
      const n = conteo.find((r) => r.opcion === i)?.n || 0;
      const p = total ? Math.round((n / total) * 100) : 0;
      return html`<li><span>${o}</span><span class="barra" style="--p:${p}%"><span></span></span><b>${p}%</b></li>`;
    })}</ul><p class="meta">${total} ${total === 1 ? 'respuesta' : 'respuestas'}</p>`;
  }
  function encuesta(e, { votado = false } = {}) {
    const hoy = hoyLocal();
    const abierta = (!e.datos.desde || e.datos.desde <= hoy) && (!e.datos.hasta || e.datos.hasta >= hoy);
    return html`<section class="encuesta" aria-labelledby="enc-${e.id}">
      <p class="etiqueta">${crudo(icono('grafico', { tam: 14 }))} Participación ciudadana</p>
      <h2 id="enc-${e.id}">${e.titulo}</h2>
      ${e.cuerpo ? html`<div class="prosa">${crudo(e.cuerpo)}</div>` : ''}
      ${votado || !abierta ? (e.datos.mostrarResultados !== false || !abierta ? resultadosEncuesta(e) : html`<p>¡Gracias por participar!</p>`) : html`<form method="post" action="/participa/${e.slug}/votar/" class="formulario">
        <fieldset><legend class="sr">Opciones</legend>${(e.datos.opciones || []).map((o, i) => html`<label class="opcion"><input type="radio" name="opcion" value="${i}" required> ${o}</label>`)}</fieldset>
        ${crudo(campoAntispam())}<button class="boton boton-primario">Votar</button> <a href="/participa/${e.slug}/">Ver resultados</a>
      </form>`}
    </section>`;
  }

  async function notificar({ asunto, texto, a }) {
    if (!mailer || !a) return false;
    try { await mailer.send({ to: a, subject: asunto, text: texto }); return true; } catch (e) { console.error('Correo:', e.message); return false; }
  }

  async function recibirMensaje(req, body, ip) {
    if (limitador.exceso('form:' + ip, 6, 3600)) throw new ErrorHttp(429, 'Ha enviado demasiados mensajes. Intente nuevamente en una hora.');
    if (!validarAntispam(body)) throw new ErrorHttp(400, 'No pudimos validar el formulario. Recargue la página e inténtelo otra vez.');
    const s = db.ajuste('sitio') || {};
    const tipos = { ...(s.oirs?.tipos || {}), contacto: 'Contacto' };
    const m = {
      tipo: Object.hasOwn(tipos, body.tipo) ? body.tipo : 'consulta',
      nombre: String(body.nombre || '').trim().slice(0, 120), email: String(body.email || '').trim().slice(0, 200),
      telefono: String(body.telefono || '').replace(/[^\d+()\s-]/g, '').slice(0, 20), rut: '', asunto: String(body.asunto || '').trim().slice(0, 160),
      mensaje: String(body.mensaje || '').trim().slice(0, 5000), area_id: Number(body.area) || null,
    };
    if (body.rut) { if (!rutValido(body.rut)) throw new ErrorHttp(400, 'El RUN ingresado no es válido.'); m.rut = formatoRut(body.rut); }
    if (!m.nombre || !emailValido(m.email) || !m.asunto || m.mensaje.length < 5) throw new ErrorHttp(400, 'Complete su nombre, un correo válido, el asunto y el mensaje.');
    if (!body.acepto) throw new ErrorHttp(400, 'Debe aceptar el uso de sus datos para poder responderle.');
    if (m.area_id && repo.obtener(m.area_id)?.tipo !== 'area') m.area_id = null;
    let codigo;
    do { codigo = 'OIRS-' + crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6); } while (db.get('SELECT 1 FROM mensajes WHERE codigo = ?', codigo));
    const t = ahora();
    const r = db.run(`INSERT INTO mensajes(codigo, tipo, nombre, rut, email, telefono, asunto, mensaje, area_id, estado, historial, ip, creado, modificado) VALUES(?,?,?,?,?,?,?,?,?,'nuevo',?,?,?,?)`,
      codigo, m.tipo, m.nombre, m.rut, m.email, m.telefono, m.asunto, m.mensaje, m.area_id, JSON.stringify([{ en: t, evento: 'Recibido por el sitio web' }]), ip, t, t);
    const id = Number(r.lastInsertRowid);
    // Integración: el mensaje entra como solicitud en la Plataforma de Trámites (Oficina de Partes).
    if (m.tipo !== 'contacto') {
      tramites.enviarSolicitudOirs({ ...m, codigo, areaNombre: m.area_id ? repo.obtener(m.area_id)?.titulo : '' }).then((res) => {
        if (res?.trackingCode) db.run('UPDATE mensajes SET externo = ? WHERE id = ?', res.trackingCode, id);
      });
    }
    const etiqueta = tipos[m.tipo] || m.tipo;
    notificar({ a: cfg.AVISOS_EMAIL, asunto: `[Sitio web] ${etiqueta}: ${m.asunto}`, texto: `Nuevo mensaje recibido en el sitio web (${codigo}).\n\nTipo: ${etiqueta}\nNombre: ${m.nombre}\nRUN: ${m.rut || '—'}\nCorreo: ${m.email}\nTeléfono: ${m.telefono || '—'}\nAsunto: ${m.asunto}\n\n${m.mensaje}\n\nGestiónelo en ${cfg.PUBLIC_URL}admin/#/mensajes/${id}` });
    notificar({ a: m.email, asunto: `Recibimos su mensaje ${codigo}`, texto: `Estimado(a) ${m.nombre}:\n\nRecibimos su ${etiqueta.toLowerCase()} «${m.asunto}». Su código de seguimiento es ${codigo}.\n\nPuede consultar la respuesta en ${cfg.PUBLIC_URL}oirs/seguimiento/?codigo=${codigo}\n\n${s.nombre || 'Municipalidad de Melipeuco'}` });
    return { ...m, id, codigo, estado: 'nuevo', creado: t };
  }

  // ---------------------------------------------------------------- Contexto por solicitud
  function contexto(req, ruta, { usuario }) {
    return {
      db, repo, cfg, tramites, img, ruta, req, usuario, version, categoriasDe,
      nonce: crypto.randomBytes(16).toString('base64'),
      ajustes: ajustes(), formulario, encuesta, campoAntispam, ext,
    };
  }

  function responderHtml(req, res, ctx, cuerpo, { status = 200, cachear = false } = {}) {
    const h = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': ctx.usuario ? 'private, no-store' : 'public, max-age=60, stale-while-revalidate=300', ...seguridad(req, ctx.nonce) };
    if (cachear && !ctx.usuario && status === 200) {
      if (cacheHtml.size > 800) cacheHtml.delete(cacheHtml.keys().next().value);
      cacheHtml.set(req.claveCache, { cuerpo: cuerpo.split(ctx.nonce).join(NONCE_CACHE), hasta: Date.now() + 60e3 });
    }
    contarVisita(ctx.ruta, req, status);
    enviar(req, res, status, cuerpo, h);
  }

  function desdeCache(req, res) {
    const c = cacheHtml.get(req.claveCache);
    if (!c || c.hasta < Date.now()) return false;
    const nonce = crypto.randomBytes(16).toString('base64');
    contarVisita(new URL(req.url, 'http://x').pathname, req, 200);
    enviar(req, res, 200, c.cuerpo.split(NONCE_CACHE).join(nonce), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', 'X-Cache': 'HIT', ...seguridad(req, nonce) });
    return true;
  }

  const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless/i;
  function contarVisita(ruta, req, status) {
    if (status !== 200 || req.method !== 'GET' || BOTS.test(req.headers['user-agent'] || '')) return;
    // Las páginas que el navegador descarga por adelantado (al pasar el cursor) se cuentan sólo si
    // de verdad se abren: la página avisa con /api/public/visita.
    if (/prefetch|prerender/i.test(req.headers['sec-purpose'] || req.headers.purpose || '')) return;
    const clave = hoyLocal() + '|' + ruta.slice(0, 200);
    visitas.set(clave, (visitas.get(clave) || 0) + 1);
  }
  setInterval(() => volcarVisitas(), 60e3).unref();
  function volcarVisitas() {
    if (!visitas.size) return;
    const v = visitas;
    visitas = new Map();
    db.tx(() => { for (const [k, n] of v) { const [dia, ruta] = k.split('|'); db.run('INSERT INTO visitas(dia, ruta, n) VALUES(?,?,?) ON CONFLICT(dia, ruta) DO UPDATE SET n = n + excluded.n', dia, ruta, n); } });
  }

  // ---------------------------------------------------------------- Feeds y archivos generados
  function rss(items, { titulo, enlace, descripcion }) {
    const base = cfg.PUBLIC_URL.replace(/\/$/, '');
    const x = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><channel>
<title>${x(titulo)}</title><link>${x(base + enlace)}</link><description>${x(descripcion)}</description><language>es-cl</language>
<atom:link href="${x(base + enlace + 'feed/')}" rel="self" type="application/rss+xml"/>
${items.map((c) => `<item><title>${x(c.titulo)}</title><link>${x(base + repo.urlDe(c))}</link><guid isPermaLink="true">${x(base + repo.urlDe(c))}</guid><pubDate>${new Date(c.publicado_en).toUTCString()}</pubDate><description>${x(resumenDe(c, 400))}</description>${c.imagen ? `<media:content url="${x(base + c.imagen)}" medium="image"/>` : ''}${categoriasDe(c.id).map((t) => `<category>${x(t.nombre)}</category>`).join('')}</item>`).join('\n')}
</channel></rss>`;
  }

  function ics(eventos) {
    const base = cfg.PUBLIC_URL.replace(/\/$/, '');
    const f = (s) => String(s || '').replace(/[-:]/g, '').slice(0, 15) + (s && s.length > 10 ? '00' : '');
    const t = (s) => String(s || '').replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
    const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Municipalidad de Melipeuco//Sitio web//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Agenda comunal de Melipeuco', 'X-WR-TIMEZONE:America/Santiago'];
    for (const e of eventos) {
      const d = e.datos;
      const todoDia = d.todoElDia || (d.inicio || '').length <= 10;
      lineas.push('BEGIN:VEVENT', `UID:evento-${e.id}@${new URL(cfg.PUBLIC_URL).host}`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
        todoDia ? `DTSTART;VALUE=DATE:${d.inicio.slice(0, 10).replace(/-/g, '')}` : `DTSTART;TZID=America/Santiago:${f(d.inicio)}`,
        ...(d.fin ? [todoDia ? `DTEND;VALUE=DATE:${d.fin.slice(0, 10).replace(/-/g, '')}` : `DTEND;TZID=America/Santiago:${f(d.fin)}`] : []),
        `SUMMARY:${t(e.titulo)}`, `DESCRIPTION:${t(recortar(resumenDe(e, 400), 400))}`, `LOCATION:${t([d.lugar, d.direccion].filter(Boolean).join(', '))}`, `URL:${base}${repo.urlDe(e)}`, 'END:VEVENT');
    }
    lineas.push('END:VCALENDAR');
    return lineas.map((l) => (l.length > 74 ? l.match(/.{1,74}/g).join('\r\n ') : l)).join('\r\n');
  }

  function sitemap() {
    const base = cfg.PUBLIC_URL.replace(/\/$/, '');
    const urls = ['/', '/noticias/', '/tramites/', '/eventos/', '/documentos/', '/areas/', '/contacto/', '/oirs/', '/transparencia/', '/transparencia/documentos/', '/concejo/sesiones/', '/mapa-del-sitio/'].map((u) => ({ u, m: null }));
    for (const f of db.all("SELECT id, tipo, slug, padre_id, publicado_en, creado, modificado, datos FROM contenidos WHERE estado = 'publicado' AND tipo NOT IN ('slide','acceso','aviso','contacto') AND json_extract(seo, '$.noindex') IS NOT 1")) {
      urls.push({ u: repo.urlDe({ ...f, datos: JSON.parse(f.datos) }), m: f.modificado });
    }
    urls.push({ u: '/videos/', m: null }, ...urlsVideos());
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((x) => `<url><loc>${esc(base + x.u)}</loc>${x.m ? `<lastmod>${x.m.slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
  }

  function manifest() {
    const s = ajustes();
    return JSON.stringify({ name: s.nombre, short_name: 'Melipeuco', description: s.descripcion, lang: 'es-CL', start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: s.colores?.primario || '#0B4F7C', icons: [{ src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }], shortcuts: [{ name: 'Trámites', url: '/tramites/' }, { name: 'Noticias', url: '/noticias/' }, { name: 'Contacto', url: '/contacto/' }] });
  }

  // Bloque HTML aislado: se sirve en su propio documento con CSP «sandbox» (origen opaco):
  // no puede leer cookies ni el DOM del sitio, aunque contenga scripts.
  function bloqueAislado(req, res, cid, bid, usuario) {
    const c = repo.obtener(Number(cid));
    if (!c || (!repo.visible(c) && !usuario)) throw new ErrorHttp(404, 'No encontrado');
    const b = (c.bloques || []).find((x) => x.id === bid && x.tipo === 'html_aislado');
    if (!b) throw new ErrorHttp(404, 'No encontrado');
    documentoAislado(req, res, b.html, bid);
  }
  // Documento de Transparencia: se entrega desde el sitio (el visitante nunca ve Drive ni sus
  // carpetas). Sólo documentos de la lista; los muy grandes en Vercel (límite de respuesta de
  // sus funciones) se descargan directo del archivo público.
  const MIME = { PDF: 'application/pdf', Planilla: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Documento: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', Imagen: 'image/jpeg' };
  async function documentoTransparencia(req, res, p) {
    const d = inventario()?.porId.get(String(p));
    if (!d) throw new ErrorHttp(404, 'Documento no encontrado');
    if (limitador.exceso('doc:' + req.ip, 120, 60)) throw new ErrorHttp(429, 'Demasiadas descargas seguidas. Intente en un minuto.');
    const u = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(d.i)}&export=download&confirm=t${d.k ? '&resourcekey=' + encodeURIComponent(d.k) : ''}`;
    let r;
    try { r = await fetch(u, { signal: AbortSignal.timeout(25000) }); } catch { throw new ErrorHttp(502, 'No se pudo obtener el documento. Intente nuevamente en unos minutos.'); }
    const tipo = r.headers.get('content-type') || '';
    if (!r.ok || !r.body || /text\/html/.test(tipo)) { r.body?.cancel?.(); throw new ErrorHttp(502, 'No se pudo obtener el documento. Intente nuevamente en unos minutos.'); }
    const largo = Number(r.headers.get('content-length')) || 0;
    if (cfg.VERCEL && largo > 4_300_000) { r.body.cancel?.(); return redirigir(res, u, 302); }
    const nombre = decodeURIComponent(urlDoc(d).split('/').pop());
    res.writeHead(200, {
      'Content-Type': MIME[d.t] || (tipo && !/octet-stream/.test(tipo) ? tipo : 'application/octet-stream'), ...(largo ? { 'Content-Length': largo } : {}),
      'Content-Disposition': `inline; filename="${nombre.replace(/[^\w.-]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      'Cache-Control': 'public, max-age=86400, s-maxage=604800', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    });
    if (req.method === 'HEAD') { r.body.cancel?.(); return res.end(); }
    Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
  }

  // Bloque «HTML con scripts» de una zona (Extensiones).
  function zonaAislada(req, res, id) {
    const z = ext.zonaAislada(id);
    if (!z) throw new ErrorHttp(404, 'No encontrado');
    documentoAislado(req, res, z.html, id);
  }
  function documentoAislado(req, res, codigoHtml, bid) {
    // El marco aislado no tiene origen propio: sin este reemplazo, localStorage lanza un error y
    // corta los scripts de las páginas heredadas.
    const memoria = `<script>(function(){try{window.localStorage.length}catch(e){var m={},s={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null}};Object.defineProperty(s,'length',{get:function(){return Object.keys(m).length}});try{Object.defineProperty(window,'localStorage',{value:s,configurable:true});Object.defineProperty(window,'sessionStorage',{value:s,configurable:true})}catch(_){}}})();</script>`;
    const ajuste = `<base target="_top"><style>html,body{margin:0;overflow:hidden}</style>${memoria}`;
    const resize = `<script>(function(){var u=0;function m(){var h=Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);if(h!==u){u=h;parent.postMessage({tipo:'mlp-alto',bloque:${JSON.stringify(bid)},alto:h},'*')}}addEventListener('load',m);addEventListener('resize',m);if(window.ResizeObserver)new ResizeObserver(m).observe(document.documentElement);setInterval(m,1500);m()})();</script>`;
    let h = repararScripts(String(codigoHtml));
    if (/<html[\s>]/i.test(h)) {
      h = /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (m) => m + ajuste) : h.replace(/<html[^>]*>/i, (m) => m + '<head>' + ajuste + '</head>');
      h = /<\/body>/i.test(h) ? h.replace(/<\/body>/i, resize + '</body>') : h + resize;
      if (!/^\s*<!doctype/i.test(h)) h = '<!doctype html>' + h;
    } else {
      h = `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${ajuste}<style>body{font-family:'Atkinson Hyperlegible Next',system-ui,sans-serif;line-height:1.55;color:#1a2433}</style></head><body>${h}${resize}</body></html>`;
    }
    enviar(req, res, 200, h, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation-by-user-activation allow-downloads; default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self'",
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
  }

  // ---------------------------------------------------------------- API pública (datos abiertos)
  async function apiPublica(req, res, ruta, query, cors) {
    const base = cfg.PUBLIC_URL.replace(/\/$/, '');
    const enviarJson = (d, max = 60) => json(req, res, 200, d, { 'Cache-Control': `public, max-age=${max}`, ...cors });
    const resumen = (c) => ({ id: c.id, tipo: c.tipo, titulo: c.titulo, resumen: resumenDe(c, 300), url: base + repo.urlDe(c), imagen: c.imagen ? (c.imagen.startsWith('http') ? c.imagen : base + c.imagen) : null, publicado: c.publicado_en, modificado: c.modificado });
    const m = ruta.match(/^\/api\/public\/([\w-]+)(?:\/([\w-]+))?\/?$/);
    const recurso = m?.[1] || '';
    const limite = Math.min(100, Number(query.get('limite')) || 20);
    const pagina = Math.max(1, Number(query.get('pagina')) || 1);
    switch (recurso) {
      case '': return enviarJson({ nombre: 'API pública del sitio web de la Municipalidad de Melipeuco', licencia: 'CC BY 4.0', recursos: ['/api/public/noticias', '/api/public/noticias/{id}', '/api/public/avisos', '/api/public/eventos', '/api/public/tramites', '/api/public/areas', '/api/public/documentos', '/api/public/buscar?q=', '/api/public/sitio', '/api/public/menu/{clave}'] }, 3600);
      case 'noticias': {
        if (m[2]) { const c = repo.obtener(Number(m[2])); if (!c || c.tipo !== 'noticia' || !repo.visible(c)) throw new ErrorHttp(404, 'No encontrado'); return enviarJson({ ...resumen(c), cuerpo: c.cuerpo, categorias: categoriasDe(c.id).map((t) => t.nombre) }); }
        const cat = query.get('categoria') ? db.get("SELECT id FROM taxonomias WHERE tipo='categoria' AND slug = ?", query.get('categoria')) : null;
        const r = repo.listar({ tipo: 'noticia', publico: true, categoria: cat?.id, limite, pagina });
        return enviarJson({ total: r.total, pagina: r.pagina, paginas: r.paginas, items: r.items.map((c) => ({ ...resumen(c), categorias: categoriasDe(c.id).map((t) => t.slug) })) });
      }
      case 'avisos': return enviarJson({ items: repo.vigentes('aviso').map((a) => ({ id: a.id, titulo: a.titulo, texto: textoPlano(a.cuerpo), nivel: a.datos.nivel, enlace: a.datos.enlace, desde: a.datos.desde, hasta: a.datos.hasta, enTodas: a.datos.enTodas })) }, 30);
      case 'eventos': return enviarJson({ items: repo.eventosProximos(limite).map((e) => ({ ...resumen(e), inicio: e.datos.inicio, fin: e.datos.fin, lugar: e.datos.lugar })) }, 300);
      case 'tramites': return enviarJson({ items: repo.listar({ tipo: 'tramite', publico: true, orden: 'orden', limite: 500 }).items.map((t) => ({ ...resumen(t), modalidad: t.datos.modalidad, costo: t.datos.costo, plataformaId: t.datos.transitoTramite || null, enLinea: t.datos.urlEnLinea || (t.datos.transitoTramite ? tramites.enlaces.tramite(t.datos.transitoTramite) : null), area: t.area_id })) }, 300);
      case 'areas': return enviarJson({ items: repo.listar({ tipo: 'area', publico: true, orden: 'orden', limite: 500 }).items.map((a) => ({ id: a.id, nombre: a.titulo, corto: a.datos.nombreCorto, padre: a.padre_id, url: base + repo.urlDe(a), plataformaId: a.datos.transitoDepartamento || null, telefono: a.datos.telefono, email: a.datos.email })) }, 3600);
      case 'documentos': return enviarJson({ items: repo.listar({ tipo: 'documento', publico: true, orden: 'documento', limite, pagina }).items.map((d) => ({ ...resumen(d), archivo: d.datos.archivo ? base + d.datos.archivo : null, numero: d.datos.numero, fecha: d.datos.fechaDoc })) }, 300);
      case 'sitio': { const s = ajustes(); return enviarJson({ nombre: s.nombre, lema: s.lema, direccion: s.direccion, telefono: s.telefono, whatsapp: s.whatsapp, email: s.email, horario: s.horario, redes: s.redes, emergencias: s.emergencias, colores: s.colores, url: base + '/' }, 3600); }
      case 'menu': return enviarJson({ items: repo.menu(m[2] || 'principal') }, 600);
      case 'visita': {
        const r = String(query.get('r') || '');
        if (/^\/(?!\/)[^\s]{0,200}$/.test(r) && !limitador.exceso('vis:' + req.ip, 60, 60)) contarVisita(r.split('?')[0], req, 200);
        res.writeHead(204, { 'Cache-Control': 'no-store' }); return res.end();
      }
      case 'buscar': {
        const q = String(query.get('q') || '').slice(0, 80);
        if (q.trim().length < 2) return enviarJson({ items: [] }, 30);
        if (limitador.exceso('sug:' + req.ip, 120, 60)) throw new ErrorHttp(429, 'Demasiadas consultas.');
        const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const fragmento = (f) => String(f || '').replace(/\s+/g, ' ').trim().slice(0, 160);
        const deContenido = (c) => ({ tipo: TIPOS[c.tipo]?.etiqueta || c.tipo, clave: c.tipo, titulo: c.titulo, url: repo.urlDe(c), fragmento: fragmento(c.fragmento) });
        let r = repo.buscar(q, { limite: 8 }).items.map(deContenido), aproximado = false;
        // Sin resultados (falta de ortografía o palabra incompleta): se prueba con el comienzo de cada palabra.
        if (!r.length) {
          const corto = q.split(/\s+/).filter((t) => t.length > 3).map((t) => t.slice(0, Math.max(4, Math.ceil(t.length * .6)))).join(' ');
          if (corto) { r = repo.buscar(corto, { limite: 6 }).items.map(deContenido); aproximado = r.length > 0; }
        }
        // Accesos directos del menú principal cuyo nombre coincide con lo escrito.
        const nq = norm(q).trim(), palabras = nq.split(/\s+/);
        const plano = (lista) => lista.flatMap((i) => [i, ...plano(i.hijos || [])]);
        const atajos = plano(repo.menu('principal')).filter((i) => i.url && i.url !== '#' && palabras.every((p) => norm(i.texto + ' ' + (i.descripcion || '')).includes(p)))
          .slice(0, 3).map((i) => ({ tipo: 'Acceso directo', clave: 'atajo', titulo: i.texto, url: i.url, externo: /^https?:/.test(i.url) && !i.url.startsWith(base) }));
        const cat = query.get('plataforma') !== '0' ? await tramites.catalogo() : null;
        const en = cat ? cat.tramites.filter((t) => palabras.every((p) => norm(t.nombre + ' ' + t.descripcion).includes(p))).slice(0, 3).map((t) => ({ tipo: 'Trámite en línea', clave: 'en-linea', titulo: t.nombre, url: t.url, externo: true, fragmento: fragmento(t.descripcion) })) : [];
        const transp = buscarTransparencia(ext.leer(), palabras, norm);
        const docs = buscarArchivo(inventario(), q, { limite: 3 }).map((a) => ({ tipo: 'Documento de Transparencia', clave: 'documento', titulo: a.n, url: urlDoc(a), fragmento: [a.c, a.ar, a.f ? 'publicado el ' + a.f.split('-').reverse().join('-') : ''].filter(Boolean).join(' · ') }));
        const vids = buscarVideos(q, 3).map((v) => ({ tipo: 'Video', clave: 'video', titulo: v.t, url: urlVideo(v), fragmento: [indiceVideos()?.cats.get(v.c)?.nombre, (v.fe || v.f || '').slice(0, 10).split('-').reverse().join('-')].filter(Boolean).join(' · ') }));
        const vistos = new Set();
        const items = [...atajos, ...en, ...transp, ...r, ...vids, ...docs].filter((i) => { const k = i.url.replace(/\/$/, ''); if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 10);
        return enviarJson({ items, aproximado: aproximado && !atajos.length && !en.length && !transp.length && !docs.length && !vids.length }, 60);
      }
      default: throw new ErrorHttp(404, 'Recurso no encontrado');
    }
  }

  // ---------------------------------------------------------------- Enrutador
  async function manejar(req, res, url) {
    let ruta = url.pathname;
    const q = url.searchParams;
    const usuario = leerUsuario(req);

    // API pública
    if (ruta.startsWith('/api/public')) {
      const origen = req.headers.origin;
      const cors = origen && cfg.CORS_ORIGINS.includes(origen) ? { 'Access-Control-Allow-Origin': origen, Vary: 'Origin' } : {};
      if (req.method === 'OPTIONS') { res.writeHead(204, { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' }); return res.end(); }
      return apiPublica(req, res, ruta, q, cors);
    }

    // Archivos generados
    if (ruta === '/robots.txt') return enviar(req, res, 200, `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /vista-previa/\nDisallow: /buscar/\nAllow: /api/public/\nSitemap: ${cfg.PUBLIC_URL}sitemap.xml\n`, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
    if (ruta === '/sitemap.xml') return enviar(req, res, 200, sitemap(), { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
    if (ruta === '/manifest.webmanifest') return enviar(req, res, 200, manifest(), { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=86400' });
    if (ruta === '/feed/' || ruta === '/feed' || /^\/categoria\/[\w-]+\/feed\/?$/.test(ruta)) {
      const slug = /^\/categoria\/([\w-]+)\//.exec(ruta)?.[1];
      const cat = slug ? db.get("SELECT * FROM taxonomias WHERE tipo='categoria' AND slug = ?", slug) : null;
      const items = repo.listar({ tipo: 'noticia', publico: true, categoria: cat?.id, limite: 30 }).items;
      const s = ajustes();
      return enviar(req, res, 200, rss(items, { titulo: cat ? `${cat.nombre} — ${s.nombreCorto}` : `Noticias — ${s.nombre}`, enlace: cat ? `/categoria/${cat.slug}/` : '/', descripcion: s.descripcion }), { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' });
    }
    if (ruta === '/eventos.ics') return enviar(req, res, 200, ics(repo.listar({ tipo: 'evento', publico: true, orden: 'eventoDesc', limite: 300 }).items), { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="agenda-melipeuco.ics"', 'Cache-Control': 'public, max-age=600' });
    let m = ruta.match(/^\/embed\/bloque\/(\d+)\/([\w-]+)\/?$/);
    if (m) return bloqueAislado(req, res, m[1], m[2], usuario);
    m = ruta.match(/^\/embed\/zona\/([a-z0-9-]{3,40})\/?$/);
    if (m) return zonaAislada(req, res, m[1]);

    // Formularios
    if (req.method === 'POST') return manejarPost(req, res, ruta, usuario);
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new ErrorHttp(405, 'Método no permitido');

    // Normalizar barra final (excepto archivos)
    if (!ruta.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(ruta)) return redirigir(res, ruta + '/' + url.search, 301);

    const s = ajustes();
    if (s.mantenimiento?.activo && !usuario) {
      const ctx = contexto(req, ruta, { usuario });
      return enviar(req, res, 503, V.mantenimiento(ctx), { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '600', ...seguridad(req, ctx.nonce) });
    }

    req.claveCache = ruta + url.search;
    if (!usuario && desdeCache(req, res)) return;
    const ctx = contexto(req, ruta, { usuario });
    await ext.preparar(ruta);
    await prepararVideos();
    const responder = (cuerpo, op = {}) => responderHtml(req, res, ctx, cuerpo, { cachear: true, ...op });
    const seg = ruta.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
    const pag = (i) => (seg[i] === 'page' && /^\d+$/.test(seg[i + 1] || '') ? Number(seg[i + 1]) : 1);

    // Vista previa (borradores) para personas con sesión en el panel
    if (seg[0] === 'vista-previa' && /^\d+$/.test(seg[1] || '')) {
      if (!usuario) return redirigir(res, '/admin/');
      const c = repo.obtener(Number(seg[1]));
      if (!c) throw new ErrorHttp(404, 'No encontrado');
      return responderHtml(req, res, ctx, await vistaContenido(ctx, c), { cachear: false });
    }

    if (ruta === '/') return responder(await V.portada(ctx));

    // Noticias
    if (seg[0] === 'noticias') {
      const p = pag(1);
      const term = (q.get('q') || '').slice(0, 80);
      const r = term ? { ...repo.buscar(term, { tipo: 'noticia', limite: 12, pagina: p }), pagina: p } : repo.listar({ tipo: 'noticia', publico: true, limite: 12, pagina: p });
      return responder(V.listadoNoticias(ctx, { titulo: term ? `Noticias sobre «${term}»` : 'Noticias', base: '/noticias/', items: r.items, pagina: p, paginas: r.paginas || Math.ceil(r.total / 12), total: r.total, migasItems: [{ texto: 'Noticias' }] }));
    }
    if (seg[0] === 'page' && /^\d+$/.test(seg[1] || '')) return redirigir(res, `/noticias/page/${seg[1]}/`, 301);
    if ((seg[0] === 'category' || seg[0] === 'tag') && seg[1]) return redirigir(res, `/${seg[0] === 'tag' ? 'etiqueta' : 'categoria'}/${seg.at(-1) === 'feed' ? seg.slice(1).join('/') : seg[seg.length - 1]}/`, 301);
    if ((seg[0] === 'categoria' || seg[0] === 'etiqueta') && seg[1]) {
      const t = db.get('SELECT * FROM taxonomias WHERE tipo = ? AND slug = ?', seg[0], seg[1]);
      if (!t) return noEncontrado(req, res, ctx, ruta);
      const ids = [t.id, ...db.all('SELECT id FROM taxonomias WHERE padre_id = ?', t.id).map((x) => x.id)];
      const p = pag(2);
      const r = repo.listar({ tipo: ['noticia', 'evento', 'tramite'], publico: true, taxonomia: ids, limite: 12, pagina: p });
      return responder(V.listadoNoticias(ctx, { titulo: t.nombre, bajada: t.descripcion, base: `/${seg[0]}/${t.slug}/`, items: r.items, pagina: p, paginas: r.paginas, total: r.total, migasItems: [{ texto: 'Noticias', url: '/noticias/' }, { texto: t.nombre }] }));
    }
    // Archivo por fecha y noticia individual: /2026/10/21/slug/
    if (/^\d{4}$/.test(seg[0] || '')) {
      if (seg.length >= 4 && /^\d{2}$/.test(seg[1]) && /^\d{2}$/.test(seg[2]) && seg[3] !== 'page') {
        const c = repo.porSlug('noticia', seg[3]);
        if (c && (repo.visible(c) || usuario)) {
          const correcta = repo.urlDe(c);
          if (correcta !== ruta) return redirigir(res, correcta, 301);
          return responder(await V.noticia(ctx, c));
        }
        return noEncontrado(req, res, ctx, ruta);
      }
      const anio = seg[0];
      const mes = /^\d{2}$/.test(seg[1] || '') ? seg[1] : null;
      const desde = `${anio}-${mes || '01'}-01T00:00:00.000Z`;
      const hasta = mes ? (Number(mes) === 12 ? `${Number(anio) + 1}-01-01` : `${anio}-${String(Number(mes) + 1).padStart(2, '0')}-01`) + 'T00:00:00.000Z' : `${Number(anio) + 1}-01-01T00:00:00.000Z`;
      const p = pag(mes ? 2 : 1);
      const r = repo.listar({ tipo: 'noticia', publico: true, desde, hasta, limite: 12, pagina: p });
      const t = mes ? new Date(`${anio}-${mes}-15`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }) : anio;
      return responder(V.listadoNoticias(ctx, { titulo: `Noticias de ${t}`, base: `/${anio}/${mes ? mes + '/' : ''}`, items: r.items, pagina: p, paginas: r.paginas, total: r.total, migasItems: [{ texto: 'Noticias', url: '/noticias/' }, { texto: t }] }));
    }

    // Trámites
    if (seg[0] === 'tramites') {
      if (!seg[1]) return responder(await V.catalogoTramites(ctx, { q: (q.get('q') || '').slice(0, 80), area: q.get('area') || '', modalidad: q.get('modalidad') || '' }));
      if (seg[1] === 'seguimiento') {
        if (seg[2] === 'ir') {
          const destino = tramites.enlaces.seguimiento(String(q.get('codigo') || '').trim().toUpperCase().slice(0, 20), String(q.get('rut') || '').slice(0, 12));
          if (/^OIRS-/i.test(q.get('codigo') || '')) return redirigir(res, `/oirs/seguimiento/?codigo=${encodeURIComponent(q.get('codigo'))}`);
          return redirigir(res, destino || '/tramites/seguimiento/');
        }
        return responder(V.seguimiento(ctx, { codigo: q.get('codigo') || '', rut: q.get('rut') || '' }), { cachear: false });
      }
      const c = repo.porSlug('tramite', seg[1]);
      if (c && (repo.visible(c) || usuario)) return responder(await V.fichaTramite(ctx, c));
      return noEncontrado(req, res, ctx, ruta);
    }

    // Agenda
    if (seg[0] === 'eventos') {
      if (!seg[1] || seg[1] === 'page') return responder(V.agenda(ctx, { mes: /^\d{4}-\d{2}$/.test(q.get('mes') || '') ? q.get('mes') : null, pasados: q.get('pasados') === '1', pagina: pag(1) }));
      const c = repo.porSlug('evento', seg[1]);
      if (!c || !(repo.visible(c) || usuario)) return noEncontrado(req, res, ctx, ruta);
      if (seg[2] === 'ics') return enviar(req, res, 200, ics([c]), { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="${c.slug}.ics"` });
      return responder(await V.evento(ctx, c));
    }

    if (seg[0] === 'documentos') {
      if (!seg[1] || seg[1] === 'page') return responder(V.listadoDocumentos(ctx, { q: (q.get('q') || '').slice(0, 80), coleccion: q.get('coleccion') || '', pagina: pag(1) }));
      const c = repo.porSlug('documento', seg[1]);
      return c && (repo.visible(c) || usuario) ? responder(await V.fichaDocumento(ctx, c)) : noEncontrado(req, res, ctx, ruta);
    }
    if (seg[0] === 'areas') {
      if (!seg[1]) return responder(V.listadoAreas(ctx));
      const c = repo.porSlug('area', seg[1]);
      return c && (repo.visible(c) || usuario) ? responder(await V.fichaArea(ctx, c)) : noEncontrado(req, res, ctx, ruta);
    }
    if (seg[0] === 'autoridades' && seg[1]) {
      const c = repo.porSlug('autoridad', seg[1]);
      return c && (repo.visible(c) || usuario) ? responder(await V.fichaAutoridad(ctx, c)) : noEncontrado(req, res, ctx, ruta);
    }
    if (seg[0] === 'concejo') {
      if (seg[1] !== 'sesiones') return redirigir(res, '/concejo-municipal/', 301);
      if (!seg[2] || seg[2] === 'page') return responder(V.listadoSesiones(ctx, { pagina: pag(2) }));
      const c = repo.porSlug('sesion', seg[2]);
      return c && (repo.visible(c) || usuario) ? responder(await V.fichaSesion(ctx, c)) : noEncontrado(req, res, ctx, ruta);
    }
    if (seg[0] === 'descubre') {
      if (!seg[1]) return redirigir(res, '/turismo/');
      const c = repo.porSlug('lugar', seg[1]);
      return c && (repo.visible(c) || usuario) ? responder(await V.fichaGenerica(ctx, c, { migasPadre: [{ texto: 'Turismo', url: '/turismo/' }] })) : noEncontrado(req, res, ctx, ruta);
    }
    if (seg[0] === 'participa') {
      if (!seg[1]) {
        const lista = repo.listar({ tipo: 'encuesta', publico: true, limite: 50 }).items;
        const vacia = { id: 0, titulo: 'Participación ciudadana', resumen: 'Opine sobre las decisiones de su comuna.', cuerpo: '', bloques: [], seo: {} };
        return responder(await V.fichaGenerica(ctx, vacia, { despues: lista.length ? html`${lista.map((e) => encuesta(e, { votado: !!leerCookieVoto(req, e.id) }))}` : html`<p>No hay consultas abiertas en este momento.</p>` }), { cachear: false });
      }
      const e = repo.porSlug('encuesta', seg[1]);
      if (!e || !(repo.visible(e) || usuario)) return noEncontrado(req, res, ctx, ruta);
      return responder(await V.fichaGenerica(ctx, { ...e, cuerpo: '' }, { migasPadre: [{ texto: 'Participación ciudadana', url: '/participa/' }], despues: encuesta(e, { votado: true }) }), { cachear: false });
    }
    if (seg[0] === 'directorio') return redirigir(res, '/contacto/', 301);
    if (seg[0] === 'contacto' && !seg[1]) return responder(V.contacto(ctx, { mensaje: q.get('error') ? html`<div class="caja caja-alerta" role="alert">${crudo(icono('alerta'))}<div>${q.get('error')}</div></div>` : '' }), { cachear: !q.get('error') });
    if (seg[0] === 'oirs') {
      if (seg[1] === 'seguimiento') {
        const codigo = String(q.get('codigo') || '').trim().toUpperCase();
        const email = String(q.get('email') || '').trim().toLowerCase();
        if (!codigo) return responder(V.seguimiento(ctx), { cachear: false });
        if (limitador.exceso('seg:' + req.ip, 20, 600)) throw new ErrorHttp(429, 'Demasiadas consultas. Espere unos minutos.');
        const msg = db.get('SELECT * FROM mensajes WHERE codigo = ?', codigo);
        if (!msg || (email && msg.email.toLowerCase() !== email) || !email) return responder(V.oirs(ctx, { mensaje: html`<div class="caja caja-alerta" role="alert">${crudo(icono('alerta'))}<div>No encontramos un mensaje con ese código y correo.</div></div>` }), { cachear: false, status: 404 });
        return responder(V.resultadoMensaje(ctx, msg), { cachear: false });
      }
      if (seg[1] === 'enviado') {
        const msg = db.get('SELECT * FROM mensajes WHERE codigo = ?', String(q.get('codigo') || ''));
        if (!msg || Date.parse(msg.creado) < Date.now() - 3600e3) return redirigir(res, '/oirs/');
        return responder(V.resultadoMensaje(ctx, msg, { recien: true }), { cachear: false });
      }
      return responder(V.oirs(ctx, { tipo: q.get('tipo') || 'consulta', area: q.get('area') || '', mensaje: q.get('error') ? html`<div class="caja caja-alerta" role="alert">${crudo(icono('alerta'))}<div>${q.get('error')}</div></div>` : '' }), { cachear: !q.toString() });
    }
    if (seg[0] === 'boletin') {
      if (seg[1] === 'confirmar' || seg[1] === 'baja') {
        const sus = db.get('SELECT * FROM suscriptores WHERE token = ?', String(seg[2] || ''));
        if (sus) db.run('UPDATE suscriptores SET estado = ?, confirmado = coalesce(confirmado, ?) WHERE id = ?', seg[1] === 'confirmar' ? 'activo' : 'baja', ahora(), sus.id);
        return responder(await mensajeSimple(ctx, sus ? (seg[1] === 'confirmar' ? 'Suscripción confirmada' : 'Suscripción cancelada') : 'Enlace no válido', sus ? (seg[1] === 'confirmar' ? 'Desde ahora recibirá las noticias municipales en su correo.' : 'Ya no recibirá más correos del boletín.') : 'El enlace no es válido o ya fue usado.'), { cachear: false });
      }
      if (seg[1] === 'gracias') return responder(await mensajeSimple(ctx, '¡Gracias por suscribirse!', q.get('pendiente') ? 'Le enviamos un correo para confirmar su suscripción. Revise también la carpeta de correo no deseado.' : 'Desde ahora recibirá las noticias municipales en su correo.'), { cachear: false });
      return redirigir(res, '/');
    }
    if (seg[0] === 'buscar') {
      const term = String(q.get('q') || '').slice(0, 100);
      const tipo = Object.hasOwn(TIPOS, q.get('tipo') || '') ? q.get('tipo') : '';
      const p = Math.max(1, Number(q.get('pagina')) || pag(1));
      if (term && limitador.exceso('buscar:' + req.ip, 60, 60)) throw new ErrorHttp(429, 'Demasiadas búsquedas seguidas.');
      const resultados = term ? repo.buscar(term, { tipo, limite: 20, pagina: p }) : { total: 0, items: [] };
      let enLinea = [];
      if (term && (!tipo || tipo === 'tramite') && p === 1) {
        const cat = await tramites.catalogo();
        const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const partes = norm(term).split(/\s+/).filter(Boolean);
        const vinculados = new Set(db.all("SELECT json_extract(datos,'$.transitoTramite') t FROM contenidos WHERE tipo='tramite'").map((x) => x.t).filter(Boolean));
        enLinea = (cat?.tramites || []).filter((t) => !vinculados.has(t.id) && partes.every((x) => norm(`${t.nombre} ${t.descripcion} ${t.categoria}`).includes(x))).slice(0, 5);
      }
      return responder(V.busqueda(ctx, { q: term, tipo, pagina: p, resultados, tramitesEnLinea: enLinea }), { cachear: false });
    }
    // Videoteca: videos de los canales de YouTube de la Municipalidad.
    if (seg[0] === 'videos') {
      if (!seg[1] || seg[1] === 'page') {
        const filtros = Object.fromEntries(['q', 'categoria', 'anio', 'canal', 'tipo', 'orden'].map((k) => [k, String(q.get(k) || '').slice(0, 100)]));
        const r = paginaVideos(ctx, filtros, Number(q.get('p')) || 1);
        if (r) return responder(r, { cachear: !filtros.q });
      } else if (seg[1] === 'categoria' && seg[2]) return redirigir(res, `/videos/?categoria=${encodeURIComponent(seg[2])}`, 301);
      else if (seg[1] === 'lista' && seg[2]) { const r = paginaLista(ctx, seg[2]); if (r) return responder(r); }
      else if (/^[\w-]{11}$/.test(seg[1]) && !seg[2]) { const r = fichaVideo(ctx, seg[1]); if (r) return responder(r); }
    }
    if (seg[0] === 'transparencia' && !seg[1]) return responder(V.transparencia(ctx));
    // Las direcciones antiguas del archivo llevan a la nueva lista de documentos.
    if (seg[0] === 'transparencia' && seg[1] === 'archivo') return redirigir(res, '/transparencia/documentos/', 301);
    if (seg[0] === 'transparencia' && seg[1] === 'documentos') {
      if (seg[2]) return documentoTransparencia(req, res, seg[2]);
      const filtros = Object.fromEntries(['q', 'materia', 'anio', 'area', 'clase'].map((k) => [k, String(q.get(k) || '').slice(0, 120)]));
      return responder(paginaArchivo(ctx, filtros, Number(q.get('p')) || 1), { cachear: !filtros.q });
    }
    if (seg[0] === 'mapa-del-sitio') return responder(V.mapaDelSitio(ctx));
    if (seg[0] === 'accesibilidad' && !repo.paginaPorRuta(['accesibilidad'])) return responder(V.accesibilidad(ctx));

    // Páginas por jerarquía de slugs
    const c = repo.paginaPorRuta(seg);
    if (c && (repo.visible(c) || usuario)) return responder(await V.pagina(ctx, c));

    return noEncontrado(req, res, ctx, ruta);
  }

  async function vistaContenido(ctx, c) {
    switch (c.tipo) {
      case 'noticia': return V.noticia(ctx, c);
      case 'pagina': return V.pagina(ctx, c);
      case 'tramite': return V.fichaTramite(ctx, c);
      case 'evento': return V.evento(ctx, c);
      case 'documento': return V.fichaDocumento(ctx, c);
      case 'area': return V.fichaArea(ctx, c);
      case 'sesion': return V.fichaSesion(ctx, c);
      case 'autoridad': return V.fichaAutoridad(ctx, c);
      default: return V.fichaGenerica(ctx, c);
    }
  }

  function mensajeSimple(ctx, titulo, texto) {
    return V.fichaGenerica(ctx, { id: 0, titulo, resumen: '', cuerpo: '', bloques: [], seo: { noindex: true } }, { despues: html`<div class="caja caja-exito">${crudo(icono('check', { tam: 26 }))}<div><p>${texto}</p></div></div><p><a class="boton boton-primario" href="/">Volver al inicio</a></p>` });
  }

  async function noEncontrado(req, res, ctx, ruta) {
    // 1) Redirecciones registradas  2) URL antigua de WordPress  3) slug suelto
    const r = db.get('SELECT * FROM redirecciones WHERE origen = ?', ruta);
    if (r) { db.run('UPDATE redirecciones SET visitas = visitas + 1 WHERE id = ?', r.id); return redirigir(res, r.destino, r.codigo); }
    const antiguo = db.get("SELECT id FROM contenidos WHERE url_antigua = ? AND estado = 'publicado'", ruta);
    if (antiguo) { const c = repo.obtener(antiguo.id); const nueva = repo.urlDe(c); if (nueva !== ruta) return redirigir(res, nueva, 301); }
    const ultimo = ruta.split('/').filter(Boolean).pop();
    if (ultimo) {
      const c = db.get("SELECT id FROM contenidos WHERE slug = ? AND estado = 'publicado' AND tipo IN ('noticia','pagina','tramite','evento','documento') LIMIT 1", ultimo);
      if (c) { const nueva = repo.urlDe(repo.obtener(c.id)); if (nueva !== ruta) return redirigir(res, nueva, 301); }
    }
    const sugerencias = ultimo ? repo.buscar(ultimo.replace(/-/g, ' '), { limite: 5 }).items : [];
    responderHtml(req, res, ctx, V.noEncontrado(ctx, sugerencias), { status: 404 });
  }

  const leerCookieVoto = (req, id) => new RegExp(`(?:^|;\\s*)mlp_v${id}=1`).test(req.headers.cookie || '');

  async function manejarPost(req, res, ruta, usuario) {
    // Protección CSRF básica para formularios públicos: el origen debe ser este sitio.
    const origen = req.headers.origin || req.headers.referer || '';
    if (origen && !origen.startsWith(cfg.PUBLIC_URL.replace(/\/$/, '')) && !origen.startsWith(`http://${req.headers.host}`) && !origen.startsWith(`https://${req.headers.host}`)) throw new ErrorHttp(403, 'Origen no permitido.');
    const body = await leerFormulario(req, 32 * 1024);
    const ip = req.ip;
    const volver = (base, error) => redirigir(res, `${base}?error=${encodeURIComponent(error)}${body.tipo && base === '/oirs/' ? '&tipo=' + encodeURIComponent(body.tipo) : ''}#${base === '/contacto/' ? 'escribanos' : 'contenido'}`, 303);
    if (ruta === '/oirs/' || ruta === '/contacto/') {
      try {
        const m = await recibirMensaje(req, { ...body, tipo: ruta === '/contacto/' ? 'contacto' : body.tipo === 'contacto' ? 'consulta' : body.tipo }, ip);
        return redirigir(res, `/oirs/enviado/?codigo=${m.codigo}`, 303);
      } catch (e) {
        if (e.status) return volver(ruta, e.message);
        throw e;
      }
    }
    if (ruta === '/boletin/') {
      if (limitador.exceso('bol:' + ip, 5, 3600) || !validarAntispam(body)) return redirigir(res, '/boletin/gracias/', 303);
      const email = String(body.email || '').trim().toLowerCase();
      if (!emailValido(email)) return redirigir(res, '/?error=correo#boletin', 303);
      const ya = db.get('SELECT * FROM suscriptores WHERE email = ?', email);
      const token = ya?.token || tokenAleatorio(24);
      const estado = mailer ? 'pendiente' : 'activo';
      if (!ya) db.run('INSERT INTO suscriptores(email, estado, token, creado) VALUES(?,?,?,?)', email, estado, token, ahora());
      else if (ya.estado === 'baja') db.run('UPDATE suscriptores SET estado = ? WHERE id = ?', estado, ya.id);
      if (mailer && (!ya || ya.estado !== 'activo')) notificar({ a: email, asunto: 'Confirme su suscripción a las noticias de Melipeuco', texto: `Para recibir las noticias de la Municipalidad de Melipeuco, confirme su suscripción en:\n${cfg.PUBLIC_URL}boletin/confirmar/${token}/\n\nSi no la solicitó, ignore este correo.` });
      return redirigir(res, `/boletin/gracias/${mailer ? '?pendiente=1' : ''}`, 303);
    }
    const m = ruta.match(/^\/participa\/([\w-]+)\/votar\/?$/);
    if (m) {
      const e = repo.porSlug('encuesta', m[1]);
      if (!e || !repo.visible(e)) throw new ErrorHttp(404, 'Encuesta no encontrada');
      const opcion = Number(body.opcion);
      const hoy = hoyLocal();
      const abierta = (!e.datos.desde || e.datos.desde <= hoy) && (!e.datos.hasta || e.datos.hasta >= hoy);
      if (abierta && validarAntispam(body) && Number.isInteger(opcion) && opcion >= 0 && opcion < (e.datos.opciones || []).length && !leerCookieVoto(req, e.id) && !limitador.exceso(`voto:${e.id}:${ip}`, 30, 3600)) {
        const huella = sha256(`${e.id}|${ip}|${req.headers['user-agent'] || ''}|${tokenAleatorio(8)}`);
        db.run('INSERT OR IGNORE INTO votos(encuesta_id, opcion, huella, creado) VALUES(?,?,?,?)', e.id, opcion, huella, ahora());
        invalidar();
      }
      res.setHeader('Set-Cookie', `mlp_v${e.id}=1; Path=/; Max-Age=31536000; SameSite=Lax${cfg.SEGURA ? '; Secure' : ''}; HttpOnly`);
      return redirigir(res, `/participa/${e.slug}/`, 303);
    }
    throw new ErrorHttp(405, 'Método no permitido');
  }

  return { manejar, invalidar, volcarVisitas, recibirMensaje, formulario, img };
}

// En el HTML heredado, un script puede escribir el texto «</script>» dentro de una cadena (por
// ejemplo, para generar código): el navegador cree que el script termina ahí y falla. Se busca
// el cierre real (el primero con el que el código es válido) y los anteriores se escapan.
// Sólo para scripts clásicos en línea (sin src, sin tipo o de tipo JavaScript).
export function repararScripts(html) {
  const bajo = html.toLowerCase(), apertura = /<script\b([^>]*)>/gi;
  let salida = '', i = 0, m;
  while ((m = apertura.exec(html))) {
    const inicio = m.index + m[0].length;
    const primero = bajo.indexOf('</script', inicio);
    if (primero < 0) break;
    const clasico = !/\bsrc\s*=/i.test(m[1]) && (!/\btype\s*=/i.test(m[1]) || /type\s*=\s*["']?(text|application)\/javascript/i.test(m[1]));
    let elegido = primero;
    if (clasico) {
      for (let fin = primero, n = 0; fin >= 0 && n < 20; fin = bajo.indexOf('</script', fin + 8), n++) {
        try { new vm.Script(html.slice(inicio, fin)); elegido = fin; break; } catch { /* se prueba el siguiente cierre */ }
      }
    }
    salida += html.slice(i, inicio) + html.slice(inicio, elegido).replace(/<\/script/gi, '<\\/script');
    i = elegido; apertura.lastIndex = elegido + 8;
  }
  return salida + html.slice(i);
}
