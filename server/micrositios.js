// Micrositios de las unidades municipales: validación, plantillas y lectura.
//
// Se guardan en el ajuste «micrositios» (la memoria compartida de Vercel lo conserva igual que los
// demás ajustes). Mientras no se guarde nada desde el panel se usan las plantillas de
// contenido/micrositios/*.json que traen «predeterminado: true» (así el sitio de Medio Ambiente
// existe desde el primer día). El esquema de cada módulo está en public/js/micrositios.js.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULOS, COMUNES, GENERAL, TEMA, PORTADA, CONTACTO } from '../public/js/micrositios.js';
import { sanitizarHtml } from './sanitizar.js';
import { NOMBRES_ICONOS } from './render/iconos.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'contenido', 'micrositios');
const ICONOS = new Set(NOMBRES_ICONOS);
// Direcciones del sitio que un micrositio no puede ocupar.
const RESERVADAS = new Set(['admin', 'api', 'embed', 'vista-previa', 'noticias', 'page', 'category', 'tag', 'categoria', 'etiqueta', 'tramites', 'eventos', 'documentos', 'areas', 'autoridades', 'concejo', 'descubre', 'participa', 'directorio', 'contacto', 'oirs', 'boletin', 'buscar', 'videos', 'fotos', 'administraciones', 'transparencia', 'mapa-del-sitio', 'accesibilidad', 'feed', 'img', 'css', 'js', 'fuentes', 'medios', 'wp-content', 'sitemap.xml', 'robots.txt']);

