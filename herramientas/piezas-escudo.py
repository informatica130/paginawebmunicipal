"""Genera public/img/escudo-piezas.svg: el escudo vectorial separado en sus elementos
(aves, araucarias, volcán y terreno, kultrún, trutrucas, bocinas, laureles con copihues,
cinta y textos) para la pantalla de carga de la portada.

Uso (requiere numpy y Pillow):
  1. Renderizar public/img/escudo-azul.svg a 940 × 962 px (2×) sobre blanco, como PNG.
  2. python3 herramientas/piezas-escudo.py escudo2x.png

Cada trazo del SVG se asigna a la mancha del dibujo que bordea (componentes conexas del
render), y cada mancha a un elemento según su posición. Las araucarias y el terreno forman
una sola mancha, así que se separan con un recorte complementario."""
import re, sys, json
from collections import deque, Counter
import numpy as np
from PIL import Image

RAIZ = __file__.rsplit('/herramientas/', 1)[0]
svg = open(f'{RAIZ}/public/img/escudo-azul.svg', encoding='utf8').read()
d = re.search(r' d="([^"]+)"', svg).group(1)
negro = np.array(Image.open(sys.argv[1]).convert('L')) < 128
H, W = negro.shape

# Componentes conexas (4 vecinos)
lab = np.zeros((H, W), int); n = 0; cajas = {}
for y in range(H):
    for x in range(W):
        if negro[y, x] and not lab[y, x]:
            n += 1; q = deque([(y, x)]); lab[y, x] = n; ys = []; xs = []
            while q:
                cy, cx = q.popleft(); ys.append(cy); xs.append(cx)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = cy + dy, cx + dx
                    if 0 <= yy < H and 0 <= xx < W and negro[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; q.append((yy, xx))
            cajas[n] = (min(xs) / 2 + 20, min(ys) / 2 - 4, max(xs) / 2 + 20, max(ys) / 2 - 4, len(ys))

def pieza(c):
    x0, y0, x1, y1, area = cajas[c]
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if area > 40000 and y0 < 40: return 'terreno'          # araucarias + volcán + terreno
    if y1 < 52 and 195 < cx < 305: return 'aves'
    if area > 5000 and x1 < 170 and y0 < 30: return 'palo-i'
    if area > 5000 and x0 > 340 and y0 < 30: return 'palo-d'
    if area > 15000 and y0 > 280 and y1 < 380 and cx < 255: return 'campana-i'
    if area > 15000 and y0 > 280 and y1 < 380 and cx > 255: return 'campana-d'
    if 140 < y0 < 160 and x1 < 170: return 'laurel-i'
    if 140 < y0 < 160 and x0 > 340: return 'laurel-d'
    if y0 >= 120 and y1 <= 300 and 140 <= x0 and x1 <= 370: return 'kultrun'
    if 362 <= cy < 392: return 'municipalidad'
    if 392 <= cy < 458: return 'cinta'
    if cy >= 458: return 'chile'
    return 'terreno'

grupos = {}
for sub in re.findall(r'M[^M]+', d):
    nums = list(map(float, re.findall(r'-?\d+(?:\.\d+)?', sub)))
    votos = Counter()
    for i in range(0, len(nums) - 1, 2):
        px, py = int(round((nums[i] - 20) * 2)), int(round((nums[i + 1] + 4) * 2))
        v = lab[max(0, py - 2):py + 3, max(0, px - 2):px + 3]
        votos.update(int(a) for a in v.flatten() if a)
    c = votos.most_common(1)[0][0] if votos else None
    grupos.setdefault(pieza(c) if c else 'terreno', []).append(sub.strip())

ARBOL_I = '112,12 197,12 197,60 176,74 150,92 112,104'
ARBOL_D = '398,12 313,12 313,60 334,74 360,92 398,104'
cuerpo = []; terreno = ''
for nombre, subs in grupos.items():
    dd = ''.join(subs)
    if nombre == 'terreno':
        terreno = f'<path id="terreno" d="{dd}"/>'
        for pz in ('arbol-i', 'arbol-d', 'paisaje'):
            cuerpo.append(f'<g id="pz-{pz}" clip-path="url(#c-{pz})"><use href="#terreno"/></g>')
    else:
        cuerpo.append(f'<g id="pz-{nombre}"><path d="{dd}"/></g>')
defs = (terreno + f'<clipPath id="c-arbol-i"><polygon points="{ARBOL_I}"/></clipPath>'
        f'<clipPath id="c-arbol-d"><polygon points="{ARBOL_D}"/></clipPath>'
        f'<clipPath id="c-paisaje"><path clip-rule="evenodd" d="M0 -10H520V500H0Z M{ARBOL_I.replace(" ", " L")}Z M{ARBOL_D.replace(" ", " L")}Z"/></clipPath>')
salida = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 -4 470 481"><defs>{defs}</defs>'
          f'<g fill-rule="evenodd">{"".join(cuerpo)}</g></svg>')
open(f'{RAIZ}/public/img/escudo-piezas.svg', 'w', encoding='utf8').write(salida)
print({k: len(v) for k, v in grupos.items()}, len(salida), 'bytes')
