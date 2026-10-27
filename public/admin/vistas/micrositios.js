// Micrositios de unidades: cada unidad municipal (Medio Ambiente, Deportes, Cultura, OMIL…) arma su
// propio sitio dentro del sitio municipal, con su color, su patrón, su portada y los módulos que
// necesite. Los formularios salen del esquema compartido (public/js/micrositios.js).
import { h, raw, $, $$, api, aviso, fallo, confirmar, modal, ico, nodo } from '../ui.js';
import { campo } from '../campos.js';
import { marcarCambios } from '../admin.js';
import { MODULOS, COMUNES, GENERAL, TEMA, PORTADA, CONTACTO } from '/js/micrositios.js';
import { patronUrl } from '/js/diseno.js';

const copia = (o) => JSON.parse(JSON.stringify(o));
const nuevoId = () => 'm' + Math.random().toString(36).slice(2, 9);
const PESTANAS = [['general', 'Datos generales'], ['apariencia', 'Portada y colores'], ['modulos', 'Módulos'], ['contacto', 'Contacto']];
// Micrositio nuevo «en blanco»: una base razonable para cualquier unidad.
const EN_BLANCO = (n) => ({ id: nuevoId(), nombre: 'Nueva unidad', slug: 'unidad-' + n, unidad: '', descripcion: '', publicado: false, actualizado: new Date().toISOString().slice(0, 10),
  tema: { color: '#1F6FA8', oscuro: '#0F3A5A', acento: '#E9A92B', patron: 'curvas', icono: 'estrella', portada: 'degradado', imagen: '' },
  portada: { antetitulo: '', titulo: 'Nueva unidad', bajada: 'Qué hace la unidad y cómo puede ayudar a la comunidad.', botones: [], cifras: [] },
  contacto: { responsable: '', cargo: '', telefono: '', email: '', direccion: '', horario: '', redes: [] },
  modulos: [
    { id: nuevoId(), tipo: 'texto', ancla: 'La unidad', titulo: 'Quiénes somos', html: '<p>Presente aquí a la unidad, su misión y sus principales servicios.</p>', visible: true, fondo: 'auto', botones: [] },
    { id: nuevoId(), tipo: 'tarjetas', ancla: 'Servicios', titulo: 'Servicios y programas', columnas: '3', items: [], visible: true, fondo: 'auto' },
    { id: nuevoId(), tipo: 'documentos', ancla: 'Documentos', titulo: 'Documentos', items: [], visible: true, fondo: 'auto' },
    { id: nuevoId(), tipo: 'noticias', ancla: 'Noticias', titulo: 'Noticias', cantidad: 6, visible: true, fondo: 'auto' },
  ] });

