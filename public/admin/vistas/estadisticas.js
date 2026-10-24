import { h, raw, $, api } from '../ui.js';
import { graficoBarras } from './grafico.js';

export default async function (vista, args, params) {
  const dias = Number(params.get('dias')) || 30;
  const r = await api('GET', 'estadisticas?dias=' + dias);
  const promedio = r.serie.length ? Math.round(r.total / r.serie.length) : 0;
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Estadísticas de visitas</h1><p>Conteo propio, sin cookies ni servicios externos: no se guardan direcciones IP ni datos personales de quienes visitan.</p></div>
    <div class="acciones">${[7, 30, 90, 365].map((d) => h`<a class="btn${d === dias ? ' primario' : ''}" href="#/estadisticas?dias=${d}">${d === 365 ? '1 año' : d + ' días'}</a>`)}</div></div>
    <div class="indicadores"><div class="indicador"><b>${r.total.toLocaleString('es-CL')}</b><span>páginas vistas</span></div><div class="indicador"><b>${promedio.toLocaleString('es-CL')}</b><span>promedio diario</span></div>
      ${r.mensajesPorTipo.map((m) => h`<div class="indicador"><b>${m.n}</b><span>${m.tipo} recibidos</span></div>`)}</div>
    <section class="tarjeta"><h2>Visitas por día</h2><div data-grafico></div></section>
    <div class="columnas-2">
      <section class="tarjeta"><h2>Páginas más vistas</h2><table class="tabla"><thead><tr><th>Página</th><th>Visitas</th></tr></thead><tbody>${r.paginas.map((p) => h`<tr><td class="chico"><a href="${p.ruta}" target="_blank" rel="noopener">${p.ruta}</a></td><td>${p.n.toLocaleString('es-CL')}</td></tr>`)}</tbody></table></section>
      <section class="tarjeta"><h2>Noticias publicadas por mes</h2><table class="tabla"><thead><tr><th>Mes</th><th>Noticias</th></tr></thead><tbody>${r.noticiasPorMes.map((p) => h`<tr><td>${p.mes}</td><td>${p.n}</td></tr>`)}</tbody></table></section>
    </div>`);
  $('[data-grafico]', vista).appendChild(graficoBarras(r.serie.map((x) => ({ etiqueta: x.dia, valor: x.n })), { titulo: 'Visitas por día', unidad: 'visitas' }));
}
