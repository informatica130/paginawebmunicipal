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
import { normalizar as normalizarDiseno, migrar as migrarDiseno, aplicarEstilo, variablesCss } from '../public/js/diseno.js';

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

test('diseño: los guardados antes de «Portal colorido» pasan una vez al nuevo y conservan sus textos', () => {
  const viejo = { estilo: 'trekking', portada: { composicion: 'vitrina', titulo: 'Hola' }, cabecera: { nombre: 'Melipeuco' } };
  const m = normalizarDiseno(migrarDiseno(viejo));
  assert.equal(m.portada.composicion, 'portal');
  assert.equal(m.portada.titulo, 'Hola');
  assert.equal(m.cabecera.nombre, 'Melipeuco');
  // Lo guardado después (con revisión) se respeta tal cual.
  assert.equal(migrarDiseno(normalizarDiseno(viejo)).portada.composicion, 'vitrina');
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

test('diseño: sólo acepta colores, opciones, números e imágenes válidos', () => {
  const d = normalizarDiseno({ colores: { primario: 'red;}</style><script>', acento: '#123abc' }, forma: { radio: 999, tarjetas: 'otra' }, tipografia: { cuerpo: 'comic' }, portada: { imagen: 'javascript:alert(1)', titulo: '<b>Hola</b>' }, cabecera: { logoUrl: '//malo.cl/x.png' }, avanzado: { css: 'a{}</style><script>' } }, { permitirCss: false, previo: { avanzado: { css: '.x{}' } } });
  assert.equal(d.colores.primario, '#1F6FA8');
  assert.equal(d.colores.acento, '#123ABC');
  assert.equal(d.forma.radio, 24);
  assert.equal(d.forma.tarjetas, 'sombra');
  assert.equal(d.tipografia.cuerpo, 'public-sans');
  assert.equal(d.portada.imagen, '');
  assert.equal(d.portada.titulo, 'bHola/b');
  assert.equal(d.cabecera.logoUrl, '');
  assert.equal(d.avanzado.css, '.x{}');
  assert.doesNotMatch(variablesCss(aplicarEstilo(d, 'moderno')), /[<>]/);
  assert.equal(aplicarEstilo(d, 'moderno').cabecera.estilo, 'color');
  assert.equal(aplicarEstilo(d, 'institucional').portada.composicion, 'dividida');
  assert.equal(aplicarEstilo(d, 'institucional').colores.primario, '#0B4F7C');
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

test('portada «Melipeuco Capital del Trekking»: logo y zonas por página', async () => {
  const h = await (await pedir('/')).text();
  assert.match(h, /class="hero hero-portal"/);
  assert.match(h, /class="contenedor pt-mosaico"/);
  assert.match(h, /Quiero información de/);
  assert.match(h, /class="escudo-vivo marca-viva"/);
  assert.match(h, /data-sombras="suaves"/);
  const salud = await (await pedir('/salud/')).text();
  assert.match(salud, /style="--z:#16A0A8;/);
  assert.match(salud, /emblema-2\.svg/);
  for (const f of ['/img/trekking/emblema-0.svg', '/img/trekking/portada-1-1920.webp', '/fuentes/bricolage-latin.woff2']) assert.equal((await pedir(f)).status, 200, f);
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

// Sesión compartida por las pruebas del diseño y la portada (el ingreso tiene un límite de intentos por IP).
let sesionAdmin;
const admin = async () => (sesionAdmin ??= await ingresar());

test('extensiones: ventana emergente, bloques en zonas, HTML aislado, código propio y transparencia', async () => {
  const s = await admin();
  const r = await api(s, 'PUT', 'extensiones', {
    emergentes: [{ id: 'aviso-prueba', titulo: 'Vacunación invernal', texto: '<p>Hola<script>alert(1)</script></p>', estilo: 'modal', disparo: 'tiempo', segundos: 2, paginas: 'portada', boton: { texto: 'Ver más', url: '/tramites/' } }],
    zonas: [
      { id: 'franja-arriba', zona: 'antes-cabecera', tipo: 'html', html: '<p onclick="x()">Franja de prueba</p>', paginas: 'todas' },
      { id: 'tras-noticias', zona: 'portada:noticias', tipo: 'aviso', nivel: 'alerta', titulo: 'Corte de agua', html: '<p>Mañana</p>', paginas: 'todas' },
      { id: 'widget', zona: 'final-contenido', tipo: 'aislado', html: '<script>document.write("ok")</script>', paginas: 'rutas', rutas: '/contacto/' },
      { id: 'vencido', zona: 'antes-pie', tipo: 'html', html: '<p>No debe verse</p>', hasta: '2020-01-01' },
    ],
    fuentes: [{ id: 'interna', nombre: 'Interna', url: 'https://localhost/x' }, { id: 'ip', nombre: 'IP', url: 'https://10.0.0.1/x' }],
    codigo: { cabeza: '<script>window.prueba=1</script>', dominios: 'https://www.googletagmanager.com\njavascript:alert(1)' },
  });
  assert.equal(r.status, 200);
  const guardado = await r.json();
  assert.equal(guardado.fuentes.length, 0, 'no se aceptan direcciones internas');
  assert.doesNotMatch(guardado.emergentes[0].texto, /script/);
  const portada = await pedir('/');
  const html = await portada.text();
  assert.match(html, /data-emergente="aviso-prueba"/);
  assert.match(html, /Vacunación invernal/);
  assert.match(html, /Franja de prueba/);
  assert.doesNotMatch(html, /onclick/);
  assert.match(html, /Corte de agua/);
  assert.doesNotMatch(html, /No debe verse/);
  assert.match(html, /<script nonce="[^"]+">window\.prueba=1/);
  assert.match(portada.headers.get('content-security-policy'), /https:\/\/www\.googletagmanager\.com/);
  const contacto = await (await pedir('/contacto/')).text();
  assert.match(contacto, /src="\/embed\/zona\/widget"/);
  assert.doesNotMatch(contacto, /data-emergente="aviso-prueba"/);
  const marco = await pedir('/embed/zona/widget');
  assert.equal(marco.status, 200);
  assert.match(marco.headers.get('content-security-policy'), /sandbox/);
  // Centro de Transparencia y buscador
  const t = await (await pedir('/transparencia/')).text();
  assert.match(t, /Personal y remuneraciones/);
  assert.match(t, /org=MU172/);
  const sug = await (await pedir('/api/public/buscar?q=sueldos')).json();
  assert.ok(sug.items.some((i) => i.titulo === 'Personal y remuneraciones'));
  await api(s, 'PUT', 'extensiones', { emergentes: [], zonas: [], fuentes: [], codigo: { cabeza: '', cuerpo: '', dominios: '' } });
});


test('micrositios: Medio Ambiente predeterminado, edición desde el panel y borradores', async () => {
  const r = await pedir('/medioambiente/');
  assert.equal(r.status, 200);
  const h = await r.text();
  assert.match(h, /Melipeuco, comuna sustentable/);
  assert.match(h, /Horario de recolección de residuos/);
  assert.match(h, /Comité Ambiental Comunal/);
  assert.match(h, /data-ms-pestanas/);
  assert.match(await (await pedir('/sitemap.xml')).text(), /\/medioambiente\//);
  // Un micrositio por área, generado con la información del sitio (organigrama, contactos, noticias).
  for (const [ruta, texto] of [['/salud/', /Salud cerca de cada familia/], ['/social/', /Acompañamos a cada familia/], ['/transito/', /Licencias de conducir/], ['/juzgado/', /Qué materias conoce/], ['/educacion/', /Educación pública/], ['/udel/', /Emprender y producir/], ['/deporte/', /Melipeuco en movimiento/], ['/turismo/', /Capital del Trekking/], ['/cultura/', /Cultura viva/], ['/obras/', /Construimos la comuna/]]) {
    const x = await pedir(ruta);
    assert.equal(x.status, 200, ruta);
    assert.match(await x.text(), texto, ruta);
  }
  assert.match(await (await pedir('/transito/')).text(), /class="fila-tramite"/); // trámites del área desde las fichas del sitio
  // Gobierno comunal, programas y una por cada unidad del organigrama.
  const alcaldia = await (await pedir('/alcaldia/')).text();
  assert.match(alcaldia, /¿Cómo solicitar una audiencia\?/);
  assert.match(alcaldia, /class="autoridades"/);
  assert.equal((await pedir('/alcaldia-y-concejo-municipal/')).headers.get('location'), '/alcaldia/');
  assert.match(await (await pedir('/concejo-municipal/')).text(), /Integrantes del Concejo/);
  for (const ruta of ['/boxveterinario/', '/comite-de-bienestar/', '/oficina-de-la-ninez/', '/omil/', '/pdti/', '/programa-vinculos/', '/tesoreria-municipal/', '/oficina-de-partes/', '/emergencias/', '/uamis/', '/secplan/', '/cosoc/']) assert.equal((await pedir(ruta)).status, 200, ruta);
  assert.match(await (await pedir('/tesoreria-municipal/')).text(), /depende de la Dirección de Administración y Finanzas/);
  assert.match(await (await pedir('/areas/salud/')).text(), /Visite el sitio de Salud/);
  const s = await admin();
  const rg = await api(s, 'GET', 'micrositios');
  const actual = await rg.json();
  assert.equal(rg.status, 200, JSON.stringify(actual));
  assert.ok(actual.plantillas.length >= 1);
  const nuevo = { ...actual.sitios[0], id: 'deportes', nombre: 'Deportes', slug: 'Deportes Melipeuco!', publicado: false, modulos: [{ tipo: 'texto', titulo: 'Hola <b>', html: '<p>Texto<script>alert(1)</script></p>' }, { tipo: 'inventado' }] };
  const g = await (await api(s, 'PUT', 'micrositios', { sitios: [actual.sitios[0], nuevo, { nombre: 'x', slug: 'admin' }] })).json();
  assert.equal(g.sitios[1].slug, 'deportes-melipeuco');
  assert.equal(g.sitios[1].modulos.length, 1);
  assert.doesNotMatch(g.sitios[1].modulos[0].html, /script/);
  assert.notEqual(g.sitios[2].slug, 'admin');
  assert.equal((await pedir('/deportes-melipeuco/')).status, 404); // borrador: sólo con sesión
  assert.equal((await pedir('/deportes-melipeuco/', { headers: { cookie: s.cookie } })).status, 200);
  // Una plantilla predeterminada eliminada no vuelve a aparecer; las demás siguen.
  const sinJuzgado = actual.sitios.filter((x) => x.id !== 'juzgado');
  const e = await (await api(s, 'PUT', 'micrositios', { sitios: sinJuzgado, eliminados: ['juzgado'] })).json();
  assert.ok(!e.sitios.some((x) => x.id === 'juzgado'));
  assert.equal((await (await api(s, 'GET', 'micrositios')).json()).sitios.length, sinJuzgado.length);
  await api(s, 'PUT', 'micrositios', { sitios: actual.sitios, eliminados: [] });
});

test('facebook: las publicaciones se importan una sola vez como noticias con fotos y categoría', async () => {
  const s = await admin();
  const antes = await (await api(s, 'GET', 'importar-facebook')).json();
  assert.ok(antes.disponibles > 100);
  const r = await (await api(s, 'POST', 'importar-facebook')).json();
  assert.equal(r.creados + r.omitidos, antes.disponibles);
  const otra = await (await api(s, 'POST', 'importar-facebook')).json();
  assert.equal(otra.creados, 0);
  assert.equal((await (await api(s, 'GET', 'importar-facebook')).json()).importadas, antes.disponibles);
  const pag = await pedir('/2019/12/12/se-entrega-la-remodelada-plaza-de-armas-de-melipeuco/');
  assert.equal(pag.status, 200);
  const h = await pag.text();
  assert.match(h, /\/img\/facebook\/\d+\.webp/);
  assert.match(h, /Fuente: Publicación de la página de Facebook/);
  const foto = h.match(/\/img\/facebook\/\d+\.webp/)[0];
  assert.equal((await pedir(foto)).headers.get('content-type'), 'image/webp');
  assert.match(await (await pedir('/buscar/?q=remodelada+Plaza+de+Armas')).text(), /Se entrega la remodelada Plaza de Armas/);
});

test('facebook: álbumes como fototeca, noticias y eventos pasados de la agenda', async () => {
  const s = await admin();
  await api(s, 'POST', 'importar-facebook');
  const estado = await (await api(s, 'GET', 'importar-facebook')).json();
  assert.ok(estado.eventos > 50);
  assert.equal(estado.importadas, estado.disponibles);
  const f = await (await pedir('/fotos/')).text();
  assert.match(f, /Fotos de Melipeuco/);
  assert.match(f, /class="ft-tarjeta"/);
  assert.match(await (await pedir('/fotos/?categoria=baqueano')).text(), /Fiesta del Baqueano/);
  const anio = await (await pedir('/fotos/?anio=2014')).text();
  assert.doesNotMatch(anio, /No encontramos álbumes/);
  const { indice } = await import('../server/render/fotos.js');
  const a = indice().albumes.find((x) => x.fotos.length > 1);
  const ficha = await pedir(`/fotos/${a.slug}/`);
  assert.equal(ficha.status, 200);
  const h = await ficha.text();
  assert.match(h, /"@type":"ImageGallery"/);
  assert.match(h, /data-lightbox/);
  assert.equal((await pedir(a.fotos[1])).headers.get('content-type'), 'image/webp');
  assert.equal((await pedir('/fotos/no-existe-este-album/')).status, 404);
  // Nada interno del respaldo: ni nombres de archivo, ni enlaces a Facebook, ni datos de Drive.
  const datos = JSON.stringify(indice().albumes) + (await import('node:fs')).readFileSync(new URL('../contenido/facebook/noticias.json', import.meta.url), 'utf8');
  assert.doesNotMatch(datos, /facebook\.com|drive\.google|this_profile|your_activity|https?:\/\//);
  // Eventos pasados en la agenda, con enlace a sus fotos.
  const ev = await (await pedir('/eventos/?pasados=1')).text();
  assert.match(ev, /Fiesta del Baqueano/);
  const enlace = ev.match(/href="(\/eventos\/[^"]*baqueano[^"]*)"/)[1];
  assert.match(await (await pedir(enlace)).text(), /href="\/fotos\/[^"]+\/">Ver las fotos de la actividad/);
  // Los micrositios muestran las fotos de su área.
  const cultura = await (await pedir('/cultura/')).text();
  assert.match(cultura, /Actividades en fotos/);
  assert.match(await (await pedir('/buscar/?q=baqueano')).text(), /class="ft-tarjeta"/);
});

test('CESFAM: publicaciones como noticias por programa, agenda y micrositio de Salud', async () => {
  const s = await admin();
  await api(s, 'POST', 'importar-facebook');
  const salud = await (await pedir('/salud/')).text();
  assert.match(salud, /Programas y actividades del CESFAM/);
  assert.match(salud, /href="\/etiqueta\/salud-mental\/"/);
  assert.match(salud, /class="ms-calendario-salud"/);
  const etiqueta = await pedir('/etiqueta/salud-mental/');
  assert.equal(etiqueta.status, 200);
  const h = await etiqueta.text();
  const enlace = h.match(/href="(\/\d{4}\/\d{2}\/\d{2}\/[^"]+\/)"/)[1];
  assert.match(await (await pedir(enlace)).text(), /Fuente: Publicación de la página de Facebook del CESFAM Melipeuco/);
  // Avisos de un día y objetos perdidos no se publican.
  const { paqueteFacebook } = await import('../server/facebook.js');
  const textos = paqueteFacebook().noticias.filter((n) => n.clave.startsWith('cesfam-')).map((n) => n.cuerpo).join(' ');
  assert.ok(textos.length > 10000);
  assert.doesNotMatch(textos, /se encontraron estos lentes|Samsung Galax|Volcamiento|10-4/);
  // Las noticias del CESFAM salen en Noticias con sus fotos.
  const conFoto = paqueteFacebook().noticias.find((n) => n.clave.startsWith('cesfam-') && n.galeria.length);
  assert.match(conFoto.imagen, /^\/img\/facebook\/cesfam\/[0-9a-f]{16}\.webp$/);
  assert.equal((await pedir(conFoto.imagen)).headers.get('content-type'), 'image/webp');
  const lista = await (await pedir('/noticias/?q=' + encodeURIComponent(conFoto.titulo))).text();
  assert.match(lista, new RegExp(conFoto.titulo.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  // Lo importado antes sin fotos las recibe al volver a importar.
  const { importarFacebook } = await import('../server/facebook.js');
  const sinFoto = { noticias: [{ ...conFoto, clave: 'prueba-foto', imagen: '', galeria: [] }], eventos: [] };
  assert.equal(importarFacebook(app.db, app.repo, { paquete: sinFoto }).creados, 1);
  assert.equal(importarFacebook(app.db, app.repo, { paquete: { noticias: [{ ...conFoto, clave: 'prueba-foto' }], eventos: [] } }).fotos, 1);
  const fila = app.db.get("SELECT imagen, datos FROM contenidos WHERE url_antigua = 'facebook:prueba-foto'");
  assert.equal(fila.imagen, conFoto.imagen);
  assert.equal(JSON.parse(fila.datos).galeria.length, conFoto.galeria.length);
});

test('archivo de Transparencia: lectura de la vista pública de Drive y nombres', async () => {
  const { leerCarpeta, clasificar, nombreVisible, idPublico } = await import('../herramientas/transparencia-drive.js');
  const html = '<div class="flip-entries"><div class="flip-entry" id="entry-ABC123" tabindex="0" role="link"><div class="flip-entry-info"><a href="https://drive.google.com/drive/folders/ABC123?resourcekey=0-xyz" target="_blank"><div class="flip-entry-title">05.- ADQUISICIONES</div></a></div><div class="flip-entry-last-modified"><div>8/19/16</div></div></div>'
    + '<div class="flip-entry" id="entry-F1" tabindex="0" role="link"><div class="flip-entry-info"><a href="https://drive.google.com/file/d/F1/view?usp=drive_web&amp;resourcekey=0-k" target="_blank"><div class="flip-entry-list-icon"><img src="https://drive-thirdparty.googleusercontent.com/16/type/application/pdf" alt=""/></div><div class="flip-entry-title">Decreto 123 &amp; anexo.pdf</div></a></div><div class="flip-entry-last-modified"><div>5/9/18</div></div></div></div>';
  const it = leerCarpeta(html);
  assert.equal(it.length, 2);
  assert.deepEqual([it[0].tipo, it[0].clave, it[0].fecha], ['carpeta', '0-xyz', '2016-08-19']);
  assert.deepEqual([it[1].tipo, it[1].nombre, it[1].clave], ['PDF', 'Decreto 123 & anexo.pdf', '0-k']);
  // Clasificación propia del sitio (las carpetas sólo sirven para clasificar y no se guardan).
  const c = clasificar({ nombre: 'BALANCE COMPROBACION SALUD SEPTIEMBRE 2026.pdf', fecha: '2026-10-19' }, ['11.- PRESUPUESTO ASIGNADO Y SU EJECUCION', 'Balance de comprobación']);
  assert.deepEqual(c, { m: 'presupuesto', a: 2026, me: 9, ar: 'Salud', c: 'Balance' });
  assert.equal(nombreVisible('Plantilla_Otras_Compras (2).pdf'), 'Plantilla Otras Compras');
  assert.notEqual(idPublico('F1'), 'F1');
  assert.equal(idPublico('F1').length, 12);
});

test('videoteca: listado, filtros, ficha, búsqueda y sesión del Concejo', async () => {
  const v = await (await pedir('/videos/')).text();
  assert.match(v, /Videos de Melipeuco/);
  assert.match(v, /class="vd-tarjeta/);
  const f = await (await pedir('/videos/?categoria=concejo-municipal&orden=vistos')).text();
  assert.match(f, /videos\./);
  assert.doesNotMatch(f, /No encontramos videos/);
  const ficha = await pedir('/videos/87CPic3eetM/');
  assert.equal(ficha.status, 200);
  const h = await ficha.text();
  assert.match(h, /"@type":"VideoObject"/);
  assert.match(h, /data-youtube="87CPic3eetM"/);
  assert.equal((await pedir('/videos/zzzzzzzzzzz/')).status, 404);
  const sug = await (await pedir('/api/public/buscar?q=baqueano')).json();
  assert.ok(sug.items.some((i) => i.tipo === 'Video'));
  const { categorizar } = await import('../server/render/videos.js');
  assert.equal(categorizar('CONCEJO MUNICIPAL 16 DE OCTUBRE 2026'), 'concejo-municipal');
  assert.equal(categorizar('Desfile Fiesta del Baqueano 2027'), 'fiesta-del-baqueano');
});

test('extensiones: plantillas de fuentes de datos', async () => {
  const { plantilla, urlFuenteValida } = await import('../server/extensiones.js');
  assert.equal(plantilla('{{#items}}<li>{{@indice}} {{n}}</li>{{/items}}{{^vacio}}-{{/vacio}}', { items: [{ n: '<b>' }, { n: 'x' }] }), '<li>1 &lt;b&gt;</li><li>2 x</li>-');
  assert.equal(urlFuenteValida('http://api.ejemplo.cl'), '');
  assert.equal(urlFuenteValida('https://intranet.local/x'), '');
  assert.ok(urlFuenteValida('https://api.open-meteo.com/v1/forecast'));
});

test('panel: el diseño guardado cambia el sitio publicado', async () => {
  const s = await admin();
  const r = await api(s, 'PUT', 'ajustes', { diseno: { estilo: 'personalizado', colores: { primario: '#7A1F2B' }, cabecera: { estilo: 'oscura' }, portada: { titulo: 'Bienvenidos' }, animaciones: { activas: false } } });
  assert.equal(r.status, 200);
  const html = await (await pedir('/')).text();
  assert.match(html, /--azul:#7A1F2B/);
  assert.match(html, /data-cabecera="oscura"/);
  assert.match(html, /data-anim="no"/);
  assert.match(html, />Bienvenidos</);
  await api(s, 'PUT', 'ajustes', { diseno: {} });
});

test('panel: elegir qué trámites muestra la portada', async () => {
  const s = await admin();
  const lista = await (await api(s, 'GET', 'contenidos?tipo=tramite&estado=publicado&limite=300')).json();
  const presencial = lista.items.find((t) => /Ley del Lobby/.test(t.titulo)) || lista.items.at(-1);
  const ajustes = await (await api(s, 'GET', 'ajustes')).json();
  const secciones = (ajustes.portada?.secciones || []).map((x) => (x.id === 'tramites' ? { ...x, ids: [presencial.id, 'x', -3] } : x));
  assert.equal((await api(s, 'PUT', 'ajustes', { portada: { secciones } })).status, 200);
  const guardado = await (await api(s, 'GET', 'ajustes')).json();
  assert.deepEqual(guardado.portada.secciones.find((x) => x.id === 'tramites').ids, [presencial.id]);
  const h = await (await pedir('/')).text();
  const bloque = h.slice(h.indexOf('class="tramites-portada"'), h.indexOf('class="panel-tramites"'));
  assert.equal((bloque.match(/class="fila-tramite"/g) || []).length, 1);
  assert.ok(bloque.includes(presencial.titulo.split(' ')[0]));
  await api(s, 'PUT', 'ajustes', { portada: { secciones: ajustes.portada.secciones } });
});

test('diseño y contenidos de la identidad se personalizan desde el panel', async () => {
  const s = await admin();
  const previo = await (await api(s, 'GET', 'ajustes')).json();
  assert.equal(previo.trekkingActual.mundos.length, 9);
  const r = await api(s, 'PUT', 'ajustes', {
    diseno: { portada: { logoAnimacion: 'caida', tamanoLogo: 80, intervalo: 99 }, identidad: { zonas: false, cinta: 30 } },
    portada: { secciones: previo.portada.secciones.map((x) => (x.id === 'cinta' ? { ...x, activo: true } : x)) },
    trekking: { cinta: ['Volcanes <b>', 'Nieve'], mundos: [{ nombre: 'Viajar', texto: 'Turismo', url: 'javascript:alert(1)' }], cifras: [{ numero: '12', sufijo: ' km', texto: 'de ciclovías' }] },
  });
  assert.equal(r.status, 200);
  const h = await (await pedir('/')).text();
  assert.match(h, /data-logo-anim="caida"/);
  assert.match(h, /data-id-zonas="no"/);
  assert.match(h, /data-intervalo="20"/);
  assert.match(h, /--tk-logo-escala:0\.8/);
  assert.match(h, /<span>Volcanes &lt;b&gt;<\/span>/);
  assert.match(h, /data-contar="12" data-sufijo=" km"/);
  assert.doesNotMatch(h, /javascript:alert/);
  await api(s, 'PUT', 'ajustes', { diseno: {}, portada: { secciones: previo.portada.secciones }, trekking: { cinta: [], mundos: [], lugares: [], cifras: [] } });
});

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

test('panel: en varias instancias sin base común (Vercel) la sesión no se pierde', async () => {
  const opciones = (n) => ({ DATA_DIR: path.join(dir, 'instancia-' + n), archivoDb: path.join(dir, `instancia-${n}.db`), ADMIN_PASSWORD: CLAVE, ADMIN_EMAIL: 'admin@munimelipeuco.cl', PUBLIC_URL: 'http://localhost/', SECRETO: 'secreto-compartido-de-prueba', SESIONES_FIRMADAS: true, sinRespaldos: true, silencioso: true, fetchTramites, MEDIOS_RESPALDO_URL: '' });
  const [a, b] = [await iniciar(opciones('a')), await iniciar(opciones('b'))];
  try {
    await Promise.all([a, b].map((x) => new Promise((ok) => x.servidor.listen(0, ok))));
    const url = (x) => `http://127.0.0.1:${x.servidor.address().port}/api/admin/`;
    const r = await fetch(url(a) + 'login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@munimelipeuco.cl', clave: CLAVE }) });
    assert.equal(r.status, 200);
    const cookie = r.headers.get('set-cookie').split(';')[0];
    const enB = await fetch(url(b) + 'sesion', { headers: { cookie } });
    assert.equal(enB.status, 200);
    const { csrf } = await enB.json();
    // El token CSRF es el mismo en ambas instancias: se puede guardar desde la otra.
    const guardar = await fetch(url(b) + 'ajustes', { method: 'PUT', headers: { cookie, 'X-CSRF': csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ lema: 'Para todas y todos' }) });
    assert.equal(guardar.status, 200);
    // Una firma alterada no sirve.
    const [n, cuerpo] = cookie.split('=')[1].split('.');
    assert.equal((await fetch(url(b) + 'sesion', { headers: { cookie: `mlp_admin=${n}.${cuerpo}.firmaFalsa` } })).status, 401);
  } finally { a.cerrar(); b.cerrar(); }
});

test('Vercel: con memoria compartida (Redis) los cambios del panel llegan a todas las instancias y sobreviven al reinicio', async () => {
  // Redis falso en memoria con la API REST de Upstash.
  const listas = new Map(), hashes = new Map(), claves = new Map();
  const fetchRedis = async (_url, op) => {
    const [cmd, k, ...a] = JSON.parse(op.body);
    let result = null;
    if (cmd === 'LLEN') result = (listas.get(k) || []).length;
    else if (cmd === 'RPUSH') { const l = listas.get(k) || []; l.push(...a); listas.set(k, l); result = l.length; }
    else if (cmd === 'LRANGE') result = (listas.get(k) || []).slice(Number(a[0]), Number(a[1]) + 1);
    else if (cmd === 'HSET') { const h = hashes.get(k) || new Map(); for (let i = 0; i < a.length; i += 2) h.set(a[i], a[i + 1]); hashes.set(k, h); result = a.length / 2; }
    else if (cmd === 'HGETALL') result = [...(hashes.get(k) || new Map())].flat();
    else if (cmd === 'SET') { claves.set(k, a[0]); result = 'OK'; }
    else if (cmd === 'GET') result = claves.get(k) ?? null;
    return new Response(JSON.stringify({ result }), { status: 200 });
  };
  const opciones = (n) => ({ DATA_DIR: path.join(dir, 'redis-' + n), archivoDb: path.join(dir, `redis-${n}.db`), ADMIN_PASSWORD: CLAVE, ADMIN_EMAIL: 'admin@munimelipeuco.cl', PUBLIC_URL: 'http://localhost/', SECRETO: 'secreto-compartido', SESIONES_FIRMADAS: true, sinRespaldos: true, silencioso: true, fetchTramites, MEDIOS_RESPALDO_URL: '', redis: { url: 'https://redis.prueba', token: 't' }, fetchRedis });
  const apps = [await iniciar(opciones('a')), await iniciar(opciones('b'))];
  try {
    await Promise.all(apps.map((x) => new Promise((ok) => x.servidor.listen(0, ok))));
    const url = (x) => `http://127.0.0.1:${x.servidor.address().port}`;
    const r = await fetch(url(apps[0]) + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@munimelipeuco.cl', clave: CLAVE }) });
    const cookie = r.headers.get('set-cookie').split(';')[0];
    const { csrf } = await (await fetch(url(apps[0]) + '/api/admin/sesion', { headers: { cookie } })).json();
    const put = (cuerpo) => fetch(url(apps[0]) + '/api/admin/ajustes', { method: 'PUT', headers: { cookie, 'X-CSRF': csrf, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    assert.equal((await put({ diseno: { colores: { primario: '#7A1F2B' }, portada: { titulo: 'Hola desde Redis' } } })).status, 200);
    const noticia = await fetch(url(apps[0]) + '/api/admin/contenidos', { method: 'POST', headers: { cookie, 'X-CSRF': csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'noticia', titulo: 'Noticia compartida entre instancias', cuerpo: '<p>Texto</p>', estado: 'publicado' }) });
    assert.equal(noticia.status, 200);
    // La otra instancia ve el diseño y la noticia nueva.
    await new Promise((ok) => setTimeout(ok, 2600));
    const enB = await (await fetch(url(apps[1]) + '/')).text();
    assert.match(enB, /--azul:#7A1F2B/);
    assert.match(enB, />Hola desde Redis</);
    assert.match(await (await fetch(url(apps[1]) + '/noticias/')).text(), /Noticia compartida entre instancias/);
    // Una instancia nueva (reinicio) arranca con todo aplicado.
    apps.push(await iniciar(opciones('c')));
    await new Promise((ok) => apps[2].servidor.listen(0, ok));
    const enC = await (await fetch(url(apps[2]) + '/')).text();
    assert.match(enC, /--azul:#7A1F2B/);
    assert.match(await (await fetch(url(apps[2]) + '/noticias/')).text(), /Noticia compartida entre instancias/);
    const salud = await (await fetch(url(apps[2]) + '/api/salud')).json();
    assert.equal(salud.memoriaCompartida.activa, true);
  } finally { apps.forEach((x) => x.cerrar()); }
});

test('transparencia activa: copia del Portal con fecha y sin enlaces a Drive', async () => {
  const raiz = await pedir('/transparencia/activa/');
  assert.equal(raiz.status, 200);
  const h = await raiz.text();
  assert.match(h, /Información actualizada al 27 de octubre de 2026/);
  assert.match(h, /Personal y remuneraciones/);
  assert.match(await (await pedir('/transparencia/')).text(), /Información actualizada al/);
  for (const ruta of ['/transparencia/activa/personal-y-remuneraciones/', '/transparencia/activa/actos-y-documentos-del-organismo-que-hayan-sido-ob-3/', '/transparencia/activa/actos-y-documentos-del-organismo-que-hayan-sido-ob-3/?q=decreto&p=2']) {
    const r = await pedir(ruta);
    assert.equal(r.status, 200, ruta);
    assert.doesNotMatch(await r.text(), /drive\.google|docs\.google|googleusercontent/, ruta);
  }
  assert.equal((await pedir('/transparencia/activa/no-existe/')).status, 404);
});

test('diseño: fondos, patrones y estilo propio de cada sección de la portada', () => {
  const d = normalizarDiseno({ fondos: { patron: 'hojas', intensidad: 999, degradado: 'otro' }, secciones: { videoteca: { fondo: 'oscuro', patron: 'montes', forma: 'tarjeta', color1: 'rojo' }, inventada: { fondo: 'oscuro' } } });
  assert.equal(d.fondos.intensidad, 40);
  assert.equal(d.fondos.degradado, 'ninguno');
  assert.equal(d.secciones.videoteca.color1, '#2F7D4A');
  assert.equal(d.secciones.inventada, undefined);
  const css = variablesCss(d);
  assert.match(css, /\[data-sec="videoteca"\]>\.contenedor\{background:url\("data:image\/svg\+xml/);
  assert.match(css, /--fp-img:url\(/);
  assert.doesNotMatch(css, /</);
  assert.equal(normalizarDiseno({}).secciones.noticias.fondo, 'auto');
});


test('celular y tablet: opciones del diseño, barra inferior y secciones por pantalla', async () => {
  const { variablesCss, atributos } = await import('../public/js/diseno.js');
  const d = normalizarDiseno({ movil: { noticias: 'deslizar', texto: 300, videos: 'otro', tabletColumnas: 9 }, secciones: { videoteca: { celular: false }, eventos: { tablet: false } } });
  assert.equal(d.movil.noticias, 'deslizar');
  assert.equal(d.movil.texto, 120);
  assert.equal(d.movil.videos, 'deslizar');
  assert.equal(d.movil.tabletColumnas, 3);
  assert.equal(d.movil.barra, true);
  const a = atributos(d);
  assert.equal(a['data-mv-noticias'], 'deslizar');
  assert.equal(a['data-mv-pie'], 'acordeon');
  const css = variablesCss(d);
  assert.match(css, /@media \(max-width:720px\)\{\.pagina-portada \[data-sec="videoteca"\]\{display:none!important\}\}/);
  assert.match(css, /@media \(min-width:721px\) and \(max-width:1024px\)\{\.pagina-portada \[data-sec="eventos"\]\{display:none!important\}\}/);
  assert.doesNotMatch(css, /data-sec="noticias"\]\{display:none/);
  const h = await (await pedir('/')).text();
  assert.match(h, /<nav class="barra-movil" aria-label="Accesos rápidos">/);
  assert.match(h, /data-mv-barra="si"/);
  assert.match(h, /class="bm-item bm-tramites"/);
});

test('administraciones: alcaldes, concejos, hitos con enlace y comparación', async () => {
  const s = await admin();
  await api(s, 'POST', 'importar-facebook');
  const r = await pedir('/administraciones/');
  assert.equal(r.status, 200);
  const h = await r.text();
  for (const n of ['Alejandro Cuminao Barros', 'Eduardo Navarrete Fuentes', 'Juan Carlos Espinoza', 'Comparación de administraciones', 'Concejo 2024 – 2028', 'Faumeliza Villanueva Caifal', 'Héctor Carrasco', 'Benjamín Oñate']) assert.ok(h.includes(n), n);
  // Cada hito con fuente enlaza a una página que existe.
  const enlaces = [...h.matchAll(/<li class="adm-hito"[^>]*><a href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(enlaces.length > 50);
  for (const u of new Set(enlaces)) assert.equal((await pedir(u)).status, 200, u);
  assert.match(await (await pedir('/alcaldia/')).text(), /href="\/administraciones\/"/);
  for (const t of ['La alcaldía antes de 2012', 'Carlos Mohor', 'Finanzas municipales 2020–2025', 'Melipeuco del futuro', 'Unidad de Tenencia Responsable de Mascotas']) assert.ok(h.includes(t), t);
  assert.match(await (await pedir('/municipio/')).text(), /Melipeuco en cifras/);
  // Del estudio no se publican direcciones IP ni enlaces de Drive.
  const fs = await import('node:fs');
  const todo = ['contenido/facebook/noticias.json', 'contenido/administraciones.json', 'contenido/comuna.json'].map((f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join(' ');
  assert.doesNotMatch(todo, /Dirección IP|drive\.google|(?<![\d.$])\d{1,3}(\.\d{1,3}){3}(?![\d.])/);
});
