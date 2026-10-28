// Publicaciones públicas de la página de Facebook de la Municipalidad, convertidas en noticias
// y en eventos pasados de la agenda.
//
// El paquete contenido/facebook/noticias.json trae título, cuerpo, fecha, categorías y fotos
// (servidas desde /img/facebook/). Las noticias vienen de las publicaciones y de los álbumes con
// texto; los eventos, de los álbumes de fiestas y actividades (con enlace a sus fotos en /fotos/).
// Importar sólo agrega lo que falta: cada elemento lleva su clave en url_antigua
// («facebook:fb-…»), así que repetir la importación no duplica nada y lo que el equipo ya editó
// o eliminó a mano no se vuelve a tocar.

import fs from 'node:fs';
import { RAIZ } from './config.js';

const ARCHIVO = `${RAIZ}/contenido/facebook/noticias.json`;
const FUENTE = 'Publicación de la página de Facebook de la Municipalidad';

export function paqueteFacebook() {
  try { return { eventos: [], ...JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')) }; } catch { return { noticias: [], eventos: [] }; }
}

export function importarFacebook(db, repo, { paquete = paqueteFacebook(), usuario = null } = {}) {
  const eventos = paquete.eventos || [];
  const r = { creados: 0, omitidos: 0, total: paquete.noticias.length + eventos.length, eventos: 0 };
  const categorias = (slugs) => (slugs || []).map((slug) => db.get("SELECT id FROM taxonomias WHERE tipo = 'categoria' AND slug = ?", slug)?.id).filter(Boolean);
  db.tx(() => {
    for (const n of [...paquete.noticias.map((x) => ({ ...x, tipo: 'noticia' })), ...eventos.map((x) => ({ ...x, tipo: 'evento' }))]) {
      const marca = 'facebook:' + n.clave;
      if (db.get('SELECT id FROM contenidos WHERE url_antigua = ?', marca)) { r.omitidos++; continue; }
      const datos = n.tipo === 'evento'
        ? { inicio: n.inicio, fin: '', todoElDia: true, lugar: n.lugar || 'Melipeuco', direccion: '' }
        : { galeria: n.galeria || [], fuente: FUENTE };
      repo.guardar({
        tipo: n.tipo, titulo: n.titulo, resumen: n.resumen, cuerpo: n.cuerpo, estado: 'publicado', publicado_en: n.publicado_en,
        imagen: n.imagen, datos, taxonomias: categorias(n.categorias), url_antigua: marca,
        creado: new Date(n.publicado_en).toISOString(), modificado: new Date(n.publicado_en).toISOString(),
      }, { usuario, revision: false, conservarFechas: true });
      r.creados++;
      if (n.tipo === 'evento') r.eventos++;
    }
  });
  return r;
}
