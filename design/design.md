# Design: Later

The locked system for Later's interface. Every Hallmark run reads this first, and production code in `apps/web` follows it. Change it on purpose; the file is the rule. The reference build is `design/prototype-v2/index.html`, whose `:root` block is the source of truth for every value below.

## System
- Genre: modern-minimal. Shape: app screen (no hero, no fold, no sections).
- Theme: Coral, dealt 2/3 (warm grey paper, cotton stock lit from the left, one coral signal). Axes: light/grotesk-sans/warm. Posture: restrained.
- Signature: the deck. A finite stack of cotton cards; its thickness is what is left, one edge per card behind the top one. The same stack carries Triage and the weekly review.

## Brand
- Character: unhurried, dry, brief, a little wry. Later takes things off your plate and tells you in one plain sentence what it did, then gets out of the way. It never celebrates, nags or sells.
- Wordmark: `later`, lower case, Rethink Sans 600 at -0.04em, after a small mark of a card with two edges beneath it. Ink only; never the signal.
- Voice: second person, past tense for what an agent did, present for what needs you. Numbers and names before adjectives. One sentence where two would do. Examples:
  - End of the deck: "That's the lot. Nothing else needs you until 07:00 tomorrow."
  - After an action: "Archived 14 newsletters. Undo"
  - A quiet group: "Quiet Spaces cost nothing. They speak up when something changes."

## Tokens
```css
:root {
  --color-paper: oklch(97% 0.006 55);   --color-paper-2: oklch(94.5% 0.007 55);  --color-paper-3: oklch(91.5% 0.009 55);
  --color-cotton: oklch(98.8% 0.0045 80);                       /* card stock: deck, triage, approvals, notes */
  --color-ink: oklch(21% 0.012 38);     --color-ink-2: oklch(33% 0.013 40);     --color-muted: oklch(47% 0.013 45);
  --color-rule: oklch(88% 0.009 55);    --color-rule-2: oklch(80% 0.011 55);
  --color-signal: oklch(54% 0.165 29);  --color-signal-hover: oklch(48% 0.155 29);  --color-signal-ink: oklch(98.8% 0.0045 80);
  --color-focus: oklch(54% 0.17 30);
  --font-display: "Rethink Sans", ui-sans-serif, system-ui, sans-serif;  --font-body: var(--font-display);
  --font-outlier: "IBM Plex Mono", ui-monospace, monospace;   /* figures, times, money, file paths only */
  --radius-input: 6px;  --radius-card: 8px;  --radius-stock: 12px;  --radius-pill: 999px;
  --edge-stock: inset 0 1px 0 oklch(100% 0.005 80 / .9), inset 0 -1px 0 oklch(32% 0.03 50 / .07), 0 0 0 .5px oklch(32% 0.03 50 / .24), 0 1px 0 oklch(32% 0.03 50 / .12);
  --cast-stock: 6px 5px 10px -6px oklch(32% 0.03 50 / .3);    /* every shadow falls right: one light, from the left */
}
```
Dark mode redefines the same names (paper oklch 17.5%, cotton 23%, ink 94.5%, signal oklch 71% 0.15 32 with dark signal ink) under `prefers-color-scheme: dark` and `[data-theme="dark"]`. Spacing is the 4px scale as `--space-3xs` (2) to `--space-4xl` (144); every padding, margin and gap on that scale uses its token. Type scale, fixed, about 1.15: 11, 12, 14, 16, 18, 21, 26, 32px; page titles 32px on a phone and 40px on desktop. Weights 400, 500 and 600 only. Body 16px at 1.5.

The faces stand in for the theme's General Sans and Geist Mono, which are not on Google Fonts. Never Bricolage Grotesque, Onest, Geist, Inter, Space Grotesk, Plus Jakarta, DM Sans, Manrope, Sora or Outfit.

## Colour
- Near-monochrome. The signal marks three things and nothing else: the primary action, the current selection, and state that needs you (a count, "Stalled", "Can't be undone", the now line, the settled check).
- Space identity is a 28px glyph square on paper-2 with a hairline; the line icon carries a trace of the Space's hue mixed 62% toward ink. No covers, no coloured fields, no backdrop washes, no glass.
- Agents are shapes (Wren a half-disc, Juno a diamond, Otto a ring), never colours. People are initials on paper-3.

## Depth
Depth explains the stack and nothing else. Cotton stock with `--edge-stock` and `--cast-stock` is for cards a person decides: deck cards, triage and review cards, approvals, the capture note, card previews and the sheet. Everything else is flat paper divided by 1px rules. One containment layer: no box inside a card.

## Controls
- Primary: signal fill, signal ink, 8px radius, 40px (32px small) with a 44px hit area; hover darkens, press moves 1px down. One per card or screen.
- Secondary: 1px rule-2 outline, ink text, same radius and height. Text buttons for quiet actions.
- Disabled: paper-2 fill, muted ink, not-allowed cursor, and the `disabled` attribute. Never opacity alone.
- Inputs: 44px, 6px radius, 1px muted border on cotton, 2px focus ring. Focus rings appear instantly.
- A choice of two or three (lenses, Clean or Raw) is a groove pressed into paper with a cotton card in it. Filters, tones, reply intents and review options are text options: the chosen one in the signal with a 2px underline.

## Rules
1. No eyebrows and no tracked capitals. Meta goes under its heading in sentence case: "Brief across Spaces, from Wren at 07:00".
2. No middle-dot strings and no arrows glued to labels. Join with commas and full stops.
3. No floating toasts, coach marks, status chips or tag pills. Status is plain text with tabular numerals. Undo is an inline row where the action happened: in the deck's meta line on Today, Triage and the weekly review, and a flat row above the tab bar elsewhere. First-use guidance is one quiet line on the first card.
4. Navigation is ordinary: a plain sidebar on desktop, a flat five-tab bar with a hairline on the phone. Counts are numbers in the signal, not badges.
5. Spaces scan as a list ordered by need: Focus, Needs you, On track, Quiet, one 46px row each (glyph, name, the agent's one-line status, a number only when it needs you). Twelve fit on a phone screen bar one; at thirty, On track and Quiet fold into one row each. Desktop reads the same rows across as a table.
6. Templates are a catalogue: name, one line of what it does, who made it and the monthly estimate ("$4 to $6 a month"). Permissions, routines, budget and card previews live on the template's own screen.
7. Cards are data from `@later/protocol`; nothing here is model-written markup. Every approval shows the exact call it binds to.

## Motion
- Character: calm. `--dur-micro` 120ms for state, `--dur-short` 220ms for entrances, `--dur-long` 420ms for the deck settling; exponential ease-out, no overshoot.
- Fun lives in the deck: cards follow the finger on a critically damped spring (response 400ms), fling by projected momentum, and the stack thins by one edge as each card leaves. Transform and opacity only.
- Under reduced motion everything ends at once and a swipe becomes a fade.

## Exports
The prototype's inline `:root` block is the token file. Tailwind, DTCG or shadcn blocks are added here on request.
