// Identidad «Melipeuco Capital del Trekking» dentro del sitio municipal.
// El logo de la comuna se desarma en sus 9 letras-símbolo y cada una es el color y el emblema
// de un área del municipio (la misma idea del sitio de turismo, aplicada a los servicios):
// M montaña · E rostro · L cascada · I araucaria · P corazón · E persona · U animales · C estrellas · O kultrún.
// Las piezas del logo vienen de logo-trekking.json (las mismas del sitio de la Capital del Trekking).

import fs from 'node:fs';

const partes = JSON.parse(fs.readFileSync(new URL('./logo-trekking.json', import.meta.url), 'utf8'));

export const SITIO_TREKKING = 'https://melipeucocapitaldeltrekking.cl/';

export const PALETA = [
  { nombre: 'Montaña', color: '#1F6FA8', claro: '#DCEBF6', oscuro: '#0F3A5A', simbolo: 'montaña y río' },
  { nombre: 'Rostro', color: '#E2683C', claro: '#FBE5DA', oscuro: '#7A2E12', simbolo: 'rostro' },
  { nombre: 'Cascada', color: '#16A0A8', claro: '#D5F1F2', oscuro: '#0A5155', simbolo: 'cascada' },
  { nombre: 'Araucaria', color: '#2F7D4A', claro: '#DDEFE2', oscuro: '#163D23', simbolo: 'araucaria' },
  { nombre: 'Corazón', color: '#D23B4A', claro: '#F8DCDF', oscuro: '#6E1520', simbolo: 'corazón' },
  { nombre: 'Persona', color: '#E9A92B', claro: '#FBEFD3', oscuro: '#6E4B07', simbolo: 'persona' },
  { nombre: 'Animales', color: '#8A5A3B', claro: '#EFE2D8', oscuro: '#432816', simbolo: 'animales' },
  { nombre: 'Estrellas', color: '#3E3E9A', claro: '#E0E0F3', oscuro: '#1D1D4F', simbolo: 'estrellas' },
  { nombre: 'Kultrún', color: '#7A3E91', claro: '#EDE0F2', oscuro: '#3A1748', simbolo: 'kultrún' },
];

// «Cada letra es una puerta»: los nueve mundos del municipio.
export const MUNDOS = [
  { url: '/turismo/', nombre: 'Turismo', texto: 'Volcanes, glaciares, lagunas y bosques de araucarias: Melipeuco, Capital del Trekking.' },
  { url: '/municipio/', nombre: 'Municipio', texto: 'Alcaldía, Concejo Municipal y las personas que trabajan cada día por la comuna.' },
  { url: '/salud/', nombre: 'Salud', texto: 'CESFAM, postas rurales, horas médicas y programas para cuidar a cada familia.' },
  { url: '/medioambiente/', nombre: 'Medio ambiente', texto: 'Reciclaje, leña seca, tenencia responsable y el cuidado de la Reserva de la Biósfera.' },
  { url: '/social/', nombre: 'Desarrollo social', texto: 'Registro Social de Hogares, subsidios, ayudas sociales y programas para la comunidad.' },
  { url: '/tramites/', nombre: 'Trámites', texto: 'Licencias, patentes, permisos y certificados: en línea o en el municipio, sin filas.' },
  { url: '/udel/', nombre: 'Desarrollo local', texto: 'Fomento productivo, agricultores, PDTI, emprendimiento y turismo rural.' },
  { url: '/educacion/', nombre: 'Educación', texto: 'Escuelas, liceo y jardines de la comuna, con matrícula, becas y noticias.' },
  { url: '/eventos/', nombre: 'Cultura y agenda', texto: 'Fiestas costumbristas, cultura mapuche pehuenche y todas las actividades del mes.' },
];

// Zona (letra) de cada página según su dirección: da el color y el emblema del encabezado.
const ZONAS_URL = [
  [/^\/(turismo|descubremelipeuco|lugares)/, 0], [/^\/(municipio|alcaldia|concejo|areas|organigrama|pladeco|historia|transparencia|logotipos)/, 1],
  [/^\/salud/, 2], [/^\/(medioambiente|boxveterinario)/, 3], [/^\/(social|oirs|comitebienestar)/, 4],
  [/^\/(tramites|reservadehora|transito|juzgado|licencias)/, 5], [/^\/(udel|deporte|transportepublico)/, 6],
  [/^\/(educacion|documentos|buscar)/, 7], [/^\/(eventos|agenda|cultura)/, 8], [/^\/(noticias|categoria|etiqueta|\d{4}\/)/, 1], [/^\/contacto/, 4],
];
export function zonaDe(ruta = '/') {
  const z = ZONAS_URL.find(([r]) => r.test(ruta));
  return z ? z[1] : 0;
}
export const estiloZona = (k) => { const p = PALETA[k]; return `--z:${p.color};--z-claro:${p.claro};--z-oscuro:${p.oscuro}`; };

