"""Builds design/brand/index.html (one self-contained file) and type-options.json.
Inputs: src/*.js, src/page.css, wordmark.json, LaterDisplay.woff2. Run: python3 tools/build_page.py"""
import base64, json, os, html

B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p: open(os.path.join(B, p), encoding='utf-8').read()
GF = ('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;800&family=Familjen+Grotesk:wght@500;700'
      '&family=Hanken+Grotesk:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Albert+Sans:wght@400;500;600'
      '&family=Gabarito:wght@600;800&family=Wix+Madefor+Text:wght@400;500;600&family=Unbounded:wght@500;600'
      '&family=Instrument+Sans:wght@400;500;600&family=Mona+Sans:wght@400;500;600;800&family=Young+Serif'
      '&family=Funnel+Display:wght@600;700&family=Funnel+Sans:wght@400;500;600&display=swap')

def gf(*fams):
    return 'https://fonts.googleapis.com/css2?' + '&'.join('family=' + f for f in fams) + '&display=swap'

REC_PAIR = 'B'
PAIRS = [
    dict(id='A', label='Schibsted Grotesk throughout', display='Schibsted Grotesk', text='Schibsted Grotesk', display_weight=800,
         url=gf('Schibsted+Grotesk:wght@400;500;600;800'),
         character='A newspaper grotesk with real ink in the heavy weights: plain, quick and grown-up, one family to maintain.',
         weakness='At 800 it shouts and the deck starts to look like a front page; nothing in it is specific to Later.'),
    dict(id='B', label='Familjen Grotesk with Hanken Grotesk', display='Familjen Grotesk', text='Hanken Grotesk', display_weight=700,
         url=gf('Familjen+Grotesk:wght@500;700', 'Hanken+Grotesk:wght@400;500;600;700'),
         character='Familjen\'s narrow, slightly bookish shapes (the a, the g, the cut terminals) give headlines a calm, dry voice; Hanken is a quiet, open text face that never competes.',
         weakness='Familjen has only four weights and no width axis, so the size-change motions have to carry hierarchy by size alone.'),
    dict(id='C', label='Fraunces with Albert Sans', display='Fraunces', text='Albert Sans', display_weight=600, display_variation='"opsz" 144, "SOFT" 0, "WONK" 0',
         url=gf('Fraunces:opsz,wght@9..144,500;9..144,600', 'Albert+Sans:wght@400;500;600'),
         character='The most unhurried of the set: a soft old-style display that makes Today feel like a letter rather than a dashboard.',
         weakness='Against Literata in the edition there are two serifs on one screen, and Fraunces at large sizes has become a common start-up look.'),
    dict(id='D', label='Gabarito with Wix Madefor Text', display='Gabarito', text='Wix Madefor Text', display_weight=800,
         url=gf('Gabarito:wght@600;800', 'Wix+Madefor+Text:wght@400;500;600'),
         character='Round, friendly geometric headlines over a very legible UI text face; the warmest of the sans options.',
         weakness='Gabarito\'s round, toy-like bold slides towards the playful; beside money and sends it can look too cheerful.'),
    dict(id='E', label='Unbounded with Instrument Sans', display='Unbounded', text='Instrument Sans', display_weight=600,
         url=gf('Unbounded:wght@500;600', 'Instrument+Sans:wght@400;500;600'),
         character='Wide and loud: unmistakable at the top of the screen and very good for big numerals in the edition.',
         weakness='Too wide for two-line decide headlines on a phone and too loud for an unhurried voice; it reads as crypto or a festival.'),
    dict(id='F', label='Mona Sans (current)', display='Mona Sans', text='Mona Sans', display_weight=800,
         url=gf('Mona+Sans:wght@400;500;600;800'),
         character='Competent and neutral; the width axis is useful for motion.',
         weakness='It is GitHub\'s face and looks like it; the founder does not like it and nothing in it says Later.'),
    dict(id='G', label='Later Display with Hanken Grotesk', display='Later Display', text='Hanken Grotesk', display_weight=700, custom=True,
         url=gf('Hanken+Grotesk:wght@400;500;600;700'), woff2='LaterDisplay.woff2',
         character='Our own squared-round headlines, the same curve as the card corners and the wordmark, so the brand and the screen are one material.',
         weakness='A one-session draft: one weight, rough spacing and kerning, dark joins. Good for the wordmark and a few big words, not yet for every headline.'),
    dict(id='H', label='Young Serif with Funnel Sans (added)', display='Young Serif', text='Funnel Sans', display_weight=400,
         url=gf('Young+Serif', 'Funnel+Sans:wght@400;500;600'),
         character='Added because the product\'s voice is unhurried and dry: a heavy, stubby serif reads like a well-made notebook, and Funnel Sans is crisp underneath.',
         weakness='One weight only, and with Literata in the edition the screen has two serifs; it needs restraint to stay out of cafe-menu territory.'),
    dict(id='I', label='Funnel Display with Funnel Sans (added)', display='Funnel Display', text='Funnel Sans', display_weight=700,
         url=gf('Funnel+Display:wght@600;700', 'Funnel+Sans:wght@400;500;600'),
         character='Added as the one-family alternative to A: a 2024 superfamily whose display cut has small notches at the joins, a detail that holds at 20px and nobody else is using yet.',
         weakness='The notches can look mannered in long headlines; newer and less proven than A or B.'),
]
STACK_FALLBACK = "ui-sans-serif, system-ui, sans-serif"
for p in PAIRS:
    serif = p['display'] in ('Fraunces', 'Young Serif')
    p['display_stack'] = f"'{p['display']}', " + ("Georgia, serif" if serif else STACK_FALLBACK)
    p['text_stack'] = f"'{p['text']}', {STACK_FALLBACK}"

