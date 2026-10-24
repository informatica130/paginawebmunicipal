import { h, raw, $, $$, api, aviso, fallo, fecha, insignia, estado, modal, confirmar } from '../ui.js';
import { areas } from '../campos.js';

export default async function (vista) {
  const [lista, listaAreas] = await Promise.all([api('GET', 'usuarios'), areas()]);
  const roles = estado.esquema.roles;
  const yo = estado.sesion.usuario;
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Usuarios y permisos</h1><p>Cada persona ingresa con su correo institucional. Recomendamos activar la verificación en dos pasos (Mi cuenta).</p></div><div class="acciones"><button class="btn primario" data-nuevo>+ Nuevo usuario</button></div></div>
    <div class="tarjeta plana tabla-envoltura"><table class="tabla"><thead><tr><th>Persona</th><th>Rol</th><th>Áreas</th><th>Seguridad</th><th>Último ingreso</th><th></th></tr></thead><tbody>
    ${lista.map((u) => h`<tr${u.activo ? '' : raw(' style="opacity:.6"')}><td class="titulo"><b>${u.nombre}</b><small>${u.email}${u.cargo ? ' · ' + u.cargo : ''}</small></td>
      <td>${roles[u.rol]?.nombre || u.rol}${u.activo ? '' : raw(' <span class="insignia">Desactivado</span>')}${u.accesoHasta ? h`<br><small class="muted">hasta ${fecha(u.accesoHasta)}</small>` : ''}</td>
      <td class="chico">${u.areas.length ? u.areas.map((id) => listaAreas.find((a) => a.id === id)?.titulo || id).join(', ') : 'Todas'}</td>
      <td class="chico">${u.totp ? '✔ Dos pasos' : '— Sólo contraseña'}${u.bloqueadoHasta && u.bloqueadoHasta > new Date().toISOString() ? raw('<br><span class="insignia nuevo">Bloqueado</span>') : ''}${u.debeCambiarClave ? raw('<br><small class="muted">Clave temporal</small>') : ''}</td>
      <td class="chico">${fecha(u.ultimoAcceso, { hora: true })}</td>
      <td><button class="btn chico" data-editar="${u.id}">Editar</button></td></tr>`)}
    </tbody></table></div>
    <section class="tarjeta"><h2>Roles disponibles</h2><ul class="lista-simple">${Object.entries(roles).map(([k, r]) => h`<li><span><b>${r.nombre}</b><br><small class="muted">${r.desc}</small></span><span class="chico muted">${r.permisos.length} permisos</span></li>`)}</ul>
      <p class="chico muted">Con «Encargado(a) de área» la persona sólo crea y publica contenidos de las áreas asignadas (por ejemplo, Tránsito o Salud) y sus unidades.</p></section>`);

  function formulario(u = null) {
    const c = document.createElement('form');
    const elegibles = Object.entries(roles).filter(([k]) => k !== 'superadmin' || yo.rol === 'superadmin');
    c.innerHTML = String(h`
      ${u ? '' : h`<label class="campo"><span>Correo institucional</span><input type="email" name="email" required></label>`}
      <div class="fila"><label class="campo"><span>Nombre</span><input name="nombre" value="${u?.nombre || ''}" required></label><label class="campo"><span>Cargo</span><input name="cargo" value="${u?.cargo || ''}"></label></div>
      <label class="campo"><span>Rol</span><select name="rol">${elegibles.map(([k, r]) => h`<option value="${k}"${k === (u?.rol || 'editor') ? raw(' selected') : ''}>${r.nombre} — ${r.desc}</option>`)}</select></label>
      <div class="campo"><span>Áreas (opcional: limita lo que puede editar)</span><div class="lista-tax">${listaAreas.filter((a) => !a.padre_id || listaAreas.find((p) => p.id === a.padre_id && !p.padre_id)).map((a) => h`<label class="check"><input type="checkbox" name="area" value="${a.id}"${u?.areas.includes(a.id) ? raw(' checked') : ''}> ${a.titulo}</label>`)}</div></div>
      <label class="campo"><span>Acceso vigente hasta (opcional, p. ej. reemplazos o prácticas)</span><input type="date" name="acceso_hasta" value="${u?.accesoHasta || ''}"></label>
      ${u ? h`<label class="check"><input type="checkbox" name="activo"${u.activo ? raw(' checked') : ''}> Cuenta activa</label>` : h`<label class="check"><input type="checkbox" name="correo" ${estado.sesion.sitio.correo ? raw('checked') : raw('disabled')}> Enviar la contraseña temporal por correo${estado.sesion.sitio.correo ? '' : ' (correo no configurado)'}</label>`}
      <div class="acciones" style="margin-top:12px"><button class="btn primario">Guardar</button>
        ${u && u.id !== yo.id ? h`<button type="button" class="btn" data-restablecer>Restablecer contraseña</button>${u.totp ? raw('<button type="button" class="btn" data-totp>Quitar verificación en dos pasos</button>') : ''}` : ''}</div>`);
    const m = modal({ titulo: u ? `Editar: ${u.nombre}` : 'Nuevo usuario', cuerpo: c, ancho: true });
    c.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = { nombre: c.nombre.value, cargo: c.cargo.value, rol: c.rol.value, areas: $$('input[name=area]:checked', c).map((x) => Number(x.value)), acceso_hasta: c.acceso_hasta.value || null };
      try {
        if (u) { await api('PUT', 'usuarios/' + u.id, { ...d, activo: c.activo.checked }); aviso('Usuario actualizado.', 'ok'); }
        else {
          const r = await api('POST', 'usuarios', { ...d, email: c.email.value, enviarCorreo: c.correo.checked });
          if (r.temporal) modal({ titulo: 'Contraseña temporal', cuerpo: h`<p>Entregue esta contraseña a la persona por un canal seguro. Deberá cambiarla al ingresar:</p><p class="mono" style="font-size:1.4rem">${r.temporal}</p>` });
          else aviso('Usuario creado; se envió la contraseña por correo.', 'ok');
        }
        m.cerrar(); window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (er) { fallo(er); }
    });
    $('[data-restablecer]', c)?.addEventListener('click', async () => {
      if (!(await confirmar(`¿Generar una nueva contraseña temporal para ${u.nombre}? Se cerrarán sus sesiones.`))) return;
      try { const r = await api('POST', `usuarios/${u.id}/restablecer`); modal({ titulo: 'Nueva contraseña temporal', cuerpo: h`<p>Entréguela por un canal seguro:</p><p class="mono" style="font-size:1.4rem">${r.temporal}</p>` }); } catch (er) { fallo(er); }
    });
    $('[data-totp]', c)?.addEventListener('click', async () => {
      if (!(await confirmar('¿Quitar la verificación en dos pasos (por ejemplo, si perdió su teléfono)?'))) return;
      try { await api('POST', `usuarios/${u.id}/totp-quitar`); aviso('Verificación en dos pasos quitada.', 'ok'); m.cerrar(); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (er) { fallo(er); }
    });
  }
  $('[data-nuevo]', vista).addEventListener('click', () => formulario());
  vista.addEventListener('click', (e) => { const b = e.target.closest('[data-editar]'); if (b) formulario(lista.find((x) => x.id === Number(b.dataset.editar))); });
}
