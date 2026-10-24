import { h, raw, $, $$, api, estado, aviso, fallo, fecha, insignia, puede, confirmar, ico, debounce, ESTADOS } from '../ui.js';
import { miniatura } from '../campos.js';

export default async function (vista, [tipo], params) {
  const esquema = estado.esquema.tipos[tipo];
  if (!esquema) { vista.innerHTML = '<div class="caja error">Tipo de contenido desconocido.</div>'; return; }
  const jerarquico = tipo === 'pagina' || tipo === 'area';
  const ordenable = esquema.ordenable || tipo === 'area';
  const f = { estado: params.get('estado') || '', q: params.get('q') || '', pagina: Number(params.get('pagina')) || 1, mios: params.get('mios') || '' };
  vista.innerHTML = String(h`
    <div class="cabecera-vista"><div><h1>${esquema.plural}</h1><p>${ayudaTipo(tipo)}</p></div>
      <div class="acciones">${puede('contenido.crear') ? h`<a class="btn primario" href="#/nuevo/${tipo}">${ico('mas', 16)} Nuevo: ${esquema.etiqueta.toLowerCase()}</a>` : ''}</div></div>
    <div class="filtros">
      <label class="campo"><span>Buscar</span><input type="search" data-q value="${f.q}" placeholder="Título o dirección"></label>
      <label class="campo"><span>Estado</span><select data-estado><option value="">Todos</option>${Object.entries(ESTADOS).map(([k, v]) => h`<option value="${k}"${f.estado === k ? raw(' selected') : ''}>${v}</option>`)}</select></label>
      <label class="check" style="align-self:center"><input type="checkbox" data-mios${f.mios ? raw(' checked') : ''}> Sólo los míos</label>
    </div>
    <div class="tarjeta plana"><div class="tabla-envoltura" data-tabla><p class="cargando">Cargando…</p></div></div>
    <div class="paginacion" data-paginas></div>
    ${ordenable ? h`<p class="chico muted">Use las flechas ↑ ↓ para cambiar el orden en que aparecen en el sitio y pulse «Guardar orden».</p><p><button class="btn" data-guardar-orden hidden>Guardar orden</button></p>` : ''}`);

  const aplicar = () => {
    const p = new URLSearchParams();
    if (f.q) p.set('q', f.q); if (f.estado) p.set('estado', f.estado); if (f.pagina > 1) p.set('pagina', f.pagina); if (f.mios) p.set('mios', '1');
    history.replaceState(null, '', `#/contenidos/${tipo}${p.toString() ? '?' + p : ''}`);
    cargar();
  };
  $('[data-q]', vista).addEventListener('input', debounce((e) => { f.q = e.target.value; f.pagina = 1; aplicar(); }, 300));
  $('[data-estado]', vista).addEventListener('change', (e) => { f.estado = e.target.value; f.pagina = 1; aplicar(); });
  $('[data-mios]', vista).addEventListener('change', (e) => { f.mios = e.target.checked ? '1' : ''; f.pagina = 1; aplicar(); });

  let filas = [];
  async function cargar() {
    const limite = ordenable || jerarquico ? 500 : 30;
    const r = await api('GET', `contenidos?tipo=${tipo}&limite=${limite}&pagina=${f.pagina}${f.q ? '&q=' + encodeURIComponent(f.q) : ''}${f.estado ? '&estado=' + f.estado : ''}${f.mios ? '&mios=1' : ''}`);
    filas = r.items;
    if (jerarquico && !f.q) filas = arbol(filas);
    pintar(r);
  }
  function pintar(r) {
    const conImagen = ['noticia', 'slide', 'evento', 'lugar', 'autoridad'].includes(tipo);
    const extra = (c) => {
      if (tipo === 'evento') return fecha(c.datos?.inicio, { hora: true });
      if (tipo === 'sesion') return fecha(c.datos?.fecha);
      if (tipo === 'aviso') return `${{ info: 'Información', alerta: 'Alerta', emergencia: 'Emergencia', exito: 'Positivo' }[c.datos?.nivel] || ''}${c.datos?.hasta ? ' · hasta ' + fecha(c.datos.hasta) : ''}`;
      if (tipo === 'acceso' || tipo === 'slide') return c.datos?.enlace || '';
      return c.estado === 'programado' ? 'Se publica ' + fecha(c.publicado_en, { hora: true }) : fecha(c.publicado_en || c.modificado);
    };
    $('[data-tabla]', vista).innerHTML = filas.length ? String(h`<table class="tabla"><thead><tr>${conImagen ? raw('<th></th>') : ''}<th>Título</th><th>Estado</th><th>${tipo === 'evento' ? 'Fecha del evento' : tipo === 'aviso' ? 'Nivel' : tipo === 'acceso' || tipo === 'slide' ? 'Enlace' : 'Fecha'}</th><th>Autor</th><th class="sr">Acciones</th></tr></thead><tbody>
      ${filas.map((c, i) => h`<tr data-id="${c.id}">
        ${conImagen ? h`<td>${c.imagen ? h`<img class="miniatura" src="${c.imagen}" alt="" loading="lazy">` : ''}</td>` : ''}
        <td class="titulo" style="padding-left:${12 + (c.nivel || 0) * 22}px">${c.nivel ? '└ ' : ''}${c.editable ? h`<a href="#/editar/${c.id}">${c.titulo}</a>` : h`<b>${c.titulo}</b>`}${c.destacado ? raw(' <span class="insignia">★ destacado</span>') : ''}<small>${c.url}</small></td>
        <td>${insignia(c.estado)}</td><td class="chico">${extra(c)}</td><td class="chico muted">${c.autor || '—'}</td>
        <td><div class="acciones" style="flex-wrap:nowrap">
          ${ordenable ? h`<button class="btn chico fantasma" data-subir="${i}" title="Subir">↑</button><button class="btn chico fantasma" data-bajar="${i}" title="Bajar">↓</button>` : ''}
          ${!estado.esquema.tipos[tipo].sinPagina ? h`<a class="btn chico fantasma" href="${c.estado === 'publicado' ? c.url : '/vista-previa/' + c.id + '/'}" target="_blank" rel="noopener" title="${c.estado === 'publicado' ? 'Ver en el sitio' : 'Vista previa'}">${ico('ojo', 15)}</a>` : ''}
          ${puede('contenido.eliminar') && c.editable ? h`<button class="btn chico fantasma peligro" data-borrar="${c.id}" title="Eliminar">✕</button>` : ''}
        </div></td></tr>`)}
      </tbody></table>`) : `<p class="cargando">No hay ${esquema.plural.toLowerCase()} con estos filtros.</p>`;
    const p = $('[data-paginas]', vista);
    p.innerHTML = r.paginas > 1 ? String(h`<button class="btn chico" data-pag="${f.pagina - 1}"${f.pagina <= 1 ? raw(' disabled') : ''}>← Anterior</button><span>Página ${f.pagina} de ${r.paginas} · ${r.total} en total</span><button class="btn chico" data-pag="${f.pagina + 1}"${f.pagina >= r.paginas ? raw(' disabled') : ''}>Siguiente →</button>`) : String(h`<span class="chico muted">${r.total} en total</span>`);
  }
  vista.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pag) { f.pagina = Number(b.dataset.pag); aplicar(); }
    if (b.dataset.borrar) {
      const fila = filas.find((x) => x.id === Number(b.dataset.borrar));
      if (!(await confirmar(`¿Eliminar «${fila.titulo}»? Esta acción no se puede deshacer.`, { peligro: true, boton: 'Eliminar' }))) return;
      try { await api('DELETE', 'contenidos/' + fila.id); aviso('Eliminado.', 'ok'); cargar(); } catch (er) { fallo(er); }
    }
    if (b.dataset.subir || b.dataset.bajar) {
      const i = Number(b.dataset.subir ?? b.dataset.bajar);
      const j = b.dataset.subir ? i - 1 : i + 1;
      if (j < 0 || j >= filas.length || (filas[i].padre_id || 0) !== (filas[j].padre_id || 0)) return;
      [filas[i], filas[j]] = [filas[j], filas[i]];
      pintar({ paginas: 1, total: filas.length });
      const g = $('[data-guardar-orden]', vista); if (g) g.hidden = false;
    }
    if (b.dataset.guardarOrden !== undefined) {
      try { await api('POST', 'contenidos/orden', { tipo, ids: filas.map((x) => x.id) }); aviso('Orden guardado.', 'ok'); b.hidden = true; } catch (er) { fallo(er); }
    }
  });
  await cargar();
}

