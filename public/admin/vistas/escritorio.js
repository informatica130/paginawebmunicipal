import { h, raw, api, estado, fecha, haceCuanto, insignia, puede, ico } from '../ui.js';
import { graficoBarras } from './grafico.js';

export default async function (vista) {
  const d = await api('GET', 'escritorio');
  const t = estado.esquema.tipos;
  const cuenta = (tipo, est) => d.contenidos.filter((x) => x.tipo === tipo && (!est || x.estado === est)).reduce((a, x) => a + x.n, 0);
  const s = estado.sesion;
  vista.innerHTML = String(h`
    <div class="cabecera-vista"><div><h1>Hola, ${s.usuario.nombre.split(' ')[0]}</h1><p>Resumen del sitio web municipal.</p></div>
      <div class="acciones">
        ${puede('contenido.crear') ? h`<a class="btn primario" href="#/nuevo/noticia">${ico('mas', 16)} Nueva noticia</a><a class="btn" href="#/nuevo/aviso">${ico('escudo', 16)} Publicar un aviso</a><a class="btn" href="#/nuevo/evento">${ico('calendario', 16)} Nuevo evento</a>` : ''}
      </div>
    </div>
    ${s.sitio.efimero && !s.sitio.memoria ? h`<div class="caja alerta"><b>Sus cambios todavía no se guardan de forma permanente.</b> En Vercel cada copia del sitio tiene una base temporal: lo que guarda aquí puede no verse en otras visitas y se pierde al reiniciar. Para solucionarlo conecte una base Redis gratuita: en Vercel abra su proyecto → <b>Storage</b> → <b>Create Database</b> → <b>Upstash for Redis</b> (plan gratuito) → <b>Connect</b>, y luego <b>Redeploy</b>. El sitio la usa automáticamente.</div>` : ''}
    ${s.sitio.memoria && !s.sitio.memoria.activa ? h`<div class="caja alerta"><b>La memoria compartida no responde.</b> ${s.sitio.memoria.error} Revise la base Redis en Vercel → Storage.</div>` : ''}
    ${s.sitio.memoria?.activa ? h`<div class="caja exito"><b>Memoria compartida activa.</b> Los cambios del panel se guardan de forma permanente y llegan a todas las copias del sitio.</div>` : ''}
    <div class="indicadores">
      ${d.mensajes ? h`<a class="indicador${d.mensajes.nuevos ? ' alerta' : ''}" href="#/mensajes?estado=nuevo"><b>${d.mensajes.nuevos}</b><span>mensajes nuevos (OIRS y contacto)</span></a>` : ''}
      ${d.mensajes?.vencidos ? h`<a class="indicador alerta" href="#/mensajes"><b>${d.mensajes.vencidos}</b><span>mensajes con más de 14 días sin cerrar</span></a>` : ''}
      <a class="indicador" href="#/contenidos/noticia"><b>${cuenta('noticia', 'publicado')}</b><span>noticias publicadas</span></a>
      <a class="indicador" href="#/contenidos/tramite"><b>${cuenta('tramite', 'publicado')}</b><span>fichas de trámites</span></a>
      <a class="indicador" href="#/contenidos/pagina"><b>${cuenta('pagina')}</b><span>páginas</span></a>
      ${d.visitas ? h`<a class="indicador" href="#/estadisticas"><b>${d.visitas.hoy.toLocaleString('es-CL')}</b><span>visitas hoy · ${d.visitas.mes.toLocaleString('es-CL')} en 30 días</span></a>` : ''}
      <a class="indicador" href="#/suscriptores"><b>${d.suscriptores}</b><span>suscriptores del boletín</span></a>
    </div>
    <div class="columnas-2">
      <div>
        ${d.visitas ? h`<section class="tarjeta"><h2>Visitas de los últimos 30 días</h2><div data-grafico></div></section>` : ''}
        ${d.revision.length ? h`<section class="tarjeta"><h2>Esperan revisión</h2><ul class="lista-simple">${d.revision.map((c) => h`<li><a href="#/editar/${c.id}">${c.titulo}</a><span class="chico muted">${c.autor} · ${haceCuanto(c.modificado)}</span></li>`)}</ul></section>` : ''}
        <section class="tarjeta"><h2>Cambios recientes</h2><ul class="lista-simple">${d.recientes.map((c) => h`<li><span><a href="#/editar/${c.id}">${c.titulo}</a><br><small class="muted">${t[c.tipo]?.etiqueta || c.tipo} · ${c.por || 'carga inicial'} · ${haceCuanto(c.modificado)}</small></span>${insignia(c.estado)}</li>`)}</ul></section>
      </div>
      <div>
        <section class="tarjeta"><h2>Plataforma Municipal de Trámites</h2>
          ${d.plataforma.configurado ? h`<p class="estado-plataforma"><span class="punto ${d.plataforma.enLinea ? 'ok' : 'mal'}"></span> ${d.plataforma.enLinea ? `En línea (versión ${d.plataforma.version || '—'}, ${d.plataforma.ms} ms)` : 'No responde: el sitio muestra la última información guardada y enlaces directos.'}</p><p class="chico muted">${d.plataforma.base}</p><a class="btn chico" href="#/sistema">Ver trámites conectados</a>` : h`<p>Aún no está conectada. Defina <code>TRAMITES_URL</code> en el servidor para mostrar en el sitio los trámites en línea, las horas disponibles y el seguimiento.</p>`}
        </section>
        ${d.avisosVigentes.length ? h`<section class="tarjeta"><h2>Avisos vigentes en el sitio</h2><ul class="lista-simple">${d.avisosVigentes.map((a) => h`<li><a href="#/editar/${a.id}">${a.titulo}</a>${insignia(a.nivel, { info: 'Información', alerta: 'Alerta', emergencia: 'Emergencia', exito: 'Positivo' })}</li>`)}</ul></section>` : ''}
        ${d.programados.length ? h`<section class="tarjeta"><h2>Publicaciones programadas</h2><ul class="lista-simple">${d.programados.map((c) => h`<li><a href="#/editar/${c.id}">${c.titulo}</a><span class="chico">${fecha(c.publicado_en, { hora: true })}</span></li>`)}</ul></section>` : ''}
        ${d.misBorradores.length ? h`<section class="tarjeta"><h2>Mis borradores</h2><ul class="lista-simple">${d.misBorradores.map((c) => h`<li><a href="#/editar/${c.id}">${c.titulo}</a><span class="chico muted">${haceCuanto(c.modificado)}</span></li>`)}</ul></section>` : ''}
        <section class="tarjeta"><h2>Accesos directos</h2><div class="acciones">
          <a class="btn" href="#/contenidos/aviso">Avisos y alertas</a><a class="btn" href="#/contenidos/slide">Banners de portada</a><a class="btn" href="#/contenidos/acceso">Accesos rápidos</a>
          ${puede('menus.editar') ? raw('<a class="btn" href="#/menus">Menús</a>') : ''}${puede('ajustes.editar') ? raw('<a class="btn" href="#/ajustes">Ajustes del sitio</a>') : ''}
        </div></section>
      </div>
    </div>`);
  const g = vista.querySelector('[data-grafico]');
  if (g && d.visitas) g.appendChild(graficoBarras(d.visitas.serie.map((x) => ({ etiqueta: x.dia, valor: x.n })), { titulo: 'Visitas por día', unidad: 'visitas' }));
}
