#!/usr/bin/env node
// Preparación para Vercel: copia a «estatico/» los archivos que Vercel sirve directamente
// desde su CDN (estilos, scripts, imágenes y módulos del panel). Todo lo demás (páginas,
// panel, API) lo responde la función api/index.js. La página del panel (admin/index.html)
// no se copia: la entrega el servidor para agregarle las cabeceras de seguridad.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(RAIZ, 'estatico');
fs.rmSync(destino, { recursive: true, force: true });
for (const dir of ['css', 'js', 'img', 'admin']) {
  fs.cpSync(path.join(RAIZ, 'public', dir), path.join(destino, dir), { recursive: true, filter: (f) => !f.endsWith(path.join('admin', 'index.html')) });
}
const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor < 22 || (mayor === 22 && menor < 5)) throw new Error(`Se necesita Node 22.5 o superior (Vercel usa ${process.versions.node}). Elija Node 22.x o superior en Settings → General → Node.js Version.`);
console.log('Archivos estáticos listos en estatico/ · Node', process.versions.node);
