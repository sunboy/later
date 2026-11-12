"""Later Display: a small headline face drawn from centrelines with an elliptical pen.

Every glyph is a set of centreline strokes (straight lines and superellipse arcs, the same
squared-round curve as the app's card corners). Strokes are expanded with an oval nib that is
wider than it is tall, so verticals come out heavier than horizontals, then unioned with shapely
and written as TrueType outlines with fontTools. Output: LaterDisplay.ttf, LaterDisplay.woff2,
and wordmark.json (the five wordmark letters as SVG paths, with the t split into stem and bar).

Run: python3 build_font.py  (needs fonttools, brotli, shapely)
"""
import json, math, os
from shapely.geometry import LineString, LinearRing, Polygon, MultiPolygon, box, Point
from shapely.ops import unary_union
from shapely.affinity import scale, translate, rotate
from shapely.geometry.polygon import orient

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------- parameters ----------------
UPM = 1000
XH, CAP, ASC, DSC = 500, 690, 730, -230
O = 10                    # overshoot of round shapes
WM = os.environ.get('WM') == '1'   # wordmark pass: heavier pen, wordmark.json only
H = 106 if WM else 88      # horizontal stroke thickness
K = 1.2 if WM else 1.25                  # nib ratio: vertical stems are H*K thick
V = H * K
hh, hv = H / 2, V / 2
NE = 2.75                 # superellipse exponent (2 = ellipse, higher = squarer)
SB_STRAIGHT, SB_ROUND, SB_DIAG = 52, 36, 16


def se(cx, cy, a, b, d0, d1, n=NE, step=1.5):
    """Superellipse arc from angle d0 to d1 (degrees, either direction)."""
    cnt = max(2, int(abs(d1 - d0) / step))
    pts = []
    for i in range(cnt + 1):
        t = math.radians(d0 + (d1 - d0) * i / cnt)
        c, s = math.cos(t), math.sin(t)
        x = cx + a * math.copysign(abs(c) ** (2 / n), c)
        y = cy + b * math.copysign(abs(s) ** (2 / n), s)
        pts.append((x, y))
    return pts


def pen(geom, w=H, cap='flat'):
    g = scale(geom, 1 / K, 1, origin=(0, 0)).buffer(w / 2, quad_segs=14, cap_style=cap, join_style='round')
    return scale(g, K, 1, origin=(0, 0))


def S(pts, clip=None, w=H, cap='flat'):
    g = pen(LineString(pts), w, cap)
    if clip:
        g = g.intersection(box(-2000, clip[0], 4000, clip[1]))
    return g


def ring(cx, cy, W, Ht, n=NE):
    a, b = W / 2 - hv, Ht / 2 - hh
    return pen(LinearRing(se(cx, cy, a, b, 0, 360, n)[:-1]))


def ext(p, q, d=200):
    """Extend segment p->q by d at both ends (for diagonals that get clipped flat)."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    return [(p[0] - ux * d, p[1] - uy * d), (q[0] + ux * d, q[1] + uy * d)]


def ext1(p, q, d=200):
    """Extend p->q beyond q only."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = math.hypot(dx, dy)
    return [p, (q[0] + dx / L * d, q[1] + dy / L * d)]


def rect(x0, y0, x1, y1):
    return box(min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))


def vstem(x, y0, y1):
    return rect(x - hv, y0, x + hv, y1)


def hbar(x0, x1, y):
    return rect(x0, y - hh, x1, y + hh)


def dot(cx, y0):
    s = V * 1.02
    return Polygon(se(cx, y0 + s / 2, s / 2, s / 2, 0, 360, 4.2)[:-1])


glyphs = {}   # name -> (geom, lsb, rsb, unicode)


def G(ch, parts, subs=(), clip=None, sb=None, rsb=None, name=None):
    g = unary_union([p for p in parts])
    if subs:
        g = g.difference(unary_union(list(subs)))
    if clip:
        g = g.intersection(box(-2000, clip[0], 4000, clip[1]))
    l = sb if sb is not None else SB_STRAIGHT
    r = rsb if rsb is not None else l
    glyphs[name or ch] = (g, l, r, ord(ch) if len(ch) == 1 else None)


# ---------------- shared builders ----------------
def arch(xl, xr, top, ay):
    """Shoulder arch of n/h/m: from the left stem at height ay over the top, down the right stem to 0."""
    cx, a = (xl + xr) / 2, (xr - xl) / 2
    pts = se(cx, ay, a, top - hh - ay, 180, 0)
    return S(pts + [(xr, 0)])