CONCEPTS = [
    dict(id='ball', tag='wm-ball', name='The ball', variant='upper',
         idea='The founder\'s idea. LATER is engraved around a ball, inlaid in ink. The ball turns slowly to look one way, rests, then looks the other way, and the letters slide across the face and around the edge with real foreshortening.',
         idle='Looks right, rests, looks left, rests, comes home: a 16 s loop that is still most of the time.',
         working='Turns steadily. The word goes round the back and comes back, every 9 s.',
         done='One full turn, then a citrus moment: the porcelain warms to citrus in light, the inlay turns citrus in dark.',
         touch='Drag sideways to turn it by hand; it springs back. Tap for one turn. Hover and it leans toward you.',
         verdict='<b>Use for brand moments:</b> the splash, onboarding, the website, the About screen. In the header it becomes a slot across the equator of a larger ball so the word stays legible at 20px.',
         tire='Its working spin in a header would wear thin within a day.', hint='Drag sideways, or tap'),
    dict(id='late', tag='wm-late', name='Late arrival', variant='lower',
         idea='The letters settle one after another and the r is always a beat behind, as if it arrived late. The joke is quiet and the timing carries it.',
         idle='Every 9 s the word nods from left to right. The r follows late and wobbles as it lands.',
         working='A slow ripple runs through the word; the r lags behind it.',
         done='For once the r is on time: all five land together and a citrus rule draws underneath.',
         touch='Hover and the word leans in; the r catches up late. Tap and it arrives again, letter by letter.',
         verdict='<b>The most charming at 20px</b> and the cheapest to build. It is about lateness rather than time kept, which is close to the brand but not the same.',
         tire='The wobble would tire if it played every time the header appeared; once per session is right.', hint='Hover, or tap'),
    dict(id='horizon', tag='wm-horizon', name='Below the line', variant='lower', pick=True,
         idea='The word stands on a horizon. What can wait sinks below it and comes back when promised. In idle only the r sinks, so for a few seconds the logo reads Late, then the r returns on time.',
         idle='Every 11 s the r sinks under the line, waits two seconds, and rises with one small overshoot.',
         working='The letters ride a slow swell with their feet in the water.',
         done='The word lifts clear and the horizon turns citrus and widens.',
         touch='Drag the word down to push it to later; let go and it springs back. Tap and the whole word sinks and returns.',
         verdict='<b>My pick for the app.</b> It is the product\'s one idea in a single letter, it reads at 20px, it is still for nine seconds in eleven, and the drag is the app\'s own gesture.',
         tire='The least likely to tire: the motion is one letter, and the word always comes back whole.', hint='Drag down, or tap'),
    dict(id='deal', tag='wm-deal', name='The hand', variant='lower',
         idea='The letters are cards held in one hand, like Keep. They fan a few degrees on a pivot far below the word and square up again. While moving, faint card faces show behind each letter.',
         idle='Every 10 s the hand fans open a touch and squares up.',
         working='The hand stays slightly open, card faces showing, and the cards riffle one after another.',
         done='The hand squares up with a tap on the table and a citrus card slides up behind it, like Keep\'s done state.',
         touch='Hover and the hand fans open; the card under your pointer lifts. Tap and the word is dealt again from the L.',
         verdict='<b>The best partner for the mascot:</b> the wordmark and Keep become one family. Strongest in the lockup and on first launch, where the deal plays once.',
         tire='The card faces in the working state read as tiles at header size; keep them for large sizes.', hint='Hover, or tap'),
    dict(id='clock', tag='wm-clock', name='The t keeps time', variant='lower',
         idea='The cross-bar of the t is a hand on a pivot at the stem. At rest it points forward, to three o\'clock: later. The other letters carry a knockout edge so the hand can pass behind them.',
         idle='Every 12 s the hand moves on one minute with a small mechanical tick, then eases home.',
         working='The hand sweeps round, passing behind the a.',
         done='One quick turn over a citrus face, landing home with one overshoot.',
         touch='Hover and the hand points at you; leave and it returns to three o\'clock.',
         verdict='<b>The cleverest idea and the weakest logo:</b> the word only reads while the hand is level, so it works as a one-off and as a loading state, not as a mark.',
         tire='A sweeping hand in a header reads as a spinner within minutes.', hint='Hover to point the hand'),
]

