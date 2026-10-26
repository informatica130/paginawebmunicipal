/* Movimiento del sitio — Municipalidad de Melipeuco.
   Usa la API de animación nativa del navegador (Web Animations), sin librerías: no suma peso
   ni retrasa la carga. Todo es opcional: si el navegador no la tiene, o la persona pidió
   «reducir movimiento», el sitio se ve completo y quieto.
   · Pantalla de carga de la portada: el escudo se arma pieza por pieza y vuela al logo.
   · Entrada de la portada, aparición del contenido al desplazarse (2D y 3D).
   · Inclinación 3D al pasar el cursor, barra de carga al navegar. */
(function () {
  'use strict';
  var d = document, raiz = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var puede = typeof Element !== 'undefined' && 'animate' in Element.prototype && !reducido;

  // Preferencias del panel «Diseño del sitio» (atributos de <html>).
  var nivel = raiz.getAttribute('data-anim') || 'normal';
  if (nivel === 'no') puede = false;
  var F = { sutil: .5, normal: 1, expresiva: 1.6 }[nivel] || 1;        // amplitud de los movimientos
  var VEL = parseFloat(getComputedStyle(raiz).getPropertyValue('--anim-vel')) || 1;  // velocidad
  var activo = function (k) { return raiz.getAttribute('data-anim-' + k) !== 'no'; };
  // Escala distancias y ángulos de una transformación según la intensidad elegida.
  function escalar(v) { return typeof v === 'string' ? v.replace(/(-?\d*\.?\d+)(px|deg)/g, function (_, n, u) { return (parseFloat(n) * F).toFixed(2) + u; }) : v; }
  function escalarCuadros(cuadros) { return cuadros.map(function (c) { var o = Object.assign({}, c); if (o.transform) o.transform = escalar(o.transform); return o; }); }

  // Curvas de aceleración
  var SALIDA = 'cubic-bezier(.16, 1, .3, 1)';      // desacelera largo (llegadas)
  var REBOTE = 'cubic-bezier(.34, 1.45, .64, 1)';  // sobrepasa un poco y vuelve
  var SUAVE = 'cubic-bezier(.65, 0, .35, 1)';      // entra y sale suave

  function anim(el, cuadros, op) {
    if (!el || !puede) return null;
    var o = Object.assign({ fill: 'both' }, op);
    o.duration = (o.duration || 0) / VEL; if (o.delay) o.delay /= VEL;
    return el.animate(cuadros, o);
  }

  // ================================================================ Pantalla de carga
  // Cómo entra cada elemento del escudo, según lo que es.
  var PIEZAS = {
    // El volcán y el terreno se levantan desde la base.
    paisaje: { desde: 'translateY(46px) scaleY(.55)', t: 0, dur: 760, curva: SALIDA },
    // Las araucarias crecen desde la raíz, con un leve balanceo.
    'arbol-i': { cuadros: ['scale(.2, 0) rotate(-8deg)', 'scale(1.04, 1.08) rotate(2deg)', 'none'], t: 260, dur: 820 },
    'arbol-d': { cuadros: ['scale(.2, 0) rotate(8deg)', 'scale(1.04, 1.08) rotate(-2deg)', 'none'], t: 340, dur: 820 },
    // El kultrún llega girando, como un tambor que se pone en su lugar.
    kultrun: { desde: 'scale(.15) rotate(-200deg)', t: 120, dur: 1000, curva: REBOTE },
    // Las trutrucas se deslizan por su propia diagonal; las bocinas llegan desde los lados.
    'palo-i': { desde: 'translate(-150px, -150px)', t: 420, dur: 720, curva: SALIDA },
    'palo-d': { desde: 'translate(150px, -150px)', t: 420, dur: 720, curva: SALIDA },
    'campana-i': { desde: 'translate(-170px, 30px) rotate(-10deg)', t: 480, dur: 760, curva: SALIDA },
    'campana-d': { desde: 'translate(170px, 30px) rotate(10deg)', t: 480, dur: 760, curva: SALIDA },
    // Los laureles con copihues brotan desde el tallo y se mecen al llegar.
    'laurel-i': { cuadros: ['scale(0) rotate(-35deg)', 'scale(1.06) rotate(4deg)', 'rotate(-1.5deg)', 'none'], t: 640, dur: 900 },
    'laurel-d': { cuadros: ['scale(0) rotate(35deg)', 'scale(1.06) rotate(-4deg)', 'rotate(1.5deg)', 'none'], t: 700, dur: 900 },
    // Las aves llegan volando en curva, aleteando.
    aves: { cuadros: ['translate(90px, -40px) scale(.5)', 'translate(48px, -8px) scale(.75)', 'translate(20px, -18px) scale(.9)', 'translate(4px, 2px)', 'none'], t: 760, dur: 900, curva: 'ease-out' },
    // La cinta se despliega desde el centro y luego aparecen los textos.
    cinta: { desde: 'scaleX(0)', t: 900, dur: 560, curva: SALIDA },
    municipalidad: { desde: 'translateY(10px)', t: 1080, dur: 420, curva: SALIDA },
    chile: { desde: 'translateY(-8px)', t: 1160, dur: 420, curva: SALIDA },
  };
  var FIN_ARMADO = 1600;

  function intro() {
    var capa = $('.intro');
    if (!capa) return false;
    if (capa.classList.contains('intro-3d')) return true; // la anima public/js/transiciones.js
    if (!puede) { capa.remove(); raiz.classList.remove('con-intro'); return false; }
    capa.dataset.activa = '1';
    var escudo = $('.intro-escudo', capa), svg = $('svg', escudo), emblema = $('.intro-emblema', capa);
    var animaciones = [], terminado = false, temporizadores = [];

    // El punto de giro de cada pieza viene en la plantilla (transform-origin).
    $$('.pz', capa).forEach(function (g) {
      var p = PIEZAS[g.getAttribute('data-pieza')];
      if (!p) return;
      var cuadros = (p.cuadros || [p.desde, 'none']).map(function (t, i, a) { return { transform: t, opacity: i === 0 ? 0 : 1, offset: a.length > 2 && i === 1 ? .55 : undefined }; });
      cuadros.forEach(function (c) { if (c.offset === undefined) delete c.offset; });
      animaciones.push(anim(g, cuadros, { duration: p.dur, delay: p.t, easing: p.curva || SALIDA }));
    });

    // El conjunto entra en 3D: se endereza hacia la cámara mientras se arma.
    animaciones.push(anim(escudo, [
      { transform: 'perspective(1100px) rotateX(32deg) rotateY(-14deg) translateY(36px) scale(.86)', opacity: 0 },
      { opacity: 1, offset: .25 },
      { transform: 'perspective(1100px) rotateX(0) rotateY(0) translateY(0) scale(1)', opacity: 1 },
    ], { duration: 1500, easing: SALIDA }));

    // Ondas de sonido desde las bocas de las trutrucas.
    $$('.intro-ondas circle', capa).forEach(function (c, i) {
      c.style.transformOrigin = 'center'; c.style.transformBox = 'fill-box';
      animaciones.push(anim(c, [{ transform: 'scale(.4)', opacity: 0 }, { opacity: .55, offset: .2 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: 900, delay: 1100 + (i % 2) * 220, easing: 'ease-out' }));
    });

    // Al terminar de armarse, se reemplazan las piezas por el escudo entero (calzan igual).
    temporizadores.push(setTimeout(function () {
      emblema.style.opacity = 1;
      $$('.pz', capa).forEach(function (g) { if (!/^(municipalidad|cinta|chile)$/.test(g.getAttribute('data-pieza'))) g.style.visibility = 'hidden'; });
    }, (FIN_ARMADO + 50) / VEL));
    temporizadores.push(setTimeout(salir, (FIN_ARMADO + 180) / VEL));

    // Salida: el escudo vuela al logo de la cabecera y la pantalla se cierra en un círculo sobre él.
    function salir() {
      if (terminado) return;
      terminado = true;
      d.dispatchEvent(new CustomEvent('intro:salida'));
      // El logo visible (claro u oscuro según la cabecera y el tema).
      var logo = $$('.marca-viva, .marca-emblema').filter(function (l) { return l.getBoundingClientRect().width; })[0], r = logo && logo.getBoundingClientRect();
      var vivo = logo && logo.classList.contains('marca-viva');
      var conTexto = !vivo && logo && /escudo-/.test(logo.getAttribute('src') || ''), propio = !vivo && logo && !/(emblema|escudo)-/.test(logo.getAttribute('src') || '');
      if (propio) r = null;
      var e = svg.getBoundingClientRect();
      $$((conTexto ? '' : '.pz[data-pieza="municipalidad"], .pz[data-pieza="cinta"], .pz[data-pieza="chile"], ') + '.intro-barra, .intro-saltar', capa).forEach(function (el) {
        anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' });
      });
      if (!r || !r.width || r.bottom < 0) return quitar(anim(capa, [{ opacity: 1 }, { opacity: 0 }], { duration: 350 }));
      escudo.getAnimations().forEach(function (a) { a.cancel(); });
      var s = r.width / e.width, dx = r.left - e.left, dy = r.top - e.top;
      escudo.style.transformOrigin = '0 0';
      anim(escudo, [{ transform: 'translate(0, 0) scale(1)' }, { transform: 'translate(' + dx * .45 + 'px, ' + (dy * .45 - 30) + 'px) scale(' + (1 + s) / 2.2 + ')', offset: .45 }, { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + s + ')' }], { duration: 760, easing: 'cubic-bezier(.7, 0, .2, 1)' });
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, radio = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      var cierre = anim(capa, [{ clipPath: 'circle(' + radio + 'px at ' + cx + 'px ' + cy + 'px)' }, { clipPath: 'circle(' + (r.width * .72) + 'px at ' + cx + 'px ' + cy + 'px)' }], { duration: 760, easing: 'cubic-bezier(.7, 0, .2, 1)' });
      quitar(cierre);
    }
    function quitar(a) {
      var fin = function () {
        capa.remove(); raiz.classList.remove('con-intro');
        var logo = $$('.marca-viva, .marca-emblema').filter(function (l) { return l.getBoundingClientRect().width; })[0];
        anim(logo, [{ transform: 'scale(1.18)' }, { transform: 'scale(.94)' }, { transform: 'none' }], { duration: 420, easing: 'ease-out', fill: 'none' });
        d.dispatchEvent(new CustomEvent('intro:fin'));
      };
      if (a) a.finished.then(fin, fin); else fin();
    }
    // Saltar: clic, tecla o rueda.
    function saltar() {
      if (terminado) return;
      temporizadores.forEach(clearTimeout);
      animaciones.forEach(function (a) { a && a.finish(); });
      emblema.style.opacity = 1;
      salir();
    }
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { addEventListener(t, saltar, { once: true, passive: true }); });
    return true;
  }

  // ================================================================ Entrada de la portada
  function entradaPortada() {
    var hero = $('.hero');
    if (!hero || !puede) return;
    if (hero.hasAttribute('data-hero-trekking')) {
      // El logo cae letra por letra con CSS; el resto aparece mientras tanto.
      // Portada «vitrina»: el marco de fotos se descubre y el acceso flotante llega desde abajo.
      anim($('.hv-marco', hero), [{ clipPath: 'inset(8% 8% 8% 8% round 40px)', transform: 'scale(.96)' }, { clipPath: 'inset(0 0 0 0 round 0px)', transform: 'none' }], { duration: 1300, delay: 100, easing: SALIDA });
      anim($('.hv-flotante', hero), [{ opacity: 0, transform: escalar('translateY(24px) scale(.96)') }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 1100, easing: SALIDA });
      [['.tk-kicker', 80], ['.hv-insignia', 60], ['.hero-lema', 900], ['.hero-buscar', 1050], ['.populares', 1200]].forEach(function (x) {
        anim($(x[0], hero), [{ opacity: 0, transform: escalar('translateY(18px)') }, { opacity: 1, transform: 'none' }], { duration: 800, delay: x[1], easing: SALIDA });
      });
      $$('.franja-datos .dato').forEach(function (el, i) {
        anim(el, [{ opacity: 0, transform: escalar('translateY(30px)') }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 1300 + i * 90, easing: SALIDA });
      });
      return;
    }
    if (hero.classList.contains('hero-portal')) {
      // Portada «portal»: la franja se enciende, la campaña sube, el panel llega por partes,
      // los temas saltan uno a uno y el mosaico se levanta en cascada con un leve giro 3D.
      // Al terminar se suelta cada animación para que el cursor pueda volver a moverlas.
      var suelta = function (el, c, o) { var x = anim(el, c, o); if (x) x.finished.then(function () { x.cancel(); }, function () {}); };
      suelta($('.pt-banda', hero), [{ opacity: .4, filter: 'saturate(.6)' }, { opacity: 1, filter: 'none' }], { duration: 900, easing: 'ease-out' });
      suelta($('.pt-visual', hero), [{ opacity: 0, transform: escalar('translateY(36px) scale(.97)'), clipPath: 'inset(6% 4% 6% 4% round 40px)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0 0 round 0px)' }], { duration: 1100, delay: 120, easing: SALIDA });
      [['.pt-saludo', 260], ['.hero-buscar', 380], ['.pt-temas-titulo', 520]].forEach(function (x) {
        suelta($(x[0], hero), [{ opacity: 0, transform: escalar('translateX(24px)') }, { opacity: 1, transform: 'none' }], { duration: 760, delay: x[1], easing: SALIDA });
      });
      $$('.pt-tema', hero).forEach(function (el, i) {
        suelta(el, [{ opacity: 0, transform: escalar('translateY(10px) scale(.85)') }, { opacity: 1, transform: 'none' }], { duration: 620, delay: 600 + i * 55, easing: REBOTE });
      });
      suelta($('.pt-montes', hero), [{ transform: 'translateY(40%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1200, delay: 200, easing: SALIDA });
      $$('.pt-mosaico > li', hero).forEach(function (el, i) {
        suelta(el, [{ opacity: 0, transform: 'perspective(800px) ' + escalar('translateY(48px) rotateX(18deg)') }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 520 + i * 70, easing: SALIDA });
      });
      $$('.franja-datos .dato').forEach(function (el, i) {
        suelta(el, [{ opacity: 0, transform: escalar('translateY(14px)') }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 1000 + i * 80, easing: SALIDA });
      });
      return;
    }
    var foto = $('.hero-foto', hero);
    if (raiz.getAttribute('data-portada') === 'foto') {
      anim(foto, [{ transform: 'scale(1.12)', filter: 'saturate(.6) brightness(.8)' }, { transform: 'scale(1)', filter: 'none' }], { duration: 2200, easing: SALIDA });
    } else {
      // La foto se descubre desde abajo dentro de su marco mientras se aleja suavemente.
      anim($('.hero-figura', hero), [{ clipPath: 'inset(100% 0 0 0 round 16px)' }, { clipPath: 'inset(0 0 0 0 round 0px)' }], { duration: 1300, delay: 150, easing: SALIDA });
      anim(foto, [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 2000, delay: 150, easing: SALIDA });
      anim($('.hero-credito', hero), [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 1100, easing: 'ease-out' });
    }
    var h1 = $('h1', hero);
    anim(h1, [{ clipPath: 'inset(0 0 100% 0)', transform: escalar('translateY(28px)') }, { clipPath: 'inset(0 0 -10% 0)', transform: 'none' }], { duration: 900, delay: 120, easing: SALIDA });
    [['.hero-lema', 300], ['.hero-buscar', 420], ['.populares', 560]].forEach(function (x) {
      anim($(x[0], hero), [{ opacity: 0, transform: escalar('translateY(18px)') }, { opacity: 1, transform: 'none' }], { duration: 700, delay: x[1], easing: SALIDA });
    });
    $$('.franja-datos .dato').forEach(function (el, i) {
      anim(el, [{ opacity: 0, transform: escalar('translateY(12px)') }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 600 + i * 90, easing: SALIDA });
    });
    var sos = $('.dato-emergencia > .ico');
    anim(sos, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 900, delay: 1300, easing: 'ease-in-out', fill: 'none' });
  }

  // ================================================================ Aparición al desplazarse
  // Cada tipo de elemento entra a su manera; todo dura menos de 0,7 s y no retrasa la lectura.
  var EFECTOS = [
    // Mosaicos de accesos: se levantan girando en 3D, en cascada.
    { sel: '.accesos > li', cuadros: [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], dur: 700, paso: 45, curva: SALIDA },
    // Listas (trámites, agenda, documentos, sesiones, directorio): se deslizan desde la izquierda.
    { sel: '.fila-tramite, .tarjeta-accion, .tarjeta-evento, .lista-documentos > li, .lista-sesiones > li, .directorio-fila, .resultados > li, .emergencias-portada li, .horas-disponibles li', cuadros: [{ opacity: 0, transform: 'translateX(-18px)' }, { opacity: 1, transform: 'none' }], dur: 520, paso: 45, curva: SALIDA },
    // Noticias: suben y la foto se descubre de abajo hacia arriba.
    { sel: '.tarjeta-noticia', cuadros: [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], dur: 650, paso: 70, curva: SALIDA, extra: function (el, retraso) {
      anim($('.tn-img', el), [{ clipPath: 'inset(100% 0 0 0 round 8px)' }, { clipPath: 'inset(0 0 0 0 round 8px)' }], { duration: 760, delay: retraso, easing: SALIDA });
      anim($('.tn-img img', el), [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 1100, delay: retraso, easing: SALIDA });
    } },
    // Tarjetas de áreas y genéricas: crecen desde un poco más pequeñas.
    { sel: '.tarjeta-area, .tarjetas > .tarjeta, .autoridad, .contacto-boton, .arbol.nivel-0 > li', cuadros: [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], dur: 600, paso: 35, curva: SALIDA },
    // Títulos de sección: el texto sube desde una máscara.
    { sel: '.seccion-cabecera h2, .bloque-cabecera h2, .ficha-seccion h2, .grupo-tramites h2', cuadros: [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(60%)' }, { clipPath: 'inset(0 0 -20% 0)', transform: 'none' }], dur: 700, paso: 0, curva: SALIDA },
    // Bloques destacados: aparecen y suben.
    { sel: '.tk-cifra, .tk-foto, .tk-trekking-cabeza > *', cuadros: [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], dur: 800, paso: 70, curva: SALIDA },
    { sel: '.tk-mundos-letras li', cuadros: [{ opacity: 0, transform: 'translateY(-60px) rotate(-10deg) scale(.7)' }, { opacity: 1, transform: 'none' }], dur: 900, paso: 60, curva: REBOTE },
    { sel: '.lateral-bloque, .caja, .campanas, .video, .calendario, .encuesta, .boletin, .banda-turismo .contenedor > *, .acordeon, .galeria-item, .lista-check li, .pasos li', cuadros: [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], dur: 600, paso: 50, curva: SALIDA },
    // Firma gigante del pie: las letras suben desde la base.
    { sel: '.pie-trekking a', cuadros: [{ opacity: 0, transform: 'translateY(30%)' }, { opacity: 1, transform: 'none' }], dur: 1400, paso: 0, curva: SALIDA },
  ];

  function aparicion() {
    if (!puede || !activo('aparicion') || !('IntersectionObserver' in window)) return;
    var pendientes = new Map();
    var obs = new IntersectionObserver(function (entradas) {
      // Los que entran juntos se escalonan según su orden en pantalla.
      var visibles = entradas.filter(function (e) { return e.isIntersecting || e.boundingClientRect.top < 0; }).map(function (e) { return e.target; });
      visibles.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return ra.top - rb.top || ra.left - rb.left; });
      var orden = {};
      visibles.forEach(function (el) {
        obs.unobserve(el);
        var ef = pendientes.get(el); if (!ef) return;
        pendientes.delete(el);
        var n = orden[ef.sel] = (orden[ef.sel] || 0) + 1;
        var retraso = Math.min(n - 1, 8) * ef.paso;
        var a = anim(el, escalarCuadros(ef.cuadros), { duration: ef.dur, delay: retraso, easing: ef.curva });
        if (ef.extra) ef.extra(el, retraso);
        el.classList.remove('por-aparecer');
        // Al terminar se quita la animación para que no interfiera con los efectos del cursor.
        if (a) a.finished.then(function () { a.cancel(); }, function () {});
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .08 });
    var alto = innerHeight;
    EFECTOS.forEach(function (ef) {
      $$(ef.sel).forEach(function (el) {
        if (pendientes.has(el) || el.closest('.hero, .intro, .franja-datos')) return;
        // Lo que ya está a la vista al cargar (y no es la portada) no se oculta: se ve de inmediato.
        if (!$('.hero') && el.getBoundingClientRect().top < alto * .9) return;
        pendientes.set(el, ef);
        el.classList.add('por-aparecer');
        obs.observe(el);
      });
    });
    // Seguridad: nada queda oculto más de 4 s aunque falle el observador.
    setTimeout(function () { $$('.por-aparecer').forEach(function (el) { el.classList.remove('por-aparecer'); }); }, 4000);
  }

  // ================================================================ Inclinación 3D con el cursor
  function inclinacion() {
    if (!puede || !activo('inclinacion') || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.accesos a, .tarjeta-area, a.tarjeta, .tarjeta-accion').forEach(function (el) {
      var marco = 0;
      el.addEventListener('pointermove', function (e) {
        cancelAnimationFrame(marco);
        marco = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          el.style.setProperty('--rx', (-y * 7 * F).toFixed(2) + 'deg');
          el.style.setProperty('--ry', (x * 9 * F).toFixed(2) + 'deg');
          el.style.setProperty('--bx', ((x + .5) * 100).toFixed(1) + '%');
          el.style.setProperty('--by', ((y + .5) * 100).toFixed(1) + '%');
          el.classList.add('inclinado');
        });
      });
      el.addEventListener('pointerleave', function () { cancelAnimationFrame(marco); el.classList.remove('inclinado'); el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
    });
    // El logo de la cabecera gira como moneda al pasar el cursor.
    var marca = $('.marca'), logo = $('.marca-emblema');
    if (marca && logo) marca.addEventListener('pointerenter', function () {
      if (logo.getAnimations().length) return;
      anim(logo, [{ transform: 'perspective(400px) rotateY(0)' }, { transform: 'perspective(400px) rotateY(360deg)' }], { duration: 900, easing: SUAVE, fill: 'none' });
    });
  }

  // ================================================================ Barra de carga al navegar
  function barraCarga() {
    if (!activo('carga')) return;
    var barra = d.createElement('div');
    barra.className = 'carga'; barra.setAttribute('aria-hidden', 'true');
    d.body.appendChild(barra);
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self' || a.hasAttribute('download')) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search) || /^\/(admin|api|feed|medios|wp-content)\b/.test(u.pathname) || /\.\w{2,4}$/.test(u.pathname)) return;
      barra.classList.remove('activa'); void barra.offsetWidth; barra.classList.add('activa');
    });
    d.addEventListener('submit', function (e) { if ((e.target.getAttribute('method') || 'get').toLowerCase() === 'get') barra.classList.add('activa'); });
    addEventListener('pageshow', function () { barra.classList.remove('activa'); });
  }

  // ================================================================ Capital del Trekking
  // Barra de progreso de lectura (colores del logo) y parallax de la portada.
  function progresoYParallax() {
    var barra = $('.tk-progreso'), hero = $('[data-hero-trekking]');
    var capas = hero && puede ? $$('[data-capa]', hero) : [], cont = hero && $('[data-capa-contenido]', hero), marco = 0;
    function pintar() {
      var y = scrollY, alto = d.documentElement.scrollHeight - innerHeight;
      if (barra) barra.style.setProperty('--p', alto > 0 ? Math.min(1, y / alto).toFixed(4) : 0);
      if (hero && puede && y < innerHeight * 1.2) {
        capas.forEach(function (c) { c.style.transform = 'translate3d(0,' + (y * parseFloat(c.getAttribute('data-capa')) * F).toFixed(1) + 'px,0)'; });
        if (cont) { cont.style.transform = 'translate3d(0,' + (y * .18).toFixed(1) + 'px,0)'; cont.style.opacity = Math.max(0, 1 - y / (innerHeight * .8)).toFixed(3); }
      }
    }
    addEventListener('scroll', function () { cancelAnimationFrame(marco); marco = requestAnimationFrame(pintar); }, { passive: true });
    pintar();
  }

  // Fotos de la portada: se funden cada 7 s con un zoom lento (se detiene al pasar el cursor o
  // con el foco dentro, y no avanza sola con «reducir movimiento»).
  function carruselPortada() {
    var hero = $('[data-hero-trekking]');
    if (!hero) return;
    var fotos = $$('.tk-fotos img', hero), puntos = $$('.tk-puntos button', hero), i = 0, t = 0, quieto = false;
    if (fotos.length < 2) return;
    function ir(n) {
      fotos[i].classList.remove('activa'); puntos[i] && (puntos[i].classList.remove('activa'), puntos[i].setAttribute('aria-pressed', 'false'));
      i = (n + fotos.length) % fotos.length;
      var f = fotos[i]; f.loading = 'eager'; void f.offsetWidth; f.classList.add('activa');
      puntos[i] && (puntos[i].classList.add('activa'), puntos[i].setAttribute('aria-pressed', 'true'));
      fotos[(i + 1) % fotos.length].loading = 'eager';
    }
    function iniciar() { clearInterval(t); if (!reducido && !quieto) t = setInterval(function () { if (!d.hidden) ir(i + 1); }, (parseFloat(raiz.getAttribute('data-intervalo')) || 7) * 1000); }
    puntos.forEach(function (p, k) { p.addEventListener('click', function () { ir(k); iniciar(); }); });
    hero.addEventListener('pointerenter', function () { quieto = true; clearInterval(t); });
    hero.addEventListener('pointerleave', function () { quieto = false; iniciar(); });
    hero.addEventListener('focusin', function () { quieto = true; clearInterval(t); });
    hero.addEventListener('focusout', function () { quieto = false; iniciar(); });
    iniciar();
  }

  // «Cada letra es una puerta»: al pasar o enfocar una letra el fondo toma su color.
  function mundos() {
    var sec = $('[data-mundos]');
    if (!sec) return;
    var letras = $$('.tk-mundos-letras a', sec), infos = $$('.tk-mundo-info', sec), gigantes = $$('.tk-mundos-gigante i', sec);
    var actual = 0, t = 0, dentro = false, visible = false;
    function elegir(k) {
      if (k === actual) return;
      actual = k;
      var a = letras[k];
      sec.style.setProperty('--fc', getComputedStyle(a).getPropertyValue('--c'));
      sec.style.setProperty('--fz', getComputedStyle(a).getPropertyValue('--o'));
      letras.forEach(function (l, j) { if (j === k) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      infos.forEach(function (el, j) { el.classList.toggle('activa', j === k); el.setAttribute('aria-hidden', j === k ? 'false' : 'true'); var e = $('a', el); if (e) e.tabIndex = j === k ? 0 : -1; });
      gigantes.forEach(function (g, j) { g.classList.toggle('activa', j === k); });
    }
    letras.forEach(function (a, k) {
      a.addEventListener('pointerenter', function () { elegir(k); });
      a.addEventListener('focus', function () { elegir(k); });
    });
    sec.addEventListener('pointerenter', function () { dentro = true; });
    sec.addEventListener('pointerleave', function () { dentro = false; });
    sec.addEventListener('focusin', function () { dentro = true; });
    sec.addEventListener('focusout', function () { dentro = false; });
    if (reducido || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: .35 }).observe(sec);
    t = setInterval(function () { if (visible && !dentro && !d.hidden) elegir((actual + 1) % letras.length); }, 3600);
  }

  // Fila de lugares: flechas, arrastre con el mouse y barra de avance (sin secuestrar el scroll).
  function filas() {
    $$('[data-fila]').forEach(function (fila) {
      var sec = fila.closest('section'), barra = sec && $('.tk-fila-barra i', sec), flechas = sec ? $$('[data-mover]', sec) : [];
      function avance() {
        var max = fila.scrollWidth - fila.clientWidth;
        if (barra) barra.style.setProperty('--avance', max > 0 ? Math.max(.08, (fila.scrollLeft + fila.clientWidth) / fila.scrollWidth).toFixed(3) : 1);
        flechas.forEach(function (b) { b.disabled = b.getAttribute('data-mover') === '-1' ? fila.scrollLeft < 4 : fila.scrollLeft > max - 4; });
      }
      flechas.forEach(function (b) { b.addEventListener('click', function () { fila.scrollBy({ left: Number(b.getAttribute('data-mover')) * fila.clientWidth * .8, behavior: reducido ? 'auto' : 'smooth' }); }); });
      fila.addEventListener('scroll', avance, { passive: true });
      addEventListener('resize', avance);
      var x0 = 0, s0 = 0, arrastra = false, movio = false;
      fila.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; arrastra = true; movio = false; x0 = e.clientX; s0 = fila.scrollLeft; });
      addEventListener('pointermove', function (e) { if (!arrastra) return; var dx = e.clientX - x0; if (Math.abs(dx) > 5) { movio = true; fila.classList.add('arrastrando'); } fila.scrollLeft = s0 - dx; });
      addEventListener('pointerup', function () { if (!arrastra) return; arrastra = false; setTimeout(function () { fila.classList.remove('arrastrando'); }, 0); });
      fila.addEventListener('click', function (e) { if (movio) { e.preventDefault(); movio = false; } }, true);
      // Brillo que sigue al puntero sobre cada foto.
      $$('.tk-foto', fila).forEach(function (a) { a.addEventListener('pointermove', function (e) { var r = a.getBoundingClientRect(); a.style.setProperty('--mx', (e.clientX - r.left) + 'px'); a.style.setProperty('--my', (e.clientY - r.top) + 'px'); }); });
      avance();
    });
  }

  // Contadores que suben al aparecer (3 volcanes, 250 km…).
  function contadores() {
    var els = $$('[data-contar]');
    if (!els.length || !puede || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        var el = e.target, fin = Number(el.getAttribute('data-contar')), suf = el.getAttribute('data-sufijo') || '', t0 = performance.now(), dur = 1600 / VEL;
        (function paso(t) { var p = Math.min(1, (t - t0) / dur), v = Math.round(fin * (1 - Math.pow(1 - p, 3))); el.textContent = v + suf; if (p < 1) requestAnimationFrame(paso); })(t0);
      });
    }, { threshold: .5 });
    els.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-sufijo') || ''); obs.observe(el); });
  }

  // Títulos de páginas interiores: cada palabra sube por separado.
  function titulosPorPalabra() {
    var h1 = $('.encabezado h1');
    if (!h1 || !puede || h1.children.length || raiz.getAttribute('data-id-titulos-palabra') === 'no') return;
    var palabras = h1.textContent.trim().split(/\s+/);
    h1.setAttribute('aria-label', h1.textContent.trim());
    h1.innerHTML = '';
    palabras.forEach(function (w, i) {
      var caja = d.createElement('span'), dentro = d.createElement('span');
      caja.className = 'palabra'; caja.setAttribute('aria-hidden', 'true'); dentro.textContent = w;
      caja.appendChild(dentro); h1.appendChild(caja); h1.appendChild(d.createTextNode(' '));
      anim(dentro, [{ transform: 'translateY(105%) rotate(6deg)' }, { transform: 'none' }], { duration: 1000, delay: 120 + i * 70, easing: SALIDA });
    });
    [['.encabezado .bajada', 500], ['.encabezado .migas', 0]].forEach(function (x) { anim($(x[0]), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: x[1], easing: SALIDA }); });
  }

  // ================================================================ Inicio
  var hayIntro = intro();
  if (hayIntro) d.addEventListener('intro:salida', function () { setTimeout(entradaPortada, 250); }, { once: true });
  else entradaPortada();
  // Vista previa del panel: «Reproducir animaciones» vuelve a mostrar la entrada de la portada.
  d.addEventListener('mlp:diseno', function (e) { if (e.detail && e.detail.reproducir) entradaPortada(); });
  aparicion();
  inclinacion();
  barraCarga();
  progresoYParallax();
  carruselPortada();
  mundos();
  filas();
  contadores();
  titulosPorPalabra();
  // La transición entre páginas la hace public/js/transiciones.js (columnas, portal y cordillera).
})();