def bowl_b(x0, W, top=XH, n=NE):
    """b-type bowl whose left side sits on a stem at x0."""
    a = (W - V) / 2
    return pen(LinearRing(se(x0 + a, top / 2, a, (top + 2 * O) / 2 - hh, 0, 360, n)[:-1]))


# ---------------- lowercase ----------------
W_O = 520
G('o', [ring(W_O / 2, XH / 2, W_O, XH + 2 * O)], sb=SB_ROUND)

def n_shape(w=470, stem_top=XH, ay=250):
    xl, xr = hv, w - hv
    return [vstem(xl, 0, stem_top), arch(xl, xr, XH + O, ay)]

G('n', n_shape())
G('h', n_shape(stem_top=ASC))
G('m', [vstem(hv, 0, XH), arch(hv, 380 - hv * 0.0, XH + O, 260), arch(380, 760 - hv, XH + O, 260)])
_n = unary_union(n_shape())
G('u', [rotate(_n, 180, origin=(235, XH / 2))])
G('r', [vstem(hv, 0, XH), S(se(hv + 150, 250, 150, XH + O - hh - 250, 180, 78))], rsb=8)

_b = unary_union([vstem(hv, 0, ASC), bowl_b(hv, W_O - 20)])
G('b', [_b], sb=SB_STRAIGHT, rsb=SB_ROUND)
_d = scale(_b, -1, 1, origin=(0, 0))
G('d', [_d], sb=SB_ROUND, rsb=SB_STRAIGHT)
_p = unary_union([vstem(hv, DSC, XH), bowl_b(hv, W_O - 20)])
G('p', [_p], rsb=SB_ROUND)
G('q', [scale(_p, -1, 1, origin=(0, 0))], sb=SB_ROUND)

cx = 480 / 2
G('c', [ring(cx, XH / 2, 480, XH + 2 * O)], subs=[rect(cx + 20, XH / 2 - 92, 900, XH / 2 + 92)], sb=SB_ROUND, rsb=22)
ybar = 262
G('e', [ring(W_O / 2, XH / 2, W_O, XH + 2 * O), hbar(hv, W_O - hv, ybar)],
  subs=[rect(W_O / 2 + 10, 128, 900, ybar - hh)], sb=SB_ROUND, rsb=26)

# s: two squared bowls joined by the spine
def s_shape(w, ht, stretch=1.0):
    a = w / 2 - hv
    bu = (ht / 2 + O) / 2 - hh / 2 - 2
    cyu = ht - (bu + hh) + O
    cyl = (bu + hh) - O
    bu_l = cyu - cyl - bu
    up = se(w / 2, cyu, a * 0.94, bu, 22, 270)
    lo = se(w / 2, cyl, a, bu_l, 90, -158)
    lo = lo[1:]
    return S(up + lo)
G('s', [s_shape(440, XH)], sb=SB_ROUND - 4)

# a: double storey
def a_shape():
    w = 470; xr = w - hv
    top = S(se(xr - 165, 330, 165, XH + O - hh - 330, 160, 0) + [(xr, 0)])
    bw = (xr - 32) / 2
    bowl = pen(LinearRing(se(32 + bw, 150, bw, 150 + O - hh, 0, 360, 2.9)[:-1]))
    return [top, bowl]
G('a', a_shape(), sb=34)

# g: single storey with a descender hook
def g_shape():
    w = W_O - 20
    xr = w - hv
    bowl = scale(bowl_b(hv, w), -1, 1, origin=(w / 2, 0))
    hook = S([(xr, XH)] + [(xr, -40)] + se(xr - 190, -40, 190, (-40) - (DSC - O + hh), 0, -200)[1:])
    return [bowl, hook]
G('g', g_shape(), sb=SB_ROUND)

G('i', [vstem(hv, 0, XH), dot(hv, XH + 70)])
G('l', [vstem(hv, 0, ASC)])
G('j', [S([(hv + 60, XH), (hv + 60, -40)] + se(hv + 60 - 150, -40, 150, (-40) - (DSC - O + hh), 0, -150)[1:]),
        dot(hv + 60, XH + 70)], sb=-40)

