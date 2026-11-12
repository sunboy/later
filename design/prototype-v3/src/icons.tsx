import type { Glyph } from './data';

const P: Record<string, string> = {
  house: 'M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5M10 19v-5h4v5',
  cake: 'M5 20h14M6 20v-6.5h12V20M6 16.5c2 1.2 4 1.2 6 0s4-1.2 6 0M12 13.5V10M12 7.5c-1 0-1.3-1-1-1.8L12 4l1 1.7c.3.8 0 1.8-1 1.8',
  receipt: 'M6.5 4h11v16l-2.2-1.4L13 20l-2.2-1.4L8.7 20l-2.2-1.4zM9.5 8.5h5M9.5 12h5M9.5 15.5h3',
  plane: 'M3.5 13.5l17-7.5-4 13.5-4.6-4.2-3 2.7v-4.2zM11.9 15.3l8.6-9.3',
  case: 'M4 8.5h16V19H4zM9 8.5V6h6v2.5M4 13h16',
  rocket: 'M12 3.5c3 2 4.3 5.4 3.7 9.5h-7.4C7.7 8.9 9 5.5 12 3.5zM8.4 13l-2.4 3.2 3 .3M15.6 13l2.4 3.2-3 .3M10.5 17.5l1.5 3 1.5-3',
  heart: 'M12 19.5s-7.5-4.4-7.5-9.7A4 4 0 0112 7.6a4 4 0 017.5 2.2c0 5.3-7.5 9.7-7.5 9.7z',
  book: 'M5 5.5c2.5-.8 5-.8 7 .8v13c-2-1.6-4.5-1.6-7-.8zM19 5.5c-2.5-.8-5-.8-7 .8v13c2-1.6 4.5-1.6 7-.8z',
  tray: 'M4 13.5l2.2-8h11.6l2.2 8V19H4zM4 13.5h4.5l1 2.2h5l1-2.2H20',
  laptop: 'M6 6h12v9H6zM3.5 18.5h17',
  coins: 'M9 9.5a5 2.5 0 1010 0 5 2.5 0 10-10 0M9 9.5v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4M5 12.5c0 1.4 2.2 2.5 5 2.5',
  sink: 'M12 4v9.5M8 9.5l4 4 4-4M5 18.5h14',
  rise: 'M12 20v-9.5M8 14.5l4-4 4 4M5 5.5h14',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  check: 'M5.5 12.5l4.2 4.2L18.5 7.5',
  search: 'M10.5 17a6.5 6.5 0 110-13 6.5 6.5 0 010 13zM15.3 15.3L20 20',
  mic: 'M12 14.5a3 3 0 003-3v-5a3 3 0 00-6 0v5a3 3 0 003 3zM6.5 11.5a5.5 5.5 0 0011 0M12 17v3',
  type: 'M5 7V5h14v2M12 5v14M9.5 19h5',
  forward: 'M14 6l6 6-6 6M20 12H9a5 5 0 00-5 5',
  plus: 'M12 5v14M5 12h14',
  today: 'M5 6h14v13H5zM5 10h14M9 4v4M15 4v4',
  spaces: 'M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z',
  templates: 'M6 4.5h12v15H6zM9 8.5h6M9 12h6M9 15.5h3',
  stop: 'M8 8h8v8H8z',
  pause: 'M9 7v10M15 7v10',
  chev: 'M8 14l4-4 4 4',
  undo: 'M9 8L5 12l4 4M5 12h9a5 5 0 010 10',
};

export function Icon({ name, size = 20, stroke = 1.7 }: { name: keyof typeof P | Glyph; size?: number; stroke?: number }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={P[name]} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
