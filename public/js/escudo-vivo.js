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
  if ((window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || raiz.getAttribute('data-anim') === 'no' || raiz.getAttribute('data-movimiento') === 'nada') return;
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

  // Alternancia del logo de la cabecera: el escudo municipal sale, entra el logo de la Capital
  // del Trekking (sus letras caen, saltan u ondulan según «Entrada de las letras»), se queda unos
  // segundos, sus letras se van una a una y vuelve el escudo armándose pieza por pieza.
  // Efectos del cambio (data-alternar-efecto): giro, volteo, fundido, deslizar, barrido, zoom.
  // Se detiene con el cursor encima, con la pestaña oculta, fuera de pantalla y en la cabecera
  // compacta.
  var EFECTOS = {
    giro: { sale: [{ transform: 'none', opacity: 1 }, { transform: 'rotateX(90deg)', opacity: 0 }], entra: [{ transform: 'rotateX(-90deg)', opacity: 0 }, { transform: 'none', opacity: 1 }] },
    volteo: { sale: [{ transform: 'none', opacity: 1 }, { transform: 'rotateY(-90deg)', opacity: 0 }], entra: [{ transform: 'rotateY(90deg)', opacity: 0 }, { transform: 'none', opacity: 1 }] },
    fundido: { sale: [{ opacity: 1, filter: 'blur(0)', transform: 'none' }, { opacity: 0, filter: 'blur(8px)', transform: 'scale(1.06)' }], entra: [{ opacity: 0, filter: 'blur(8px)', transform: 'scale(.94)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }] },
    deslizar: { sale: [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-55%)', opacity: 0 }], entra: [{ transform: 'translateY(55%)', opacity: 0 }, { transform: 'none', opacity: 1 }] },
    barrido: { sale: [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }], entra: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }] },
    zoom: { sale: [{ transform: 'none', opacity: 1, filter: 'blur(0)' }, { transform: 'scale(.4)', opacity: 0, filter: 'blur(4px)' }], entra: [{ transform: 'scale(1.5)', opacity: 0, filter: 'blur(6px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }] },
  };
  var CAE = 'cubic-bezier(.7, 0, .84, 0)';
  $$('.marca').forEach(function (marca) {
    var tk = marca.querySelector('.marca-tk'), muni = marca.querySelector('.marca-muni');
    if (!tk || !muni) return;
    var svgTk = tk.querySelector('svg'), escudo = marca.querySelector('.marca-viva'), reloj = null, encima = false, visible = true, ocupada = false, enTk = false;
    var num = function (k, d) { return Number(raiz.getAttribute(k)) || d; };
    var activa = function () { return raiz.getAttribute('data-alternar-logo') === 'si'; };
    var efecto = function () { return EFECTOS[raiz.getAttribute('data-alternar-efecto')] || EFECTOS.giro; };
    var cab = marca.closest('.cabecera');
    var compacta = function () { return cab && cab.classList.contains('compacta'); };
    // El logo del trekking toma un ancho acorde a la cabecera.
    function medir() {
      var r = muni.getBoundingClientRect();
      if (!r.height) return;
      var centrada = raiz.getAttribute('data-cabecera-centrada') === 'si' && innerWidth > 1024;
      var ancho = centrada ? Math.min(330, Math.max(210, r.height * 3.2)) : Math.min(innerWidth > 640 ? 250 : 175, Math.max(150, r.width * 1.1));
      marca.style.setProperty('--tk-ancho', Math.round(ancho) + 'px');
    }
    function anim(el, cuadros, o) { o.duration /= VEL; if (o.delay) o.delay /= VEL; return el.animate(cuadros, o); }
    function mostrarTk() {
      ocupada = true; medir();
      var ef = efecto();
      var sale = anim(muni, ef.sale, { duration: 420, easing: CAE, fill: 'forwards' });
      setTimeout(function () {
        // Primero se prepara la entrada de las letras (quedan ocultas) y recién entonces se ve.
        if (svgTk) svgTk.dispatchEvent(new CustomEvent('tk:reproducir', { detail: { modo: raiz.getAttribute('data-alternar-entrada') || 'caida', cabecera: true } }));
        marca.classList.add('tk-visible');
        anim(tk, ef.entra, { duration: 620, easing: SALIDA });
      }, 300 / VEL);
      sale.finished.then(function () { marca.classList.add('muni-oculta'); sale.cancel(); ocupada = false; }, function () { ocupada = false; });
    }
    function mostrarMuni() {
      ocupada = true;
      var ef = efecto();
      var t = 0;
      if (svgTk) { var ev = new CustomEvent('tk:salir', { detail: {} }); svgTk.dispatchEvent(ev); t = ev.detail.duracion || 0; }
      setTimeout(function () {
        var sale = anim(tk, ef.sale, { duration: 380, easing: CAE, fill: 'forwards' });
        setTimeout(function () {
          marca.classList.remove('muni-oculta');
          anim(muni, ef.entra, { duration: 620, easing: SALIDA });
          if (escudo && activo()) armar(escudo, true);
        }, 260 / VEL);
        sale.finished.then(function () { marca.classList.remove('tk-visible'); sale.cancel(); ocupada = false; }, function () { ocupada = false; });
      }, Math.max(0, t - 250) / VEL);
    }
    function programar() {
      clearTimeout(reloj);
      if (!activa()) { marca.classList.remove('tk-visible', 'muni-oculta'); enTk = false; return; }
      var t = enTk ? num('data-alternar-tk', 6) * 1000 : num('data-alternar-cada', 7) * 1000;
      reloj = setTimeout(function () {
        if (!encima && visible && !d.hidden && !ocupada && !compacta()) { enTk = !enTk; if (enTk) mostrarTk(); else mostrarMuni(); }
        programar();
      }, t);
    }
    marca.addEventListener('pointerenter', function () { encima = true; });
    marca.addEventListener('pointerleave', function () { encima = false; });
    addEventListener('resize', medir, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(marca);
    if (raiz.classList.contains('con-intro')) d.addEventListener('intro:fin', programar, { once: true }); else programar();
    d.addEventListener('mlp:diseno', function () { medir(); programar(); });
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