KEEP = ('<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">'
        '<g stroke="var(--k-hole)" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke">'
        '<rect x="12" y="6" width="24" height="33" rx="3.5" fill="var(--k3)" transform="rotate(11 24 39)"/>'
        '<rect x="12" y="6" width="24" height="33" rx="3.5" fill="var(--k2)" transform="rotate(-11 24 39)"/>'
        '<path d="M15.5 6H28L36 14V35.5A3.5 3.5 0 0 1 32.5 39H15.5A3.5 3.5 0 0 1 12 35.5V9.5A3.5 3.5 0 0 1 15.5 6Z" fill="var(--k1)"/>'
        '<g transform="translate(32 10) rotate(45)"><path d="M-5.66 0H5.66L0 5.66Z" fill="var(--k2)"/></g></g>'
        '<rect x="16.6" y="16" width="4" height="8.5" rx="2" fill="var(--k-hole)"/><rect x="23.8" y="16" width="4" height="8.5" rx="2" fill="var(--k-hole)"/></svg>')

def seg(states=('idle', 'working', 'done')):
    names = dict(idle='Idle', working='Working', done='Done')
    return '<div class="seg" role="group" aria-label="State">' + ''.join(
        f'<button type="button" data-st="{s}" aria-pressed="{str(s == "idle").lower()}">{names[s]}</button>' for s in states) + '</div>'

