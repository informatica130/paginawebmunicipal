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
for (const dir of ['css', 'js', 'img', 'fuentes', 'admin']) {
  fs.cpSync(path.join(RAIZ, 'public', dir), path.join(destino, dir), { recursive: true, filter: (f) => !f.endsWith(path.join('admin', 'index.html')) });
}
const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor < 22 || (mayor === 22 && menor < 5)) throw new Error(`Se necesita Node 22.5 o superior (Vercel usa ${process.versions.node}). Elija Node 22.x o superior en Settings → General → Node.js Version.`);
console.log('Archivos estáticos listos en estatico/ · Node', process.versions.node);

// Documentos de Transparencia: se generan aquí, en el servidor de Vercel, desde la carpeta
// pública de Drive indicada en TRANSPARENCIA_DRIVE (variable privada del proyecto). La lista no
// se guarda en el repositorio. Si falla, el sitio se publica igual (sin esa lista).
try {
  const { raizDesdeEntorno, generar, SALIDA } = await import('./transparencia-drive.js');
  const raiz = raizDesdeEntorno();
  if (!raiz) console.log('Transparencia: TRANSPARENCIA_DRIVE no está definida; se omite la lista de documentos.');
  else {
    const t0 = Date.now();
    const datos = await Promise.race([generar(raiz), new Promise((_, no) => setTimeout(() => no(new Error('tardó demasiado')), 12 * 60e3))]);
    if (datos.documentos.length && datos.fallidas <= 20) {
      fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
      fs.writeFileSync(SALIDA, JSON.stringify(datos));
      console.log(`Transparencia: ${datos.documentos.length} documentos en ${Math.round((Date.now() - t0) / 1000)} s.`);
    } else console.warn(`Transparencia: no se pudo leer bien la carpeta (${datos.fallidas} sin leer).`);
  }
} catch (e) { console.warn('Transparencia: no se generó la lista de documentos:', e.message); }
