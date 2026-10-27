/* Pantalla de carga 3D y transiciones entre páginas — Melipeuco Capital del Trekking.
   API de animación nativa del navegador, sin librerías; nada de esto se ve con «reducir
   movimiento» ni con las animaciones apagadas en «Diseño del sitio».

   · Pantalla de carga «logo 3D»: el logo de la portada se reconstruye en el espacio. Cada una
     de las nueve letras es una capa que llega desde lejos girando en 3D; luego cada pieza de su
     símbolo (el río, los ojos, las gotas, las ramas, el corazón, la persona, los animales, las
     estrellas, el kultrún) cae desde delante y encaja en su lugar; una ola de luz recorre las
     letras, se escribe «Capital del Trekking» y el logo vuela a su lugar en la portada.
   · Transición entre páginas (data-transicion): «columnas» (nueve paneles que giran en 3D, uno
     por letra), «portal» (el color del área se abre en círculo desde el clic, con el emblema que
     gira) o «cordillera» (capas de montaña que suben). */
(function () {
  'use strict';
  var d = document, raiz = d.documentElement, NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var puede = 'animate' in Element.prototype && !reducido && raiz.getAttribute('data-anim') !== 'no';
  var VEL = parseFloat(getComputedStyle(raiz).getPropertyValue('--anim-vel')) || 1;
  var SALIDA = 'cubic-bezier(.16, 1, .3, 1)', VUELO = 'cubic-bezier(.7, 0, .2, 1)', REBOTE = 'cubic-bezier(.34, 1.4, .64, 1)';
  function anim(el, cuadros, op) {
    if (!el) return null;
    var o = Object.assign({ fill: 'both' }, op);
    o.duration = (o.duration || 0) / VEL; if (o.delay) o.delay /= VEL;
    return el.animate(cuadros, o);
  }
  function svg(vb, clase) { var s = d.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); s.setAttribute('class', clase); s.setAttribute('aria-hidden', 'true'); return s; }
  function camino(dd, fill) { var p = d.createElementNS(NS, 'path'); p.setAttribute('d', dd); if (fill) p.setAttribute('fill', fill); return p; }

  // ================================================================ Pantalla de carga «logo 3D»
  function introLogo() {
    var capa = $('.intro-logo');
    if (!capa) return;
    var real = $('.hero .tk-logo');
    var terminar = function () {
      capa.remove(); raiz.classList.remove('con-intro', 'con-intro-logo');
      d.dispatchEvent(new CustomEvent('intro:fin'));
    };
    if (!puede || !real) { d.dispatchEvent(new CustomEvent('intro:salida')); terminar(); return; }
    capa.dataset.activa = '1';
    var P = (parseFloat(raiz.getAttribute('data-intro-profundidad')) || 70) / 100;
    var escena = $('.il-escena', capa), fondo = $('.il-fondo', capa);

    // Se reconstruye el logo con capas HTML (el 3D real necesita elementos HTML, no SVG).
    var logo = d.createElement('div'); logo.className = 'il-logo';
    var letras = $$('.tk-letra', real).map(function (g, k) {
      var c = (g.getAttribute('data-caja') || '0 0 0 0').split(' ').map(Number), vb = c.join(' ');
      var caja = d.createElement('div'); caja.className = 'il-letra';
      caja.style.cssText = 'left:' + (c[0] / 10.36) + '%;top:' + (c[1] / 2.65) + '%;width:' + (c[2] / 10.36) + '%;height:' + (c[3] / 2.65) + '%';
      var base = svg(vb, 'il-capa il-base'), fp = g.querySelector('.tk-fondo');
      base.appendChild(camino(fp.getAttribute('d'), fp.getAttribute('fill')));
      caja.appendChild(base);
      var piezas = $$('.tk-pieza', g).map(function (p) { var s = svg(vb, 'il-capa il-pieza'); s.appendChild(camino(p.getAttribute('d'), '#FFF8EC')); caja.appendChild(s); return s; });
      logo.appendChild(caja);
      return { caja: caja, base: base, piezas: piezas, k: k };
    });
    var lema = svg('0 0 1036 265', 'il-capa il-lema');
    $$('.tk-lema path', real).forEach(function (p) { lema.appendChild(camino(p.getAttribute('d'))); });
    logo.appendChild(lema);
    escena.appendChild(logo);

    var animaciones = [], temporizadores = [], saliendo = false;
    var a = function (el, c, o) { var x = anim(el, c, o); if (x) animaciones.push(x); return x; };
    var dz = function (v) { return (v * P).toFixed(1); };

    // La «cámara»: el conjunto se endereza mientras se arma.
    a(logo, [{ transform: 'rotateX(' + dz(38) + 'deg) rotateY(' + dz(-30) + 'deg) rotateZ(' + dz(-5) + 'deg) translateZ(' + dz(-260) + 'px)' }, { transform: 'none' }], { duration: 2500, easing: SALIDA });
    // Las letras llegan desde el centro hacia afuera, cada una desde un punto distinto del espacio.
    letras.forEach(function (l, n) {
      var k = l.k, rango = Math.abs(k - 4), lado = k < 4 ? -1 : k > 4 ? 1 : 0, alto = k % 2 ? -1 : 1;
      var t = 120 + rango * 110;
      a(l.caja, [
        { opacity: 0, transform: 'translate3d(' + (lado * (14 + rango * 7)) + 'vw,' + (alto * 34 * P) + 'vh,' + dz(-1100) + 'px) rotateX(' + dz(alto * 80) + 'deg) rotateY(' + dz(-lado * 120 || 180) + 'deg) scale(.35)' },
        { opacity: 1, transform: 'translate3d(0,-10px,' + dz(60) + 'px) rotateX(' + dz(-6) + 'deg) rotateY(' + dz(lado * 8) + 'deg) scale(1.04)', offset: .72 },
        { transform: 'translate3d(0,3px,0) scale(1.02,.96)', offset: .88 },
        { transform: 'none' },
      ], { duration: 1250, delay: t, easing: 'cubic-bezier(.22, .9, .3, 1)' });
      // Las piezas del símbolo caen desde delante y encajan.
      l.piezas.forEach(function (p, j) {
        a(p, [
          { opacity: 0, transform: 'translate3d(' + ((j % 2 ? 1 : -1) * 18) + 'px,-26px,' + dz(420) + 'px) rotate(' + ((j % 2 ? 1 : -1) * 40) + 'deg) scale(1.9)' },
          { opacity: 1, transform: 'translate3d(0,2px,' + dz(10) + 'px) scale(.96)', offset: .75 },
          { transform: 'none' },
        ], { duration: 720, delay: t + 640 + j * 45, easing: REBOTE });
      });
      // Ola de luz que recorre las letras ya armadas.
      a(l.base, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.45) saturate(1.2)' }, { filter: 'brightness(1)' }], { duration: 520, delay: 1950 + k * 55, easing: 'ease-in-out', fill: 'none' });
    });
    a(lema, [{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }, { clipPath: 'inset(0 0 0 0)', opacity: 1 }], { duration: 760, delay: 1650, easing: SALIDA });
    a($('.intro-barra span', capa), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 2600, easing: 'cubic-bezier(.6, 0, .25, 1)' });
    temporizadores.push(setTimeout(salir, 2750 / VEL));

    // Salida: el logo vuela exactamente al lugar del logo de la portada y el fondo se disuelve.
    function salir() {
      if (saliendo) return; saliendo = true;
      d.dispatchEvent(new CustomEvent('intro:salida'));
      animaciones.forEach(function (x) { if (x.effect && x.effect.target !== logo) x.finish(); });
      animaciones.filter(function (x) { return x.effect && x.effect.target === logo; }).forEach(function (x) { x.finish(); });
      var r = real.getBoundingClientRect(), c = logo.getBoundingClientRect();
      $$('.intro-barra, .intro-saltar', capa).forEach(function (el) { anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }); });
      var dentro = r.width > 0 && r.bottom > 0 && r.top < innerHeight;
      var color = getComputedStyle(real).color;
      anim(lema, [{ fill: '#FFFFFF' }, { fill: color }], { duration: 700, delay: 150, easing: 'ease-in-out' });
      anim(fondo, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: dentro ? 200 : 0, easing: 'ease-in-out' });
      var vuelo;
      if (dentro) {
        logo.style.transformOrigin = '0 0';
        var s = r.width / c.width, dx = r.left - c.left, dy = r.top - c.top;
        vuelo = anim(logo, [
          { transform: 'translate(0, 0) scale(1)' },
          { transform: 'translate(' + dx * .5 + 'px,' + (dy * .5 - 24) + 'px) scale(' + (1 + s) / 2 + ') rotateX(' + dz(10) + 'deg)', offset: .5 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' },
        ], { duration: 900, easing: VUELO });
      } else vuelo = anim(logo, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 500 });
      var fin = function () { raiz.classList.add('tk-logo-llego'); terminar(); };
      if (vuelo) vuelo.finished.then(fin, fin); else fin();
    }
    function saltar() {
      if (saliendo) return;
      temporizadores.forEach(clearTimeout);
      animaciones.forEach(function (x) { x.finish(); });
      salir();
    }
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { addEventListener(t, saltar, { once: true, passive: true }); });
  }

  // ================================================================ Pantalla de carga «escudo 3D»
  // Cada pieza del escudo municipal es una capa en el espacio y entra según lo que es: el volcán
  // y el terreno se levantan como un telón, las araucarias crecen girando, el kultrún llega
  // girando como una moneda desde delante, las trutrucas se cruzan desde lejos, sus bocinas
  // llegan girando y suenan, los laureles con copihues se abren como puertas, las aves llegan
  // volando y la cinta se despliega en 3D con el nombre. Luego vuela al logo de la cabecera.
  var GESTOS_3D = {
    paisaje: { c: ['rotateX(85deg) translateZ(-120px)', 'none'], t: 0, dur: 1050 },
    'arbol-i': { c: ['rotateY(-100deg) scale(.25, 0)', 'rotateY(8deg) scale(1.04, 1.06)', 'none'], t: 300, dur: 1000 },
    'arbol-d': { c: ['rotateY(100deg) scale(.25, 0)', 'rotateY(-8deg) scale(1.04, 1.06)', 'none'], t: 380, dur: 1000 },
    kultrun: { c: ['rotateY(900deg) translateZ(380px) scale(.15)', 'rotateY(-12deg) translateZ(30px) scale(1.06)', 'none'], t: 120, dur: 1550, e: SALIDA },
    'palo-i': { c: ['translate3d(-340px, -280px, -420px) rotateZ(-30deg)', 'none'], t: 450, dur: 900, e: SALIDA },
    'palo-d': { c: ['translate3d(340px, -280px, -420px) rotateZ(30deg)', 'none'], t: 450, dur: 900, e: SALIDA },
    'campana-i': { c: ['translate3d(-300px, 80px, 260px) rotateY(-120deg)', 'none'], t: 540, dur: 950, e: SALIDA },
    'campana-d': { c: ['translate3d(300px, 80px, 260px) rotateY(120deg)', 'none'], t: 540, dur: 950, e: SALIDA },
    'laurel-i': { c: ['rotateY(-110deg) scale(.4)', 'rotateY(10deg) scale(1.05)', 'none'], t: 720, dur: 1000 },
    'laurel-d': { c: ['rotateY(110deg) scale(.4)', 'rotateY(-10deg) scale(1.05)', 'none'], t: 780, dur: 1000 },
    aves: { c: ['translate3d(280px, -160px, 520px) rotateY(70deg) scale(.3)', 'translate3d(30px, -20px, 80px) rotateY(-10deg) scale(.95)', 'none'], t: 760, dur: 1150, e: 'ease-out' },
    cinta: { c: ['rotateX(90deg) scaleX(.2)', 'rotateX(-12deg) scaleX(1.02)', 'none'], t: 1050, dur: 800 },
    municipalidad: { c: ['rotateX(-90deg) translateZ(40px)', 'none'], t: 1200, dur: 700, e: SALIDA },
    chile: { c: ['translateY(20px) rotateX(-90deg)', 'none'], t: 1300, dur: 650, e: SALIDA },
  };
  function introEscudo() {
    var capa = $('.intro-escudo3d');
    if (!capa) return;
    var objetivo = $$('.marca-viva, .marca-emblema').filter(function (l) { return l.getBoundingClientRect().width; })[0];
    var terminar = function () {
      capa.remove(); raiz.classList.remove('con-intro', 'con-intro-escudo');
      if (objetivo) anim(objetivo, [{ transform: 'scale(1.18)' }, { transform: 'scale(.94)' }, { transform: 'none' }], { duration: 480, easing: 'ease-out', fill: 'none' });
      d.dispatchEvent(new CustomEvent('intro:fin'));
    };
    if (!puede) { d.dispatchEvent(new CustomEvent('intro:salida')); terminar(); return; }
    capa.dataset.activa = '1';
    var P = (parseFloat(raiz.getAttribute('data-intro-profundidad')) || 70) / 100;
    var escudo = $('.ie-escudo', capa), fondo = $('.il-fondo', capa), capas = $$('.ie-capa', capa);
    var animaciones = [], temporizadores = [], saliendo = false;
    var a = function (el, c, o) { var x = anim(el, c, o); if (x) animaciones.push(x); return x; };
    var prof = function (t) { return P === 1 ? t : t.replace(/(-?\d*\.?\d+)(px|deg)/g, function (_, n, u) { return (parseFloat(n) * P).toFixed(1) + u; }); };

    a(escudo, [{ transform: prof('rotateX(30deg) rotateY(-35deg) translateZ(-200px)') }, { transform: 'none' }], { duration: 2400, easing: SALIDA });
    capas.forEach(function (c) {
      var g = GESTOS_3D[c.getAttribute('data-pieza')];
      if (!g) return;
      var cuadros = g.c.map(function (t, i) { return { transform: i === g.c.length - 1 ? t : prof(t), opacity: i === 0 ? 0 : 1 }; });
      if (cuadros.length === 3) cuadros[1].offset = .68;
      a(c, cuadros, { duration: g.dur, delay: g.t, easing: g.e || 'cubic-bezier(.22, .9, .3, 1)' });
    });
    // Las trutrucas suenan: ondas desde sus bocinas.
    [[3.8, 67.8], [96.2, 67.8]].forEach(function (pos, i) {
      [0, 1].forEach(function (k) {
        var o = d.createElement('i'); o.className = 'ie-onda'; o.style.left = pos[0] + '%'; o.style.top = pos[1] + '%';
        escudo.appendChild(o);
        a(o, [{ transform: 'translate(-50%, -50%) scale(.4)', opacity: 0 }, { opacity: .6, offset: .2 }, { transform: 'translate(-50%, -50%) scale(2.8)', opacity: 0 }], { duration: 950, delay: 1350 + i * 140 + k * 260, easing: 'ease-out' });
      });
    });
    // Ola de luz de arriba abajo cuando ya está armado.
    capas.forEach(function (c, i) { a(c, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.5)' }, { filter: 'brightness(1)' }], { duration: 520, delay: 1900 + i * 40, easing: 'ease-in-out', fill: 'none' }); });
    a($('.intro-barra span', capa), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 2600, easing: 'cubic-bezier(.6, 0, .25, 1)' });
    temporizadores.push(setTimeout(salir, 2750 / VEL));

    function salir() {
      if (saliendo) return; saliendo = true;
      d.dispatchEvent(new CustomEvent('intro:salida'));
      animaciones.forEach(function (x) { x.finish(); });
      $$('.intro-barra, .intro-saltar', capa).forEach(function (el) { anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }); });
      var r = objetivo && objetivo.getBoundingClientRect(), c = escudo.getBoundingClientRect();
      var vivo = objetivo && objetivo.classList.contains('marca-viva');
      var completo = objetivo && !vivo && /escudo-/.test(objetivo.getAttribute('src') || '');
      var propio = objetivo && !vivo && !completo && !/emblema-/.test(objetivo.getAttribute('src') || '');
      anim(fondo, [{ opacity: 1 }, { opacity: 0 }], { duration: 650, delay: 180, easing: 'ease-in-out' });
      var vuelo;
      if (r && r.width && !propio && r.bottom > 0) {
        if (!completo) capas.forEach(function (cp) { if (/^(municipalidad|cinta|chile)$/.test(cp.getAttribute('data-pieza'))) anim(cp, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 }); });
        var color = vivo ? getComputedStyle(objetivo).color : /crema/.test(objetivo.getAttribute('src') || '') ? '#F4EAD2' : '#14284A';
        anim(escudo, [{ color: '#F4EAD2' }, { color: color }], { duration: 700, delay: 100 });
        escudo.style.transformOrigin = '0 0';
        var s = r.width / c.width, dx = r.left - c.left, dy = r.top - c.top;
        vuelo = anim(escudo, [
          { transform: 'translate(0, 0) scale(1)' },
          { transform: 'translate(' + dx * .45 + 'px,' + (dy * .45 - 30) + 'px) scale(' + (1 + s) / 2.2 + ') rotateY(' + (14 * P).toFixed(1) + 'deg)', offset: .45 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' },
        ], { duration: 860, easing: VUELO });
      } else vuelo = anim(escudo, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.9)' }], { duration: 450 });
      if (vuelo) vuelo.finished.then(terminar, terminar); else terminar();
    }
    function saltar() { if (saliendo) return; temporizadores.forEach(clearTimeout); salir(); }
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { addEventListener(t, saltar, { once: true, passive: true }); });
  }

  // ================================================================ Transiciones entre páginas
  function transiciones() {
    var capa = $('.tk-cortina');
    if (!capa) return;
    if (!puede || raiz.getAttribute('data-anim-cordillera') !== 'si') { capa.remove(); raiz.classList.remove('tk-entrando'); return; }
    var estilo = function () { return raiz.getAttribute('data-transicion') || 'columnas'; };
    var datos = {}; try { datos = JSON.parse(capa.getAttribute('data-zonas') || '{}'); } catch (e) {}
    var zonas = (datos.rutas || []).map(function (r) { return [new RegExp(r[0]), r[1]]; });
    var zonaDe = function (ruta) { for (var i = 0; i < zonas.length; i++) if (zonas[i][0].test(ruta)) return zonas[i][1]; return 0; };
    var capas = $$('.tk-cortina-capa', capa), columnas = $$('.tk-columnas i', capa), portal = $('.tk-portal', capa), telon = $$('.tk-telon i', capa);
    var info = $('.tk-cortina-info', capa), nombre = $('.tk-cortina-nombre', capa);

    var centro = '50% 50%';
    function preparar(k, texto, x, y) {
      var p = (datos.paleta || [])[k] || ['#1F6FA8', '#0F3A5A'];
      capa.style.setProperty('--zc', p[0]); capa.style.setProperty('--zo', p[1]);
      capas[1] && capas[1].style.setProperty('--c', p[0]); capas[2] && capas[2].style.setProperty('--c', p[1]);
      centro = (x == null ? 50 : x).toFixed(1) + '% ' + (y == null ? 50 : y).toFixed(1) + '%';
      $$('img', info).forEach(function (im) { im.hidden = Number(im.getAttribute('data-k')) !== k; });
      // Con «Letras de colores como el logo» cada letra es una pieza redondeada con uno de los nueve
      // colores de la Capital del Trekking, como las letras del logo.
      // (sin el color del fondo, para que ninguna letra se pierda).
      var paleta = (datos.paleta || []).map(function (x) { return x[0]; }).filter(function (_, i) { return i !== k; }), n = 0;
      nombre.replaceChildren.apply(nombre, Array.prototype.map.call(texto || '', function (ch) {
        var s = d.createElement('span'); s.textContent = ch;
        if (/\s/.test(ch)) s.className = 'tk-espacio';
        else { s.className = 'tk-ch'; s.style.setProperty('--c', paleta.length ? paleta[(k + n) % paleta.length] : '#E9A92B'); s.setAttribute('data-r', String((n * 37) % 9 - 4)); n++; }
        return s;
      }));
    }
    var cancelar = function () { capas.concat(columnas, telon, [portal, info], $$('span, img', info)).forEach(function (el) { el && el.getAnimations().forEach(function (x) { x.cancel(); }); }); };
    // Texto del destino: las letras aparecen en cascada.
    var conLogo = function () { return raiz.getAttribute('data-transicion-letras') !== 'simple'; };
    function nombreEntra(t0) {
      $$('span', nombre).forEach(function (s, i) {
        if (conLogo()) anim(s, [
          { opacity: 0, transform: 'translateY(-1.6em) rotate(' + (i % 2 ? 16 : -16) + 'deg) scale(.4)' },
          { opacity: 1, transform: 'translateY(.12em) rotate(0) scale(1.1, .82)', offset: .5 },
          { transform: 'translateY(-.08em) scale(.97, 1.05)', offset: .74 },
          { transform: 'rotate(' + (s.getAttribute('data-r') || 0) + 'deg)' },
        ], { duration: 720, delay: t0 + i * 38, easing: 'cubic-bezier(.3, .9, .4, 1)' });
        else anim(s, [{ opacity: 0, transform: 'translateY(.6em) rotateX(-70deg)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: t0 + i * 18, easing: SALIDA });
      });
    }
    // Al descubrir la página, las letras saltan y se van una a una.
    function nombreSale() {
      if (!conLogo()) return 0;
      var l = $$('span', nombre);
      l.forEach(function (s, i) { anim(s, [{ transform: 'rotate(' + (s.getAttribute('data-r') || 0) + 'deg)', opacity: 1 }, { transform: 'translateY(.1em) scale(1.08, .9)', offset: .25 }, { transform: 'translateY(-1.4em) rotate(' + (i % 2 ? 20 : -20) + 'deg) scale(.5)', opacity: 0 }], { duration: 420, delay: i * 22, easing: 'cubic-bezier(.5, 0, .75, 0)' }); });
      return 180 + l.length * 22;
    }

    // Tapar la pantalla (antes de ir a otra página). Devuelve los milisegundos que tarda.
    function cubrir() {
      var e = estilo(), emblema = $('img:not([hidden])', info), t = 0;
      if (e === 'columnas') {
        columnas.forEach(function (c, i) { anim(c, [{ transform: 'rotateY(-92deg)' }, { transform: 'none' }], { duration: 400, delay: i * 34, easing: 'cubic-bezier(.65, 0, .35, 1)' }); });
        t = 8 * 34 + 300;
      } else if (e === 'portal') {
        anim(portal, [{ clipPath: 'circle(0px at ' + centro + ')' }, { clipPath: 'circle(150vmax at ' + centro + ')' }], { duration: 560, easing: 'cubic-bezier(.7, 0, .3, 1)' });
        t = 300;
      } else if (e === 'persiana') {
        columnas.forEach(function (c, i) { anim(c, [{ transform: 'rotateX(92deg)' }, { transform: 'none' }], { duration: 420, delay: i * 32, easing: 'cubic-bezier(.65, 0, .35, 1)' }); });
        t = 8 * 32 + 300;
      } else if (e === 'diagonal') {
        anim(portal, [{ clipPath: 'polygon(0 0, 0 0, 0 0, 0 0)' }, { clipPath: 'polygon(0 0, 200% 0, 200% 0, 0 200%)' }], { duration: 560, easing: 'cubic-bezier(.76, 0, .24, 1)' });
        t = 320;
      } else if (e === 'telon') {
        // Dos paños se cierran desde los lados con un leve pliegue en 3D.
        telon.forEach(function (p, i) { anim(p, [{ transform: 'translateX(' + (i ? 101 : -101) + '%) rotateY(' + (i ? -24 : 24) + 'deg)' }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.76, 0, .24, 1)' }); });
        t = 360;
      } else {
        capas.forEach(function (c, i) { anim(c, [{ transform: 'translate3d(0, calc(100% + 18vh), 0)' }, { transform: 'none' }], { duration: 460, delay: i * 60, easing: VUELO }); });
        t = 280;
      }
      // La página actual retrocede un poco mientras se cubre (sensación de profundidad).
      anim($('main'), [{ transform: 'none', filter: 'none' }, { transform: 'scale(.97) translateY(-12px)', filter: 'blur(3px) saturate(.8)' }], { duration: t + 200, easing: 'cubic-bezier(.4, 0, .2, 1)' });
      anim(info, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t });
      anim(emblema, [{ opacity: 0, transform: 'perspective(600px) rotateY(-180deg) scale(.4)' }, { opacity: 1, transform: 'perspective(600px) rotateY(0) scale(1)' }], { duration: 560, delay: t, easing: REBOTE });
      nombreEntra(t + 120);
      return t + 340;
    }
    // Descubrir la página nueva.
    function descubrir(alTerminar) {
      var e = estilo(), emblema = $('img:not([hidden])', info), ultima;
      anim(emblema, [{ opacity: 1, transform: 'perspective(600px) rotateY(0) scale(1)' }, { opacity: 0, transform: 'perspective(600px) rotateY(160deg) scale(.6)' }], { duration: 380, easing: 'ease-in' });
      var tLetras = nombreSale();
      anim(info, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: Math.max(120, tLetras) });
      if (e === 'columnas') columnas.forEach(function (c, i) { ultima = anim(c, [{ transform: 'none', transformOrigin: '100% 50%' }, { transform: 'rotateY(92deg)', transformOrigin: '100% 50%' }], { duration: 460, delay: 160 + i * 38, easing: 'cubic-bezier(.65, 0, .35, 1)' }); });
      else if (e === 'persiana') columnas.forEach(function (c, i) { ultima = anim(c, [{ transform: 'none', transformOrigin: '50% 100%' }, { transform: 'rotateX(-92deg)', transformOrigin: '50% 100%' }], { duration: 460, delay: 160 + i * 36, easing: 'cubic-bezier(.65, 0, .35, 1)' }); });
      else if (e === 'diagonal') ultima = anim(portal, [{ clipPath: 'polygon(-100% 100%, 100% -100%, 100% 100%, 100% 100%)' }, { clipPath: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)' }], { duration: 680, delay: 180, easing: 'cubic-bezier(.76, 0, .24, 1)' });
      else if (e === 'telon') telon.forEach(function (p, i) { ultima = anim(p, [{ transform: 'none' }, { transform: 'translateX(' + (i ? 101 : -101) + '%) rotateY(' + (i ? -24 : 24) + 'deg)' }], { duration: 700, delay: 200, easing: 'cubic-bezier(.76, 0, .24, 1)' }); });
      else if (e === 'portal') ultima = anim(portal, [{ clipPath: 'circle(150vmax at 50% 50%)' }, { clipPath: 'circle(0px at 50% 50%)' }], { duration: 640, delay: 180, easing: 'cubic-bezier(.7, 0, .3, 1)' });
      else capas.slice().reverse().forEach(function (c, i) { ultima = anim(c, [{ transform: 'none' }, { transform: 'translate3d(0, calc(-100% - 18vh), 0)' }], { duration: 640, delay: 120 + i * 70, easing: VUELO }); });
      // La página nueva llega desde un poco más abajo y más pequeña.
      var main = $('main'), llegada = anim(main, [{ transform: 'scale(.975) translateY(24px)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 900, delay: 160, easing: SALIDA, fill: 'backwards' });
      if (llegada) llegada.finished.then(function () { llegada.cancel(); }, function () {});
      var fin = function () { raiz.classList.remove('tk-entrando', 'tk-saliendo'); cancelar(); main && main.getAnimations().forEach(function (x) { if (x !== llegada) x.cancel(); }); if (alTerminar) alTerminar(); };
      if (ultima) ultima.finished.then(fin, fin); else fin();
    }

    // Llegada desde otra página del sitio.
    if (raiz.classList.contains('tk-entrando')) {
      var previo = {}; try { previo = JSON.parse(sessionStorage.getItem('mlp-cortina') || '{}'); sessionStorage.removeItem('mlp-cortina'); } catch (e) {}
      preparar(typeof previo.k === 'number' ? previo.k : zonaDe(location.pathname), previo.nombre);
      info.style.opacity = 1;
      descubrir(function () { info.style.opacity = ''; });
    }

    var saliendo = false;
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (saliendo || !a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.closest('.barra-admin')) return;
      if (raiz.getAttribute('data-anim-cordillera') !== 'si' || estilo() === 'vista') return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search) || /^\/(admin|api|feed|medios|wp-content)\b/.test(u.pathname) || /\.\w{2,4}$/.test(u.pathname)) return;
      e.preventDefault();
      saliendo = true;
      var k = zonaDe(u.pathname), texto = (($('b', a) || a).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (u.pathname === '/') texto = 'Inicio';
      preparar(k, texto, e.clientX / innerWidth * 100, e.clientY / innerHeight * 100);
      raiz.classList.add('tk-saliendo');
      var t = cubrir();
      try { sessionStorage.setItem('mlp-cortina', JSON.stringify({ k: k, nombre: texto })); } catch (err) {}
      setTimeout(function () { location.href = u.href; }, t / VEL);
    });
    addEventListener('pageshow', function (e) { if (!e.persisted) return; saliendo = false; raiz.classList.remove('tk-saliendo', 'tk-entrando'); cancelar(); var m = $('main'); m && m.getAnimations().forEach(function (x) { x.cancel(); }); });

    // Vista previa del panel: «Ver transición».
    d.addEventListener('mlp:diseno', function (e) {
      if (!e.detail || !e.detail.transicion) return;
      if (estilo() === 'vista') {
        // «Fluida» usa la transición nativa del navegador entre páginas; aquí se imita.
        var main = $('main');
        anim(main, [{ opacity: 1, transform: 'none', filter: 'none' }, { opacity: 0, transform: 'translateX(-40px) scale(.99)', filter: 'blur(4px)' }], { duration: 260, easing: 'ease-in' });
        setTimeout(function () { anim(main, [{ opacity: 0, transform: 'translateX(60px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 480, easing: SALIDA }); }, 300 / VEL);
        return;
      }
      cancelar(); raiz.classList.add('tk-saliendo');
      preparar(zonaDe(location.pathname), 'Melipeuco', 50, 50);
      setTimeout(function () { descubrir(); }, (cubrir() + 500) / VEL);
    });
  }

  introLogo();
  introEscudo();
  transiciones();
})();