def concept_html(i, c):
    t, v = c['tag'], c['variant']
    pick = '<span class="pick">Recommended</span>' if c.get('pick') else ''
    shadow = '<span class="shadow"></span>' if t == 'wm-ball' else ''
    return f'''
<article class="concept" id="c-{c['id']}" data-tag="{t}">
  <div class="notes">
    <h3>{html.escape(c['name'])}{pick}</h3>
    <p>{html.escape(c['idea'])}</p>
    <dl><dt>Idle</dt><dd>{html.escape(c['idle'])}</dd><dt>Working</dt><dd>{html.escape(c['working'])}</dd>
    <dt>Done</dt><dd>{html.escape(c['done'])}</dd><dt>Touch</dt><dd>{html.escape(c['touch'])}</dd></dl>
    <p class="verdict">{c['verdict']} {html.escape(c['tire'])}</p>
  </div>
  <div class="show">
    <div class="stage">{shadow}<{t} variant="{v}" aria-label="Later"></{t}><span class="hint">{c['hint']}</span></div>
    <div class="bar">{seg()}<button type="button" class="replay">Replay</button></div>
    <div class="uses">
      <figure style="margin:0;display:grid;gap:6px;min-width:0"><div class="apphead"><span class="wmh"><{t} variant="{'lower' if t != 'wm-ball' else 'upper'}" aria-label="Later"></{t}></span><span class="right"><span class="avatar">SR</span></span></div><figcaption class="cap">In the app header, 20px tall</figcaption></figure>
      <figure style="margin:0;display:grid;gap:6px;min-width:0"><div class="lockup"><span class="icon">{KEEP}</span><span class="wml"><{t} variant="{v if t != 'wm-ball' else 'upper'}" aria-label="Later"></{t}></span></div><figcaption class="cap">Lockup with Keep, the app icon</figcaption></figure>
    </div>
  </div>
</article>'''

def mock(pal, wm='wm-horizon', fig_value='41%'):
    return f'''<div class="mock" data-pal="{pal}">
  <div class="bandwrap">
    <div class="mh"><span class="w"><{wm} variant="lower" still data-fixed aria-label="Later"></{wm}></span><span class="av">SR</span></div>
    <div class="d today">Today</div>
    <p class="need"><b>4 need you.</b> 2 on the way, then 6 short reads.</p>
    <div class="now"><span class="d">Now</span><span>needs you</span></div>
    <div class="card">
      <div class="src"><i></i><div><b>House move</b><small>Needs a reply, from Scout</small></div></div>
      <div class="d hl">Can Dave see the loft on Tuesday at 10?</div>
      <div class="draft">Hi Dave, Tuesday at 10 works. The hatch is in the back bedroom and I&rsquo;ll leave the ladder out. Thanks, Sam</div>
      <div class="to">To <b>Dave Ellis, Ellis Surveying</b></div>
      <div class="btns"><span class="btn p">Review and send</span><span class="btn">Tomorrow</span></div>
    </div>
  </div>
  <div class="sect"><span class="d">Next</span><span>the crew have these</span></div>
  <div class="row"><span class="cr"></span><span class="tx"><b>Chasing 3 replies</b><small>Japan in April, Scout</small></span><span class="bk">back by 12:00</span></div>
  <div class="ed"><span class="via">Heat Pump Weekly &middot; you follow heat pumps</span><span class="d fig">{fig_value}</span><span class="d eh">More installs this March than last, and most were in older homes</span><span class="via">4 min read &middot; built 07:10</span></div>
  <div class="dock"><span class="d">Later</span><span><b>4 resting</b><small>Next back Monday 08:30</small></span></div>
</div>'''

def tok(rows):
    return '<div class="tokens">' + ''.join(f'<span><i style="background:{v}"></i>{k}</span><span>{v}</span>' for k, v in rows) + '</div>'

