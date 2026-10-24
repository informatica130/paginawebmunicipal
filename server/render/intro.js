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

let cache = '';
export function plantillaIntro() {
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
export const SCRIPT_INTRO = `(function(){try{var d=document.documentElement,mm=window.matchMedia;if(sessionStorage.getItem('mlp-intro')||(mm&&mm('(prefers-reduced-motion: reduce)').matches))return;sessionStorage.setItem('mlp-intro','1');if(!d.dataset.tema&&mm&&mm('(prefers-color-scheme: dark)').matches)d.dataset.tema='oscuro';var t=document.getElementById('intro-plantilla'),n=t.content.firstElementChild.cloneNode(true);if(d.dataset.tema==='oscuro')n.querySelectorAll('image').forEach(function(i){i.setAttribute('href',i.getAttribute('href').replace('-azul','-crema'))});document.body.prepend(n);d.classList.add('con-intro');setTimeout(function(){var i=document.querySelector('.intro');if(i&&!i.dataset.activa){i.remove();d.classList.remove('con-intro')}},4500)}catch(e){}})();`;
