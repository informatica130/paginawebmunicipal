// Agenda comunal completa: todo lo que la Municipalidad ha hecho y lo que viene.
//
// No guarda nada: se arma al vuelo (y se recuerda mientras el contenido no cambie) a partir de
//  · los eventos publicados de la agenda;
//  · todas las noticias publicadas: cada una es una actividad en la fecha que menciona su texto
//    («el pasado viernes 26 de abril», «este sábado») o, si no menciona ninguna, en la de su
//    publicación; las fechas futuras que anuncia («postulación hasta el 6 de noviembre», «se
//    realizará el 28 y 29 de noviembre») aparecen además como próximas fechas;
//  · las noticias y eventos del paquete de publicaciones (contenido/facebook/noticias.json) que
//    aún no se importaron en el panel: se muestran igual, con su propia ficha en
//    /eventos/actividad/<clave>/ (lo que el equipo importó y después eliminó no vuelve);
//  · las fechas de los calendarios de los micrositios (por ejemplo, el proceso de postulación a
//    la feria del Baqueano) y el calendario de la salud del CESFAM, que se repite cada año.
// Así la agenda no depende de que alguien cargue cada actividad dos veces.

import fs from 'node:fs';
import { hoyLocal, slugify, textoPlano, recortar } from '../src/util.js';
import { paqueteFacebook } from './facebook.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIA_RX = 'lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo';
const MES_RX = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
const RX_FECHA = new RegExp(`(?<![\\d/])(\\d{1,2})(?:°|º|ro)?((?:\\s*(?:,|y|al|a|-|–)\\s*(?:(?:${DIA_RX})\\s+)?\\d{1,2}(?:°|º)?)*)\\s+de\\s+(${MES_RX})(?:\\s*(?:de|del)?\\s*(?:año\\s+)?(\\d{4}))?`, 'gi');
const RX_RELATIVA = new RegExp(`(?<!\\p{L})(?:(el\\s+pasado|pasado|este|esta|el\\s+pr[oó]ximo|pr[oó]ximo)\\s+(${DIA_RX})|(${DIA_RX})\\s+pasado)(?!\\p{L})`, 'giu');
const RX_PASADO = new RegExp(`(?<!\\p{L})(se realiz[oó]|se llev[oó] a cabo|se desarroll[oó]|realiz[oó]|realizaron|participaron|particip[oó]|celebr[oó]|celebramos|recibi[oó]|recibieron|entreg[oó]|se efectu[oó]|tuvo lugar|culmin[oó]|visit[oó]|asistieron|compartieron|disfrutaron|vivi[oó]|fue)(?!\\p{L})`, 'iu');
const RX_HORA = /\b(\d{1,2})[:.](\d{2})\s*(?:hrs?\.?|horas|h\b)/i;
const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const indiceDia = (d) => DIAS.findIndex((x) => normal(x) === normal(d));
const iso = (f) => `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, '0')}-${String(f.getUTCDate()).padStart(2, '0')}`;
const fechaUTC = (s) => new Date(s.slice(0, 10) + 'T12:00:00Z');
const dias = (a, b) => Math.round((fechaUTC(a) - fechaUTC(b)) / 864e5);
const mas = (s, n) => iso(new Date(fechaUTC(s).getTime() + n * 864e5));
const valida = (a, m, d) => { const f = new Date(Date.UTC(a, m - 1, d, 12)); return f.getUTCMonth() === m - 1 && f.getUTCDate() === d ? iso(f) : null; };

// Texto plano con un salto por párrafo o ítem, para recortar la frase de cada fecha.
function textoConSaltos(h) {
  return textoPlano(String(h || '').replace(/<\/(p|li|h\d|div|tr)>|<br\s*\/?>/gi, '\n')).replace(/[ \t]+/g, ' ');
}
function fraseEn(texto, i, j) {
  const ini = Math.max(texto.lastIndexOf('\n', i), texto.lastIndexOf('. ', i) >= 0 ? texto.lastIndexOf('. ', i) + 1 : -1, texto.lastIndexOf('• ', i));
  let fin = texto.length;
  for (const sep of ['\n', '. ']) { const k = texto.indexOf(sep, j); if (k >= 0 && k < fin) fin = k; }
  return recortar(texto.slice(ini + 1, fin).replace(/^[\s•\-–:]+/, '').trim(), 170);
}