def t_parts(left=True, w=300):
    x = hv + (78 if left else 0)
    stem = S([(x, 630), (x, 140)] + se(x + 150, 140, 150, 140 + O - hh, 180, 300)[1:])
    bar = hbar(x - (78 + hv if left else hv), x + 190, XH - hh)
    return stem, bar
G('t', list(t_parts()), sb=18, rsb=14)

def f_shape():
    x = hv + 70
    stem = S([(x, 0), (x, 560)] + se(x + 150, 560, 150, ASC + O - hh - 560, 180, 52)[1:])
    bar = hbar(0, x + 190, XH - hh)
    return [stem, bar]
G('f', f_shape(), sb=18, rsb=0)

G('k', [vstem(hv, 0, ASC), S(ext1((hv, 165), (440, XH)), clip=(0, XH)), S(ext1((205, 290), (440, 0)), clip=(0, XH))], rsb=SB_DIAG)

def v_shape(w, top, bottom=0):
    return [S(ext((hv * 0.7, top), (w / 2, bottom - 15)), clip=(bottom, top)),
            S(ext((w - hv * 0.7, top), (w / 2, bottom - 15)), clip=(bottom, top))]
G('v', v_shape(480, XH), sb=SB_DIAG)
G('w', [S(ext((40, XH), (190, -15)), clip=(0, XH)), S(ext((340, XH + 15), (190, -15)), clip=(0, XH)),
        S(ext((340, XH + 15), (490, -15)), clip=(0, XH)), S(ext((640, XH), (490, -15)), clip=(0, XH))], sb=SB_DIAG)
G('x', [S(ext((40, XH), (440, 0)), clip=(0, XH)), S(ext((440, XH), (40, 0)), clip=(0, XH))], sb=SB_DIAG)
G('y', [S(ext((40, XH), (245, 0)), clip=(0, XH)), S(ext((460, XH), (150, DSC)), clip=(DSC, XH))], sb=SB_DIAG)
G('z', [hbar(20, 420, XH - hh), hbar(20, 440, hh), S(ext((395, XH - hh), (55, hh)), clip=(hh, XH - hh), w=H * 1.12)], sb=30)

# ---------------- uppercase ----------------
def ringC(cx, W, Ht=CAP):
    return ring(cx, Ht / 2, W, Ht + 2 * O)

G('O', [ringC(330, 660)], sb=SB_ROUND)
G('Q', [ringC(330, 660), S(ext((420, 150), (640, -40), 0), w=H * 1.1)], sb=SB_ROUND)
G('C', [ringC(310, 620)], subs=[rect(330, CAP / 2 - 120, 900, CAP / 2 + 120)], sb=SB_ROUND, rsb=24)
G('G', [ringC(320, 640), hbar(330, 640 - hv, CAP / 2 - 70 + hh), vstem(640 - hv, 0, CAP / 2 - 30)],
  subs=[rect(340, CAP / 2 - 26, 900, CAP / 2 + 130), rect(640 - V, -50, 900, CAP / 2 - 70 + hh - hh)], sb=SB_ROUND)
G('G', [ringC(320, 640), hbar(350, 640, CAP / 2 - 40)],
  subs=[rect(340, CAP / 2 + 2, 900, CAP / 2 + 130)], sb=SB_ROUND, rsb=30)
G('D', [vstem(hv, 0, CAP), S([(hv, CAP - hh), (300, CAP - hh)] + se(300, CAP / 2, 600 - hv - 300, CAP / 2 - hh, 90, -90)[1:] + [(hv, hh)])], rsb=SB_ROUND)
ym = 350
_bu = (CAP - hh - ym) / 2; _bl = (ym - hh) / 2
G('B', [vstem(hv, 0, CAP),
        S([(hv, CAP - hh), (300, CAP - hh)] + se(300, ym + _bu, 535 - hv - 300, _bu, 90, -90)[1:] + [(hv, ym)]),
        S([(hv, ym), (310, ym)] + se(310, hh + _bl, 575 - hv - 310, _bl, 90, -90)[1:] + [(hv, hh)])], rsb=SB_ROUND)
G('P', [vstem(hv, 0, CAP), S([(hv, CAP - hh), (290, CAP - hh)] + se(290, CAP - 190, 550 - hv - 290, 190 - hh, 90, -90)[1:] + [(hv, CAP - 380 + hh)])], rsb=SB_ROUND)
G('R', [vstem(hv, 0, CAP), S([(hv, CAP - hh), (290, CAP - hh)] + se(290, CAP - 190, 550 - hv - 290, 190 - hh, 90, -90)[1:] + [(hv, CAP - 380 + hh)]),
        S(ext((300, 320), (560, 0)), clip=(0, 330))], rsb=SB_DIAG)
