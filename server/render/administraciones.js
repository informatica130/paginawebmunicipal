// Administraciones municipales: alcaldes, concejos y principales hitos de cada gestión, con una
// comparación entre ellas. Los datos vienen de contenido/administraciones.json (reconstruidos desde
// las publicaciones de la Municipalidad, del CESFAM y de Transparencia Activa). Cada hito enlaza
// a su noticia, a su álbum de la fototeca o a otra página del sitio.

import fs from 'node:fs';
import { html, crudo, icono, migas } from './comun.js';
import { documento, encabezado } from './layout.js';
import { fecha } from '../../src/util.js';
import { indice as indiceFotos } from './fotos.js';

const RUTA = new URL('../../contenido/administraciones.json', import.meta.url);
export const BASE = '/administraciones/';
const AREAS = {
  vivienda: ['Vivienda', 'casa'], obras: ['Obras y servicios', 'herramienta'], salud: ['Salud', 'salud'], educacion: ['Educación', 'escuela'], social: ['Desarrollo social', 'personas'],
  'medio-ambiente': ['Medio ambiente', 'hoja'], turismo: ['Turismo', 'montana'], cultura: ['Cultura', 'cultura'], deporte: ['Deporte', 'deporte'], emergencias: ['Emergencias', 'alerta'],
  'box-veterinario': ['Tenencia responsable', 'perro'], 'desarrollo-local': ['Desarrollo productivo', 'trabajo'], alcaldia: ['Gestión municipal', 'escudo'],
};

let datos = null, mtime = 0;
function cargar() {
  try { const st = fs.statSync(RUTA); if (!datos || st.mtimeMs !== mtime) { datos = JSON.parse(fs.readFileSync(RUTA, 'utf8')); mtime = st.mtimeMs; } } catch { return null; }
  return datos;
}
export const hayAdministraciones = () => !!cargar();

// Enlace e imagen de un hito: su noticia (del sitio anterior o de Facebook), su álbum o una página.
function destino(ctx, h) {
  let c = null;
  if (h.noticia) c = ctx.repo.porSlug('noticia', h.noticia);
  if (!c && h.facebook) { const f = ctx.db.get('SELECT id FROM contenidos WHERE url_antigua = ?', 'facebook:' + h.facebook); if (f) c = ctx.repo.obtener(f.id); }
  if (c && ctx.repo.visible(c)) return { url: ctx.repo.urlDe(c), imagen: c.imagen || '' };
  if (h.album) { const a = indiceFotos()?.porSlug.get(h.album); if (a) return { url: `/fotos/${a.slug}/`, imagen: a.fotos[0] || '' }; }
  if (h.url) return { url: h.url, imagen: '' };
  return { url: '', imagen: '' };
}

const anios = (a) => {
  const d = new Date(a.desde || '2012-12-06'), h = a.hasta ? new Date(a.hasta) : new Date();
  return Math.round((h - d) / (365.25 * 864e5) * 10) / 10;
};
const periodo = (a) => (a.desde ? `${a.desde.slice(0, 4)} – ${a.hasta ? a.hasta.slice(0, 4) : 'hoy'}` : `hasta ${a.hasta.slice(0, 4)}`);
const duracion = (a) => (a.desde ? `${anios(a)} años de gestión` : 'Inicio sin registro');

// Lo publicado en el sitio durante cada gestión (noticias, eventos y álbumes de fotos).
function cifrasSitio(ctx, a) {
  const desde = a.desde || '2012-12-06', hasta = a.hasta || '9999-12-31';
  const n = (tipo) => ctx.db.get("SELECT count(*) n FROM contenidos WHERE tipo = ? AND estado = 'publicado' AND substr(publicado_en, 1, 10) >= ? AND substr(publicado_en, 1, 10) < ?", tipo, desde, hasta).n;
  const fotos = (indiceFotos()?.albumes || []).filter((x) => x.fecha.slice(0, 10) >= desde && x.fecha.slice(0, 10) < hasta).length;
  return { noticias: n('noticia'), eventos: n('evento'), albumes: fotos };
}

