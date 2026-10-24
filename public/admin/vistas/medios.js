import { h, raw, $, api, aviso, fallo, fecha, puede, confirmar, modal, debounce } from '../ui.js';
import { zonaSubida, esImagen, miniatura } from '../campos.js';

export default async function (vista) {
  let pagina = 1, q = '', tipo = '';
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Biblioteca de medios</h1><p>Imágenes y documentos del sitio. Las fotos se optimizan al subirlas (formato WEBP y tamaños para celular y computador).</p></div></div>
    ${puede('medios.subir') ? raw('<div data-zona></div>') : ''}
    <div class="filtros"><label class="campo"><span>Buscar</span><input type="search" data-q></label><label class="campo"><span>Tipo</span><select data-tipo><option value="">Todos</option><option value="imagen">Imágenes</option><option value="documento">Documentos</option></select></label></div>
    <p class="chico muted" data-total></p><div class="medios" data-lista></div><p class="paginacion"><button class="btn" data-mas hidden>Ver más</button></p>`);
  const lista = $('[data-lista]', vista);
  async function cargar(agregar = false) {
    const r = await api('GET', `medios?pagina=${pagina}&q=${encodeURIComponent(q)}&tipo=${tipo}`);
    if (!agregar) lista.innerHTML = '';
    $('[data-total]', vista).textContent = `${r.total.toLocaleString('es-CL')} archivos`;
    for (const m of r.items) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'medio';
      b.innerHTML = String(h`<span class="previa">${esImagen(m) ? h`<img src="${miniatura(m)}" alt="" loading="lazy">` : (m.url.split('.').pop() || '').toUpperCase()}</span><span class="nombre">${m.titulo || m.nombre}</span>`);
      b.addEventListener('click', () => detalle(m));
      lista.appendChild(b);
    }
    $('[data-mas]', vista).hidden = pagina * 60 >= r.total;
  }
  function detalle(m) {
    const cuerpo = document.createElement('div');
    cuerpo.innerHTML = String(h`<div class="columnas-2"><div>${esImagen(m) ? h`<img src="${m.url}" alt="" style="max-width:100%;border-radius:8px">` : h`<p><a class="btn" href="${m.url}" target="_blank" rel="noopener">Abrir archivo</a></p>`}
      <p class="chico muted">${m.mime} · ${m.tamano ? (m.tamano / 1024).toFixed(0) + ' KB' : ''} ${m.ancho ? `· ${m.ancho}×${m.alto}px` : ''} · ${fecha(m.creado)}</p>
      <label class="campo"><span>Dirección del archivo</span><input readonly value="${location.origin}${m.url}" data-url></label><p data-usos class="chico"></p></div>
      <form><label class="campo"><span>Descripción (texto alternativo)</span><textarea name="alt" rows="3" placeholder="Describa lo que muestra la imagen para personas que usan lectores de pantalla">${m.alt}</textarea></label>
      <label class="campo"><span>Título</span><input name="titulo" value="${m.titulo}"></label><label class="campo"><span>Créditos</span><input name="creditos" value="${m.creditos}"></label><label class="campo"><span>Carpeta</span><input name="carpeta" value="${m.carpeta}"></label>
      <div class="acciones">${puede('medios.subir') ? raw('<button class="btn primario">Guardar</button>') : ''}<button type="button" class="btn" data-copiar>Copiar dirección</button>${puede('medios.eliminar') ? raw('<button type="button" class="btn peligro" data-borrar>Eliminar</button>') : ''}</div></form></div>`);
    const md = modal({ titulo: m.nombre, cuerpo, ancho: true });
    api('GET', `medios/${m.id}/usos`).then((u) => { $('[data-usos]', cuerpo).innerHTML = u.length ? String(h`Se usa en: ${u.map((x, i) => h`${i ? ', ' : ''}<a href="#/editar/${x.id}">${x.titulo}</a>`)}`) : 'No se usa en ningún contenido.'; });
    $('form', cuerpo).addEventListener('submit', async (e) => { e.preventDefault(); const f = e.target; try { await api('PUT', 'medios/' + m.id, { alt: f.alt.value, titulo: f.titulo.value, creditos: f.creditos.value, carpeta: f.carpeta.value }); aviso('Guardado.', 'ok'); md.cerrar(); cargar(); } catch (er) { fallo(er); } });
    $('[data-copiar]', cuerpo).addEventListener('click', () => { navigator.clipboard.writeText($('[data-url]', cuerpo).value); aviso('Dirección copiada.'); });
    $('[data-borrar]', cuerpo)?.addEventListener('click', async () => {
      if (!(await confirmar('¿Eliminar este archivo definitivamente?', { peligro: true, boton: 'Eliminar' }))) return;
      try { await api('DELETE', 'medios/' + m.id); aviso('Archivo eliminado.', 'ok'); md.cerrar(); pagina = 1; cargar(); } catch (er) { fallo(er); }
    });
  }
  $('[data-zona]', vista)?.appendChild(zonaSubida({ alSubir: () => { pagina = 1; cargar(); } }));
  $('[data-q]', vista).addEventListener('input', debounce((e) => { q = e.target.value; pagina = 1; cargar(); }));
  $('[data-tipo]', vista).addEventListener('change', (e) => { tipo = e.target.value; pagina = 1; cargar(); });
  $('[data-mas]', vista).addEventListener('click', () => { pagina++; cargar(true); });
  await cargar();
}