G('E', [vstem(hv, 0, CAP), hbar(0, 500, CAP - hh), hbar(0, 470, 355), hbar(0, 510, hh)], rsb=34)
G('F', [vstem(hv, 0, CAP), hbar(0, 490, CAP - hh), hbar(0, 460, 345)], rsb=24)
G('H', [vstem(hv, 0, CAP), vstem(580 - hv, 0, CAP), hbar(hv, 580 - hv, 355)])
G('I', [vstem(hv, 0, CAP)])
G('J', [S([(420 - hv, CAP), (420 - hv, 220)] + se(420 - hv - 185, 220, 185, 220 + O - hh, 0, -180)[1:] + [(420 - hv - 370, 250)])], sb=26)
G('K', [vstem(hv, 0, CAP), S(ext1((hv, 230), (590, CAP)), clip=(0, CAP)), S(ext1((230, 380), (600, 0)), clip=(0, CAP))], rsb=SB_DIAG)
G('L', [vstem(hv, 0, CAP), hbar(0, 470, hh)], rsb=20)
G('M', [vstem(hv, 0, CAP), vstem(720 - hv, 0, CAP), S([(hv * 0.6, CAP - 30), (360, 120), (720 - hv * 0.6, CAP - 30)], clip=(0, CAP), w=H * 1.08)])
G('M', [rect(0, 0, V * 0.92, CAP), rect(720 - V * 0.92, 0, 720, CAP),
        S([(hv * 0.5, CAP + 40), (360, 130), (720 - hv * 0.5, CAP + 40)], clip=(0, CAP))])
G('N', [rect(0, 0, V * 0.92, CAP), rect(600 - V * 0.92, 0, 600, CAP), S(ext((hv * 0.6, CAP), (600 - hv * 0.6, 0)), clip=(0, CAP), w=H * 1.12)])
G('U', [S([(hv, CAP)] + se(300, 260, 300 - hv, 260 + O - hh, 180, 360)[1:] + [(600 - hv, CAP)])])
G('V', v_shape(640, CAP), sb=SB_DIAG)
G('W', [S(ext((40, CAP), (240, -15)), clip=(0, CAP)), S(ext((450, CAP + 15), (240, -15)), clip=(0, CAP)),
        S(ext((450, CAP + 15), (660, -15)), clip=(0, CAP)), S(ext((860, CAP), (660, -15)), clip=(0, CAP))], sb=SB_DIAG)
G('X', [S(ext((40, CAP), (590, 0)), clip=(0, CAP)), S(ext((590, CAP), (40, 0)), clip=(0, CAP))], sb=SB_DIAG)
G('Y', [S(ext((30, CAP), (310, 300)), clip=(300, CAP)), S(ext((590, CAP), (310, 300)), clip=(300, CAP)), vstem(310, 0, 330)], sb=SB_DIAG)
G('Z', [hbar(30, 560, CAP - hh), hbar(30, 580, hh), S(ext((540, CAP - hh), (60, hh)), clip=(hh, CAP - hh), w=H * 1.15)], sb=30)
G('T', [hbar(0, 580, CAP - hh), vstem(290, 0, CAP)], sb=14)
G('A', [S(ext((20, -15), (320, CAP + 15)), clip=(0, CAP)), S(ext((620, -15), (320, CAP + 15)), clip=(0, CAP)), hbar(140, 500, 215)], sb=SB_DIAG)
G('S', [s_shape(560, CAP)], sb=SB_ROUND - 4)

# ---------------- figures (lining, tabular 600) ----------------
FW = 600
def fig(ch, parts, subs=()):
    g = unary_union(parts)
    if subs:
        g = g.difference(unary_union(list(subs)))
    glyphs[ch] = (g, 40, 40, ord(ch))

FH = CAP
fig('0', [ring(260, FH / 2, 520, FH + 2 * O)])
fig('1', [vstem(300, 0, FH), S([(300, FH - hh), (190, FH - hh), (130, FH - 120)])])
fig('2', [S(se(255, FH - 200, 215, 200 + O - hh, 168, -8) + [(70 + hv * 0.6, hh + 10)], w=H * 1.06), hbar(30, 500, hh)], subs=[rect(-100, -100, 1000, 0)])
fig('3', [S(se(250, FH - 172, 200, 172 + O - hh, 160, -90) + [(170, 2 * (FH - 172) - (FH - 172) - (172 + O - hh) + 0)]),
          S(se(255, 190, 215, 190 + O - hh, 90, -160))])
