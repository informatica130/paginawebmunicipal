// Gráfico de barras de una sola serie (SVG): barras finas con 2 px de separación,
// extremos redondeados anclados a la base, eje recesivo, etiquetas selectivas y
// tooltip al pasar el cursor o recorrer con el teclado. Incluye una tabla accesible.
import { h, nodo, esc } from '../ui.js';

export function graficoBarras(datos, { titulo = '', unidad = '' } = {}) {
  const el = nodo('<div class="grafico"></div>');
  if (!datos.length) { el.innerHTML = '<p class="muted">Aún no hay datos.</p>'; return el; }
  const W = 600, H = 180, base = 160, max = Math.max(...datos.map((d) => d.valor), 1);
  const paso = W / datos.length, ancho = Math.max(2, paso - 2);
  const fmt = (s) => { const d = new Date(s + 'T12:00'); return isNaN(d) ? s : d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }); };
  const barras = datos.map((d, i) => {
    const alto = Math.max(1, (d.valor / max) * (base - 14));
    const x = i * paso + 1, y = base - alto, r = Math.min(4, ancho / 2);
    return `<path class="barra-dato" tabindex="0" data-i="${i}" d="M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + ancho - r} Q${x + ancho},${y} ${x + ancho},${y + r} V${base} Z"><title>${esc(fmt(d.etiqueta))}: ${d.valor} ${esc(unidad)}</title></path>`;
  }).join('');
  const marcas = [0, Math.floor(datos.length / 2), datos.length - 1].map((i) => `<text x="${i * paso + paso / 2}" y="${H - 2}" text-anchor="middle">${esc(fmt(datos[i].etiqueta))}</text>`).join('');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titulo)}"><line class="eje" x1="0" x2="${W}" y1="${base}" y2="${base}"/><text x="0" y="10">${max.toLocaleString('es-CL')}</text>${barras}${marcas}</svg><div class="tooltip" hidden></div>
    <details class="chico"><summary>Ver datos en tabla</summary><table class="tabla"><thead><tr><th>Día</th><th>${esc(unidad)}</th></tr></thead><tbody>${datos.map((d) => `<tr><td>${esc(fmt(d.etiqueta))}</td><td>${d.valor}</td></tr>`).join('')}</tbody></table></details>`;
  const tip = el.querySelector('.tooltip');
  const mostrar = (b) => {
    const d = datos[Number(b.dataset.i)];
    const caja = b.getBoundingClientRect(), base_ = el.getBoundingClientRect();
    tip.textContent = `${fmt(d.etiqueta)}: ${d.valor.toLocaleString('es-CL')} ${unidad}`;
    tip.style.left = `${caja.left - base_.left + caja.width / 2}px`; tip.style.top = `${caja.top - base_.top}px`;
    tip.hidden = false;
    el.querySelectorAll('.barra-dato.activa').forEach((x) => x.classList.remove('activa'));
    b.classList.add('activa');
  };
  el.querySelectorAll('.barra-dato').forEach((b) => { b.addEventListener('mouseenter', () => mostrar(b)); b.addEventListener('focus', () => mostrar(b)); });
  el.querySelector('svg').addEventListener('mouseleave', () => { tip.hidden = true; });
  return el;
}

export { h };
