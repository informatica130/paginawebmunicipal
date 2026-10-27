// Extensiones del sitio: lo que cualquier sitio necesita agregar algún día sin tocar el código.
//
//  · Ventanas emergentes: avisos en un recuadro, una esquina o una barra; al cargar, a los N
//    segundos, al bajar cierto porcentaje o al intentar salir; una vez por sesión, cada N días,
//    una sola vez o siempre; en todas las páginas, sólo en la portada o en las rutas elegidas.
//  · Bloques en zonas: contenido propio en cualquier lugar (antes o bajo la cabecera, al inicio o
//    al final del contenido, antes del pie, en el pie o entre las secciones de la portada). Puede
//    ser HTML (saneado), HTML aislado con scripts (en un marco protegido), un aviso o datos de
//    una fuente externa con una plantilla.
//  · Fuentes de datos: cualquier API que entregue JSON por https. El servidor la consulta (con
//    su clave, si tiene, que nunca llega al navegador), la guarda en memoria unos minutos y la
//    muestra con una plantilla sencilla: {{campo}}, {{#lista}}…{{/lista}} y {{^campo}}…{{/campo}}.
//  · Código propio (sólo Super Administrador): fragmentos para <head> y antes de </body>
//    (analítica, chat, verificación de dominios) y los dominios externos que esos fragmentos
//    necesitan, que se agregan a la política de seguridad de contenidos.
//
// Todo se guarda en el ajuste «extensiones», que la memoria compartida de Vercel conserva igual
// que los demás ajustes.

import crypto from 'node:crypto';
import { sanitizarHtml } from './sanitizar.js';
import { esc, hoyLocal } from '../src/util.js';

export const ZONAS = {
  'antes-cabecera': 'Sobre la cabecera (franja superior)',
  'bajo-cabecera': 'Bajo la cabecera',
  'inicio-contenido': 'Al inicio del contenido de la página',
  'final-contenido': 'Al final del contenido de la página',
  'antes-pie': 'Antes del pie de página',
  pie: 'Dentro del pie de página',
};
// Zonas de la portada: después de cada sección.
export const ZONAS_PORTADA = ['banners', 'campanas', 'accesos', 'tramites', 'noticias', 'eventos', 'areas', 'turismo', 'video', 'encuesta', 'boletin', 'mundos', 'cinta'];
export const TIPOS_ZONA = { html: 'Texto y HTML (saneado)', aviso: 'Aviso destacado', fuente: 'Datos de una fuente externa (API)', aislado: 'HTML con scripts (marco aislado)' };
export const PAGINAS = { todas: 'Todas las páginas', portada: 'Sólo la portada', interiores: 'Todas menos la portada', rutas: 'Sólo las direcciones indicadas' };
export const ESTILOS_EMERGENTE = { modal: 'Ventana al centro', esquina: 'Tarjeta en una esquina', barra: 'Barra inferior' };
export const DISPAROS = { carga: 'Al abrir la página', tiempo: 'Después de unos segundos', desplazamiento: 'Al bajar por la página', salida: 'Al intentar salir (computador)' };
export const FRECUENCIAS = { sesion: 'Una vez por visita', dias: 'Cada cierto número de días', una: 'Una sola vez', siempre: 'Siempre' };
export const FONDOS = { ninguno: 'Sin fondo', suave: 'Fondo suave', azul: 'Color principal', ambar: 'Color de acento' };
export const NIVELES = { info: 'Información', alerta: 'Alerta', exito: 'Buena noticia', emergencia: 'Emergencia' };

