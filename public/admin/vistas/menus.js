import { h, raw, $, $$, api, aviso, fallo, estado } from '../ui.js';
import { marcarCambios } from '../admin.js';

const NOMBRES = { principal: 'Menú principal (cabecera)', superior: 'Barra de transparencia (arriba)', pie_servicios: 'Pie: servicios municipales', pie_interes: 'Pie: enlaces de interés', pie_sitio: 'Pie: enlaces legales' };

export default async function (vista, [clave = 'principal']) {
  const [menus, paginas] = await Promise.all([api('GET', 'menus'), api('GET', 'contenidos?tipo=pagina&limite=500&orden=titulo&estado=publicado')]);
  const menu = menus.find((m) => m.clave === clave) || { clave, nombre: NOMBRES[clave] || clave, items: [] };
  // Lista plana con nivel (0, 1, 2) para editar con flechas y sangría.
  let filas = [];
  const aplanar = (items, nivel) => items.forEach((i) => { filas.push({ ...i, nivel, hijos: undefined }); aplanar(i.hijos || [], nivel + 1); });
  aplanar(menu.items, 0);
  const anidar = () => {
    const raiz = [];
    const pila = [{ hijos: raiz, nivel: -1 }];
    for (const f of filas) {
      while (pila.at(-1).nivel >= f.nivel) pila.pop();
      const nodo = { texto: f.texto, url: f.url, nueva: !!f.nueva, icono: f.icono || '', descripcion: f.descripcion || '', hijos: [] };
      pila.at(-1).hijos.push(nodo);
      pila.push({ ...nodo, nivel: f.nivel });
      pila.at(-1).hijos = nodo.hijos;
    }
    return raiz;
  };
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Menús</h1><p>Ordene con las flechas; use → y ← para convertir un elemento en submenú del anterior.</p></div>
    <div class="acciones"><select data-menu>${[...new Set([...Object.keys(NOMBRES), ...menus.map((m) => m.clave)])].map((k) => h`<option value="${k}"${k === clave ? raw(' selected') : ''}>${NOMBRES[k] || k}</option>`)}</select></div></div>
    <div class="tarjeta"><ul class="arbol-menu" data-lista></ul>
      <div class="acciones" style="margin-top:12px"><button class="btn" data-agregar>+ Enlace</button>
        <select data-pagina style="max-width:320px"><option value="">+ Agregar una página…</option>${paginas.items.map((p) => h`<option value="${p.url}">${p.titulo}</option>`)}</select>
        <button class="btn primario" data-guardar>Guardar menú</button></div></div>`);
  const lista = $('[data-lista]', vista);
  const pintar = () => {
    lista.innerHTML = String(h`${filas.map((f, i) => h`<li class="item-menu nivel-${f.nivel}" data-i="${i}">
      <input data-k="texto" value="${f.texto}" placeholder="Texto" aria-label="Texto del enlace">
      <input data-k="url" value="${f.url}" placeholder="/pagina/ o https://…" aria-label="Dirección">
      <div class="acciones"><label class="check chico" title="Abrir en otra pestaña"><input type="checkbox" data-k="nueva"${f.nueva ? raw(' checked') : ''}> ↗</label>
        <button class="btn chico fantasma" data-mov="-1" title="Subir">↑</button><button class="btn chico fantasma" data-mov="1" title="Bajar">↓</button>
        <button class="btn chico fantasma" data-niv="-1" title="Sacar del submenú">←</button><button class="btn chico fantasma" data-niv="1" title="Meter en el submenú del anterior">→</button>
        <button class="btn chico fantasma peligro" data-quitar title="Quitar">✕</button></div>
      ${f.nivel > 0 && clave === 'principal' ? h`<input data-k="descripcion" value="${f.descripcion || ''}" placeholder="Descripción breve (opcional)" style="grid-column:1/3" aria-label="Descripción">` : ''}
    </li>`)}`);
  };
  pintar();
  let inicial = JSON.stringify(filas);
  marcarCambios(() => JSON.stringify(filas) !== inicial);
  lista.addEventListener('input', (e) => { const li = e.target.closest('[data-i]'); const k = e.target.dataset.k; if (li && k) filas[li.dataset.i][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
  lista.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const i = Number(b.closest('[data-i]').dataset.i);
    if (b.dataset.mov) { const j = i + Number(b.dataset.mov); if (j >= 0 && j < filas.length) [filas[i], filas[j]] = [filas[j], filas[i]]; }
    if (b.dataset.niv) { const n = filas[i].nivel + Number(b.dataset.niv); const max = i > 0 ? filas[i - 1].nivel + 1 : 0; filas[i].nivel = Math.max(0, Math.min(n, max, 2)); }
    if (b.dataset.quitar !== undefined) filas.splice(i, 1);
    pintar();
  });
  $('[data-agregar]', vista).addEventListener('click', () => { filas.push({ texto: 'Nuevo enlace', url: '/', nivel: 0 }); pintar(); $$('input[data-k=texto]', lista).at(-1).select(); });
  $('[data-pagina]', vista).addEventListener('change', (e) => { const o = e.target.selectedOptions[0]; if (o.value) { filas.push({ texto: o.textContent, url: o.value, nivel: 0 }); pintar(); } e.target.value = ''; });
  $('[data-menu]', vista).addEventListener('change', (e) => { location.hash = '#/menus/' + e.target.value; });
  $('[data-guardar]', vista).addEventListener('click', async () => {
    try { await api('PUT', 'menus/' + clave, { nombre: menu.nombre || NOMBRES[clave], items: anidar() }); inicial = JSON.stringify(filas); aviso('Menú guardado. Ya se ve en el sitio.', 'ok'); } catch (er) { fallo(er); }
  });
}
