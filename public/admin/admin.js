// Panel de administración del sitio web municipal: ingreso, estructura y enrutador.

import { h, raw, nodo, $, $$, api, estado, aviso, fallo, ico, debounce, puede } from './ui.js';

const app = $('#app');
const VISTAS = {
  '': () => import('./vistas/escritorio.js'),
  contenidos: () => import('./vistas/contenidos.js'),
  editar: () => import('./vistas/editor.js'),
  nuevo: () => import('./vistas/editor.js'),
  medios: () => import('./vistas/medios.js'),
  menus: () => import('./vistas/menus.js'),
  categorias: () => import('./vistas/categorias.js'),
  mensajes: () => import('./vistas/mensajes.js'),
  suscriptores: () => import('./vistas/suscriptores.js'),
  usuarios: () => import('./vistas/usuarios.js'),
  auditoria: () => import('./vistas/auditoria.js'),
  estadisticas: () => import('./vistas/estadisticas.js'),
  ajustes: () => import('./vistas/ajustes.js'),
  sistema: () => import('./vistas/sistema.js'),
  cuenta: () => import('./vistas/cuenta.js'),
};

// ------------------------------------------------------------------ Ingreso
function pantallaIngreso(mensaje = '') {
  app.innerHTML = String(h`<main class="ingreso"><form class="ingreso-caja" novalidate>
    <img src="/img/logo-claro.webp" alt="">
    <h1>Panel del sitio web</h1><p class="sub">Municipalidad de Melipeuco</p>
    ${mensaje ? h`<div class="caja alerta" role="alert">${mensaje}</div>` : ''}
    <div data-paso="1">
      <label class="campo"><span>Correo institucional</span><input type="email" name="email" autocomplete="username" required></label>
      <label class="campo"><span>Contraseña</span><input type="password" name="clave" autocomplete="current-password" required></label>
    </div>
    <div data-paso="2" hidden>
      <p>Ingrese el código de 6 dígitos de su aplicación de autenticación.</p>
      <label class="campo"><span>Código de verificación</span><input name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}"></label>
    </div>
    <div class="caja error" data-error hidden role="alert"></div>
    <button class="btn primario" style="width:100%" type="submit">Ingresar</button>
    <p class="chico muted" style="margin-top:14px;text-align:center"><a href="/">← Volver al sitio</a></p>
  </form></main>`);
  const f = $('form', app);
  let paso = 1;
  fetch('/api/salud').then((r) => r.json()).then((s) => {
    if (s.efimero && !s.claveAdminDefinida) f.querySelector('h1').insertAdjacentHTML('afterend', '<div class="caja alerta">Este sitio corre en Vercel sin la variable <b>ADMIN_PASSWORD</b>. Defínala en Vercel (Settings → Environment Variables) junto con <b>ADMIN_EMAIL</b> y vuelva a desplegar para poder ingresar.</div>');
  }).catch(() => {});
  $('input[name=email]', f).focus();
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('[data-error]', f);
    err.hidden = true;
    const b = $('button[type=submit]', f);
    b.disabled = true;
    try {
      if (paso === 1) {
        const r = await api('POST', 'login', { email: f.email.value, clave: f.clave.value });
        if (r.paso === 'totp') { paso = 2; $('[data-paso="1"]', f).hidden = true; $('[data-paso="2"]', f).hidden = false; f.codigo.focus(); b.disabled = false; return; }
      } else {
        await api('POST', 'login/totp', { codigo: f.codigo.value });
      }
      await iniciar();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false; b.disabled = false;
    }
  });
}

function pantallaCambioClave() {
  app.innerHTML = String(h`<main class="ingreso"><form class="ingreso-caja">
    <img src="/img/logo-claro.webp" alt=""><h1>Cree su contraseña</h1>
    <p class="sub">Por seguridad debe reemplazar la contraseña temporal.</p>
    <label class="campo"><span>Contraseña temporal</span><input type="password" name="actual" autocomplete="current-password" required></label>
    <label class="campo"><span>Nueva contraseña</span><input type="password" name="nueva" autocomplete="new-password" required minlength="12"><small class="ayuda">Mínimo 12 caracteres, con al menos tres de: minúsculas, mayúsculas, números y símbolos. Una frase larga es más segura y fácil de recordar.</small></label>
    <label class="campo"><span>Repita la nueva contraseña</span><input type="password" name="repetir" autocomplete="new-password" required></label>
    <div class="caja error" data-error hidden role="alert"></div>
    <button class="btn primario" style="width:100%">Guardar y continuar</button>
  </form></main>`);
  const f = $('form', app);
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('[data-error]', f);
    if (f.nueva.value !== f.repetir.value) { err.textContent = 'Las contraseñas no coinciden.'; err.hidden = false; return; }
    try { await api('POST', 'clave', { actual: f.actual.value, nueva: f.nueva.value }); aviso('Contraseña actualizada.', 'ok'); await iniciar(); } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
}