const txt = (v, n = 300) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const opcion = (v, lista, d) => (Object.prototype.hasOwnProperty.call(lista, v) ? v : d);
const num = (v, d, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : d; };
const fechaOk = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');
const idOk = (v) => (/^[a-z0-9-]{3,40}$/.test(String(v || '')) ? String(v) : 'x' + crypto.randomBytes(4).toString('hex'));
const urlSitio = (v) => { const s = txt(v, 500); return /^\/(?!\/)[^\s"'<>]*$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s) || /^mailto:[^\s"'<>]+$/.test(s) || /^tel:\+?[\d\s()-]+$/.test(s) ? s : ''; };
const rutas = (v) => txt(v, 2000).split(/\r?\n/).map((r) => r.trim()).filter((r) => /^\/[^\s"'<>]*$/.test(r)).slice(0, 40).join('\n');

// Sólo APIs públicas por https: nada de direcciones internas.
export function urlFuenteValida(v) {
  try {
    const u = new URL(String(v || ''));
    if (u.protocol !== 'https:' || u.username || u.password) return '';
    const h = u.hostname.toLowerCase();
    if (!h.includes('.') || /^[\d.]+$/.test(h) || h.includes(':') || /(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/.test(h)) return '';
    return u.href.slice(0, 800);
  } catch { return ''; }
}
export function dominioValido(v) {
  try { const u = new URL(String(v || '').trim()); return u.protocol === 'https:' && u.hostname.includes('.') && !/[*'"\s;]/.test(u.origin) ? u.origin : ''; } catch { return ''; }
}

const OCULTO = '••••••••';

export function normalizarExtensiones(b = {}, { previo = {}, superadmin = false } = {}) {
  const lista = (v, n, f) => (Array.isArray(v) ? v.slice(0, n).map(f).filter(Boolean) : []);
  const ventana = (o) => ({ desde: fechaOk(o?.desde), hasta: fechaOk(o?.hasta), paginas: opcion(o?.paginas, PAGINAS, 'todas'), rutas: rutas(o?.rutas) });
  const fuentesPrevias = new Map((previo.fuentes || []).map((f) => [f.id, f]));
  const fuentes = lista(b.fuentes, 20, (f) => {
    const url = urlFuenteValida(f?.url);
    if (!url) return null;
    const id = idOk(f.id), antes = fuentesPrevias.get(id);
    const clave = f?.encabezado?.valor === OCULTO ? antes?.encabezado?.valor || '' : txt(f?.encabezado?.valor, 600);
    return { id, nombre: txt(f.nombre, 80) || 'Fuente', url, ruta: txt(f.ruta, 120).replace(/[^\w.$[\]-]/g, ''), minutos: num(f.minutos, 15, 1, 1440),
      encabezado: { nombre: txt(f?.encabezado?.nombre, 60).replace(/[^\w-]/g, ''), valor: clave } };
  });
  const idsFuentes = new Set(fuentes.map((f) => f.id));
  return {
    emergentes: lista(b.emergentes, 20, (e) => {
      const titulo = txt(e?.titulo, 120), texto = sanitizarHtml(String(e?.texto || ''), { maxLargo: 8000 });
      if (!titulo && !texto) return null;
      return { id: idOk(e.id), activo: e.activo !== false, nombre: txt(e.nombre, 80), titulo, texto, imagen: urlSitio(e.imagen),
        boton: { texto: txt(e?.boton?.texto, 50), url: urlSitio(e?.boton?.url) }, boton2: { texto: txt(e?.boton2?.texto, 50), url: urlSitio(e?.boton2?.url) },
        estilo: opcion(e.estilo, ESTILOS_EMERGENTE, 'modal'), fondo: opcion(e.fondo, FONDOS, 'ninguno'), disparo: opcion(e.disparo, DISPAROS, 'tiempo'),
        segundos: num(e.segundos, 4, 0, 120), porcentaje: num(e.porcentaje, 40, 5, 95), frecuencia: opcion(e.frecuencia, FRECUENCIAS, 'sesion'), dias: num(e.dias, 7, 1, 365), ...ventana(e) };
    }),
    zonas: lista(b.zonas, 60, (z) => {
      const tipo = opcion(z?.tipo, TIPOS_ZONA, 'html');
      const zona = Object.hasOwn(ZONAS, z?.zona) || (String(z?.zona).startsWith('portada:') && ZONAS_PORTADA.includes(String(z.zona).slice(8))) ? z.zona : 'final-contenido';
      return { id: idOk(z.id), activo: z.activo !== false, nombre: txt(z.nombre, 80) || 'Bloque', zona, tipo, titulo: txt(z.titulo, 140),
        html: tipo === 'aislado' ? String(z.html || '').slice(0, 200000) : sanitizarHtml(String(z.html || ''), { maxLargo: 60000 }),
        nivel: opcion(z.nivel, NIVELES, 'info'), fuente: idsFuentes.has(z.fuente) ? z.fuente : '', plantilla: String(z.plantilla || '').slice(0, 20000), alto: num(z.alto, 360, 80, 4000),
        ancho: z.ancho === 'completo' ? 'completo' : 'contenedor', fondo: opcion(z.fondo, FONDOS, 'ninguno'), ...ventana(z) };
    }),
    fuentes,
    // Centro de Transparencia: si no hay materias propias se usan las oficiales (Ley 20.285).
    transparencia: {
      activo: b.transparencia?.activo !== false, intro: txt(b.transparencia?.intro, 600),
      categorias: lista(b.transparencia?.categorias, 40, (m) => (txt(m?.titulo, 120) ? { titulo: txt(m.titulo, 120), texto: txt(m.texto, 400), url: urlSitio(m.url), icono: txt(m.icono, 30).replace(/[^a-z]/g, '') || 'documento', claves: txt(m.claves, 300) } : null)),
    },
    // El código propio sólo lo cambia el Super Administrador; para el resto se conserva.
    codigo: superadmin ? {
      cabeza: String(b.codigo?.cabeza || '').slice(0, 20000), cuerpo: String(b.codigo?.cuerpo || '').slice(0, 20000),
      dominios: [...new Set(String(b.codigo?.dominios || '').split(/[\s,]+/).map(dominioValido).filter(Boolean))].slice(0, 30).join('\n'),
    } : { cabeza: '', cuerpo: '', dominios: '', ...(previo.codigo || {}) },
  };
}

// Lo que ve el panel: la clave de cada fuente no vuelve al navegador.
export function paraPanel(e) {
  return { ...e, fuentes: (e.fuentes || []).map((f) => ({ ...f, encabezado: { ...f.encabezado, valor: f.encabezado?.valor ? OCULTO : '' } })) };
}

// ------------------------------------------------------------------ Plantillas
// {{campo}} y {{a.b.c}} (siempre escapados), {{#lista}}…{{/lista}} (repite o muestra si existe),
// {{^campo}}…{{/campo}} (si no existe o está vacío), {{.}} (el valor actual), {{@indice}}.
export function plantilla(t, datos) {
  const valor = (pila, ruta) => {
    if (ruta === '.') return pila[pila.length - 1];
    for (let i = pila.length - 1; i >= 0; i--) {
      const v = ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), pila[i]);
      if (v !== undefined) return v;
    }
    return undefined;
  };
  const vacio = (v) => v == null || v === false || v === '' || (Array.isArray(v) && !v.length);
  const pintar = (s, pila, prof = 0) => {
    if (prof > 8) return '';
    return s.replace(/\{\{([#^])\s*([\w.@$-]+)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/g, (_, tipo, ruta, dentro) => {
      const v = valor(pila, ruta);
      if (tipo === '^') return vacio(v) ? pintar(dentro, pila, prof + 1) : '';
      if (vacio(v)) return '';
      if (Array.isArray(v)) return v.slice(0, 200).map((x, i) => pintar(dentro, [...pila, { '@indice': i + 1 }, x], prof + 1)).join('');
      return pintar(dentro, typeof v === 'object' ? [...pila, v] : pila, prof + 1);
    }).replace(/\{\{\s*([\w.@$-]+|\.)\s*\}\}/g, (_, ruta) => {
      const v = valor(pila, ruta);
      return v == null || typeof v === 'object' ? '' : esc(String(v));
    });
  };
  return pintar(String(t || ''), [datos]);
}

// ------------------------------------------------------------------ Motor
export function crearExtensiones({ db, registrar = console, fetchImpl = (...a) => fetch(...a) }) {
  const leer = () => db.ajuste('extensiones') || {};
  const cache = new Map(); // id → { datos, hasta, error, pendiente }

  const hoy = () => hoyLocal();
  const vigente = (x) => x.activo !== false && (!x.desde || x.desde <= hoy()) && (!x.hasta || x.hasta >= hoy());
  const aplica = (x, ruta) => {
    if (x.paginas === 'portada') return ruta === '/';
    if (x.paginas === 'interiores') return ruta !== '/';
    if (x.paginas === 'rutas') return (x.rutas || '').split('\n').filter(Boolean).some((r) => (r.endsWith('*') ? ruta.startsWith(r.slice(0, -1)) : ruta === r || ruta === r + '/' || ruta.replace(/\/$/, '') === r.replace(/\/$/, '')));
    return true;
  };

  async function consultar(f) {
    const c = cache.get(f.id) || {};
    if (c.pendiente) return c.pendiente;
    c.pendiente = (async () => {
      try {
        const h = { Accept: 'application/json' };
        if (f.encabezado?.nombre && f.encabezado?.valor) h[f.encabezado.nombre] = f.encabezado.valor;
        const r = await fetchImpl(f.url, { headers: h, redirect: 'error', signal: AbortSignal.timeout(4000) });
        if (!r.ok) throw new Error('respondió ' + r.status);
        const texto = await r.text();
        if (texto.length > 1_000_000) throw new Error('respuesta demasiado grande');
        let datos = JSON.parse(texto);
        if (f.ruta) datos = f.ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), datos);
        cache.set(f.id, { datos, hasta: Date.now() + f.minutos * 60e3, error: '', en: new Date().toISOString() });
      } catch (e) {
        registrar.warn?.(`Fuente «${f.nombre}»: ${e.message}`);
        cache.set(f.id, { ...c, pendiente: null, error: e.message, hasta: Date.now() + 60e3 });
      }
    })();
    cache.set(f.id, c);
    await c.pendiente;
    const fin = cache.get(f.id); if (fin) fin.pendiente = null;
  }

  // Antes de dibujar una página: trae las fuentes que usará (espera sólo si no hay nada guardado).
  async function preparar(ruta) {
    const e = leer();
    const ids = new Set((e.zonas || []).filter((z) => z.tipo === 'fuente' && z.fuente && vigente(z) && aplica(z, ruta)).map((z) => z.fuente));
    const esperas = [];
    for (const f of (e.fuentes || []).filter((x) => ids.has(x.id))) {
      const c = cache.get(f.id);
      if (!c || !('datos' in c)) esperas.push(consultar(f));
      else if (c.hasta < Date.now()) consultar(f); // se renueva en segundo plano
    }
    if (esperas.length) await Promise.race([Promise.all(esperas), new Promise((r) => setTimeout(r, 4500))]);
  }

  const fondoClase = (f) => (f && f !== 'ninguno' ? ` ext-fondo-${f}` : '');
  function pintarZona(z) {
    let cuerpo = '';
    if (z.tipo === 'html') cuerpo = `<div class="prosa">${z.html}</div>`;
    else if (z.tipo === 'aviso') cuerpo = `<div class="caja caja-${z.nivel}"><div>${z.titulo ? `<strong>${esc(z.titulo)}</strong>` : ''}<div class="prosa">${z.html}</div></div></div>`;
    else if (z.tipo === 'aislado') cuerpo = `<iframe class="aislado" data-aislado src="/embed/zona/${esc(z.id)}" title="${esc(z.titulo || z.nombre)}" loading="lazy" style="height:${z.alto}px" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-forms allow-downloads"></iframe>`;
    else if (z.tipo === 'fuente') {
      const c = cache.get(z.fuente);
      if (!c || !('datos' in c)) return '';
      const datos = Array.isArray(c.datos) ? { items: c.datos, lista: c.datos } : c.datos;
      cuerpo = `<div class="ext-fuente">${sanitizarHtml(plantilla(z.plantilla || '{{#items}}<p>{{.}}</p>{{/items}}', datos), { maxLargo: 200000 })}</div>`;
    }
    if (!cuerpo) return '';
    const titulo = z.titulo && z.tipo !== 'aviso' ? `<h2 class="ext-titulo">${esc(z.titulo)}</h2>` : '';
    const dentro = z.ancho === 'completo' ? `${titulo}${cuerpo}` : `<div class="contenedor">${titulo}${cuerpo}</div>`;
    return `<section class="ext-zona ext-${esc(z.zona.replace(':', '-'))}${fondoClase(z.fondo)}" data-ext="${esc(z.id)}">${dentro}</section>`;
  }

  function zona(ruta, nombre) {
    const e = leer();
    return (e.zonas || []).filter((z) => z.zona === nombre && vigente(z) && aplica(z, ruta)).map((z) => pintarZona(z)).join('');
  }

  function emergentes(ruta) {
    const e = leer();
    return (e.emergentes || []).filter((x) => vigente(x) && aplica(x, ruta)).map((x) => {
      const v = crypto.createHash('sha1').update(JSON.stringify([x.titulo, x.texto, x.imagen, x.boton, x.boton2])).digest('hex').slice(0, 8);
      const tid = `em-${esc(x.id)}-t`;
      const boton = (b, clase) => (b?.texto && b?.url ? `<a class="boton ${clase}" href="${esc(b.url)}"${/^https?:/.test(b.url) ? ' target="_blank" rel="noopener"' : ''} data-emergente-accion>${esc(b.texto)}</a>` : '');
      return `<div class="emergente emergente-${x.estilo}${fondoClase(x.fondo)}" data-emergente="${esc(x.id)}" data-version="${v}" data-disparo="${x.disparo}" data-segundos="${x.segundos}" data-porcentaje="${x.porcentaje}" data-frecuencia="${x.frecuencia}" data-dias="${x.dias}" role="dialog" aria-modal="${x.estilo === 'modal'}" aria-labelledby="${tid}" hidden>
  <div class="emergente-caja">
    <button type="button" class="emergente-cerrar" data-emergente-cerrar aria-label="Cerrar">×</button>
    ${x.imagen ? `<img class="emergente-img" src="${esc(x.imagen)}" alt="" loading="lazy">` : ''}
    <div class="emergente-cuerpo">${x.titulo ? `<h2 id="${tid}">${esc(x.titulo)}</h2>` : `<h2 id="${tid}" class="sr">Aviso</h2>`}${x.texto ? `<div class="prosa">${x.texto}</div>` : ''}
    ${x.boton?.texto || x.boton2?.texto ? `<div class="emergente-botones">${boton(x.boton, 'boton-primario')}${boton(x.boton2, 'boton-secundario')}</div>` : ''}</div>
  </div>
</div>`;
    }).join('');
  }

  // Código propio: los <script> reciben el nonce de la página para que la política los permita.
  const conNonce = (h, nonce) => String(h || '').replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
  const codigo = (donde, nonce) => conNonce(leer().codigo?.[donde], nonce);
  const dominios = () => String(leer().codigo?.dominios || '').split('\n').map(dominioValido).filter(Boolean);
  const zonaAislada = (id) => (leer().zonas || []).find((z) => z.id === id && z.tipo === 'aislado' && vigente(z));

  // Para el panel: prueba una fuente y devuelve una muestra de lo que entrega.
  async function probar(f) {
    const limpia = normalizarExtensiones({ fuentes: [f] }, { previo: leer() }).fuentes[0];
    if (!limpia) return { ok: false, error: 'La dirección debe ser pública y empezar con https://' };
    cache.delete(limpia.id);
    await consultar(limpia);
    const c = cache.get(limpia.id) || {};
    if (!('datos' in c)) return { ok: false, error: c.error || 'Sin respuesta' };
    return { ok: true, muestra: JSON.stringify(c.datos, null, 2).slice(0, 4000) };
  }

  return { leer, preparar, zona, emergentes, codigo, dominios, zonaAislada, probar, estadoFuentes: () => Object.fromEntries([...cache].map(([k, v]) => [k, { en: v.en || '', error: v.error || '' }])) };
}
