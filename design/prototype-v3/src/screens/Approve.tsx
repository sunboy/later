import { AGENTS, PAYMENTS, gbp, space } from '../data';
import { Icon } from '../icons';
import { HoldButton } from '../Hold';
import { useApp } from '../store';

/** The one approval moment. Rendered from the exact tool-call arguments, never a summary. */
export function ApprovalBody({ id, compact = false }: { id: string; compact?: boolean }) {
  const { approve, paid } = useApp();
  const p = PAYMENTS[id];
  const done = paid.includes(id);
  const agent = AGENTS[p.agent];
  const rows: [string, string][] = p.kind === 'pay'
    ? [['To', p.to], ['Account', p.account], ['Amount', gbp(p.amount)], ['Reference', p.reference], ['From', p.from], ['When', p.when]]
    : [['To', p.to], ['From', p.from], ['Subject', p.account.replace('Subject: ', '')], ['When', p.when]];
  return (
    <>
      {!compact && (
        <div className="ap-head">
          <span className="glyph"><Icon name={space(p.spaceId).glyph} size={17} /></span>
          <div className="who"><b>{space(p.spaceId).name}</b><small>{agent.name} asks, {p.source}</small></div>
        </div>
      )}
      <h2 className="ap-title">{p.title}</h2>
      {p.kind === 'pay'
        ? <p className="ap-amount" aria-label={`Amount ${gbp(p.amount)}`}>{gbp(p.amount)}</p>
        : <p className="ap-amount send">318 people</p>}
      <div className="ap-card bezel"><dl className="well" style={{ margin: 0 }}>
        {rows.map(([k, v]) => <div key={k} className="ap-row"><dt>{k}</dt><dd className={k === 'Reference' ? 'code' : k === 'Amount' ? 'num' : ''}>{v}</dd></div>)}
      </dl></div>
      <p className="ap-bind">This approval covers this one {p.kind === 'pay' ? 'payment' : 'send'} with exactly these details, and nothing else. Check <span className="code">{p.hash}</span></p>
      <HoldButton label={p.hold} done={done} onDone={() => approve(id)} />
      {done && (
        <div className="ap-done" role="status">
          <b><Icon name="check" size={18} />{p.kind === 'pay' ? 'Paid.' : 'Scheduled.'}</b>
          <p>{p.doneLine}</p>
        </div>
      )}
    </>
  );
}

export function Approve() {
  const { approval, go, paid } = useApp();
  const id = approval?.id ?? 'deposit';
  const back = approval?.back ?? 'spaces';
  return (
    <div className="screen">
      <div className="scroll no-dock">
        <div className="topbar">
          <button className="btn quiet sm" onClick={() => go(back)}><Icon name="close" size={16} />{paid.includes(id) ? 'Close' : 'Not now'}</button>
          <span className="fine">Needs you</span>
        </div>
        <ApprovalBody id={id} />
      </div>
    </div>
  );
}