def build():
    glyphs = rd('wordmark.json')
    font64 = base64.b64encode(open(os.path.join(B, 'LaterDisplay.woff2'), 'rb').read()).decode()
    js = ''.join(rd('src/' + f) for f in ['wm-core.js', 'wm-ball.js', 'wm-late.js', 'wm-horizon.js', 'wm-deal.js', 'wm-clock.js'])
    sizes = {f: os.path.getsize(os.path.join(B, 'src', f)) for f in os.listdir(os.path.join(B, 'src')) if f.startswith('wm-')}
    pairs_json = json.dumps([{k: v for k, v in p.items()} for p in PAIRS])
    concepts = ''.join(concept_html(i, c) for i, c in enumerate(CONCEPTS))
    pair_buttons = ''.join(f'<button type="button" data-id="{p["id"]}" aria-pressed="false">{p["id"]}. {html.escape(p["display"])}{" + " + html.escape(p["text"]) if p["text"] != p["display"] else ""}</button>' for p in PAIRS)
    pair_cards = ''.join(f'''<article data-id="{p['id']}" tabindex="0" class="{'rec' if p['id'] == REC_PAIR else ''}"><span class="nm" style="font-family:{html.escape(p['display_stack'])};font-weight:{p['display_weight']}">{p['id']}. {html.escape(p['display'])}</span><span class="small">{html.escape(p['label'])}{' &middot; recommended' if p['id'] == REC_PAIR else ''}</span><p><b>Character.</b> {html.escape(p['character'])}</p><p><b>Weakness.</b> {html.escape(p['weakness'])}</p></article>''' for p in PAIRS)
    page = f'''<title>Later: wordmark and type</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{html.escape(GF)}">
<style>
@font-face {{ font-family: 'Later Display'; src: url(data:font/woff2;base64,{font64}) format('woff2'); font-weight: 700; font-display: swap; }}
{rd('src/page.css')}
wm-ball, wm-late, wm-horizon, wm-deal, wm-clock {{ display: inline-block; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }}
</style>
<div class="wrap">
<header class="top">
  <nav aria-label="Sections"><a href="#wordmark">Wordmark</a><a href="#type">Type</a><a href="#light">Harbour light</a></nav>
  <div class="controls">
    <div class="seg" id="theme" role="group" aria-label="Theme"><button type="button" data-v="system">System</button><button type="button" data-v="light">Light</button><button type="button" data-v="dark">Dark</button></div>
    <div class="seg" id="motion" role="group" aria-label="Motion"><button type="button" data-v="on" aria-pressed="true">Motion</button><button type="button" data-v="still" aria-pressed="false">Still</button></div>
  </div>
</header>
<p class="small" id="motion-note" hidden>Your system asks for reduced motion, so every wordmark shows its still frame.</p>

<section class="hero concept" data-tag="wm-horizon" style="border-top:0">
  <div>
    <h1>Later, drawn and moving</h1>
    <p class="lede">Five animated wordmarks drawn from our own letterforms, a small display face, a type study in the app&rsquo;s real strings, and two ways to make Harbour light as strong as Harbour dark.</p>
    <p class="lede">The recommendation is the word on a horizon: the r sinks to later and comes back on time. The engraved ball is for brand moments.</p>
  </div>
  <div class="show">
    <div class="stage"><wm-horizon variant="lower" aria-label="Later"></wm-horizon><span class="hint">Drag the word down</span></div>
    <div class="bar">{seg()}<button type="button" class="replay">Replay</button></div>
  </div>
</section>

<section class="block" id="wordmark">
  <div class="sec-head"><h2>Wordmark</h2>
  <p class="lede">Each one is a custom element of SVG or canvas and plain script, with an idle loop that is still most of the time, a working state, a done moment and a touch. Each is shown large, at 20px in the app header and beside Keep. Clay never appears in the wordmark; citrus appears only for done.</p></div>
  {concepts}
  <div class="recommend">
    <div class="panel"><h3>Pick: Below the line</h3>
      <p>It is the only one that says what the product does, things sink to Later and come back when promised, and it says it with one letter, so the word is whole and legible nearly all the time. At 20px the sinking r still reads. The drag is the gesture the app already uses for snoozing, so the logo teaches the product. Use the ball for the splash, onboarding and the website, where one slow turn is an event.</p></div>
    <div class="panel"><h3>What would get tiresome</h3>
      <ul><li>The t keeps time: a sweeping hand in a header reads as a spinner within minutes, and the word only reads while the hand is level.</li>
      <li>The ball, working: a spinning ball in the header is the spinning-globe logo we wanted to avoid. Keep its working state for large sizes.</li>
      <li>Late arrival: the r&rsquo;s wobble is funny once a session and irritating every time a screen opens.</li>
      <li>The hand, working: card faces behind each letter turn into tiles at small sizes.</li></ul></div>
  </div>
</section>

<section class="block" id="letters">
  <div class="sec-head"><h2>The letterforms</h2>
  <p class="lede">The five letters are our own outlines, not a font set in text. They are drawn from centre lines with an oval pen, wider than it is tall, so stems come out heavier than bars. Every curve is a superellipse with exponent 2.75, the same squared-round corner as the app&rsquo;s cards and Keep. The t&rsquo;s bar points only forward, to the right, which is where later is on the line.</p></div>
  <div class="letters">
    <div class="construct" id="construct"></div>
    <div class="panel"><h3>Choices</h3><ul>
      <li>Squared rounds: the counters of a and e are card shapes, so the word and the deck are one material.</li>
      <li>Forward-only t bar: the one asymmetry, and the clock hand in concept five.</li>
      <li>Spacing by equal nearest distance between letters, measured on the outlines.</li>
      <li>Lower case &ldquo;Later&rdquo; for the app; capitals &ldquo;LATER&rdquo; only on the ball, where wide, even letters wrap better around a sphere.</li>
      <li>One heavier cut for the wordmark (bars 106, stems 127 units on a 690 cap) than for the display face (88 and 110).</li></ul></div>
  </div>
</section>

<section class="block" id="type">
  <div class="sec-head"><h2>Type</h2>
  <p class="lede">A full text typeface cannot be drawn well in one session, so the work is in three parts: the wordmark letters above, one small headline face as a test, and a study of real pairings from Google Fonts.</p></div>
  <div class="tooling">
    <div class="panel"><h3>Skills</h3><p>A search for font, typeface, type design, glyph and lettering skills found none. Only general design skills are installed.</p></div>
    <div class="panel"><h3>Tools here</h3><p>fontTools 4.68 is installed: it compiles TrueType, adds kerning from feature files, subsets, instances variable fonts and writes WOFF2 once brotli is added. shapely (outline geometry) and brotli install from PyPI; opentype.js is on npm. There is no FontForge or glyph editor, and Google Fonts sources are reachable for OFL work.</p></div>
    <div class="panel"><h3>What is feasible</h3><p>A display face drawn from code: yes, built below. Modifying an OFL face with fontTools (swap glyphs, rename, keep the licence): yes, not needed this time. A professional text face with hinting, many weights and full kerning: no, that is months of a type designer&rsquo;s work.</p></div>
  </div>
  <div class="specimen" style="margin-top:20px">
    <h3>Later Display, draft 0.1</h3>
    <div class="big">Can Dave see the loft on Tuesday at 10?</div>
    <div class="mid">abcdefghijklmnopqrstuvwxyz<br>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>0123456789 &pound;1,240 $86 &euro;30 41% . , : ; ? ! &rsquo; ( ) &ndash;</div>
    <p class="small">82 glyphs, one bold weight, 8 KB as WOFF2, own outlines, SIL Open Font License 1.1, built by <code>tools/build_font.py</code>.</p>
    <p><b>Honest verdict: not ready to ship as the headline face.</b> It holds up for a few large words (Today, Now, Later, a big numeral) and it is the source of the wordmark. It falls short in longer headlines: outlines are fine polygons rather than curves, joins where arches meet stems are dark, there are a dozen kerning pairs, the s, 2 and 5 are the weakest shapes, and there are no optical corrections. If the squared-round idea wins, it is a good brief for a commissioned face or a customised OFL grotesk.</p>
  </div>

  <div id="pairing" style="margin-top:44px;display:grid;gap:14px">
    <h3>Pairings in the app&rsquo;s strings</h3>
    <div class="pairs" role="group" aria-label="Pairing" data-default="{REC_PAIR}">{pair_buttons}</div>
    <div class="pairnote"><b id="pair-name"></b><p class="small"><span id="pair-char"></span></p><p class="small"><span id="pair-weak"></span></p></div>
    <div class="duo"><figure>{mock('dark')}<figcaption class="cap">Harbour dark</figcaption></figure><figure>{mock('light')}<figcaption class="cap">Harbour light, as it is now</figcaption></figure></div>
  </div>
  <div class="pairlist">{pair_cards}</div>
  <div class="panel" style="margin-top:20px"><h3>Recommendation: B, Familjen Grotesk with Hanken Grotesk</h3>
    <p>Familjen has the dry, slightly old-fashioned grotesk shapes that suit an unhurried voice, it is narrow enough for two-line decide headlines at 22px, and it sits well beside Literata in the edition without being a second serif. Hanken is quiet and very readable at 13 to 15px. Runner-up: I, Funnel, if one family matters more than character. Keep Later Display for the wordmark and perhaps the single word Today.</p></div>
</section>

<section class="block" id="light">
  <div class="sec-head"><h2>Harbour light</h2>
  <p class="lede">Why dark is stronger. The surface steps are nearly the same in both themes (page to card is 1.24:1 in light and 1.21:1 in dark), so contrast numbers are not the problem. Three things are.</p></div>
  <div class="diag">
    <div class="panel"><h3>Depth</h3><p>In dark, raised things are lighter, which the eye reads as nearer at once. In light, a white card on beige is a hue change plus a soft 16% shadow, so the deck looks printed on the page rather than lifted off it.</p></div>
    <div class="panel"><h3>Clay on beige</h3><p>Clay on navy is orange on blue, complementary and bright (7.4:1 for the heading). Clay on beige is warm on warm, so the needs-you colour goes brown and the Now heading loses its pull.</p></div>
    <div class="panel"><h3>Tinted tiles</h3><p>The draft and the Tomorrow button are beige tiles inside a white card (1.19:1). In dark the same tile reads as a recess; in light it reads as a stain. The screen ends up with only two dark anchors, the main button and the dock.</p></div>
  </div>
  <div class="quad">
    <figure>{mock('light')}<figcaption><b>Now</b><span class="small">Beige page, white cards, beige tiles.</span></figcaption></figure>
    <figure>{mock('chalk')}<figcaption><b>Fix 1: Chalk</b><span class="small">Cool navy-grey ground so clay is complementary again; white cards with a hairline edge and a tighter shadow; cool tiles; clay one step deeper.</span>
      {tok([('--page', '#e7eaef'), ('--paper', '#f4f5f7'), ('--card', '#ffffff'), ('--card-2', '#edf0f4'), ('--ink', '#141c30'), ('--ink-3', '#596075'), ('--line', 'rgba(20,28,48,.13)'), ('--a clay', '#9a4226'), ('--b navy', '#1f2a44'), ('--pop citrus', '#d6e46a')])}</figcaption></figure>
    <figure>{mock('wall')}<figcaption><b>Fix 2: Harbour wall</b><span class="small">Keeps the warm paper but borrows dark&rsquo;s depth: the top of Today, with the deck, sits on a navy band and the white card rises off it. Tiles become hairline outlines.</span>
      {tok([('--page', '#efebe4'), ('--paper', '#f7f4ef'), ('--band', '#1f2a44'), ('--on-band', '#f3f0e9'), ('--a on band', '#e8a07f'), ('--card', '#ffffff'), ('--card-2', 'transparent, 1.5px line'), ('--ink', '#19213a'), ('--a clay', '#a24b2d'), ('--pop citrus', '#d6e46a')])}</figcaption></figure>
    <figure>{mock('dark')}<figcaption><b>Harbour dark</b><span class="small">For comparison, unchanged.</span></figcaption></figure>
  </div>
  <div class="panel" style="margin-top:22px"><h3>Which</h3><p>Chalk is the safer change: only tokens move and every screen improves. Harbour wall is the stronger idea, because light and dark then share the same navy top, so the brand looks the same in both; it needs layout work on screens without a deck. Both keep the three colour jobs: clay for needs you, navy for the crew and Later, citrus for done or back.</p></div>
</section>
<footer>Design exploration for Later. Example data throughout. Sources: <code>design/brand/src</code>, <code>design/brand/tools</code>. Wordmark component sizes: {', '.join(f'{k} {v/1024:.1f} KB' for k, v in sorted(sizes.items()))}.</footer>
</div>
<script type="application/json" id="pairings">{pairs_json}</script>
<script>window.LATER_GLYPHS = {glyphs};</script>
<script>{js}</script>
<script>{construct_js()}</script>
<script>{rd('src/page.js')}</script>
'''
    open(os.path.join(B, 'index.html'), 'w', encoding='utf-8').write(page)
    opts = [{'id': p['id'], 'label': p['label'], 'display': p['display'], 'text': p['text'], 'displayWeight': p['display_weight'],
             'googleFontsUrl': p['url'], **({'woff2': 'design/brand/' + p['woff2'], 'fontFace': {'family': 'Later Display', 'weight': 700}} if p.get('woff2') else {}),
             'recommended': p['id'] == REC_PAIR} for p in PAIRS]
    json.dump({'note': 'Display and text pairings for a font switcher. G uses a local WOFF2; its text face loads from Google Fonts.', 'pairings': opts},
              open(os.path.join(B, 'type-options.json'), 'w'), indent=2)
    print('index.html', os.path.getsize(os.path.join(B, 'index.html')), sizes)