function tarjetaHito(ctx, h) {
  const d = destino(ctx, h);
  const [area, ico] = AREAS[h.area] || ['Gestión municipal', 'escudo'];
  const dentro = html`${d.imagen ? html`<span class="adm-hito-foto">${ctx.img.imagen(d.imagen, { alt: '', sizes: '120px' })}</span>` : html`<span class="adm-hito-ico">${crudo(icono(ico, { tam: 22 }))}</span>`}
    <span class="adm-hito-texto"><small>${h.fechaTexto || fecha(h.fecha, { largo: true })} · ${area}</small><b>${h.titulo}</b>${h.texto ? html`<span>${h.texto}</span>` : ''}</span>`;
  return html`<li class="adm-hito" data-area="${h.area}">${d.url ? html`<a href="${d.url}">${dentro}</a>` : html`<div>${dentro}</div>`}</li>`;
}

const pesos = (n) => '$' + Math.round(n / 1e6).toLocaleString('es-CL') + ' MM';
// Ingresos del último año disponible dentro de cada gestión.
function ingresosDe(d, a) {
  const ing = d.finanzas?.ingresos || {};
  const anios = Object.keys(ing).filter((y) => y >= (a.desde || '0').slice(0, 4) && (!a.hasta || y < a.hasta.slice(0, 4))).sort();
  return anios.length ? `${pesos(ing[anios.at(-1)])} (${anios.at(-1)})` : 'Sin datos en las fuentes';
}

function finanzas(d) {
  const f = d.finanzas;
  if (!f) return '';
  const ing = Object.entries(f.ingresos).sort(), max = Math.max(...ing.map(([, v]) => v));
  const serie = (titulo, obj) => html`<tr><th scope="row">${titulo}</th>${ing.map(([y]) => html`<td>${obj?.[y] ? pesos(obj[y]) : '—'}</td>`)}</tr>`;
  return html`<section class="adm-finanzas" id="finanzas" aria-labelledby="adm-fin-t"><h2 id="adm-fin-t">Finanzas municipales 2020–2025</h2>
    <ol class="adm-barras" aria-label="Ingresos ejecutados por año">${ing.map(([y, v]) => html`<li><span>${y}</span><span class="adm-barra" style="--p:${Math.round((v / max) * 100)}%"><b>${pesos(v)}</b></span></li>`)}</ol>
    <div class="tabla-desplazable"><table class="adm-tabla"><thead><tr><th scope="col"><span class="sr">Concepto</span></th>${ing.map(([y]) => html`<th scope="col">${y}</th>`)}</tr></thead><tbody>
      ${serie('Ingresos ejecutados del municipio', f.ingresos)}
      ${serie('Permisos de circulación y licencias', f.permisos_circulacion)}
      ${serie('Ingresos del Departamento de Salud', f.salud.ingresos)}
      ${serie('Aporte municipal a Salud', f.salud.aporte_municipal)}
      ${serie('Ingresos de Educación municipal', f.educacion.ingresos)}
      ${serie('Aporte municipal a Educación', f.educacion.aporte_municipal)}
    </tbody></table></div>
    <h3 class="adm-hitos-t">De dónde vienen los ingresos</h3>
    <div class="tabla-desplazable"><table class="adm-tabla"><thead><tr><th scope="col"><span class="sr">Concepto</span></th>${Object.keys(f.detalle).map((y) => html`<th scope="col">${y}</th>`)}</tr></thead><tbody>
      <tr><th scope="row">Fondo Común Municipal</th>${Object.values(f.detalle).map((x) => html`<td>${x.fcm_pct.toLocaleString('es-CL')}%</td>`)}</tr>
      <tr><th scope="row">Ingresos propios permanentes</th>${Object.values(f.detalle).map((x) => html`<td>${x.ipp_pct.toLocaleString('es-CL')}%</td>`)}</tr>
      <tr><th scope="row">Transferencias</th>${Object.values(f.detalle).map((x) => html`<td>${x.transf_pct.toLocaleString('es-CL')}%</td>`)}</tr>
      <tr><th scope="row">Gasto total</th>${Object.values(f.detalle).map((x) => html`<td>${pesos(x.gasto_total)}</td>`)}</tr>
      <tr><th scope="row">Programas sociales</th>${Object.values(f.detalle).map((x) => html`<td>${pesos(x.programas_sociales)}</td>`)}</tr>
    </tbody></table></div>
    <p class="meta">Fuente: ${f.fuente}</p></section>`;
}

