// Genera public/img/paisaje.svg: el mismo paisaje de la portada (server/render/paisaje.js)
// como archivo autónomo, con la paleta nocturna incluida. Lo usa la pantalla de ingreso del
// panel. Ejecutar de nuevo si cambia el dibujo: node herramientas/generar-paisaje.js
import fs from 'node:fs';
import path from 'node:path';
import { paisaje } from '../server/render/paisaje.js';
import { RAIZ } from '../server/config.js';

const css = fs.readFileSync(path.join(RAIZ, 'public/css/sitio.css'), 'utf8');
// Variables de la noche y reglas del paisaje (.pz-*, .nube) con sus animaciones.
const noche = css.match(/:root\[data-momento="noche"\] \{[^}]*\}/)[0].replace(':root[data-momento="noche"]', 'svg');
const reglas = css.split('\n').filter((l) => /^\.(pz-|nube|paisaje)/.test(l)).join('\n');
const animaciones = ['titilar', 'deriva', 'mecer', 'fumarola', 'brillo', 'levantar']
  .map((k) => css.match(new RegExp(`@keyframes ${k} \\{.*\\}`))?.[0]).filter(Boolean).join('\n');
const estilo = `${noche}\n${reglas}\n${animaciones}\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; } .pz-humo circle { opacity: .35; } }`;
const svg = paisaje()
  .replace('<svg class="paisaje"', '<svg xmlns="http://www.w3.org/2000/svg" class="paisaje"')
  .replace(' aria-hidden="true" focusable="false"', '')
  .replace('<defs>', `<style>${estilo.replace(/</g, '')}</style>\n  <defs>`);
fs.writeFileSync(path.join(RAIZ, 'public/img/paisaje.svg'), svg);
console.log('public/img/paisaje.svg', (svg.length / 1024).toFixed(1), 'KB');
