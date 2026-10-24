// Pruebas automáticas del sitio: seguridad, contenidos, panel e integración con la
// Plataforma de Trámites (simulada). Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sanitizarHtml } from '../server/sanitizar.js';
import { hashClave, verificarClave, problemaClave, codigoTotp, verificarTotp, base32 } from '../server/auth.js';
import { slugify, rutValido, html, crudo } from '../src/util.js';
import { Db } from '../server/db.js';
import { crearRepositorio } from '../server/contenidos.js';
import { fechaDesdeTitulo } from '../server/semilla.js';
import { iniciar } from '../server/server.js';

// ------------------------------------------------------------------ Unidades
test('saneador: elimina scripts, eventos y URLs peligrosas', () => {
  const h = sanitizarHtml('<p onclick="x()">Hola<script>alert(1)</script></p><a href="javascript:alert(1)">a</a><img src=x onerror=alert(1)><iframe src="https://evil.com"></iframe><style>body{}</style>');
  assert.doesNotMatch(h, /script|onclick|onerror|javascript:|evil\.com|<style/i);
  assert.match(h, /<p>Hola<\/p>/);
});

test('saneador: permite videos de YouTube y cierra etiquetas abiertas', () => {
  const h = sanitizarHtml('<div><iframe src="https://www.youtube.com/embed/abc"></iframe><strong>x');
  assert.match(h, /<iframe src="https:\/\/www\.youtube\.com\/embed\/abc"/);
  assert.match(h, /<\/strong><\/div>$/);
  assert.match(sanitizarHtml('<a href="https://gob.cl" target="_blank">x</a>'), /rel="noopener noreferrer"/);
  assert.equal(sanitizarHtml('<a href="&#106;avascript:alert(1)">x</a>'), '<a>x</a>');
  assert.equal(sanitizarHtml('1 < 2 & 3 > 2'), '1 &lt; 2 &amp; 3 &gt; 2');
});

test('plantillas escapan lo interpolado', () => {
  assert.equal(String(html`<b>${'<i>"x"</i>'}</b>`), '<b>&lt;i&gt;&quot;x&quot;&lt;/i&gt;</b>');
  assert.equal(String(html`<b>${crudo('<i>ok</i>')}</b>`), '<b><i>ok</i></b>');
});

test('contraseñas scrypt y política', async () => {
  const h = await hashClave('Una frase bastante larga 2026!');
  assert.ok(await verificarClave('Una frase bastante larga 2026!', h));
  assert.ok(!(await verificarClave('otra', h)));
  assert.ok(problemaClave('corta'));
  assert.ok(problemaClave('melipeuco2026A!'));
  assert.equal(problemaClave('Volcán-Llaima-y-Araucarias-9'), null);
});

test('TOTP según RFC 6238 (vector de prueba) y sin reutilización', () => {
  const secreto = base32(Buffer.from('12345678901234567890'));
  assert.equal(codigoTotp(secreto, Math.floor(59 / 30)), '287082');
  assert.equal(codigoTotp(secreto, Math.floor(1111111109 / 30)), '081804');
  const t = 1111111109 * 1000;
  const paso = verificarTotp(secreto, '081804', 0, t);
  assert.ok(paso > 0);
  assert.equal(verificarTotp(secreto, '081804', paso, t), 0);
});

test('utilidades: slug, RUN y fechas de sesiones', () => {
  assert.equal(slugify('Señalización Vial: ¡Año 2026!'), 'senalizacion-vial-ano-2026');
  assert.ok(rutValido('11.111.111-1'));
  assert.ok(!rutValido('11.111.111-2'));
  assert.equal(fechaDesdeTitulo('Concejo Municipal Viernes 26 de Septiembre 2025 - Municipalidad'), '2025-09-26');
  assert.equal(fechaDesdeTitulo('Concejo Municipal (03 de octubre 2025)'), '2025-10-03');
});