export default async function (vista) {
  let datos = await api('GET', 'micrositios');
  let sitios = copia(datos.sitios);
  let guardado = JSON.stringify(sitios);
  let actual = null, pestana = 'general';
  const abiertos = new Set();
  // Controles visibles: ruta → función que entrega su valor (se recogen antes de repintar o guardar).
  let lectores = [];

  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Micrositios de unidades</h1><p>Un sitio propio para cada unidad municipal, con su color, su portada y sus secciones, dentro del sitio de la Municipalidad.</p></div>
    <div class="acciones"><button class="btn" data-volver hidden>← Todos los micrositios</button><a class="btn" data-ver hidden target="_blank" rel="noopener">${ico('ojo', 16)} Ver</a><button class="btn" data-nuevo>${ico('mas', 16)} Nuevo micrositio</button><button class="btn primario" data-guardar>Guardar y publicar</button></div></div>
    <div data-cuerpo></div>`);
  const cuerpo = $('[data-cuerpo]', vista);

  const recoger = () => { for (const [obj, k, leer] of lectores) obj[k] = leer(); };
  const montar = (cont, defs, obj) => {
    for (const def of defs) {
      const c = campo(def, obj[def.k]);
      c.el.classList.add('ms-campo');
      cont.appendChild(c.el);
      lectores.push([obj, def.k, c.valor]);
    }
  };

  // ---------------------------------------------------------------- Lista
  let filtroLista = '', estadoLista = 'todos';
  const sinTilde = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function pintarLista() {
    actual = null; lectores = [];
    $('[data-volver]', vista).hidden = true; $('[data-ver]', vista).hidden = true;
    const q = sinTilde(filtroLista.trim());
    const visibles = sitios.map((s, i) => [s, i]).filter(([s]) => (!q || sinTilde(`${s.nombre} ${s.unidad} ${s.slug}`).includes(q)) && (estadoLista === 'todos' || (estadoLista === 'publicados') === !!s.publicado));
    cuerpo.innerHTML = String(h`<p class="muted">Cada micrositio queda en <code>sitio/dirección/</code> y tiene prioridad sobre una página con la misma dirección. Los que están en borrador sólo los ve quien tiene sesión en el panel.</p>
      <div class="tarjeta ms-filtros"><label class="buscar-opcion"><span class="sr">Buscar un micrositio</span>${ico('buscar', 16)}<input type="search" data-filtro-lista placeholder="Buscar por nombre, unidad o dirección…" value="${filtroLista}" autocomplete="off"></label>
        <div class="segmentos" role="group" aria-label="Estado">${[['todos', `Todos (${sitios.length})`], ['publicados', `Publicados (${sitios.filter((s) => s.publicado).length})`], ['borradores', `Borradores (${sitios.filter((s) => !s.publicado).length})`]].map(([k, t]) => h`<button type="button" data-estado-lista="${k}" aria-pressed="${k === estadoLista}">${t}</button>`)}</div></div>
      <div class="ms-lista">${visibles.length ? visibles.map(([s, i]) => h`<article class="tarjeta ms-ficha" style="--c:${s.tema.color};--o:${s.tema.oscuro}">
        <div class="ms-ficha-portada" style="background-image:${patronUrl(s.tema.patron, { color: '#FFFFFF', opacidad: .18 }) || 'none'}"><span class="insignia ${s.publicado ? 'activo' : ''}">${s.publicado ? 'Publicado' : 'Borrador'}</span><b>${s.nombre}</b><small>/${s.slug}/</small></div>
        <p class="chico muted">${s.unidad || 'Sin unidad asignada'} · ${s.modulos.length} módulos${s.actualizado ? ` · actualizado ${s.actualizado.split('-').reverse().join('-')}` : ''}</p>
        <div class="fila-acciones"><button class="btn chico primario" data-editar="${i}">Editar</button><a class="btn chico" href="/${s.slug}/" target="_blank" rel="noopener">${ico('ojo', 14)} Ver</a><button class="btn chico" data-duplicar="${i}">Duplicar</button><button class="btn chico peligro" data-eliminar="${i}">Eliminar</button></div>
      </article>`) : h`<p class="tarjeta muted">${sitios.length ? 'No hay micrositios que coincidan.' : 'Todavía no hay micrositios. Cree el primero con «Nuevo micrositio».'}</p>`}</div>`);
    const f = $('[data-filtro-lista]', cuerpo);
    if (q) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  }
  vista.addEventListener('input', (e) => { if (e.target.matches('[data-filtro-lista]')) { filtroLista = e.target.value; pintarLista(); } });

  // ---------------------------------------------------------------- Editor
  function pintarEditor() {
    recoger(); lectores = [];
    const s = sitios[actual];
    $('[data-volver]', vista).hidden = false;
    const ver = $('[data-ver]', vista); ver.hidden = false; ver.href = `/${s.slug}/`;
    cuerpo.innerHTML = String(h`<div class="ms-editor-cab" style="--c:${s.tema.color}"><span class="ms-editor-ico">${ico('hoja', 20)}</span><div><b>${s.nombre}</b><small class="muted">/${s.slug}/ · ${s.publicado ? 'Publicado' : 'Borrador'}</small></div></div>
      <div class="segmentos pestanas-ext" role="tablist">${PESTANAS.map(([k, t]) => h`<button type="button" role="tab" data-pestana="${k}" aria-pressed="${k === pestana}">${t}${k === 'modulos' ? ` (${s.modulos.length})` : ''}</button>`)}</div>
      <div data-panel class="pila"></div>`);
    const panel = $('[data-panel]', cuerpo);
    if (pestana === 'general') {
      const t = nodo(h`<section class="tarjeta pila"><h2>Datos generales</h2></section>`); montar(t, GENERAL, s); panel.appendChild(t);
    } else if (pestana === 'apariencia') {
      const a = nodo(h`<section class="tarjeta pila"><h2>Colores, patrón e ícono</h2><p class="chico muted">El color principal tiñe la portada, los botones, los íconos y los fondos suaves de las secciones.</p></section>`); montar(a, TEMA, s.tema); panel.appendChild(a);
      const b = nodo(h`<section class="tarjeta pila"><h2>Portada del micrositio</h2></section>`); montar(b, PORTADA, s.portada); panel.appendChild(b);
    } else if (pestana === 'contacto') {
      const c = nodo(h`<section class="tarjeta pila"><h2>Contacto de la unidad</h2><p class="chico muted">Se muestra al final del micrositio.</p></section>`); montar(c, CONTACTO, s.contacto); panel.appendChild(c);
    } else {
      panel.appendChild(nodo(h`<p class="muted">Ordene, oculte o agregue secciones. Las que tienen «nombre corto» aparecen en la barra de navegación del micrositio. Abra un módulo para editarlo.</p>`));
      s.modulos.forEach((m, i) => {
        const def = MODULOS[m.tipo] || { n: m.tipo, campos: [] };
        const d = nodo(h`<details class="tarjeta ms-mod-editor${m.visible === false ? ' inactivo' : ''}" data-mod="${i}"${abiertos.has(m.id) ? raw(' open') : ''}>
          <summary><span class="insignia">${def.n}</span><b>${m.titulo || 'Sin título'}</b>${m.ancla ? h`<small class="muted">· en la barra: «${m.ancla}»</small>` : ''}${m.visible === false ? h`<span class="insignia">Oculto</span>` : ''}
            <span class="ms-mod-acciones"><button type="button" class="btn chico fantasma" data-mover="${i}" data-dir="-1" title="Subir" ${i === 0 ? raw('disabled') : ''}>↑</button><button type="button" class="btn chico fantasma" data-mover="${i}" data-dir="1" title="Bajar" ${i === s.modulos.length - 1 ? raw('disabled') : ''}>↓</button><button type="button" class="btn chico fantasma" data-copiar="${i}" title="Duplicar">⧉</button><button type="button" class="btn chico fantasma peligro" data-quitar="${i}" title="Quitar">✕</button></span></summary>
          <div class="pila" data-campos></div></details>`);
        if (abiertos.has(m.id)) { const c = $('[data-campos]', d); montar(c, def.campos, m); const x = nodo(h`<div class="rejilla-2 ms-comunes"></div>`); montar(x, COMUNES, m); c.appendChild(x); }
        d.addEventListener('toggle', () => { if (d.open === abiertos.has(m.id)) return; recoger(); if (d.open) abiertos.add(m.id); else abiertos.delete(m.id); pintarEditor(); });
        panel.appendChild(d);
      });
      panel.appendChild(nodo(h`<section class="tarjeta"><h2>Agregar un módulo</h2><div class="ms-tipos">${Object.entries(MODULOS).map(([k, x]) => h`<button type="button" class="ms-tipo" data-agregar="${k}"><b>${x.n}</b><small>${x.d}</small></button>`)}</div></section>`));
    }
  }

  // ---------------------------------------------------------------- Acciones
  vista.addEventListener('click', async (e) => {
    const b = e.target.closest('button, a');
    if (!b || !vista.contains(b)) return;
    const ds = b.dataset;
    if (ds.editar !== undefined) { actual = Number(ds.editar); pestana = 'general'; abiertos.clear(); pintarEditor(); window.scrollTo(0, 0); return; }
    if ('volver' in ds) { recoger(); pintarLista(); return; }
    if (ds.estadoLista) { estadoLista = ds.estadoLista; pintarLista(); return; }
    if (ds.pestana) { recoger(); pestana = ds.pestana; pintarEditor(); return; }
    if (ds.duplicar !== undefined) { const c = copia(sitios[Number(ds.duplicar)]); c.id = nuevoId(); c.nombre += ' (copia)'; c.slug += '-copia'; c.publicado = false; sitios.push(c); pintarLista(); return; }
    if (ds.eliminar !== undefined) {
      const s = sitios[Number(ds.eliminar)];
      if (!(await confirmar(`Se eliminará el micrositio «${s.nombre}» (/${s.slug}/). Se aplica al guardar.`, { titulo: 'Eliminar micrositio', boton: 'Eliminar', peligro: true }))) return;
      if (datos.plantillas.some((p) => p.sitio.id === s.id)) datos.eliminados = [...new Set([...(datos.eliminados || []), s.id])];
      sitios.splice(Number(ds.eliminar), 1); pintarLista(); return;
    }
    if ('nuevo' in ds) {
      const m = modal({ titulo: 'Nuevo micrositio', ancho: true, cuerpo: h`<p class="muted">Parta de una plantilla completa o de una base en blanco. Después puede cambiar todo.</p>
        <div class="ms-tipos"><button type="button" class="ms-tipo" data-desde=""><b>En blanco</b><small>Presentación, servicios, documentos y noticias.</small></button>${datos.plantillas.map((p) => h`<button type="button" class="ms-tipo" data-desde="${p.id}"><b>Copiar «${p.nombre}»</b><small>${p.unidad || ''} · ${p.sitio.modulos.length} módulos</small></button>`)}</div>` });
      m.raiz.addEventListener('click', (ev) => {
        const x = ev.target.closest('[data-desde]');
        if (!x) return;
        const p = datos.plantillas.find((y) => y.id === x.dataset.desde);
        const s = p ? { ...copia(p.sitio), id: nuevoId(), slug: p.sitio.slug + (sitios.some((y) => y.slug === p.sitio.slug) ? '-' + (sitios.length + 1) : ''), publicado: false } : EN_BLANCO(sitios.length + 1);
        sitios.push(s); m.cerrar(); actual = sitios.length - 1; pestana = 'general'; pintarEditor();
      });
      return;
    }
    const s = sitios[actual];
    if (!s) return;
    if (ds.agregar) {
      recoger();
      const m = { id: nuevoId(), tipo: ds.agregar, visible: true, fondo: 'auto', ancla: '' };
      for (const def of MODULOS[ds.agregar].campos) m[def.k] = def.def ?? (def.t === 'repetidor' || def.t === 'lista' ? [] : '');
      s.modulos.push(m); abiertos.add(m.id); pintarEditor();
      $(`[data-mod="${s.modulos.length - 1}"]`, cuerpo)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (ds.mover !== undefined) { e.preventDefault(); recoger(); const i = Number(ds.mover), j = i + Number(ds.dir); [s.modulos[i], s.modulos[j]] = [s.modulos[j], s.modulos[i]]; pintarEditor(); return; }
    if (ds.copiar !== undefined) { e.preventDefault(); recoger(); const c = copia(s.modulos[Number(ds.copiar)]); c.id = nuevoId(); s.modulos.splice(Number(ds.copiar) + 1, 0, c); pintarEditor(); return; }
    if (ds.quitar !== undefined) {
      e.preventDefault();
      const m = s.modulos[Number(ds.quitar)];
      if (!(await confirmar(`¿Quitar el módulo «${m.titulo || MODULOS[m.tipo]?.n}»? Se aplica al guardar.`, { titulo: 'Quitar módulo', boton: 'Quitar', peligro: true }))) return;
      recoger(); s.modulos.splice(Number(ds.quitar), 1); pintarEditor(); return;
    }
  });

  $('[data-guardar]', vista).addEventListener('click', async () => {
    recoger();
    try {
      const r = await api('PUT', 'micrositios', { sitios, eliminados: datos.eliminados || [] });
      datos.eliminados = r.eliminados;
      sitios = copia(r.sitios); guardado = JSON.stringify(sitios);
      aviso('Micrositios guardados y publicados.', 'ok');
      if (actual !== null && sitios[actual]) { lectores = []; pintarEditor(); } else pintarLista();
    } catch (er) { fallo(er); }
  });
  marcarCambios(() => { try { recoger(); } catch { /* vista cerrada */ } return JSON.stringify(sitios) !== guardado; });

  pintarLista();
}