fig('4', [S(ext((390, FH), (60, 205)), clip=(205, FH), w=H * 1.1), hbar(30, 540, 205 + 0), vstem(410, 0, FH)])
fig('5', [hbar(95 - hv, 480, FH - hh), S([(95, FH - hh), (95, 405)] + se(265, 222, 215, 222 + O - hh, 122, -160))])
_six = unary_union([ring(255, 215, 500, 430 + 2 * O), S(se(255, 330, 250 - hv, FH + O - hh - 330, 32, 180) + [(5 + hv, 215)])])
fig('6', [_six])
fig('7', [hbar(40, 500, FH - hh), S(ext((470, FH - hh), (190, 0)), clip=(0, FH - hh), w=H * 1.12)])
fig('8', [ring(255, FH - 168, 420, 336 + 2 * O), ring(255, 190, 500, 380 + 2 * O)])
fig('9', [rotate(_six, 180, origin=(255, FH / 2))])

# ---------------- punctuation ----------------
PS = V * 1.06
def pdot(x, y):
    return Polygon(se(x, y + PS / 2, PS / 2, PS / 2, 0, 360, 4.2)[:-1])
G(' ', [Point(0, 0).buffer(0.001)], sb=0, rsb=230, name='space')
G('.', [pdot(hv, 0)], sb=40)
G(',', [pdot(hv, 0), S([(hv + PS / 2 - 18, PS / 2), (hv - 10, -150)], w=H * 0.9)], subs=[rect(-200, -400, hv - PS / 2 + 4, PS / 2)], sb=40)
G(':', [pdot(hv, 0), pdot(hv, XH - PS)], sb=44)
G(';', [pdot(hv, XH - PS), pdot(hv, 0), S([(hv + PS / 2 - 18, PS / 2), (hv - 10, -150)], w=H * 0.9)], subs=[rect(-200, -400, hv - PS / 2 + 4, PS / 2)], sb=44)
G('!', [vstem(hv + 2, 230, CAP), pdot(hv + 2, 0)], sb=44)
G('?', [S(se(220, CAP - 170, 180, 170 + O - hh, 165, -90) + [(220, CAP - 340 + hh - 8), (220, 230)]), pdot(220, 0)], sb=24)
G("'", [rect(0, CAP - 240, V * 0.9, CAP)], sb=44)
G('"', [rect(0, CAP - 240, V * 0.9, CAP), rect(V * 0.9 + 70, CAP - 240, 2 * V * 0.9 + 70, CAP)], sb=44)
G('’', [pdot(hv, CAP - PS), S([(hv + PS / 2 - 18, CAP - PS / 2), (hv - 10, CAP - 300)], w=H * 0.9)], subs=[rect(-200, 0, hv - PS / 2 + 4, CAP - PS / 2)], sb=44, name='quoteright')
G('-', [hbar(0, 270, 270)], sb=40)
G('–', [hbar(0, 500, 270)], sb=20, name='endash')
G('/', [S(ext((0, -60), (300, CAP + 40), 0), w=H)], sb=20)
G('(', [S(se(270, 250, 220, 470, 115, 245, 2.4), w=H)], sb=50, rsb=20, name='parenleft')
G(')', [scale(S(se(270, 250, 220, 470, 115, 245, 2.4), w=H), -1, 1, origin=(0, 0))], sb=20, rsb=50, name='parenright')
_pc = unary_union([pen(LinearRing(se(120, CAP - 150, 80, 110, 0, 360)[:-1]), H * 0.72), pen(LinearRing(se(480, 150, 80, 110, 0, 360)[:-1]), H * 0.72), S(ext((80, -10), (500, CAP + 10), 0), w=H * 0.9)])
G('%', [_pc], sb=30)
# currency
G('£', [S([(520, CAP - 140)] + se(345, CAP - 200, 175, 200 + O - hh, 30, 180)[1:] + [(170, 120)] + se(100, 120, 70, 120 - hh, 0, -90)[1:] + [(40, hh)], w=H),
        hbar(40, 520, hh), hbar(40, 400, 330)], subs=[rect(-100, -100, 1000, 0)], sb=24)