function arbol(items) {
  const hijos = new Map();
  for (const c of items) { const k = c.padre_id || 0; if (!hijos.has(k)) hijos.set(k, []); hijos.get(k).push(c); }
  const ids = new Set(items.map((c) => c.id));
  const out = [];
  const rec = (padre, nivel) => { for (const c of hijos.get(padre) || []) { out.push({ ...c, nivel }); rec(c.id, nivel + 1); } };
  rec(0, 0);
  for (const c of items) if (c.padre_id && !ids.has(c.padre_id) && !out.includes(c)) out.push({ ...c, nivel: 0 });
  return out;
}

function ayudaTipo(tipo) {
  return {
    noticia: 'Las noticias aparecen en la portada, en su categoría, en el RSS y se pueden enviar por el boletín.',
    pagina: 'Páginas informativas. Se organizan en jerarquía (página padre → hijas) y se arman con bloques.',
    tramite: 'Fichas de trámites con requisitos, costos y pasos. Vincúlelas a la Plataforma de Trámites para ofrecer reserva y seguimiento en línea.',
    evento: 'Agenda comunal: aparece en la portada, en el calendario y se puede agregar al calendario personal.',
    documento: 'Ordenanzas, actas, presupuestos, bases y formularios descargables, agrupados en colecciones.',
    aviso: 'Avisos y alertas que se muestran arriba en la portada (o en todo el sitio) durante el período indicado.',
    slide: 'Banners del carrusel principal de la portada. Use imágenes horizontales (por ejemplo 1600×600) y describa su texto.',
    acceso: 'Botones de colores bajo el carrusel de la portada.',
    area: 'Direcciones, departamentos y oficinas según el Reglamento de Organización Interna.',
    autoridad: 'Alcalde, concejales y otras autoridades.',
    sesion: 'Sesiones del Concejo con tabla, acuerdos, acta y transmisión.',
    contacto: 'Directorio telefónico y de correos que aparece en Contacto y en las páginas de cada servicio.',
    lugar: 'Lugares turísticos de Melipeuco.',
    encuesta: 'Consultas ciudadanas con votación en línea.',
  }[tipo] || '';
}