export function paginaAdministraciones(ctx) {
  const d = cargar();
  if (!d) return null;
  const adms = d.administraciones;
  const sitio = new Map(adms.map((a) => [a.id, cifrasSitio(ctx, a)]));
  const areasDe = (a) => Object.entries(a.hitos.reduce((m, h) => ({ ...m, [h.area]: (m[h.area] || 0) + 1 }), {})).sort((x, y) => y[1] - x[1]);
  const fila = (titulo, f) => html`<tr><th scope="row">${titulo}</th>${adms.map((a) => html`<td>${f(a)}</td>`)}</tr>`;
  const cuerpo = html`${encabezado({ titulo: 'Administraciones municipales', bajada: 'Alcaldes, concejos municipales y principales hitos de cada gestión de la Municipalidad de Melipeuco, para conocerlas y compararlas.', migas: migas([{ texto: 'Municipio', url: '/municipio/' }, { texto: 'Alcaldía', url: '/alcaldia/' }, { texto: 'Administraciones' }]), ctx })}
  <div class="contenedor adm">
    <p class="adm-saltos"><a href="#comparar">Comparación</a> · <a href="#finanzas">Finanzas municipales</a></p>
    <nav class="adm-linea" aria-label="Administraciones">${adms.map((a, i) => html`<a href="#${a.id}" class="adm-linea-item${i === 0 ? ' actual' : ''}"><small>${periodo(a)}</small><b>${a.alcalde}</b><span>${i === 0 ? 'Administración actual' : duracion(a)}</span></a>`)}</nav>

    ${d.historia?.length ? html`<section class="adm-historia" aria-labelledby="adm-historia-t"><h2 id="adm-historia-t">La alcaldía antes de 2012</h2>${d.comuna?.creacion ? html`<p>${d.comuna.creacion}</p>` : ''}
      <ol class="adm-historia-lista">${d.historia.map((x) => html`<li><b>${x.periodo}</b><span><strong>${x.nombre}</strong> ${x.texto}</span></li>`)}</ol></section>` : ''}

    <section class="adm-comparar" id="comparar" aria-labelledby="adm-comparar-t">
      <h2 id="adm-comparar-t">Comparación de administraciones</h2>
      <div class="tabla-desplazable"><table class="adm-tabla">
        <thead><tr><th scope="col"><span class="sr">Dato</span></th>${adms.map((a) => html`<th scope="col"><a href="#${a.id}">${a.alcalde}</a><small>${periodo(a)}</small></th>`)}</tr></thead>
        <tbody>
          ${fila('Años de gestión', (a) => (!a.desde ? 'Sin dato (registros desde 2013)' : a.hasta ? anios(a) : `${anios(a)} (en curso)`))}
          ${fila('Concejos municipales', (a) => a.concejos.map((c) => c.periodo).join(' · '))}
          ${fila('Hitos documentados', (a) => html`<b>${a.hitos.length}</b>`)}
          ${fila('Áreas con más hitos', (a) => areasDe(a).slice(0, 3).map(([k, n]) => `${(AREAS[k] || [k])[0]} (${n})`).join(', '))}
          ${fila('Noticias publicadas en el sitio', (a) => sitio.get(a.id).noticias)}
          ${fila('Eventos en la agenda', (a) => sitio.get(a.id).eventos)}
          ${fila('Álbumes en la fototeca', (a) => sitio.get(a.id).albumes)}
          ${fila('Ingresos municipales', (a) => ingresosDe(d, a))}
          ${fila('Cuentas públicas revisadas', (a) => (a.cuentas || []).join(', ') || '—')}
        </tbody>
      </table></div>
      <p class="meta">Los hitos y las cifras salen de lo que cada administración publicó; un período con menos publicaciones disponibles puede tener menos hitos registrados.</p>
    </section>

    ${adms.map((a, i) => html`<section class="adm-gestion" id="${a.id}" aria-labelledby="${a.id}-t">
      <div class="adm-cab"><p class="ms-antetitulo">${crudo(icono('escudo', { tam: 18 }))}<span>${i === 0 ? 'Administración actual' : 'Administración anterior'} · ${periodo(a)}</span></p>
        <h2 id="${a.id}-t">${a.alcalde}</h2><p class="adm-resumen">${a.resumen}</p></div>
      ${a.cifras.length ? html`<ul class="adm-cifras">${a.cifras.map((c) => html`<li><b>${c.valor}</b><span>${c.etiqueta}</span>${c.nota ? html`<small>${c.nota}</small>` : ''}</li>`)}</ul>` : ''}
      <div class="adm-concejos">${a.concejos.map((c) => html`<div class="adm-concejo"><h3>Concejo ${c.periodo}</h3><p class="adm-presidente">Preside: <b>Alcalde ${a.alcalde}</b></p>
        <ul>${c.concejales.map((n) => html`<li>${crudo(icono('usuario', { tam: 16 }))} ${n}</li>`)}</ul>${c.actividad ? html`<p class="adm-actividad">${c.actividad}</p>` : ''}<p class="meta">Fuente: ${c.fuente}.</p></div>`)}</div>
      ${a.nuevas_unidades?.length ? html`<h3 class="adm-hitos-t">Nuevas unidades y oficinas municipales</h3><ul class="chips adm-unidades">${a.nuevas_unidades.map((u) => html`<li class="chip">${u}</li>`)}</ul>` : ''}
      <h3 class="adm-hitos-t">Principales hitos</h3>
      ${(() => { const porAnio = {}; for (const h of a.hitos) (porAnio[h.fecha.slice(0, 4)] ||= []).push(h);
        return Object.keys(porAnio).sort().reverse().map((y) => html`<div class="adm-anio"><h4>${y}</h4><ol class="adm-hitos">${porAnio[y].slice().reverse().map((h) => tarjetaHito(ctx, h))}</ol></div>`); })()}
      ${a.cartera ? html`<h3 class="adm-hitos-t">${a.cartera.titulo} <small>${a.cartera.total}</small></h3><p class="meta">${a.cartera.texto}</p>
        <div class="tabla-desplazable"><table class="adm-tabla adm-cartera"><thead><tr><th scope="col">Proyecto</th><th scope="col">Monto</th><th scope="col">Estado</th></tr></thead>
        <tbody>${a.cartera.items.map((x) => html`<tr><td>${x.nombre}</td><td>${x.monto}</td><td>${x.estado}</td></tr>`)}</tbody></table></div>` : ''}
    </section>`)}
    ${finanzas(d)}
    <p class="meta adm-nota">${d.nota}</p>
  </div>`;
  return documento(ctx, { titulo: 'Administraciones municipales', descripcion: 'Alcaldes, concejos y principales hitos de las administraciones de la Municipalidad de Melipeuco desde 2012, con una comparación entre ellas.', cuerpo, canonical: BASE });
}

// Llamado para los micrositios de Alcaldía y Concejo.
export function llamadoAdministraciones() {
  const d = cargar();
  if (!d) return '';
  const a = d.administraciones;
  return html`<div class="ms-llamado">${crudo(icono('escudo', { tam: 40, clase: 'ms-llamado-ico' }))}<div><h2>Administraciones municipales</h2><p>${a.map((x) => `${x.alcalde} (${periodo(x)})`).join(' · ')}. Conozca sus concejos y los principales hitos de cada gestión, y compárelas.</p></div>
    <div class="botonera"><a class="boton boton-acento" href="${BASE}">Ver administraciones</a><a class="boton ms-boton-claro" href="${BASE}#comparar">Comparar</a></div></div>`;
}