const txt = (v, n = 300) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[<>]/g, '').trim().slice(0, n);
const parrafo = (v, n = 4000) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[<>]/g, '').trim().slice(0, n);
const url = (v) => { const s = String(v ?? '').trim().slice(0, 800); return /^\/(?!\/)[^\s"'<>]*$/.test(s) || /^#[\w-]+$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s) || /^mailto:[^\s"'<>]+$/.test(s) || /^tel:\+?[\d\s()-]+$/.test(s) ? s : ''; };
const imagen = (v) => { const s = String(v ?? '').trim(); return /^\/(?!\/)[\w\-./%]+$/.test(s) || /^https:\/\/[^\s"'<>()]+$/.test(s) ? s.slice(0, 500) : ''; };
export const slugOk = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const idOk = (v, i) => (/^[a-z0-9-]{2,40}$/.test(String(v || '')) ? String(v) : 'm' + i.toString(36) + Math.random().toString(36).slice(2, 7));

// Un valor según su tipo de campo.
function campo(def, v) {
  const d = def.def;
  switch (def.t) {
    case 'texto': return txt(v ?? d ?? '');
    case 'parrafo': return parrafo(v ?? d ?? '');
    case 'html': return sanitizarHtml(String(v ?? '')).slice(0, 60000);
    case 'url': case 'archivo': return url(v);
    case 'imagen': return imagen(v);
    case 'icono': return ICONOS.has(v) ? v : (d || '');
    case 'color': return /^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toUpperCase() : (d || '#2F7D4A');
    case 'opcion': return Object.prototype.hasOwnProperty.call(def.opciones, String(v)) ? String(v) : String(d ?? Object.keys(def.opciones)[0]);
    case 'numero': { const n = Number(v); return Number.isFinite(n) ? Math.min(100000, Math.max(0, Math.round(n))) : (d ?? 0); }
    case 'fecha': return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';
    case 'si': return typeof v === 'boolean' ? v : (d ?? false);
    case 'lista': return (Array.isArray(v) ? v : String(v ?? '').split('\n')).map((x) => txt(x, 300)).filter(Boolean).slice(0, 60);
    case 'repetidor': return (Array.isArray(v) ? v : []).slice(0, 150).filter((x) => x && typeof x === 'object').map((x) => objeto(def.sub, x));
    default: return '';
  }
}
const objeto = (defs, x = {}) => Object.fromEntries(defs.map((def) => [def.k, campo(def, x[def.k])]));

export function normalizarModulo(m, i = 0) {
  const def = MODULOS[m?.tipo];
  if (!def) return null;
  return { id: idOk(m.id, i), tipo: m.tipo, ...objeto(def.campos, m), ...objeto(COMUNES, m) };
}

export function normalizarSitio(x, i = 0) {
  const g = objeto(GENERAL, x);
  g.slug = slugOk(g.slug || g.nombre);
  g.alias = g.alias.map(slugOk).filter((x) => x && x !== g.slug && !RESERVADAS.has(x)).slice(0, 10);
  g.organigrama = /^dep-[a-z0-9-]{2,40}$/.test(g.organigrama) ? g.organigrama : '';
  if (!g.slug || RESERVADAS.has(g.slug)) g.slug = 'unidad-' + (i + 1);
  return {
    id: idOk(x?.id, i), ...g,
    tema: objeto(TEMA, x?.tema), portada: objeto(PORTADA, x?.portada), contacto: objeto(CONTACTO, x?.contacto),
    modulos: (Array.isArray(x?.modulos) ? x.modulos : []).slice(0, 60).map(normalizarModulo).filter(Boolean),
  };
}

export function normalizarMicrositios(entrada) {
  const vistos = new Set();
  const sitios = (Array.isArray(entrada?.sitios) ? entrada.sitios : []).slice(0, 40).map(normalizarSitio).map((s, i) => {
    while (vistos.has(s.slug)) s.slug = `${s.slug}-${i + 1}`;
    vistos.add(s.slug);
    return s;
  });
  // Plantillas predeterminadas que se eliminaron a propósito (no vuelven a aparecer solas).
  const eliminados = [...new Set((Array.isArray(entrada?.eliminados) ? entrada.eliminados : []).map((x) => String(x)).filter((x) => /^[a-z0-9-]{2,40}$/.test(x)))].slice(0, 200);
  return { sitios, eliminados };
}

// Plantillas: cada archivo de contenido/micrositios es un micrositio listo para usar o copiar.
let cachePlantillas = null;
export function plantillas() {
  if (cachePlantillas) return cachePlantillas;
  let archivos = [];
  try { archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort(); } catch { /* sin plantillas */ }
  cachePlantillas = archivos.map((f) => { try { const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); return { id: f.replace(/\.json$/, ''), predeterminado: !!j.predeterminado, sitio: normalizarSitio(j.sitio || j) }; } catch { return null; } }).filter(Boolean);
  return cachePlantillas;
}

export function crearMicrositios({ db }) {
  let previo = null, cache = null;
  // Se vuelve a validar sólo cuando el ajuste cambia (se compara el texto guardado).
  const leer = () => {
    const crudo = db.get("SELECT valor FROM ajustes WHERE clave = 'micrositios'")?.valor || '';
    if (crudo !== previo || !cache) {
      previo = crudo;
      let a = null; try { a = crudo ? JSON.parse(crudo) : null; } catch { a = null; }
      // Lo guardado más las plantillas predeterminadas nuevas (las que no están ni se eliminaron).
      const g = a?.sitios ? normalizarMicrositios(a) : { sitios: [], eliminados: [] };
      const ids = new Set(g.sitios.map((x) => x.id)), slugs = new Set(g.sitios.map((x) => x.slug)), fuera = new Set(g.eliminados);
      const nuevas = plantillas().filter((p) => p.predeterminado && !ids.has(p.sitio.id) && !slugs.has(p.sitio.slug) && !fuera.has(p.sitio.id)).map((p) => p.sitio);
      cache = { sitios: [...g.sitios, ...nuevas], eliminados: g.eliminados };
    }
    return cache;
  };
  return {
    leer,
    porSlug: (slug) => leer().sitios.find((s) => s.slug === slug) || null,
    porAlias: (slug) => leer().sitios.find((s) => s.alias.includes(slug) && s.slug !== slug) || null,
    porUnidad: (dep) => (dep ? leer().sitios.find((s) => s.organigrama === dep && s.publicado) || null : null),
    publicados: () => leer().sitios.filter((s) => s.publicado),
  };
}