// ------------------------------------------------------------------ Estructura
let contadorMensajes = 0;
function estructura() {
  const s = estado.sesion;
  const tipos = estado.esquema.tipos;
  const enlace = (ruta, texto, icono, extra = '') => h`<a class="item" href="#/${ruta}" data-ruta="${ruta}">${ico(icono)} ${texto}${extra}</a>`;
  const tipo = (t, icono) => (tipos[t] ? enlace('contenidos/' + t, tipos[t].plural, icono) : '');
  app.innerHTML = String(h`<div class="app">
    <aside class="lateral" id="lateral">
      <a class="marca" href="#/"><img src="/img/logo-oscuro.webp" alt=""><span><b>Sitio web municipal</b><small>Panel de administración</small></span></a>
      <nav aria-label="Secciones del panel">
        ${enlace('', 'Escritorio', 'inicio')}
        <div class="grupo">Contenido</div>
        ${tipo('noticia', 'doc')}${tipo('pagina', 'doc')}${tipo('tramite', 'llave')}${tipo('evento', 'calendario')}${tipo('documento', 'doc')}
        ${tipo('aviso', 'escudo')}${tipo('slide', 'img')}${tipo('acceso', 'enlace')}
        <div class="grupo">Municipio</div>
        ${tipo('area', 'escudo')}${tipo('autoridad', 'usuarios')}${tipo('sesion', 'calendario')}${tipo('contacto', 'correo')}${tipo('lugar', 'img')}${tipo('encuesta', 'grafico')}
        <div class="grupo">Organización</div>
        ${enlace('medios', 'Biblioteca de medios', 'img')}
        ${puede('menus.editar') ? enlace('menus', 'Menús', 'menu') : ''}
        ${puede('taxonomias.editar') ? enlace('categorias', 'Categorías y etiquetas', 'tag') : ''}
        ${puede('mensajes.ver') ? h`<div class="grupo">Ciudadanía</div>${enlace('mensajes', 'Mensajes y OIRS', 'correo', raw('<span class="num" data-num-mensajes hidden></span>'))}` : ''}
        ${puede('suscriptores.ver') ? enlace('suscriptores', 'Boletín', 'correo') : ''}
        <div class="grupo">Administración</div>
        ${puede('estadisticas.ver') ? enlace('estadisticas', 'Estadísticas', 'grafico') : ''}
        ${puede('ajustes.editar') ? enlace('ajustes', 'Ajustes del sitio', 'ajustes') : ''}
        ${puede('usuarios.gestionar') ? enlace('usuarios', 'Usuarios y permisos', 'usuarios') : ''}
        ${puede('auditoria.ver') ? enlace('auditoria', 'Auditoría', 'escudo') : ''}
        ${puede('ajustes.editar') || puede('respaldo.gestionar') || puede('redirecciones.editar') ? enlace('sistema', 'Sistema e integraciones', 'servidor') : ''}
      </nav>
      <div class="pie-lateral">
        <a href="/" target="_blank" rel="noopener">${ico('ojo', 16)} Ver el sitio</a>
        ${s.sitio.tramites ? h`<a href="${s.sitio.tramites}app.html" target="_blank" rel="noopener">${ico('llave', 16)} Plataforma de Trámites</a>` : ''}
        <button type="button" data-tema>${ico('luna', 16)} Modo claro / oscuro</button>
      </div>
    </aside>
    <div class="principal">
      <header class="barra">
        <button type="button" class="btn fantasma menu-movil" data-menu aria-label="Menú">${ico('menu')}</button>
        <div class="buscar-admin">${ico('buscar', 16)}<input type="search" placeholder="Buscar contenido por título…" aria-label="Buscar contenido" data-buscar><div class="resultados-admin" hidden></div></div>
        <div class="usuario"><span>${s.usuario.nombre}</span><a class="btn chico" href="#/cuenta">Mi cuenta</a><button class="btn chico" data-salir>${ico('salir', 14)} Salir</button></div>
      </header>
      <main class="vista" id="vista" tabindex="-1"></main>
    </div>
  </div>`);
  $('[data-salir]').addEventListener('click', async () => { await api('POST', 'logout').catch(() => {}); estado.sesion = null; location.hash = ''; pantallaIngreso(); });
  $('[data-menu]').addEventListener('click', () => $('#lateral').classList.toggle('abierto'));
  $('[data-tema]').addEventListener('click', () => { const r = document.documentElement; r.dataset.tema = r.dataset.tema === 'oscuro' ? '' : 'oscuro'; try { localStorage.setItem('mlp-admin-tema', r.dataset.tema); } catch {} });
  const buscar = $('[data-buscar]'), res = $('.resultados-admin');
  buscar.addEventListener('input', debounce(async () => {
    const q = buscar.value.trim();
    if (q.length < 2) { res.hidden = true; return; }
    const items = await api('GET', 'buscar?q=' + encodeURIComponent(q));
    res.innerHTML = String(h`${items.map((c) => h`<a href="#/editar/${c.id}"><span>${c.titulo}</span><small class="muted">${estado.esquema.tipos[c.tipo]?.etiqueta || c.tipo}</small></a>`)}${items.length ? '' : raw('<p class="chico muted" style="padding:8px 12px;margin:0">Sin resultados</p>')}`);
    res.hidden = false;
  }));
  document.addEventListener('click', (e) => { if (!e.target.closest('.buscar-admin')) res.hidden = true; });
  res.addEventListener('click', () => { res.hidden = true; buscar.value = ''; });
  actualizarMensajes();
}

