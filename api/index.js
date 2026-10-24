// Función de Vercel: ejecuta el mismo servidor del sitio (server/server.js) para todas las
// rutas que no son archivos estáticos (ver vercel.json). La base se crea en /tmp al iniciar
// la instancia, cargando el contenido importado del sitio anterior.
//
// Importante: en Vercel el disco es efímero y puede haber varias instancias, así que los
// cambios hechos en el panel no son permanentes. Sirve para mostrar el sitio; para operar
// el panel use un servidor con disco persistente (docs/DESPLIEGUE.md).

import { iniciar } from '../server/server.js';

let app = null;

export default async function handler(req, res) {
  try {
    app ||= iniciar({ sinRespaldos: true, silencioso: true });
    const a = await app;
    return a.manejar(req, res);
  } catch (e) {
    app = null;
    console.error('No se pudo iniciar el sitio:', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('El sitio no pudo iniciar. Revise los registros de la función en Vercel.');
  }
}
