/* Fixed forms. A view can place these but never style or word them: no hints are read, every label is written here,
   the recipient is always shown in full, and the approval binds to the hash of the exact arguments. */
import { useEffect, useRef, useState } from 'react';
import type { ConsentData, PayData } from '../spec/types';
import { reducedMotion } from '../motion';
import { Icon } from '../icons';
import { money } from '../format';

function HoldButton({ label, ms = 1500, onDone, done }: { label: string; ms?: number; onDone: () => void; done: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const st = useRef<{ raf: number; p: number } | null>(null);
  const [hint, setHint] = useState('Press and hold. Letting go cancels.');
  const paint = (p: number) => ref.current?.style.setProperty('--p', String(p));
  const start = () => {
    if (done || st.current) return;
    setHint('Keep holding');
    const t0 = performance.now();
    const s = { raf: 0, p: 0 }; st.current = s;
    const step = (t: number) => {
      const lin = Math.min(1, (t - t0) / ms);
      s.p = lin < 0.5 ? 2 * lin * lin : 1 - Math.pow(-2 * lin + 2, 2) / 2;
      paint(s.p);
      if (lin >= 1) { st.current = null; setHint(''); onDone(); return; }
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };
  const stop = () => {
    const s = st.current; if (!s) return;
    cancelAnimationFrame(s.raf); st.current = null;
    setHint('Let go early, so nothing was sent. Hold until the bar fills.');
    if (reducedMotion()) { paint(0); return; }
    const from = s.p, t0 = performance.now();
    const drain = (t: number) => { const k = Math.min(1, (t - t0) / 300); paint(from * Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(drain); };
    requestAnimationFrame(drain);
  };
  useEffect(() => () => { if (st.current) cancelAnimationFrame(st.current.raf); }, []);
  useEffect(() => { paint(done ? 1 : 0); }, [done]);
  return (
    <div className="hold-wrap">
      <button ref={ref} className={`hold ${done ? 'done' : ''}`} aria-disabled={done}
        onPointerDown={e => { if (e.button === 0) { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); start(); } }}
        onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
        onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
        onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') stop(); }}
        onClick={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
        <span className="fill" aria-hidden="true" />
        <span className="lbl">{done ? <><Icon name="check" size={18} />Sent</> : label}</span>
      </button>
      <p className="hold-hint" aria-live="polite">{done ? 'Sent in this prototype only. Nothing left your browser.' : hint}</p>
    </div>
  );
}

const first = (name: string) => name.split(/[ ,]/)[0];

export function Consent({ d }: { d: ConsentData }) {
  const [done, setDone] = useState(false);
  useEffect(() => setDone(false), [d.argsHash]);
  const check = d.argsHash.slice(0, 12).replace(/(.{4})/g, '$1 ').trim();
  return (
    <div className="fixed consent">
      <div className="fx-head"><Icon name="lock" size={16} /><span>Send this email</span></div>
      <dl className="fx-rows">
        <div><dt>To</dt><dd>{d.to.name}</dd></div>
        <div><dt>Address</dt><dd>{d.to.address}</dd></div>
        <div><dt>Subject</dt><dd>{d.subject}</dd></div>
        <div><dt>Message</dt><dd className="msg">{d.body}</dd></div>
      </dl>
      <p className="fx-bind">This approval covers this one send, with exactly these words and this recipient. Check <span className="code">{check}</span></p>
      <HoldButton label={`Hold to send to ${first(d.to.name)}`} onDone={() => setDone(true)} done={done} />
    </div>
  );
}

export function Pay({ d }: { d: PayData }) {
  const [opened, setOpened] = useState(false);
  useEffect(() => setOpened(false), [d.reference, d.amount.minor]);
  return (
    <div className="fixed pay">
      <div className="fx-head"><Icon name="bank" size={16} /><span>Ready to pay</span><em>{d.due}</em></div>
      <p className="fx-amount">{money(d.amount)}</p>
      <dl className="fx-rows">
        <div><dt>Payee</dt><dd>{d.payee}</dd></div>
        <div><dt>Account</dt><dd>{d.account}</dd></div>
        <div><dt>Reference</dt><dd className="code">{d.reference}</dd></div>
      </dl>
      {opened
        ? <p className="fx-done"><Icon name="check" size={16} />In the product this opens {d.opens} with these details filled in. Nothing opened here.</p>
        : <button className="btn primary block" onClick={() => setOpened(true)}>Open {d.opens}<Icon name="arrow" size={18} /></button>}
      <p className="fx-bind">Later never moves money. You pay in your bank; Later checks the payment landed.</p>
    </div>
  );
}
