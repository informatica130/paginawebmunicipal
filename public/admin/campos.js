// Controles de formulario generados desde el esquema (src/tipos.js), editor de texto
// enriquecido, biblioteca de medios (con reducción de imágenes en el navegador) y editor
// de bloques. Cada control devuelve { el, valor() }.

import { h, raw, esc, nodo, $, $$, api, aviso, fallo, modal, estado, debounce, ico, aLocal, deLocal } from './ui.js';

// ------------------------------------------------------------------ Texto enriquecido
const PERMITIDAS = new Set(['P', 'BR', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'IMG', 'FIGURE', 'FIGCAPTION', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SUB', 'SUP', 'HR', 'IFRAME', 'CODE', 'PRE']);
function limpiarPegado(html) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const recorrer = (n) => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === 8) { c.remove(); continue; }
      if (c.nodeType !== 1) continue;
      recorrer(c);
      if (['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE'].includes(c.tagName)) { c.remove(); continue; }
      if (!PERMITIDAS.has(c.tagName)) { c.replaceWith(...c.childNodes); continue; }
      for (const a of [...c.attributes]) if (!['href', 'src', 'alt', 'colspan', 'rowspan', 'target'].includes(a.name)) c.removeAttribute(a.name);
    }
  };
  recorrer(d.body);
  return d.body.innerHTML.replace(/<p>\s*<\/p>/g, '');
}

