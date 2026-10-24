import { h, raw, $, api, aviso, fallo, fecha, estado, confirmar } from '../ui.js';

export default async function (vista) {
  const u = estado.sesion.usuario;
  const sesiones = await api('GET', 'mis-sesiones');
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Mi cuenta</h1><p>${u.nombre} · ${u.email} · ${estado.esquema.roles[u.rol]?.nombre}</p></div></div>
    <div class="columnas-2">
      <section class="tarjeta"><h2>Cambiar contraseña</h2><form data-clave>
        <label class="campo"><span>Contraseña actual</span><input type="password" name="actual" autocomplete="current-password" required></label>
        <label class="campo"><span>Nueva contraseña</span><input type="password" name="nueva" autocomplete="new-password" required minlength="12"><small class="ayuda">Mínimo 12 caracteres. Al cambiarla se cierran sus otras sesiones.</small></label>
        <button class="btn primario">Cambiar contraseña</button></form></section>
      <section class="tarjeta"><h2>Verificación en dos pasos</h2><div data-totp>
        ${u.totp ? h`<p class="caja ok">✔ Activada. Al ingresar se le pedirá el código de su aplicación.</p><form data-desactivar><label class="campo"><span>Para desactivarla, ingrese su contraseña</span><input type="password" name="clave" required></label><button class="btn peligro">Desactivar</button></form>`
          : h`<p>Proteja su cuenta: además de la contraseña, se pedirá un código de 6 dígitos de una aplicación en su teléfono (Google Authenticator, Microsoft Authenticator, FreeOTP…).</p><button class="btn primario" data-activar>Activar verificación en dos pasos</button>`}
      </div></section>
    </div>
    <section class="tarjeta"><h2>Sesiones abiertas</h2><table class="tabla"><thead><tr><th>Dispositivo</th><th>IP</th><th>Inicio</th><th>Última actividad</th><th></th></tr></thead><tbody>
      ${sesiones.map((s) => h`<tr><td class="chico">${(s.agente || '').slice(0, 90)}${s.actual ? raw(' <span class="insignia activo">Esta sesión</span>') : ''}</td><td class="mono chico">${s.ip}</td><td class="chico">${fecha(s.creado, { hora: true })}</td><td class="chico">${fecha(s.ultimo_uso, { hora: true })}</td><td>${s.actual ? '' : h`<button class="btn chico" data-cerrar-sesion="${s.id}">Cerrar</button>`}</td></tr>`)}
    </tbody></table></section>`);
  $('[data-clave]', vista).addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('POST', 'clave', { actual: e.target.actual.value, nueva: e.target.nueva.value }); aviso('Contraseña cambiada.', 'ok'); e.target.reset(); } catch (er) { fallo(er); }
  });
  $('[data-activar]', vista)?.addEventListener('click', async () => {
    try {
      const r = await api('POST', 'totp/iniciar');
      const cont = $('[data-totp]', vista);
      cont.innerHTML = String(h`<ol><li>Abra su aplicación de autenticación y escanee este código:</li></ol><div class="qr">${raw(r.qr)}</div><p class="chico">¿No puede escanear? Ingrese la clave manualmente: <span class="mono">${r.secreto.match(/.{1,4}/g).join(' ')}</span></p>
        <form data-confirmar><label class="campo"><span>2. Escriba el código de 6 dígitos que muestra la aplicación</span><input name="codigo" inputmode="numeric" maxlength="6" required autocomplete="one-time-code"></label><button class="btn primario">Confirmar y activar</button></form>`);
      $('[data-confirmar]', cont).addEventListener('submit', async (e) => {
        e.preventDefault();
        try { await api('POST', 'totp/activar', { codigo: e.target.codigo.value }); estado.sesion.usuario.totp = true; aviso('Verificación en dos pasos activada.', 'ok'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (er) { fallo(er); }
      });
    } catch (er) { fallo(er); }
  });
  $('[data-desactivar]', vista)?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(await confirmar('¿Desactivar la verificación en dos pasos? Su cuenta quedará menos protegida.', { peligro: true, boton: 'Desactivar' }))) return;
    try { await api('POST', 'totp/desactivar', { clave: e.target.clave.value }); estado.sesion.usuario.totp = false; aviso('Desactivada.'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (er) { fallo(er); }
  });
  vista.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-cerrar-sesion]');
    if (!b) return;
    try { await api('DELETE', 'mis-sesiones/' + b.dataset.cerrarSesion); b.closest('tr').remove(); aviso('Sesión cerrada.'); } catch (er) { fallo(er); }
  });
}
