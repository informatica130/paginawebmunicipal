// Cliente de la Plataforma Municipal de Trámites (proyecto «Transito»).
// El sitio no duplica trámites: lee en vivo el catálogo público de la plataforma
// (GET /api/public/info), las próximas horas disponibles (/api/public/highlights) y
// la disponibilidad de agenda (/api/public/availability), con caché y tolerancia a
// fallas (si la plataforma no responde se muestra lo último que se obtuvo y enlaces
// directos). Todo trámite nuevo creado en la plataforma aparece solo en el sitio.
//
// También envía a la plataforma los mensajes OIRS del sitio como solicitudes
// (POST /api/integrations/solicitud con llave API), si se configura TRAMITES_API_KEY.

export function crearClienteTramites({ base, apiKey = '', codigoOirs = 'SEC-OIRS-01', fetchImpl = globalThis.fetch } = {}) {
  base = String(base || '').trim();
  if (base && !base.endsWith('/')) base += '/';
  const cache = new Map();

  async function pedir(ruta, { ttl = 300, timeout = 4000 } = {}) {
    if (!base) return null;
    const ahora = Date.now();
    const c = cache.get(ruta);
    if (c && c.hasta > ahora) return c.datos;
    if (c?.pendiente) return c.pendiente;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const pendiente = fetchImpl(base + 'api' + ruta, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then(async (r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const datos = await r.json();
        cache.set(ruta, { datos, hasta: Date.now() + ttl * 1000 });
        return datos;
      })
      .catch(() => {
        // Se conserva lo anterior (aunque esté vencido) y se reintenta en 30 s.
        if (c?.datos) { cache.set(ruta, { datos: c.datos, hasta: Date.now() + 30e3 }); return c.datos; }
        cache.set(ruta, { datos: null, hasta: Date.now() + 30e3 });
        return null;
      })
      .finally(() => clearTimeout(t));
    cache.set(ruta, { ...(c || {}), pendiente, hasta: 0 });
    return pendiente;
  }

  const enlaces = {
    portal: () => base ? base + 'portal.html' : '',
    tramite: (id) => base ? `${base}portal.html#/tramite/${encodeURIComponent(id)}` : '',
    catalogo: (dep) => base ? `${base}portal.html#/catalogo/${encodeURIComponent(dep)}` : '',
    seguimiento: (codigo = '', rut = '') => base ? `${base}portal.html#/seguimiento${codigo ? '?code=' + encodeURIComponent(codigo) + (rut ? '&rut=' + encodeURIComponent(rut) : '') : ''}` : '',
    misTramites: () => base ? `${base}portal.html#/mis-tramites` : '',
    verificar: (codigo = '') => base ? `${base}verificar.html${codigo ? '?c=' + encodeURIComponent(codigo) : ''}` : '',
    widget: () => base ? base + 'embed/melipeuco-widget.js' : '',
    intranet: () => base ? base + 'app.html' : '',
  };

  async function catalogo() {
    const info = await pedir('/public/info', { ttl: 300 });
    if (!info) return null;
    const deps = new Map((info.departments || []).map((d) => [d.id, d]));
    const procs = (info.procedures || []).map((p) => ({
      id: p.id, codigo: p.code, nombre: p.name, descripcion: p.description || '', departamento: deps.get(p.departmentId) || null,
      departamentoId: p.departmentId, categoria: p.category || '', conHora: !!p.requiresAppointment && (p.modoHora || 'reserva') === 'reserva',
      documentos: (p.documents || []).map((d) => d.name || d.nombre || d.label || String(d)).filter(Boolean), costo: p.fee || null, plazoDias: p.slaDays || null,
      autenticacion: p.autenticacion || null, icono: p.icon || '', url: enlaces.tramite(p.id),
    }));
    return { institucion: info.institucion || null, departamentos: [...deps.values()], tramites: procs, claveUnica: !!info.claveUnica };
  }

  async function destacados() {
    const h = await pedir('/public/highlights', { ttl: 60 });
    return h ? { proximas: (h.next || []).map((n) => ({ ...n, url: enlaces.tramite(n.procedureId) })), estadisticas: h.stats || null } : null;
  }

  async function estado() {
    if (!base) return { configurado: false };
    const t0 = Date.now();
    const h = await pedir('/health', { ttl: 30, timeout: 3000 });
    return { configurado: true, base, enLinea: !!h?.ok, version: h?.version || null, ms: Date.now() - t0 };
  }

  // Envía un mensaje OIRS como solicitud a la plataforma. Devuelve { trackingCode } o null.
  async function enviarSolicitudOirs(m) {
    if (!base || !apiKey) return null;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetchImpl(base + 'api/integrations/solicitud', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify({
          procedureCode: codigoOirs, origen: 'sitio-web', externalId: m.codigo,
          persona: { rut: m.rut || undefined, nombres: m.nombre, email: m.email || undefined, telefono: m.telefono || undefined },
          formData: { tipo: m.tipo, asunto: m.asunto, mensaje: m.mensaje, area: m.areaNombre || '' },
        }),
      });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  return { base, configurado: !!base, pedir, catalogo, destacados, estado, enlaces, enviarSolicitudOirs, limpiarCache: () => cache.clear() };
}