async function actualizarMensajes() {
  if (!puede('mensajes.ver')) return;
  try {
    const r = await api('GET', 'mensajes?estado=nuevo');
    contadorMensajes = r.total;
    const n = $('[data-num-mensajes]');
    if (n) { n.textContent = r.total; n.hidden = !r.total; }
  } catch { /* sin conexión */ }
}
setInterval(() => estado.sesion && actualizarMensajes(), 120000);

// ------------------------------------------------------------------ Enrutador
let cambiosSinGuardar = null;
export function marcarCambios(fn) { cambiosSinGuardar = fn; }
window.addEventListener('beforeunload', (e) => { if (cambiosSinGuardar?.()) { e.preventDefault(); e.returnValue = ''; } });

let rutaAnterior = location.hash;
async function enrutar() {
  if (!estado.sesion) return;
  if (cambiosSinGuardar?.() && location.hash !== rutaAnterior && !confirm('Hay cambios sin guardar. ¿Salir de todas formas?')) { history.replaceState(null, '', rutaAnterior); return; }
  cambiosSinGuardar = null;
  rutaAnterior = location.hash;
  const partes = location.hash.replace(/^#\/?/, '').split('?')[0].split('/').map(decodeURIComponent);
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const cargar = VISTAS[partes[0]] || VISTAS[''];
  $$('.lateral a.item').forEach((a) => {
    const r = a.dataset.ruta;
    a.classList.toggle('activo', r === partes.slice(0, r.split('/').length).join('/') && (r !== '' || partes[0] === ''));
  });
  $('#lateral')?.classList.remove('abierto');
  const vista = $('#vista');
  vista.innerHTML = '<p class="cargando">Cargando…</p>';
  try {
    const m = await cargar();
    await m.default(vista, partes.slice(1), params, partes[0]);
    vista.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch (e) {
    vista.innerHTML = String(h`<div class="caja error"><b>No se pudo cargar esta sección.</b><p>${e.message}</p></div>`);
    if (e.status !== 403) console.error(e);
  }
}
window.addEventListener('hashchange', enrutar);
window.addEventListener('mlp:salir', () => pantallaIngreso('Su sesión terminó. Ingrese nuevamente.'));
window.addEventListener('mlp:cambiar-clave', () => pantallaCambioClave());

async function iniciar() {
  try {
    const s = await api('GET', 'sesion');
    estado.sesion = s; estado.csrf = s.csrf; estado.esquema = s.esquema;
    if (s.usuario.debeCambiarClave) return pantallaCambioClave();
    estructura();
    enrutar();
  } catch (e) {
    if (e.status === 401 || e.status === 403) pantallaIngreso();
    else app.innerHTML = String(h`<div class="caja error" style="margin:30px">No se pudo conectar con el servidor: ${e.message}</div>`);
  }
}

export { actualizarMensajes };
iniciar();
