import { h, raw, $, api, aviso, fallo, estado, confirmar, modal } from '../ui.js';

export default async function (vista, [tipo = 'categoria']) {
  const tax = estado.esquema.taxonomias;
  const lista = await api('GET', 'taxonomias?tipo=' + tipo);
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>${tax[tipo]?.plural || 'Categorías'}</h1><p>Organizan las noticias, eventos y documentos. Cada categoría tiene su página pública y su RSS.</p></div>
    <div class="acciones">${Object.entries(tax).map(([k, v]) => h`<a class="btn${k === tipo ? ' primario' : ''}" href="#/categorias/${k}">${v.plural}</a>`)}<button class="btn acento" data-nueva>+ Nueva</button></div></div>
    <div class="tarjeta plana"><table class="tabla"><thead><tr><th>Nombre</th><th>Dirección</th><th>Contenidos</th><th></th></tr></thead><tbody>
    ${lista.map((t) => h`<tr><td class="titulo"><b>${t.padre_id ? '└ ' : ''}${t.nombre}</b>${t.descripcion ? h`<small>${t.descripcion}</small>` : ''}</td><td class="mono chico">${tipo === 'coleccion' ? '/documentos/?coleccion=' + t.slug : `/${tipo === 'etiqueta' ? 'etiqueta' : 'categoria'}/${t.slug}/`}</td><td>${t.total}</td>
      <td><div class="acciones"><button class="btn chico" data-editar="${t.id}">Editar</button><button class="btn chico peligro" data-borrar="${t.id}">Eliminar</button></div></td></tr>`)}
    </tbody></table></div>`);
  const formulario = (t = {}) => {
    const c = document.createElement('form');
    c.innerHTML = String(h`<label class="campo"><span>Nombre</span><input name="nombre" value="${t.nombre || ''}" required></label><label class="campo"><span>Dirección (slug)</span><input name="slug" value="${t.slug || ''}" placeholder="se genera desde el nombre"></label>
      <label class="campo"><span>Descripción</span><textarea name="descripcion" rows="3">${t.descripcion || ''}</textarea></label>
      ${tax[tipo].jerarquica ? h`<label class="campo"><span>Dentro de</span><select name="padre_id"><option value="">— Ninguna —</option>${lista.filter((x) => x.id !== t.id).map((x) => h`<option value="${x.id}"${x.id === t.padre_id ? raw(' selected') : ''}>${x.nombre}</option>`)}</select></label>` : ''}
      <button class="btn primario">Guardar</button>`);
    const m = modal({ titulo: t.id ? 'Editar' : 'Nueva', cuerpo: c });
    c.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = { tipo, nombre: c.nombre.value, slug: c.slug.value, descripcion: c.descripcion.value, padre_id: c.padre_id?.value || null };
      try { t.id ? await api('PUT', 'taxonomias/' + t.id, d) : await api('POST', 'taxonomias', d); aviso('Guardado.', 'ok'); m.cerrar(); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (er) { fallo(er); }
    });
  };
  vista.addEventListener('click', async (e) => {
    if (e.target.closest('[data-nueva]')) formulario();
    const ed = e.target.closest('[data-editar]'); if (ed) formulario(lista.find((x) => x.id === Number(ed.dataset.editar)));
    const b = e.target.closest('[data-borrar]');
    if (b) {
      const t = lista.find((x) => x.id === Number(b.dataset.borrar));
      if (!(await confirmar(`¿Eliminar «${t.nombre}»? Los ${t.total} contenidos asociados no se borran.`, { peligro: true, boton: 'Eliminar' }))) return;
      try { await api('DELETE', 'taxonomias/' + t.id); aviso('Eliminada.', 'ok'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (er) { fallo(er); }
    }
  });
}
