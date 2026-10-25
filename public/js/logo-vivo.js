/* Logo vivo de «Melipeuco Capital del Trekking» — el mismo carácter del sitio de turismo,
   con la API de animación nativa del navegador (sin librerías). Cada letra-símbolo se anima
   según lo que representa:
    0 Montaña y río → el río se dibuja y luego fluye      5 Persona   → aparece de un salto y camina
    1 Rostro        → abre los ojos, sonríe y parpadea    6 Animales  → el gallo picotea y el caballo asiente
    2 Cascada       → el chorro baja y las gotas caen     7 Estrellas → la luna se dibuja y las estrellas titilan
    3 Araucaria     → crece desde el suelo y se mece      8 Kultrún   → gira como un tambor y emite ondas
    4 Corazón       → nace con un latido y late
   Opciones del panel (atributos de <html>): data-logo-anim = vivo | caida | aparecer | ninguna,
   data-logo-reposo = si | no (movimiento continuo), data-logo-gestos = si | no (al pasar el cursor). */
(function () {
  'use strict';
  var d = document, raiz = d.documentElement, NS = 'http://www.w3.org/2000/svg';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  if (!('animate' in Element.prototype)) return;
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var VEL = parseFloat(getComputedStyle(raiz).getPropertyValue('--anim-vel')) || 1;
  var attr = function (k, def) { return raiz.getAttribute(k) || def; };

  var REBOTE = 'cubic-bezier(.34, 1.56, .64, 1)', SALIDA = 'cubic-bezier(.16, 1, .3, 1)', SENO = 'cubic-bezier(.45, 0, .55, 1)';
  var num = function (el, k) { return parseFloat(el.getAttribute('data-' + k)) || 0; };

  function crear(svg) {
    var letras = $$('.tk-letra', svg), lema = $$('.tk-lema-letra', svg);
    var entrada = [], reposo = [], gestos = {}, visible = true, vivo = false;

    // Cada pieza gira y escala respecto de su propia caja.
    function caja(el, origen) { el.style.transformBox = 'fill-box'; el.style.transformOrigin = origen || '50% 50%'; return el; }
    function a(el, cuadros, op, lista) {
      if (!el) return null;
      var o = Object.assign({ fill: 'backwards' }, op);
      o.duration = (o.duration || 0) / VEL; if (o.delay) o.delay /= VEL;
      var an = el.animate(cuadros, o);
      (lista || entrada).push(an);
      return an;
    }
    function bucle(el, cuadros, op) { var an = a(el, cuadros, Object.assign({ iterations: Infinity, fill: 'none' }, op), reposo); if (an && !vivo) an.pause(); return an; }
    function grupo(piezas, padre) { var g = d.createElementNS(NS, 'g'); piezas.forEach(function (p) { g.appendChild(p); }); padre.appendChild(g); return g; }
    function mayor(piezas, f) { return piezas.reduce(function (x, y) { return f(y) > f(x) ? y : x; }, piezas[0]); }

    // Preparación de cada símbolo: qué pieza es qué (la misma lógica del sitio de turismo).
    var partes = letras.map(function (g, i) {
      var c = (g.getAttribute('data-caja') || '0 0 0 0').split(' ').map(Number), cx = c[0] + c[2] / 2;
      var sim = g.querySelector('.tk-simbolo'), piezas = $$('.tk-pieza', g), p = { g: g, sim: sim, piezas: piezas, caja: c };
      caja(g, '50% 100%'); caja(sim);
      if (i === 1) { p.sonrisa = mayor(piezas, function (x) { return num(x, 'w'); }); p.ojos = piezas.filter(function (x) { return x !== p.sonrisa; }); }
      if (i === 2) { p.chorro = mayor(piezas, function (x) { return num(x, 'h'); }); p.gotas = piezas.filter(function (x) { return x !== p.chorro; }); }
      if (i === 6 && !g.querySelector('.tk-animal')) {
        p.izq = grupo(piezas.filter(function (x) { return num(x, 'cx') < cx; }), sim); p.der = grupo(piezas.filter(function (x) { return num(x, 'cx') >= cx; }), sim);
        p.izq.setAttribute('class', 'tk-animal'); p.der.setAttribute('class', 'tk-animal');
      } else if (i === 6) { var gs = $$('.tk-animal', g); p.izq = gs[0]; p.der = gs[1]; }
      if (i === 7) { p.luna = mayor(piezas, function (x) { return num(x, 'w') * num(x, 'h'); }); p.estrellas = piezas.filter(function (x) { return x !== p.luna; }); }
      if (i === 8) {
        p.ondas = $$('.tk-onda', g);
        if (!p.ondas.length) p.ondas = [0, 1].map(function () {
          var o = d.createElementNS(NS, 'circle');
          o.setAttribute('cx', cx); o.setAttribute('cy', c[1] + c[3] / 2); o.setAttribute('r', Math.min(c[2], c[3]) * .42);
          o.setAttribute('class', 'tk-onda'); o.setAttribute('fill', 'none'); o.setAttribute('stroke', '#FFF8EC'); o.setAttribute('stroke-width', '3'); o.style.opacity = 0;
          g.insertBefore(o, g.firstChild); return o;
        });
      }
      piezas.concat(p.izq ? [p.izq, p.der] : []).forEach(function (x) { caja(x); });
      if (p.izq) { caja(p.izq, '30% 80%'); caja(p.der, '70% 90%'); }
      return p;
    });

    // ------------------------------------------------------------ Entrada
    function entrar(modo) {
      if (modo === 'ninguna' || reducido) return 0;
      if (modo === 'aparecer') {
        a(svg, [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 1100, easing: SALIDA });
        return 900;
      }
      letras.forEach(function (g, i) {
        a(g, [
          { opacity: 0, transform: 'translateY(-140px) rotate(' + (i % 2 ? 14 : -14) + 'deg) scale(.4)' },
          { opacity: 1, transform: 'translateY(6px) rotate(0) scale(1.08, .86)', offset: .5 },
          { transform: 'translateY(-4px) scale(.98, 1.04)', offset: .72 },
          { transform: 'none' },
        ], { duration: 1150, delay: 200 + i * 75, easing: 'cubic-bezier(.3, .9, .4, 1)' });
      });
      lema.forEach(function (l, k) { a(l, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 1250 + k * 25, easing: SALIDA }); });
      if (modo !== 'vivo') return 1900;
      // Cada símbolo cobra vida a su manera, apenas aterriza su letra.
      partes.forEach(function (p, i) {
        var t0 = 1000 + i * 75;
        switch (i) {
          case 0: a(p.sim, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1100, delay: t0, easing: SENO }); break;
          case 1:
            p.ojos.forEach(function (o, k) { a(o, [{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: 420, delay: t0 + 200 + k * 80, easing: REBOTE }); });
            a(p.sonrisa, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 600, delay: t0 + 350, easing: REBOTE }); break;
          case 2: a(p.sim, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1000, delay: t0, easing: 'cubic-bezier(.55, 0, 1, .45)' }); break;
          case 3: a(p.sim, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1300, delay: t0, easing: SALIDA }); break;
          case 4: a(p.sim, [{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: .45 }, { transform: 'scale(.92)', offset: .7 }, { transform: 'none' }], { duration: 900, delay: t0 + 100, easing: 'ease-out' }); break;
          case 5: a(p.sim, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: t0 + 150, easing: REBOTE }); break;
          case 6: p.piezas.forEach(function (x, k) { a(x, [{ transform: 'scale(0)' }, { transform: 'none' }], { duration: 500, delay: t0 + 100 + k * 40, easing: REBOTE }); }); break;
          case 7:
            a(p.luna, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 900, delay: t0, easing: SENO });
            p.estrellas.forEach(function (e, k) { a(e, [{ transform: 'scale(0) rotate(90deg)' }, { transform: 'none' }], { duration: 500, delay: t0 + 500 + k * 120, easing: REBOTE }); }); break;
          case 8: a(p.sim, [{ transform: 'rotate(-270deg) scale(0)' }, { transform: 'none' }], { duration: 1200, delay: t0, easing: 'cubic-bezier(.34, 1.3, .64, 1)' }); break;
        }
      });
      return 2700;
    }

    // ------------------------------------------------------------ Reposo (movimiento continuo)
    function reposar() {
      if (reducido || attr('data-logo-reposo', 'si') === 'no') return;
      partes.forEach(function (p, i) {
        var demora = i * 250;
        switch (i) {
          case 0:
            bucle(p.sim, [{ transform: 'none' }, { transform: 'translateX(4px) skewX(-6deg)' }, { transform: 'none' }], { duration: 3200, delay: demora, easing: SENO });
            bucle(p.g, [{ translate: '0 0' }, { translate: '0 -3px' }, { translate: '0 0' }], { duration: 3200, delay: demora, easing: SENO }); break;
          case 1:
            p.ojos.forEach(function (o) { bucle(o, [{ transform: 'none' }, { transform: 'none', offset: .7 }, { transform: 'scaleY(.1)', offset: .73 }, { transform: 'none', offset: .76 }, { transform: 'scaleY(.1)', offset: .8 }, { transform: 'none', offset: .83 }, { transform: 'none' }], { duration: 4400, delay: demora }); });
            bucle(p.sonrisa, [{ transform: 'none' }, { transform: 'none', offset: .27 }, { transform: 'scale(1.12, 1.15)', offset: .41 }, { transform: 'none', offset: .55 }, { transform: 'none' }], { duration: 4400, delay: demora, easing: SENO }); break;
          case 2:
            p.gotas.forEach(function (gota, k) { bucle(gota, [{ transform: 'translateY(-10px)', opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 1, offset: .75 }, { transform: 'translateY(14px)', opacity: 0 }], { duration: 1300, delay: demora + k * 220, easing: 'cubic-bezier(.55, 0, 1, .45)' }); }); break;
          case 3: caja(p.sim, '50% 100%'); bucle(p.sim, [{ transform: 'none' }, { transform: 'rotate(4deg)', offset: .35 }, { transform: 'rotate(-3deg)', offset: .74 }, { transform: 'none' }], { duration: 6200, delay: demora, easing: SENO }); break;
          case 4:
            caja(p.sim, '50% 55%');
            bucle(p.sim, [{ transform: 'none' }, { transform: 'scale(1.2)', offset: .07 }, { transform: 'none', offset: .16 }, { transform: 'scale(1.12)', offset: .22 }, { transform: 'none', offset: .42 }, { transform: 'none' }], { duration: 1700, delay: demora });
            bucle(p.g, [{ scale: '1' }, { scale: '1.03', offset: .07 }, { scale: '1', offset: .25 }, { scale: '1' }], { duration: 1700, delay: demora }); break;
          case 5: caja(p.sim, '50% 100%'); bucle(p.sim, [{ transform: 'none' }, { transform: 'translateY(-3px) rotate(2.5deg)', offset: .13 }, { transform: 'rotate(-2.5deg)', offset: .27 }, { transform: 'translateY(-3px) rotate(2.5deg)', offset: .4 }, { transform: 'none', offset: .54 }, { transform: 'none' }], { duration: 3100, delay: demora, easing: SENO }); break;
          case 6:
            bucle(p.izq, [{ transform: 'none' }, { transform: 'none', offset: .19 }, { transform: 'rotate(10deg)', offset: .23 }, { transform: 'none', offset: .29 }, { transform: 'rotate(10deg)', offset: .33 }, { transform: 'none', offset: .41 }, { transform: 'none' }], { duration: 3100, delay: demora });
            bucle(p.der, [{ transform: 'none' }, { transform: 'none', offset: .5 }, { transform: 'rotate(-5deg)', offset: .73 }, { transform: 'none', offset: .95 }, { transform: 'none' }], { duration: 3100, delay: demora, easing: SENO }); break;
          case 7: p.estrellas.forEach(function (e, k) { bucle(e, [{ transform: 'none', opacity: 1 }, { transform: 'scale(.6)', opacity: .25, offset: .4 }, { transform: 'scale(1.25)', opacity: 1, offset: .68 }, { transform: 'none', opacity: 1 }], { duration: 1150 + k * 90, delay: demora + k * 450, easing: SENO }); }); break;
          case 8:
            bucle(p.sim, [{ transform: 'none' }, { transform: 'rotate(360deg)' }], { duration: 14000, delay: demora, easing: 'linear' });
            p.ondas.forEach(function (o, k) { caja(o); bucle(o, [{ transform: 'scale(.7)', opacity: .55 }, { transform: 'scale(1.8)', opacity: 0 }, { transform: 'scale(1.8)', opacity: 0 }], { duration: 3300, delay: demora + 1000 + k * 1100, easing: 'ease-out' }); }); break;
        }
      });
      vivo = true;
      if (visible) reposo.forEach(function (an) { an.play(); });
    }

    // ------------------------------------------------------------ Gestos al pasar el cursor
    gestos = {
      0: function (p) { a(p.sim, [{ transform: 'translateX(-10px)' }, { transform: 'translateX(3px)', offset: .5 }, { transform: 'none' }], { duration: 900, easing: SALIDA, fill: 'none' }, []); },
      1: function (p) { p.ojos.forEach(function (o) { a(o, [{ transform: 'none' }, { transform: 'scaleY(.1)' }, { transform: 'none' }], { duration: 160, iterations: 2, fill: 'none' }, []); }); a(p.sonrisa, [{ transform: 'none' }, { transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 500, fill: 'none' }, []); },
      2: function (p) { p.gotas.forEach(function (g, k) { a(g, [{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'translateY(22px)', opacity: 1 }], { duration: 600, delay: k * 50, easing: 'ease-in', fill: 'none' }, []); }); },
      3: function (p) { caja(p.sim, '50% 100%'); a(p.sim, [{ transform: 'rotate(-10deg)' }, { transform: 'rotate(6deg)', offset: .3 }, { transform: 'rotate(-3deg)', offset: .6 }, { transform: 'none' }], { duration: 1400, fill: 'none' }, []); },
      4: function (p) { caja(p.sim, '50% 55%'); a(p.sim, [{ transform: 'none' }, { transform: 'scale(1.35)', offset: .15 }, { transform: 'none', offset: .33 }, { transform: 'scale(1.25)', offset: .48 }, { transform: 'none' }], { duration: 650, iterations: 2, fill: 'none' }, []); },
      5: function (p) { a(p.sim, [{ transform: 'none' }, { transform: 'translateY(-22px)', offset: .33, easing: 'ease-out' }, { transform: 'translateY(0)', offset: .7 }, { transform: 'translateY(-5px)', offset: .82 }, { transform: 'none' }], { duration: 750, fill: 'none' }, []); },
      6: function (p) { a(p.izq, [{ transform: 'none' }, { transform: 'rotate(14deg)' }, { transform: 'none' }], { duration: 240, iterations: 3, fill: 'none' }, []); a(p.der, [{ transform: 'none' }, { transform: 'rotate(-8deg)' }, { transform: 'none' }], { duration: 600, fill: 'none' }, []); },
      7: function (p) { p.estrellas.forEach(function (e, k) { a(e, [{ transform: 'scale(.4)', opacity: .4 }, { transform: 'scale(1.6)', opacity: 1 }, { transform: 'none', opacity: 1 }], { duration: 500, delay: k * 50, fill: 'none' }, []); }); },
      8: function (p) {
        a(p.sim, [{ transform: 'none' }, { transform: 'rotate(360deg)' }], { duration: 1100, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'none', composite: 'add' }, []);
        p.ondas.forEach(function (o, k) { caja(o); a(o, [{ transform: 'scale(.7)', opacity: .8 }, { transform: 'scale(2.3)', opacity: 0 }], { duration: 900, delay: k * 180, easing: 'ease-out', fill: 'none' }, []); });
      },
    };
    partes.forEach(function (p, i) {
      var ocupado = false;
      function gesto() {
        if (ocupado || reducido || attr('data-logo-gestos', 'si') === 'no' || attr('data-anim', 'normal') === 'no') return;
        ocupado = true;
        var an = a(p.g, [{ transform: 'none' }, { transform: 'translateY(-16px) rotate(' + (i % 2 ? 5 : -5) + 'deg)', offset: .28, easing: 'ease-out' }, { transform: 'translateY(2px) rotate(0)', offset: .62 }, { transform: 'translateY(-2px)', offset: .8 }, { transform: 'none' }], { duration: 950, fill: 'none' }, []);
        gestos[i](p);
        an.finished.then(function () { ocupado = false; }, function () { ocupado = false; });
      }
      p.g.addEventListener('pointerenter', gesto);
      p.g.addEventListener('touchstart', gesto, { passive: true });
    });

    // Fuera de pantalla el reposo se detiene (ahorra batería).
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (vivo) reposo.forEach(function (an) { if (visible) an.play(); else an.pause(); });
    }).observe(svg);

    var temporizador = 0;
    function reproducir() {
      clearTimeout(temporizador);
      entrada.concat(reposo).forEach(function (an) { an.cancel(); });
      entrada = []; reposo = []; vivo = false;
      var modo = attr('data-anim', 'normal') === 'no' ? 'ninguna' : attr('data-logo-anim', 'vivo');
      var t = entrar(modo);
      temporizador = setTimeout(reposar, t / VEL);
    }
    return { reproducir: reproducir };
  }

  // Espera a que se vaya la pantalla de carga o la cortina antes de empezar.
  function cuandoListo(fn) {
    var ocupado = function () { return raiz.classList.contains('con-intro') || raiz.classList.contains('tk-entrando'); };
    if (!ocupado()) return fn();
    var obs = new MutationObserver(function () { if (!ocupado()) { obs.disconnect(); setTimeout(fn, 120); } });
    obs.observe(raiz, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { obs.disconnect(); fn(); }, 6000);
  }

  var logos = $$('svg.tk-logo').map(crear), iniciado = false;
  if (!logos.length) return;
  cuandoListo(function () { if (iniciado) return; iniciado = true; logos.forEach(function (l) { l.reproducir(); }); });
  // Vista previa del panel «Diseño del sitio»: al cambiar las opciones del logo se vuelve a reproducir.
  var previo = [attr('data-logo-anim'), attr('data-logo-reposo')].join();
  d.addEventListener('mlp:diseno', function (e) {
    var ahora = [attr('data-logo-anim'), attr('data-logo-reposo')].join();
    if (ahora !== previo || (e.detail && e.detail.reproducir)) { previo = ahora; logos.forEach(function (l) { l.reproducir(); }); }
  });
})();
