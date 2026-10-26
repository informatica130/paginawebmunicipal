// Pantalla de carga de la portada: el escudo se arma pieza por pieza y luego vuela al logo
// de la cabecera. Cada elemento (aves, araucarias, volcán, kultrún, trutrucas, laureles con
// copihues y cinta) entra a su manera y al terminar todos calzan exactamente. La anima
// public/js/movimiento.js; sólo se muestra la primera vez por sesión, se salta con un clic
// o una tecla y no aparece con «reducir movimiento».

// Cada pieza es un grupo de public/img/escudo-piezas.svg (generado con
// herramientas/piezas-escudo.py a partir del escudo vectorial), con el punto desde donde
// crece o gira: [nombre, origen de la transformación dentro de su propia caja].
export const PIEZAS = [
  ['paisaje', '50% 100%'], ['arbol-i', '10% 66%'], ['arbol-d', '87% 66%'], ['aves', '50% 60%'],
  ['palo-i', '0% 0%'], ['palo-d', '100% 0%'], ['campana-i', '100% 0%'], ['campana-d', '0% 0%'],
  ['laurel-i', '85% 100%'], ['laurel-d', '15% 100%'], ['kultrun', '50% 42%'],
  ['municipalidad', '50% 50%'], ['cinta', '50% 50%'], ['chile', '50% 50%'],
];

// Variante «logo 3D»: la escena se llena en el navegador con las letras y piezas del logo de la
// portada (public/js/transiciones.js), así no se repite el dibujo del logo en el HTML.
const LOGO3D = `<template id="intro-plantilla"><div class="intro intro-3d intro-logo" aria-hidden="true" data-limite="7000" data-clase="con-intro-logo">
  <div class="il-fondo"></div>
  <div class="il-escena"></div>
  <div class="intro-barra"><span></span></div>
  <p class="intro-saltar">Toque o presione una tecla para saltar</p>
</div></template>`;

// Variante «escudo 3D»: cada pieza del escudo es una capa en el espacio (transiciones.js).
// Cajas de cada pieza en el dibujo (x, y, ancho, alto; medidas con getBBox) para que cada capa
// gire desde su propio punto de apoyo, expresado en % de la caja completa (20 -4 470 481).
const CAJAS = { chile: [168, 459, 181, 13.9], cinta: [55.1, 392, 403.2, 67.2], municipalidad: [162.2, 368.6, 192.4, 17], 'campana-i': [24, 289.1, 189.7, 82.8], 'campana-d': [296.7, 289.1, 189.6, 82.8], 'laurel-i': [89.1, 153, 73.2, 160.9], 'laurel-d': [348.4, 153.1, 73.3, 160.8], kultrun: [144.2, 120.4, 222.3, 173.9], 'palo-i': [24.2, 17.8, 138.1, 132], 'palo-d': [347.8, 18.2, 138, 131.7], 'arbol-i': [128.8, 22, 259.5, 118.3], 'arbol-d': [128.8, 22, 259.5, 118.3], paisaje: [128.8, 22, 259.5, 118.3], aves: [210, 0, 85.4, 44.9] };
const origen3d = (n, o) => {
  const [x, y, w, h] = CAJAS[n], [ox, oy] = o.split(' ').map((v) => parseFloat(v) / 100);
  return `${(((x + ox * w) - 20) / 4.7).toFixed(1)}% ${(((y + oy * h) + 4) / 4.81).toFixed(1)}%`;
};
const ESCUDO3D = `<template id="intro-plantilla"><div class="intro intro-3d intro-escudo3d" aria-hidden="true" data-limite="7000" data-clase="con-intro-escudo">
  <div class="il-fondo"></div>
  <div class="ie-escena"><div class="ie-escudo">${PIEZAS.map(([n, o]) => `<div class="ie-capa" data-pieza="${n}" style="transform-origin:${origen3d(n, o)}"><svg viewBox="20 -4 470 481" aria-hidden="true"><use href="/img/escudo-piezas.svg#pz-${n}"/></svg></div>`).join('')}</div></div>
  <div class="intro-barra"><span></span></div>
  <p class="intro-saltar">Toque o presione una tecla para saltar</p>
</div></template>`;

let cache = '';
export function plantillaIntro(estilo = 'escudo') {
  if (estilo === 'logo3d') return LOGO3D;
  if (estilo === 'escudo3d') return ESCUDO3D;
  if (cache) return cache;
  cache = `<template id="intro-plantilla"><div class="intro" aria-hidden="true">
  <div class="intro-escudo"><svg viewBox="20 -4 470 481" width="470" height="481">
    <g class="intro-ondas"><circle cx="38" cy="322" r="22"/><circle cx="38" cy="322" r="22"/><circle cx="472" cy="322" r="22"/><circle cx="472" cy="322" r="22"/></g>
    ${PIEZAS.map(([n, o]) => `<use class="pz" href="/img/escudo-piezas.svg#pz-${n}" data-pieza="${n}" style="transform-origin:${o}"/>`).join('')}
    <image class="intro-emblema" href="/img/emblema-azul.svg" x="20" y="-4" width="470" height="380"/>
  </svg></div>
  <div class="intro-barra"><span></span></div>
  <p class="intro-saltar">Toque o presione una tecla para saltar</p>
</div></template>`;
  return cache;
}

// Script en línea (con nonce) que inserta la pantalla antes del primer pintado.
export const SCRIPT_INTRO = `(function(){try{var d=document.documentElement,mm=window.matchMedia;var modo=d.getAttribute('data-intro')||'primera',forzar=/[?&]intro=1/.test(location.search);if(!forzar&&(/[?&]vista=diseno/.test(location.search)||modo==='nunca'||(modo==='primera'&&sessionStorage.getItem('mlp-intro'))||(mm&&mm('(prefers-reduced-motion: reduce)').matches)))return;sessionStorage.setItem('mlp-intro','1');if(!d.dataset.tema&&mm&&mm('(prefers-color-scheme: dark)').matches)d.dataset.tema='oscuro';var claro=d.dataset.tema==='oscuro'||/^(color|oscura)$/.test(d.getAttribute('data-cabecera')||'');var t=document.getElementById('intro-plantilla'),n=t.content.firstElementChild.cloneNode(true);if(claro)n.querySelectorAll('image').forEach(function(i){i.setAttribute('href',i.getAttribute('href').replace('-azul','-crema'))});document.body.prepend(n);d.classList.add('con-intro');if(n.getAttribute('data-clase'))d.classList.add(n.getAttribute('data-clase'));setTimeout(function(){var i=document.querySelector('.intro');if(i&&!i.dataset.activa){i.remove();d.classList.remove('con-intro','con-intro-logo','con-intro-escudo')}},Number(n.getAttribute('data-limite'))||4500)}catch(e){}})();`;