test('repositorio: guardar, URLs, búsqueda, programación y bloques protegidos', () => {
  const db = new Db(':memory:');
  const repo = crearRepositorio(db);
  const n = repo.guardar({ tipo: 'noticia', titulo: 'Nueva sede vecinal en Icalma', cuerpo: '<p>Inauguración <script>x</script></p>', estado: 'publicado', publicado_en: '2026-03-05T15:00:00Z' });
  assert.equal(repo.urlDe(n), '/2026/03/05/nueva-sede-vecinal-en-icalma/');
  assert.doesNotMatch(n.cuerpo, /script/);
  assert.equal(repo.buscar('icalma').total, 1);
  const padre = repo.guardar({ tipo: 'pagina', titulo: 'Municipio', estado: 'publicado' });
  const hija = repo.guardar({ tipo: 'pagina', titulo: 'Historia', estado: 'publicado', padre_id: padre.id });
  assert.equal(repo.urlDe(hija), '/municipio/historia/');
  assert.equal(repo.paginaPorRuta(['municipio', 'historia']).id, hija.id);
  assert.throws(() => repo.guardar({ id: padre.id, tipo: 'pagina', titulo: 'Municipio', padre_id: hija.id }), /dentro de sí misma/);
  // Slugs reservados por el sistema no se asignan a páginas raíz
  assert.equal(repo.guardar({ tipo: 'pagina', titulo: 'Admin', estado: 'publicado' }).slug, 'admin-2');
  // Programado: no se ve hasta su fecha
  const futura = repo.guardar({ tipo: 'noticia', titulo: 'Futura', estado: 'publicado', publicado_en: new Date(Date.now() + 3600e3).toISOString() });
  assert.equal(futura.estado, 'programado');
  assert.ok(!repo.listar({ tipo: 'noticia', publico: true }).items.some((x) => x.id === futura.id));
  // HTML aislado: sin permiso no se puede crear ni alterar
  const p = repo.guardar({ tipo: 'pagina', titulo: 'Con HTML', bloques: [{ id: 'bloque1', tipo: 'html_aislado', html: '<b>original</b>' }] }, { htmlAvanzado: true });
  const p2 = repo.guardar({ ...p, bloques: [{ id: 'bloque1', tipo: 'html_aislado', html: '<script>malo</script>' }, { id: 'bloque2', tipo: 'html_aislado', html: 'nuevo' }] }, { htmlAvanzado: false });
  assert.deepEqual(p2.bloques.map((b) => b.html), ['<b>original</b>']);
  // Campos validados según el esquema
  assert.throws(() => repo.guardar({ tipo: 'evento', titulo: 'Sin fecha', datos: {} }), /Inicio/);
  db.cerrar();
});

// ------------------------------------------------------------------ Servidor completo
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitio-mlp-'));
const CLAVE = 'Clave-De-Prueba-Segura-2026';
const catalogoSimulado = {
  institucion: {}, departments: [{ id: 'dep-transito', name: 'Departamento de Tránsito' }, { id: 'dep-dideco', name: 'DIDECO' }],
  procedures: [{ id: 'tra-hora-licencia', name: 'Hora para licencia de conducir', description: 'Reserve su hora', departmentId: 'dep-transito', requiresAppointment: true, modoHora: 'reserva' }, { id: 'dideco-rsh', name: 'Registro Social de Hogares', description: 'Ingreso y actualización', departmentId: 'dep-dideco' }],
};
const enviadas = [];
const fetchTramites = async (url, op = {}) => {
  const r = (status, datos) => ({ ok: status < 400, status, json: async () => datos });
  if (url.endsWith('/api/public/info')) return r(200, catalogoSimulado);
  if (url.endsWith('/api/public/highlights')) return r(200, { next: [{ procedureId: 'tra-hora-licencia', name: 'Hora para licencia de conducir', date: '2026-11-02', time: '08:30', free: 12 }] });
  if (url.endsWith('/api/health')) return r(200, { ok: true, version: 'prueba' });
  if (url.endsWith('/api/integrations/solicitud')) { enviadas.push({ cabeceras: op.headers, cuerpo: JSON.parse(op.body) }); return r(200, { trackingCode: 'MLP-PRUEBA' }); }
  return r(404, {});
};
let app, base;

test.before(async () => {
  app = await iniciar({ DATA_DIR: dir, archivoDb: path.join(dir, 'sitio.db'), ADMIN_PASSWORD: CLAVE, ADMIN_EMAIL: 'admin@munimelipeuco.cl', PUBLIC_URL: 'http://localhost/', TRAMITES_URL: 'http://tramites.prueba/', TRAMITES_API_KEY: 'llave', sinRespaldos: true, silencioso: true, fetchTramites, MEDIOS_RESPALDO_URL: '' });
  await new Promise((ok) => app.servidor.listen(0, ok));
  base = `http://127.0.0.1:${app.servidor.address().port}`;
});
test.after(() => { app.cerrar(); fs.rmSync(dir, { recursive: true, force: true }); });

const pedir = (ruta, op = {}) => fetch(base + ruta, { redirect: 'manual', ...op });