export function textoRico(valor = '', { placeholder = 'Escriba aquí…', avanzado = true } = {}) {
  const el = nodo(h`<div class="texto-rico">
    <div class="herramientas" role="toolbar" aria-label="Formato">
      <select data-formato aria-label="Estilo de párrafo"><option value="p">Párrafo</option><option value="h2">Título</option><option value="h3">Subtítulo</option><option value="h4">Título menor</option><option value="blockquote">Cita</option></select>
      <span class="sep"></span>
      <button type="button" data-cmd="bold" title="Negrita (Ctrl+B)"><b>N</b></button>
      <button type="button" data-cmd="italic" title="Cursiva (Ctrl+I)"><i>K</i></button>
      <button type="button" data-cmd="underline" title="Subrayado"><u>S</u></button>
      <span class="sep"></span>
      <button type="button" data-cmd="insertUnorderedList" title="Lista">• Lista</button>
      <button type="button" data-cmd="insertOrderedList" title="Lista numerada">1. Lista</button>
      <span class="sep"></span>
      <button type="button" data-accion="enlace" title="Enlace">${ico('enlace', 16)}</button>
      <button type="button" data-cmd="unlink" title="Quitar enlace">⛓̸</button>
      <button type="button" data-accion="imagen" title="Imagen">${ico('img', 16)}</button>
      <button type="button" data-accion="tabla" title="Tabla">▦</button>
      <button type="button" data-accion="video" title="Video de YouTube">▶</button>
      <button type="button" data-cmd="insertHorizontalRule" title="Línea">―</button>
      <span class="sep"></span>
      <button type="button" data-cmd="removeFormat" title="Quitar formato">⌫</button>
      <button type="button" data-cmd="undo" title="Deshacer">↶</button>
      <button type="button" data-cmd="redo" title="Rehacer">↷</button>
      ${avanzado ? raw('<button type="button" data-accion="fuente" title="Ver HTML">&lt;/&gt;</button>') : ''}
    </div>
    <div class="area" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="${placeholder}"></div>
    <textarea class="fuente" hidden spellcheck="false" aria-label="Código HTML"></textarea>
  </div>`);
  const area = $('.area', el);
  const fuente = $('.fuente', el);
  area.innerHTML = valor || '';
  let rango = null;
  const recordar = () => { const s = getSelection(); if (s.rangeCount && area.contains(s.anchorNode)) rango = s.getRangeAt(0).cloneRange(); };
  const restaurar = () => { area.focus(); if (rango) { const s = getSelection(); s.removeAllRanges(); s.addRange(rango); } };
  area.addEventListener('keyup', recordar); area.addEventListener('mouseup', recordar); area.addEventListener('blur', recordar);
  area.addEventListener('paste', (e) => {
    const html = e.clipboardData.getData('text/html');
    const texto = e.clipboardData.getData('text/plain');
    e.preventDefault();
    if (html) document.execCommand('insertHTML', false, limpiarPegado(html));
    else document.execCommand('insertHTML', false, esc(texto).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join(''));
  });
  $('[data-formato]', el).addEventListener('change', (e) => { restaurar(); document.execCommand('formatBlock', false, e.target.value); e.target.value = 'p'; });
  el.querySelector('.herramientas').addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  el.querySelector('.herramientas').addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cmd) { restaurar(); document.execCommand(b.dataset.cmd, false, null); return; }
    const a = b.dataset.accion;
    if (a === 'enlace') {
      recordar();
      const url = prompt('Dirección del enlace (https://…, /pagina/, mailto: o tel:)', 'https://');
      if (!url) return;
      restaurar();
      if (getSelection().isCollapsed) document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(url)}</a>`);
      else document.execCommand('createLink', false, url);
    } else if (a === 'imagen') {
      recordar();
      const m = await elegirMedio({ tipo: 'imagen' });
      if (!m) return;
      restaurar();
      document.execCommand('insertHTML', false, `<figure><img src="${esc(m.url)}" alt="${esc(m.alt || '')}">${m.alt ? `<figcaption>${esc(m.alt)}</figcaption>` : ''}</figure><p></p>`);
    } else if (a === 'tabla') {
      restaurar();
      const f = Number(prompt('¿Cuántas filas?', '3')) || 3;
      const c = Number(prompt('¿Cuántas columnas?', '2')) || 2;
      document.execCommand('insertHTML', false, `<table><thead><tr>${'<th>Título</th>'.repeat(c)}</tr></thead><tbody>${`<tr>${'<td>&nbsp;</td>'.repeat(c)}</tr>`.repeat(f)}</tbody></table><p></p>`);
    } else if (a === 'video') {
      const url = prompt('Enlace del video de YouTube');
      const id = /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/.exec(url || '')?.[1];
      if (!id) return url && aviso('No reconocí el enlace de YouTube.', 'error');
      restaurar();
      document.execCommand('insertHTML', false, `<iframe src="https://www.youtube-nocookie.com/embed/${id}" width="560" height="315" allowfullscreen></iframe><p></p>`);
    } else if (a === 'fuente') {
      const viendo = !fuente.hidden;
      if (viendo) { area.innerHTML = fuente.value; fuente.hidden = true; area.hidden = false; }
      else { fuente.value = area.innerHTML; fuente.hidden = false; area.hidden = true; }
    }
  });
  return { el, valor: () => (fuente.hidden ? area.innerHTML : fuente.value).replace(/<p><br><\/p>$/, '').trim(), foco: () => area.focus() };
}

// ------------------------------------------------------------------ Medios
const ANCHOS = [480, 960, 1600];
async function reducir(archivo, ancho, calidad = 0.85) {
  const bmp = await createImageBitmap(archivo);
  const escala = Math.min(1, ancho / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * escala); c.height = Math.round(bmp.height * escala);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/webp', calidad));
  return { blob, ancho: c.width, alto: c.height, original: { ancho: bmp.width, alto: bmp.height } };
}

// Sube un archivo; las fotos grandes se reducen a 2400 px y se crean variantes 480/960/1600 px.
export async function subirArchivo(archivo, { alSubir } = {}) {
  let cuerpo = archivo;
  let nombre = archivo.name;
  let ancho = null, alto = null;
  const esFoto = /^image\/(jpeg|png|webp)$/.test(archivo.type);
  if (esFoto) {
    try {
      const r = await reducir(archivo, 2400, 0.86);
      ancho = r.ancho; alto = r.alto;
      if (r.original.ancho > 2400 || archivo.size > 1.5e6) { cuerpo = r.blob; nombre = nombre.replace(/\.\w+$/, '') + '.webp'; }
    } catch { /* se sube tal cual */ }
  }
  const cab = { 'X-Nombre': encodeURIComponent(nombre), 'Content-Type': 'application/octet-stream' };
  if (ancho) { cab['X-Ancho'] = ancho; cab['X-Alto'] = alto; }
  const m = await api('POST', 'medios', cuerpo, { cabeceras: cab });
  if (esFoto && ancho && !m.repetido) {
    for (const w of ANCHOS.filter((x) => x < ancho * 0.9)) {
      try {
        const v = await reducir(archivo, w, 0.8);
        await api('POST', 'medios', v.blob, { cabeceras: { 'X-Nombre': encodeURIComponent(nombre), 'X-Variante-De': m.id, 'X-Ancho': v.ancho, 'Content-Type': 'application/octet-stream' } });
      } catch { /* la original basta */ }
    }
  }
  alSubir?.(m);
  return m;
}

export function zonaSubida({ alSubir, multiple = true, aceptar = '' }) {
  const el = nodo(h`<div class="zona-subida"><p>Arrastre archivos aquí o <label class="btn chico" style="display:inline-flex">elegir archivos<input type="file" ${multiple ? raw('multiple') : ''} accept="${aceptar}" hidden></label></p><p class="chico muted">Imágenes (se optimizan solas), PDF, Word, Excel, PowerPoint, ZIP, MP4, MP3 · hasta 40 MB</p><div class="progreso" hidden><span></span></div><p class="estado-subida chico"></p></div>`);
  const barra = $('.progreso', el), linea = $('span', barra), est = $('.estado-subida', el);
  async function procesar(archivos) {
    barra.hidden = false;
    let n = 0;
    for (const f of archivos) {
      est.textContent = `Subiendo ${f.name}…`;
      try { await subirArchivo(f, { alSubir }); } catch (e) { fallo(new Error(`${f.name}: ${e.message}`)); }
      n++; linea.style.width = `${(n / archivos.length) * 100}%`;
    }
    est.textContent = `${n} archivo(s) procesado(s).`;
    setTimeout(() => { barra.hidden = true; linea.style.width = '0'; }, 1500);
  }
  $('input', el).addEventListener('change', (e) => procesar([...e.target.files]));
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('encima'); });
  el.addEventListener('dragleave', () => el.classList.remove('encima'));
  el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('encima'); procesar([...e.dataTransfer.files]); });
  return el;
}

export const esImagen = (m) => /^image\//.test(m.mime || '') || /\.(jpe?g|png|webp|gif|avif)$/i.test(m.url || '');
export const miniatura = (m) => { const v = Object.entries(m.variantes || {}).sort((a, b) => a[0] - b[0]); return (v.find(([w]) => Number(w) >= 300) || v[0] || [0, m.url])[1]; };

export function elegirMedio({ tipo = '' } = {}) {
  return new Promise((ok) => {
    let elegido = null;
    const cuerpo = nodo(h`<div><div class="filtros"><input type="search" placeholder="Buscar por nombre o descripción" data-q><select data-tipo><option value="">Todos</option><option value="imagen"${tipo === 'imagen' ? raw(' selected') : ''}>Imágenes</option><option value="documento"${tipo === 'documento' ? raw(' selected') : ''}>Documentos</option></select></div><div data-zona></div><div class="medios" data-lista></div><p class="paginacion"><button class="btn" data-mas hidden>Ver más</button></p></div>`);
    let pagina = 1;
    const lista = $('[data-lista]', cuerpo);
    const pintar = (items, agregar) => {
      if (!agregar) lista.innerHTML = '';
      for (const m of items) {
        const b = nodo(h`<button type="button" class="medio" title="${m.nombre}"><span class="previa">${esImagen(m) ? h`<img src="${miniatura(m)}" alt="" loading="lazy">` : (m.url.split('.').pop() || '').toUpperCase()}</span><span class="nombre">${m.titulo || m.nombre}</span></button>`);
        b.addEventListener('click', () => { elegido = m; m_.cerrar(); });
        lista.appendChild(b);
      }
    };
    const cargar = async (agregar = false) => {
      const r = await api('GET', `medios?q=${encodeURIComponent($('[data-q]', cuerpo).value)}&tipo=${$('[data-tipo]', cuerpo).value}&pagina=${pagina}`);
      pintar(r.items, agregar);
      $('[data-mas]', cuerpo).hidden = pagina * 60 >= r.total;
    };
    $('[data-zona]', cuerpo).appendChild(zonaSubida({ alSubir: (m) => { elegido = m; m_.cerrar(); }, multiple: false, aceptar: tipo === 'imagen' ? 'image/*' : '' }));
    $('[data-q]', cuerpo).addEventListener('input', debounce(() => { pagina = 1; cargar(); }));
    $('[data-tipo]', cuerpo).addEventListener('change', () => { pagina = 1; cargar(); });
    $('[data-mas]', cuerpo).addEventListener('click', () => { pagina++; cargar(true); });
    const m_ = modal({ titulo: 'Biblioteca de medios', cuerpo, ancho: true, alCerrar: () => ok(elegido) });
    cargar().catch(fallo);
  });
}

function selectorMedio(valor, { tipo = 'imagen' } = {}) {
  const el = nodo(h`<div class="selector-medio"><img alt="" hidden><input type="text" placeholder="${tipo === 'imagen' ? '/medios/… o https://…' : 'Archivo o enlace'}"><button type="button" class="btn chico">Elegir</button><button type="button" class="btn chico fantasma" title="Quitar">✕</button></div>`);
  const input = $('input', el), img = $('img', el);
  const ver = () => { const v = input.value; img.hidden = !(tipo === 'imagen' && v); if (!img.hidden) img.src = v; };
  input.value = valor || ''; ver();
  input.addEventListener('input', ver);
  $$('button', el)[0].addEventListener('click', async () => { const m = await elegirMedio({ tipo: tipo === 'imagen' ? 'imagen' : '' }); if (m) { input.value = m.url; ver(); input.dispatchEvent(new Event('input', { bubbles: true })); } });
  $$('button', el)[1].addEventListener('click', () => { input.value = ''; ver(); input.dispatchEvent(new Event('input', { bubbles: true })); });
  return { el, valor: () => input.value.trim() };
}

// ------------------------------------------------------------------ Campos del esquema
let cacheAreas = null;
export async function areas() {
  if (!cacheAreas) cacheAreas = (await api('GET', 'contenidos?tipo=area&limite=500&orden=orden')).items;
  return cacheAreas;
}
export const olvidarAreas = () => { cacheAreas = null; };
let cachePlataforma = null;
async function catalogoPlataforma() {
  if (!cachePlataforma) cachePlataforma = await api('GET', 'plataforma').catch(() => ({}));
  return cachePlataforma;
}

export function campo(def, valor) {
  const id = 'c' + Math.random().toString(36).slice(2, 9);
  const etiqueta = h`<span>${def.l}${def.req ? ' *' : ''}</span>`;
  const ayuda = def.ayuda ? h`<small class="ayuda">${def.ayuda}</small>` : '';
  const envolver = (control) => { const w = nodo(h`<div class="campo"><label for="${id}">${def.l}${def.req ? ' *' : ''}</label></div>`); w.appendChild(control); if (ayuda) w.appendChild(nodo(String(ayuda))); return w; };
  const v = valor ?? def.def ?? (def.t === 'lista' || def.t === 'repetidor' ? [] : def.t === 'si' ? false : '');
  switch (def.t) {
    case 'si': {
      const el = nodo(h`<label class="check"><input type="checkbox" id="${id}"${v ? raw(' checked') : ''}> ${def.l}</label>`);
      return { el, valor: () => $('input', el).checked };
    }
    case 'parrafo': case 'lista': {
      const t = nodo(h`<textarea id="${id}" rows="${def.t === 'lista' ? 5 : 3}" placeholder="${def.t === 'lista' ? 'Un elemento por línea' : ''}"></textarea>`);
      t.value = Array.isArray(v) ? v.join('\n') : v;
      return { el: envolver(t), valor: () => (def.t === 'lista' ? t.value.split('\n').map((x) => x.trim()).filter(Boolean) : t.value) };
    }
    case 'html': { const r = textoRico(v); const w = nodo(h`<div class="campo"><span>${def.l}</span></div>`); w.appendChild(r.el); return { el: w, valor: r.valor }; }
    case 'opcion': {
      const s = nodo(h`<select id="${id}">${Object.entries(def.opciones).map(([k, n]) => h`<option value="${k}"${String(k) === String(v) ? raw(' selected') : ''}>${n}</option>`)}</select>`);
      return { el: envolver(s), valor: () => s.value };
    }
    case 'imagen': case 'archivo': { const s = selectorMedio(v, { tipo: def.t }); s.el.querySelector('input').id = id; return { el: envolver(s.el), valor: s.valor }; }
    case 'color': {
      const i = nodo(h`<input type="color" id="${id}" value="${v || '#0b5a8c'}">`);
      return { el: envolver(i), valor: () => i.value };
    }
    case 'icono': {
      const s = nodo(h`<select id="${id}">${(estado.esquema.iconos || []).map((n) => h`<option${n === v ? raw(' selected') : ''}>${n}</option>`)}</select>`);
      return { el: envolver(s), valor: () => s.value };
    }
    case 'fechahora': {
      const i = nodo(h`<input type="datetime-local" id="${id}">`);
      i.value = String(v || '').slice(0, 16);
      return { el: envolver(i), valor: () => i.value };
    }
    case 'tramite': {
      const w = nodo(h`<div><input id="${id}" list="${id}-l" placeholder="Código del trámite en la Plataforma (p. ej. tra-hora-licencia)"><datalist id="${id}-l"></datalist></div>`);
      const i = $('input', w);
      i.value = v || '';
      catalogoPlataforma().then((p) => { $('datalist', w).innerHTML = String(h`${(p.catalogo?.tramites || []).map((t) => h`<option value="${t.id}">${t.nombre}</option>`)}`); });
      return { el: envolver(w), valor: () => i.value.trim() };
    }
    case 'repetidor': {
      const w = nodo(h`<div class="campo"><span>${def.l}</span><div class="repetidor"></div><button type="button" class="btn chico" data-agregar>${ico('mas', 14)} Agregar</button></div>`);
      const cont = $('.repetidor', w);
      const filas = [];
      const agregarFila = (dato = {}) => {
        const f = nodo(h`<div class="fila-rep"><div class="acciones-fila"><button type="button" class="btn chico fantasma" data-sub title="Subir">↑</button><button type="button" class="btn chico fantasma" data-baj title="Bajar">↓</button><button type="button" class="btn chico fantasma" data-qui title="Quitar">✕</button></div><div class="fila"></div></div>`);
        const sub = def.sub.map((s) => ({ k: s.k, c: campo(s, dato[s.k]) }));
        sub.forEach((s) => $('.fila', f).appendChild(s.c.el));
        const reg = { f, sub };
        filas.push(reg);
        cont.appendChild(f);
        $('[data-qui]', f).addEventListener('click', () => { f.remove(); filas.splice(filas.indexOf(reg), 1); });
        $('[data-sub]', f).addEventListener('click', () => { const i = filas.indexOf(reg); if (i > 0) { filas.splice(i, 1); filas.splice(i - 1, 0, reg); cont.insertBefore(f, f.previousElementSibling); } });
        $('[data-baj]', f).addEventListener('click', () => { const i = filas.indexOf(reg); if (i < filas.length - 1) { filas.splice(i, 1); filas.splice(i + 1, 0, reg); cont.insertBefore(f.nextElementSibling, f); } });
      };
      (Array.isArray(v) ? v : []).forEach(agregarFila);
      $('[data-agregar]', w).addEventListener('click', () => agregarFila());
      return { el: w, valor: () => filas.map((r) => Object.fromEntries(r.sub.map((s) => [s.k, s.c.valor()]))) };
    }
    default: {
      const tipoInput = { numero: 'number', fecha: 'date', url: 'text', email: 'email', telefono: 'tel' }[def.t] || 'text';
      const i = nodo(h`<input type="${tipoInput}" id="${id}"${def.t === 'numero' ? raw(' step="any"') : ''}${def.req ? raw(' required') : ''}>`);
      i.value = v ?? '';
      return { el: envolver(i), valor: () => i.value };
    }
  }
}

// ------------------------------------------------------------------ Bloques
export const BLOQUES = {
  texto: { n: 'Texto', campos: [{ k: 'html', t: 'html', l: 'Contenido' }] },
  imagen: { n: 'Imagen', campos: [{ k: 'src', t: 'imagen', l: 'Imagen' }, { k: 'alt', t: 'texto', l: 'Descripción (accesibilidad)' }, { k: 'pie', t: 'texto', l: 'Pie de foto' }, { k: 'enlace', t: 'url', l: 'Enlace al pulsar' }, { k: 'ancho', t: 'opcion', l: 'Ancho', opciones: { normal: 'Normal', ancho: 'Ancho', completo: 'Completo' } }] },
  galeria: { n: 'Galería', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'estilo', t: 'opcion', l: 'Estilo', opciones: { grilla: 'Grilla', carrusel: 'Carrusel' } }, { k: 'imagenes', t: 'repetidor', l: 'Imágenes', sub: [{ k: 'src', t: 'imagen', l: 'Imagen' }, { k: 'alt', t: 'texto', l: 'Descripción' }] }] },
  botones: { n: 'Botones', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'botones', t: 'repetidor', l: 'Botones', sub: [{ k: 'texto', t: 'texto', l: 'Texto' }, { k: 'url', t: 'url', l: 'Enlace' }, { k: 'estilo', t: 'opcion', l: 'Estilo', opciones: { primario: 'Principal', secundario: 'Secundario', acento: 'Destacado', exito: 'Verde' } }] }] },
  tarjetas: { n: 'Tarjetas', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'introduccion', t: 'parrafo', l: 'Introducción' }, { k: 'columnas', t: 'opcion', l: 'Columnas', opciones: { 2: '2', 3: '3', 4: '4' }, def: '3' }, { k: 'tarjetas', t: 'repetidor', l: 'Tarjetas', sub: [{ k: 'icono', t: 'icono', l: 'Ícono' }, { k: 'titulo', t: 'texto', l: 'Título' }, { k: 'texto', t: 'parrafo', l: 'Texto' }, { k: 'lista', t: 'lista', l: 'Lista (opcional)' }, { k: 'url', t: 'url', l: 'Enlace' }, { k: 'imagen', t: 'imagen', l: 'Imagen' }] }] },
  acordeon: { n: 'Preguntas / acordeón', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'items', t: 'repetidor', l: 'Elementos', sub: [{ k: 'titulo', t: 'texto', l: 'Pregunta o título' }, { k: 'html', t: 'parrafo', l: 'Respuesta (texto o HTML simple)' }] }] },
  video: { n: 'Video', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'url', t: 'url', l: 'Enlace (YouTube, Vimeo, Facebook o MP4)' }] },
  mapa: { n: 'Mapa', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'lat', t: 'numero', l: 'Latitud', def: -38.8547 }, { k: 'lng', t: 'numero', l: 'Longitud', def: -71.6977 }, { k: 'zoom', t: 'numero', l: 'Zoom (3–19)', def: 15 }, { k: 'direccion', t: 'texto', l: 'Dirección' }] },
  contactos: { n: 'Datos de contacto', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'telefono', t: 'telefono', l: 'Teléfono' }, { k: 'whatsapp', t: 'telefono', l: 'WhatsApp' }, { k: 'email', t: 'email', l: 'Correo' }, { k: 'direccion', t: 'texto', l: 'Dirección' }, { k: 'horario', t: 'texto', l: 'Horario' }] },
  noticias: { n: 'Noticias', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'categoria', t: 'texto', l: 'Categoría (slug, vacío = todas)' }, { k: 'cantidad', t: 'numero', l: 'Cantidad', def: 6 }] },
  eventos: { n: 'Próximos eventos', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'cantidad', t: 'numero', l: 'Cantidad', def: 6 }] },
  tramites: { n: 'Trámites', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'transitoDepartamento', t: 'texto', l: 'Dependencia en la Plataforma (p. ej. dep-transito) para mostrar sus trámites en línea' }, { k: 'etiqueta', t: 'texto', l: 'Etiqueta de las fichas (slug)' }, { k: 'cantidad', t: 'numero', l: 'Cantidad', def: 12 }] },
  tramite_en_linea: { n: 'Trámite en línea (Plataforma)', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'vista', t: 'opcion', l: 'Mostrar', opciones: { tramite: 'Un trámite (reserva/solicitud)', catalogo: 'Catálogo de una dependencia', seguimiento: 'Consulta de seguimiento' } }, { k: 'tramite', t: 'tramite', l: 'Trámite' }, { k: 'dependencia', t: 'texto', l: 'Dependencia (para catálogo)' }] },
  documentos: { n: 'Documentos', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'coleccion', t: 'texto', l: 'Colección (slug)' }, { k: 'cantidad', t: 'numero', l: 'Cantidad', def: 10 }, { k: 'archivos', t: 'repetidor', l: 'Archivos sueltos', sub: [{ k: 'titulo', t: 'texto', l: 'Nombre' }, { k: 'url', t: 'archivo', l: 'Archivo' }] }] },
  aviso: { n: 'Recuadro destacado', campos: [{ k: 'nivel', t: 'opcion', l: 'Tipo', opciones: { info: 'Información', alerta: 'Alerta', emergencia: 'Emergencia', exito: 'Positivo' } }, { k: 'titulo', t: 'texto', l: 'Título' }, { k: 'html', t: 'html', l: 'Texto' }] },
  cita: { n: 'Cita', campos: [{ k: 'texto', t: 'parrafo', l: 'Texto' }, { k: 'autor', t: 'texto', l: 'Autor' }] },
  formulario: { n: 'Formulario', campos: [{ k: 'formulario', t: 'opcion', l: 'Formulario', opciones: { contacto: 'Contacto', oirs: 'OIRS (reclamos y sugerencias)', suscripcion: 'Suscripción al boletín' } }, { k: 'titulo', t: 'texto', l: 'Título' }] },
  encuesta: { n: 'Encuesta', campos: [{ k: 'encuesta', t: 'numero', l: 'N° (ID) de la encuesta' }] },
  hijas: { n: 'Páginas hijas', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }] },
  directorio: { n: 'Directorio telefónico', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'grupo', t: 'opcion', l: 'Grupo', opciones: { '': 'Todos', municipal: 'Municipales', emergencia: 'Emergencias', salud: 'Salud', educacion: 'Educación', servicios: 'Servicios públicos', otro: 'Otros' } }] },
  autoridades: { n: 'Autoridades', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }] },
  sesiones: { n: 'Sesiones del Concejo', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'cantidad', t: 'numero', l: 'Cantidad', def: 10 }] },
  areas: { n: 'Áreas municipales', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'padre', t: 'numero', l: 'Sólo hijas del área N° (vacío = principales)' }] },
  lugares: { n: 'Lugares turísticos', campos: [{ k: 'titulo', t: 'texto', l: 'Título' }, { k: 'tipoLugar', t: 'texto', l: 'Tipo (naturaleza, trekking, alojamiento…)' }] },
  separador: { n: 'Separador', campos: [{ k: 'estilo', t: 'opcion', l: 'Estilo', opciones: { linea: 'Línea', espacio: 'Espacio' } }] },
  html_aislado: { n: 'HTML avanzado (aislado)', permiso: 'html.avanzado', campos: [{ k: 'titulo', t: 'texto', l: 'Título (accesibilidad)' }, { k: 'alto', t: 'numero', l: 'Alto inicial (px)', def: 900 }, { k: 'html', t: 'codigo', l: 'Código HTML (se ejecuta aislado del sitio, sin acceso a sesiones)' }] },
};

export function editorBloques(bloques = []) {
  const el = nodo(h`<div><div class="bloques"></div><div class="agregar-bloque"><b style="width:100%">Agregar bloque:</b></div></div>`);
  const lista = $('.bloques', el);
  const items = [];
  const agregarMenu = $('.agregar-bloque', el);
  for (const [tipo, b] of Object.entries(BLOQUES)) {
    if (b.permiso && !estado.sesion.permisos.includes(b.permiso)) continue;
    const btn = nodo(h`<button type="button" class="btn chico">${ico('mas', 14)} ${b.n}</button>`);
    btn.addEventListener('click', () => { const it = agregar({ tipo }); it.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    agregarMenu.appendChild(btn);
  }
  function agregar(b) {
    const def = BLOQUES[b.tipo] || { n: b.tipo, campos: [] };
    const editable = !def.permiso || estado.sesion.permisos.includes(def.permiso);
    const e = nodo(h`<section class="bloque-editor"><header><span class="insignia">${def.n}</span><b>${b.titulo || ''}</b>
      <button type="button" class="btn chico fantasma" data-sub title="Subir">↑</button><button type="button" class="btn chico fantasma" data-baj title="Bajar">↓</button>
      <button type="button" class="btn chico fantasma" data-plegar title="Plegar o desplegar">▾</button><button type="button" class="btn chico fantasma peligro" data-qui title="Quitar bloque">✕</button></header><div class="cuerpo"></div></section>`);
    const cuerpo = $('.cuerpo', e);
    const controles = [];
    if (!editable) cuerpo.appendChild(nodo(h`<p class="muted">Este bloque sólo puede editarlo quien tiene el permiso de HTML avanzado. Se conservará tal como está.</p>`));
    else for (const c of def.campos) {
      if (c.t === 'codigo') {
        const t = nodo(h`<div class="campo"><span>${c.l}</span><textarea rows="16" class="mono" spellcheck="false"></textarea></div>`);
        $('textarea', t).value = b[c.k] || '';
        cuerpo.appendChild(t);
        controles.push({ k: c.k, valor: () => $('textarea', t).value });
      } else {
        const x = campo(c, b[c.k]);
        cuerpo.appendChild(x.el);
        controles.push({ k: c.k, valor: x.valor });
      }
    }
    const it = { el: e, valor: () => (editable ? { id: b.id, tipo: b.tipo, ...Object.fromEntries(controles.map((c) => [c.k, c.valor()])) } : b) };
    if (b.tipo === 'html_aislado' && editable && b.html) e.classList.add('plegado');
    items.push(it);
    lista.appendChild(e);
    $('[data-qui]', e).addEventListener('click', () => { if (confirm('¿Quitar este bloque?')) { e.remove(); items.splice(items.indexOf(it), 1); } });
    $('[data-plegar]', e).addEventListener('click', () => e.classList.toggle('plegado'));
    $('[data-sub]', e).addEventListener('click', () => { const i = items.indexOf(it); if (i > 0) { items.splice(i, 1); items.splice(i - 1, 0, it); lista.insertBefore(e, e.previousElementSibling); } });
    $('[data-baj]', e).addEventListener('click', () => { const i = items.indexOf(it); if (i < items.length - 1) { items.splice(i, 1); items.splice(i + 1, 0, it); lista.insertBefore(e.nextElementSibling, e); } });
    return it;
  }
  bloques.forEach(agregar);
  return { el, valor: () => items.map((i) => i.valor()) };
}

export { aLocal, deLocal };
