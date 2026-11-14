/* Keep: a fanned hand of real 3D cards.
   Each card is a front sheet, two core sheets and a back sheet stacked through its thickness, so it has a solid edge
   from any angle and the dog-ear and rounded corners stay true. The top card carries the face: two eye slots, and a
   corner that folds on a hinge along the diagonal. Every frame the pose is applied as transforms, and each card's
   shading is worked out from where its face points relative to the light, so the cards darken and catch a sheen as
   they turn. A soft contact shadow lies on the ground below and spreads as Keep leaves it. */
import { el } from './world.js';

const TH = 7;            // card thickness in card px (cards are 120 x 165)
const CORE = [-.33, .33].map(f => f * TH);
const D2R = Math.PI / 180;
const LIGHT = norm([-.45, -.55, .7]);   // from upper left, in front
function norm(v) { const l = Math.hypot(...v); return v.map(x => x / l); }

function cardEl(kind, color, opts = {}) {
  const c = el('div', 'k-card p3 ' + kind);
  c.style.setProperty('--c', color);
  for (const z of CORE) c.appendChild(el('div', 'pl core', `transform:translateZ(${z}px)`));
  const back = el('div', 'pl back', `transform:rotateY(180deg) translateZ(${TH / 2}px)`);
  back.appendChild(el('div', 'dim'));
  const front = el('div', 'pl front', `transform:translateZ(${TH / 2}px)`);
  front.appendChild(el('div', 'grain'));
  if (opts.front) front.insertAdjacentHTML('beforeend', opts.front);
  front.appendChild(el('div', 'dim'));
  front.appendChild(el('div', 'sheen'));
  c.append(back, front);
  return c;
}

export function makeKeep(parent) {
  const root = el('div', 'k-root p3');
  const shadow = el('div', 'k-shadow');
  const body = el('div', 'p3', 'position:absolute;left:0;top:0');
  root.append(shadow, body);
  parent.appendChild(root);

  const cards = [];
  // top card: the face
  const top = cardEl('kt', 'var(--k-body)', {
    front: `<div class="eyes"><div class="eye l"></div><div class="eye r"></div></div>
      <svg class="smile" viewBox="0 0 120 165"><path d="M21 78q11-20 22 0M57 78q11-20 22 0"/></svg>
      <div class="lines"><i></i><i></i></div>`,
  });
  // the dog-ear: a triangle hinged on the diagonal, front and back sheets
  const flap = el('div', 'flap p3', `transform:translateZ(${TH / 2 + .6}px) rotate3d(1,1,0,180deg)`);
  flap.innerHTML = '<i class="ff"></i><i class="fb"></i>';
  top.appendChild(flap);
  cards.push({ el: top, kind: 'top' });
  cards.push({ el: cardEl('', 'var(--k-2)'), kind: 'u' });
  cards.push({ el: cardEl('', 'var(--k-3)'), kind: 'u' });
  // back to front order in the DOM does not matter in 3D, but keep it tidy
  for (let i = cards.length - 1; i >= 0; i--) body.appendChild(cards[i].el);

  const eyes = top.querySelectorAll('.eye');
  const K = {
    root, body, shadow, cards, top, flap, eyes,
    // pose (targets are springs owned by main.js)
    s: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: .3, hop: 0, squash: 1, fan: 1, square: 0, flap: 180, ex: 0, ey: 0, blink: 0, depth: 0, lean: 0 },
    camYaw: 0,
    addCard(cardNode) {
      cards.push({ el: cardNode, kind: 'letter', born: performance.now() });
      body.appendChild(cardNode);
    },
    setHappy(on) { top.classList.toggle('happy', on); },
    setWorking(on) { top.querySelector('.lines').style.opacity = on ? 1 : 0; },
    apply() { apply(K); },
  };
  return K;
}

export function letterCard(title) {
  return cardEl('letter', 'var(--letter)', {
    front: `<div class="ltxt">${title}</div><i class="lrule" style="top:96px"></i><i class="lrule" style="top:108px;right:40px"></i><i class="lrule" style="top:120px;right:60px"></i><i class="stamp"></i>`,
  });
}

/* apply a pose to the DOM; cheap: transforms and opacity only */
function apply(K) {
  const s = K.s, n = K.cards.length;
  const stretch = s.squash;
  K.root.style.transform = `translate3d(${s.x}px,${s.y}px,${s.z}px)`;
  K.body.style.transform = `translateY(${-s.hop}px) rotateY(${s.yaw}deg) rotateX(${s.pitch}deg) rotateZ(${s.roll + s.lean}deg) scale3d(${s.scale / Math.sqrt(stretch)},${s.scale * stretch},${s.scale})`;
  // contact shadow lies on the ground plane; it fades and spreads as Keep lifts
  const lift = Math.max(0, s.hop);
  const sh = s.scale * (1 + lift / 120);
  K.shadow.style.transform = `rotateX(90deg) scale(${sh * (1 + (n - 3) * .06)},${sh})`;
  K.shadow.style.opacity = Math.max(.15, 1 - lift / 90).toFixed(3);

  const fan = s.fan * (1 - s.square), sq = s.square;
  for (let i = 0; i < n; i++) {
    const c = K.cards[i];
    let a = 0, dx = 0, dy = 0, dz = 0, ry = 0;
    if (i === 0) {
      a = 0; dz = 0;
    } else {
      const side = i % 2 === 1 ? -1 : 1, tier = Math.ceil(i / 2);
      a = side * (10.5 * tier + (tier > 1 ? 3 : 0)) * fan;
      dz = -i * (TH + 1.5) - fan * i * 7 * (1 + s.depth);
      ry = side * fan * 9 * (1 + s.depth);
      dx = sq * i * 10 + side * fan * s.depth * 6;
      dy = sq * i * 10 - fan * s.depth * 4;
    }
    if (c.offset) { dx += c.offset.x; dy += c.offset.y; dz += c.offset.z; a += c.offset.a || 0; }
    c.el.style.transform = `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,${dz.toFixed(2)}px) rotateZ(${a.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    // shading: the face normal after yaw and pitch, against the light
    const yaw = (s.yaw + ry + K.camYaw) * D2R, pit = s.pitch * D2R;
    const nx = Math.sin(yaw) * Math.cos(pit), ny = Math.sin(pit), nz = Math.cos(yaw) * Math.cos(pit);
    const dotF = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
    const lf = Math.max(0, dotF), lb = Math.max(0, -dotF);
    const dims = c.el.querySelectorAll('.dim');
    // back dim first (DOM order: back, front)
    const deeper = i * .07;
    dims[0].style.opacity = (.5 - lb * .5 + deeper).toFixed(3);
    dims[1].style.opacity = (.36 - lf * .5 + deeper).toFixed(3);
    const sheen = c.el.querySelector('.sheen');
    if (sheen) {
      const sweep = Math.sin(yaw);
      sheen.style.opacity = (Math.max(0, 1 - Math.abs(sweep) * 1.2) * Math.min(1, Math.abs(yaw) * 2.5) * .9 + lf * .12).toFixed(3);
      sheen.style.backgroundPosition = `${(50 + sweep * 120).toFixed(1)}% 0`;
    }
  }
  // the face: eyes follow, blink squashes them; the dog-ear lifts on its hinge
  const blink = 1 - .9 * s.blink;
  for (const e of K.eyes) e.style.transform = `translate(${s.ex.toFixed(2)}px,${s.ey.toFixed(2)}px) scaleY(${blink.toFixed(3)})`;
  K.flap.style.transform = `translateZ(${TH / 2 + .6}px) rotate3d(1,1,0,${s.flap.toFixed(2)}deg)`;
}