// Fechas que menciona un texto, ubicadas respecto de su fecha de publicación (YYYY-MM-DD).
export function fechasDelTexto(texto, pub) {
  const out = [];
  const anioPub = Number(pub.slice(0, 4));
  for (const m of texto.matchAll(RX_FECHA)) {
    const mes = MESES.indexOf(normal(m[3]) === 'setiembre' ? 'septiembre' : normal(m[3])) + 1;
    const nums = [Number(m[1]), ...[...(m[2] || '').matchAll(/\d{1,2}/g)].map((x) => Number(x[0]))].filter((n) => n >= 1 && n <= 31);
    if (!nums.length || !mes) continue;
    const enAnio = (a, d) => valida(a, mes, d);
    const ubicar = (d) => {
      if (m[4]) return enAnio(Number(m[4]), d);
      const opciones = [anioPub - 1, anioPub, anioPub + 1].map((a) => enAnio(a, d)).filter(Boolean);
      return opciones.sort((x, y) => Math.abs(dias(x, pub)) - Math.abs(dias(y, pub)))[0] || null;
    };
    const frase = fraseEn(texto, m.index, m.index + m[0].length);
    const h = RX_HORA.exec(frase);
    const hora = h && Number(h[1]) < 24 ? `${h[1].padStart(2, '0')}:${h[2]}` : '';
    // «28 y 29», «del 2 al 6»: un rango; «5, 12 y 19»: fechas separadas.
    const grupos = nums.length > 1 && nums.at(-1) - nums[0] > 0 && nums.at(-1) - nums[0] <= 7 ? [[nums[0], nums.at(-1)]] : nums.map((n) => [n, n]);
    for (const [a, b] of grupos) {
      const f = ubicar(a);
      if (!f) continue;
      const fin = b !== a ? ubicar(b) : '';
      const dif = dias(f, pub);
      // Lo muy lejano de la publicación suele ser historia («fundada el 12 de enero de 1981»).
      if (dif < -400 || dif > 400) continue;
      out.push({ fecha: f, fin: fin && fin > f ? fin : '', frase, hora, pos: m.index, explicita: true });
    }
  }
  const pasado = RX_PASADO.test(texto.slice(0, 900));
  const w0 = fechaUTC(pub).getUTCDay();
  for (const m of texto.matchAll(RX_RELATIVA)) {
    const modo = normal(m[1] || 'pasado');
    const wd = indiceDia(m[2] || m[3]);
    if (wd < 0) continue;
    let n;
    if (modo.includes('pasado')) n = -(((w0 - wd + 7) % 7) || 7);
    else if (modo.includes('proximo')) n = ((wd - w0 + 7) % 7) || 7;
    else n = pasado ? -((w0 - wd + 7) % 7) : (wd - w0 + 7) % 7;
    const frase = fraseEn(texto, m.index, m.index + m[0].length);
    out.push({ fecha: mas(pub, n), fin: '', frase, hora: '', pos: m.index, explicita: false });
  }
  const ayer = /\bayer\b/i.exec(texto.slice(0, 600));
  if (ayer && pasado) out.push({ fecha: mas(pub, -1), fin: '', frase: fraseEn(texto, ayer.index, ayer.index + 4), hora: '', pos: ayer.index, explicita: false });
  return out.sort((a, b) => a.pos - b.pos);
}

