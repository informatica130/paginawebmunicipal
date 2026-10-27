/* Escudo vivo de la Municipalidad de Melipeuco (cabecera y pie), con la API de animación
   nativa del navegador. Cada pieza del escudo se mueve según lo que es:
   · En reposo (cabecera): las aves planean, las araucarias se mecen con el viento y el kultrún
     late suave de vez en cuando.
   · Al pasar el cursor: el volcán se levanta, las araucarias saltan, las aves dan una vuelta, el
     kultrún gira, las trutrucas suenan y los laureles se abren.
   · En el pie: el escudo se arma pieza por pieza cuando aparece en pantalla.
   Opciones del panel: data-escudo-vivo = si | no. Nada se mueve con «reducir movimiento». */
(function () {
  'use strict';
  var d = document, raiz = d.documentElement;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  if (!('animate' in Element.prototype)) return;
  if ((window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || raiz.getAttribute('data-anim') === 'no') return;
  var activo = function () { return raiz.getAttribute('data-escudo-vivo') !== 'no'; };
  var VEL = parseFloat(getComputedStyle(raiz).getPropertyValue('--anim-vel')) || 1;
  var SALIDA = 'cubic-bezier(.16, 1, .3, 1)', REBOTE = 'cubic-bezier(.34, 1.5, .64, 1)', SENO = 'cubic-bezier(.45, 0, .55, 1)';
  function a(el, c, o) { if (!el) return null; o = Object.assign({ fill: 'none' }, o); o.duration /= VEL; if (o.delay) o.delay /= VEL; return el.animate(c, o); }
  function piezas(svg) { var p = {}; $$('.ev-pz', svg).forEach(function (u) { u.style.transformBox = 'fill-box'; p[u.getAttribute('data-pieza')] = u; }); return p; }

  // Cómo se arma cada pieza (pie de página).
  var ARMADO = {
    paisaje: ['translateY(40px) scaleY(.5)', 0, 700, SALIDA], 'arbol-i': ['scale(.2, 0) rotate(-8deg)', 220, 760, REBOTE], 'arbol-d': ['scale(.2, 0) rotate(8deg)', 280, 760, REBOTE],
    kultrun: ['scale(.15) rotate(-200deg)', 100, 900, REBOTE], 'palo-i': ['translate(-120px, -120px)', 360, 650, SALIDA], 'palo-d': ['translate(120px, -120px)', 360, 650, SALIDA],
    'campana-i': ['translate(-140px, 24px) rotate(-10deg)', 420, 700, SALIDA], 'campana-d': ['translate(140px, 24px) rotate(10deg)', 420, 700, SALIDA],
    'laurel-i': ['scale(0) rotate(-35deg)', 560, 800, REBOTE], 'laurel-d': ['scale(0) rotate(35deg)', 600, 800, REBOTE],
    aves: ['translate(80px, -36px) scale(.5)', 660, 850, 'ease-out'], cinta: ['scaleX(0)', 820, 520, SALIDA], municipalidad: ['translateY(10px)', 980, 420, SALIDA], chile: ['translateY(-8px)', 1060, 420, SALIDA],
  };
  function armar(svg, rapido) {
    var p = piezas(svg), f = rapido ? .55 : 1;
    Object.keys(ARMADO).forEach(function (n) {
      var x = ARMADO[n];
      a(p[n], [{ transform: x[0], opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: x[2] * f, delay: x[1] * f, easing: x[3], fill: 'backwards' });
    });
  }

  // Gesto completo al pasar el cursor.
  function gesto(svg) {
    var p = piezas(svg);
    a(p.paisaje, [{ transform: 'none' }, { transform: 'translateY(-6%)' }, { transform: 'none' }], { duration: 700, easing: SENO });
    ['arbol-i', 'arbol-d'].forEach(function (n, i) { a(p[n], [{ transform: 'none' }, { transform: 'translateY(-10%) rotate(' + (i ? 6 : -6) + 'deg)' }, { transform: 'none' }], { duration: 650, delay: 60 + i * 60, easing: REBOTE }); });
    a(p.aves, [{ transform: 'none' }, { transform: 'translate(30%, -40%) rotate(-8deg)' }, { transform: 'translate(-20%, -20%) rotate(6deg)' }, { transform: 'none' }], { duration: 1000, easing: SENO });
    a(p.kultrun, [{ transform: 'none' }, { transform: 'rotate(360deg)' }], { duration: 900, easing: 'cubic-bezier(.65, 0, .35, 1)' });
    ['campana-i', 'campana-d'].forEach(function (n, i) { a(p[n], [{ transform: 'none' }, { transform: 'scale(1.12)' }, { transform: 'none' }, { transform: 'scale(1.08)' }, { transform: 'none' }], { duration: 700, delay: 200 + i * 80 }); });
    ['laurel-i', 'laurel-d'].forEach(function (n, i) { a(p[n], [{ transform: 'none' }, { transform: 'rotate(' + (i ? 8 : -8) + 'deg)' }, { transform: 'none' }], { duration: 800, delay: 120, easing: SENO }); });
  }

  // Reposo de la cabecera: movimientos pequeños y lentos (se detiene fuera de pantalla).
  function reposo(svg) {
    var p = piezas(svg), lista = [];
    var bucle = function (el, c, o) { var x = a(el, c, Object.assign({ iterations: Infinity }, o)); if (x) lista.push(x); };
    bucle(p.aves, [{ transform: 'none' }, { transform: 'translate(4%, -18%)' }, { transform: 'translate(-3%, -6%)' }, { transform: 'none' }], { duration: 5200, easing: SENO });
    bucle(p['arbol-i'], [{ transform: 'none' }, { transform: 'rotate(-2.5deg)' }, { transform: 'none' }], { duration: 4600, easing: SENO });
    bucle(p['arbol-d'], [{ transform: 'none' }, { transform: 'rotate(2.5deg)' }, { transform: 'none' }], { duration: 5000, delay: 400, easing: SENO });
    bucle(p.kultrun, [{ transform: 'none' }, { transform: 'none', offset: .8 }, { transform: 'scale(1.06)', offset: .86 }, { transform: 'none', offset: .92 }, { transform: 'scale(1.04)', offset: .96 }, { transform: 'none' }], { duration: 7000 });
    return lista;
  }

  // Cabecera
  $$('.marca-viva').forEach(function (svg) {
    var lista = [];
    var iniciar = function () {
      if (!activo()) return;
      try { if (!sessionStorage.getItem('mlp-escudo')) { sessionStorage.setItem('mlp-escudo', '1'); if (!raiz.classList.contains('con-intro')) armar(svg, true); } } catch (e) {}
      lista = reposo(svg);
    };
    if (raiz.classList.contains('con-intro')) d.addEventListener('intro:fin', iniciar, { once: true }); else iniciar();
    var ocupado = false;
    var marca = svg.closest('.marca') || svg;
    marca.addEventListener('pointerenter', function () {
      if (ocupado || !activo()) return; ocupado = true;
      gesto(svg); setTimeout(function () { ocupado = false; }, 1000 / VEL);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { lista.forEach(function (x) { if (e[0].isIntersecting) x.play(); else x.pause(); }); }).observe(svg);
  });

  // Alternancia del logo de la cabecera: el escudo municipal cede su lugar al logo animado de la
  // Capital del Trekking y luego vuelve, una y otra vez. Opción «Cabecera → Alternar con el logo
  // de la Capital del Trekking» (cada cuántos segundos y con qué efecto). Se detiene al pasar el
  // cursor, con la pestaña oculta o fuera de pantalla.
  $$('.marca').forEach(function (marca) {
    var tk = marca.querySelector('.marca-tk');
    if (!tk) return;
    var svgTk = tk.querySelector('svg'), escudo = marca.querySelector('.marca-viva'), reloj = null, encima = false, visible = true;
    var cada = function () { return (Number(raiz.getAttribute('data-alternar-cada')) || 7) * 1000; };
    var activa = function () { return raiz.getAttribute('data-alternar-logo') === 'si'; };
    function mostrar(tkVisible) {
      marca.classList.toggle('cara-tk', tkVisible);
      if (tkVisible && svgTk) setTimeout(function () { svgTk.dispatchEvent(new Event('tk:reproducir')); }, 260);
      else if (!tkVisible && escudo && activo()) setTimeout(function () { gesto(escudo); }, 300);
    }
    function programar() {
      clearTimeout(reloj);
      if (!activa()) { marca.classList.remove('cara-tk'); return; }
      // El logo del trekking se queda un poco menos que el escudo.
      var t = marca.classList.contains('cara-tk') ? cada() * .8 : cada();
      reloj = setTimeout(function () { if (!encima && visible && !d.hidden) mostrar(!marca.classList.contains('cara-tk')); programar(); }, t);
    }
    marca.addEventListener('pointerenter', function () { encima = true; });
    marca.addEventListener('pointerleave', function () { encima = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(marca);
    if (raiz.classList.contains('con-intro')) d.addEventListener('intro:fin', programar, { once: true }); else programar();
    d.addEventListener('mlp:diseno', programar);
  });

  // Pie: se arma al aparecer en pantalla.
  $$('.pie-escudo.escudo-vivo').forEach(function (svg) {
    if (!('IntersectionObserver' in window) || !activo()) return;
    svg.classList.add('ev-espera');
    var obs = new IntersectionObserver(function (e) { if (!e[0].isIntersecting) return; obs.disconnect(); armar(svg); svg.classList.remove('ev-espera'); }, { threshold: .4 });
    setTimeout(function () { svg.classList.remove('ev-espera'); }, 8000);
    obs.observe(svg);
    svg.addEventListener('pointerenter', function () { if (activo()) gesto(svg); });
  });
})();