test('portada y páginas públicas con cabeceras de seguridad', async () => {
  const r = await pedir('/');
  assert.equal(r.status, 200);
  const csp = r.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self' 'nonce-/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  const h = await r.text();
  assert.match(h, /Municipalidad de Melipeuco/);
  assert.match(h, /Próximas horas disponibles/); // desde la Plataforma de Trámites
  for (const ruta of ['/noticias/', '/tramites/', '/eventos/', '/areas/', '/contacto/', '/oirs/', '/transparencia/', '/concejo-municipal/', '/salud/', '/transito/', '/sitemap.xml', '/feed/', '/robots.txt', '/api/public/noticias']) {
    assert.equal((await pedir(ruta)).status, 200, ruta);
  }
});

test('URLs antiguas de WordPress se conservan o redirigen', async () => {
  assert.equal((await pedir('/2026/10/21/bases-programa-mirar-a-tiempo/')).status, 200);
  const r = await pedir('/category/salud/');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), '/categoria/salud/');
  assert.equal((await pedir('/actividades/')).headers.get('location'), '/eventos/');
  assert.equal((await pedir('/no-existe-esta-pagina/')).status, 404);
});

test('catálogo de trámites integra la Plataforma en vivo', async () => {
  const h = await (await pedir('/tramites/')).text();
  assert.match(h, /Registro Social de Hogares/);
  assert.match(h, /tramites\.prueba\/portal\.html#\/tramite\/dideco-rsh/);
  const ficha = await (await pedir('/tramites/licencia-de-conducir-primera-vez/')).text();
  assert.match(ficha, /Reservar hora en línea/);
  assert.match(ficha, /data-disponibilidad="tra-hora-licencia"/);
  const sug = await (await pedir('/api/public/buscar?q=registro')).json();
  assert.ok(sug.items.some((i) => i.externo));
});

test('bloques HTML heredados se sirven aislados (sandbox)', async () => {
  const h = await (await pedir('/licenciadeconducir/')).text();
  const m = /src="(\/embed\/bloque\/\d+\/[\w-]+)"/.exec(h);
  assert.ok(m, 'la página usa un bloque aislado');
  const r = await pedir(m[1]);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /^sandbox allow-scripts/);
});

test('rutas de archivos no permiten salir de su carpeta', async () => {
  for (const r of ['/medios/..%2f..%2fsitio.db', '/css/..%2f..%2fserver%2fserver.js', '/wp-content/uploads/../../.env']) assert.notEqual((await pedir(r)).status, 200, r);
});

test('formulario OIRS: antispam, registro y envío a la Plataforma', async () => {
  const pagina = await (await pedir('/oirs/')).text();
  const tk = /name="tk" value="([^"]+)"/.exec(pagina)[1];
  const datos = { tipo: 'reclamo', nombre: 'Juan Pérez Soto', rut: '11.111.111-1', email: 'juan@example.cl', asunto: 'Bache en camino', mensaje: 'Hay un bache peligroso.', acepto: '1', tk };
  const enviar = (d) => pedir('/oirs/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(d) });
  const rapido = await enviar(datos);
  assert.match(rapido.headers.get('location'), /error=/); // enviado en menos de 2,5 s
  const trampa = await enviar({ ...datos, sitio_web: 'spam' });
  assert.match(trampa.headers.get('location'), /error=/);
  await new Promise((r) => setTimeout(r, 2700));
  const ok = await enviar(datos);
  assert.equal(ok.status, 303);
  const codigo = /codigo=(OIRS-\w+)/.exec(ok.headers.get('location'))[1];
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(enviadas.at(-1).cuerpo.procedureCode, 'SEC-OIRS-01');
  assert.equal(enviadas.at(-1).cabeceras['X-Api-Key'], 'llave');
  assert.equal(app.db.get('SELECT externo FROM mensajes WHERE codigo = ?', codigo).externo, 'MLP-PRUEBA');
  const seg = await pedir(`/oirs/seguimiento/?codigo=${codigo}&email=juan@example.cl`);
  assert.equal(seg.status, 200);
  assert.equal((await pedir(`/oirs/seguimiento/?codigo=${codigo}&email=otro@example.cl`)).status, 404);
});

