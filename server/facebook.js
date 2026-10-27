// Publicaciones públicas de la página de Facebook de la Municipalidad, convertidas en noticias.
//
// El paquete contenido/facebook/noticias.json trae título, cuerpo, fecha, categorías y fotos
// (servidas desde /img/facebook/). Importar sólo agrega lo que falta: cada publicación lleva su
// clave en url_antigua («facebook:fb-…»), así que repetir la importación no duplica nada y lo
// que el equipo ya editó o eliminó a mano no se vuelve a tocar.

import fs from 'node:fs';
import { RAIZ } from './config.js';

const ARCHIVO = `${RAIZ}/contenido/facebook/noticias.json`;
const FUENTE = 'Publicación de la página de Facebook de la Municipalidad';

export function paqueteFacebook() {
  try { return JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); } catch { return { noticias: [] }; }
}

export function importarFacebook(db, repo, { paquete = paqueteFacebook(), usuario = null } = {}) {
  const r = { creados: 0, omitidos: 0, total: paquete.noticias.length };
  db.tx(() => {
    for (const n of paquete.noticias) {
      const marca = 'facebook:' + n.clave;
      if (db.get('SELECT id FROM contenidos WHERE url_antigua = ?', marca)) { r.omitidos++; continue; }
      const taxonomias = (n.categorias || []).map((slug) => db.get("SELECT id FROM taxonomias WHERE tipo = 'categoria' AND slug = ?", slug)?.id).filter(Boolean);
      repo.guardar({
        tipo: 'noticia', titulo: n.titulo, resumen: n.resumen, cuerpo: n.cuerpo, estado: 'publicado', publicado_en: n.publicado_en,
        imagen: n.imagen, datos: { galeria: n.galeria || [], fuente: FUENTE }, taxonomias, url_antigua: marca,
        creado: new Date(n.publicado_en).toISOString(), modificado: new Date(n.publicado_en).toISOString(),
      }, { usuario, revision: false, conservarFechas: true });
      r.creados++;
    }
  });
  return r;
}