// Actividades que se desprenden de una noticia: la principal (lo que se informa) y las fechas
// futuras que anuncia.
export function actividadesDeNoticia(n) {
  const pub = hoyLocal(new Date(n.publicado_en));
  const texto = textoConSaltos(`${n.titulo}.\n${n.cuerpo || ''}`).slice(0, 4000);
  const fechas = fechasDelTexto(texto, pub);
  const pasadas = fechas.filter((f) => dias(f.fecha, pub) >= -75 && dias(f.fecha, pub) <= 0);
  const futuras = fechas.filter((f) => dias(f.fecha, pub) > 0);
  const base = { titulo: n.titulo, resumen: n.resumen || recortar(textoPlano(n.cuerpo || ''), 200), url: n.url, imagen: n.imagen || '', cats: n.cats || [], lugar: n.lugar || '', origen: n.origen || 'Noticia' };
  const out = [];
  const principal = pasadas[0];
  out.push({ ...base, k: `${n.k}:a`, tipo: futuras.length && !principal ? 'anuncio' : 'actividad', inicio: principal ? principal.fecha : pub, fin: principal?.fin || '', hora: '', detalle: principal?.explicita ? principal.frase : '', publicado: pub, estimada: !principal });
  const vistas = new Set();
  for (const f of futuras) {
    const clave = f.fecha + f.fin;
    // Vigencias de contratos o documentos no son actividades.
    if (vistas.has(clave) || vistas.size >= 8 || /vigencia|contrato|honorarios|\bvence|caduca/i.test(f.frase)) continue;
    vistas.add(clave);
    // «Publicación de seleccionados: viernes 13…» → la fecha se llama «Publicación de seleccionados».
    const etiqueta = /^([^:]{4,70}):\s/.exec(f.frase)?.[1];
    out.push({ ...base, k: `${n.k}:f${vistas.size}`, tipo: 'fecha', titulo: etiqueta || n.titulo, contexto: etiqueta ? n.titulo : '', inicio: f.fecha, fin: f.fin, hora: f.hora, detalle: etiqueta ? f.frase.slice(etiqueta.length + 1).trim() : f.frase, publicado: pub });
  }
  return out;
}

let cachePaquete = null;
function paquete() {
  if (!cachePaquete) cachePaquete = paqueteFacebook();
  return cachePaquete;
}
const RUTA_CESFAM = new URL('../contenido/facebook/cesfam.json', import.meta.url);
let cacheSalud = null;
function calendarioSalud() {
  if (!cacheSalud) { try { cacheSalud = JSON.parse(fs.readFileSync(RUTA_CESFAM, 'utf8')).calendario || []; } catch { cacheSalud = []; } }
  return cacheSalud;
}
// Ficha de una publicación del paquete que todavía no se importó.
export function elementoDelPaquete(clave) {
  const p = paquete();
  const n = p.noticias.find((x) => x.clave === clave) || (p.eventos || []).find((x) => x.clave === clave);
  return n ? { ...n, tipo: p.noticias.includes(n) ? 'noticia' : 'evento' } : null;
}

// Dirección antigua (del sitio anterior) de una publicación del paquete, o una redirección que
// trae el paquete: sirve mientras el paquete no se importe.
export function claveDelPaqueteParaRuta(ruta) {
  const p = paquete();
  const destino = (p.redirecciones || []).find((x) => x.origen === ruta)?.destino || ruta;
  return [...p.noticias, ...(p.eventos || [])].find((x) => x.url_antigua === destino)?.clave || null;
}

const PRIORIDAD = { evento: 0, fecha: 1, salud: 2, anuncio: 3, actividad: 4 };

