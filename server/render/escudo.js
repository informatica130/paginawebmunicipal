// Escudo de la Municipalidad de Melipeuco «vivo»: dibujado en línea con sus piezas por separado
// (de public/img/escudo-piezas.svg, generado con herramientas/piezas-escudo.py) para animarlas
// en la cabecera y el pie (public/js/escudo-vivo.js) y en la pantalla de carga 3D.
// El color viene de `currentColor`, así sirve en cabeceras claras, oscuras y de color.
import { PIEZAS } from './intro.js';

const TEXTOS = new Set(['municipalidad', 'cinta', 'chile']);

export function escudoVivo({ completo = false, clase = '', titulo = 'Escudo de la Municipalidad de Melipeuco' } = {}) {
  const piezas = PIEZAS.filter(([n]) => completo || !TEXTOS.has(n));
  return `<svg class="escudo-vivo ${clase}" viewBox="${completo ? '20 -4 470 481' : '20 -4 470 380'}" role="img" aria-label="${titulo}" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><title>${titulo}</title>${piezas.map(([n, o]) => `<use class="ev-pz" href="/img/escudo-piezas.svg#pz-${n}" data-pieza="${n}" style="transform-origin:${o}"/>`).join('')}</svg>`;
}