// Una letra como imagen (archivo SVG cacheado por el navegador).
export const emblema = (k, clase = '', alt = '') => `<img class="emblema ${clase}" src="/img/trekking/emblema-${k}.svg" alt="${alt}" width="${Math.round(partes.letras[k].caja[2])}" height="${Math.round(partes.letras[k].caja[3])}" loading="lazy" decoding="async">`;

// Logo completo en línea, letra por letra y con cada símbolo separado en sus piezas, para que
// public/js/logo-vivo.js lo anime («logo vivo») o el CSS lo haga caer letra por letra.
const simbolos = JSON.parse(fs.readFileSync(new URL('./logo-simbolos.json', import.meta.url), 'utf8'));
let cacheLogo = '';
export function logoAnimado() {
  if (cacheLogo) return cacheLogo;
  const f = (n) => Number(n).toFixed(1);
  const letras = partes.letras.map((l, i) => {
    const [x, y, w, h] = l.caja;
    const piezas = simbolos[i].map((p) => `<path class="tk-pieza" data-cx="${f(p.cx)}" data-cy="${f(p.cy)}" data-w="${f(p.w)}" data-h="${f(p.h)}" d="${p.d}"/>`).join('');
    return `<g class="tk-letra" data-k="${i}" data-caja="${[x, y, w, h].map(f).join(' ')}" style="--i:${i};transform-origin:${f(x + w / 2)}px ${f(y + h)}px"><path class="tk-fondo" fill="${PALETA[i].color}" d="${l.fondo}"/><g class="tk-simbolo" fill="#FFF8EC" style="transform-origin:${f(x + w / 2)}px ${f(y + h / 2)}px">${piezas}</g></g>`;
  }).join('');
  cacheLogo = `<svg class="tk-logo" viewBox="0 0 1036 265" role="img" aria-label="Melipeuco Capital del Trekking" xmlns="http://www.w3.org/2000/svg"><title>Melipeuco Capital del Trekking</title>${letras}<g class="tk-lema" fill="currentColor">${partes.lema.map((d) => `<path class="tk-lema-letra" d="${d}"/>`).join('')}</g></svg>`;
  return cacheLogo;
}

// Siluetas de cordillera en capas (la del frente toma el color de la sección siguiente).
export function montes(color = 'var(--fondo)', clase = 'tk-montes') {
  return `<svg class="${clase}" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
    <path class="tk-monte" data-capa="-0.12" fill="${color}" fill-opacity=".28" d="M0 170 L90 120 L150 140 L240 70 L300 105 L360 80 L420 120 L520 40 L600 100 L680 86 L760 130 L860 60 L930 95 L1000 72 L1080 118 L1180 50 L1260 100 L1330 84 L1440 120 V260 H0Z"/>
    <path class="tk-monte" data-capa="-0.06" fill="${color}" fill-opacity=".55" d="M0 200 L120 150 L200 175 L300 120 L380 160 L470 128 L560 170 L650 118 L720 150 L820 110 L900 160 L990 130 L1080 168 L1170 120 L1260 160 L1350 140 L1440 170 V260 H0Z"/>
    <path fill="${color}" d="M0 236 L80 214 L160 228 L260 196 L340 222 L440 200 L540 230 L640 206 L720 226 L820 198 L920 228 L1020 206 L1120 230 L1220 204 L1320 226 L1440 210 V260 H0Z"/>
  </svg>`;
}

