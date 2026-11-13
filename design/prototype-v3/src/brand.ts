/* The brand wordmarks, used as they are from design/brand/src (one source, not a copy):
   <wm-ball> the engraved ball (the brand moment on the title screen) and <wm-horizon> "Below the line" (the everyday mark). */
import './brand-glyphs';
import '../../brand/src/wm-core.js';
import '../../brand/src/wm-ball.js';
import '../../brand/src/wm-horizon.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type WM = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { state?: 'idle' | 'working' | 'done'; variant?: 'lower' | 'upper'; still?: boolean | ''; class?: string };
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements { 'wm-ball': WM; 'wm-horizon': WM }
  }
}
