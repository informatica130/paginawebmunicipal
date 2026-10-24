// Ilustraciones vectoriales del sitio, generadas en el servidor:
//  · paisaje(): el volcán Llaima con fumarola, cordones, araucarias y laguna. Los colores
//    salen de variables CSS que cambian con la hora real de Melipeuco (madrugada, amanecer,
//    día, atardecer, noche), así la portada nunca se ve igual a las 8 que a las 22.
//  · cresta(): borde de cordillera entre secciones.
//  · curvasDeNivel(): textura topográfica (Melipeuco, capital del trekking).
//  · emblemaAnimado(): el escudo municipal vectorizado, que se dibuja trazo a trazo.
//  · franjaTextil(): guarda de rombos escalonados como la del escudo.

import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from '../config.js';

// Generador pseudoaleatorio determinista: el dibujo es idéntico en cada carga.
function azar(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const n = (v) => Math.round(v * 10) / 10;

// Cordón montañoso: línea irregular entre dos alturas.
function cordon(r, { y, amplitud, pasos, ancho = 1600, base = 900 }) {
  let d = `M0 ${base} L0 ${n(y + (r() - 0.5) * amplitud)}`;
  for (let i = 1; i <= pasos; i++) {
    const x = (ancho / pasos) * i;
    const yy = y + (r() - 0.5) * amplitud * (i % 2 ? 1 : 0.55);
    d += ` Q${n(x - ancho / pasos / 2)} ${n(yy - amplitud * 0.35 * r())} ${n(x)} ${n(yy)}`;
  }
  return d + ` L${ancho} ${base}Z`;
}

// Araucaria: tronco recto y copa en forma de paraguas con ramas escalonadas.
function araucaria(x, base, alto, r) {
  const tronco = alto * 0.035 + 1.5;
  const copaInicio = base - alto * (0.55 + r() * 0.12);
  let d = `M${n(x - tronco / 2)} ${base}L${n(x - tronco * 0.35)} ${n(base - alto)}L${n(x + tronco * 0.35)} ${n(base - alto)}L${n(x + tronco / 2)} ${base}Z`;
  const pisos = 4 + Math.floor(r() * 3);
  const anchoMax = alto * (0.28 + r() * 0.1);
  for (let i = 0; i < pisos; i++) {
    const t = i / (pisos - 1);
    const yy = copaInicio - (base - alto - copaInicio) * -t;
    const w = anchoMax * (0.55 + 0.45 * Math.sin(Math.PI * (0.25 + t * 0.6))) * (i === pisos - 1 ? 0.55 : 1);
    const caida = alto * 0.035;
    // Cada piso: dos ramas curvas que caen hacia afuera (forma de candelabro).
    d += `M${n(x)} ${n(yy)}Q${n(x - w * 0.55)} ${n(yy - caida * 1.6)} ${n(x - w)} ${n(yy + caida)}Q${n(x - w * 0.55)} ${n(yy - caida * 0.2)} ${n(x)} ${n(yy + caida * 0.9)}Z`;
    d += `M${n(x)} ${n(yy)}Q${n(x + w * 0.55)} ${n(yy - caida * 1.6)} ${n(x + w)} ${n(yy + caida)}Q${n(x + w * 0.55)} ${n(yy - caida * 0.2)} ${n(x)} ${n(yy + caida * 0.9)}Z`;
  }
  const cimaY = base - alto;
  d += `M${n(x - anchoMax * 0.35)} ${n(cimaY + alto * 0.05)}Q${n(x)} ${n(cimaY - alto * 0.06)} ${n(x + anchoMax * 0.35)} ${n(cimaY + alto * 0.05)}Q${n(x)} ${n(cimaY + alto * 0.03)} ${n(x - anchoMax * 0.35)} ${n(cimaY + alto * 0.05)}Z`;
  return d;
}

let cachePaisaje = null;
export function paisaje() {
  if (cachePaisaje) return cachePaisaje;
  const r = azar(1972); // año de la Municipalidad
  const estrellas = Array.from({ length: 70 }, (_, i) => `<circle cx="${n(r() * 1600)}" cy="${n(r() * 380)}" r="${n(0.6 + r() * 1.6)}" style="--d:${n(r() * 4)}s"/>`).join('');
  // Volcán Llaima: cono asimétrico con el cráter levemente desplazado.
  const volcan = 'M520 900 L760 560 Q880 380 958 262 L972 252 L1004 251 L1020 262 Q1100 380 1230 560 L1520 900Z';
  const nieve = 'M958 262 L972 252 L1004 251 L1020 262 Q1055 316 1090 372 L1068 360 L1050 384 L1030 354 L1008 380 L990 352 L968 382 L948 356 L926 378 L908 352 Q930 312 958 262Z';
  const surcos = Array.from({ length: 7 }, (_, i) => { const x = 930 + i * 22; return `M${x} ${300 + i * 6}Q${x - 30 + i * 9} ${470} ${x - 70 + i * 22} ${640}`; }).join('');
  const lejos = cordon(azar(3), { y: 520, amplitud: 90, pasos: 9 });
  const medio = cordon(azar(7), { y: 610, amplitud: 70, pasos: 12 });
  const cerca = cordon(azar(11), { y: 700, amplitud: 50, pasos: 14 });
  const bosque = [];
  const rb = azar(42);
  for (let i = 0; i < 26; i++) {
    const x = (i / 26) * 1640 - 20 + rb() * 40;
    if (x > 560 && x < 1050 && rb() < 0.7) continue; // claro frente a la laguna
    bosque.push(araucaria(x, 770 + rb() * 30, 90 + rb() * 120, rb));
  }
  const cercanas = [araucaria(140, 905, 330, azar(5)), araucaria(1490, 905, 290, azar(9)), araucaria(1330, 905, 200, azar(13)), araucaria(290, 905, 180, azar(17))];
  const humo = Array.from({ length: 6 }, (_, i) => `<circle cx="988" cy="246" r="${14 + i * 3}" style="--i:${i}"/>`).join('');
  const nubes = [[180, 170, 1.1], [620, 120, 0.8], [1250, 190, 1.3], [1480, 110, 0.7]].map(([x, y, e], i) => `<g class="nube" style="--i:${i}" transform="translate(${x} ${y}) scale(${e})"><ellipse cx="0" cy="0" rx="90" ry="22"/><ellipse cx="-38" cy="-14" rx="44" ry="26"/><ellipse cx="22" cy="-22" rx="52" ry="32"/><ellipse cx="66" cy="-6" rx="38" ry="20"/></g>`).join('');
  const brillos = Array.from({ length: 18 }, (_, i) => { const y = 820 + (i % 6) * 13; const x = 300 + ((i * 197) % 1000); return `<path d="M${x} ${y}h${40 + (i % 4) * 22}" style="--i:${i}"/>`; }).join('');
  cachePaisaje = `<svg class="paisaje" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="pz-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cielo-1)"/><stop offset=".62" style="stop-color:var(--cielo-2)"/><stop offset="1" style="stop-color:var(--cielo-3)"/></linearGradient>
    <linearGradient id="pz-agua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cielo-3)"/><stop offset="1" style="stop-color:var(--agua)"/></linearGradient>
    <linearGradient id="pz-volcan" x1="0" y1="0" x2="1" y2="0"><stop offset=".45" style="stop-color:var(--volcan-luz)"/><stop offset=".62" style="stop-color:var(--volcan-sombra)"/></linearGradient>
    <radialGradient id="pz-astro"><stop offset="0" style="stop-color:var(--astro)"/><stop offset=".35" style="stop-color:var(--astro);stop-opacity:.85"/><stop offset="1" style="stop-color:var(--astro);stop-opacity:0"/></radialGradient>
    <filter id="pz-difuso" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <clipPath id="pz-laguna"><rect x="0" y="808" width="1600" height="92"/></clipPath>
  </defs>
  <rect class="pz-cielo" width="1600" height="900" fill="url(#pz-cielo)"/>
  <g class="pz-estrellas">${estrellas}</g>
  <g class="pz-astro"><circle cx="0" cy="0" r="110" fill="url(#pz-astro)"/><circle cx="0" cy="0" r="30" class="pz-disco"/></g>
  <g class="pz-nubes">${nubes}</g>
  <path class="pz-lejos" d="${lejos}"/>
  <g class="pz-volcan">
    <g class="pz-humo" filter="url(#pz-difuso)">${humo}</g>
    <path d="${volcan}" fill="url(#pz-volcan)"/>
    <path class="pz-nieve" d="${nieve}"/>
    <path class="pz-surcos" d="${surcos}"/>
  </g>
  <path class="pz-medio" d="${medio}"/>
  <path class="pz-cerca" d="${cerca}"/>
  <path class="pz-bosque" d="${bosque.join('')}"/>
  <rect class="pz-laguna" x="0" y="808" width="1600" height="92" fill="url(#pz-agua)"/>
  <g clip-path="url(#pz-laguna)"><g class="pz-reflejo" transform="translate(0 1616) scale(1 -1)"><path d="${volcan}"/><path class="pz-nieve" d="${nieve}"/></g></g>
  <g class="pz-brillos">${brillos}</g>
  <path class="pz-primer-plano" d="M0 900 L0 840 Q200 812 420 842 Q520 856 600 900Z M1600 900 L1600 830 Q1400 806 1180 846 Q1100 862 1040 900Z"/>
  <path class="pz-cercanas" d="${cercanas.join('')}"/>
</svg>`;
  return cachePaisaje;
}

// Borde de cordillera para separar secciones (se superpone a la sección anterior).
export function cresta(clase = '') {
  return `<svg class="cresta ${clase}" viewBox="0 0 1600 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 60 L0 38 L120 22 L210 34 L330 8 L410 28 L520 18 L600 36 L720 12 L790 24 L880 6 L960 30 L1080 16 L1170 34 L1260 14 L1350 28 L1460 10 L1540 26 L1600 20 L1600 60Z"/></svg>`;
}

let cacheCurvas = null;
export function curvasDeNivel() {
  if (cacheCurvas) return cacheCurvas;
  const r = azar(2026);
  const centros = [[260, 180], [1180, 420], [700, 560]];
  let d = '';
  for (const [cx, cy] of centros) {
    for (let k = 1; k <= 9; k++) {
      const rad = k * 34 + r() * 10;
      const pts = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; const v = rad * (0.82 + r() * 0.3); return [cx + Math.cos(a) * v * 1.5, cy + Math.sin(a) * v]; });
      d += `M${n(pts[0][0])} ${n(pts[0][1])}` + pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return ` Q${n(p[0])} ${n(p[1])} ${n((p[0] + q[0]) / 2)} ${n((p[1] + q[1]) / 2)}`; }).join('') + 'Z';
    }
  }
  cacheCurvas = `<svg class="curvas" viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  return cacheCurvas;
}

// Guarda textil de rombos escalonados (como la franja del escudo).
export function franjaTextil(clase = '') {
  return `<svg class="franja-textil ${clase}" aria-hidden="true" focusable="false" width="100%" height="18"><defs><pattern id="ft-rombo" width="36" height="18" patternUnits="userSpaceOnUse"><path d="M18 1 L27 9 L18 17 L9 9Z M18 5 L23 9 L18 13 L13 9Z" fill-rule="evenodd"/><path d="M0 9 L4 5 L8 9 L4 13Z M28 9 L32 5 L36 9 L32 13Z"/></pattern></defs><rect width="100%" height="18" fill="url(#ft-rombo)"/></svg>`;
}

let cacheEmblema = null;
export function emblemaAnimado(etiqueta = 'Escudo de la Municipalidad de Melipeuco') {
  if (!cacheEmblema) {
    const datos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/emblema-trazos.json'), 'utf8'));
    const [x0, y0, w, h] = datos.viewBox.split(' ').map(Number);
    // Sólo se dibujan los 40 contornos más largos, con coordenadas enteras (a 100 px de
    // ancho no se nota) para no recargar la portada; el relleno es la imagen SVG en caché.
    const trazos = [...datos.trazos].sort((p, q) => q.t - p.t).slice(0, 40);
    const entero = (d) => d.replace(/-?\d+\.\d+/g, (v) => String(Math.round(Number(v))));
    cacheEmblema = { viewBox: datos.viewBox, x0, y0, w, h, lineas: trazos.map((t) => `<path d="${entero(t.d)}" pathLength="1" style="--r:${n((t.cy - y0) / h)}"/>`).join('') };
  }
  const e = cacheEmblema;
  return `<svg class="emblema-animado" viewBox="${e.viewBox}" role="img" aria-label="${etiqueta}"><g class="ea-lineas">${e.lineas}</g><image class="ea-relleno" href="/img/emblema-crema.svg" x="${e.x0}" y="${e.y0}" width="${e.w}" height="${e.h}"/></svg>`;
}

// Momento del día en Melipeuco según la hora local.
export function momentoDelDia(fecha = new Date()) {
  const h = Number(new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', hour: 'numeric', hourCycle: 'h23' }).format(fecha));
  if (h >= 21 || h < 6) return 'noche';
  if (h < 9) return 'amanecer';
  if (h < 18) return 'dia';
  return 'atardecer';
}
