// Memoria compartida para servidores sin disco permanente (Vercel).
//
// En Vercel cada instancia arranca con su propia base en /tmp, creada desde la semilla, y la
// pierde al apagarse; además puede haber varias a la vez. Sin esto, lo que se guarda en el panel
// sólo existe en la instancia que atendió esa petición y desaparece al reciclarla.
//
// Con una base Redis (Upstash, gratuita, se conecta desde Vercel → Storage) se guarda:
//  · un diario de todas las escrituras de la base (INSERT/UPDATE/DELETE), en orden: cada
//    instancia lo aplica al iniciar y, antes de atender, aplica lo que otras hayan agregado;
//  · aparte, los ajustes y los menús completos (no dependen de los números de fila), para que
//    el diseño, la portada y los menús sobrevivan también a un cambio de la semilla;
//  · los archivos subidos a la biblioteca de medios.
// El diario lleva la huella de la semilla: si la semilla cambia (otra versión del contenido
// importado), los números de fila podrían no coincidir y se empieza un diario nuevo.
// Las sesiones del panel y las visitas no pasan por aquí (las sesiones viajan firmadas).

const EXCLUIDAS = new Set(['sesiones', 'visitas']);
const ESCRITURA = /^\s*(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?|DELETE\s+FROM)\s+["`]?(\w+)/i;
const MAX_ARCHIVO = 8 * 1024 * 1024;

export function configuracionRedis(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '';
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

// Cliente mínimo de la API REST de Upstash (sin dependencias).
function clienteRedis({ url, token }, fetchImpl = fetch) {
  return async function comando(...args) {
    const r = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error('Redis: ' + (j.error || r.status));
    return j.result;
  };
}

// Los parámetros pueden traer Uint8Array (BLOB): se guardan en base64.
const codificar = (p) => p.map((v) => (v instanceof Uint8Array ? { b64: Buffer.from(v).toString('base64') } : typeof v === 'bigint' ? Number(v) : v));
const decodificar = (p) => p.map((v) => (v && typeof v === 'object' && 'b64' in v ? Buffer.from(v.b64, 'base64') : v));

export function crearPersistencia({ db, huellaSemilla, redis, fetchImpl, alCambiar = () => {}, registrar = console }) {
  const comando = clienteRedis(redis, fetchImpl);
  const DIARIO = `mlp:diario:${huellaSemilla}`;
  const AJUSTES = 'mlp:ajustes', MENUS = 'mlp:menus', ARCHIVO = 'mlp:archivo:';
  let aplicadas = 0, pendientes = [], ultimaRevision = 0, sincronizando = null;
  const estado = { activa: true, entradas: 0, error: '' };

  // Cada escritura de la base queda pendiente hasta que la petición termine.
  db.alEscribir = (sql, params) => {
    const m = ESCRITURA.exec(sql);
    if (!m || EXCLUIDAS.has(m[1].toLowerCase())) return;
    pendientes.push(JSON.stringify({ s: sql, p: codificar(params) }));
    if (/^(ajustes|menus)$/i.test(m[1])) pendientes.tablas = true;
  };

  function aplicar(entradas) {
    db.replicando = true;
    try {
      for (const e of entradas) {
        try { const { s, p } = JSON.parse(e); db.st(s).run(...decodificar(p)); } catch (er) { registrar.warn?.('No se pudo aplicar un cambio guardado:', er.message); }
      }
    } finally { db.replicando = false; }
  }

  // Ajustes y menús completos (por clave): se aplican sobre la semilla aunque el diario sea nuevo.
  async function restaurarTablas() {
    const [ajustes, menus] = await Promise.all([comando('HGETALL', AJUSTES), comando('HGETALL', MENUS)]);
    db.replicando = true;
    try {
      for (let i = 0; i < (ajustes || []).length; i += 2) db.run('INSERT INTO ajustes(clave, valor) VALUES(?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', ajustes[i], ajustes[i + 1]);
      for (let i = 0; i < (menus || []).length; i += 2) {
        const m = JSON.parse(menus[i + 1]);
        db.run('INSERT INTO menus(clave, nombre, items, modificado) VALUES(?, ?, ?, ?) ON CONFLICT(clave) DO UPDATE SET nombre = excluded.nombre, items = excluded.items, modificado = excluded.modificado', m.clave, m.nombre, m.items, m.modificado || new Date().toISOString());
      }
    } finally { db.replicando = false; }
  }
  function copiaTablas() {
    const a = db.all('SELECT clave, valor FROM ajustes').flatMap((f) => [f.clave, f.valor]);
    const m = db.all('SELECT clave, nombre, items, modificado FROM menus').flatMap((f) => [f.clave, JSON.stringify(f)]);
    return [a.length ? comando('HSET', AJUSTES, ...a) : null, m.length ? comando('HSET', MENUS, ...m) : null];
  }

  // Trae lo que otras instancias guardaron. Con `forzar` no espera el intervalo mínimo.
  async function sincronizar({ forzar = false } = {}) {
    if (!forzar && Date.now() - ultimaRevision < 2500) return;
    if (sincronizando) return sincronizando;
    sincronizando = (async () => {
      try {
        const total = Number(await comando('LLEN', DIARIO)) || 0;
        if (total > aplicadas) {
          const nuevas = await comando('LRANGE', DIARIO, aplicadas, total - 1);
          aplicar(nuevas || []);
          aplicadas += (nuevas || []).length;
          alCambiar();
        }
        estado.entradas = aplicadas; estado.error = '';
        ultimaRevision = Date.now();
      } catch (e) { estado.error = e.message; registrar.error?.('Memoria compartida no disponible:', e.message); } finally { sincronizando = null; }
    })();
    return sincronizando;
  }

  async function iniciar() {
    try { await restaurarTablas(); } catch (e) { estado.error = e.message; }
    await sincronizar({ forzar: true });
    alCambiar();
  }

  // Guarda lo pendiente de esta petición (se llama antes de enviar la respuesta).
  async function vaciar() {
    if (!pendientes.length) return;
    const lote = pendientes, tablas = lote.tablas;
    pendientes = [];
    try {
      const largo = Number(await comando('RPUSH', DIARIO, ...lote));
      // Si otra instancia escribió entre medio, sus cambios se aplicarán en la próxima revisión;
      // los propios ya están en la base local.
      if (largo - lote.length === aplicadas) aplicadas = largo;
      else ultimaRevision = 0;
      if (tablas) await Promise.all(copiaTablas());
      estado.entradas = aplicadas; estado.error = '';
    } catch (e) { estado.error = e.message; registrar.error?.('No se pudo guardar en la memoria compartida:', e.message); }
  }

  // Archivos de la biblioteca de medios.
  async function guardarArchivo(ruta, buf) {
    if (buf.length > MAX_ARCHIVO) return false;
    try { await comando('SET', ARCHIVO + ruta, buf.toString('base64')); return true; } catch (e) { estado.error = e.message; return false; }
  }
  async function leerArchivo(ruta) {
    try { const v = await comando('GET', ARCHIVO + ruta); return v ? Buffer.from(v, 'base64') : null; } catch { return null; }
  }

  return { iniciar, sincronizar, vaciar, guardarArchivo, leerArchivo, estado, hayPendientes: () => pendientes.length > 0 };
}
