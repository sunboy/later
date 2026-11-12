import './mascot.css';
import type { AgentId } from './spec/types';
type CrewId = Exclude<AgentId, 'keep'>;

/** The Deck (v2): Later's mascot family, drawn from design/mascots/concepts.html; src/mascot.css is a copy of
    design/mascots/mascots.css. Keep is a fanned hand of three portrait cards with a hinged dog-ear and two eye slots;
    each crew member is one card dealt from it.

    This file is the only place the artwork lives. Every screen draws the chief and crew through <Chief> and <Crew>,
    so the drawing can be swapped without touching a screen. The contract is the props: state, size, and for the chief
    `out`, true while a crew card is dealt out (the fan is one card thinner). */
export type MState = 'idle' | 'listening' | 'thinking' | 'working' | 'waiting' | 'done' | 'rest' | 'error';

const HZ = <><path className="horizon" d="M-2 35.5Q24 31.5 50 35.5V50H-2Z" /><path className="hz" d="M5 35Q24 31.8 43 35" /><path className="hz2" d="M12 39.5H36M18 43.5H30" /></>;
const CARD = { x: 12, y: 6, width: 24, height: 33, rx: 3.5 };
const TOP = 'M15.5 6H28L36 14V35.5A3.5 3.5 0 0 1 32.5 39H15.5A3.5 3.5 0 0 1 12 35.5V9.5A3.5 3.5 0 0 1 15.5 6Z';
const Face = ({ y }: { y: number }) => (
  <>
    <rect className="eye l" x="16.6" y={y} width="4" height="8.5" rx="2" />
    <rect className="eye r" x="23.8" y={y} width="4" height="8.5" rx="2" />
    <path className="smile" d={`M16.2 ${y + 6}q2.4-4.6 4.8 0M23.4 ${y + 6}q2.4-4.6 4.8 0`} />
  </>
);
const gap = (size: number) => (size <= 36 ? ({ ['--m-gap' as string]: 3.4 }) : undefined);

export function Chief({ state = 'idle', size = 48, out = false }: { state?: MState; size?: number; out?: boolean }) {
  return (
    <svg className={`m deck chief st-${state} ${out ? 'out' : ''}`} viewBox="0 0 48 48" width={size} height={size} style={gap(size)} aria-hidden="true" focusable="false">
      <g className="all">
        <rect className="card c3" {...CARD} />
        <rect className="card c2" {...CARD} />
        <rect className="tabA" {...CARD} />
        <g className="top">
          <path className="body" d={TOP} />
          <g transform="translate(32 10) rotate(45)"><path className="flap" d="M-5.66 0H5.66L0 5.66Z" /></g>
          <Face y={16} />
          <path className="ln a" d="M16 29.5h16" /><path className="ln b" d="M16 33h10" />
        </g>
      </g>
      {HZ}
    </svg>
  );
}

/** Each crew member has its own cut of card: Wren an index tab, Scout a clipped corner, Juno an arch, Ledger a receipt edge. */
const CUT: Record<CrewId, string> = {
  wren: 'M16.5 10H31.5A3.5 3.5 0 0 1 35 13.5V35.5A3.5 3.5 0 0 1 31.5 39H16.5A3.5 3.5 0 0 1 13 35.5V13.5A3.5 3.5 0 0 1 16.5 10ZM14.5 11V6.5A2 2 0 0 1 16.5 4.5H23A2 2 0 0 1 25 6.5V11Z',
  scout: 'M21 9H31.5A3.5 3.5 0 0 1 35 12.5V35.5A3.5 3.5 0 0 1 31.5 39H16.5A3.5 3.5 0 0 1 13 35.5V17Z',
  juno: 'M13 20A11 11 0 0 1 35 20V35.5A3.5 3.5 0 0 1 31.5 39H16.5A3.5 3.5 0 0 1 13 35.5Z',
  ledger: 'M16.5 9H31.5A3.5 3.5 0 0 1 35 12.5V39.5L32.25 37L29.5 39.5L26.75 37L24 39.5L21.25 37L18.5 39.5L15.75 37L13 39.5V12.5A3.5 3.5 0 0 1 16.5 9Z',
};

export function Crew({ who, state = 'idle', size = 32 }: { who: CrewId; state?: MState; size?: number }) {
  return (
    <svg className={`m deck crew st-${state}`} viewBox="0 0 48 48" width={size} height={size} style={gap(size)} aria-hidden="true" focusable="false">
      <g className="all">
        <rect className="u" x="13" y="9" width="22" height="30" rx="3.5" />
        <g className="top">
          <path className="body" d={CUT[who]} />
          <g transform="translate(0.6 3)"><Face y={16} /></g>
          <path className="ln a" d="M17 30h14" /><path className="ln b" d="M17 33.4h8" />
        </g>
      </g>
      {HZ}
    </svg>
  );
}
