import { useEffect, useRef, useState } from 'react';
import { AGENTS, BILLS, SENDS, gbp, space } from '../data';
import { Icon } from '../icons';
import { HoldButton } from '../Hold';
import { Crew } from '../Mascot';
import { WINDOW_MS, useApp, useClock, useFlash } from '../store';

/**
 * The one approval moment, for anything that sends. Rendered from the exact tool-call arguments, never a summary.
 * Fixed form: it never changes size, order or colour, whatever the hints say.
 */
export function ApprovalBody({ id, compact = false }: { id: string; compact?: boolean }) {
  const { holdSend, outbox } = useApp();
  const p = SENDS[id];
  const out = outbox.find(o => o.id === id);
  const done = !!out && out.status !== 'stopped';
  const agent = AGENTS[p.agent];
  const win = useRef<HTMLDivElement>(null);
  // after the hold, bring the window row into view so Stop is never off screen
  useEffect(() => { if (out?.status === 'pending') win.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [out?.status]);
  const rows: [string, string][] = [['To', p.to], ['Address', p.address], ['From', p.from], ...(p.subject ? [['Subject', p.subject] as [string, string]] : []), ['Goes', '30 seconds after you hold, unless you stop it']];
  return (
    <>
      {!compact && (
        <div className="ap-head">
          <span className="glyph"><Icon name={space(p.spaceId).glyph} size={17} /></span>
          <div className="who"><b>{space(p.spaceId).name}</b><small>{agent.name} asks, {p.source}</small></div>
        </div>
      )}
      <h2 className="ap-title">{p.title}</h2>
      <p className="ap-amount send">{p.short}</p>
      <div className="ap-card bezel"><dl className="well" style={{ margin: 0 }}>
        {rows.map(([k, v]) => <div key={k} className="ap-row"><dt>{k}</dt><dd>{v}</dd></div>)}
        <div className="ap-row ap-msg"><dt>Message</dt><dd>{p.body}</dd></div>
      </dl></div>
      <p className="ap-bind">This approval covers this one send with exactly these words and this recipient, and nothing else. Check <span className="code">{p.hash}</span></p>
      <HoldButton key={out?.status === 'stopped' ? 'again' : 'hold'} label={p.hold} done={done} onDone={() => holdSend(id)} />
      <div ref={win} style={{ scrollMarginBottom: 24 }}>{out && <OutboxRow id={id} inline />}</div>
    </>
  );
}

/** The window after a hold: a draining line and Stop, then it goes. Same row in Next and under the hold. */
export function OutboxRow({ id, inline = false }: { id: string; inline?: boolean }) {
  const app = useApp();
  const o = app.outbox.find(x => x.id === id);
  const s = SENDS[id];
  const pending = o?.status === 'pending';
  const now = useClock(pending, 200);
  const flash = useFlash('out-' + id);
  if (!o) return null;
  const left = Math.max(0, WINDOW_MS - (now - o.at));
  const secs = Math.ceil(left / 1000);
  const state = o.status === 'sent' ? 'done' : o.status === 'stopped' ? 'idle' : 'working';
  return (
    <div className={`nrow outrow ${o.status} ${flash ? 'flash' : ''} ${inline ? 'inline' : ''}`} data-flip={inline ? undefined : 'o-' + id} role="status" aria-live="polite">
      <span className="crew-slot"><Crew who={s.agent} size={38} state={state} /></span>
      <div className="n-main">
        <span className="n-name">{o.status === 'sent' ? s.sentLine : o.status === 'stopped' ? 'Stopped. Nothing was sent' : `Sending to ${s.short}`}</span>
        {pending
          ? <span className="drain" aria-hidden="true"><i style={{ transform: `scaleX(${left / WINDOW_MS})` }} /></span>
          : <span className="n-status">{o.status === 'sent' ? 'It has gone. The thread has the record.' : 'The card is back in Now.'}</span>}
        {pending && <span className="n-status">Goes in <span className="num">{secs}</span> second{secs === 1 ? '' : 's'}. You can still stop it.</span>}
      </div>
      {pending
        ? <button className="btn sm stop" onClick={() => app.stopSend(id)}>Stop</button>
        : <div className="n-when"><small>{o.status === 'sent' ? 'sent' : 'kept'}</small><strong>09:41</strong></div>}
    </div>
  );
}

/**
 * A bill, ready to pay. Later never pays: it shows payee, amount and reference exactly, opens your bank or the
 * payee's own page, and lets you mark it paid. Fixed form: hints never change it.
 */
export function PaySlip({ id, onMark }: { id: string; onMark?: () => void }) {
  const app = useApp();
  const b = BILLS[id];
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const paid = app.paid.includes(id);
  const copy = async () => { try { await navigator.clipboard.writeText(b.reference); } catch { /* the frame may block the clipboard */ } setCopied(true); };
  return (
    <div className="payslip" aria-label={`Ready to pay ${gbp(b.amount)} to ${b.payee}`}>
      <dl className="ps-rows">
        <div><dt>Pay</dt><dd>{b.payee}</dd></div>
        <div className="ps-amt"><dt>Amount</dt><dd className="num">{gbp(b.amount)}</dd></div>
        <div><dt>Reference</dt><dd><span className="code">{b.reference}</span><button className="ps-copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></dd></div>
        <div><dt>Account</dt><dd className="num">{b.account}</dd></div>
        <div><dt>Due</dt><dd>{b.due}</dd></div>
      </dl>
      {paid ? (
        <p className="ps-done" role="status"><Icon name="check" size={16} />{b.paidLine}</p>
      ) : (
        <>
          {opened && <p className="ps-note" role="status">In the app this opens {b.opens} with the reference copied. Nothing is paid from Later.</p>}
          <div className="ps-acts">
            <button className="btn primary" onClick={() => { setOpened(true); copy(); }}><Icon name="forward" size={16} />Open {b.opens}</button>
            <button className="btn" onClick={() => (onMark ? onMark() : app.markPaid(id))}>Mark as paid</button>
          </div>
        </>
      )}
    </div>
  );
}

export function Approve() {
  const { approval, go, outbox } = useApp();
  const id = approval?.id ?? 'dave';
  const back = approval?.back ?? 'today';
  const sent = outbox.some(o => o.id === id && o.status !== 'stopped');
  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="topbar">
          <button className="btn quiet sm" onClick={() => go(back)}><Icon name={sent ? 'back' : 'close'} size={16} />{sent ? 'Back to Today' : 'Not now'}</button>
          <span className="fine">Needs you</span>
        </div>
        <ApprovalBody id={id} />
      </div>
    </div>
  );
}