_S = s_shape(540, CAP)
G('$', [_S, vstem(270 + 0, -110, CAP + 110)], subs=[rect(270 - hv - 6, CAP - 10, 270 + hv + 6, CAP + O + 2), rect(270 - hv - 6, -O - 2, 270 + hv + 6, 10)], sb=SB_ROUND)
glyphs['$'] = (unary_union([_S, rect(270 - V * 0.36, -110, 270 + V * 0.36, CAP + 110)]), SB_ROUND, SB_ROUND, ord('$'))
_E = unary_union([ringC(330, 620)]).difference(rect(350, CAP / 2 - 120, 900, CAP / 2 + 120))
G('€', [_E, hbar(-30, 430, 400), hbar(-30, 400, 270)], sb=0, rsb=24)
G('&', [s_shape(500, CAP)], name='ampersand_unused')
del glyphs['ampersand_unused']


# ---------------- wordmark-only letterforms ----------------
# The wordmark is drawn a touch tighter and heavier than the font, with a forward-only t bar
# (the bar points to the right: later) and a squared-off r ear. Exported as SVG paths.
def wm_letters(upper):
    out = []
    if not upper:
        L_ = unary_union([vstem(hv, 0, CAP), hbar(0, 400, hh)])
        out.append(('L', [L_]))
        out.append(('a', [unary_union(a_shape())]))
        stem, bar = t_parts(left=False)
        out.append(('t', [stem, hbar(0, hv + 230, XH - hh)]))
        out.append(('e', [glyphs['e'][0]]))
        out.append(('r', [glyphs['r'][0]]))
    else:
        out.append(('L', [glyphs['L'][0]]))
        out.append(('A', [glyphs['A'][0]]))
        out.append(('T', [vstem(290, 0, CAP), hbar(0, 580, CAP - hh)]))
        out.append(('E', [glyphs['E'][0]]))
        out.append(('R', [glyphs['R'][0]]))
    return out


def path_d(g, x0, flip_h):
    """Geometry to an SVG path string, y down, origin at the cap line."""
    polys = [g] if isinstance(g, Polygon) else list(getattr(g, 'geoms', []))
    parts = []
    for p in polys:
        if p.is_empty:
            continue
        p = p.simplify(0.6)
        for r in [p.exterior] + list(p.interiors):
            cs = list(r.coords)[:-1]
            parts.append('M' + 'L'.join(f'{x - x0:.0f} {flip_h - y:.0f}' for x, y in cs) + 'Z')
    return ''.join(parts)


def write_wordmark():
    data = {}
    for key, upper in (('lower', False), ('upper', True)):
        letters = []
        GAP = {'lower': 58, 'upper': 64}[key]
        prev = None
        for i, (ch, parts) in enumerate(wm_letters(upper)):
            g = unary_union(parts)
            b = g.bounds
            g = translate(g, -b[0], 0)
            if prev is None:
                pen_x = 0
            else:
                lo, hi = prev.bounds[2] - (b[2] - b[0]), prev.bounds[2] + GAP * 2
                for _ in range(30):            # optical spacing: equal nearest distance between letters
                    mid = (lo + hi) / 2
                    if translate(g, mid, 0).distance(prev) < GAP: lo = mid
                    else: hi = mid
                pen_x = hi
            entry = {'ch': ch, 'x': round(pen_x), 'w': round(b[2] - b[0])}
            if ch == 't' and len(parts) == 2:
                entry['stem'] = path_d(parts[0], b[0], CAP)
                entry['bar'] = path_d(parts[1], b[0], CAP)
                entry['pivot'] = [round(hv - b[0] + (0)), round(CAP - (XH - hh))]
            entry['d'] = path_d(g, 0, CAP)
            letters.append(entry)
            prev = translate(g, pen_x, 0)
        pen_x = prev.bounds[2]
        data[key] = {'letters': letters, 'width': round(pen_x), 'cap': CAP, 'xh': XH, 'height': CAP}
    with open(os.path.join(OUT, 'wordmark.json'), 'w') as f:
        json.dump(data, f)
    return data