def construct_js():
    # the construction drawing: the five letters with the superellipse counters and the pen marked
    return r'''(function(){var S=LATER_GLYPHS.lower,NS='http://www.w3.org/2000/svg',W=S.width,H=S.height,X0=-470;
var svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',X0+' -190 '+(W-X0+60)+' '+(H+300));svg.setAttribute('role','img');svg.setAttribute('aria-label','Construction of the wordmark letters: cap height 690, x-height 500, the t bar pivot and the oval pen');
var g='',T='font-family="var(--f-text)" fill="currentColor"';[[0,'cap 690'],[190,'x-height 500'],[690,'baseline']].forEach(function(r,i){g+='<line x1="'+(X0+10)+'" x2="'+(W+40)+'" y1="'+r[0]+'" y2="'+r[0]+'" stroke="currentColor" stroke-opacity="'+(i==2?.5:.25)+'" stroke-width="3" stroke-dasharray="'+(i==2?'none':'10 10')+'"/><text x="'+(X0+10)+'" y="'+(r[0]-16)+'" font-size="40" fill-opacity=".65" '+T+'>'+r[1]+'</text>';});
S.letters.forEach(function(L){g+='<path transform="translate('+L.x+' 0)" d="'+L.d+'" fill="currentColor" fill-opacity=".9"/>';});
var t=S.letters[2],px=t.x+t.pivot[0],py=t.pivot[1];g+='<line x1="'+px+'" y1="'+py+'" x2="'+px+'" y2="-70" stroke="currentColor" stroke-width="3" stroke-opacity=".5"/><circle cx="'+px+'" cy="'+py+'" r="18" fill="var(--citrus)" stroke="var(--surface)" stroke-width="6"/><text x="'+(px+14)+'" y="-90" font-size="40" '+T+'>pivot of the forward bar</text>';
g+='<ellipse cx="'+(W-60)+'" cy="-120" rx="'+(53*1.2)+'" ry="53" fill="none" stroke="currentColor" stroke-width="5"/><text x="'+(W-150)+'" y="-120" text-anchor="end" dominant-baseline="middle" font-size="40" '+T+'>the oval pen</text>';
svg.innerHTML=g;document.getElementById('construct').appendChild(svg);})();'''

if __name__ == '__main__':
    build()