// Crestas para la transición entre páginas (una por capa).
const CRESTAS = [
  'M0 140V88L96 52L170 76L262 22L338 64L420 40L512 86L604 30L690 70L786 12L872 58L958 36L1046 80L1140 26L1232 66L1330 42L1440 72V140Z',
  'M0 140V70L84 96L176 44L254 82L350 54L436 98L528 38L622 74L700 50L800 92L884 28L980 72L1066 48L1160 90L1250 40L1350 78L1440 56V140Z',
  'M0 140V60L110 34L190 70L290 18L372 58L460 30L560 76L650 20L748 62L840 44L930 84L1030 24L1118 64L1210 32L1300 74L1384 46L1440 64V140Z',
];
// Las zonas viajan en la cortina para que el navegador sepa el color de la página de destino.
const atributo = (v) => JSON.stringify(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function cortinaCordillera() {
  const datos = { rutas: ZONAS_URL.map(([r, k]) => [r.source, k]), paleta: PALETA.map((p) => [p.color, p.oscuro]) };
  return `<div class="tk-cortina" aria-hidden="true" data-zonas="${atributo(datos)}">${CRESTAS.map((d) => `<div class="tk-cortina-capa"><svg viewBox="0 0 1440 140" preserveAspectRatio="none"><path d="${d}"/></svg></div>`).join('')}<div class="tk-cortina-info">${PALETA.map((_, k) => `<img src="/img/trekking/emblema-${k}.svg" alt="" data-k="${k}" hidden>`).join('')}<span class="tk-cortina-nombre"></span></div></div>`;
}

// Atractivos destacados del sitio de turismo (fotos optimizadas en /img/trekking/).
export const LUGARES = [
  { nombre: 'Volcán Llaima', tipo: 'Volcán', img: 'volcan-llaima', url: 'actividad-atractivo/volcan-llaima/', k: 0, texto: 'El gran volcán de la Araucanía, guardián de Melipeuco y del Parque Nacional Conguillío.' },
  { nombre: 'Parque Nacional Conguillío', tipo: 'Área silvestre protegida', img: 'conguillio', url: 'actividad-atractivo/parque-nacional-conguillio/', k: 3, texto: 'Bosques milenarios de araucarias, lagos de aguas cristalinas y coladas de lava.' },
  { nombre: 'Nevados de Sollipulli', tipo: 'Volcán y glaciar', img: 'sollipulli', url: 'actividad-atractivo/nevados-de-sollipulli/', k: 7, texto: 'Un glaciar dentro del cráter de un volcán: un paisaje único en el mundo.' },
  { nombre: 'Salto del Truful Truful', tipo: 'Caída de agua', img: 'truful-truful', url: 'actividad-atractivo/salto-del-truful-truful/', k: 2, texto: 'El río Truful Truful cae entre estratos de colores que cuentan la historia del volcán.' },
  { nombre: 'Laguna Arcoíris', tipo: 'Laguna', img: 'laguna-arcoiris', url: 'actividad-atractivo/laguna-arcoiris/', k: 2, texto: 'Aguas turquesa sobre un bosque sumergido, a pasos del sendero.' },
  { nombre: 'Obsidianas de Molulco', tipo: 'Ruta familiar · 12 km', img: 'molulco', url: 'ruta-de-trekking/obsidianas-de-molulco/', k: 0, texto: 'Una ruta familiar entre piedras volcánicas negras que brillan como vidrio.' },
  { nombre: 'Laguna de Icalma', tipo: 'Laguna', img: 'icalma', url: 'actividad-atractivo/laguna-de-icalma/', k: 8, texto: 'Territorio pehuenche a los pies de la cordillera, junto al paso fronterizo.' },
  { nombre: 'Astroturismo', tipo: 'Experiencia nocturna', img: 'astrotour', url: 'actividad-atractivo/astrotour/', k: 7, texto: 'Cielos limpios y oscuros para mirar la Vía Láctea desde la montaña.' },
];

export const CINTA = ['Volcanes', 'Glaciares', 'Araucarias', 'Lagunas', 'Cascadas', 'Termas', 'Estrellas', 'Kultrún', 'Senderos'];

export const CIFRAS = [
  { numero: 3, sufijo: '', texto: 'volcanes: Llaima, Sollipulli y Sierra Nevada' },
  { numero: 250, sufijo: ' km', texto: 'de senderos' },
  { numero: 44, sufijo: '', texto: 'rutas de trekking para todos los niveles' },
  { numero: 45, sufijo: '%', texto: 'de la comuna son áreas silvestres protegidas' },
];

// Contenido de la identidad editable en Ajustes del sitio → Portada (lo que falta se completa
// con lo predeterminado). Los lugares guardan su dirección completa y su imagen.
export function contenidoTrekking(ajustes = {}) {
  const t = ajustes.trekking || {};
  const base = (ajustes.turismo?.url || SITIO_TREKKING).replace(/\/?$/, '/');
  const lugares = LUGARES.map((l) => ({ nombre: l.nombre, tipo: l.tipo, texto: l.texto, imagen: `/img/trekking/lugar-${l.img}.webp`, url: base + l.url, letra: l.k }));
  const lista = (v) => (Array.isArray(v) && v.length ? v : null);
  return {
    cinta: lista(t.cinta) || CINTA,
    mundos: MUNDOS.map((m, k) => ({ ...m, ...Object.fromEntries(Object.entries(t.mundos?.[k] || {}).filter(([, v]) => v)) })),
    lugares: lista(t.lugares) || lugares,
    cifras: lista(t.cifras) || CIFRAS,
  };
}