# ---------------- compile ----------------
def build():
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.ttGlyphPen import TTGlyphPen
    from fontTools.feaLib.builder import addOpenTypeFeaturesFromString

    order = ['.notdef'] + sorted(glyphs.keys(), key=lambda n: (glyphs[n][3] or 0))
    names = {}
    for n in order[1:]:
        u = glyphs[n][3]
        gname = n if (len(n) > 1 or n.isalnum()) else 'uni%04X' % u
        if n.isdigit():
            gname = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][int(n)]
        names[n] = gname
    gorder = ['.notdef'] + [names[n] for n in order[1:]]
    cmap, metrics, ttglyphs = {}, {}, {}

    p = TTGlyphPen(None)
    for c in [[(50, 0), (50, CAP), (450, CAP), (450, 0)], [(110, 60), (390, 60), (390, CAP - 60), (110, CAP - 60)]]:
        p.moveTo(c[0]); [p.lineTo(q) for q in c[1:]]; p.closePath()
    ttglyphs['.notdef'] = p.glyph(); metrics['.notdef'] = (500, 50)

    for n in order[1:]:
        g, lsb, rsb, u = glyphs[n]
        gname = names[n]
        b = g.bounds
        if lsb is None:            # figures: fixed advance
            adv, shift = FW, 0
        else:
            shift = lsb - b[0]
            adv = round(b[2] - b[0] + lsb + rsb)
        g = translate(g, shift, 0)
        pen_ = TTGlyphPen(None)
        polys = [g] if isinstance(g, Polygon) else [q for q in getattr(g, 'geoms', []) if isinstance(q, Polygon)]
        for poly in polys:
            if poly.area < 1:
                continue
            poly = orient(poly.simplify(0.5), sign=-1.0)   # TrueType: outer clockwise
            for r in [poly.exterior] + list(poly.interiors):
                cs = [(round(x), round(y)) for x, y in list(r.coords)[:-1]]
                ded = [cs[0]] + [c for i, c in enumerate(cs[1:]) if c != cs[i]]
                if len(ded) < 3:
                    continue
                pen_.moveTo(ded[0]); [pen_.lineTo(q) for q in ded[1:]]; pen_.closePath()
        ttglyphs[gname] = pen_.glyph()
        bb = g.bounds
        metrics[gname] = (adv, round(bb[0]) if n != 'space' else 0)
        if u:
            cmap[u] = gname

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(gorder)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(ttglyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=900, descent=-260)
    fam = 'Later Display'
    fb.setupNameTable({
        'familyName': fam, 'styleName': 'Bold', 'uniqueFontIdentifier': 'LaterDisplay-Bold-0.1',
        'fullName': 'Later Display Bold', 'psName': 'LaterDisplay-Bold', 'version': 'Version 0.100',
        'copyright': 'Copyright 2026 The Later contributors',
        'licenseDescription': 'This Font Software is licensed under the SIL Open Font License, Version 1.1.',
        'licenseInfoURL': 'https://openfontlicense.org',
    })
    fb.setupOS2(sTypoAscender=900, sTypoDescender=-260, sTypoLineGap=0, usWinAscent=960, usWinDescent=300,
                sxHeight=XH, sCapHeight=CAP, usWeightClass=700, achVendID='NONE', fsSelection=0x20 | 0x80)
    fb.setupPost()
    kern = """
    languagesystem DFLT dflt; languagesystem latn dflt;
    feature kern {
      pos T [a c e o s u r y] -70; pos T [A] -50; pos [A] [T V W Y] -55; pos [V W Y] [a e o] -50;
      pos L [T V W Y] -60; pos [r] [period comma] -60; pos [P] [period comma] -70; pos [T] [period comma] -70;
      pos [f] [a e o] -10; pos [y v w] [period comma] -40; pos [L] [a] -10;
    } kern;
    """
    addOpenTypeFeaturesFromString(fb.font, kern.replace('period', 'uni002E').replace('comma', 'uni002C'))
    ttf = os.path.join(OUT, 'LaterDisplay.ttf')
    fb.save(ttf)
    from fontTools.ttLib import TTFont
    f = TTFont(ttf); f.flavor = 'woff2'; f.save(os.path.join(OUT, 'LaterDisplay.woff2'))
    print('glyphs', len(gorder), 'ttf', os.path.getsize(ttf), 'woff2', os.path.getsize(os.path.join(OUT, 'LaterDisplay.woff2')))


if __name__ == '__main__':
    if not WM:
        build()
        raise SystemExit
    d = write_wordmark()
    print('wordmark widths', d['lower']['width'], d['upper']['width'])