// ------------------------------------------------------------------ Panel
async function ingresar(email = 'admin@munimelipeuco.cl', clave = CLAVE) {
  const r = await pedir('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, clave }) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  const s = r.ok ? await (await pedir('/api/admin/sesion', { headers: { cookie } })).json() : null;
  return { r, cookie, csrf: s?.csrf, s };
}
const api = (sesion, metodo, ruta, cuerpo, extra = {}) => pedir('/api/admin/' + ruta, { method: metodo, headers: { cookie: sesion.cookie, 'X-CSRF': sesion.csrf, ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extra }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });

test('panel: ingreso, cookie segura y protección CSRF', async () => {
  const malo = await ingresar('admin@munimelipeuco.cl', 'incorrecta');
  assert.equal(malo.r.status, 401);
  const s = await ingresar();
  assert.equal(s.r.status, 200);
  assert.match(s.r.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal(s.s.usuario.rol, 'superadmin');
  const sinCsrf = await pedir('/api/admin/contenidos', { method: 'POST', headers: { cookie: s.cookie, 'Content-Type': 'application/json' }, body: '{"tipo":"noticia","titulo":"x"}' });
  assert.equal(sinCsrf.status, 403);
  assert.equal((await pedir('/api/admin/escritorio')).status, 401);
});

test('panel: publicar noticia con título malicioso (se escapa)', async () => {
  const s = await ingresar();
  const r = await api(s, 'POST', 'contenidos', { tipo: 'noticia', titulo: 'Operativo <img src=x onerror=alert(1)>', cuerpo: '<p>Texto</p>', estado: 'publicado' });
  assert.equal(r.status, 200);
  const c = await r.json();
  const h = await (await pedir(c.url)).text();
  assert.match(h, /Operativo &lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(h, /<img src=x onerror/);
});

test('panel: roles limitan la publicación y las áreas', async () => {
  const s = await ingresar();
  const area = app.db.get("SELECT id FROM contenidos WHERE tipo = 'area' AND slug = 'transito'").id;
  const nuevo = await (await api(s, 'POST', 'usuarios', { email: 'periodista@munimelipeuco.cl', nombre: 'Periodista', rol: 'area', areas: [area] })).json();
  // Primer ingreso exige cambiar la contraseña temporal
  let p = await ingresar('periodista@munimelipeuco.cl', nuevo.temporal);
  assert.equal((await api(p, 'GET', 'escritorio')).status, 428);
  assert.equal((await api(p, 'POST', 'clave', { actual: nuevo.temporal, nueva: 'Otra-Clave-Muy-Segura-77' })).status, 200);
  p = await ingresar('periodista@munimelipeuco.cl', 'Otra-Clave-Muy-Segura-77');
  const fuera = await api(p, 'POST', 'contenidos', { tipo: 'noticia', titulo: 'Fuera de mi área', estado: 'publicado' });
  assert.equal(fuera.status, 403);
  const dentro = await api(p, 'POST', 'contenidos', { tipo: 'noticia', titulo: 'Cambio de sentido en calle Los Aromos', estado: 'publicado', area_id: area });
  assert.equal(dentro.status, 200);
  assert.equal((await api(p, 'GET', 'usuarios')).status, 403);
  const aj = await api(p, 'PUT', 'ajustes', { nombre: 'X' });
  assert.equal(aj.status, 403);
});

test('panel: bloqueo de cuenta tras intentos fallidos', async () => {
  for (let i = 0; i < 5; i++) await ingresar('periodista@munimelipeuco.cl', 'mal-' + i);
  const r = await ingresar('periodista@munimelipeuco.cl', 'Otra-Clave-Muy-Segura-77');
  assert.equal(r.r.status, 423);
});

test('panel: subida de archivos valida el contenido real', async () => {
  const s = await ingresar();
  const exe = await api(s, 'POST', 'medios', undefined, { 'X-Nombre': 'foto.png', 'Content-Type': 'application/octet-stream' });
  assert.ok(exe.status >= 400);
  const falso = await pedir('/api/admin/medios', { method: 'POST', headers: { cookie: s.cookie, 'X-CSRF': s.csrf, 'X-Nombre': 'virus.pdf' }, body: Buffer.from('MZ\x90\x00 programa') });
  assert.equal(falso.status, 415);
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');
  const ok = await pedir('/api/admin/medios', { method: 'POST', headers: { cookie: s.cookie, 'X-CSRF': s.csrf, 'X-Nombre': 'punto.png' }, body: png });
  assert.equal(ok.status, 200);
  const m = await ok.json();
  assert.equal((await pedir(m.url)).status, 200);
  const svg = await pedir('/api/admin/medios', { method: 'POST', headers: { cookie: s.cookie, 'X-CSRF': s.csrf, 'X-Nombre': 'x.svg' }, body: '<svg onload="alert(1)"></svg>' });
  assert.equal(svg.status, 415);
});

test('panel: auditoría registra las acciones', async () => {
  const s = await ingresar();
  const a = await (await api(s, 'GET', 'auditoria?q=contenido.crear')).json();
  assert.ok(a.total >= 1);
});
