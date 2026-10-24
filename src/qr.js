// Codificador de códigos QR (ISO/IEC 18004) en JavaScript puro, sin dependencias:
// sirve en el navegador y en Node. Modo byte (UTF-8), selección automática de
// versión (1–40), niveles de corrección L/M/Q/H, Reed–Solomon sobre GF(256),
// intercalado de bloques, las 8 máscaras con puntaje de penalización y la
// información de formato/versión. Lo usan el generador PDF del servidor y las
// vistas que muestran el QR de verificación.

// Nivel de corrección: índice en las tablas y bits de formato.
const NIVELES = { L: { i: 0, f: 1 }, M: { i: 1, f: 0 }, Q: { i: 2, f: 3 }, H: { i: 3, f: 2 } };

// Codewords de corrección por bloque y número de bloques (índice = versión).
const ECC_POR_BLOQUE = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const BLOQUES = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

// Módulos disponibles para datos (incluye los de resto) en una versión.
function modulosDatos(v) {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const n = Math.floor(v / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (v >= 7) r -= 36;
  }
  return r;
}

function codewordsDatos(v, nivel) {
  return Math.floor(modulosDatos(v) / 8) - ECC_POR_BLOQUE[nivel][v] * BLOQUES[nivel][v];
}

// Posiciones de los patrones de alineamiento.
function posAlineamiento(v) {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2;
  const tam = v * 4 + 17;
  const paso = Math.floor((v * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
  const r = [6];
  for (let p = tam - 7; r.length < n; p -= paso) r.splice(1, 0, p);
  return r;
}

// ---------- Reed–Solomon sobre GF(256), polinomio 0x11D ----------
function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(grado) {
  const r = new Array(grado).fill(0);
  r[grado - 1] = 1;
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfMul(r[j], raiz);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    raiz = gfMul(raiz, 0x02);
  }
  return r;
}

function rsResto(datos, divisor) {
  const r = divisor.map(() => 0);
  for (const b of datos) {
    const f = b ^ r.shift();
    r.push(0);
    divisor.forEach((c, i) => (r[i] ^= gfMul(c, f)));
  }
  return r;
}

function utf8(texto) {
  if (texto instanceof Uint8Array) return texto;
  return new TextEncoder().encode(String(texto ?? ''));
}

const MASCARAS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

// Devuelve la matriz del código QR: arreglo de filas de booleanos (true = oscuro),
// sin zona de silencio. `mascara` (0–7) fuerza una máscara (pruebas).
export function qrMatriz(texto, { ecc = 'M', mascara = null } = {}) {
  const nv = NIVELES[String(ecc).toUpperCase()];
  if (!nv) throw new Error(`Nivel de corrección QR inválido: ${ecc}`);
  const datos = utf8(texto);

  // 1) Versión mínima que admite los datos en modo byte.
  let ver = 0;
  for (let v = 1; v <= 40; v++) {
    const bits = 4 + (v < 10 ? 8 : 16) + datos.length * 8;
    if (bits <= codewordsDatos(v, nv.i) * 8) {
      ver = v;
      break;
    }
  }
  if (!ver) throw new Error('Texto demasiado largo para un código QR');

  // 2) Flujo de bits: modo (0100), largo, datos, terminador y relleno.
  const bits = [];
  const poner = (valor, n) => {
    for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };
  poner(0b0100, 4);
  poner(datos.length, ver < 10 ? 8 : 16);
  for (const b of datos) poner(b, 8);
  const capacidad = codewordsDatos(ver, nv.i) * 8;
  poner(0, Math.min(4, capacidad - bits.length));
  poner(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacidad; pad ^= 0xec ^ 0x11) poner(pad, 8);
  const cw = [];
  for (let i = 0; i < bits.length; i += 8) cw.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  // 3) División en bloques, corrección de errores e intercalado.
  const nBloques = BLOQUES[nv.i][ver];
  const eccLen = ECC_POR_BLOQUE[nv.i][ver];
  const total = Math.floor(modulosDatos(ver) / 8);
  const cortos = nBloques - (total % nBloques);
  const largoCorto = Math.floor(total / nBloques);
  const divisor = rsDivisor(eccLen);
  const bloques = [];
  for (let i = 0, k = 0; i < nBloques; i++) {
    const d = cw.slice(k, k + largoCorto - eccLen + (i < cortos ? 0 : 1));
    k += d.length;
    const e = rsResto(d, divisor);
    if (i < cortos) d.push(0); // hueco para igualar largos al intercalar
    bloques.push(d.concat(e));
  }
  const final = [];
  for (let i = 0; i < bloques[0].length; i++) {
    bloques.forEach((b, j) => {
      if (i !== largoCorto - eccLen || j >= cortos) final.push(b[i]);
    });
  }

  // 4) Patrones de función.
  const n = ver * 4 + 17;
  const m = Array.from({ length: n }, () => new Array(n).fill(false));
  const fn = Array.from({ length: n }, () => new Array(n).fill(false));
  const fijar = (x, y, osc) => {
    m[y][x] = osc;
    fn[y][x] = true;
  };
  for (let i = 0; i < n; i++) {
    fijar(6, i, i % 2 === 0);
    fijar(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < n && y >= 0 && y < n) fijar(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
  const al = posAlineamiento(ver);
  for (let i = 0; i < al.length; i++) {
    for (let j = 0; j < al.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fijar(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  const formato = (mask) => {
    const d = (nv.f << 3) | mask;
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412;
    const bit = (i) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) fijar(8, i, bit(i));
    fijar(8, 7, bit(6));
    fijar(8, 8, bit(7));
    fijar(7, 8, bit(8));
    for (let i = 9; i < 15; i++) fijar(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) fijar(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) fijar(8, n - 15 + i, bit(i));
    fijar(8, n - 8, true); // módulo oscuro
  };
  formato(0); // reserva
  if (ver >= 7) {
    let r = ver;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (ver << 12) | r;
    for (let i = 0; i < 18; i++) {
      const osc = ((b >>> i) & 1) === 1;
      const a = n - 11 + (i % 3);
      const c = Math.floor(i / 3);
      fijar(a, c, osc);
      fijar(c, a, osc);
    }
  }

  // 5) Ubicación de los codewords en zigzag.
  let k = 0;
  for (let der = n - 1; der >= 1; der -= 2) {
    if (der === 6) der = 5;
    for (let v = 0; v < n; v++) {
      for (let j = 0; j < 2; j++) {
        const x = der - j;
        const y = ((der + 1) & 2) === 0 ? n - 1 - v : v;
        if (!fn[y][x] && k < final.length * 8) {
          m[y][x] = ((final[k >>> 3] >>> (7 - (k & 7))) & 1) === 1;
          k++;
        }
      }
    }
  }

  // 6) Máscara: la de menor penalización (o la forzada).
  const aplicar = (mask) => {
    const f = MASCARAS[mask];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fn[y][x] && f(x, y)) m[y][x] = !m[y][x];
  };
  let mejor = mascara;
  if (mejor === null || mejor === undefined) {
    let min = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      aplicar(mask);
      formato(mask);
      const p = penalizacion(m);
      if (p < min) {
        min = p;
        mejor = mask;
      }
      aplicar(mask);
    }
  }
  aplicar(mejor);
  formato(mejor);
  return m;
}

// Puntaje de penalización (reglas N1–N4 de la norma).
function penalizacion(m) {
  const n = m.length;
  let r = 0;
  const contarPatrones = (h) => {
    const u = h[1];
    const nucleo = u > 0 && h[2] === u && h[3] === u * 3 && h[4] === u && h[5] === u;
    return (nucleo && h[0] >= u * 4 && h[6] >= u ? 1 : 0) + (nucleo && h[6] >= u * 4 && h[0] >= u ? 1 : 0);
  };
  const agregar = (largo, h) => {
    if (h[0] === 0) largo += n; // borde claro inicial
    h.pop();
    h.unshift(largo);
  };
  for (const vertical of [false, true]) {
    for (let a = 0; a < n; a++) {
      let color = false;
      let run = 0;
      const h = [0, 0, 0, 0, 0, 0, 0];
      for (let b = 0; b < n; b++) {
        const c = vertical ? m[b][a] : m[a][b];
        if (c === color) {
          run++;
          if (run === 5) r += 3;
          else if (run > 5) r++;
        } else {
          agregar(run, h);
          if (!color) r += contarPatrones(h) * 40;
          color = c;
          run = 1;
        }
      }
      if (color) {
        agregar(run, h);
        run = 0;
      }
      agregar(run + n, h); // borde claro final
      r += contarPatrones(h) * 40;
    }
  }
  let oscuros = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (m[y][x]) oscuros++;
      if (y < n - 1 && x < n - 1) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) r += 3;
      }
    }
  }
  const total = n * n;
  r += (Math.ceil(Math.abs(oscuros * 20 - total * 10) / total) - 1) * 10;
  return r;
}

// SVG autónomo con un único <path> (tramos horizontales de módulos oscuros).
export function qrSvg(texto, { tam = 160, margen = 4, ecc = 'M', color = '#000', fondo = '#fff' } = {}) {
  const m = qrMatriz(texto, { ecc });
  const lado = m.length + 2 * margen;
  let d = '';
  m.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      if (!fila[x]) continue;
      let w = 1;
      while (x + w < fila.length && fila[x + w]) w++;
      d += `M${x + margen} ${y + margen}h${w}v1h-${w}z`;
      x += w - 1;
    }
  });
  const attr = (s) => String(s).replace(/[&"<>]/g, (c) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[c]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" role="img" aria-label="Código QR">${fondo ? `<rect width="${lado}" height="${lado}" fill="${attr(fondo)}"/>` : ''}<path d="${d}" fill="${attr(color)}"/></svg>`;
}
