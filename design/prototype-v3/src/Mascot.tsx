import './mascot.css';
import type { AgentId } from './data';

/** The Deck: Later's mascot family. The chief (Keep) is a stack of cards; each crew member is one card dealt from it.
    Plain vector parts; every state is a class. See design/mascots/concepts.html for the full sheet. */
export type MState = 'idle' | 'listening' | 'thinking' | 'working' | 'waiting' | 'done' | 'rest' | 'error';

const HORIZON = <><path className="horizon" d="M0 39Q24 35 48 39V48H0Z" /><path className="hz" d="M1 39Q24 35 47 39" /></>;

export function Chief({ state = 'idle', size = 48 }: { state?: MState; size?: number }) {
  return (
    <svg className={`m deck st-${state}`} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <g className="all">
        <rect className="c3" x="13" y="19" width="22" height="24" rx="7" />
        <rect className="c2 under" x="10.5" y="14" width="27" height="25" rx="7.5" />
        <rect className="tabA" x="12" y="5" width="24" height="18" rx="6.5" />
        <g className="top">
          <path className="body" d="M16.5 5H31L40 14V26.5A8.5 8.5 0 0 1 31.5 35H16.5A8.5 8.5 0 0 1 8 26.5V13.5A8.5 8.5 0 0 1 16.5 5Z" />
          <path className="fold" d="M31 5L40 14H34.5A3.5 3.5 0 0 1 31 10.5Z" />
          <rect className="eye l" x="17.6" y="14.5" width="3.6" height="8.6" rx="1.8" />
          <rect className="eye r" x="26" y="14.5" width="3.6" height="8.6" rx="1.8" />
          <path className="smile" d="M16.8 21q2.6-5 5.2 0M25.2 21q2.6-5 5.2 0" />
          <path className="ln a" d="M15 27.5h18" /><path className="ln b" d="M15 30.8h11" />
        </g>
      </g>
      {HORIZON}
    </svg>
  );
}

/** Each crew member has its own cut of card: Wren a tab, Scout a clipped corner, Juno an arch, Ledger a receipt edge. */
const CUT: Record<AgentId, string> = {
  wren: 'M18 8h12a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7ZM13 12V8.5a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4V12Z',
  scout: 'M18 8h10l9 9v16a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7Z',
  juno: 'M11 21a13 13 0 0 1 26 0v12a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7Z',
  ledger: 'M18 8h12a7 7 0 0 1 7 7v25l-3.25-3-3.25 3-3.25-3-3.25 3-3.25-3-3.25 3-3.25-3L11 40V15a7 7 0 0 1 7-7Z',
};

export function Crew({ who, state = 'idle', size = 32 }: { who: AgentId; state?: MState; size?: number }) {
  return (
    <svg className={`m deck crew st-${state}`} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <g className="all">
        <rect className="tabA" x="14" y="9" width="20" height="14" rx="5" />
        <g className="top">
          <path className="body" d={CUT[who]} />
          <rect className="eye l" x="18.4" y="17" width="3.2" height="7.6" rx="1.6" />
          <rect className="eye r" x="26.2" y="17" width="3.2" height="7.6" rx="1.6" />
          <path className="smile" d="M17.6 23q2.4-4.6 4.8 0M25.4 23q2.4-4.6 4.8 0" />
          <path className="ln a" d="M16 29h16" /><path className="ln b" d="M16 32.2h9" />
        </g>
      </g>
      {HORIZON}
    </svg>
  );
}
