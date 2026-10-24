// Repositorio de contenidos: lectura, guardado con validación según src/tipos.js,
// revisiones, índice de búsqueda, taxonomías y URLs públicas.

import { TIPOS, RUTAS, ESTADOS } from '../src/tipos.js';
import { filaContenido, ahora, parse } from './db.js';
import { sanitizarHtml } from './sanitizar.js';
import { slugify, textoPlano, recortar, hoyLocal, urlSegura } from '../src/util.js';

export class ErrorValidacion extends Error {
  constructor(msg, status = 400) { super(msg); this.status = status; }
}

export function crearRepositorio(db) {
  // ------------------------------------------------------------ Caché de rutas de páginas
  let mapaPaginas = null; // id -> { slug, padre_id }
  const invalidar = () => { mapaPaginas = null; cacheMenus.clear(); };
  const cacheMenus = new Map();
  function paginas() {
    if (!mapaPaginas) {
      mapaPaginas = new Map();
      for (const f of db.all("SELECT id, slug, padre_id, titulo, estado FROM contenidos WHERE tipo = 'pagina'")) mapaPaginas.set(f.id, f);
    }
    return mapaPaginas;
  }
  function rutaPagina(id) {
    const m = paginas();
    const partes = [];
    let p = m.get(id);
    let guard = 0;
    while (p && guard++ < 10) { partes.unshift(p.slug); p = p.padre_id ? m.get(p.padre_id) : null; }
    return '/' + partes.join('/') + '/';
  }

  function urlDe(c) {
    if (!c) return '/';
    if (c.tipo === 'pagina') return c.slug === 'inicio' && !c.padre_id ? '/' : rutaPagina(c.id);
    if (c.tipo === 'noticia') {
      const d = hoyLocal(new Date(c.publicado_en || c.creado));
      return `/${d.slice(0, 4)}/${d.slice(5, 7)}/${d.slice(8, 10)}/${c.slug}/`;
    }
    if (c.tipo === 'area') return RUTAS.area + c.slug + '/';
    if (TIPOS[c.tipo]?.sinPagina) return c.datos?.enlace || '/';
    return (RUTAS[c.tipo] || `/${c.tipo}/`) + c.slug + '/';
  }

  // Página por ruta: /a/b/c/ -> busca c cuyo padre es b cuyo padre es a.
  function paginaPorRuta(segmentos) {
    let padre = null;
    let fila = null;
    for (const s of segmentos) {
      fila = db.get("SELECT * FROM contenidos WHERE tipo = 'pagina' AND slug = ? AND ifnull(padre_id, 0) = ?", s, padre ?? 0);
      if (!fila) return null;
      padre = fila.id;
    }
    return filaContenido(fila);
  }

  // ------------------------------------------------------------ Lectura
  const obtener = (id) => filaContenido(db.get('SELECT * FROM contenidos WHERE id = ?', id));
  const porSlug = (tipo, slug) => filaContenido(db.get('SELECT * FROM contenidos WHERE tipo = ? AND slug = ? ORDER BY padre_id IS NOT NULL LIMIT 1', tipo, slug));

  const visible = (c) => c && c.estado === 'publicado' && (!c.publicado_en || c.publicado_en <= ahora());

  // Listado con filtros. `publico` limita a lo publicado.
  function listar({ tipo, estado, publico = false, q, categoria, taxonomia, area, padre, autor, destacado, desde, hasta, orden, limite = 20, pagina = 1, campos } = {}) {
    const w = [];
    const p = [];
    if (tipo) { w.push(Array.isArray(tipo) ? `c.tipo IN (${tipo.map(() => '?').join(',')})` : 'c.tipo = ?'); p.push(...[tipo].flat()); }
    if (publico) { w.push("c.estado = 'publicado' AND (c.publicado_en IS NULL OR c.publicado_en <= ?)"); p.push(ahora()); }
    else if (estado) { w.push('c.estado = ?'); p.push(estado); }
    else w.push("c.estado != 'papelera'");
    if (padre !== undefined) { w.push('ifnull(c.padre_id, 0) = ?'); p.push(padre || 0); }
    if (area) { w.push('c.area_id = ?'); p.push(area); }
    if (autor) { w.push('c.autor_id = ?'); p.push(autor); }
    if (destacado) w.push('c.destacado = 1');
    if (desde) { w.push('c.publicado_en >= ?'); p.push(desde); }
    if (hasta) { w.push('c.publicado_en < ?'); p.push(hasta); }
    const tax = taxonomia || categoria;
    if (tax) {
      const ids = Array.isArray(tax) ? tax : [tax];
      w.push(`c.id IN (SELECT contenido_id FROM contenido_taxonomia WHERE taxonomia_id IN (${ids.map(() => '?').join(',')}))`);
      p.push(...ids);
    }
    if (q) {
      const term = String(q).trim().slice(0, 100);
      if (term) { w.push('(c.titulo LIKE ? OR c.slug LIKE ?)'); p.push(`%${term}%`, `%${term}%`); }
    }
    const ord = {
      reciente: 'c.publicado_en DESC, c.id DESC',
      antiguo: 'c.publicado_en ASC, c.id ASC',
      orden: 'c.orden ASC, c.titulo COLLATE NOCASE ASC',
      titulo: 'c.titulo COLLATE NOCASE ASC',
      modificado: 'c.modificado DESC',
      evento: "json_extract(c.datos, '$.inicio') ASC",
      eventoDesc: "json_extract(c.datos, '$.inicio') DESC",
      sesion: "json_extract(c.datos, '$.fecha') DESC",
      documento: "coalesce(json_extract(c.datos, '$.fechaDoc'), c.publicado_en) DESC",
    }[orden || 'reciente'] || 'c.publicado_en DESC';
    const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
    const total = db.get(`SELECT count(*) n FROM contenidos c ${where}`, ...p).n;
    limite = Math.min(Math.max(1, Number(limite) || 20), 500);
    pagina = Math.max(1, Number(pagina) || 1);
    const sel = campos === 'resumen' ? 'c.id, c.tipo, c.slug, c.titulo, c.resumen, c.estado, c.publicado_en, c.autor_id, c.padre_id, c.area_id, c.orden, c.imagen, c.destacado, c.datos, c.modificado, c.creado, c.plantilla' : 'c.*';
    const filas = db.all(`SELECT ${sel} FROM contenidos c ${where} ORDER BY ${ord} LIMIT ? OFFSET ?`, ...p, limite, (pagina - 1) * limite).map(filaContenido);
    return { total, pagina, paginas: Math.max(1, Math.ceil(total / limite)), items: filas };
  }

  function eventosProximos(limite = 6) {
    const hoy = hoyLocal();
    return db.all(`SELECT * FROM contenidos WHERE tipo = 'evento' AND estado = 'publicado'
      AND coalesce(json_extract(datos, '$.fin'), json_extract(datos, '$.inicio')) >= ? ORDER BY json_extract(datos, '$.inicio') ASC LIMIT ?`, hoy, limite).map(filaContenido);
  }
  function eventosEntre(desde, hasta) {
    return db.all(`SELECT * FROM contenidos WHERE tipo = 'evento' AND estado = 'publicado'
      AND json_extract(datos, '$.inicio') < ? AND coalesce(json_extract(datos, '$.fin'), json_extract(datos, '$.inicio')) >= ? ORDER BY json_extract(datos, '$.inicio')`, hasta, desde).map(filaContenido);
  }

  // Avisos, banners y encuestas vigentes hoy.
  function vigentes(tipo) {
    const t = ahora();
    const d = hoyLocal();
    return listar({ tipo, publico: true, orden: tipo === 'aviso' ? 'reciente' : 'orden', limite: 50 }).items.filter((c) => {
      const desde = c.datos.desde || '';
      const hasta = c.datos.hasta || '';
      const ref = desde.length > 10 || hasta.length > 10 ? t : d;
      return (!desde || desde <= ref) && (!hasta || hasta >= ref.slice(0, hasta.length));
    });
  }

  // ------------------------------------------------------------ Taxonomías
  function taxonomiasDe(id) {
    return db.all('SELECT t.* FROM taxonomias t JOIN contenido_taxonomia ct ON ct.taxonomia_id = t.id WHERE ct.contenido_id = ? ORDER BY t.tipo, t.nombre', id);
  }
  function taxonomias(tipo) {
    return db.all(`SELECT t.*, (SELECT count(*) FROM contenido_taxonomia ct JOIN contenidos c ON c.id = ct.contenido_id
      WHERE ct.taxonomia_id = t.id AND c.estado = 'publicado') AS total FROM taxonomias t WHERE t.tipo = ? ORDER BY t.orden, t.nombre COLLATE NOCASE`, tipo);
  }
  function asegurarTaxonomia(tipo, nombre, extra = {}) {
    const slug = extra.slug || slugify(nombre);
    const f = db.get('SELECT * FROM taxonomias WHERE tipo = ? AND slug = ?', tipo, slug);
    if (f) return f;
    const r = db.run('INSERT INTO taxonomias(tipo, slug, nombre, descripcion, padre_id, color, wp_id) VALUES(?,?,?,?,?,?,?)', tipo, slug, String(nombre).slice(0, 120), extra.descripcion || '', extra.padre_id || null, extra.color || '', extra.wp_id || null);
    return db.get('SELECT * FROM taxonomias WHERE id = ?', Number(r.lastInsertRowid));
  }
  function fijarTaxonomias(id, ids) {
    db.run('DELETE FROM contenido_taxonomia WHERE contenido_id = ?', id);
    for (const t of new Set(ids.map(Number).filter(Boolean))) db.run('INSERT OR IGNORE INTO contenido_taxonomia(contenido_id, taxonomia_id) VALUES(?, ?)', id, t);
  }

  // ------------------------------------------------------------ Validación
  function normalizarCampo(def, v) {
    if (v === undefined || v === null || v === '') return def.t === 'si' ? !!def.def && v === undefined ? !!def.def : false : def.t === 'lista' || def.t === 'repetidor' ? [] : '';
    switch (def.t) {
      case 'si': return v === true || v === 'true' || v === '1' || v === 1 || v === 'on';
      case 'numero': { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : ''; }
      case 'fecha': return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
      case 'fechahora': return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(v) ? v.slice(0, 16) : '';
      case 'url': case 'imagen': case 'archivo': return urlSegura(v).slice(0, 2000);
      case 'email': return /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(String(v).trim()) ? String(v).trim().slice(0, 200) : '';
      case 'telefono': return String(v).replace(/[^\d+()\s-]/g, '').slice(0, 30);
      case 'color': return /^#[0-9a-f]{6}$/i.test(v) ? v : '';
      case 'opcion': return Object.hasOwn(def.opciones || {}, v) ? v : def.def || '';
      case 'html': return sanitizarHtml(v);
      case 'lista': return (Array.isArray(v) ? v : String(v).split('\n')).map((x) => String(x).trim().slice(0, 2000)).filter(Boolean).slice(0, 200);
      case 'repetidor': return (Array.isArray(v) ? v : []).slice(0, 200).map((fila) => {
        const o = {};
        for (const s of def.sub || []) o[s.k] = normalizarCampo(s, fila?.[s.k]);
        return o;
      }).filter((o) => Object.values(o).some((x) => x !== '' && x !== false));
      case 'parrafo': return String(v).slice(0, 20000);
      default: return String(v).slice(0, 2000);
    }
  }
  function normalizarDatos(tipo, datos = {}) {
    const esquema = TIPOS[tipo];
    const out = {};
    for (const def of esquema.campos || []) {
      out[def.k] = normalizarCampo(def, datos[def.k]);
      if (def.req && (out[def.k] === '' || (Array.isArray(out[def.k]) && !out[def.k].length))) throw new ErrorValidacion(`Falta «${def.l}».`);
    }
    return out;
  }

  const BLOQUES_TIPOS = new Set(['texto', 'imagen', 'galeria', 'botones', 'tarjetas', 'acordeon', 'video', 'mapa', 'noticias', 'tramites', 'contactos', 'documentos', 'eventos', 'aviso', 'html_aislado', 'tramite_en_linea', 'separador', 'formulario', 'encuesta', 'cita', 'columnas', 'hijas', 'directorio', 'autoridades', 'sesiones', 'lugares', 'areas']);
  function normalizarBloques(bloques, { htmlAvanzado = false, previos = [] } = {}) {
    if (!Array.isArray(bloques)) return [];
    const aisladosPrevios = new Map(previos.filter((b) => b.tipo === 'html_aislado').map((b) => [b.id, b]));
    return bloques.slice(0, 200).filter((b) => b && BLOQUES_TIPOS.has(b.tipo)).map((b) => {
      const id = /^[\w-]{4,40}$/.test(b.id || '') ? b.id : 'b' + Math.random().toString(36).slice(2, 10);
      const o = { id, tipo: b.tipo };
      const txt = (v, n = 500) => String(v ?? '').slice(0, n);
      switch (b.tipo) {
        case 'texto': o.html = sanitizarHtml(b.html); break;
        case 'cita': o.texto = txt(b.texto, 2000); o.autor = txt(b.autor); break;
        case 'columnas': o.columnas = (Array.isArray(b.columnas) ? b.columnas : []).slice(0, 4).map((c) => ({ html: sanitizarHtml(c?.html) })); break;
        case 'imagen': o.src = urlSegura(b.src); o.alt = txt(b.alt); o.pie = txt(b.pie); o.enlace = urlSegura(b.enlace); o.ancho = ['normal', 'ancho', 'completo'].includes(b.ancho) ? b.ancho : 'normal'; break;
        case 'galeria': o.titulo = txt(b.titulo); o.imagenes = (b.imagenes || []).slice(0, 200).map((i) => ({ src: urlSegura(i.src), alt: txt(i.alt) })).filter((i) => i.src); o.estilo = b.estilo === 'carrusel' ? 'carrusel' : 'grilla'; break;
        case 'botones': o.titulo = txt(b.titulo); o.botones = (b.botones || []).slice(0, 30).map((x) => ({ texto: txt(x.texto, 120), url: urlSegura(x.url), estilo: ['primario', 'secundario', 'acento', 'exito'].includes(x.estilo) ? x.estilo : 'primario', icono: txt(x.icono, 30) })).filter((x) => x.texto && x.url); break;
        case 'tarjetas': o.titulo = txt(b.titulo); o.introduccion = txt(b.introduccion, 2000); o.columnas = [2, 3, 4].includes(+b.columnas) ? +b.columnas : 3; o.tarjetas = (b.tarjetas || []).slice(0, 60).map((x) => ({ icono: txt(x.icono, 30), titulo: txt(x.titulo, 200), texto: txt(x.texto, 3000), url: urlSegura(x.url), imagen: urlSegura(x.imagen), lista: (Array.isArray(x.lista) ? x.lista : String(x.lista || '').split('\n')).map((l) => txt(l, 400).trim()).filter(Boolean).slice(0, 40) })); break;
        case 'acordeon': o.titulo = txt(b.titulo); o.items = (b.items || []).slice(0, 80).map((x) => ({ titulo: txt(x.titulo, 300), html: sanitizarHtml(x.html) })).filter((x) => x.titulo); break;
        case 'video': o.url = urlSegura(b.url); o.titulo = txt(b.titulo); break;
        case 'mapa': o.titulo = txt(b.titulo); o.lat = Number(b.lat) || -38.8547; o.lng = Number(b.lng) || -71.6977; o.zoom = Math.min(19, Math.max(3, Number(b.zoom) || 15)); o.direccion = txt(b.direccion); break;
        case 'noticias': o.titulo = txt(b.titulo); o.categoria = txt(b.categoria, 120); o.cantidad = Math.min(24, Math.max(1, Number(b.cantidad) || 6)); break;
        case 'tramites': o.titulo = txt(b.titulo); o.area = Number(b.area) || null; o.etiqueta = txt(b.etiqueta, 120); o.transitoDepartamento = txt(b.transitoDepartamento, 80); o.cantidad = Math.min(60, Math.max(1, Number(b.cantidad) || 12)); break;
        case 'contactos': o.titulo = txt(b.titulo); o.telefono = txt(b.telefono, 40); o.email = txt(b.email, 200); o.direccion = txt(b.direccion, 300); o.mapa = urlSegura(b.mapa); o.whatsapp = txt(b.whatsapp, 40); o.horario = txt(b.horario, 300); break;
        case 'documentos': o.titulo = txt(b.titulo); o.coleccion = txt(b.coleccion, 120); o.cantidad = Math.min(100, Math.max(1, Number(b.cantidad) || 10)); o.archivos = (b.archivos || []).slice(0, 100).map((x) => ({ titulo: txt(x.titulo, 300), url: urlSegura(x.url) })).filter((x) => x.url); break;
        case 'eventos': o.titulo = txt(b.titulo); o.cantidad = Math.min(24, Math.max(1, Number(b.cantidad) || 6)); break;
        case 'aviso': o.nivel = ['info', 'alerta', 'emergencia', 'exito'].includes(b.nivel) ? b.nivel : 'info'; o.titulo = txt(b.titulo); o.html = sanitizarHtml(b.html); break;
        case 'html_aislado': {
          // Sólo quien tiene el permiso puede crear o cambiar estos bloques; si no, se conserva el anterior.
          const previo = aisladosPrevios.get(id);
          if (!htmlAvanzado) { if (previo) return previo; return null; }
          o.html = String(b.html || '').slice(0, 1_500_000); o.titulo = txt(b.titulo); o.alto = Math.min(6000, Math.max(0, Number(b.alto) || 0));
          break;
        }
        case 'tramite_en_linea': o.tramite = txt(b.tramite, 80); o.vista = ['tramite', 'catalogo', 'seguimiento'].includes(b.vista) ? b.vista : 'tramite'; o.dependencia = txt(b.dependencia, 80); o.titulo = txt(b.titulo); break;
        case 'separador': o.estilo = b.estilo === 'espacio' ? 'espacio' : 'linea'; break;
        case 'formulario': o.formulario = ['contacto', 'oirs', 'suscripcion'].includes(b.formulario) ? b.formulario : 'contacto'; o.titulo = txt(b.titulo); o.area = Number(b.area) || null; break;
        case 'encuesta': o.encuesta = Number(b.encuesta) || null; break;
        case 'hijas': o.titulo = txt(b.titulo); break;
        case 'directorio': o.titulo = txt(b.titulo); o.grupo = txt(b.grupo, 40); break;
        case 'autoridades': o.titulo = txt(b.titulo); break;
        case 'sesiones': o.titulo = txt(b.titulo); o.cantidad = Math.min(50, Math.max(1, Number(b.cantidad) || 10)); break;
        case 'lugares': o.titulo = txt(b.titulo); o.tipoLugar = txt(b.tipoLugar, 40); break;
        case 'areas': o.titulo = txt(b.titulo); o.padre = Number(b.padre) || null; break;
      }
      return o;
    }).filter(Boolean);
  }

  function slugLibre(tipo, base, padre, id) {
    let slug = slugify(base);
    const reservados = tipo === 'pagina' && !padre ? RESERVADOS : null;
    for (let i = 1; i < 500; i++) {
      const cand = i === 1 ? slug : `${slug}-${i}`;
      if (reservados?.has(cand)) continue;
      const otro = db.get('SELECT id FROM contenidos WHERE tipo = ? AND slug = ? AND ifnull(padre_id, 0) = ?', tipo, cand, tipo === 'pagina' || tipo === 'area' ? padre || 0 : 0);
      if (!otro || otro.id === id) return cand;
    }
    return slug + '-' + Date.now();
  }

  // Guarda (crea o actualiza). `usuario` es quien edita; los permisos se revisan en la API.
  function guardar(entrada, { usuario = null, htmlAvanzado = false, revision = true, conservarFechas = false } = {}) {
    const tipo = entrada.tipo;
    const esquema = TIPOS[tipo];
    if (!esquema) throw new ErrorValidacion('Tipo de contenido desconocido.');
    const previo = entrada.id ? obtener(entrada.id) : null;
    if (entrada.id && !previo) throw new ErrorValidacion('El contenido no existe.', 404);
    if (previo && previo.tipo !== tipo) throw new ErrorValidacion('No se puede cambiar el tipo de un contenido.');
    const titulo = String(entrada.titulo ?? previo?.titulo ?? '').trim().slice(0, 300);
    if (!titulo) throw new ErrorValidacion('El título es obligatorio.');
    const estado = Object.hasOwn(ESTADOS, entrada.estado) ? entrada.estado : previo?.estado || 'borrador';
    const padre = esquema.jerarquico ? Number(entrada.padre_id) || null : null;
    if (padre && previo) {
      // Evitar ciclos: el padre no puede ser descendiente de sí mismo.
      let p = padre, n = 0;
      while (p && n++ < 20) { if (p === previo.id) throw new ErrorValidacion('Una página no puede quedar dentro de sí misma.'); p = db.get('SELECT padre_id FROM contenidos WHERE id = ?', p)?.padre_id; }
    }
    const slug = slugLibre(tipo, entrada.slug || titulo, padre, previo?.id);
    const t = ahora();
    let publicado = entrada.publicado_en ? new Date(entrada.publicado_en).toISOString() : previo?.publicado_en || null;
    let estadoFinal = estado;
    if (estado === 'publicado' && !publicado) publicado = t;
    if (estado === 'publicado' && publicado > t && !conservarFechas) estadoFinal = 'programado';
    if (estado === 'programado' && (!publicado || publicado <= t)) { estadoFinal = 'publicado'; publicado = publicado || t; }
    const datos = normalizarDatos(tipo, entrada.datos ?? previo?.datos ?? {});
    const cuerpo = esquema.cuerpo ? sanitizarHtml(entrada.cuerpo ?? previo?.cuerpo ?? '') : '';
    const bloques = esquema.bloques ? normalizarBloques(entrada.bloques ?? previo?.bloques ?? [], { htmlAvanzado, previos: previo?.bloques || [] }) : [];
    const resumen = String(entrada.resumen ?? previo?.resumen ?? '').trim().slice(0, 600);
    const seoIn = entrada.seo ?? previo?.seo ?? {};
    const seo = { titulo: String(seoIn.titulo || '').slice(0, 120), descripcion: String(seoIn.descripcion || '').slice(0, 300), imagen: urlSegura(seoIn.imagen), noindex: !!seoIn.noindex };
    const plantilla = esquema.plantillas && Object.hasOwn(esquema.plantillas, entrada.plantilla) ? entrada.plantilla : previo?.plantilla || (esquema.plantillas ? 'normal' : '');
    const fila = {
      tipo, slug, titulo, resumen, cuerpo, bloques: JSON.stringify(bloques), datos: JSON.stringify(datos), seo: JSON.stringify(seo),
      estado: estadoFinal, publicado_en: publicado, padre_id: padre, area_id: Number(entrada.area_id ?? previo?.area_id) || null,
      orden: Number(entrada.orden ?? previo?.orden ?? 0) || 0, imagen: urlSegura(entrada.imagen ?? previo?.imagen ?? ''),
      destacado: entrada.destacado ?? previo?.destacado ? 1 : 0, plantilla,
    };
    if (fila.area_id && db.get('SELECT tipo FROM contenidos WHERE id = ?', fila.area_id)?.tipo !== 'area') fila.area_id = null;

    return db.tx(() => {
      let id = previo?.id;
      if (previo) {
        if (revision) db.run('INSERT INTO revisiones(contenido_id, datos, autor_id, creado) VALUES(?,?,?,?)', id, JSON.stringify(previo), usuario?.id || null, t);
        db.run(`UPDATE contenidos SET ${Object.keys(fila).map((k) => k + ' = ?').join(', ')}, modificado = ?, modificado_por = ? WHERE id = ?`, ...Object.values(fila), t, usuario?.id || null, id);
        // Conservar sólo las últimas 30 revisiones.
        db.run('DELETE FROM revisiones WHERE contenido_id = ? AND id NOT IN (SELECT id FROM revisiones WHERE contenido_id = ? ORDER BY id DESC LIMIT 30)', id, id);
      } else {
        const extra = { autor_id: entrada.autor_id ?? usuario?.id ?? null, wp_id: entrada.wp_id || null, url_antigua: entrada.url_antigua || null, creado: entrada.creado || t, modificado: entrada.modificado || t, modificado_por: usuario?.id || null };
        const todo = { ...fila, ...extra };
        const r = db.run(`INSERT INTO contenidos(${Object.keys(todo).join(',')}) VALUES(${Object.keys(todo).map(() => '?').join(',')})`, ...Object.values(todo));
        id = Number(r.lastInsertRowid);
      }
      if (Array.isArray(entrada.taxonomias)) fijarTaxonomias(id, entrada.taxonomias);
      const c = obtener(id);
      indexar(c);
      if (tipo === 'pagina' || tipo === 'area') invalidar();
      return c;
    });
  }

  function indexar(c) {
    db.run('DELETE FROM busqueda WHERE contenido_id = ?', c.id);
    if (c.estado !== 'publicado' || TIPOS[c.tipo]?.sinPagina || c.seo?.noindex) return;
    const extra = [];
    const d = c.datos || {};
    for (const def of TIPOS[c.tipo].campos || []) {
      const v = d[def.k];
      if (Array.isArray(v)) extra.push(v.map((x) => (typeof x === 'object' ? Object.values(x).join(' ') : x)).join(' '));
      else if (typeof v === 'string' && !['url', 'imagen', 'archivo', 'color', 'icono'].includes(def.t)) extra.push(v);
    }
    const bloques = (c.bloques || []).map((b) => [b.titulo, b.html && b.tipo !== 'html_aislado' ? textoPlano(b.html) : b.tipo === 'html_aislado' ? textoPlano(b.html).slice(0, 20000) : '', (b.items || []).map((i) => i.titulo + ' ' + textoPlano(i.html)).join(' '), (b.tarjetas || []).map((t) => `${t.titulo} ${t.texto} ${(t.lista || []).join(' ')}`).join(' ')].join(' '));
    db.run('INSERT INTO busqueda(titulo, texto, contenido_id, tipo) VALUES(?,?,?,?)', c.titulo, [c.resumen, textoPlano(c.cuerpo), extra.join(' '), bloques.join(' ')].join('\n').slice(0, 200000), c.id, c.tipo);
  }

  function buscar(q, { tipo, limite = 20, pagina = 1 } = {}) {
    const terminos = String(q || '').normalize('NFKC').replace(/["*^():{}\[\]<>~\-+]/g, ' ').split(/\s+/).filter((t) => t.length > 1).slice(0, 8);
    if (!terminos.length) return { total: 0, items: [] };
    const match = terminos.map((t) => `"${t}"*`).join(' ');
    const filtroTipo = tipo ? 'AND b.tipo = ?' : '';
    const args = tipo ? [match, tipo] : [match];
    try {
      const total = db.get(`SELECT count(*) n FROM busqueda b WHERE busqueda MATCH ? ${filtroTipo}`, ...args).n;
      const filas = db.all(`SELECT c.*, snippet(busqueda, 1, '[[', ']]', '…', 24) AS fragmento, bm25(busqueda, 8.0, 1.0) AS rango
        FROM busqueda b JOIN contenidos c ON c.id = b.contenido_id WHERE busqueda MATCH ? ${filtroTipo}
        ORDER BY rango + (CASE c.tipo WHEN 'tramite' THEN -4 WHEN 'pagina' THEN -2 WHEN 'area' THEN -2 ELSE 0 END) LIMIT ? OFFSET ?`, ...args, limite, (pagina - 1) * limite);
      return { total, items: filas.map((f) => ({ ...filaContenido(f), fragmento: f.fragmento })) };
    } catch {
      return { total: 0, items: [] };
    }
  }

  function reindexarTodo() {
    db.tx(() => {
      db.run('DELETE FROM busqueda');
      for (const f of db.all("SELECT * FROM contenidos WHERE estado = 'publicado'")) indexar(filaContenido(f));
    });
  }

  // Publica lo programado cuya fecha ya llegó. Se llama cada minuto.
  function publicarProgramados() {
    const filas = db.all("SELECT id FROM contenidos WHERE estado = 'programado' AND publicado_en <= ?", ahora());
    for (const f of filas) {
      db.run("UPDATE contenidos SET estado = 'publicado' WHERE id = ?", f.id);
      indexar(obtener(f.id));
    }
    if (filas.length) invalidar();
    return filas.length;
  }

  function eliminar(id) {
    const c = obtener(id);
    if (!c) return null;
    db.tx(() => {
      db.run('UPDATE contenidos SET padre_id = ? WHERE padre_id = ?', c.padre_id, id);
      db.run('DELETE FROM busqueda WHERE contenido_id = ?', id);
      db.run('DELETE FROM contenidos WHERE id = ?', id);
    });
    invalidar();
    return c;
  }

  function hijas(id, { publico = true } = {}) {
    return listar({ tipo: ['pagina', 'area'], padre: id, publico, orden: 'orden', limite: 200 }).items;
  }

  // ------------------------------------------------------------ Menús
  function menu(clave) {
    if (cacheMenus.has(clave)) return cacheMenus.get(clave);
    const f = db.get('SELECT * FROM menus WHERE clave = ?', clave);
    const items = f ? parse(f.items, []) : [];
    cacheMenus.set(clave, items);
    return items;
  }
  function guardarMenu(clave, nombre, items) {
    const limpiar = (lista, prof = 0) => (Array.isArray(lista) ? lista : []).slice(0, 80).map((i) => ({
      texto: String(i.texto || '').slice(0, 120), url: urlSegura(i.url) || '#', nueva: !!i.nueva, icono: String(i.icono || '').slice(0, 30), descripcion: String(i.descripcion || '').slice(0, 200),
      hijos: prof < 2 ? limpiar(i.hijos, prof + 1) : [],
    })).filter((i) => i.texto);
    const limpio = limpiar(items);
    db.run('INSERT INTO menus(clave, nombre, items, modificado) VALUES(?,?,?,?) ON CONFLICT(clave) DO UPDATE SET nombre = excluded.nombre, items = excluded.items, modificado = excluded.modificado', clave, nombre, JSON.stringify(limpio), ahora());
    cacheMenus.delete(clave);
    return limpio;
  }

  return { obtener, porSlug, paginaPorRuta, listar, buscar, guardar, eliminar, indexar, reindexarTodo, publicarProgramados, urlDe, visible, hijas, eventosProximos, eventosEntre, vigentes, taxonomiasDe, taxonomias, asegurarTaxonomia, fijarTaxonomias, normalizarBloques, menu, guardarMenu, invalidar, resumenDe };
}

// Resumen para tarjetas: el escrito o el inicio del cuerpo.
export function resumenDe(c, n = 170) {
  return recortar(c.resumen || textoPlano(c.cuerpo) || textoPlano((c.bloques || []).find((b) => b.tipo === 'texto')?.html || ''), n);
}

// Primer segmento de ruta que no puede usar una página raíz (lo ocupan rutas del sistema).
export const RESERVADOS = new Set(['admin', 'api', 'buscar', 'noticias', 'tramites', 'eventos', 'documentos', 'areas', 'autoridades', 'concejo', 'descubre', 'participa', 'directorio', 'categoria', 'etiqueta', 'feed', 'sitemap.xml', 'robots.txt', 'static', 'img', 'css', 'js', 'wp-content', 'embed', 'vista-previa', 'oirs', 'boletin', 'page', 'mapa-del-sitio', 'transparencia', 'accesibilidad', 'sw.js', 'manifest.webmanifest', 'favicon.ico', 'medios', 'contacto']);