export function crearAgenda({ db, repo, micro }) {
  let firma = '', cache = null;

  function construir() {
    const hoy = hoyLocal();
    const nombres = new Map(db.all("SELECT slug, nombre FROM taxonomias WHERE tipo = 'categoria'").map((t) => [t.slug, t.nombre]));
    const catsDe = new Map();
    for (const r of db.all("SELECT ct.contenido_id id, t.slug, t.nombre FROM contenido_taxonomia ct JOIN taxonomias t ON t.id = ct.taxonomia_id WHERE t.tipo = 'categoria'")) {
      if (!catsDe.has(r.id)) catsDe.set(r.id, []);
      catsDe.get(r.id).push({ slug: r.slug, nombre: r.nombre });
    }
    const todas = [];
    const ahoraIso = new Date().toISOString();
    // Eventos publicados.
    for (const e of db.all("SELECT id, tipo, slug, titulo, resumen, imagen, datos, publicado_en, creado FROM contenidos WHERE tipo = 'evento' AND estado = 'publicado'")) {
      let d = {}; try { d = JSON.parse(e.datos || '{}'); } catch {}
      if (!d.inicio) continue;
      todas.push({ k: 'e' + e.id, tipo: 'evento', titulo: e.titulo, resumen: e.resumen || '', url: repo.urlDe(e), imagen: e.imagen || '', cats: catsDe.get(e.id) || [], inicio: d.inicio, fin: d.fin || '', hora: d.inicio.length > 10 && !d.todoElDia ? d.inicio.slice(11, 16) : '', lugar: d.lugar || '', detalle: '', origen: 'Evento' });
    }
    // Noticias publicadas.
    for (const n of db.all("SELECT id, tipo, slug, titulo, resumen, cuerpo, imagen, publicado_en, creado FROM contenidos WHERE tipo = 'noticia' AND estado = 'publicado' AND publicado_en <= ?", ahoraIso)) {
      todas.push(...actividadesDeNoticia({ ...n, k: 'n' + n.id, url: repo.urlDe(n), cats: catsDe.get(n.id) || [] }));
    }
    // Paquete de publicaciones: lo que aún no está en la base (ni se importó y eliminó).
    const enBase = new Set(db.all('SELECT url_antigua u FROM contenidos WHERE url_antigua IS NOT NULL').map((x) => x.u));
    const vistas = new Set(db.ajuste('facebook-vistas') || []);
    const p = paquete();
    const pendiente = (x) => { const marca = x.url_antigua || 'facebook:' + x.clave; return !enBase.has(marca) && !vistas.has(marca); };
    const cats = (slugs) => (slugs || []).filter((s) => nombres.has(s)).map((s) => ({ slug: s, nombre: nombres.get(s) }));
    for (const n of p.noticias.filter(pendiente)) {
      if (!n.publicado_en || n.publicado_en > ahoraIso) continue;
      todas.push(...actividadesDeNoticia({ ...n, k: 'p' + n.clave, url: `/eventos/actividad/${n.clave}/`, cats: cats(n.categorias), origen: 'Publicación' }));
    }
    for (const e of (p.eventos || []).filter(pendiente)) {
      if (!e.inicio) continue;
      todas.push({ k: 'p' + e.clave, tipo: 'evento', titulo: e.titulo, resumen: e.resumen || '', url: `/eventos/actividad/${e.clave}/`, imagen: e.imagen || '', cats: cats(e.categorias), inicio: e.inicio, fin: e.fin || '', hora: e.inicio.length > 10 && e.todoElDia === false ? e.inicio.slice(11, 16) : '', lugar: e.lugar || '', detalle: '', origen: 'Evento' });
    }
    // Calendarios de los micrositios.
    for (const s of micro?.publicados() || []) {
      for (const m of s.modulos || []) {
        if (m.tipo !== 'calendario') continue;
        for (const [i, a] of (m.items || []).entries()) {
          if (!a.titulo || !/^\d{4}-\d{2}-\d{2}/.test(a.fecha || '')) continue;
          todas.push({ k: `m${s.id}:${m.id}:${i}`, tipo: 'fecha', titulo: a.titulo, resumen: a.texto || '', url: a.url && a.url.startsWith('/') ? a.url : `/${s.slug}/#m-${m.id}`, imagen: '', cats: [{ slug: '', nombre: s.nombre }], inicio: a.fecha.slice(0, 10), fin: '', hora: /^\d{1,2}:\d{2}/.test(a.hora || '') ? a.hora.slice(0, 5).padStart(5, '0') : '', horaTexto: a.hora || '', lugar: a.lugar || '', detalle: a.tipo ? `${a.tipo} · ${s.nombre}` : s.nombre, origen: s.nombre });
        }
      }
    }
    // Calendario de la salud: cada año, este y el próximo.
    const anio = Number(hoy.slice(0, 4));
    for (const y of [anio, anio + 1]) {
      for (const c of calendarioSalud()) {
        const f = valida(y, Number(c.fecha.slice(0, 2)), Number(c.fecha.slice(3, 5)));
        if (!f || dias(f, hoy) > 365) continue;
        todas.push({ k: `s${y}:${c.fecha}`, tipo: 'salud', titulo: c.nombre, resumen: 'Fecha que el CESFAM Melipeuco conmemora cada año con actividades, stands y talleres.', url: `/buscar/?q=${encodeURIComponent(c.buscar || c.nombre)}`, imagen: '', cats: [{ slug: 'salud', nombre: 'Salud' }], inicio: f, fin: '', hora: '', lugar: 'CESFAM Melipeuco', detalle: '', origen: 'Calendario de la salud' });
      }
    }
    // Sin repetidos: el mismo día y casi el mismo título (un evento y su noticia, por ejemplo).
    todas.sort((a, b) => a.inicio.slice(0, 10).localeCompare(b.inicio.slice(0, 10)) || PRIORIDAD[a.tipo] - PRIORIDAD[b.tipo] || (a.hora || '99').localeCompare(b.hora || '99'));
    const vistos = new Set(), lista = [];
    for (const x of todas) {
      const clave = x.inicio.slice(0, 10) + '|' + slugify(x.titulo).slice(0, 36);
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      x.dia = x.inicio.slice(0, 10);
      x.hasta = (x.fin || x.inicio).slice(0, 10);
      x.busca = normal(`${x.titulo} ${x.resumen} ${x.detalle} ${x.lugar} ${x.cats.map((c) => c.nombre).join(' ')}`);
      lista.push(x);
    }
    // Una fecha sacada del texto de una noticia sobra si ese día ya hay otra entrada del mismo
    // tema (comparten al menos dos palabras importantes del título).
    const palabras = (t) => new Set(normal(t).split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 5));
    const porDia = new Map();
    for (const x of lista) { if (!porDia.has(x.dia)) porDia.set(x.dia, []); porDia.get(x.dia).push(x); }
    const deNoticia = (x) => x.tipo === 'fecha' && /^[np]/.test(x.k);
    const comunes = (a, b) => { const pb = palabras(b); return [...palabras(a)].filter((w) => pb.has(w)).length; };
    const sobra = (x) => deNoticia(x) && porDia.get(x.dia).some((y) => y !== x && !deNoticia(y) && y.tipo !== 'actividad' && y.tipo !== 'anuncio' && comunes(x.titulo, y.titulo) >= 2);
    return { lista: lista.filter((x) => !sobra(x)), hoy };
  }

  function datos() {
    const r = db.get("SELECT count(*) n, max(modificado) m, max(publicado_en) p FROM contenidos WHERE tipo IN ('noticia', 'evento')");
    const ms = db.get("SELECT length(valor) l FROM ajustes WHERE clave = 'micrositios'")?.l || 0;
    const fv = db.get("SELECT length(valor) l FROM ajustes WHERE clave = 'facebook-vistas'")?.l || 0;
    const f = `${r.n}|${r.m}|${r.p}|${ms}|${fv}|${hoyLocal()}|${new Date().toISOString().slice(0, 13)}`;
    if (f !== firma || !cache) { firma = f; cache = construir(); }
    return cache;
  }

  const coincide = (x, { q = '', tipo = '', cat = '' } = {}) => {
    if (tipo === 'eventos' && !['evento', 'fecha', 'salud'].includes(x.tipo)) return false;
    if (tipo === 'actividades' && !['actividad', 'anuncio'].includes(x.tipo)) return false;
    if (cat && !x.cats.some((c) => c.slug === cat)) return false;
    if (q) { for (const p of normal(q).split(/\s+/).filter(Boolean)) if (!x.busca.includes(p)) return false; }
    return true;
  };

  return {
    todas: () => datos().lista,
    entre: (desde, hasta, filtro) => datos().lista.filter((x) => x.dia < hasta && x.hasta >= desde && coincide(x, filtro)),
    proximas: (n = 6, filtro) => { const hoy = hoyLocal(); return datos().lista.filter((x) => x.hasta >= hoy && coincide(x, filtro)).slice(0, n); },
    buscar: (filtro) => datos().lista.filter((x) => coincide(x, filtro)).reverse(),
    anteriores: (filtro) => { const hoy = hoyLocal(); return datos().lista.filter((x) => x.hasta < hoy && coincide(x, filtro)).reverse(); },
    // Cuántas actividades hay por año y por mes (para la línea de tiempo).
    resumen() {
      const anios = new Map();
      for (const x of datos().lista) {
        const a = Number(x.dia.slice(0, 4));
        if (!anios.has(a)) anios.set(a, { anio: a, total: 0, meses: Array(12).fill(0) });
        const r = anios.get(a); r.total++; r.meses[Number(x.dia.slice(5, 7)) - 1]++;
      }
      return [...anios.values()].sort((a, b) => b.anio - a.anio);
    },
    categorias() {
      const m = new Map();
      for (const x of datos().lista) for (const c of x.cats) if (c.slug) m.set(c.slug, { ...c, total: (m.get(c.slug)?.total || 0) + 1 });
      return [...m.values()].sort((a, b) => b.total - a.total);
    },
  };
}
